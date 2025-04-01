import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { organizationApi, projectApi, userApi } from "@/lib/api";
import { Organization, Project } from "@/lib/api";
import { User, UserRole } from "@/lib/auth";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload } from "lucide-react";
import { supabase } from "@/lib/supabase";
import OrganizationSelector from "@/components/organization/OrganizationSelector";

interface UserFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
  onSuccess?: () => void;
}

export default function UserFormModal({
  open,
  onOpenChange,
  user,
  onSuccess,
}: UserFormModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    jobTitle: "",
    role: "user" as UserRole,
    organizationId: "",
    avatar: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        console.log("Fetching organizations and projects...");

        // Fetch organizations first
        const orgsData = await organizationApi.getAll();
        console.log("Organizations fetched:", orgsData);
        setOrganizations(orgsData);

        try {
          // Try to fetch projects
          const projectsData = await projectApi.getAll();
          setProjects(projectsData);
        } catch (projectError) {
          console.error("Error fetching projects:", projectError);
          setProjects([]);

          // Check if it's a missing table error
          if (
            typeof projectError === "object" &&
            projectError !== null &&
            "message" in projectError &&
            typeof projectError.message === "string" &&
            projectError.message.includes(
              'relation "public.projects" does not exist',
            )
          ) {
            toast({
              title: "Missing projects table",
              description:
                "The projects table doesn't exist in the database. This is expected if you haven't run the migration.",
              variant: "warning",
            });
          }
        }

        // If editing a user, set the form data
        if (user) {
          setFormData({
            name: user.name || "",
            email: user.email || "",
            password: "", // Don't populate password for security
            jobTitle: user.jobTitle || "",
            role: user.role || "user",
            organizationId: user.organizationId || "",
            avatar: user.avatar || "",
          });

          // Set avatar preview if user has an avatar
          if (user.avatar) {
            setAvatarPreview(user.avatar);
          }

          // Set selected projects if available
          if (user.projects) {
            setSelectedProjects(user.projects.map((p) => p.id));
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Failed to load data",
          description: "There was an error loading organizations and projects.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (open) {
      fetchData();
    }
  }, [user, toast, open]); // Only run when modal opens or user changes

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({ ...prev, role: value as UserRole }));
  };

  const handleOrganizationChange = (organization: Organization) => {
    setFormData((prev) => ({ ...prev, organizationId: organization.id }));
  };

  const handleProjectToggle = (projectId: string) => {
    setSelectedProjects((prev) => {
      if (prev.includes(projectId)) {
        return prev.filter((id) => id !== projectId);
      } else {
        return [...prev, projectId];
      }
    });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 5MB",
        variant: "destructive",
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    setAvatarFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadAvatar = async (userId: string): Promise<string | null> => {
    if (!avatarFile) return null;

    try {
      // Create a unique file path
      const fileExt = avatarFile.name.split(".").pop();
      const filePath = `${userId}/${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("avatars")
        .upload(filePath, avatarFile, {
          upsert: true,
          cacheControl: "3600",
        });

      if (error) {
        console.error("Error uploading avatar:", error);
        throw error;
      }

      // Get the public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("Avatar upload error:", error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let avatarUrl = formData.avatar;

      // Upload avatar if a new file was selected
      if (avatarFile) {
        if (user) {
          // For existing user
          const uploadedUrl = await uploadAvatar(user.id);
          if (uploadedUrl) avatarUrl = uploadedUrl;
        }
      }

      if (user) {
        // Update existing user
        await userApi.update(user.id, {
          name: formData.name,
          jobTitle: formData.jobTitle,
          role: formData.role,
          organizationId: formData.organizationId,
          projects: selectedProjects,
          ...(formData.password ? { password: formData.password } : {}),
          ...(avatarUrl ? { avatar: avatarUrl } : {}),
        });

        toast({
          title: "User updated",
          description: `${formData.name}'s information has been updated.`,
        });
      } else {
        // Create new user
        const newUser = await userApi.create({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          jobTitle: formData.jobTitle,
          role: formData.role,
          organizationId: formData.organizationId,
          projects: selectedProjects,
        });

        // Upload avatar for new user if available
        if (avatarFile && newUser && newUser.id) {
          const uploadedUrl = await uploadAvatar(newUser.id);
          if (uploadedUrl) {
            await userApi.update(newUser.id, { avatar: uploadedUrl });
          }
        }

        toast({
          title: "User created",
          description: `${formData.name} has been added successfully.`,
        });
      }

      // Reset form
      setFormData({
        name: "",
        email: "",
        password: "",
        jobTitle: "",
        role: "user",
        organizationId: "",
        avatar: "",
      });
      setAvatarFile(null);
      setAvatarPreview("");
      setSelectedProjects([]);

      // Close modal
      onOpenChange(false);

      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Error saving user:", error);
      toast({
        title: user ? "Failed to update user" : "Failed to create user",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{user ? "Edit User" : "Create New User"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            {/* Avatar Upload Section */}
            <div className="flex flex-col items-center space-y-2">
              <Label htmlFor="avatar">Profile Photo</Label>
              <div
                className="relative group cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Avatar className="h-24 w-24 border-2 border-[#0089AD]">
                  {avatarPreview ? (
                    <AvatarImage src={avatarPreview} alt="Preview" />
                  ) : (
                    <AvatarFallback className="bg-[#0089AD] text-white text-xl">
                      {formData.name
                        ? formData.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                        : "?"}
                    </AvatarFallback>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <Upload className="h-8 w-8 text-white" />
                  </div>
                </Avatar>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                id="avatar"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <p className="text-xs text-muted-foreground">
                Click to upload (max 5MB)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                required
              />
            </div>

            {!user && (
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john.doe@example.com"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">
                {user
                  ? "New Password (leave blank to keep current)"
                  : "Password"}
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required={!user}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input
                id="jobTitle"
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleChange}
                placeholder="Product Manager"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={handleRoleChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Organization</Label>
              {isLoading ? (
                <div className="text-sm text-muted-foreground p-2 border rounded-md flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0089AD] mr-2"></div>
                  Loading organizations...
                </div>
              ) : organizations && organizations.length > 0 ? (
                <Select
                  value={formData.organizationId}
                  onValueChange={(value) =>
                    handleOrganizationChange({
                      id: value,
                      name:
                        organizations.find((org) => org.id === value)?.name ||
                        "",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-sm text-muted-foreground p-2 border rounded-md">
                  No organizations available
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Assigned Projects</Label>
              <div className="border rounded-md p-3 max-h-[150px] overflow-y-auto">
                {projects.length > 0 ? (
                  projects.map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center space-x-2 py-1"
                    >
                      <Checkbox
                        id={`project-${project.id}`}
                        checked={selectedProjects.includes(project.id)}
                        onCheckedChange={() => handleProjectToggle(project.id)}
                      />
                      <Label
                        htmlFor={`project-${project.id}`}
                        className="cursor-pointer"
                      >
                        {project.title}
                      </Label>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No projects available
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : user ? "Update User" : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
