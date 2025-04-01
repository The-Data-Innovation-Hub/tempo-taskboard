import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { projectApi, userApi, taskApi, columnApi } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

interface DashboardData {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  teamMembers: number;
  projectsGrowth: number;
  tasksGrowth: number;
  completedTasksGrowth: number;
  teamMembersGrowth: number;
  taskCompletionByDay: {
    day: string;
    percentage: number;
  }[];
  taskDistribution: {
    status: string;
    count: number;
    percentage: number;
    color: string;
  }[];
  isLoading: boolean;
  error: string | null;
}

export function useDashboardData(): DashboardData {
  const [data, setData] = useState<DashboardData>({
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    teamMembers: 0,
    projectsGrowth: 0,
    tasksGrowth: 0,
    completedTasksGrowth: 0,
    teamMembersGrowth: 0,
    taskCompletionByDay: [],
    taskDistribution: [],
    isLoading: true,
    error: null,
  });
  const { toast } = useToast();

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Fetch projects count
        let projects = [];
        try {
          projects = await projectApi.getAll();
        } catch (error) {
          console.error("Error fetching projects:", error);
        }

        // Fetch team members count
        let members = [];
        try {
          members = await userApi.getAll();
        } catch (error) {
          console.error("Error fetching team members:", error);
        }

        // Initialize task counters
        let totalTasksCount = 0;
        let completedTasksCount = 0;
        let tasksByStatus: Record<string, number> = {
          Backlog: 0,
          "In Progress": 0,
          Completed: 0,
        };

        // Fetch tasks for each project and count by status
        for (const project of projects) {
          try {
            const columns = await columnApi.getByProjectId(project.id);

            for (const column of columns) {
              const tasks = await taskApi.getByColumnId(column.id);
              totalTasksCount += tasks.length;

              // Count completed tasks (assuming columns with 'complete' in the title contain completed tasks)
              if (column.title.toLowerCase().includes("complete")) {
                completedTasksCount += tasks.length;
                tasksByStatus["Completed"] += tasks.length;
              } else if (column.title.toLowerCase().includes("backlog")) {
                tasksByStatus["Backlog"] += tasks.length;
              } else {
                tasksByStatus["In Progress"] += tasks.length;
              }
            }
          } catch (error) {
            console.error(
              `Error fetching tasks for project ${project.id}:`,
              error,
            );
          }
        }

        // Calculate task distribution percentages
        const taskDistribution = Object.entries(tasksByStatus).map(
          ([status, count]) => {
            const percentage =
              totalTasksCount > 0
                ? Math.round((count / totalTasksCount) * 100)
                : 0;
            let color = "#0089AD"; // Default color

            if (status === "Backlog") color = "#0089AD";
            else if (status === "In Progress") color = "#38BDF8";
            else if (status === "Completed") color = "#A78BFA";

            return { status, count, percentage, color };
          },
        );

        // Generate mock task completion data by day of week
        const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const taskCompletionByDay = days.map((day) => {
          // Generate a percentage between 15% and 75%
          const percentage = Math.floor(Math.random() * (75 - 15 + 1) + 15);
          return { day, percentage };
        });

        // Set the dashboard data
        setData({
          totalProjects: projects.length,
          totalTasks: totalTasksCount,
          completedTasks: completedTasksCount,
          teamMembers: members.length,
          projectsGrowth: 12, // Mock growth data for now
          tasksGrowth: 8,
          completedTasksGrowth: 15,
          teamMembersGrowth: 0,
          taskCompletionByDay,
          taskDistribution,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setData((prev) => ({
          ...prev,
          isLoading: false,
          error: "Failed to load dashboard data. Please try again.",
        }));

        toast({
          title: "Error loading dashboard",
          description: "There was a problem loading the dashboard data.",
          variant: "destructive",
        });
      }
    }

    fetchDashboardData();
  }, [toast]);

  return data;
}
