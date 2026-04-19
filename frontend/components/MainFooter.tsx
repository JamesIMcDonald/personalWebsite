import Link from "next/link"
import Image from "next/image"

export default function Footer() {
	return (
		<footer className="border-t border-border mt-16">
			<div className="page-container flex flex-col gap-4 py- text-sm md:flex-row md:max-w-6xl md:justify-between">
				<div className="flex items-center gap-2 text-muted-foreground">
					<span>© {new Date().getFullYear()} James McDonald</span>
					<a href="https://www.linkedin.com/in/jamesmcdonald/" target="_blank" rel="noopener noreferrer" aria-label="James McDonald on LinkedIn">
						<Image src="/linkedin-square-icon.webp" alt="LinkedIn" width={18} height={18}/>
					</a>
					<a href="https://github.com/JamesIMcDonald" target="_blank" rel="noopener noreferrer" aria-label="James McDonald on GitHub">
						<Image src="/GitHub_Invertocat_Black.svg" alt="GitHub" width={18} height={18}/>
					</a>
				</div>

				<nav className="flex flex-wrap gap-x-4 gap-y-2">
					<Link href="/tools">Tools</Link>
					<Link href="/about">About</Link>
					<Link href="/contact">Contact</Link>
					<Link href="/privacy">Privacy Policy</Link>
					<Link href="/cookies">Cookie Policy</Link>
					<Link href="/terms">Terms and Conditions</Link>
				</nav>
			</div>
		</footer>
	)
}