import type { Metadata } from "next";
import Link from "next/link"
import { Button } from "@/components/ui/button"


export const metadata: Metadata = {
  title: "James McDonald | Full Stack Developer & Marketing Tools",
  description: "Portfolio of James McDonald, a full stack developer building practical web tools for marketers, automation, and website analysis."
}

export default function HomePage() {
	return (
		<div className="space-y-16">
        <section>
			<div className="max-w-6xl mx-auto flex">
				<div className="flex flex-col md:flex-1 gap-4 p-4">
					<div>
						<h1>Hi, I&apos;m James McDonald.</h1>
						<p>Full stack developer with a background in digital marketing.</p>
					</div>

					<p className="px-4">I build practical tools that help marketers automate repetitive work, inspect websites, and get useful data faster. This site serves as both my portfolio and a home for the tools.</p>

					<div className="">
						<div className="flex mx-auto w-fit gap-4">
							<Button asChild variant="default">
								<Link href="/tools">Browse tools</Link>
							</Button>
							<Button asChild>
								<Link href="/about">About me</Link>
							</Button>
						</div>
					</div>
				</div>
				{/* This is just used for spacing reasons */}
				<div className="md:flex-1"></div>
			</div>
        </section>
		<section>
			<div className="max-w-6xl mx-auto px-4">
				<h2>What I&apos;ve built</h2>
				<div className="flex p-4 gap-4 justify-center flex-wrap">
					<div className="card flex-1 flex flex-col gap-2 justify-between min-w-48">
						<div>
							<h3>Link Checker</h3>
							<p>Start from a URL and map the pages beneath it, then explore the internal links between them.</p>
						</div>
						<Button asChild variant="secondary"><Link href="/tools/link-checker">Learn more</Link></Button>
					</div>
					<div className="card flex-1 flex flex-col gap-2 justify-between min-w-48">
						<div>
							<h3>More tools coming soon</h3>
							<p>I&apos;m building more focused tools for website analysis, automation, and useful data collection.</p>
						</div>
						<Button asChild variant="secondary"><Link href="/tools">Learn more</Link></Button>
					</div>
				</div>
			</div>
		</section>
		<section>
			<div className="max-w-6xl mx-auto px-4">
				<h2>How I build</h2>
				<div className="flex flex-col p-4 gap-4">
					<p>
						I build with a Next.js frontend, an Express API, and background workers that process jobs asynchronously. 
						That setup lets me create custom interfaces on the frontend while keeping the heavier processing in the 
						backend.
					</p>
					<p>
						I&apos;m especially interested in automation, web data, and building
						software that is genuinely useful day to day.
					</p>
				</div>
				<div className="flex flex-col p-4 gap-4">
					<h3>Languages, Tools & Frameworks</h3>
					<ul className="flex px-4 gap-4 justify-center md:justify-start flex-wrap">
						<li className="p-2 card min-w-48">
							<h4 className="font-bold">JavaScript/TypeScript</h4>
							<ul className="p-4 space-y-2 custom-list">
								<li>Next</li>
								<li>React</li>
								<li>Prisma</li>
								<li>Express</li>
								<li>Passport</li>
							</ul>
						</li>

						<li className="p-2 card min-w-48">
							<h4 className="font-bold">Python</h4>
							<ul className="space-y-2 p-4 custom-list">
								<li>Selenium</li>
								<li>SQLAlchemy</li>
							</ul>
						</li>

						<li className="p-2 card min-w-48">
							<h4 className="font-bold">Technologies</h4>
							<ul className="space-y-2 p-4 custom-list">
								<li>SQL</li>
								<li>MongoDB</li>
								<li>Docker</li>
							</ul>
						</li>
					</ul>
				</div>
			</div>
		</section>
		</div>
	)
}
