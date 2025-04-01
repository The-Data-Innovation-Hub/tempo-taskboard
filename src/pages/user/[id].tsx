import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  Building,
  Briefcase,
  Calendar,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth, User } from "@/lib/auth";
import { userApi, Project } from "@/lib/api";
import NeumorphicContainer from "@/components/common/NeumorphicContainer";

const UserDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if current user is admin
  useEffect(() => {
    if (currentUser?.role !== "admin") {
      toast({
        title: "Access denied",
        description: "Only administrators can access user details",
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

  return (
    <div className="user-details-page p-6 max-w-4xl mx-auto bg-white">
      <Button
        variant="ghost"
        onClick={() => navigate("/users")}
        className="mb-6 flex items-center"
      >
        <ArrowLeft size={16} className="mr-2" />
        Back to Users
      </Button>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : user ? (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-full md:w-1/3">
              <NeumorphicContainer className="p-6" elevation="medium">
                <div className="flex flex-col items-center">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-32 h-32 rounded-full mb-4"
                  />
                  <h2 className="text-2xl font-bold text-center">
                    {user.name}
                  </h2>
                  <span className="text-sm px-3 py-1 bg-blue-100 text-blue-800 rounded-full mt-2">
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                  <div className="flex items-center text-gray-600 mt-4">
                    <Mail size={16} className="mr-2" />
                    <span>{user.email}</span>
                  </div>
                  {user.jobTitle && (
                    <div className="flex items-center text-gray-600 mt-2">
                      <Briefcase size={16} className="mr-2" />
                      <span>{user.jobTitle}</span>
                    </div>
                  )}
                  {user.organization?.name && (
                    <div className="flex items-center text-gray-600 mt-2">
                      <Building size={16} className="mr-2" />
                      <span>{user.organization.name}</span>
                    </div>
                  )}
                </div>
              </NeumorphicContainer>
            </div>

            <div className="w-full md:w-2/3">
              <NeumorphicContainer className="p-6" elevation="medium">
                <h3 className="text-xl font-semibold mb-4">
                  Additional Information
                </h3>
                <div className="space-y-4">
                  {user.jobTitle && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">
                        Job Title
                      </h4>
                      <p className="text-gray-900">{user.jobTitle}</p>
                    </div>
                  )}
                  {user.organization && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">
                        Organization
                      </h4>
                      <div
                        className="flex items-center text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                        onClick={() =>
                          navigate(`/organization/${user.organization.id}`)
                        }
                      >
                        {user.organization.logo && (
                          <img
                            src={user.organization.logo}
                            alt={user.organization.name}
                            className="w-5 h-5 mr-2 rounded-full"
                          />
                        )}
                        <span>{user.organization.name}</span>
                      </div>
                      {user.organization.description && (
                        <p className="text-sm text-gray-500 mt-1">
                          {user.organization.description}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </NeumorphicContainer>

              {user.projects && user.projects.length > 0 && (
                <NeumorphicContainer className="p-6 mt-6" elevation="medium">
                  <h3 className="text-xl font-semibold mb-4">Projects</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {user.projects.map((project) => (
                      <div
                        key={project.id}
                        className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => navigate(`/project/${project.id}`)}
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium">{project.title}</h4>
                          {project.is_favorite && (
                            <span className="text-yellow-500">★</span>
                          )}
                        </div>
                        {project.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {project.description}
                          </p>
                        )}
                        <div className="flex items-center text-xs text-gray-500 mt-3">
                          <Calendar size={14} className="mr-1" />
                          <span className="mr-3">
                            {project.lastUpdated || "Recently updated"}
                          </span>
                          <Layers size={14} className="mr-1" />
                          <span>{project.taskCount || 0} tasks</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </NeumorphicContainer>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate(`/users/${user.id}/edit`)}
            >
              Edit User
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                // This would typically open a confirmation dialog
                // For now, just navigate back to users page
                navigate("/users");
              }}
            >
              Delete User
            </Button>
          </div>
        </div>
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

export default UserDetails;
