"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { PORTAL_APP_URL } from "../../../services/api";

export default function LoginPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const redirect = searchParams.get("redirect") || "/dashboard";
    window.location.href = `${PORTAL_APP_URL}/login?next=${encodeURIComponent(redirect)}`;
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      </div>
    </div>
  );
}