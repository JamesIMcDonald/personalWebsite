"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LinkCheckerPage } from "@/src/types/link-checker";
import { apiGet } from "@/src/api";
import { formatDisplayUrlParts } from "@/src/formatDisplayUrl";

type Props = {
  index: number;
  page: LinkCheckerPage;
};

type DerivedStatus = "pending" | "success" | "redirected" | "error";

type PageLinkItem = {
  id: string;
  url: string;
};

const PAGE_SIZE = 50;

function getDerivedStatus(
  url: string,
  destinationUrl: string | null
): DerivedStatus {
  if (!destinationUrl) return "pending";
  if (destinationUrl === "Error retrieving page") return "error";
  if (destinationUrl === url) return "success";
  return "redirected";
}

function StatusBadge({
  status,
}: {
  status: DerivedStatus;
}) {
  if (status === "success") {
    return (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
        Success
      </Badge>
    );
  }

  if (status === "redirected") {
    return (
      <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
        Redirected
      </Badge>
    );
  }

  if (status === "error") {
    return (
      <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
        Error
      </Badge>
    );
  }

  return <Badge variant="secondary">Not scraped</Badge>;
}

export default function LinkCheckerPageRow({ index, page }: Props) {
    const [openPanel, setOpenPanel] = useState<"incoming" | "outgoing" | null>(null);

    const [incomingLinks, setIncomingLinks] = useState<PageLinkItem[]>([]);
    const [outgoingLinks, setOutgoingLinks] = useState<PageLinkItem[]>([]);

    const [incomingLoading, setIncomingLoading] = useState(false);
    const [outgoingLoading, setOutgoingLoading] = useState(false);

    const [incomingError, setIncomingError] = useState<string | null>(null);
    const [outgoingError, setOutgoingError] = useState<string | null>(null);

    const [incomingPageNum, setIncomingPageNum] = useState(0);
    const [outgoingPageNum, setOutgoingPageNum] = useState(0);

    const [incomingHasMore, setIncomingHasMore] = useState(true);
    const [outgoingHasMore, setOutgoingHasMore] = useState(true);

    const status = useMemo(
        () => getDerivedStatus(page.url, page.destination_url),
        [page.url, page.destination_url]
    );

    const path = useMemo(
        () => formatDisplayUrlParts(page.url).fullPath,
        [page.url]
    );

    const redirectedPath = useMemo(() => {
        if (!page.destination_url || status !== "redirected") return null;
        return formatDisplayUrlParts(page.destination_url).fullPath;
    }, [page.destination_url, status]);

    async function loadLinks(
        direction: "incoming" | "outgoing",
        pageNum: number
    ) {
        const isIncoming = direction === "incoming";

        if (isIncoming) {
            if (incomingLoading) return;
            setIncomingLoading(true);
            setIncomingError(null);
        } else {
            if (outgoingLoading) return;
            setOutgoingLoading(true);
            setOutgoingError(null);
        }

        try {
            const res = await apiGet(`/link-checker/page/${page.id}/${direction}/${pageNum}`);

            if (!res.ok) {
                const message = `Request failed: ${res.status}`;
                if (isIncoming) setIncomingError(message);
                else setOutgoingError(message);
                return;
            }

            const data: PageLinkItem[] = await res.json();

            if (isIncoming) {
                if (pageNum === 1) {
                    setIncomingLinks(data);
                } else {
                    setIncomingLinks((prev) => [...prev, ...data]);
                }

                setIncomingPageNum(pageNum);
                setIncomingHasMore(data.length === PAGE_SIZE);
            } else {
                if (pageNum === 1) {
                    setOutgoingLinks(data);
                } else {
                    setOutgoingLinks((prev) => [...prev, ...data]);
                }

                setOutgoingPageNum(pageNum);
                setOutgoingHasMore(data.length === PAGE_SIZE);
            }
        } catch (err) {
            console.error(err);
            if (isIncoming) setIncomingError("Failed to load incoming links.");
            else setOutgoingError("Failed to load outgoing links.");
        } finally {
            if (isIncoming) setIncomingLoading(false);
            else setOutgoingLoading(false);
        }
    }

    async function handleIncomingToggle() {
        const nextOpen = openPanel === "incoming" ? null : "incoming";
        setOpenPanel(nextOpen);

        if (nextOpen === "incoming" && incomingPageNum === 0) {
            await loadLinks("incoming", 1);
        }
    }

    async function handleOutgoingToggle() {
        const nextOpen = openPanel === "outgoing" ? null : "outgoing";
        setOpenPanel(nextOpen);

        if (nextOpen === "outgoing" && outgoingPageNum === 0) {
            await loadLinks("outgoing", 1);
        }
    }

    async function handleLoadMoreIncoming() {
        if (incomingLoading || !incomingHasMore) return;
            await loadLinks("incoming", incomingPageNum + 1);
    }

    async function handleLoadMoreOutgoing() {
        if (outgoingLoading || !outgoingHasMore) return;
            await loadLinks("outgoing", outgoingPageNum + 1);
    }

    const panelTitle =
        openPanel === "incoming" ? "Incoming paths" : "Outgoing paths";

    const panelLinks =
        openPanel === "incoming" ? incomingLinks : outgoingLinks;

    const panelLoading =
        openPanel === "incoming" ? incomingLoading : outgoingLoading;

    const panelError =
        openPanel === "incoming" ? incomingError : outgoingError;

    const panelHasMore =
        openPanel === "incoming" ? incomingHasMore : outgoingHasMore;

    const handleLoadMore =
        openPanel === "incoming"
        ? handleLoadMoreIncoming
        : handleLoadMoreOutgoing;

  return (
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap w-full items-start justify-center md:justify-between gap-4">
                <div className="flex items-start gap-4">
                    <div className="pt-1 text-sm font-semibold text-zinc-500">
                        {index}
                    </div>

                    <div>
                        <p className="break-all text-sm font-medium text-zinc-900 max-w-2xl line-clamp-3 wrap-break-word">
                        {path}
                        </p>

                        {status === "redirected" && redirectedPath ? (
                        <p className="mt-1 break-all px-4 text-xs text-zinc-500">
                            → {redirectedPath}
                        </p>
                        ) : null}
                    </div>
                </div>

                <div className="flex items-center gap-4 flex-wrap justify-center">
                    <StatusBadge status={status} />
                        
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleIncomingToggle}
                        className="justify-between"
                    >
                        <span>Incoming</span>
                        <span>{page._count.incoming_links}</span>
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleOutgoingToggle}
                        className="justify-between"
                    >
                        <span>Outgoing</span>
                        <span>{page._count.outgoing_links}</span>
                    </Button>
                </div>
            </div>

        {openPanel && (
            <div className="mt-4 rounded-xl border border-zinc-100 bg-zinc-50 p-3">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    {panelTitle}
                </p>

                {panelLoading && panelLinks.length === 0 ? (
                    <p className="text-sm text-zinc-500">Loading...</p>
                ) : panelError ? (
                    <p className="text-sm text-red-600">{panelError}</p>
                ) : panelLinks.length > 0 ? (
                    <>
                    <ul className="space-y-1">
                        {panelLinks.map((item) => (
                        <li key={item.id} className="break-all text-sm text-zinc-700">
                            {formatDisplayUrlParts(item.url).fullPath}
                        </li>
                        ))}
                    </ul>

                    <div className="mt-4 flex justify-center">
                        {panelHasMore ? (
                        <Button
                            variant="outline"
                            onClick={handleLoadMore}
                            disabled={panelLoading}
                        >
                            {panelLoading ? "Loading more..." : "Load more"}
                        </Button>
                        ) : (
                        <p className="text-sm text-zinc-500">All entries loaded.</p>
                        )}
                    </div>
                    </>
                ) : (
                    <p className="text-sm text-zinc-500">No entries found.</p>
                )}
            </div>
        )}
        </div>
    );
}