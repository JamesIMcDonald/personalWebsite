import Link from "next/link"

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <h1>Terms and Conditions</h1>

      <p>
        Last updated: 19 April 2026
      </p>

      <div className="p-4">
        <Link
          href="/legal/Terms and Conditions.pdf"
          className="underline"
          target="_blank"
        >
          View or download the PDF version
        </Link>
      </div>

      {/* Ideally paste the actual terms content here as HTML/markdown */}
    </main>
  )
}