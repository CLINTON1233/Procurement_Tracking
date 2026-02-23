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
      router.push("/login");
      return;
    }
    
    verifyAndRedirect(token, next);
  }, []);

  const verifyAndRedirect = async (token, next) => {
    try {
      const data = await verifyPortalToken(token);

      if (data.status === "success") {
        // Simpan user & token
        localStorage.setItem("budget_user", JSON.stringify(data.user));
        localStorage.setItem("budget_token", token);

        // Cookie untuk middleware
        document.cookie = `budget_token=${token}; path=/; max-age=86400`;
        document.cookie = `budget_user=${encodeURIComponent(
          JSON.stringify(data.user)
        )}; path=/; max-age=86400`;

        // Session flag
        sessionStorage.setItem("isAuthenticated", "true");
        sessionStorage.setItem("auth_source", "portal");

        router.push(next);
      } else {
        console.error("Token verification failed:", data.message);
        router.push("/login");
      }
    } catch (error) {
      console.error("Token verification error:", error);
      router.push("/login");
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-800">Verifying...</h2>
        <p className="text-gray-600 mt-2">Please wait while we verify your credentials.</p>
      </div>
    </div>
  );
}