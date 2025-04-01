import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useToast } from "../ui/use-toast";
import { useAuth } from "@/lib/auth";
import { projectApi, organizationApi } from "@/lib/api";
import { Loader2, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import OrganizationSelector from "../organization/OrganizationSelector";
import { Checkbox } from "../ui/checkbox";
import { ScrollArea } from "../ui/scroll-area";

interface CreateProjectModalProps {
  project?: any;
  isEditing?: boolean;
  onClose?: () => void;
  onCreateProject?: (projectData: {
    id?: string;
    title: string;
    description: string;
    organization_id?: string;
    users?: string[];
  }) => void;
  organizationId?: string;
}

const CreateProjectModal = ({
  project,
  isEditing = false,
  onClose = () => {},
  onCreateProject = () => {},
  organizationId: initialOrgId,
}: CreateProjectModalProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedOrgId, setSelectedOrgId] = useState<string | undefined>(
    initialOrgId,
  );
  const [orgMembers, setOrgMembers] = useState<
    Array<{ id: string; name: string; email: string; role: string }>
  >([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (project && isEditing) {
      setTitle(project.title || "");
      setDescription(project.description || "");
      setSelectedOrgId(project.organization_id);

      // If the project has associated users, set them as selected
      if (project.users) {
        setSelectedUsers(project.users);
      }
    }
  }, [project, isEditing]);

  // Fetch organization members when an organization is selected
  useEffect(() => {
    let isMounted = true;
    const fetchOrgMembers = async () => {
      if (!selectedOrgId) {
        setOrgMembers([]);
        return;
      }

      try {
        setIsLoadingMembers(true);
        const members = await organizationApi.getMembers(selectedOrgId);

        // Only update state if component is still mounted
        if (!isMounted) return;

        setOrgMembers(members);
      } catch (error) {
        console.error("Error fetching organization members:", error);
        if (isMounted) {
          toast({
            title: "Failed to load members",
            description: "There was an error loading organization members.",
            variant: "destructive",
          });
        }
      } finally {
        if (isMounted) {
          setIsLoadingMembers(false);
        }
      }
    };

    fetchOrgMembers();

    // Cleanup function to prevent state updates after unmounting
    return () => {
      isMounted = false;
    };
  }, [selectedOrgId, toast]);

  // Handle organization change
  const handleOrganizationChange = (org) => {
    if (!org || !org.id) return;

    setSelectedOrgId(org.id);
    // Reset selected users when organization changes
    setSelectedUsers([]);
  };

  // Function to ensure user exists in the public.users table
  const ensureUserExists = async (userId: string) => {
    if (!userId) return false;

    try {
      // Try to create the user record directly
      // If it already exists, the unique constraint will prevent duplication
      const { error: insertError } = await supabase
        .from("users")
        .upsert([{ id: userId }], { onConflict: "id" });

      if (insertError) {
        console.error("Error creating/updating user record:", insertError);

        // If the error is because the table doesn't exist, we can still proceed
        // The project creation might still work if RLS is disabled
        if (
          insertError.message?.includes(
            'relation "public.users" does not exist',
          )
        ) {
          console.warn(
            "Users table doesn't exist, but proceeding with project creation",
          );
          return true;
        }

        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in ensureUserExists:", error);

      // If there's an error but it's just that the table doesn't exist,
      // we can still proceed with project creation
      if (
        error instanceof Error &&
        error.message?.includes('relation "public.users" does not exist')
      ) {
        console.warn(
          "Users table doesn't exist, but proceeding with project creation",
        );
        return true;
      }

      return false;
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({
        title: "Project name required",
        description: "Please enter a name for your project",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to create a project",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Use the user's actual ID
      const userId = user.id;

      console.log("Using user ID for project creation:", userId);

      // Try to ensure the user exists, but continue even if it fails
      try {
        await ensureUserExists(userId);
      } catch (error) {
        console.warn(
          "Could not ensure user exists, but continuing with project creation",
          error,
        );
      }

      // Create project data with all fields
      const projectData: any = {
        title: title.trim(),
        description: description.trim(),
        user_id: userId,
        is_favorite: false,
        organization_id: selectedOrgId || null,
      };

      let result;

      if (isEditing && project?.id) {
        result = await projectApi.update(project.id, projectData);

        // Always update project user associations, even if the array is empty
        // This ensures users can be removed from a project
        try {
          await projectApi.updateProjectUsers(project.id, selectedUsers);
        } catch (userError) {
          console.error("Error updating project users:", userError);
          toast({
            title: "Warning",
            description:
              "Project updated but there was an issue updating user associations.",
            variant: "destructive",
          });
        }

        toast({
          title: "Project updated",
          description: `Project "${result.title}" has been updated successfully.`,
        });
      } else {
        result = await projectApi.create(projectData);

        // Add users to the project if any are selected
        if (selectedUsers.length > 0) {
          try {
            await projectApi.updateProjectUsers(result.id, selectedUsers);
          } catch (userError) {
            console.error("Error adding users to project:", userError);
            toast({
              title: "Warning",
              description:
                "Project created but there was an issue adding users.",
              variant: "destructive",
            });
          }
        }

        toast({
          title: "Project created",
          description: `Project "${result.title}" has been created successfully.`,
        });

        // Navigate to the project page
        console.log(`Navigating to project page: /project/${result.id}`);
        navigate(`/project/${result.id}`);
      }

      onCreateProject({
        ...result,
        users: selectedUsers,
      });
    } catch (error) {
      console.error("Error saving project:", error);
      toast({
        title: `Failed to ${isEditing ? "update" : "create"} project`,
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle user selection
  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          {isEditing ? "Edit Project" : "Create New Project"}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Name
            </label>
            <Input
              placeholder="Enter project name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0089AD]"
              rows={4}
              placeholder="Enter project description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Organization Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Organization
            </label>
            <OrganizationSelector
              onOrganizationChange={handleOrganizationChange}
              className="w-full"
            />
          </div>

          {/* Team Members Selection */}
          {selectedOrgId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Users className="h-4 w-4 mr-1" />
                Team Members
              </label>

              {isLoadingMembers ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-[#0089AD]" />
                  <span className="ml-2 text-sm text-gray-500">
                    Loading members...
                  </span>
                </div>
              ) : orgMembers.length === 0 ? (
                <div className="text-sm text-gray-500 py-2">
                  No members found in this organization.
                </div>
              ) : (
                <ScrollArea className="h-[150px] border rounded-md p-2">
                  <div className="space-y-2">
                    {orgMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`user-${member.id}`}
                          checked={selectedUsers.includes(member.id)}
                          onCheckedChange={() => toggleUserSelection(member.id)}
                        />
                        <label
                          htmlFor={`user-${member.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center"
                        >
                          {member.avatar && (
                            <img
                              src={member.avatar}
                              alt={member.name}
                              className="h-6 w-6 rounded-full mr-2"
                            />
                          )}
                          {member.name}
                          <span className="text-xs text-gray-500 ml-1">
                            ({member.email})
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              type="button"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#0089AD] hover:bg-[#0089AD]/90 text-white"
              onClick={handleSubmit}
              type="button"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? "Updating..." : "Creating..."}
                </>
              ) : isEditing ? (
                "Update Project"
              ) : (
                "Create Project"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateProjectModal;
