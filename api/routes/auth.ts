import { Router } from 'express'
import passport from '../google.js'
import jwt, { JwtPayload } from "jsonwebtoken"
import { requireAuth } from "../middleware/requireAuth.js"
import prisma from '../prisma.js'
import crypto from 'crypto'
import { authLimiter } from '../middleware/rateLimit.js'

const router = Router()

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN!
const IS_PROD = process.env.NODE_ENV === "production"
const IS_DEV = process.env.NODE_ENV === "development"

const USE_SECURE_COOKIES = IS_PROD

const ACCESS_COOKIE = USE_SECURE_COOKIES ? "__Secure-access" : "access"
const REFRESH_COOKIE = USE_SECURE_COOKIES ? "__Secure-refresh" : "refresh"

const COOKIE_DOMAIN = IS_PROD ? ".j-mcd.com" : undefined

const ACCESS_TTL_SECONDS = 60 * 10 // 10m
const REFRESH_TTL_SECONDS = 60 * 60 * 24 * 7 // 7d

function signAccessToken(userId: number) {
	return jwt.sign(
		{ sub: userId, typ: "access" },
		process.env.JWT_ACCESS_SECRET!,
		{ expiresIn: ACCESS_TTL_SECONDS }
	)
}

function signRefreshToken(userId: number, jti: string) {
	return jwt.sign(
		{ sub: userId, typ: "refresh", jti },
		process.env.JWT_REFRESH_SECRET!,
		{ expiresIn: REFRESH_TTL_SECONDS }
	)
}

function sha256(value: string) {
	return crypto.createHash("sha256").update(value).digest("hex");
}

function setAuthCookies(res: any, accessToken: string, refreshToken: string) {
    res.cookie(ACCESS_COOKIE, accessToken, {
        httpOnly: true,
        secure: USE_SECURE_COOKIES,
        sameSite: "lax",
        domain: COOKIE_DOMAIN,
        path: "/",
        maxAge: ACCESS_TTL_SECONDS * 1000,
    })

    res.cookie(REFRESH_COOKIE, refreshToken, {
        httpOnly: true,
        secure: USE_SECURE_COOKIES,
        sameSite: "lax",
        domain: COOKIE_DOMAIN,
        path: "/",
        maxAge: REFRESH_TTL_SECONDS * 1000,
    })
}

function clearAuthCookies(res: any) {
    res.clearCookie(ACCESS_COOKIE, {
        httpOnly: true,
        secure: USE_SECURE_COOKIES,
        sameSite: "lax",
        domain: COOKIE_DOMAIN,
        path: "/",
    })

    res.clearCookie(REFRESH_COOKIE, {
        httpOnly: true,
        secure: USE_SECURE_COOKIES,
        sameSite: "lax",
        domain: COOKIE_DOMAIN,
        path: "/",
    })
}

function sanitizeReturnTo(value: unknown) {
	if (typeof value !== "string") return "/"
	if (!value.startsWith("/")) return "/"
	if (value.startsWith("//")) return "/"
	return value
}

// --------------------------
// ACTUAL ROUTING STARTS HERE
// --------------------------

router.get("/google", authLimiter, (req, res, next) => {
	const returnTo = sanitizeReturnTo(req.query.returnTo)

	res.cookie("oauth_return_to", returnTo, {
		httpOnly: true,
		secure: USE_SECURE_COOKIES,
		sameSite: "lax",
        domain: COOKIE_DOMAIN,
		path: "/",
		maxAge: 10 * 60 * 1000,
	})

	passport.authenticate("google", {
		scope: ["profile", "email"],
	})(req, res, next)
})

router.get("/google/callback", passport.authenticate("google", {session: false, failureRedirect: `${FRONTEND_ORIGIN}/auth-failed`,}), async (req, res) => {
        const user = req.user as {
        id: number
        email: string
        username: string | null
        google_id: string
        }

        const jti = crypto.randomUUID()
        const accessToken = signAccessToken(user.id)
        const refreshToken = signRefreshToken(user.id, jti)

        await prisma.refresh_sessions.create({
        data: {
            user_id: user.id,
            jti,
            token_hash: sha256(refreshToken),
            expires_at: new Date(Date.now() + REFRESH_TTL_SECONDS * 1000),
        },
        })

        setAuthCookies(res, accessToken, refreshToken)

        const returnTo = sanitizeReturnTo(req.cookies?.oauth_return_to)
        res.clearCookie("oauth_return_to", {
        httpOnly: true,
        secure: USE_SECURE_COOKIES,
        sameSite: "lax",
        path: "/",
        })

        return res.redirect(302, `${FRONTEND_ORIGIN}${returnTo}`)
    }
)

// POST /refresh
router.post("/refresh", async (req, res) => {
    const raw = req.cookies?.[REFRESH_COOKIE];
    if (!raw) return res.sendStatus(401)

    try {
        const payload = jwt.verify(raw, process.env.JWT_REFRESH_SECRET!) as JwtPayload & {
            sub: number | string,
            typ: string,
            jti: string
        }

        if (payload.typ !== "refresh" || !payload.jti || !payload.sub) {
            return res.sendStatus(401)
        }

        const userId = Number(payload.sub)
        const tokenHash = sha256(raw)

        const session = await prisma.refresh_sessions.findFirst({
            where: {
                user_id: userId,
                jti: payload.jti,
                token_hash: tokenHash,
                revoked_at: null
            }
        })

        if (!session) return res.sendStatus(401)
        if (session.expires_at.getTime() < Date.now()) return res.sendStatus(401)

        await prisma.refresh_sessions.update({
            where: { id: session.id},
            data: { revoked_at: new Date()}
        })

        const newJti = crypto.randomUUID()
        const newAccessToken = signAccessToken(userId)
        const newRefreshToken = signRefreshToken(userId, newJti)

        await prisma.refresh_sessions.create({
            data: {
                user_id: userId,
                jti: newJti,
                token_hash: sha256(newRefreshToken),
                expires_at: new Date(Date.now() + REFRESH_TTL_SECONDS * 1000)
            }
        })

        setAuthCookies(res, newAccessToken, newRefreshToken)
        return res.sendStatus(204)
    } catch {
        return res.sendStatus(401)
    }
})

// POST /logout
router.post('/logout', async (req, res) => {
    const raw = req.cookies?.[REFRESH_COOKIE]

    if (raw) {
        try {
            const payload = jwt.verify(raw, process.env.JWT_REFRESH_SECRET!) as JwtPayload & { jti?: string }

            if (payload.jti) {
                await prisma.refresh_sessions.updateMany({
                    where: { jti: payload.jti, revoked_at: null },
                    data: { revoked_at: new Date() }
                })
            }
        } catch {}
    }

    clearAuthCookies(res)
    return res.sendStatus(204)
})

// This is what protected routes look like - all you need is this requireAuth, don't put next in req/res and then you can access the user id of the person with
// req.auth.sub

router.get('/me', requireAuth, async (req, res) => {
    const user = await prisma.users.findUnique({
        where: {
            id: req.auth.sub
        }
    })
    res.send(user)
})

export default router