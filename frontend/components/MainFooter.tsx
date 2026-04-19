import Link from "next/link"
import Image from "next/image"

export default function Footer() {
	return (
		<footer className="mt-16 border-t border-border">
			<div className="page-container flex flex-col gap-6 py-6 text-sm md:max-w-6xl md:flex-row md:items-center md:justify-between">
				<div className="flex items-center gap-2 text-muted-foreground">
					<span>© {new Date().getFullYear()} James McDonald</span>

					<a
						href="https://www.linkedin.com/in/jamesmcdonald/"
						target="_blank"
						rel="noopener noreferrer"
						aria-label="James McDonald on LinkedIn"
					>
						<Image
						src="/linkedin-square-icon.webp"
						alt="LinkedIn"
						width={18}
						height={18}
						/>
					</a>

					<a
						href="https://github.com/JamesIMcDonald"
						target="_blank"
						rel="noopener noreferrer"
						aria-label="James McDonald on GitHub"
					>
						<Image
						src="/GitHub_Invertocat_Black.svg"
						alt="GitHub"
						width={18}
						height={18}
						/>
					</a>
				</div>

				<div className="flex flex-col gap-3 md:items-end">
					<nav className="flex flex-wrap gap-x-4 gap-y-2">
						<Link href="/tools">Tools</Link>
						<Link href="/about">About</Link>
						<Link href="/contact">Contact</Link>
					</nav>

					<nav className="flex flex-wrap gap-x-4 gap-y-2 text-muted-foreground">
						<Link href="/privacy">Privacy Policy</Link>
						<Link href="/cookies">Cookie Policy</Link>
						<Link href="/terms">Terms and Conditions</Link>
					</nav>
				</div>
			</div>
		</footer>
	)
}