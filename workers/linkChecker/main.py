import os
import time
from urllib.parse import urlparse, urldefrag
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.chrome.options import Options

from dbFuncs import (
    checkJobsTable,
    claimJob,
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
    base = urlparse(base_url)
    candidate = urlparse(candidate_url)

    if base.netloc != candidate.netloc:
        return False

    base_path = base.path.rstrip("/")
    candidate_path = candidate.path.rstrip("/")

    if not base_path:
        return True

    return candidate_path == base_path or candidate_path.startswith(base_path + "/")


def getLinksFromWebpage(url, headless=True):
    linkList = {}
    chrome_options = Options()
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    if headless:
        chrome_options.add_argument("--headless=new")

    if os.getenv("DOCKER_PROD") == "1":
        driver = webdriver.Chrome(
            service=ChromeService("/usr/bin/chromedriver"),
            options=chrome_options
        )
    else:
        from webdriver_manager.chrome import ChromeDriverManager
        driver = webdriver.Chrome(
            service=ChromeService(ChromeDriverManager().install()),
            options=chrome_options
        )

    try:
        driver.set_page_load_timeout(30)
        driver.get(url)

        links = driver.find_elements(By.XPATH, "//a[@href]")
        destinationURL = normalize_url(driver.current_url)

        for link in links:
            href = normalize_url(link.get_attribute("href"))
            if not href:
                continue
            linkList[href] = True

        return linkList, destinationURL
    finally:
        driver.quit()

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
def main(job):
    baseUrl = job[4]["baseUrl"].rstrip("/")
    jobId = job[0]
    # print(baseUrl)
    urlList = {}

    crawlCount = 0
    discoverCount = 0
    linkCount = 0
    jobPaused = False
    # print("Here is the job:")
    # print(job)

    if job[2] == "resuming":
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
            linksOnPage, destinationUrl = getLinksFromWebpage(linkToCheck)

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

                if baseUrl in destinationUrl:
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
                                if baseUrl in url:
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
                        if baseUrl in url:
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

    # this is after the whole job is done
    if jobPaused:
        return
    
    # print('Link checking finished')
    finishJob(jobId)
    # need to add some logic here to finish the job if not paused





# This is the actual execution loop

while True:
    # print('looking for job')
    job = checkJobsTable()
    if job != None:
        # This claim job is commented out at so we can test quickly - bring this back in once done.
        # print("here we have found the job:")
        # print(job)
        claimJob(job[0])
        print(f'Found job to check over {job[4]["baseUrl"]}')
        # Job status can be "pending" or "resuming"
        main(job)
        # The job is now done / paused - set it to completed if the status is pending
    time.sleep(5)