'use client'

import { Button } from "@/components/ui/button"
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
    FieldLegend,
    FieldSeparator,
    FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"
import { apiPost } from "@/src/api"

export default function ContactForm() {
    const [email, setEmail] = useState("")
    const [comments, setComments] = useState("")

    const [createError, setCreateError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [isCreating, setIsCreating] = useState(false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setCreateError(null)
        setSuccessMessage(null)
        setIsCreating(true)

        try {
            const res = await apiPost("/contact", { email, comments })
            const body = await res.json()

            if (res.status === 422) {
                setCreateError(body.error || "Please check your input and try again.")
                return
            }

            if (!res.ok) {
                setCreateError(body.error || "Failed to submit form, please try again.")
                return
            }

            setEmail("")
            setComments("")
            setSuccessMessage("Thanks, your message has been sent.")
        } catch (err) {
            console.error("Error submitting contact form:", err)
            setCreateError("Something went wrong sending your message. Please try again soon.")
        } finally {
            setIsCreating(false)
        }
    }

    function clearMessages() {
        if (createError) setCreateError(null)
        if (successMessage) setSuccessMessage(null)
    }

  return (
    <div className="w-full max-w-md">
        <form className="card space-y-4" onSubmit={handleSubmit}>
            <FieldGroup>
                <FieldSet>
                    <FieldLegend>Submit an enquiry</FieldLegend>
                    <FieldDescription>
                    Enter your email and what you would like to get in contact about and I&apos;ll be sure to get in touch.
                    </FieldDescription>

                    {createError ? (
                    <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {createError}
                    </p>
                    ) : null}

                    {successMessage ? (
                    <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                        {successMessage}
                    </p>
                    ) : null}

                    <Field>
                    <FieldLabel htmlFor="email">Email:</FieldLabel>
                    <Input
                        id="email"
                        placeholder="you@somedomain.com"
                        required
                        type="email"
                        value={email}
                        onChange={(e) => {
                        setEmail(e.target.value)
                        clearMessages()
                        }}
                    />
                    </Field>

                    <Field>
                    <FieldLabel htmlFor="comments">Comments:</FieldLabel>
                    <Textarea
                        id="comments"
                        placeholder="Add any additional comments"
                        className="resize-none"
                        value={comments}
                        onChange={(e) => {
                        setComments(e.target.value)
                        clearMessages()
                        }}
                    />
                    </Field>
                </FieldSet>
                
            <FieldSeparator />

            <Button type="submit" disabled={isCreating}>
                {isCreating ? "Submitting..." : "Submit"}
            </Button>
            </FieldGroup>
        </form>
    </div>
  )
}