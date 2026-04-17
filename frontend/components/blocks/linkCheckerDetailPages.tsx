'use client'

import { useState, useEffect, useRef, useCallback } from "react"
import { useParams } from 'next/navigation'
import { LinkCheckerPage } from "@/src/types/link-checker"
import { apiGet } from "@/src/api"
import { Button } from "@/components/ui/button"
import LinkCheckerPageRow from "../detailComponents/linkCheckerPageRow"

const PAGE_SIZE = 50

export default function LinkCheckerDetailPages(){
    const { jobId } = useParams<{ jobId: string }>()
    const [pages, setPages] = useState<LinkCheckerPage[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)

    const sentinelRef = useRef<HTMLDivElement | null>(null)
    const loadingRef = useRef(false)

    const loadPages = useCallback(async (pageNum: number) => {
        if (loadingRef.current) return
        loadingRef.current = true

        try {
        if (pageNum === 1) {
            setLoading(true)
        } else {
            setLoadingMore(true)
        }

        setError(null)

        const resPages = await apiGet(`/link-checker/${jobId}/pages/${pageNum}`)

        if (!resPages.ok) {
            if (resPages.status === 404) {
            setError("Sorry, we couldn't find these entries.")
            } else if (resPages.status === 401) {
            setError("You are not authorised to view this job.")
            } else {
            setError(`Request failed: ${resPages.status}`)
            }
            return
        }

        const pagesData: LinkCheckerPage[] = await resPages.json()
        if (pageNum === 1) {
            setPages(pagesData)
        } else {
            setPages((prev) => [...prev, ...pagesData])
        }

        setCurrentPage(pageNum)
        setHasMore(pagesData.length === PAGE_SIZE)
        } catch (err) {
        console.error(err)
        setError("Something went wrong loading these entries.")
        } finally {
        loadingRef.current = false
        setLoading(false)
        setLoadingMore(false)
        }
    }, [jobId])

    const loadMore = useCallback(() => {
        if (loading || loadingMore || !hasMore) return
        loadPages(currentPage + 1)
    }, [currentPage, hasMore, loading, loadingMore, loadPages])

    useEffect(() => {
        setPages([])
        setCurrentPage(1)
        setHasMore(true)
        loadPages(1)
    }, [jobId, loadPages])

    useEffect(() => {
        const node = sentinelRef.current
        if (!node || !hasMore) return

        const observer = new IntersectionObserver(
        (entries) => {
            const entry = entries[0]
            if (entry?.isIntersecting) {
            loadMore()
            }
        },
        {
            root: null,
            rootMargin: "200px",
            threshold: 0,
        }
        )

        observer.observe(node)

        return () => observer.disconnect()
    }, [hasMore, loadMore])

    return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
        <h2>Page data:</h2>
        <div className='px-4 flex flex-col gap-4'>
            <div className="flex flex-col items-center gap-3 py-6">
                <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm w-full">
                    <div className="flex flex-wrap w-full items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className="pt-1 text-sm font-semibold text-zinc-500">
                                Item Num
                            </div>
        
                            <div>
                                <p className="break-all text-sm font-medium text-zinc-900">
                                Page Path
                                </p>
                            </div>
                        </div>
        
                        <div className="flex items-center gap-4 flex-wrap justify-center">
                            <div >Status of Crawl</div>
                            <div className="flex flex-col items-center justify-center gap-4">
                                <div className="flex flex-wrap justify-center gap-4">
                                    <Button variant="outline" size="sm" disabled className="justify-between">
                                        Incoming Links
                                    </Button>
                
                                    <Button variant="outline" size="sm" disabled className="justify-between">
                                        Outgoing Links
                                    </Button>
                                </div>
                                <div className="text-muted-foreground">Click to expand these</div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
            {pages.map((page, index) => (
                <LinkCheckerPageRow
                key={page.id}
                index={index + 1}
                page={page}
                />
            ))}
        </div>

    </div>
    )
}