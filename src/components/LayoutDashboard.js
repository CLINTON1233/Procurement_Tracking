"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  ChevronDown,
  Home,
  Wallet,
  FileText,
  CheckSquare,
  History,
  Settings,
  Bell,
  Menu,
  X,
  User,
  LogOut,
  Key,
  CheckCircle,
  DollarSign,
  PieChart,
  Cpu,
  Repeat,
  Layers,
  BarChart3,
  Camera,
  ScanFace,
  Router,
  Network,
  Server,
  FilePen,
  FilePenLine,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import Swal from "sweetalert2";
import { PORTAL_APP_URL, APP_URL, logoutFromPortal } from "../services/api";

export default function LayoutDashboard({ children, activeMenu }) {
  const [activeMenuIndex, setActiveMenuIndex] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileSubmenuOpen, setMobileSubmenuOpen] = useState({});
  const [currentDate, setCurrentDate] = useState("");
  const [hasShownWelcome, setHasShownWelcome] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);
  const userDropdownRef = useRef(null);

  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState({
    username: "Loading...",
    department: "",
    no_badge: "",
    email: "",
    name: "",
  });

  useEffect(() => {
    checkAuth();
    loadUserData();
    handleWelcomeNotification();
  }, [pathname]);

  const checkAuth = () => {
    if (pathname === "/auth/callback") return;

    const isAuthenticated = sessionStorage.getItem("isAuthenticated");
    const userData = localStorage.getItem("budget_user");

    if (!isAuthenticated || !userData) {
      const redirectUrl = `${PORTAL_APP_URL}/login?redirect=${encodeURIComponent(
        `${APP_URL}/auth/callback?next=${encodeURIComponent(pathname)}`,
      )}`;

      window.location.href = redirectUrl;
      return;
    }
  };

  const loadUserData = () => {
    try {
      const userData = localStorage.getItem("budget_user");
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser({
          username: parsedUser.nama || "User",
          department: parsedUser.departemen || "Department",
          no_badge: parsedUser.badge || "N/A",
          email: parsedUser.email || "",
          name: parsedUser.nama || "User",
        });
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const handleWelcomeNotification = () => {
    if (pathname !== "/dashboard") {
      return;
    }
    const hasShown = localStorage.getItem("has_shown_welcome");
    const isFromPortal = sessionStorage.getItem("auth_source") === "portal";

    if (!isFromPortal && hasShown) {
      localStorage.removeItem("has_shown_welcome");
      return;
    }

    if (isFromPortal && !hasShown) {
      setTimeout(() => {
        Swal.fire({
          title: "Login Successful",
          text: `Welcome back, ${user.username}!`,
          icon: "success",
          confirmButtonColor: "#2563eb",
          timer: 3000,
        }).then(() => {
          localStorage.setItem("has_shown_welcome", "true");
          sessionStorage.removeItem("auth_source");
          setHasShownWelcome(true);
        });
      }, 1000);
    }
  };

  const handleLogout = () => {
    Swal.fire({
      title: "Logout Confirmation",
      text: "Are you sure you want to log out?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Logout!",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem("has_shown_welcome");
        sessionStorage.removeItem("isAuthenticated");
        sessionStorage.removeItem("auth_source");
        localStorage.removeItem("budget_user");
        localStorage.removeItem("budget_token");

        document.cookie = "budget_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie = "budget_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

        logoutFromPortal();
      }
    });
  };

  useEffect(() => {
    const updateDate = () => {
      const now = new Date();
      const options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      };
      setCurrentDate(now.toLocaleDateString("en-US", options));
    };

    updateDate();
    const interval = setInterval(updateDate, 60000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    {
      icon: Home,
      label: "Home",
      href: "/dashboard",
      hasDropdown: true,
    },
    {
      label: "Budget",
      icon: Wallet,
      children: [
        {
          icon: Wallet,
          label: "Budget Management",
          href: "/manage_budget/budget_management",
        },
        {
          icon: Wallet,
          label: "Request List",
          href: "/manage_request/budget_request_list",
        },
        {
          icon: FilePenLine,
          label: "Revision",
          href: "/manage_revision/budget_revision",
        },
        {
          icon: FileText,
          label: "New Request",
          href: "/manage_request/request_budget_form",
        },
      ],
    },
  ];

  const toggleMobileSubmenu = (index) => {
    setMobileSubmenuOpen((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target)
      ) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Design tokens (changed to blue) ──
  const BLUE = "#2563eb"; // Warna biru yang lebih cerah
  const DARK_BLUE = "#1d4ed8"; // Untuk hover states

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6", fontFamily: "system-ui, -apple-system, sans-serif" }}>

      {/* ══ Top Navbar ══ */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div style={{ padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>

          {/* Logo */}
          <div>
            <Image
              src="/seatrium.png"
              alt="Seatrium Logo"
              width={200}
              height={50}
              style={{ objectFit: "contain", display: "block" }}
              priority
            />
          </div>

          {/* Right side */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>

            {/* Notification Bell - HILANGKAN TITIK 3 dengan menghapus span notifikasi */}
            <button
              className="hidden md:flex"
              style={{
                position: "relative", padding: 8,
                background: "transparent", border: "none", borderRadius: 8,
                cursor: "pointer", alignItems: "center", justifyContent: "center",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#f3f4f6"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <Bell style={{ width: 18, height: 18, color: "#6b7280" }} />
              {/* TITIK 3 DIHAPUS - span notifikasi dihilangkan */}
            </button>

            {/* User Dropdown — Desktop */}
            <div className="hidden md:block" style={{ position: "relative" }} ref={userDropdownRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "8px 14px", background: BLUE, color: "#fff",
                  border: "none", borderRadius: 8, fontSize: 14, fontWeight: 500,
                  cursor: "pointer", transition: "background 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = DARK_BLUE}
                onMouseLeave={e => e.currentTarget.style.background = BLUE}
              >
                <div style={{
                  width: 26, height: 26, borderRadius: "50%",
                  background: "rgba(255,255,255,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <User style={{ width: 14, height: 14 }} />
                </div>
                <span>{user.username}</span>
                <ChevronDown style={{
                  width: 14, height: 14, transition: "transform 0.2s",
                  transform: userDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                }} />
              </button>

              {userDropdownOpen && (
                <div style={{
                  position: "absolute", right: 0, top: "calc(100% + 8px)",
                  width: 240, background: "#fff", borderRadius: 10,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.12)", border: "1px solid #e5e7eb",
                  zIndex: 50, overflow: "hidden",
                }}>
                  {/* User info */}
                  <div style={{ padding: "14px 16px", borderBottom: "1px solid #f3f4f6" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{user.username}</div>
                    <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{user.email}</div>
                    <div style={{ marginTop: 6 }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600,
                        background: "#dbeafe", color: BLUE,
                        padding: "2px 8px", borderRadius: 20,
                      }}>
                        {user.department}
                      </span>
                    </div>
                  </div>

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      width: "100%", padding: "11px 16px",
                      background: "transparent", border: "none",
                      fontSize: 14, color: "#dc2626", cursor: "pointer",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#fef2f2"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <LogOut style={{ width: 15, height: 15 }} />
                    Logout
                  </button>
                </div>
              )}
            </div>

          
          </div>
        </div>

        {/* ── Desktop Menu Bar ── */}
        <div className="hidden md:block" style={{ background: BLUE, padding: "0 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            {menuItems.map((menu, index) => (
              <div key={index} style={{ position: "relative" }}>

                {/* Simple link (no children) */}
                {!menu.children && (
                  <button
                    onClick={() => router.push(menu.href)}
                    style={{
                      display: "flex", alignItems: "center", gap: 7,
                      padding: "10px 14px", background: "transparent",
                      border: "none", color: "rgba(255,255,255,0.9)",
                      fontSize: 14, fontWeight: 500, cursor: "pointer",
                      borderRadius: 6, transition: "background 0.15s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <menu.icon style={{ width: 15, height: 15 }} />
                    {menu.label}
                  </button>
                )}

                {/* Dropdown menu */}
                {menu.children && (
                  <>
                    <button
                      onClick={() => setOpenMenu(openMenu === index ? null : index)}
                      style={{
                        display: "flex", alignItems: "center", gap: 7,
                        padding: "10px 14px",
                        background: openMenu === index ? "rgba(255,255,255,0.15)" : "transparent",
                        border: "none", color: "rgba(255,255,255,0.9)",
                        fontSize: 14, fontWeight: 500, cursor: "pointer",
                        borderRadius: 6, transition: "background 0.15s",
                      }}
                      onMouseEnter={e => { if (openMenu !== index) e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
                      onMouseLeave={e => { if (openMenu !== index) e.currentTarget.style.background = "transparent"; }}
                    >
                      <menu.icon style={{ width: 15, height: 15 }} />
                      {menu.label}
                      <ChevronDown style={{
                        width: 13, height: 13, transition: "transform 0.2s",
                        transform: openMenu === index ? "rotate(180deg)" : "rotate(0deg)",
                      }} />
                    </button>

                    {openMenu === index && (
                      <>
                        {/* Click-outside backdrop */}
                        <div
                          style={{ position: "fixed", inset: 0, zIndex: 40 }}
                          onClick={() => setOpenMenu(null)}
                        />
                        <div style={{
                          position: "absolute", left: 0, top: "calc(100% + 4px)",
                          background: "#fff", borderRadius: 10,
                          boxShadow: "0 8px 24px rgba(0,0,0,0.12)", border: "1px solid #e5e7eb",
                          minWidth: 210, zIndex: 50, overflow: "hidden",
                        }}>
                          {menu.children.map((child, i) => (
                            <button
                              key={i}
                              onClick={() => { router.push(child.href); setOpenMenu(null); }}
                              style={{
                                display: "flex", alignItems: "center", gap: 10,
                                width: "100%", padding: "11px 16px",
                                background: "transparent", border: "none",
                                fontSize: 14, color: "#374151", cursor: "pointer",
                                transition: "background 0.15s", textAlign: "left",
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = "#f3f4f6"}
                              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                            >
                              <child.icon style={{ width: 15, height: 15, color: BLUE, flexShrink: 0 }} />
                              {child.label}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            ))}

            {/* Date — pushed right */}
            <div style={{ marginLeft: "auto", fontSize: 13, color: "rgba(255,255,255,0.85)", padding: "10px 4px" }}>
              {currentDate}
            </div>
          </div>
        </div>
      </nav>

      {/* ══ Mobile Sidebar ══ */}
      {mobileMenuOpen && (
        <>
          {/* Overlay */}
          <div
            className="md:hidden"
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 40 }}
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer */}
          <div
            className="md:hidden"
            style={{
              position: "fixed", top: 0, left: 0,
              height: "100%", width: 260, background: BLUE,
              zIndex: 50, overflowY: "auto", display: "flex", flexDirection: "column",
            }}
          >
            {/* Drawer header */}
            <div style={{
              background: DARK_BLUE, padding: "14px 16px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              position: "sticky", top: 0, zIndex: 10,
            }}>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>Menu</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4, display: "flex" }}
              >
                <X style={{ width: 18, height: 18, color: "#fff" }} />
              </button>
            </div>

            {/* User info strip */}
            <div style={{
              background: "rgba(255,255,255,0.08)", padding: "12px 16px",
              display: "flex", alignItems: "center", gap: 10,
              borderBottom: "1px solid rgba(255,255,255,0.1)",
              position: "sticky", top: 46, zIndex: 9,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "rgba(255,255,255,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <User style={{ width: 18, height: 18, color: "#fff" }} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{user.name}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{user.department}</div>
              </div>
            </div>

            {/* Menu items */}
            <div style={{ flex: 1, paddingTop: 8, paddingBottom: 60 }}>
              {menuItems.map((item, index) => (
                <div key={index}>
                  {!item.children ? (
                    <button
                      onClick={() => { router.push(item.href); setMobileMenuOpen(false); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        width: "100%", padding: "12px 16px",
                        background: "transparent", border: "none",
                        color: "#fff", fontSize: 14, fontWeight: 500,
                        cursor: "pointer", textAlign: "left",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <item.icon style={{ width: 16, height: 16, opacity: 0.9 }} />
                      <span style={{ flex: 1 }}>{item.label}</span>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => toggleMobileSubmenu(index)}
                        style={{
                          display: "flex", alignItems: "center", gap: 10,
                          width: "100%", padding: "12px 16px",
                          background: mobileSubmenuOpen[index] ? "rgba(255,255,255,0.12)" : "transparent",
                          border: "none", color: "#fff", fontSize: 14, fontWeight: 500,
                          cursor: "pointer", textAlign: "left",
                        }}
                      >
                        <item.icon style={{ width: 16, height: 16, opacity: 0.9 }} />
                        <span style={{ flex: 1 }}>{item.label}</span>
                        <ChevronDown style={{
                          width: 14, height: 14, opacity: 0.8, transition: "transform 0.2s",
                          transform: mobileSubmenuOpen[index] ? "rotate(180deg)" : "rotate(0deg)",
                        }} />
                      </button>

                      {mobileSubmenuOpen[index] && (
                        <div style={{ background: "rgba(0,0,0,0.15)" }}>
                          {item.children.map((child, ci) => (
                            <button
                              key={ci}
                              onClick={() => {
                                router.push(child.href);
                                setMobileMenuOpen(false);
                                setMobileSubmenuOpen({});
                              }}
                              style={{
                                display: "flex", alignItems: "center", gap: 10,
                                width: "100%", padding: "10px 16px 10px 44px",
                                background: "transparent", border: "none",
                                color: "rgba(255,255,255,0.9)", fontSize: 13,
                                cursor: "pointer", textAlign: "left",
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
                              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                            >
                              <child.icon style={{ width: 14, height: 14, opacity: 0.8 }} />
                              {child.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Date footer */}
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              background: DARK_BLUE, padding: "10px 16px",
              color: "rgba(255,255,255,0.6)", fontSize: 12, textAlign: "center",
              borderTop: "1px solid rgba(255,255,255,0.08)",
            }}>
              {currentDate}
            </div>
          </div>
        </>
      )}

      {/* ══ Main Content ══ */}
      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "20px 16px" }}>
        {children}
      </main>

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        button { font-family: inherit; }
        button:focus { outline: none; }
      `}</style>
    </div>
  );
}