import { LinkCheckerJob, LinkCheckerStats } from '@/src/types/link-checker'
import { useAnimatedNumber } from "@/src/hooks/useAnimatedNumber";
import { formatDuration } from '@/src/formatDuration';
import { formatDisplayUrlParts } from '@/src/formatDisplayUrl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import Link from 'next/link'

type LinkCheckerDetailDataProps = {
	job: LinkCheckerJob;
    stats: LinkCheckerStats;
};

export default function LinkCheckerDetailData({job, stats}: LinkCheckerDetailDataProps){

    const totalPages = job.data.jobPreview.crawlCount
    const animatedTotalPages = useAnimatedNumber(totalPages, 1000)

    const successfulFetches = stats.successfulFetches
    const animatedSuccessfulFetches = useAnimatedNumber(successfulFetches, 1000)

    const fetchErrors = stats.fetchErrors
    const animatedFetchErrors = useAnimatedNumber(fetchErrors, 1000)

    const totalInternalLinks = job.data.jobPreview.linkCount
    const animatedTotalInternalLinks = useAnimatedNumber(totalInternalLinks, 1000)

    const avgLinksPerPage = Number(job.data.jobPreview.linkCount) / Number(job.data.jobPreview.crawlCount)
    const animatedAvgLinksPerPage = useAnimatedNumber(avgLinksPerPage, 1000)

    const crawlDuration = stats.crawlDuration
    const animatedCrawlDuration = useAnimatedNumber(crawlDuration, 1000)
    const formattedCrawlDuration = formatDuration(animatedCrawlDuration)

    const mostIncomingLinks = stats.mostIncomingLinks
    const animatedMostIncomingLinksNum = useAnimatedNumber(stats.mostIncomingLinks?.count || 0)
    const mostIncomingLinksPath = formatDisplayUrlParts(mostIncomingLinks?.url || '').fullPath

    const mostOutgoingLinks = stats.mostOutgoingLinks
    const animatedMostOutgoingLinksNum = useAnimatedNumber(stats.mostOutgoingLinks?.count || 0)
    const mostOutgoingLinksPath = formatDisplayUrlParts(mostOutgoingLinks?.url || '').fullPath

    return (
        <div className="max-w-6xl mx-auto p-4 space-y-4">
            <div className='px-4 flex flex-wrap justify-center gap-4'>
                <div className='stat-box w-fit'>Total Pages: {animatedTotalPages}</div>
                <div className='stat-box w-fit'>Successful Fetches: {animatedSuccessfulFetches}</div>
                <div className='stat-box w-fit'>Fetch Errors: {animatedFetchErrors}</div>
                <div className='stat-box w-fit'>Total Internal Links: {animatedTotalInternalLinks}</div>
                <div className='stat-box w-fit'>Avg Links: {animatedAvgLinksPerPage}</div>
                <div className='stat-box w-fit'>Crawl Duration: {formattedCrawlDuration}</div>                        
            </div>
            <div className='flex flex-wrap justify-center gap-4 px-4'>
                {mostIncomingLinks ? (
                    <Card size='sm' className='w-full max-w-3xs'>
                        <CardHeader className="pb-3">
                            <CardDescription>Most Incoming Links</CardDescription>
                            <CardTitle className="text-3xl">{animatedMostIncomingLinksNum}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Link
                            href={mostIncomingLinks.url}
                            target="_blank"
                            rel="noreferrer"
                            className="link-styled block min-w-0 break-all"
                            title={mostIncomingLinks.url}
                            >
                            {mostIncomingLinksPath}
                            </Link>
                        </CardContent>
                    </Card>
                ) : null}

                {mostOutgoingLinks ? (
                    <Card size='sm' className='w-full max-w-3xs'>
                        <CardHeader className="pb-3">
                            <CardDescription>Most Outgoing Links</CardDescription>
                            <CardTitle className="text-3xl">{animatedMostOutgoingLinksNum}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Link
                            href={mostOutgoingLinks.url}
                            target="_blank"
                            rel="noreferrer"
                            className="link-styled block min-w-0 break-all"
                            title={mostOutgoingLinks.url}
                            >
                            {mostOutgoingLinksPath}
                            </Link>
                        </CardContent>
                    </Card>
                ) : null}
            </div>
        </div>
    )
}