import "./globals.css"
import MainHeader from "@/components/MainHeader"
import MainFooter from "@/components/MainFooter"
import { AuthProvider } from "@/src/providers/AuthProvider"
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});


	export default function RootLayout({children,}: {children: React.ReactNode}) {
	return (
		<html lang="en" className={cn("font-sans", inter.variable)}>
		<body className="flex min-h-screen flex-col justify-center">
		<AuthProvider>
			<MainHeader></MainHeader>
			<main className="flex-1 pt-32">
				{children}
			</main>
			<MainFooter></MainFooter>
		</AuthProvider>
		</body>
		</html>
	)
	}
