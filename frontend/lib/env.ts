export function requireEnv(name: string): string {
  const v = process.env[name]
  // During `next build`, modules may be evaluated while env is not set.
  // Return empty string on the server and throw only in the browser/runtime.
  if (!v) {
    if (typeof window !== 'undefined') throw new Error(`Missing env var: ${name}`)
    return ''
  }
  return v
}
