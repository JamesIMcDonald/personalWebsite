// this is a place that will map out all of the tool specific components for each tool - this should mean that we can just manage the components from here as opposed to going into each routing file and messing with it

// Import components here


type ToolDefinition = {
  slug: string
  jobType: string
  title: string
  shortDescription: string
  LaunchForm: React.ComponentType<any>
  JobDetail: React.ComponentType<{ jobId: string }>
}


// example first one - this needs to have some components added to it but otherwise pretty good
// This meta data stuff is for the preview cards / form stuff
// slug and jobType may be the same in most cases - depends on how I architect the backend routing vs the db name
export const toolRegistry = {
  "link-checker": {
    slug: "link-checker",
    jobType: "link-checker",
    title: "Link Checker",
    shortDescription: "Scan a site and inspect its internal linking structure.",
    longDescription:
      "Launch a crawl from a base URL and inspect discovered pages and links.",
    LaunchForm: "This would be the form fields needed to successfully launch a job",
    JobDetail: "This would be the job specific data display component",
  },
} as const