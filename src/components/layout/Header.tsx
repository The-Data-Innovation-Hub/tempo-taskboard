import React from "react";
import { useLocation } from "react-router-dom";

const Header = () => {
  const location = useLocation();

  // Get the current page title based on the route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/") return "Dashboard";
    if (path.startsWith("/project/")) return "Project Details";
    if (path === "/project") return "Projects";
    if (path === "/organization") return "Organizations";
    if (path === "/users") return "Users";
    if (path === "/profile") return "My Profile";
    if (path === "/help") return "Help";
    if (path === "/performance") return "Performance";
    return "TaskBoard";
  };

  return (
    <header className="bg-white border-b border-gray-200 h-16 fixed top-0 left-0 right-0 z-10 flex items-center px-6">
      <h1 className="text-xl font-semibold text-gray-800">{getPageTitle()}</h1>
    </header>
  );
};

export default Header;
