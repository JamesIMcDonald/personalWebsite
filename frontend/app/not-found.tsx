import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-4 text-center">
      <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        404
      </p>

      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        Page not found
      </h1>

      <p className="mt-4 max-w-xl text-muted-foreground">
        Sorry, that page does not exist or may have been moved.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/">Go home</Link>
        </Button>

        <Button asChild variant="outline">
          <Link href="/tools">View tools</Link>
        </Button>
      </div>
    </main>
  )
}