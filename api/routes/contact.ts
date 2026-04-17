import express, { type NextFunction, type Request, type Response } from "express"
import prisma from "../prisma.js"
import { contactLimiter } from "../middleware/rateLimit.js"

const router = express.Router()

const FRONTEND_URL = process.env.FRONTEND_ORIGIN

const MAX_EMAIL_LENGTH = 254
const MIN_COMMENT_LENGTH = 10
const MAX_COMMENT_LENGTH = 2000

type ContactBody = {
    email?: unknown
    comments?: unknown
}

type ErrorResponse = {
    error: string
}

type SuccessResponse = {
    ok: true
    id: number
}

function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function getOriginHost(value: string | undefined): string | null {
    if (!value) return null

    try {
        return new URL(value).host
    } catch {
        return null
    }
}

function isAllowedOrigin(req: Request): boolean {
    if (!FRONTEND_URL) return true

    const allowedHost = getOriginHost(FRONTEND_URL)
    if (!allowedHost) return true

    const originHost = getOriginHost(req.get("origin") ?? undefined)
    const refererHost = getOriginHost(req.get("referer") ?? undefined)

    return originHost === allowedHost || refererHost === allowedHost
}

router.post(
  "/",
  contactLimiter,
  async (
    req: Request<{}, SuccessResponse | ErrorResponse, ContactBody>,
    res: Response<SuccessResponse | ErrorResponse>,
    next: NextFunction
  ): Promise<void> => {
    try {
        if (!isAllowedOrigin(req)) {
            res.status(403).json({ error: "Forbidden origin." })
            return
        }

        const rawEmail = req.body.email
        const rawComments = req.body.comments

        const email =
            typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : ""
        const comments =
            typeof rawComments === "string" ? rawComments.trim() : ""

        if (!email || !comments) {
            res.status(422).json({ error: "Email and comments are required." })
            return
        }

        if (email.length > MAX_EMAIL_LENGTH) {
            res.status(422).json({ error: "Email is too long." })
            return
        }

        if (!isValidEmail(email)) {
            res.status(422).json({ error: "Please provide a valid email address." })
            return
        }

        if (comments.length < MIN_COMMENT_LENGTH) {
            res.status(422).json({
            error: `Comments must be at least ${MIN_COMMENT_LENGTH} characters long.`,
            })
            return
        }

        if (comments.length > MAX_COMMENT_LENGTH) {
            res.status(422).json({
            error: `Comments must be no more than ${MAX_COMMENT_LENGTH} characters long.`,
            })
            return
        }

        const submission = await prisma.contact_submission.create({
            data: {
            email,
            comments,
            },
        })

        res.status(201).json({
            ok: true,
            id: submission.id,
        })
    } catch (err) {
        next(err)
    }
})

export default router