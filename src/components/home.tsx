import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell, TrendingUp, TrendingDown, Minus } from "lucide-react";
import TaskAnalytics from "./analytics/TaskAnalytics";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useToast } from "./ui/use-toast";
import ProjectGrid from "./dashboard/ProjectGrid";
import NeumorphicContainer from "./common/NeumorphicContainer";
import CreateProjectModal from "./modals/CreateProjectModal";
import UserInfo from "./layout/UserInfo";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { projectApi } from "@/lib/api";

const Home = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState<any>(null);
  const dashboardData = useDashboardData();
  // State for projects data
  const [projectsData, setProjectsData] = useState<any[]>([]);
  const [taskAnalyticsData, setTaskAnalyticsData] = useState({
    backlog: 0,
    inProgress: 0,
    completed: 0,
    total: 0,
  });
  const [completionData, setCompletionData] = useState({
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 2,
    fri: 1,
    sat: 0,
    sun: 0,
  });

  // We're now calculating task analytics directly in the fetchProjects function
  // to ensure it's based on the user's projects only

  const { user } = useAuth();

  // Fetch projects based on user role
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        // Use the projectApi to get projects filtered by user ID
        const projects = await projectApi.getAll(user?.id);
        console.log("Fetched projects for user:", user?.id, projects);

        // Format the projects data
        const formattedProjects = projects.map((project: any) => ({
          id: project.id,
          title: project.title || project.name,
          description: project.description,
          lastUpdated:
            project.lastUpdated ||
            new Date(project.updated_at).toLocaleDateString(),
          memberCount: project.memberCount || project.member_count || 0,
          taskCount: project.taskCount || project.task_count || 0,
        }));

        // Set the projects data to only include the user's projects
        setProjectsData(formattedProjects);
        console.log(
          "Setting projectsData to:",
          formattedProjects.length,
          "projects",
        );

        // Update dashboard data to reflect only the user's projects
        setTaskAnalyticsData({
          backlog: Math.floor(
            formattedProjects.reduce(
              (sum, project) => sum + (project.taskCount || 0),
              0,
            ) * 0.4,
          ),
          inProgress: Math.floor(
            formattedProjects.reduce(
              (sum, project) => sum + (project.taskCount || 0),
              0,
            ) * 0.35,
          ),
          completed: Math.floor(
            formattedProjects.reduce(
              (sum, project) => sum + (project.taskCount || 0),
              0,
            ) * 0.25,
          ),
          total: formattedProjects.reduce(
            (sum, project) => sum + (project.taskCount || 0),
            0,
          ),
        });
      } catch (error) {
        console.error("Error fetching projects:", error);
        toast({
          title: "Error",
          description: "Failed to load projects. Please try again.",
          variant: "destructive",
        });

        // Fallback to mock data if API fails - limit to 2 projects for regular users
        const mockProjects = [
          {
            id: "project-1",
            title: "Marketing Campaign",
            description:
              "Q3 marketing initiatives including social media, email campaigns, and content creation.",
            lastUpdated: "2 days ago",
            memberCount: 5,
            taskCount: 12,
          },
          {
            id: "project-2",
            title: "Website Redesign",
            description:
              "Complete overhaul of the company website with focus on user experience and conversion optimization.",
            lastUpdated: "5 days ago",
            memberCount: 3,
            taskCount: 8,
          },
        ];

        // Always use only the user's projects (2 for this mock case)
        setProjectsData(mockProjects);
        console.log(
          "Setting mock projectsData to:",
          mockProjects.length,
          "projects",
        );

        // Update task analytics with mock data
        setTaskAnalyticsData({
          backlog: Math.floor(
            mockProjects.reduce(
              (sum, project) => sum + (project.taskCount || 0),
              0,
            ) * 0.4,
          ),
          inProgress: Math.floor(
            mockProjects.reduce(
              (sum, project) => sum + (project.taskCount || 0),
              0,
            ) * 0.35,
          ),
          completed: Math.floor(
            mockProjects.reduce(
              (sum, project) => sum + (project.taskCount || 0),
              0,
            ) * 0.25,
          ),
          total: mockProjects.reduce(
            (sum, project) => sum + (project.taskCount || 0),
            0,
          ),
        });
      }
    };

    if (user) {
      fetchProjects();
    }
  }, [user, toast]);

  const handleEditProject = (id: string) => {
    const projectToEdit = projectsData.find((project) => project.id === id);
    if (projectToEdit) {
      setCurrentProject(projectToEdit);
      setIsEditModalOpen(true);
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      // Delete the project from Supabase
      const { error } = await supabase.from("projects").delete().eq("id", id);

      if (error) throw error;

      // Update local state
      const updatedProjects = projectsData.filter(
        (project) => project.id !== id,
      );
      setProjectsData(updatedProjects);

      toast({
        title: "Project Deleted",
        description: "The project has been successfully deleted.",
      });
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete the project. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleProjectUpdated = async (projectData: any) => {
    setIsEditModalOpen(false);

    try {
      // Update the project in Supabase
      const { error } = await supabase
        .from("projects")
        .update({
          name: projectData.title,
          description: projectData.description,
          updated_at: new Date().toISOString(),
        })
        .eq("id", projectData.id);

      if (error) throw error;

      // Update local state
      setProjectsData((prev) =>
        prev.map((project) =>
          project.id === projectData.id
            ? {
                ...project,
                title: projectData.title,
                description: projectData.description,
                lastUpdated: "Just now",
                // Preserve the task count when updating a project
                taskCount: project.taskCount || 0,
              }
            : project,
        ),
      );

      toast({
        title: "Project Updated",
        description: `${projectData.title} has been successfully updated.`,
      });
    } catch (error) {
      console.error("Error updating project:", error);
      toast({
        title: "Update Failed",
        description: "Failed to update the project. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSelectProject = (id: string) => {
    navigate(`/project/${id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-[#0089AD] mr-8">
              TaskBoard
            </h1>
            <div className="hidden md:flex relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search..."
                className="pl-10 w-64 bg-gray-50 border-gray-100 focus-visible:ring-[#0089AD]"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <NeumorphicContainer
              className="p-2"
              rounded="full"
              elevation="low"
              interactive
            >
              <Bell className="h-5 w-5 text-gray-600" />
            </NeumorphicContainer>

            <UserInfo />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h2>
          <p className="text-gray-600">
            {user?.role === "admin"
              ? "Overview of all projects in the platform"
              : "Overview of your assigned projects"}
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <NeumorphicContainer className="p-6">
            <div className="flex flex-col">
              <span className="text-gray-500 text-sm font-medium">
                Total Projects
              </span>
              {dashboardData.isLoading ? (
                <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mt-2"></div>
              ) : (
                <span className="text-3xl font-bold text-gray-800 mt-2">
                  {projectsData.length}
                </span>
              )}
              <div className="flex items-center mt-2 text-green-600">
                {dashboardData.projectsGrowth > 0 ? (
                  <TrendingUp className="w-4 h-4 mr-1" />
                ) : dashboardData.projectsGrowth < 0 ? (
                  <TrendingDown className="w-4 h-4 mr-1" />
                ) : (
                  <Minus className="w-4 h-4 mr-1" />
                )}
                <span className="text-sm">
                  {Math.abs(dashboardData.projectsGrowth)}% from last month
                </span>
              </div>
            </div>
          </NeumorphicContainer>

          <NeumorphicContainer className="p-6">
            <div className="flex flex-col">
              <span className="text-gray-500 text-sm font-medium">
                Total Tasks
              </span>
              {dashboardData.isLoading ? (
                <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mt-2"></div>
              ) : (
                <span className="text-3xl font-bold text-gray-800 mt-2">
                  {dashboardData.totalTasks}
                </span>
              )}
              <div className="flex items-center mt-2 text-green-600">
                {dashboardData.tasksGrowth > 0 ? (
                  <TrendingUp className="w-4 h-4 mr-1" />
                ) : dashboardData.tasksGrowth < 0 ? (
                  <TrendingDown className="w-4 h-4 mr-1" />
                ) : (
                  <Minus className="w-4 h-4 mr-1" />
                )}
                <span className="text-sm">
                  {Math.abs(dashboardData.tasksGrowth)}% from last month
                </span>
              </div>
            </div>
          </NeumorphicContainer>

          <NeumorphicContainer className="p-6">
            <div className="flex flex-col">
              <span className="text-gray-500 text-sm font-medium">
                Completed Tasks
              </span>
              {dashboardData.isLoading ? (
                <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mt-2"></div>
              ) : (
                <span className="text-3xl font-bold text-gray-800 mt-2">
                  {dashboardData.completedTasks}
                </span>
              )}
              <div className="flex items-center mt-2 text-green-600">
                {dashboardData.completedTasksGrowth > 0 ? (
                  <TrendingUp className="w-4 h-4 mr-1" />
                ) : dashboardData.completedTasksGrowth < 0 ? (
                  <TrendingDown className="w-4 h-4 mr-1" />
                ) : (
                  <Minus className="w-4 h-4 mr-1" />
                )}
                <span className="text-sm">
                  {Math.abs(dashboardData.completedTasksGrowth)}% from last
                  month
                </span>
              </div>
            </div>
          </NeumorphicContainer>

          <NeumorphicContainer className="p-6">
            <div className="flex flex-col">
              <span className="text-gray-500 text-sm font-medium">
                Team Members
              </span>
              {dashboardData.isLoading ? (
                <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mt-2"></div>
              ) : (
                <span className="text-3xl font-bold text-gray-800 mt-2">
                  {dashboardData.teamMembers}
                </span>
              )}
              <div className="flex items-center mt-2 text-yellow-600">
                {dashboardData.teamMembersGrowth > 0 ? (
                  <TrendingUp className="w-4 h-4 mr-1" />
                ) : dashboardData.teamMembersGrowth < 0 ? (
                  <TrendingDown className="w-4 h-4 mr-1" />
                ) : (
                  <Minus className="w-4 h-4 mr-1" />
                )}
                <span className="text-sm">
                  {dashboardData.teamMembersGrowth === 0
                    ? "No change"
                    : `${Math.abs(dashboardData.teamMembersGrowth)}% from last month`}
                </span>
              </div>
            </div>
          </NeumorphicContainer>
        </div>

        {/* Task Analytics */}
        <TaskAnalytics
          projectId="all"
          taskData={taskAnalyticsData}
          completionData={completionData}
        />
      </main>

      {/* Edit Project Modal */}
      {isEditModalOpen && currentProject && (
        <CreateProjectModal
          project={currentProject}
          isEditing={true}
          onClose={() => setIsEditModalOpen(false)}
          onCreateProject={handleProjectUpdated}
        />
      )}
    </div>
  );
};

export default Home;
