export type LinkCheckerJobData = {
    baseUrl: string;
    jobPreview: {
      discoverCount: number;
      crawlCount: number;
      linkCount: number;
    };
    error?: unknown;
  };

export type LinkCheckerJob = {
  id: number;
  job_type: "link_checker";
  job_status: "pending" | "paused" | "resuming" | "working" | "finished" | "error";
  user_id: number;
  data: LinkCheckerJobData
};

export type LinkCheckerPageCounts = {
  outgoing_links: number
  incoming_links: number
}

export type LinkCheckerPage = {
  id: string
  url: string
  destination_url: string | null
  _count: LinkCheckerPageCounts
}

export type GetLinkCheckerJobDetailResponse = LinkCheckerPage[]

export type LinkCheckerStats = {
  successfulFetches: number;
  fetchErrors: number;
  crawlDuration: number;
  mostIncomingLinks: {
    count: number;
    url: string;
  } | null;
  mostOutgoingLinks: {
    count: number;
    url: string;
  } | null;
};