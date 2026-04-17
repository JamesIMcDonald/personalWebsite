"use client"

import { useCallback, useEffect, useState } from "react"
import { useAuth } from "@/src/providers/AuthProvider"

export type ProtectedResourceState<T> =
  | { status: "loading"; data: null; message: string }
  | { status: "loaded"; data: T }
  | { status: "unauthenticated"; data: null; message: string }
  | { status: "error"; data: null; message: string }

export function useProtectedResource<T>(
  load: () => Promise<Response>,
  loadingMessage = "Loading..."
) {
  const { auth } = useAuth()

  const [state, setState] = useState<ProtectedResourceState<T>>({
    status: "loading",
    data: null,
    message: loadingMessage,
  })

  const run = useCallback(async () => {
    try {
      const res = await load()

      if (!res.ok) {
        if (res.status === 401) {
          setState({
            status: "unauthenticated",
            data: null,
            message: "Please login to continue",
          })
          return
        }

        throw new Error("Failed to load data")
      }

      const data: T = await res.json()

      setState({
        status: "loaded",
        data,
      })
    } catch (e: unknown) {
      setState({
        status: "error",
        data: null,
        message: e instanceof Error ? e.message : "Something went wrong",
      })
    }
  }, [load])

  useEffect(() => {
    if (auth.status === "logged-out") {
      setState({
        status: "unauthenticated",
        data: null,
        message: "Please login to continue",
      })
      return
    }

    void run()
  }, [auth.status, run])

  return [state, setState, run] as const
}