import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  React.useEffect(() => {
    // If already authenticated, redirect to dashboard
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <img
              src="/logo.svg"
              alt="TaskBoard Logo"
              className="h-10 w-auto"
              onError={(e) => {
                e.currentTarget.src =
                  "https://raw.githubusercontent.com/TempoLabsAI/starter/main/public/logo.svg";
              }}
            />
            <h1 className="text-xl font-bold text-[#0089AD] ml-2">TaskBoard</h1>
          </div>
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate("/login")}
              className="text-gray-700 hover:text-[#0089AD]"
            >
              Log In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0 md:pr-10">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Manage Your Projects with Ease
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                A beautiful, intuitive project management tool with a neumorphic
                design that helps teams organize, track, and manage their work
                efficiently.
              </p>
              <div>
                <Button
                  onClick={() => navigate("/login")}
                  className="bg-[#0089AD] hover:bg-[#0089AD]/90 text-white px-8 py-6 text-lg h-auto"
                >
                  Log In
                </Button>
              </div>
            </div>
            <div className="md:w-1/2">
              <div className="bg-white rounded-xl shadow-[10px_10px_20px_#e6e6e6,-10px_-10px_20px_#ffffff] p-6 border border-gray-100">
                <img
                  src="https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800&q=80"
                  alt="Project Management Dashboard"
                  className="rounded-lg w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-[8px_8px_16px_#e6e6e6,-8px_-8px_16px_#ffffff] p-6 border border-gray-100">
              <div className="w-12 h-12 bg-[#0089AD]/10 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-[#0089AD]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">
                Kanban Boards
              </h3>
              <p className="text-gray-600">
                Visualize your workflow with customizable Kanban boards. Drag
                and drop tasks between columns to update their status.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-[8px_8px_16px_#e6e6e6,-8px_-8px_16px_#ffffff] p-6 border border-gray-100">
              <div className="w-12 h-12 bg-[#0089AD]/10 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-[#0089AD]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">
                Team Collaboration
              </h3>
              <p className="text-gray-600">
                Invite team members to your projects, assign tasks, and
                collaborate efficiently with role-based permissions.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-[8px_8px_16px_#e6e6e6,-8px_-8px_16px_#ffffff] p-6 border border-gray-100">
              <div className="w-12 h-12 bg-[#0089AD]/10 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-[#0089AD]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">
                Task Analytics
              </h3>
              <p className="text-gray-600">
                Track project progress with visual analytics and reports.
                Identify bottlenecks and optimize your workflow.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 py-12 px-4 border-t border-gray-200">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <div className="flex items-center">
                <img
                  src="/logo.svg"
                  alt="TaskBoard Logo"
                  className="h-8 w-auto"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://raw.githubusercontent.com/TempoLabsAI/starter/main/public/logo.svg";
                  }}
                />
                <h2 className="text-lg font-bold text-[#0089AD] ml-2">
                  TaskBoard
                </h2>
              </div>
              <p className="text-gray-500 mt-2">
                © 2023 TaskBoard. All rights reserved.
              </p>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-500 hover:text-[#0089AD]">
                Terms
              </a>
              <a href="#" className="text-gray-500 hover:text-[#0089AD]">
                Privacy
              </a>
              <a href="#" className="text-gray-500 hover:text-[#0089AD]">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
