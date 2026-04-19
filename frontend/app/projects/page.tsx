import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";


export const metadata: Metadata = {
  title: "Projects | James McDonald",
  description: "See James McDonald's portfolio projects covering full stack development, marketing automation, website analysis, and data tools."
}

export default function Home() {
	return (
		<div className="space-y-16">
			<section>
				<div className="max-w-6xl mx-auto p-4 flex flex-col md:flex-row">
					<div className="flex-1">
						<h1>Key Projects</h1>
						<p>
							My personal favourites
						</p>
					</div>
					<div className="flex-1"></div>
				</div>
			</section>
			<section className="mt-16">
				<div className="max-w-6xl mx-auto p-4">
					<h2>Personal Tooling Platform</h2>
					<div className="px-4 flex flex-col gap-2 mt-4">
						<p>
							A full-stack web platform for launching and tracking asynchronous tools, 
							with a Next.js frontend, Express API, PostgreSQL database, and Python 
							workers that can run on separate hardware.
						</p>
						<h3>Why build this?</h3>
						<p>
							My current company does not allow us to run code on our computers for 
							security reasons. This website lets me build predefined bots at home and 
							orchestrate them from the internet with clean UI.
						</p>
						<h3>Architecture</h3>
						<ul className="custom-list px-4">
							<li>PostgreSQL as the central source of truth</li>
							<li>
								Next.js handles the frontend, SSR pages and client-side data fetching 
								where appropriate
							</li>
							<li>Express provides an API layer where I can manage views and auth</li>
							<li>Python workers poll for jobs and process them asynchronously</li>
							<li>
								Workers are decoupled from the hosted web app, this allows the site 
								to run light in the cloud and the heavier workloads can run on 
								owned hardware
							</li>
						</ul>
						<div className="flex gap-2 justify-center items-center flex-wrap">
							<Badge>JavaScript</Badge>
							<Badge>TypeScript</Badge>
							<Badge>Python</Badge>
							<Badge>HTML & CSS</Badge>
							<Badge>React</Badge>
							<Badge>Next.js</Badge>
							<Badge>Tailwind</Badge>
							<Badge>Express</Badge>
							<Badge>SQLAlchemy</Badge>
							<Badge>Selenium</Badge>
						</div>
					</div>
				</div>
			</section>
			<section className="mt-16">
				<div className="max-w-6xl mx-auto p-4">
					<h2>Link Checker</h2>
					<div className="px-4 flex flex-col gap-2 mt-4">
						<p>
							My first worker node inside of the above project - this allows people to 
							inspect the link structure of their website
						</p>
						<h3>Why build this?</h3>
						<p>
							With SEO efforts, building a strong internal linking structure is useful 
							for UX and for Google's rankings. Tracking which links work, where they are and 
							how many of them there are is hard so this automates the process.
						</p>
						<h3>Architecture</h3>
						<ul className="custom-list px-4">
							<li>Poll jobs in Postgres</li>
							<li>When there is a new job, claim it and launch the scraping function</li>
							<li>Track pages in one table and the relation of links on another</li>
							<li>Iterate through all pages and you get a representation of the link structure for the entire website</li>
						</ul>
						<div className="flex gap-2 justify-center items-center flex-wrap">
							<Badge>Python</Badge>
							<Badge>SQLAlchemy</Badge>
							<Badge>Selenium</Badge>
						</div>
					</div>
				</div>
			</section>
		</div>
	)
}