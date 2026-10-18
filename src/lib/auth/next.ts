/** Only allow same-origin relative redirects. */
export function safeNext(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return null;
  return value;
}

export function destinationFor(user: { onboarded: boolean }, next: string | null) {
  if (!user.onboarded) return "/onboarding";
  return next ?? "/dashboard";
}
