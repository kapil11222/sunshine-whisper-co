import { toast } from "sonner";

/**
 * Convert any thrown error into a polished, customer-facing message.
 * Hides stack traces, raw SQL/Zod errors, network jargon, etc.
 */
export function friendlyError(e: unknown, fallback = "Something went wrong. Please try again."): string {
  const raw = (e as any)?.message ?? (typeof e === "string" ? e : "");
  const msg = String(raw).trim();
  if (!msg) return fallback;
  const lower = msg.toLowerCase();

  // Network / connectivity
  if (lower.includes("failed to fetch") || lower.includes("networkerror") || lower.includes("network request failed") || lower.includes("load failed")) {
    return "We couldn't reach our servers. Please check your connection and try again.";
  }
  if (lower.includes("timeout") || lower.includes("timed out")) {
    return "The request took too long. Please try again in a moment.";
  }

  // Auth
  if (lower.includes("unauthorized") || lower.includes("not authenticated") || lower.includes("jwt") || lower.includes("no authorization")) {
    return "Please sign in to continue.";
  }
  if (lower.includes("invalid login") || lower.includes("invalid credentials")) {
    return "That email or password didn't match. Please try again.";
  }

  // Conflicts / availability
  if (lower.includes("already booked") || lower.includes("already reserved")) {
    return "That slot was just taken. Please choose another time or table.";
  }
  if (lower.includes("room unavailable") || lower.includes("not available") || lower.includes("unavailable")) {
    return "This option is currently unavailable. Please pick another.";
  }
  if (lower.includes("not found")) {
    return "We couldn't find that item. It may have been removed.";
  }

  // Validation
  if (lower.includes("invalid email")) return "Please enter a valid email address.";
  if (lower.includes("invalid") && lower.includes("phone")) return "Please enter a valid phone number.";
  if (lower.startsWith("[") || lower.includes("zoderror") || lower.includes("validation")) {
    return "Please review the form — some details look incomplete.";
  }

  // Server / database raw leaks → hide
  if (lower.includes("postgres") || lower.includes("supabase") || lower.includes("relation ") || lower.includes("column ") || lower.includes("permission denied") || lower.includes("violates")) {
    return fallback;
  }

  // Already friendly (short, sentence-like): pass through
  if (msg.length <= 160 && /[a-zA-Z]/.test(msg) && !msg.includes("\n")) return msg;
  return fallback;
}

/** Toast a polished error message for any thrown value. */
export function showError(e: unknown, fallback?: string) {
  toast.error(friendlyError(e, fallback), {
    description: "If this keeps happening, please contact us and we'll help right away.",
  });
}