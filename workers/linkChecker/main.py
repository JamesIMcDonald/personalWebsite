from urllib.parse import urlparse, urldefrag
import asyncio
import zendriver as zd

from dbFuncs import (
    checkAndClaimJob,
    updateJobMetadata,
    finishJob,
    insertIntoLinkCheckerLinks,
    insertIntoLinkCheckerPages,
    updateLinkCheckerPagesDestinationOnly,
    getCountOfJobLinks,
    getAllPagesForJob,
    updateJobBaseUrl,
    updateLinkCheckerPagesMAINUrl,
)

def normalize_url(raw_url):
    if not raw_url:
        return None

    raw_url, _ = urldefrag(raw_url)
    parsed = urlparse(raw_url)

    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        return None

    path = parsed.path.rstrip("/")
    normalized = f"{parsed.scheme}://{parsed.netloc}{path}"
    if parsed.query:
        normalized += f"?{parsed.query}"
    return normalized


def is_in_scope(base_url, candidate_url):
    if not base_url or not candidate_url:
        return False

    base = urlparse(base_url)
    candidate = urlparse(candidate_url)

    if base.scheme not in ("http", "https"):
        return False

    if candidate.scheme not in ("http", "https"):
        return False

    if not base.netloc or not candidate.netloc:
        return False

    if base.netloc != candidate.netloc:
        return False

    base_path = base.path.rstrip("/")
    candidate_path = candidate.path.rstrip("/")

    if not base_path:
        return True

    return candidate_path == base_path or candidate_path.startswith(base_path + "/")

def is_probably_file_url(url):
    if not url:
        return False

    path = urlparse(url).path.lower()
    file_exts = (
        ".pdf", ".csv", ".xlsx", ".xls", ".doc", ".docx",
        ".ppt", ".pptx", ".zip", ".rar", ".png", ".jpg",
        ".jpeg", ".webp", ".gif", ".svg", ".xml", ".json", ".txt"
    )
    return path.endswith(file_exts)

async def getLinksFromWebpage(browser, url, retries=2):
    last_error = None

    for attempt in range(retries):
        page = None
        try:
            page = await asyncio.wait_for(browser.get(url), timeout=30)
            # page = await asyncio.wait_for(browser.get(url, new_tab=True), timeout=30)

            try:
                await page.wait_for_ready_state("complete", timeout=10)
            except Exception:
                pass

            await asyncio.sleep(0.5)

            destinationURL = normalize_url(getattr(page, "url", None))

            hrefs = await page.evaluate("""
                Array.from(
                    document.querySelectorAll("a[href]"),
                    a => a.href
                )
            """)

            # print(f"tab url raw: {getattr(page, 'url', None)}")
            # print(f"destinationUrl: {destinationURL!r}")
            # print(f"href count: {len(hrefs or [])}")
            # print(f"first few hrefs: {(hrefs or [])[:10]}")
            # print(f"readyState: {await page.evaluate('document.readyState')}")

            # If this is an HTML page but the DOM scrape came back empty, retry.
            # PDFs are allowed to have zero links.
            if destinationURL is None:
                raise RuntimeError("Missing destination URL after navigation")

            if hrefs is None and not is_probably_file_url(destinationURL):
                raise RuntimeError("Anchor extraction returned None")

            linkList = {}
            for href in hrefs or []:
                href = normalize_url(href)
                if href:
                    linkList[href] = True

            # suspicious empty result on a normal page -> retry once
            if not linkList and destinationURL.startswith("http") and not is_probably_file_url(destinationURL):
                if attempt < retries - 1:
                    continue

            return linkList, destinationURL

        except Exception as e:
            last_error = e
            if attempt == retries - 1:
                raise
        # only use the below code block if we swap to page = await asyncio.wait_for(browser.get(url, new_tab=True), timeout=30)
        # finally:
        #     if page is not None:
        #         try:
        #             await page.close()
        #         except Exception:
        #             pass

    raise last_error

# Need to make it so that if it is resuming it grabs all link_checker_links and link_checker_pages
# we just need the count of links but we need all of the data from pages
def getResumeJobData(jobId):
    # we need to get and set count of links
    resumedLinkCount = getCountOfJobLinks(jobId)

    # we need to get and set urlList, crawlCount and discoverCount
    pageData = getAllPagesForJob(jobId)
    # Key: Url Value: tuple: (Bool, Int)
    resumedCrawlCount = 0
    resumedDiscoverCount = 0
    for entry in pageData:
        resumedDiscoverCount += 1
        if entry[0]:
            resumedCrawlCount += 1
    return [pageData, resumedCrawlCount, resumedDiscoverCount, resumedLinkCount]

# possibly add a check to make sure that we only crawl like the frist 100/1000 pages - dont get stuck on a stupidly massive website
async def main(job):
    baseUrl = job["data"]["baseUrl"].rstrip("/")
    jobId = job["id"]
    # print(baseUrl)
    urlList = {}

    crawlCount = 0
    discoverCount = 0
    linkCount = 0
    jobPaused = False
    # print("Here is the job:")
    # print(job)
    browser = await zd.start(headless=True)

    if job["job_status"] == "resuming":
        # print("Oh damn, we are resuming an old job")
        resumeDataList = getResumeJobData(jobId)
        urlList = resumeDataList[0]
        crawlCount = resumeDataList[1]
        discoverCount = resumeDataList[2]
        linkCount = resumeDataList[3]
    else:
        # print("Starting job from scratch")
        baseUrlEntry = insertIntoLinkCheckerPages(jobId, baseUrl)
        urlList[baseUrl] = (False, baseUrlEntry['id'])

    # print(f"This is the url list when starting a {job[2]} Job")
    # print(urlList)

    def getNextUnchecked(webpageList=urlList):
        return next((k for k, v in webpageList.items() if v[0] is False), None)

    # ---------------------
    # MAIN LOOP STARTS HERE
    # ---------------------
    while True:
        linkToCheck = getNextUnchecked()

        if linkToCheck is None:
            # print('Finished Job')
            break
        # print(f"Scraping {linkToCheck}")
        try:
            # print(f'requesting webpage: {linkToCheck}')
            # linksOnPage.items() = all links from the page - this always goes up
            linksOnPage, destinationUrl = await getLinksFromWebpage(browser, linkToCheck)

            # For the very first page we are scraping if we get redirected to/from www. we want to take it in stride
            # e.g. https://exponential-e.com/ -> https://www.exponential-e.com/ OR https://www.plausible.io -> https://plausible.io
            # need to figure out if it has www. or if it doesn't so we know which way to change it back
            if crawlCount == 0 and destinationUrl != linkToCheck:
                # first page only: allow bare <-> www canonicalisation
                if baseUrl.startswith("https://www."):
                    # example: https://www.plausible.io -> https://plausible.io
                    bareBaseUrl = "https://" + baseUrl[len("https://www."):]
                    if destinationUrl == bareBaseUrl:
                        # Work to do here
                        # print("Accepted redirect from www to bare domain")
                        # Delete the old entry key to new url in urlList
                        oldEntry = urlList.pop(linkToCheck)
                        urlList[destinationUrl] = oldEntry
                        # Update linkToCheck
                        linkToCheck = destinationUrl
                        # Update baseUrl
                        baseUrl = destinationUrl
                        # Update jobs baseUrl in DB
                        updateJobBaseUrl(jobId, destinationUrl)
                        # Update link_Checker_Pages MAIN url NOT destination_url
                        updateLinkCheckerPagesMAINUrl(urlList[linkToCheck][1], destinationUrl)

                else:
                    # example: https://exponential-e.com -> https://www.exponential-e.com
                    wwwBaseUrl = baseUrl.replace("https://", "https://www.", 1)
                    if destinationUrl == wwwBaseUrl:
                        # Work to do here
                        # print("Accepted redirect from bare domain to www")
                        # Delete the old entry key to new url in urlList
                        oldEntry = urlList.pop(linkToCheck)
                        urlList[destinationUrl] = oldEntry
                        # Update linkToCheck
                        linkToCheck = destinationUrl
                        # Update baseUrl
                        baseUrl = destinationUrl
                        # Update jobs baseUrl in DB
                        updateJobBaseUrl(jobId, destinationUrl)
                        # Update link_Checker_Pages MAIN url NOT destination_url
                        updateLinkCheckerPagesMAINUrl(urlList[linkToCheck][1], destinationUrl)

            # Handled if we got redirected now to start actual work
            listOfLinks = linksOnPage.items()
            # print('Processing done')
            # print('Destination URL:')
            # print(destinationUrl)

            # This whole damn tree is if we got redirected - we want to do different things if its in scope / out of scope etc
            if destinationUrl != linkToCheck:
                # print(f"{destinationUrl} != {linkToCheck}")

                if destinationUrl and is_in_scope(baseUrl, destinationUrl):
                    if destinationUrl in urlList:
                        # print('We have already checked the page we were redirected to - therefore all links added just update the table entry for page to check and ignore')
                        result = updateLinkCheckerPagesDestinationOnly(destinationUrl, urlList[linkToCheck][1])
                        urlList[linkToCheck] = (True, result['id'])
                        continue
                    else:
                        # print("Redirected to a new page - update old dest, add new page because it's unchecked")
                        updateLinkCheckerPagesDestinationOnly(destinationUrl, urlList[linkToCheck][1])

                        # mark the original attempted page as checked too
                        urlList[linkToCheck] = (True, urlList[linkToCheck][1])

                        # insert the page we landed on and mark it as checked
                        newPage = insertIntoLinkCheckerPages(jobId, destinationUrl)
                        urlList[destinationUrl] = (True, newPage['id'])
                        updateLinkCheckerPagesDestinationOnly(destinationUrl, newPage['id'])
                        # print(newPage)

                        # print('now adding all links:')
                        for url, boolean in listOfLinks:
                            # print(f"working on {url}")

                            if url in urlList:
                                insertIntoLinkCheckerLinks(jobId, urlList[destinationUrl][1], urlList[url][1])
                                # Update linkCount Variable
                                linkCount += 1
                                continue
                            else:
                                if is_in_scope(baseUrl, url):
                                    newEntry = insertIntoLinkCheckerPages(jobId, url)
                                    urlList[url] = (False, newEntry['id'])
                                    insertIntoLinkCheckerLinks(jobId, urlList[destinationUrl][1], urlList[url][1])
                                    # Update linkCount Variable
                                    linkCount += 1
                                else:
                                    continue
                else:
                    # print("This url isnt inside the baseUrl - we have been redirected out of scope - ignore just update the destination URL")
                    result = updateLinkCheckerPagesDestinationOnly(destinationUrl, urlList[linkToCheck][1])
                    urlList[linkToCheck] = (True, result['id'])

            else:
                # print("We didn't get redirected - starting work")
                result = updateLinkCheckerPagesDestinationOnly(destinationUrl, urlList[destinationUrl][1])
                urlList[destinationUrl] = (True, result['id'])

                for url, boolean in listOfLinks:
                    # print(f"Working on {url}")

                    if url in urlList:
                        # print('Adding into links')
                        insertIntoLinkCheckerLinks(jobId, urlList[destinationUrl][1], urlList[url][1])
                        # Update linkCount Variable
                        linkCount += 1
                        continue
                    else:
                        if is_in_scope(baseUrl, url):
                            # print('logic here - do the add to pages, dict and links')
                            newEntry = insertIntoLinkCheckerPages(jobId, url)
                            urlList[url] = (False, newEntry['id'])
                            insertIntoLinkCheckerLinks(jobId, urlList[destinationUrl][1], urlList[url][1])
                            # Update linkCount Variable
                            linkCount += 1

                        else:
                            continue
            
            # After the job is done uploading data we update the DB here
            # Update crawlCount Variable
            crawlCount = crawlCount + 1

            # Update discoverCount Variable
            discoverCount = len(urlList.items())

        except Exception as e:
            print(f"Error while checking {linkToCheck}: {e}")
            # print(traceback.format_exc())

            errorText = "Error retrieving page"

            try:
                result = updateLinkCheckerPagesDestinationOnly(errorText, urlList[linkToCheck][1])
                urlList[linkToCheck] = (True, result['id'])
            except Exception as db_error:
                # print(f"Failed to write error state for {linkToCheck}: {db_error}")
                # still mark as checked in memory so the worker does not loop forever
                urlList[linkToCheck] = (True, urlList[linkToCheck][1])

            # After the job is done uploading data we update the DB here
            # Update crawlCount Variable
            crawlCount = crawlCount + 1
        
        # this is after the try/catch this is the end of the work for the page
        # print(f'Checking for {linkToCheck} finished')
        # print(f'Update job {jobId} meta - Crawls: {crawlCount}, Pages: {discoverCount}, Links: {linkCount}.')
        updatedJob = updateJobMetadata(jobId, crawlCount, discoverCount, linkCount)
        # Kill the job if it is now paused
        if updatedJob.job_status == "paused":
            # print("job is now paused - killing")
            jobPaused = True
            break

    # Close the browser fully after the job is done
    await browser.stop()
    
    # this is after the whole job is done
    if jobPaused:
        return
    
    # print('Link checking finished')
    finishJob(jobId)
    # need to add some logic here to finish the job if not paused





# This is the actual execution loop

async def workerLoop():
    while True:
        job = checkAndClaimJob()

        if job is not None:
            # print(job)
            print(f'Found job: {job["data"]["baseUrl"]}')

            await main(job)
            print(f'Finished job: {job["data"]["baseUrl"]}')

        await asyncio.sleep(5)


if __name__ == "__main__":
    asyncio.run(workerLoop())