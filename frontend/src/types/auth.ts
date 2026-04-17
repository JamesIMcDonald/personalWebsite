export type AuthUser = {
  id: number
  email: string
  username: string | null
}

export type AuthState =
  | { status: "loading"; user: null }
  | { status: "logged-in"; user: AuthUser }
  | { status: "logged-out"; user: null }