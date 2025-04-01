import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  LayoutGrid,
  Settings,
  Users,
  HelpCircle,
  Building,
  Shield,
  User,
  LogOut,
  UserCircle,
  BarChart,
} from "lucide-react";
import NeumorphicContainer from "../common/NeumorphicContainer";
import { useAuth } from "@/lib/auth";
const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "admin";

  // Debug user role
  console.log("Current user:", user);
  console.log("Is admin:", isAdmin);

  // Define navigation items based on user role
  const getNavItems = () => {
    const items = [{ icon: <Home size={20} />, label: "Dashboard", path: "/" }];

    // Add admin-only items
    if (isAdmin) {
      items.push(
        { icon: <LayoutGrid size={20} />, label: "Projects", path: "/project" },
        {
          icon: <Building size={20} />,
          label: "Organizations",
          path: "/organization",
        },
        { icon: <Users size={20} />, label: "Users", path: "/users" },
      );
    } else {
      // Regular user items
      items.push({
        icon: <LayoutGrid size={20} />,
        label: "My Projects",
        path: "/project",
      });
    }

    // Add profile link for all users
    items.push({
      icon: <UserCircle size={20} />,
      label: "My Profile",
      path: "/profile",
    });

    // Add help link for all users
    items.push({
      icon: <HelpCircle size={20} />,
      label: "Help",
      path: "/help",
    });

    // Add performance monitoring link for admin users only
    if (isAdmin) {
      items.push({
        icon: <BarChart size={20} />,
        label: "Performance",
        path: "/performance",
      });
    }

    return items;
  };

  const navItems = getNavItems();

  return (
    <div className="sidebar bg-white h-screen fixed left-0 top-0 flex flex-col w-64 shadow-md">
      <div className="sidebar-header p-4 flex flex-col items-center border-b border-gray-200">
        <img
          src="/taskboard-logo.svg"
          alt="TaskBoard Logo"
          className="h-12 w-auto mb-2"
          onError={(e) => {
            e.currentTarget.src =
              "https://raw.githubusercontent.com/TempoLabsAI/starter/main/public/logo.svg";
          }}
        />
        {user && (
          <div className="text-center mt-2">
            <div className="font-medium text-gray-800">
              {user.name || user.email}
            </div>
            <div className="text-sm text-[#0089AD] font-semibold capitalize">
              {user.role || "user"}
            </div>
          </div>
        )}
      </div>

      <div className="sidebar-content flex-1 overflow-y-auto p-4">
        <nav className="space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;

            return (
              <Link to={item.path} key={item.path}>
                <NeumorphicContainer
                  className={`p-3 flex items-center space-x-3 w-full transition-all duration-200 ${isActive ? "bg-[#0089AD]/10" : ""}`}
                  elevation={isActive ? "medium" : "low"}
                  interactive
                >
                  <span
                    className={`${isActive ? "text-[#0089AD]" : "text-gray-600"}`}
                  >
                    {item.icon}
                  </span>
                  <span
                    className={`font-medium ${isActive ? "text-[#0089AD]" : "text-gray-700"}`}
                  >
                    {item.label}
                  </span>
                </NeumorphicContainer>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="sidebar-footer p-4 border-t border-gray-200">
        <div className="mt-2">
          <div
            onClick={async () => {
              await logout();
              navigate("/");
            }}
            className="cursor-pointer"
          >
            <NeumorphicContainer
              className="p-3 flex items-center space-x-3 w-full transition-all duration-200"
              elevation="low"
              interactive
            >
              <span className="text-gray-600">
                <LogOut size={20} />
              </span>
              <span className="font-medium text-gray-700">Logout</span>
            </NeumorphicContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
