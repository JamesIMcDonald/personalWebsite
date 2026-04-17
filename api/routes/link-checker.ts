import { Router } from "express"
import { requireAuth } from "../middleware/requireAuth.js"
import prisma from "../prisma.js"
import { validateBaseUrl } from "../src/validation/validateBaseUrl.js"

const router = Router()

const itemsPerPage = 50;


// This will contain all of the routes for the link checker worker


// GET / link checker - will return all/some number of jobs the user owns - the front end server can handle if they don't have any
router.get('/', requireAuth, async (req, res) => {
    const userLinkCheckJobs = await prisma.jobs.findMany({
        where: {
            user_id: req.auth.sub,
            job_type: 'link_checker'
        },
        select: {
            id: true,
            job_type: true,
            job_status: true,
            user_id: true,
            data: true,
        }, orderBy: {
            id: "asc"
        }
    })
    res.json(userLinkCheckJobs)
})

// POST / this will create a link checker job - data needed 
// job_type = "link_checker"
// data = {"base_url": "https://www.whatever.com"} - will need to do validation on this to make sure it is a real url - maybe also be forgiving with https:// & www.
// Requests sent to this NEED a key:value of baseUrl : https://example.com - it needs to have the proper stuff on the front 
router.post('/', requireAuth, async (req, res) => {

    // URL Validation
    const userUrlValidated = validateBaseUrl(req.body.baseUrl)
    if (userUrlValidated.ok === false){
        // Bad url - reject with reason
        res.status(422).json({ error: userUrlValidated.reason })
    } else {
        // Good url - Create the job and send the job object back
        const newLinkCheckerJob = await prisma.jobs.create({
            data: {
                job_type: 'link_checker',
                job_status: 'pending',
                user_id: req.auth.sub,
                data:{
                    "baseUrl": userUrlValidated.url,
                    "jobPreview": {
                        "discoverCount": 1,
                        "crawlCount": 0,
                        "linkCount": 0,
                    }
                }
            }
        })
        res.send(201).json(newLinkCheckerJob)
    }

})

// DELETE /
router.delete('/:jobId', requireAuth, async (req, res) => {
    // make sure the id isn't malformed
    const rawId = req.params.jobId;
    if (typeof rawId !== "string") {
        return res.status(400).json({ error: "Bad request" });
    }
    // Only digits
    if (!/^\d+$/.test(rawId)) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }

    const jobId = Number(rawId);

    // Extra guard for unsafe integers
    if (!Number.isSafeInteger(jobId)) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }

    // make sure they own it
    const job = await prisma.jobs.findFirst({
        where: {
            id: jobId
        }
    })
    if (job === null || job.user_id !== req.auth.sub){
        return res.status(404).json({ error: 'Job not found' })
    }

    // make sure it is a link checker job even if they do own it
    if (job.job_type !== 'link_checker'){
        return res.status(400).json({ error: 'Bad request' })
    }

    // make sure that the status is "paused" || "finished" || "error" - do not want it to delete mid go
    const deleteOnlyIf = new Set(["paused", "finished", "error"]);
    if (!deleteOnlyIf.has(job.job_status)) {
        return res.status(409).json({ error: 'Job must be paused or finished to delete' })
    }

    // Check that it has a baseUrl - this is just done for confirmation at the end
    const jobData = job.data as { baseUrl: string }
    if (!jobData.baseUrl) {
    return res.status(500).json({ error: "Job data missing baseUrl" })
    }

    // delete the thing - jobs, link_checker_pages, link_checker_links
    await prisma.$transaction([
        prisma.link_checker_links.deleteMany({
        where: {
            job_id: jobId,
        },
        }),
        prisma.link_checker_pages.deleteMany({
        where: {
            job_id: jobId,
        },
        }),
        prisma.jobs.delete({
        where: {
            id: jobId,
        },
        }),
    ])

    return res.status(200).send(`DELETE - ${jobData.baseUrl}`)
})

router.get('/:jobId/pause', requireAuth, async (req, res) => {
    // make sure the id isn't malformed
    const rawId = req.params.jobId;
    if (typeof rawId !== "string") {
        return res.status(400).json({ error: "Bad request" });
    }
    // Only digits
    if (!/^\d+$/.test(rawId)) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }

    const jobId = Number(rawId);

    // Extra guard for unsafe integers
    if (!Number.isSafeInteger(jobId)) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }

    // make sure they own it
    const job = await prisma.jobs.findFirst({
        where: {
            id: jobId
        }
    })
    if (job === null || job.user_id !== req.auth.sub){
        return res.status(404).json({ error: 'Job not found' })
    }

    // make sure it is a link checker job even if they do own it
    if (job.job_type !== 'link_checker'){
        return res.status(400).json({ error: 'Bad request' })
    }

    // make sure that the status isn't "pending" || "working" do not want it to pause any job
    const pauseOnlyIf = new Set(["pending", "working"]);
    if (!pauseOnlyIf.has(job.job_status)) {
        return res.status(409).json({ error: 'Job must be pending or working to pause' })
    }

    // Pause the thing and return
    const modifiedJob = await prisma.jobs.update({
        where: {
            id: jobId
        },
        data: {
            job_status: "paused"
        }
    })

    return res.status(200).json(modifiedJob)
})

router.get('/:jobId/resume', requireAuth, async (req, res) => {
    // make sure the id isn't malformed
    const rawId = req.params.jobId;
    if (typeof rawId !== "string") {
        return res.status(400).json({ error: "Bad request" });
    }
    // Only digits
    if (!/^\d+$/.test(rawId)) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }

    const jobId = Number(rawId);

    // Extra guard for unsafe integers
    if (!Number.isSafeInteger(jobId)) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }

    // make sure they own it
    const job = await prisma.jobs.findFirst({
        where: {
            id: jobId
        }
    })
    if (job === null || job.user_id !== req.auth.sub){
        return res.status(404).json({ error: 'Job not found' })
    }

    // make sure it is a link checker job even if they do own it
    if (job.job_type !== 'link_checker'){
        return res.status(400).json({ error: 'Bad request'})
    }

    // make sure that the status is "paused" do not want it to resume any job
    if (job.job_status !== "paused") {
        return res.status(409).json({ error: 'Job must be paused to pause' })
    }

    // Resume the thing and return
    const modifiedJob = await prisma.jobs.update({
        where: {
            id: jobId
        },
        data: {
            job_status: "resuming"
        }
    })

    return res.status(200).json(modifiedJob)
})


// ----------------------------------
// BELOW IS STUFF FOR THE DETAIL PAGE
// ----------------------------------

// GET /:jobId - returns the data from that job
// handle the case where the job is currently running
router.get('/:jobId', requireAuth, async (req, res) => {
    const rawId = req.params.jobId;
    if (typeof rawId !== "string") {
        return res.status(400).json({ error: "Bad request" });
    }
    // Only digits
    if (!/^\d+$/.test(rawId)) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }

    const jobId = Number(rawId);

    // Extra guard for unsafe integers
    if (!Number.isSafeInteger(jobId)) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }

    // Now check ownership of the job here
    const job = await prisma.jobs.findFirst({
        where: {
            id: jobId
        }
    })

    if (job === null || job.user_id !== req.auth.sub){
        return res.status(404).json({ error: 'Job not found' })
    }

    // there needs to be one more check - make sure that the job is actually a link_checker job
    if (job.job_type !== 'link_checker'){
        return res.status(400).json({ error: 'Bad request'})
    }

    // beyond all odds they have actually passed the auth tests - lets retrieve the job

    return res.json(job);
});

// GET /:jobId/stats - returns the overview stats for those pages
// possibly handle the case where the job is currently running
router.get('/:jobId/stats', requireAuth, async (req, res) => {
    const rawJobId = req.params.jobId;

    if (typeof rawJobId !== "string") {
        return res.status(400).json({ error: "Bad request" });
    }
    // Only digits
    if (!/^\d+$/.test(rawJobId)) {
        return res.status(400).json({ error: 'Invalid number format' });
    }

    const jobId = Number(rawJobId);

    // Extra guard for unsafe integers
    if (!Number.isSafeInteger(jobId)) {
        return res.status(400).json({ error: 'Invalid number format' });
    }

    // Now check ownership of the job here
    const job = await prisma.jobs.findFirst({
        where: {
            id: jobId
        }
    })

    if (job === null || job.user_id !== req.auth.sub){
        return res.status(404).json({ error: 'Job not found' })
    }

    // there needs to be one more check - make sure that the job is actually a link_checker job
    if (job.job_type !== 'link_checker'){
        return res.status(400).json({ error: 'Bad request - wrong endpoint idiot.'})
    }

    // Beyond all odds they have actually passed the auth tests - Lets grab the stats we need
    // Get all successful fetches, all fetch errors, avgOutgoingLinks, avgIncomingLinks & crawlDuration
    const ERROR_TEXT = "Error retrieving page";
    const [
        successfulFetches,
        fetchErrors,
        timeBounds,
        mostIncomingGroup,
        mostOutgoingGroup,
    ] = await Promise.all([
        prisma.link_checker_pages.count({
            where: {
                job_id: jobId,
                fetched_at: { not: null },
                destination_url: { not: null },
                NOT: {
                destination_url: ERROR_TEXT,
                },
            },
        }),

        prisma.link_checker_pages.count({
            where: {
                job_id: jobId,
                destination_url: ERROR_TEXT,
            },
        }),

        prisma.link_checker_pages.aggregate({
            where: {
                job_id: jobId,
                fetched_at: { not: null },
            },
            _min: {
                fetched_at: true,
            },
            _max: {
                fetched_at: true,
            },
        }),

        prisma.link_checker_links.groupBy({
            by: ["to_url_id"],
            where: {
                job_id: jobId,
            },
            _count: {
                to_url_id: true,
            },
            orderBy: {
                _count: {
                to_url_id: "desc",
                },
            },
            take: 1,
        }),

        prisma.link_checker_links.groupBy({
            by: ["from_url_id"],
            where: {
                job_id: jobId,
            },
            _count: {
                from_url_id: true,
            },
            orderBy: {
                _count: {
                from_url_id: "desc",
                },
            },
            take: 1,
        }),
    ]);

    const mostIncomingId = mostIncomingGroup[0]?.to_url_id ?? null;
    const mostOutgoingId = mostOutgoingGroup[0]?.from_url_id ?? null;

    const [mostIncomingPage, mostOutgoingPage] = await Promise.all([
        mostIncomingId
        ? prisma.link_checker_pages.findFirst({
            where: {
                job_id: jobId,
                id: mostIncomingId,
            },
            select: {
                url: true,
            },
            })
        : null,

        mostOutgoingId
        ? prisma.link_checker_pages.findFirst({
            where: {
                job_id: jobId,
                id: mostOutgoingId,
            },
            select: {
                url: true,
            },
            })
        : null,
    ]);

    const minFetchedAt = timeBounds._min.fetched_at;
    const maxFetchedAt = timeBounds._max.fetched_at;

    const crawlDuration = minFetchedAt && maxFetchedAt ? Math.max( 0, Math.floor((maxFetchedAt.getTime() - minFetchedAt.getTime()) / 1000)) : 0;

    return res.json({
        successfulFetches,
        fetchErrors,
        crawlDuration,
        mostIncomingLinks: mostIncomingPage
            ? {
                count: mostIncomingGroup[0]._count.to_url_id,
                url: mostIncomingPage.url,
                }
            : null,
        mostOutgoingLinks: mostOutgoingPage
            ? {
                count: mostOutgoingGroup[0]._count.from_url_id,
                url: mostOutgoingPage.url,
                }
            : null,
    });
});

// GET /:jobId/pages/:pageNum - pagination on the pages data - usually too massive for 1 transaction
// possibly handle the case where the job is currently running
router.get('/:jobId/pages/:pageNum', requireAuth, async (req, res) => {
    const rawJobId = req.params.jobId;
    const rawPageNum = req.params.pageNum;

    if (typeof rawJobId !== "string" || typeof rawPageNum !== "string") {
        return res.status(400).json({ error: "Bad request" });
    }
    // Only digits
    if (!/^\d+$/.test(rawJobId) || !/^\d+$/.test(rawPageNum)) {
        return res.status(400).json({ error: 'Invalid number format' });
    }

    const jobId = Number(rawJobId);
    const pageNum = Number(rawPageNum);
    const skipNumber = (itemsPerPage * pageNum) - itemsPerPage

    // Extra guard for unsafe integers
    if (!Number.isSafeInteger(jobId) || !Number.isSafeInteger(pageNum) ) {
        return res.status(400).json({ error: 'Invalid number format' });
    }

    // Now check ownership of the job here
    const job = await prisma.jobs.findFirst({
        where: {
            id: jobId
        }
    })

    if (job === null || job.user_id !== req.auth.sub){
        return res.status(404).json({ error: 'Job not found' })
    }

    // there needs to be one more check - make sure that the job is actually a link_checker job
    if (job.job_type !== 'link_checker'){
        return res.status(400).json({ error: 'Bad request - wrong endpoint idiot.'})
    }

    // beyond all odds they have actually passed the auth tests - lets retrieve the pages checked and also give them something cool - a number of how many internal links each page has
    const pages = await prisma.link_checker_pages.findMany({
    where: {
        job_id: jobId,
    },
    select: {
        id: true,
        job_id: true,
        url: true,
        fetched_at: true,
        destination_url: true,
        _count: {
            select: {
                outgoing_links: true,
                incoming_links: true,
            },
        },
    },
    orderBy: {
        id: "asc",
    },
    skip: skipNumber,
    take: itemsPerPage,
    })

    return res.json(pages);
});

// Getting the incoming or outgoing links for a given page
router.get('/page/:pageId/:linkDirection/:pageNum', requireAuth, async (req, res) => {
    const rawPageId = req.params.pageId;
    const rawPageNum = req.params.pageNum;
    const linkDirection = req.params.linkDirection

    // validate link direction
    if (typeof linkDirection !== "string" || (linkDirection !== "incoming" && linkDirection !== "outgoing")) {
        return res.status(400).json({ error: "Bad request" });
    }

    if (typeof rawPageId !== "string" || typeof rawPageNum !== "string") {
        return res.status(400).json({ error: "Bad request" });
    }
    // Only digits
    if (!/^\d+$/.test(rawPageId) || !/^\d+$/.test(rawPageNum)) {
        return res.status(400).json({ error: 'Invalid number format' });
    }

    const pageId = BigInt(rawPageId);
    const pageNum = Number(rawPageNum);

    // now we need to get the job:
    // get the page first
    const page = await prisma.link_checker_pages.findFirst({
        where: {id: pageId}
    })

    if (!page || !page.job_id) {
        return res.status(404).json({ error: 'Not found' })
    }

    const job = await prisma.jobs.findFirst({
        where: {id: page.job_id}
    })
    
    if (job === null || job.user_id !== req.auth.sub){
        return res.status(404).json({ error: 'Job not found' })
    }

    const skipNumber = (itemsPerPage * pageNum) - itemsPerPage
    let links;

    if (linkDirection === "incoming") {
        links = await prisma.link_checker_links.findMany({
            where: {
            job_id: page.job_id,
            to_url_id: pageId,
            },
            select: {
            id: true,
            from_page: {
                select: {
                id: true,
                url: true,
                },
            },
            },
            orderBy: {
            id: "asc",
            },
            skip: skipNumber,
            take: itemsPerPage,
        });

        return res.json(
            links.map((link) => ({
            id: link.from_page.id.toString(),
            url: link.from_page.url,
            }))
        );
    } else {
        links = await prisma.link_checker_links.findMany({
            where: {
            job_id: page.job_id,
            from_url_id: pageId,
            },
            select: {
            id: true,
            to_page: {
                select: {
                id: true,
                url: true,
                },
            },
            },
            orderBy: {
            id: "asc",
            },
            skip: skipNumber,
            take: itemsPerPage,
        });

        return res.json(
            links.map((link) => ({
            id: link.to_page.id.toString(),
            url: link.to_page.url,
            }))
        );
    }
});


export default router