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
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import Swal from "sweetalert2";

export default function LayoutDashboard({ children, activeMenu }) {
  const [activeMenuIndex, setActiveMenuIndex] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileSubmenuOpen, setMobileSubmenuOpen] = useState({});
  const [currentDate, setCurrentDate] = useState("");
  const [openMenu, setOpenMenu] = useState(null);
  const userDropdownRef = useRef(null);

  const router = useRouter();
  const pathname = usePathname();

  // User data
  const [user, setUser] = useState({
    username: "John Doe",
    department: "Finance",
    no_badge: "FIN-001",
    email: "john@seatrium.com",
    name: "John Doe",
    role: "Finance",
  });

  // Format current date
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
      label: "Dashboard",
      href: "/dashboard",
      hasDropdown: false,
    },
    {
      icon: DollarSign,
      label: "Budget Management",
      href: "/budget_management",
      hasDropdown: false,
    },
    {
      icon: FileText,
      label: "Budget Request",
      href: "/request",
      hasDropdown: false,
    },
    // {
    //   icon: CheckSquare,
    //   label: "Approval Queue",
    //   href: "/approval",
    //   hasDropdown: false,
    // },
    // {
    //   icon: PieChart,
    //   label: "SR/MR Selection",
    //   href: "/selection",
    //   hasDropdown: false,
    // },
    // {
    //   icon: History,
    //   label: "History & Reports",
    //   href: "/history",
    //   hasDropdown: false,
    // },
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

  const handleLogout = () => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);

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
        router.push("/login");
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Font Inter Global Style */}
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");

        * {
          font-family: "Inter", sans-serif;
        }

        /* SweetAlert Styles */
        .swal2-container {
          font-family: "Inter", sans-serif !important;
        }

        .swal2-title {
          font-family: "Inter", sans-serif !important;
          font-weight: 600 !important;
          color: #1e293b !important;
        }

        .swal2-html-container {
          font-family: "Inter", sans-serif !important;
          color: #475569 !important;
        }

        .swal2-confirm {
          font-family: "Inter", sans-serif !important;
          font-weight: 500 !important;
          padding: 0.5rem 2rem !important;
          border-radius: 0.375rem !important;
          background-color: #1e40af !important;
          border: none !important;
        }

        .swal2-confirm:hover {
          background-color: #1e3a8a !important;
        }
      `}</style>

      {/* Top Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Image
              src="/seatrium.png"
              alt="Seatrium Logo"
              width={200}
              height={200}
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
                  className={`w-4 h-4 transition-transform ${userDropdownOpen ? "rotate-180" : ""}`}
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
                        {user.role}
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

        {/* Desktop Menu - Dengan Submenu */}
        <div className="hidden md:block bg-blue-600 px-4">
          <div className="flex items-center gap-1 py-2">
            {menuItems.map((menu, index) => (
              <div key={index} className="relative">
                {!menu.hasDropdown && (
                  <button
                    className="flex items-center space-x-2 px-3 py-2 text-white hover:bg-blue-700 text-sm transition rounded"
                    onClick={() => router.push(menu.href)}
                  >
                    <menu.icon className="w-4 h-4" />
                    <span>{menu.label}</span>
                  </button>
                )}

                {menu.hasDropdown && (
                  <>
                    <button
                      className="flex items-center space-x-2 px-3 py-2 text-white hover:bg-blue-700 text-sm transition rounded"
                      onClick={() =>
                        setOpenMenu(openMenu === index ? null : index)
                      }
                    >
                      <menu.icon className="w-4 h-4" />
                      <span>{menu.label}</span>
                      <ChevronDown
                        className={`w-3 h-3 transition-transform ${openMenu === index ? "rotate-180" : ""}`}
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
                <div className="text-white font-medium text-sm">
                  {user.name}
                </div>
                <div className="text-blue-100 text-xs">{user.department}</div>
              </div>
            </div>

            {/* Mobile Menu Items dengan Submenu */}
            <div className="py-2 pb-20">
              {menuItems.map((item, index) => (
                <div key={index} className="w-full">
                  {!item.hasDropdown ? (
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
                              <span className="flex-1 text-left">
                                {child.label}
                              </span>
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
