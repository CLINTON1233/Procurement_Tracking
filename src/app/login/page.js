"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const redirect = searchParams.get("redirect") || "/dashboard";

    const PORTAL_APP_URL = process.env.NEXT_PUBLIC_PORTAL_APP_URL;
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

    if (!PORTAL_APP_URL || !APP_URL) {
      console.error("Missing environment variables for auth redirect");
      return;
    }

    const portalLoginUrl = `${PORTAL_APP_URL}/login?redirect=${encodeURIComponent(
      `${APP_URL}/auth/callback?next=${encodeURIComponent(redirect)}`
    )}`;

    window.location.href = portalLoginUrl;
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-800">
          Redirecting to Portal Login...
        </h2>
        <p className="text-gray-600 mt-2">
          Please wait while we redirect you to the authentication portal.
        </p>
      </div>
    </div>
  );
}