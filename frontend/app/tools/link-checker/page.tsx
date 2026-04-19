import LinkCheckerComponent from "@/components/blocks/linkCheckerOverview"
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Internal Link Checker | James McDonald",
  description: "Check a website from a starting URL, map discovered pages, and explore incoming and outgoing internal links across the crawl."
}

export default function LinkCheckerOverviewPage(){
	return (
		<div className="space-y-16">
			<section className="mt-16">
				<div className="max-w-6xl mx-auto p-4 flex flex-col md:flex-row">
					<div className="flex-1">
						<h1>Link Checker</h1>
						<p>Enter a URL and this tool will map out all of the pages below it</p>
					</div>
					<div className="flex-1"></div>
				</div>
			</section>
			<section>
				<LinkCheckerComponent></LinkCheckerComponent>
			</section>
			<section>
				<div className="max-w-6xl mx-auto p-4 space-y-4">
					<h2>What this does:</h2>
					<div className="flex gap-2 py-2 px-4 flex-col md:justify-center md:flex-row divide-y divide-muted-foreground md:divide-x md:divide-y-0">
						<div className="flex-1 p-2 w-fit">
							<p>
							This tool asks a bot to go to your website of choice and look for every page under 
							that URL which it can find from other pages. We collect every internal link on a page
							which we can give to you. 
							</p>
						</div>

						<div className="flex-1 p-2 flex md:justify-center">
							<div className="w-fit">
								<h3>Use Cases:</h3>
								<ul className="standard-list px-2">
									<li>Find dead pages</li>
									<li>Find broken links</li>
									<li>Visualise your internal linking</li>
								</ul>
							</div>
						</div>

						<div className="flex-1 p-2 flex md:justify-center">
							<div className="w-fit">
								<h3>Notes:</h3>
								<ul className="standard-list px-2">
									<li>Enter a proper url e.g. https://www.example.com</li>
									<li>This runs asynchronously - set this going and then leave it in the background</li>
									<li>Bigger websites will take longer</li>
								</ul>							
							</div>
						</div>
					</div>

				</div>
			</section>
			<section>
				<div className="max-w-6xl mx-auto p-4 flex flex-col space-y-4">
					<h2>How this operates:</h2>
					<p className="px-4">
						The bot validates then goes to the baseUrl you have specified and collects all of the links on 
						that page which contain your url. It then goes to the first page it found in the links and so on.
						It finishes when it no longer has any new links to check. We can then graph all of the pages on 
						your website!
					</p>
					<h3 className="px-4">What it's built with:</h3>
					<p className="px-4">
						This is built inside of a docker container and can work from anywhere with an internet connection. 
						it has been built this way because it can then be decoupled from the cloud in order to save cost. 
						Inside it is currently running on Python for ease of writing and module quantity. We are using SQLAlchemy 
						and Selenium as our main method - this allows us to render JS websites easily however this may be upgraded 
						to a stealthier approach.
					</p>
				</div>
			</section>
		</div>
	)
}