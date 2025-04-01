import React, { useState, useRef } from "react";
import { User, useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import {
  Camera,
  Loader2,
  User as UserIcon,
  Mail,
  Briefcase,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import NeumorphicContainer from "@/components/common/NeumorphicContainer";

interface UserProfileFormProps {
  user: User | null;
  id?: string;
}

const UserProfileForm = ({ user, id }: UserProfileFormProps) => {
  const { updateUser } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [avatar, setAvatar] = useState<string | undefined>(user?.avatar);
  const [isUploading, setIsUploading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeSection, setActiveSection] = useState("personal-info");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image size should be less than 2MB",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);

      // Upload to Supabase Storage
      const fileName = `avatar-${Date.now()}.${file.name.split(".").pop()}`;
      console.log(`Uploading file to avatars/${fileName}`);
      const { data, error } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, {
          upsert: true,
          contentType: file.type,
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      const avatarUrl = urlData.publicUrl;
      console.log("Generated avatar URL:", avatarUrl);

      // Update user profile with new avatar URL
      console.log("Updating user profile with avatar URL:", avatarUrl);
      await updateUser({ avatar: avatarUrl });
      setAvatar(avatarUrl);

      // Force refresh the avatar in the UI
      setTimeout(() => {
        const img = new Image();
        img.src = avatarUrl + "?t=" + new Date().getTime();
      }, 500);

      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully",
      });
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsUpdating(true);

      // Only update if values have changed
      if (formData.name !== user.name || formData.email !== user.email) {
        await updateUser({
          name: formData.name,
          email: formData.email,
        });

        toast({
          title: "Profile updated",
          description: "Your profile information has been updated successfully",
        });
      } else {
        toast({
          title: "No changes detected",
          description: "Your profile information remains the same",
        });
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirmation must match",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsChangingPassword(true);

      // Update password via Supabase Auth API
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;

      // Clear password fields
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      toast({
        title: "Password updated",
        description: "Your password has been changed successfully",
      });
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast({
        title: "Password change failed",
        description: error.message || "Failed to update password",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const toggleSection = (section: string) => {
    setActiveSection(section);
  };

  if (!user) return null;

  return (
    <div className="space-y-8">
      <div className="flex space-x-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => toggleSection("personal-info")}
          className={`pb-2 px-1 font-medium ${
            activeSection === "personal-info"
              ? "text-[#0089AD] border-b-2 border-[#0089AD]"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Personal Information
        </button>
        <button
          onClick={() => toggleSection("security")}
          className={`pb-2 px-1 font-medium ${
            activeSection === "security"
              ? "text-[#0089AD] border-b-2 border-[#0089AD]"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Security
        </button>
      </div>

      {activeSection === "personal-info" && (
        <div id="personal-info">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center">
              <UserIcon className="mr-2 text-[#0089AD]" size={20} />
              Personal Information
            </h2>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="md:w-1/3 flex flex-col items-center">
                <div
                  className="relative cursor-pointer group mb-4"
                  onClick={handleAvatarClick}
                >
                  <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                    {avatar ? (
                      <AvatarImage src={avatar} alt={user.name} />
                    ) : (
                      <AvatarFallback className="bg-[#0089AD] text-white text-2xl">
                        {user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      {isUploading ? (
                        <Loader2 className="h-10 w-10 text-white animate-spin" />
                      ) : (
                        <Camera className="h-10 w-10 text-white" />
                      )}
                    </div>
                  </Avatar>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
                <p className="text-sm text-gray-500 mt-2 text-center">
                  Click to change profile picture
                </p>
                <p className="text-xs text-gray-400 mt-1 text-center max-w-[200px]">
                  Recommended: Square image, at least 200x200 pixels
                </p>
              </div>

              <div className="md:w-2/3">
                <form onSubmit={handleProfileUpdate}>
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label
                        htmlFor="name"
                        className="flex items-center text-gray-700"
                      >
                        <UserIcon className="mr-2" size={16} />
                        Full Name
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Your full name"
                        className="border-gray-300 focus:border-[#0089AD] focus:ring-[#0089AD]/20"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="email"
                        className="flex items-center text-gray-700"
                      >
                        <Mail className="mr-2" size={16} />
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Your email address"
                        className="border-gray-300 focus:border-[#0089AD] focus:ring-[#0089AD]/20"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="role"
                        className="flex items-center text-gray-700"
                      >
                        <Briefcase className="mr-2" size={16} />
                        Role
                      </Label>
                      <Input
                        id="role"
                        value={
                          user.role.charAt(0).toUpperCase() + user.role.slice(1)
                        }
                        disabled
                        className="bg-gray-50 border-gray-200 text-gray-500"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-[#0089AD] hover:bg-[#0089AD]/90 mt-4"
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSection === "security" && (
        <div id="security">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center">
              <Lock className="mr-2 text-[#0089AD]" size={20} />
              Change Password
            </h2>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <form onSubmit={handlePasswordChange}>
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="currentPassword"
                    className="flex items-center text-gray-700"
                  >
                    <Lock className="mr-2" size={16} />
                    Current Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      name="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={handlePasswordInputChange}
                      placeholder="Enter your current password"
                      className="border-gray-300 focus:border-[#0089AD] focus:ring-[#0089AD]/20 pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                    >
                      {showCurrentPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="newPassword"
                    className="flex items-center text-gray-700"
                  >
                    <Lock className="mr-2" size={16} />
                    New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={handlePasswordInputChange}
                      placeholder="Enter your new password"
                      className="border-gray-300 focus:border-[#0089AD] focus:ring-[#0089AD]/20 pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Password must be at least 6 characters long
                  </p>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="confirmPassword"
                    className="flex items-center text-gray-700"
                  >
                    <Lock className="mr-2" size={16} />
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordInputChange}
                      placeholder="Confirm your new password"
                      className="border-gray-300 focus:border-[#0089AD] focus:ring-[#0089AD]/20 pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#0089AD] hover:bg-[#0089AD]/90 mt-4"
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating Password...
                    </>
                  ) : (
                    "Change Password"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfileForm;
