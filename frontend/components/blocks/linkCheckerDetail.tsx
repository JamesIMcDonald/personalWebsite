'use client'

import { LinkCheckerJob, LinkCheckerStats } from '@/src/types/link-checker'
import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { apiGet } from '@/src/api'
import LinkCheckerDetailData from './linkCheckerDetailData'
import Link from "next/link"
import { Button } from '@/components/ui/button'
import { formatDisplayUrlParts } from '@/src/formatDisplayUrl'


export default function LinkCheckerDetail() {
    const { jobId } = useParams<{ jobId: string }>()
    const [job, setJob] = useState<LinkCheckerJob | null>(null)
    const [stats, setStats] = useState<LinkCheckerStats | null>(null)

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const urlData = formatDisplayUrlParts(job?.data.baseUrl || '')
    const targetWebsite = urlData.host
    const targetPath = urlData.fullPath

    useEffect(() => {
        async function initialLoad() {
            try {
                setLoading(true)
                setError(null)

                const resJob = await apiGet(`/link-checker/${jobId}`)
                const resStats = await apiGet(`/link-checker/${jobId}/stats`)


                if (!resJob.ok || !resStats.ok) {
                if (resJob.status === 404) {
                    setError("Sorry, we couldn't find this job.")
                } else if (resJob.status === 401) {
                    setError("You are not authorised to view this job.")
                } else {
                    setError(`Request failed: ${resJob.status}`)
                }
                return
                }

                const jobData: LinkCheckerJob = await resJob.json()
                const statsData: LinkCheckerStats = await resStats.json()
                setJob(jobData)
                setStats(statsData)
            } catch (err) {
                console.error(err)
                setError('Something went wrong loading this job.')
            } finally {
                setLoading(false)
            }
        }

        initialLoad()
    }, [jobId])

    if (loading) {
        return (
            <div className="mx-auto mt-16 max-w-6xl p-4">
                <h1>Looking for job...</h1>
                <p>Please wait while we load the job details.</p>
            </div>
        )
    }

    if (error || !job || !stats) {
        return (
            <div className="mx-auto mt-16 max-w-6xl space-y-4 p-4">
                <h1>Sorry we couldn't find this job.</h1>
                <div className='space-y-4 px-4'>
                    <p></p>
                    <div className='flex gap-4'>
                        <Button asChild>
                            <Link href={"/"}>Back to home</Link>
                        </Button>
                        <Button asChild>
                            <Link href={"/tools/link-checker"}>Back one step</Link>
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    if (job.job_status === 'error') {
        return (
        <div className="mx-auto mt-16 max-w-4xl rounded-2xl border border-red-200 bg-red-50 p-8">
            <h1 className="text-red-700">Sorry, this job failed</h1>
            <div className="mt-4 space-y-3 text-sm text-red-900">
                <p>
                    We couldn&apos;t complete this link check successfully.
                </p>
                <p>
                    This can happen if the target site blocked the crawl, timed out, or returned unexpected data.
                </p>
                <p>
                    You can go back and try running the job again.
                </p>
                </div>
        </div>
        )
    }

    return (
        <div className="space-y-16">
        <section className="mt-16">
                <div className="mx-auto max-w-6xl p-4">
                    <h1>Detailed analysis</h1>
                    <div className='p-4 flex flex-wrap gap-4'>
                        <div>Target Website: <a href={targetWebsite} className='link-styled' target='_blank'>{targetWebsite}</a></div>
                        <div>Target Path: <a href={urlData.full} className='link-styled' target='_blank'>{targetPath}</a></div>
                    </div>
                </div>
        </section>

        <LinkCheckerDetailData job={job} stats={stats}/>
        </div>
    )
}