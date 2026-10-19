import { createClient } from "@/lib/supabase/client";

/**
 * Handles Facebook Login with deep-linking to the native Facebook app on mobile devices.
 * If user is on Android or iOS, it resolves the OAuth URL and launches the Facebook App.
 * If the Facebook App is not installed or on Desktop, it falls back to standard OAuth web view.
 */
export async function loginWithFacebook(nextPath: string = "/"): Promise<void> {
  const supabase = createClient();
  const callbackUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;

  const ua = typeof navigator !== "undefined" ? navigator.userAgent || "" : "";
  const isAndroid = /Android/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isMobile = isAndroid || isIOS;

  if (!isMobile) {
    // Desktop: standard Supabase OAuth redirect
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "facebook",
      options: {
        redirectTo: callbackUrl,
      },
    });
    if (error) throw error;
    return;
  }

  // Mobile / Native App: request OAuth URL without immediate redirect
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "facebook",
    options: {
      redirectTo: callbackUrl,
      skipBrowserRedirect: true,
      scopes: "email,public_profile",
    },
  });

  if (error || !data?.url) {
    throw error || new Error("Failed to get Facebook OAuth URL");
  }

  try {
    // Resolve Facebook dialog URL and deep-links from backend helper
    const res = await fetch(`/api/auth/facebook-redirect?url=${encodeURIComponent(data.url)}`);
    const result = await res.json();

    if (result.intentUrl && isAndroid) {
      // Android: launch native Facebook app via Android Intent with browser fallback
      window.location.href = result.intentUrl;
      return;
    }

    if (result.fbAppUrl && isIOS) {
      // iOS: attempt to launch Facebook App via custom URL scheme
      const now = Date.now();
      window.location.href = result.fbAppUrl;

      // Fallback to web dialog if app doesn't open within 1.2s
      setTimeout(() => {
        if (Date.now() - now < 2200) {
          window.location.href = result.fbUrl || data.url;
        }
      }, 1200);
      return;
    }

    // Default fallback
    window.location.href = result.fbUrl || data.url;
  } catch (_) {
    // Fallback directly to Supabase authorize URL
    window.location.href = data.url;
  }
}
