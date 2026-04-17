type FormatDisplayUrlPartsOptions = {
    removeWww?: boolean
    maxPathSegments?: number
    keepQuery?: boolean
    maxTotalLength?: number
}

type FormattedUrlParts = {
    full: string
    host: string
    path: string
    fullPath: string
    display: string
}

export function formatDisplayUrlParts(
    rawUrl: string,
    {
        removeWww = true,
        maxPathSegments = 2,
        keepQuery = true,
        maxTotalLength = 80,
    }: FormatDisplayUrlPartsOptions = {}
    ): FormattedUrlParts {
    try {
        const url = new URL(rawUrl)

        let host = url.hostname
        if (removeWww && host.startsWith("www.")) {
        host = host.slice(4)
        }

        const fullPath = `${url.pathname || "/"}${keepQuery ? url.search : ""}`
        
        const pathSegments = url.pathname.split("/").filter(Boolean)
        let path = ""

        if (pathSegments.length > 0) {
        const shown = pathSegments.slice(0, maxPathSegments)
        path = "/" + shown.join("/")

        if (pathSegments.length > maxPathSegments) {
            path += "/..."
        }
        }

        if (keepQuery && url.search) {
        path += url.search
        }

        let display = `${host}${path}`

        if (display.length > maxTotalLength) {
        const remaining = Math.max(0, maxTotalLength - host.length - 3)
        const shortenedPath =
            path.length > remaining ? path.slice(0, Math.max(0, remaining - 3)) + "..." : path
        display = `${host}${shortenedPath}`
        }

        return {
        full: rawUrl,
        host,
        path,
        fullPath,
        display,
        }
    } catch {
        return {
        full: rawUrl,
        host: rawUrl,
        path: "",
        fullPath: "",
        display: rawUrl,
        }
    }
}