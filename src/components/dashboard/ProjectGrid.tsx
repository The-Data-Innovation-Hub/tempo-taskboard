import React, { useState, useEffect, useCallback } from "react";
import ProjectCard from "./ProjectCard";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Search, Filter, Grid3X3, List, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { cn } from "../../lib/utils";
import { projectApi, organizationApi } from "@/lib/api";
import { useToast } from "../ui/use-toast";
import CreateProjectButton from "../home/CreateProjectButton";
import CreateProjectModal from "../modals/CreateProjectModal";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

// Project interface is now imported from api.ts

interface ProjectGridProps {
  projects?: Project[];

  onSelectProject?: (id: string) => void;
  onEditProject?: (id: string) => void;
  onDeleteProject?: (id: string) => void;
}

const ProjectGrid = ({
  projects: initialProjects,
  onSelectProject = () => {},
  onEditProject = () => {},
  onDeleteProject = () => {},
}: ProjectGridProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterStatus, setFilterStatus] = useState<{
    recent: boolean;
    highTasks: boolean;
    lowTasks: boolean;
  }>({ recent: false, highTasks: false, lowTasks: false });
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [organizations, setOrganizations] = useState<{ [key: string]: string }>(
    {},
  );
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch organizations to map IDs to names
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const orgsData = await organizationApi.getAll();
        const orgsMap: { [key: string]: string } = {};
        orgsData.forEach((org) => {
          orgsMap[org.id] = org.name;
        });
        setOrganizations(orgsMap);
      } catch (error) {
        console.error("Error fetching organizations:", error);
      }
    };

    fetchOrganizations();
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log("Fetching projects...");

      let data = [];

      if (!user) {
        console.log("No user found, returning empty projects list");
        setProjects([]);
        setIsLoading(false);
        return;
      }

      // If user is admin, fetch all projects
      if (user.role === "admin") {
        console.log("Admin user - fetching all projects");
        data = await projectApi.getAll();
      } else {
        // For regular users, use a more reliable approach
        console.log(`Regular user ${user.id} - fetching their projects`);
        try {
          // First try to get projects where user is a member via user_projects table
          const { data: memberProjects, error: memberError } = await supabase
            .from("user_projects")
            .select("project_id")
            .eq("user_id", user.id);

          if (memberError) {
            console.error("Error fetching member projects:", memberError);
            throw memberError;
          }

          if (memberProjects && memberProjects.length > 0) {
            // User has project associations, fetch those projects
            const projectIds = memberProjects.map((p) => p.project_id);
            console.log(
              `Found ${projectIds.length} project associations for user`,
            );

            const { data: projectDetails, error: detailsError } = await supabase
              .from("projects")
              .select("*")
              .in("id", projectIds);

            if (detailsError) {
              console.error("Error fetching project details:", detailsError);
              throw detailsError;
            }

            data = projectDetails || [];
          } else {
            // Fallback: Check if user is the creator of any projects
            console.log(
              "No project associations found, checking for created projects",
            );
            const { data: ownedProjects, error: ownedError } = await supabase
              .from("projects")
              .select("*")
              .eq("user_id", user.id);

            if (ownedError) {
              console.error("Error fetching owned projects:", ownedError);
              throw ownedError;
            }

            data = ownedProjects || [];

            // If user has created projects but they're not in user_projects,
            // add them to ensure future queries work correctly
            if (data.length > 0) {
              console.log(
                `Found ${data.length} created projects, ensuring they're in user_projects`,
              );

              // Add user as member of their own projects if not already
              for (const project of data) {
                const { error: insertError } = await supabase
                  .from("user_projects")
                  .insert({
                    user_id: user.id,
                    project_id: project.id,
                  })
                  .onConflict(["user_id", "project_id"])
                  .ignore();

                if (insertError) {
                  console.warn(
                    `Error ensuring project association for ${project.id}:`,
                    insertError,
                  );
                }
              }
            }
          }
        } catch (apiError) {
          console.error("Error fetching user projects:", apiError);

          // Last resort: Try the API method
          console.log("Falling back to API method");
          data = await projectApi.getAll(user.id);
        }
      }

      console.log(`Projects fetched: ${data.length}`);
      setProjects(data);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast({
        title: "Failed to load projects",
        description:
          "There was an error loading your projects. Please try again.",
        variant: "destructive",
      });
      // Use empty array if fetch fails
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast, user, supabase]);

  useEffect(() => {
    // If projects are provided as props, use them
    if (initialProjects) {
      setProjects(initialProjects);
      setIsLoading(false);
      return;
    }

    // Otherwise fetch from API
    fetchProjects();
  }, [initialProjects, fetchProjects]);

  const handleProjectCreated = (newProject: Project) => {
    setProjects([newProject, ...projects]);
  };

  const handleSelectProject = (id: string) => {
    if (onSelectProject) {
      onSelectProject(id);
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      await projectApi.delete(id);
      setProjects(projects.filter((project) => project.id !== id));
      toast({
        title: "Project deleted",
        description: "The project has been successfully deleted.",
      });
      if (onDeleteProject) {
        onDeleteProject(id);
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({
        title: "Failed to delete project",
        description:
          "There was an error deleting the project. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditProject = async (id: string) => {
    console.log("Edit project called with ID:", id);
    try {
      // Fetch the project details
      const projectData = await projectApi.getById(id);
      if (projectData) {
        // Get project users
        const users = await projectApi.getMembers(id);
        const projectWithUsers = { ...projectData, users };

        // Set the project to edit and open the modal
        setEditingProject(projectWithUsers);
        setIsEditModalOpen(true);
      } else {
        toast({
          title: "Project not found",
          description: "The project you're trying to edit could not be found.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching project for editing:", error);
      toast({
        title: "Failed to edit project",
        description: "There was an error loading the project details.",
        variant: "destructive",
      });
    }
  };

  const handleProjectUpdated = (updatedProject: Project) => {
    // Update the project in the list
    setProjects(
      projects.map((project) =>
        project.id === updatedProject.id ? updatedProject : project,
      ),
    );

    // Close the modal
    setIsEditModalOpen(false);
    setEditingProject(null);

    // Show success toast
    toast({
      title: "Project updated",
      description: `Project "${updatedProject.title}" has been updated successfully.`,
    });
  };

  // Get organization name for a project
  const getOrganizationName = (organizationId: string | undefined) => {
    if (!organizationId) return "No Organization";
    return organizations[organizationId] || "Loading...";
  };

  // Filter projects based on search query and filters
  const filteredProjects = projects
    .filter((project) => {
      // Search filter
      if (searchQuery) {
        return (
          project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      return true;
    })
    .filter((project) => {
      // Status filters
      if (
        !filterStatus.recent &&
        !filterStatus.highTasks &&
        !filterStatus.lowTasks
      ) {
        return true; // No filters applied
      }

      const isRecent = project.lastUpdated?.includes("day");
      const isHighTasks = (project.taskCount || 0) > 10;
      const isLowTasks = (project.taskCount || 0) <= 10;

      return (
        (filterStatus.recent && isRecent) ||
        (filterStatus.highTasks && isHighTasks) ||
        (filterStatus.lowTasks && isLowTasks)
      );
    });

  return (
    <div className="bg-white p-6 rounded-xl w-full">
      {/* Header with search and filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search projects..."
              className="pl-10 bg-gray-50 border-gray-100 focus-visible:ring-[#0089AD]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <CreateProjectButton onProjectCreated={handleProjectCreated} />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-end">
          {/* Filter dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                type="button"
              >
                <Filter className="h-4 w-4" />
                <span>Filter</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuCheckboxItem
                checked={filterStatus.recent}
                onCheckedChange={(checked) =>
                  setFilterStatus({
                    ...filterStatus,
                    recent: checked as boolean,
                  })
                }
              >
                Recently Updated
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filterStatus.highTasks}
                onCheckedChange={(checked) =>
                  setFilterStatus({
                    ...filterStatus,
                    highTasks: checked as boolean,
                  })
                }
              >
                High Task Count ({">"}10)
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filterStatus.lowTasks}
                onCheckedChange={(checked) =>
                  setFilterStatus({
                    ...filterStatus,
                    lowTasks: checked as boolean,
                  })
                }
              >
                Low Task Count (≤10)
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View mode toggle */}
          <div className="flex items-center bg-gray-100 rounded-md p-1">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 w-8 p-0",
                viewMode === "grid" && "bg-white shadow-sm",
              )}
              onClick={() => setViewMode("grid")}
              type="button"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 w-8 p-0",
                viewMode === "list" && "bg-white shadow-sm",
              )}
              onClick={() => setViewMode("list")}
              type="button"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Projects grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#0089AD] mb-4" />
          <p className="text-gray-500">Loading projects...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-gray-100 p-3 mb-4">
            <Search className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            No projects found
          </h3>
          <p className="text-gray-500 max-w-md">
            {searchQuery
              ? `No projects match "${searchQuery}". Try a different search term or clear filters.`
              : "Try creating a new project or adjusting your filters."}
          </p>
        </div>
      ) : (
        <div
          className={cn(
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 gap-6"
              : "flex flex-col space-y-4",
          )}
        >
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              id={project.id}
              title={project.title}
              description={project.description}
              lastUpdated={project.lastUpdated}
              memberCount={project.memberCount}
              taskCount={project.taskCount}
              organizationName={getOrganizationName(project.organization_id)}
              onClick={handleSelectProject}
              onEdit={() => handleEditProject(project.id)}
              onDelete={() => handleDeleteProject(project.id)}
            />
          ))}
        </div>
      )}

      {/* Edit Project Modal */}
      {isEditModalOpen && editingProject && (
        <CreateProjectModal
          project={editingProject}
          isEditing={true}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingProject(null);
          }}
          onCreateProject={handleProjectUpdated}
          organizationId={editingProject.organization_id}
        />
      )}
    </div>
  );
};

export default ProjectGrid;
