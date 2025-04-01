import * as React from "react";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth, User } from "@/lib/auth";
import { userApi } from "@/lib/api";
import NeumorphicContainer from "@/components/common/NeumorphicContainer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const UserEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    jobTitle: "",
    avatar: "",
  });

  // Check if current user is admin
  useEffect(() => {
    if (currentUser?.role !== "admin") {
      toast({
        title: "Access denied",
        description: "Only administrators can edit user details",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [currentUser, navigate, toast]);

  // Fetch user details
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        const userData = await userApi.getById(id);
        setUser(userData);
        setFormData({
          name: userData.name || "",
          email: userData.email || "",
          role: userData.role || "user",
          jobTitle: userData.jobTitle || "",
          avatar: userData.avatar || "",
        });
      } catch (error) {
        console.error("Error fetching user details:", error);
        toast({
          title: "Failed to load user",
          description: "There was an error loading the user details.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserDetails();
  }, [id, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      role: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      setIsSaving(true);
      await userApi.update(id, formData);
      toast({
        title: "User updated",
        description: "User details have been successfully updated.",
      });
      navigate(`/users/${id}`);
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        title: "Update failed",
        description: "There was an error updating the user details.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="user-edit-page p-6 max-w-4xl mx-auto bg-white">
      <Button
        variant="ghost"
        onClick={() => navigate(`/users/${id}`)}
        className="mb-6 flex items-center"
      >
        <ArrowLeft size={16} className="mr-2" />
        Back to User Details
      </Button>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : user ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <NeumorphicContainer className="p-6" elevation="medium">
            <h2 className="text-2xl font-bold mb-6">Edit User</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={handleRoleChange}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input
                    id="jobTitle"
                    name="jobTitle"
                    value={formData.jobTitle}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="avatar">Avatar URL</Label>
                  <Input
                    id="avatar"
                    name="avatar"
                    value={formData.avatar}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                </div>

                {formData.avatar && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 mb-2">Avatar Preview</p>
                    <img
                      src={formData.avatar}
                      alt="Avatar preview"
                      className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback";
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </NeumorphicContainer>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/users/${id}`)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="flex items-center"
            >
              {isSaving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save size={16} className="mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </form>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900">User not found</h3>
          <p className="text-gray-500 mt-1">
            The requested user could not be found.
          </p>
          <Button onClick={() => navigate("/users")} className="mt-4">
            Back to Users
          </Button>
        </div>
      )}
    </div>
  );
};

export default UserEditPage;
