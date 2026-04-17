"use client"

import Link from "next/link"
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
import { Suspense } from "react";

import SignInWithGoogle from "./ui/signInWithGoogle"


export default function MainHeader() {
  const { auth, logout } = useAuth()

  const welcomeText =
    auth.status === "loading"
      ? "Checking session..."
      : auth.status === "logged-in"
      ? `Welcome ${auth.user.username ?? auth.user.email}`
      : "Welcome - please login to use the tools"

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
		<div className="mx-auto flex justify-between w-full max-w-6xl items-center p-4 gap-4">
			<div><Link href="/" className="text-4xl font-bold">JM</Link></div>

			<NavigationMenu>
				<NavigationMenuList>
				<NavigationMenuItem>
					<NavigationMenuTrigger>Tools</NavigationMenuTrigger>
					<NavigationMenuContent>
					{/* This w-40 controls the width of the dropdown container */}
					<ul className="grid w-40 gap-1">
						<li>
						<NavigationMenuLink asChild>
							<Link
							href="/tools/"
							className="block rounded-md p-3 text-sm leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
							>
							All Tools
							</Link>
						</NavigationMenuLink>
						</li>
						<li>
						<NavigationMenuLink asChild>
							<Link
							href="/tools/link-checker"
							className="block rounded-md p-3 text-sm leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
							>
							Link Checker
							</Link>
						</NavigationMenuLink>
						</li>
					</ul>
					</NavigationMenuContent>
				</NavigationMenuItem>

				<NavigationMenuItem>
					<NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
					<Link href="/about">About</Link>
					</NavigationMenuLink>
				</NavigationMenuItem>

				<NavigationMenuItem>
					<NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
					<Link href="/projects">Projects</Link>
					</NavigationMenuLink>
				</NavigationMenuItem>

				<NavigationMenuItem>
					<NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
					<Link href="/contact">Contact</Link>
					</NavigationMenuLink>
				</NavigationMenuItem>
				</NavigationMenuList>
			</NavigationMenu>

			<div className="flex items-center justify-self-end gap-2">
				{auth.status === "logged-in" ? (
				<div className="flex items-center gap-2">
					<span>{welcomeText}</span>
					<Button variant="secondary" onClick={logout}>Logout</Button>
				</div>
				) : (
				<Suspense fallback={<div/>}><SignInWithGoogle/></Suspense>
				)}
			</div>
		</div>
    </header>
  )
}