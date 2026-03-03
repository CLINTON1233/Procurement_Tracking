"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { verifyPortalToken, PORTAL_APP_URL } from "../services/api";

const SESSION_CHECK_INTERVAL = 60 * 1000; // Cek setiap 1 menit

export default function SessionChecker({ children }) {
    const pathname = usePathname();
    const checkInProgress = useRef(false);

    useEffect(() => {
        // Skip untuk public routes
        const publicRoutes = ["/login", "/auth/callback"];
        if (publicRoutes.includes(pathname)) {
            return;
        }

        const checkSession = async () => {
            if (checkInProgress.current) return;

            try {
                checkInProgress.current = true;

                // Ambil token dari localStorage
                const token = localStorage.getItem("budget_token");

                if (!token) {
                    // Token tidak ada, redirect ke portal login (ambil dari api.js)
                    window.location.href = `${PORTAL_APP_URL}/login`;
                    return;
                }

                // Verifikasi token ke portal
                const data = await verifyPortalToken(token);

                if (data.status !== "success" || !data.authenticated) {
                    // Session expired atau invalid, redirect ke portal login
                    localStorage.removeItem("budget_token");
                    localStorage.removeItem("budget_user");
                    localStorage.removeItem("budget_login_time");

                    // Hapus cookie
                    document.cookie = "budget_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
                    document.cookie = "budget_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

                    window.location.href = `${PORTAL_APP_URL}/login`;
                }
            } catch (error) {
                console.error("Session check error:", error);
                // Cek apakah error karena auth (401/403)
                if (error.message?.includes("401") || error.message?.includes("403")) {
                    window.location.href = `${PORTAL_APP_URL}/login`;
                }
            } finally {
                checkInProgress.current = false;
            }
        };

        // Cek session saat initial load
        checkSession();

        // Set interval untuk cek session
        const interval = setInterval(checkSession, SESSION_CHECK_INTERVAL);

        return () => clearInterval(interval);
    }, [pathname]);

    return children;
}