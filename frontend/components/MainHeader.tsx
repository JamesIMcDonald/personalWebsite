"use client"

import Link from "next/link"
import { Suspense, useState } from "react"
import { useAuth } from "@/src/providers/AuthProvider"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { Button } from "@/components/ui/button"

import SignInWithGoogle from "./ui/signInWithGoogle"

const tools = [
  { href: "/tools/", label: "All Tools" },
  { href: "/tools/link-checker", label: "Link Checker" },
]

const navItems = [
  { href: "/about", label: "About" },
  { href: "/projects", label: "Projects" },
  { href: "/contact", label: "Contact" },
]

export default function MainHeader() {
	const { auth, logout } = useAuth()
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

	const welcomeText =
		auth.status === "loading"
		? "Checking session..."
		: auth.status === "logged-in"
		? `Welcome ${auth.user.username ?? auth.user.email}`
		: "Welcome - please login to use the tools"

	const closeMobileMenu = () => setMobileMenuOpen(false)

	return (
		<header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
			<div className="mx-auto w-full max-w-6xl px-4">
				<div className="flex h-16 items-center justify-between gap-4">
				<Link href="/" className="shrink-0 text-3xl font-bold sm:text-4xl">
					JM
				</Link>

				{/* Desktop nav */}
				<div className="hidden md:block">
					<NavigationMenu>
					<NavigationMenuList>
						<NavigationMenuItem>
						<NavigationMenuTrigger>Tools</NavigationMenuTrigger>

						<NavigationMenuContent>
							<ul className="grid w-44 gap-1 p-2">
							{tools.map((tool) => (
								<li key={tool.href}>
								<NavigationMenuLink asChild>
									<Link
									href={tool.href}
									className="block rounded-md p-3 text-sm leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
									>
									{tool.label}
									</Link>
								</NavigationMenuLink>
								</li>
							))}
							</ul>
						</NavigationMenuContent>
						</NavigationMenuItem>

						{navItems.map((item) => (
						<NavigationMenuItem key={item.href}>
							<NavigationMenuLink
							asChild
							className={navigationMenuTriggerStyle()}
							>
							<Link href={item.href}>{item.label}</Link>
							</NavigationMenuLink>
						</NavigationMenuItem>
						))}
					</NavigationMenuList>
					</NavigationMenu>
				</div>

				{/* Desktop auth */}
				<div className="hidden min-w-0 items-center justify-end gap-2 md:flex">
					{auth.status === "logged-in" ? (
					<>
						<span className="max-w-52 truncate text-sm text-muted-foreground lg:max-w-72">
						{welcomeText}
						</span>
						<Button variant="secondary" onClick={logout}>
						Logout
						</Button>
					</>
					) : (
					<Suspense fallback={<div />}>
						<SignInWithGoogle />
					</Suspense>
					)}
				</div>

				{/* Mobile hamburger */}
				<Button
					variant="ghost"
					size="sm"
					className="md:hidden"
					onClick={() => setMobileMenuOpen((open) => !open)}
					aria-expanded={mobileMenuOpen}
					aria-label="Toggle navigation menu"
				>
					<span className="text-2xl leading-none">
					{mobileMenuOpen ? "×" : "☰"}
					</span>
				</Button>
				</div>

				{/* Mobile menu */}
				{mobileMenuOpen && (
				<div className="border-t border-border py-4 md:hidden">
					<nav className="flex flex-col gap-1">
					<details className="group rounded-md">
						<summary className="cursor-pointer list-none rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
						Tools
						</summary>

						<div className="mt-1 flex flex-col gap-1 pl-3">
						{tools.map((tool) => (
							<Link
							key={tool.href}
							href={tool.href}
							onClick={closeMobileMenu}
							className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
							>
							{tool.label}
							</Link>
						))}
						</div>
					</details>

					{navItems.map((item) => (
						<Link
						key={item.href}
						href={item.href}
						onClick={closeMobileMenu}
						className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
						>
						{item.label}
						</Link>
					))}
					</nav>

					<div className="mt-4 border-t border-border pt-4">
					{auth.status === "logged-in" ? (
						<div className="flex flex-col gap-3">
						<span className="truncate px-3 text-sm text-muted-foreground">
							{welcomeText}
						</span>

						<Button
							variant="secondary"
							onClick={() => {
							logout()
							closeMobileMenu()
							}}
							className="w-full"
						>
							Logout
						</Button>
						</div>
					) : (
						<Suspense fallback={<div />}>
							<div>
							<SignInWithGoogle />
							</div>

						</Suspense>
					)}
					</div>
				</div>
				)}
			</div>
		</header>
	)
}