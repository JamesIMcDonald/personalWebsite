"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { useRouter } from "next/navigation"
import { apiGet, apiPost } from "@/src/api"
import type { AuthState, AuthUser } from "@/src/types/auth"

type AuthContextValue = {
  auth: AuthState
  reloadAuth: () => Promise<void>
  logout: () => Promise<void>
  setLoggedInUser: (user: AuthUser) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({
    status: "loading",
    user: null,
  })

  const router = useRouter()

  const reloadAuth = useCallback(async () => {
    try {
      const meRes = await apiGet("/auth/me")

      if (!meRes.ok) {
        setAuth({ status: "logged-out", user: null })
        return
      }

      const user: AuthUser = await meRes.json()
      setAuth({ status: "logged-in", user })
    } catch {
      setAuth({ status: "logged-out", user: null })
    }
  }, [])

  useEffect(() => {
    void reloadAuth()
  }, [reloadAuth])

  const logout = useCallback(async () => {
    try {
      await apiPost("/auth/logout")
    } finally {
      setAuth({ status: "logged-out", user: null })
    }
  }, [router])

  const setLoggedInUser = useCallback((user: AuthUser) => {
    setAuth({ status: "logged-in", user })
  }, [])

  const value = useMemo(
    () => ({
      auth,
      reloadAuth,
      logout,
      setLoggedInUser,
    }),
    [auth, reloadAuth, logout, setLoggedInUser]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)

  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider")
  }

  return ctx
}