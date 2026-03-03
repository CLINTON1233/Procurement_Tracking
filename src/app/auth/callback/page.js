"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyPortalToken, PORTAL_APP_URL } from "../../../services/api";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const next = searchParams.get("next") || "/dashboard";

    if (!token) {
      // Redirect ke login PORTAL (ambil dari api.js)
      window.location.href = `${PORTAL_APP_URL}/login`;
      return;
    }

    const verifyAndRedirect = async () => {
      try {
        const data = await verifyPortalToken(token);

        if (data.status === "success" && data.authenticated) {
          // Simpan user & token
          localStorage.setItem("budget_user", JSON.stringify(data.user));
          localStorage.setItem("budget_token", token);
          localStorage.setItem("budget_login_time", Date.now().toString());

          // Cookie middleware (sinkron dengan session portal 24 jam)
          const expireTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
          document.cookie = `budget_token=${token}; path=/; expires=${expireTime.toUTCString()}`;
          document.cookie = `budget_user=${encodeURIComponent(
            JSON.stringify(data.user)
          )}; path=/; expires=${expireTime.toUTCString()}`;

          sessionStorage.setItem("isAuthenticated", "true");
          sessionStorage.setItem("auth_source", "portal");

          router.push(next);
        } else {
          // Redirect ke login PORTAL jika verifikasi gagal
          window.location.href = `${PORTAL_APP_URL}/login`;
        }
      } catch (error) {
        console.error("Token verification error:", error);
        // Redirect ke login PORTAL jika error
        window.location.href = `${PORTAL_APP_URL}/login`;
      }
    };

    verifyAndRedirect();
  }, [router, searchParams]);

  return null;
}