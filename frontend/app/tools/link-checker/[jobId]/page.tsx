import LinkCheckerDetail from "@/components/blocks/linkCheckerDetail"
import LinkCheckerDetailPages from "@/components/detailComponents/linkCheckerDetailPages"

import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { cookies } from "next/headers"
import type {
  LinkCheckerJob,
  LinkCheckerStats,
  LinkCheckerPage,
} from "@/src/types/link-checker"

export const metadata: Metadata = {
  title: "Link Checker Report | James McDonald",
  description: "View detailed crawl analysis for a submitted URL, including page paths, link counts, crawl statuses, redirects, and errors.",
}

const PAGE_SIZE = 50

type PageProps = {
  params: Promise<{
    jobId: string
  }>
}

function getApiBaseUrl() {
  const apiBaseUrl =
    process.env.API_BASEURL ?? process.env.NEXT_PUBLIC_API_BASEURL

  if (!apiBaseUrl) {
    throw new Error("API_BASEURL or NEXT_PUBLIC_API_BASEURL is not set")
  }

  return apiBaseUrl.replace(/\/$/, "")
}

async function serverApiGet(path: string) {
  const cookieStore = await cookies()
  const apiBaseUrl = getApiBaseUrl()

  return fetch(`${apiBaseUrl}${path}`, {
    headers: {
      cookie: cookieStore.toString(),
    },
    cache: "no-store",
  })
}

async function getInitialData(jobId: string) {
  const jobRes = await serverApiGet(`/link-checker/${jobId}`)

  if (jobRes.status === 404) {
    notFound()
  }

  if (!jobRes.ok) {
    throw new Error(`Failed to load link checker job: ${jobRes.status}`)
  }

  const job: LinkCheckerJob = await jobRes.json()

  const [statsRes, pagesRes] = await Promise.all([
    serverApiGet(`/link-checker/${jobId}/stats`),
    serverApiGet(`/link-checker/${jobId}/pages/1`),
  ])

  if (!statsRes.ok) {
    throw new Error(`Failed to load link checker stats: ${statsRes.status}`)
  }

  if (!pagesRes.ok) {
    throw new Error(`Failed to load link checker pages: ${pagesRes.status}`)
  }

  const stats: LinkCheckerStats = await statsRes.json()
  const initialPages: LinkCheckerPage[] = await pagesRes.json()

  return {
    job,
    stats,
    initialPages,
    initialHasMore: initialPages.length === PAGE_SIZE,
  }
}

export default async function LinkCheckerDetailPage({ params }: PageProps) {
  const { jobId } = await params

  const { job, stats, initialPages, initialHasMore } = await getInitialData(
    jobId
  )

  return (
    <div className="space-y-16">
      <section>
        <LinkCheckerDetail job={job} stats={stats} />
      </section>

      <section>
        <LinkCheckerDetailPages
          jobId={jobId}
          initialPages={initialPages}
          initialHasMore={initialHasMore}
        />
      </section>
    </div>
  )
}