import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import UserProfileForm from "@/components/auth/UserProfileForm";
import NeumorphicContainer from "@/components/common/NeumorphicContainer";
import { ArrowLeft, User, Shield, Bell, HelpCircle } from "lucide-react";

const ProfilePage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("personal-info");

  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    // Set loading to false once we confirm user is loaded
    if (user) {
      setIsLoading(false);
    }
  }, [isAuthenticated, navigate, user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0089AD]"></div>
      </div>
    );
  }

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    document.getElementById(tabId)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="p-4 md:p-6 w-full min-h-screen bg-gray-50">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-[#0089AD] transition-colors"
        >
          <ArrowLeft className="mr-2" size={20} />
          <span>Back</span>
        </button>
        <h1 className="text-2xl font-bold text-gray-800 hidden md:block">
          Profile Settings
        </h1>
        <div className="w-24"></div> {/* Empty div for flex spacing */}
      </div>
      <div className="w-full">
        <NeumorphicContainer className="p-6">
          <div className="mb-6 md:hidden">
            <h1 className="text-2xl font-bold text-gray-800">
              Profile Settings
            </h1>
            <p className="text-gray-600">
              Update your personal information and account settings
            </p>
          </div>

          <UserProfileForm user={user} />
        </NeumorphicContainer>
      </div>
    </div>
  );
};

export default ProfilePage;
