"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyPortalToken } from "../../../services/api";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const next = searchParams.get("next") || "/dashboard";

    if (!token) {
      setTimeout(() => router.push("/login"), 1000);
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

          // Cookie untuk middleware (expire 30 menit)
          const expireTime = new Date(Date.now() + 30 * 60 * 1000);
          document.cookie = `budget_token=${token}; path=/; expires=${expireTime.toUTCString()}`;
          document.cookie = `budget_user=${encodeURIComponent(
            JSON.stringify(data.user)
          )}; path=/; expires=${expireTime.toUTCString()}`;

          // Session flag
          sessionStorage.setItem("isAuthenticated", "true");
          sessionStorage.setItem("auth_source", "portal");

          router.push(next);
        } else {
          router.push("/login");
        }
      } catch (error) {
        console.error("Token verification error:", error);
        router.push("/login");
      }
    };

    verifyAndRedirect();
  }, [router, searchParams]);

  return null;
}