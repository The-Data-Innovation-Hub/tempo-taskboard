import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import BoardHeader from "@/components/project/BoardHeader";
import KanbanBoard from "@/components/project/KanbanBoard";
import TaskModal from "@/components/modals/TaskModal";
import ColumnModal from "@/components/modals/ColumnModal";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { columnApi, taskApi, projectApi } from "@/lib/api";
import { Loader2 } from "lucide-react";

import { Task, Column } from "@/lib/api";

interface ProjectWithColumns {
  id: string;
  title: string;
  description?: string;
  isFavorite?: boolean;
  columns: Column[];
}

const ProjectPage = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Check if user has access to this project
  useEffect(() => {
    const checkProjectAccess = async () => {
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to view this project",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      // Admin users can access all projects
      if (user.role === "admin") {
        console.log("Admin user - granting access to all projects");
        return;
      }

      try {
        console.log(`Checking if user ${user.id} has access to project ${id}`);

        // First check if the user is a member of this project via user_projects table
        const { data: memberData, error: memberError } = await supabase
          .from("user_projects")
          .select("*")
          .eq("user_id", user.id)
          .eq("project_id", id);

        if (memberError) {
          console.error("Error checking project membership:", memberError);
          // Continue to check if user is the creator
        } else if (memberData && memberData.length > 0) {
          console.log("User is a member of this project - access granted");
          return;
        }

        // If not found in user_projects, check if user is the creator
        const { data: projectData, error: projectError } = await supabase
          .from("projects")
          .select("user_id")
          .eq("id", id)
          .single();

        if (projectError) {
          if (projectError.code === "PGRST116") {
            console.error("Project not found");
            toast({
              title: "Project not found",
              description: "The project you're looking for doesn't exist",
              variant: "destructive",
            });
          } else {
            console.error("Error checking project creator:", projectError);
            toast({
              title: "Error checking access",
              description:
                "There was an error verifying your access to this project",
              variant: "destructive",
            });
          }
          navigate("/");
          return;
        }

        if (projectData && projectData.user_id === user.id) {
          console.log("User is the creator of this project - access granted");

          // Add user to user_projects if they're the creator but not in the table
          console.log("Adding creator to user_projects table");
          const { error: insertError } = await supabase
            .from("user_projects")
            .insert({
              user_id: user.id,
              project_id: id,
            })
            .onConflict(["user_id", "project_id"])
            .ignore();

          if (insertError) {
            console.warn("Error adding creator to user_projects:", insertError);
            // Continue anyway since we've verified they're the creator
          }

          return;
        }

        // If we get here, user doesn't have access
        console.error("User does not have access to this project");
        toast({
          title: "Access denied",
          description: "You do not have permission to view this project",
          variant: "destructive",
        });
        navigate("/");
      } catch (error) {
        console.error("Error checking project access:", error);
        toast({
          title: "Access denied",
          description: "You do not have permission to view this project",
          variant: "destructive",
        });
        navigate("/");
      }
    };

    if (user) {
      checkProjectAccess();
    }
  }, [id, user, navigate, toast, supabase]);

  // State for modals
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [columnModalOpen, setColumnModalOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<{
    columnId: string;
    taskId?: string;
  } | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const [project, setProject] = useState<ProjectWithColumns | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [labels, setLabels] = useState<
    { id: string; name: string; color: string }[]
  >([]);
  const [assignees, setAssignees] = useState<
    { id: string; name: string; avatar: string }[]
  >([]);
  const [columns, setColumns] = useState<Column[]>([]);

  // Fetch project data from Supabase
  useEffect(() => {
    const fetchProjectData = async () => {
      if (!id || !user) return;

      setIsLoading(true);
      try {
        // Fetch project details
        const projectData = await projectApi.getById(id);
        if (!projectData) {
          setError("Project not found");
          setIsLoading(false);
          return;
        }

        // Fetch columns and tasks
        try {
          let columnsData = await columnApi.getByProjectId(id);

          // No longer creating default columns automatically
          // If no columns exist, we'll just show an empty board
          if (!columnsData || columnsData.length === 0) {
            console.log(
              "No columns found. Admin will need to create columns manually.",
            );
            columnsData = [];

            // Show a toast notification to guide the admin
            if (user?.role === "admin") {
              toast({
                title: "No columns found",
                description:
                  "Click 'Add Column' to create columns for this project board.",
                duration: 5000,
              });
            } else {
              toast({
                title: "No columns found",
                description:
                  "This project has no columns yet. Please contact an admin to set up the board.",
                duration: 5000,
              });
            }
          }

          // For each column, fetch its tasks
          const columnsWithTasks = await Promise.all(
            columnsData.map(async (column) => {
              try {
                const tasks = await taskApi.getByColumnId(column.id);
                return {
                  ...column,
                  tasks: tasks || [],
                };
              } catch (taskError) {
                console.error(
                  `Error fetching tasks for column ${column.id}:`,
                  taskError,
                );
                return {
                  ...column,
                  tasks: [],
                };
              }
            }),
          );

          setColumns(columnsWithTasks);

          // Create a project object with columns for the UI
          const projectWithColumns: ProjectWithColumns = {
            ...projectData,
            columns: columnsWithTasks,
          };

          setProject(projectWithColumns);
        } catch (columnsError) {
          console.error("Error fetching columns:", columnsError);
          // Continue with empty columns
          setColumns([]);
          setProject({
            ...projectData,
            columns: [],
          } as ProjectWithColumns);
        }
      } catch (error) {
        console.error("Error fetching project data:", error);
        setError("Failed to load project data");
      } finally {
        setIsLoading(false);
      }
    };

    const fetchLabelsAndAssignees = async () => {
      try {
        // Fetch labels from Supabase - handle missing table gracefully
        try {
          const { data: labelsData, error: labelsError } = await supabase
            .from("labels")
            .select("*");

          if (labelsError) {
            // Check if it's a missing table error
            if (
              labelsError.code === "42P01" &&
              labelsError.message.includes(
                'relation "public.labels" does not exist',
              )
            ) {
              console.warn(
                "Labels table doesn't exist yet. Using default labels.",
              );
              // Use default labels
              setLabels([
                { id: "1", name: "Bug", color: "#ff5252" },
                { id: "2", name: "Feature", color: "#4caf50" },
                { id: "3", name: "Enhancement", color: "#2196f3" },
                { id: "4", name: "Documentation", color: "#ff9800" },
                { id: "5", name: "Design", color: "#9c27b0" },
              ]);
            } else {
              console.warn("Error fetching labels:", labelsError);
              // Use default labels
              setLabels([
                { id: "1", name: "Bug", color: "#ff5252" },
                { id: "2", name: "Feature", color: "#4caf50" },
                { id: "3", name: "Enhancement", color: "#2196f3" },
                { id: "4", name: "Documentation", color: "#ff9800" },
                { id: "5", name: "Design", color: "#9c27b0" },
              ]);
            }
          } else {
            setLabels(labelsData || []);
          }
        } catch (error) {
          console.error("Exception fetching labels:", error);
          // Use default labels
          setLabels([
            { id: "1", name: "Bug", color: "#ff5252" },
            { id: "2", name: "Feature", color: "#4caf50" },
            { id: "3", name: "Enhancement", color: "#2196f3" },
            { id: "4", name: "Documentation", color: "#ff9800" },
            { id: "5", name: "Design", color: "#9c27b0" },
          ]);
        }

        // Fetch assignees from Supabase
        const { data: assigneesData, error: assigneesError } = await supabase
          .from("profiles")
          .select("id, name, avatar");

        if (assigneesError) {
          console.warn("Error fetching assignees:", assigneesError);
          // Use default assignees
          setAssignees([
            {
              id: "1",
              name: "Admin User",
              avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
            },
            {
              id: "2",
              name: "Regular User",
              avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user",
            },
            {
              id: "3",
              name: "John Doe",
              avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=john",
            },
            {
              id: "4",
              name: "Jane Smith",
              avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=jane",
            },
          ]);
        } else {
          setAssignees(assigneesData || []);
        }
      } catch (error) {
        console.error("Error fetching labels and assignees:", error);
        // Use default data
        setLabels([
          { id: "1", name: "Bug", color: "#ff5252" },
          { id: "2", name: "Feature", color: "#4caf50" },
          { id: "3", name: "Enhancement", color: "#2196f3" },
          { id: "4", name: "Documentation", color: "#ff9800" },
          { id: "5", name: "Design", color: "#9c27b0" },
        ]);
      }
    };

    if (id && user) {
      fetchProjectData();
      fetchLabelsAndAssignees();
    }
  }, [id, user]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {isLoading ? (
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading project...</span>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600">Error</h2>
            <p className="mt-2">{error}</p>
          </div>
        </div>
      ) : (
        <>
          <BoardHeader
            projectTitle={project?.title || "Project"}
            onAddColumn={() => setColumnModalOpen(true)}
          />
          <KanbanBoard
            projectId={id}
            columns={columns}
            onAddTask={(columnId) => {
              setActiveTask({ columnId });
              setTaskModalOpen(true);
            }}
            onEditTask={(columnId, taskId) => {
              setActiveTask({ columnId, taskId });
              setTaskModalOpen(true);
            }}
          />

          {activeTask && (
            <TaskModal
              open={taskModalOpen}
              onOpenChange={setTaskModalOpen}
              columnId={activeTask.columnId}
              taskId={activeTask.taskId}
              labels={labels}
              assignees={assignees}
              onClose={() => {
                setTaskModalOpen(false);
                setActiveTask(null);
              }}
            />
          )}

          {columnModalOpen && (
            <ColumnModal
              open={columnModalOpen}
              onOpenChange={setColumnModalOpen}
              projectId={id || ""}
              onClose={() => setColumnModalOpen(false)}
            />
          )}
        </>
      )}
    </div>
  );
};

export default ProjectPage;
