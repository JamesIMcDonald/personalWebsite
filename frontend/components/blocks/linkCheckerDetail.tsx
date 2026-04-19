"use client"

import { LinkCheckerJob, LinkCheckerStats } from "@/src/types/link-checker"
import LinkCheckerDetailData from "./linkCheckerDetailData"
import { formatDisplayUrlParts } from "@/src/formatDisplayUrl"

type Props = {
  job: LinkCheckerJob
  stats: LinkCheckerStats
}

export default function LinkCheckerDetail({ job, stats }: Props) {
  const urlData = formatDisplayUrlParts(job.data.baseUrl || "")
  const targetWebsite = urlData.host
  const targetPath = urlData.fullPath

  if (job.job_status === "error") {
    return (
      <div className="mx-auto mt-16 max-w-4xl rounded-2xl border border-red-200 bg-red-50 p-8">
        <h1 className="text-red-700">Sorry, this job failed</h1>

        <div className="mt-4 space-y-3 text-sm text-red-900">
          <p>We couldn&apos;t complete this link check successfully.</p>

          <p>
            This can happen if the target site blocked the crawl, timed out, or
            returned unexpected data.
          </p>

          <p>You can go back and try running the job again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-16">
      <section className="mt-16">
        <div className="mx-auto max-w-6xl p-4">
          <h1>Link Checker Report</h1>

          <div className="flex flex-wrap gap-4 p-4">
            <div>
              Target Website:{" "}
              <a
                href={urlData.full}
                className="link-styled"
                target="_blank"
                rel="noreferrer"
              >
                {targetWebsite}
              </a>
            </div>

            <div>
              Target Path:{" "}
              <a
                href={urlData.full}
                className="link-styled"
                target="_blank"
                rel="noreferrer"
              >
                {targetPath}
              </a>
            </div>
          </div>
        </div>
      </section>

      <LinkCheckerDetailData job={job} stats={stats} />
    </div>
  )
}