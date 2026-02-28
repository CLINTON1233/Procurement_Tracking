"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { verifyPortalToken } from "../../../services/api";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [checking, setChecking] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);

  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      // Cek apakah sudah ada token di localStorage
      const existingToken = localStorage.getItem("budget_token");

      if (existingToken) {
        // Verifikasi token ke backend
        const data = await verifyPortalToken(existingToken);

        if (data.status === "success" && data.authenticated) {
          // Token masih valid
          setHasValidSession(true);

          // Update user data
          localStorage.setItem("budget_user", JSON.stringify(data.user));

          // Redirect langsung ke dashboard
          setTimeout(() => {
            window.location.href = "/dashboard";
          }, 1000);
          return;
        } else {
          // Token tidak valid, hapus
          localStorage.removeItem("budget_token");
          localStorage.removeItem("budget_user");
        }
      }
    } catch (error) {
      console.error("Session check error:", error);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (checking || hasValidSession) return;

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

    // Redirect ke portal setelah 2 detik
    const timer = setTimeout(() => {
      window.location.href = portalLoginUrl;
    }, 2000);

    return () => clearTimeout(timer);
  }, [checking, hasValidSession]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800">
            Checking existing session...
          </h2>
        </div>
      </div>
    );
  }

  if (hasValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800">
            Session Found!
          </h2>
          <p className="text-gray-600 mt-2">
            Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

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
        <p className="text-sm text-gray-500 mt-4">
          You'll be redirected automatically in a moment.
        </p>
      </div>
    </div>
  );
}