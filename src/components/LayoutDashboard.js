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
          confirmButtonColor: "#1e40af",
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
      confirmButtonColor: "#3085d6",
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
          href: "/budget",
        },
          {
          icon: Wallet,
          label: "Request List",
          href: "/budget_request_list",
        },
        {
          icon: FilePenLine,
          label: "Revision",
          href: "/budget_revision",
        },
        {
          icon: FileText,
          label: "New Request",
          href: "/request_budget_form",
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

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Image
              src="/seatrium.png"
              alt="Seatrium Logo"
              width={200}
              height={250}
              className="object-contain"
              priority
            />
          </div>

          <div className="flex items-center space-x-2">
            {/* Notification Bell */}
            <button className="hidden md:block p-2 hover:bg-gray-100 rounded-lg relative">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-red-500"></span>
            </button>

            {/* User Dropdown - Desktop */}
            <div className="hidden md:block relative" ref={userDropdownRef}>
              <button
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              >
                <User className="w-4 h-4" />
                <span>{user.username}</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    userDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">
                      {user.username}
                    </p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                        {user.department}
                      </span>
                    </p>
                  </div>

                  <div className="border-t border-gray-100 my-1"></div>

                  <button
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Logout
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="w-5 h-5 text-gray-800" />
            </button>
          </div>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:block bg-blue-600 px-4">
          <div className="flex items-center gap-1 py-2">
            {menuItems.map((menu, index) => (
              <div key={index} className="relative">
                {!menu.children && (
                  <button
                    className="flex items-center space-x-2 px-3 py-2 text-white hover:bg-blue-700 text-sm transition rounded"
                    onClick={() => router.push(menu.href)}
                  >
                    <menu.icon className="w-4 h-4" />
                    <span>{menu.label}</span>
                  </button>
                )}

                {menu.children && (
                  <>
                    <button
                      className="flex items-center space-x-2 px-3 py-2 text-white hover:bg-blue-700 text-sm transition rounded"
                      onClick={() => setOpenMenu(openMenu === index ? null : index)}
                    >
                      <menu.icon className="w-4 h-4" />
                      <span>{menu.label}</span>
                      <ChevronDown
                        className={`w-3 h-3 transition-transform ${
                          openMenu === index ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {openMenu === index && (
                      <div className="absolute left-0 mt-1 bg-white text-gray-800 rounded shadow-lg w-56 z-50">
                        {menu.children.map((child, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              router.push(child.href);
                              setOpenMenu(null);
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 transition"
                          >
                            <child.icon className="w-4 h-4 mr-3" />
                            {child.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}

            <div className="ml-auto text-white text-sm py-2 px-3 opacity-80">
              {currentDate}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar Menu */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          ></div>

          <div className="fixed top-0 left-0 h-full w-64 bg-blue-600 z-50 md:hidden overflow-y-auto">
            <div className="bg-blue-700 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
              <span className="text-white font-bold">Menu</span>
              <button onClick={() => setMobileMenuOpen(false)}>
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="bg-blue-500 px-4 py-3 flex items-center space-x-3 sticky top-[72px] z-10">
              <div className="w-10 h-10 bg-blue-400 rounded flex items-center justify-center text-white">
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="text-white font-medium text-sm">{user.name}</div>
                <div className="text-blue-100 text-xs">{user.department}</div>
              </div>
            </div>

            <div className="py-2 pb-20">
              {menuItems.map((item, index) => (
                <div key={index} className="w-full">
                  {!item.children ? (
                    <button
                      className="flex items-center w-full px-4 py-3 text-white hover:bg-blue-700 text-sm transition"
                      onClick={() => {
                        router.push(item.href);
                        setMobileMenuOpen(false);
                      }}
                    >
                      <item.icon className="w-5 h-5 mr-3" />
                      <span className="flex-1 text-left">{item.label}</span>
                    </button>
                  ) : (
                    <>
                      <button
                        className={`flex items-center w-full px-4 py-3 text-white hover:bg-blue-700 text-sm transition ${
                          mobileSubmenuOpen[index] ? "bg-blue-700" : ""
                        }`}
                        onClick={() => toggleMobileSubmenu(index)}
                      >
                        <item.icon className="w-5 h-5 mr-3" />
                        <span className="flex-1 text-left">{item.label}</span>
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${
                            mobileSubmenuOpen[index] ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {mobileSubmenuOpen[index] && (
                        <div className="bg-blue-700 py-1">
                          {item.children.map((child, childIndex) => (
                            <button
                              key={childIndex}
                              className="flex items-center w-full px-4 py-2.5 pl-12 text-white hover:bg-blue-800 text-sm transition"
                              onClick={() => {
                                router.push(child.href);
                                setMobileMenuOpen(false);
                                setMobileSubmenuOpen({});
                              }}
                            >
                              <child.icon className="w-4 h-4 mr-3" />
                              <span className="flex-1 text-left">{child.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="absolute bottom-0 left-0 right-0 bg-blue-700 px-4 py-3 text-white text-xs text-center border-t border-blue-500">
              {currentDate}
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-6">
        {children}
      </main>
    </div>
  );
}