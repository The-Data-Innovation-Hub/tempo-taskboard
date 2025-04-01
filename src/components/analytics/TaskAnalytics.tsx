import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import NeumorphicContainer from "@/components/common/NeumorphicContainer";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
);

interface TaskAnalyticsProps {
  projectId?: string;
  taskData?: {
    backlog: number;
    inProgress: number;
    completed: number;
    total: number;
  };
  completionData?: {
    mon: number;
    tue: number;
    wed: number;
    thu: number;
    fri: number;
    sat: number;
    sun: number;
  };
}

const TaskAnalytics: React.FC<TaskAnalyticsProps> = ({
  projectId,
  taskData = {
    backlog: 2,
    inProgress: 3,
    completed: 0,
    total: 5,
  },
  completionData = {
    mon: 0,
    tue: 0,
    wed: 0,
    thu: 0,
    fri: 0,
    sat: 0,
    sun: 0,
  },
}) => {
  // Calculate percentages for the distribution chart
  const backlogPercentage = Math.round(
    (taskData.backlog / taskData.total) * 100,
  );
  const inProgressPercentage = Math.round(
    (taskData.inProgress / taskData.total) * 100,
  );
  const completedPercentage = Math.round(
    (taskData.completed / taskData.total) * 100,
  );

  // Generate the completion rate chart data
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const maxCompletionValue = Math.max(
    ...Object.values(completionData),
    1, // Ensure we have at least a height of 1 for the chart
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      {/* Task Completion Rate Chart */}
      <NeumorphicContainer className="p-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">
          Task Completion Rate
        </h3>
        <div className="h-[200px]">
          <Bar
            data={{
              labels: days,
              datasets: [
                {
                  label: "Tasks Completed",
                  data: days.map(
                    (day) =>
                      completionData[
                        day.toLowerCase() as keyof typeof completionData
                      ] || 0,
                  ),
                  backgroundColor: "#0089AD",
                  borderRadius: 4,
                  barThickness: 20,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false,
                },
                tooltip: {
                  backgroundColor: "#f3f4f6",
                  titleColor: "#1f2937",
                  bodyColor: "#4b5563",
                  borderColor: "#e5e7eb",
                  borderWidth: 1,
                  padding: 10,
                  displayColors: false,
                  callbacks: {
                    label: function (context) {
                      return `${context.parsed.y} tasks completed`;
                    },
                  },
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    precision: 0,
                    color: "#6b7280",
                  },
                  grid: {
                    display: true,
                    color: "#e5e7eb",
                  },
                },
                x: {
                  ticks: {
                    color: "#6b7280",
                  },
                  grid: {
                    display: false,
                  },
                },
              },
            }}
          />
        </div>
      </NeumorphicContainer>

      {/* Task Distribution Chart */}
      <NeumorphicContainer className="p-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">
          Task Distribution
        </h3>
        <div className="flex justify-center items-center h-[200px]">
          <div className="w-[180px] h-[180px] relative">
            <Doughnut
              data={{
                labels: ["Backlog", "In Progress", "Completed"],
                datasets: [
                  {
                    data: [
                      taskData.backlog,
                      taskData.inProgress,
                      taskData.completed,
                    ],
                    backgroundColor: ["#0089AD", "#60a5fa", "#a78bfa"],
                    borderWidth: 0,
                    cutout: "70%",
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                  legend: {
                    display: false,
                  },
                  tooltip: {
                    backgroundColor: "#f3f4f6",
                    titleColor: "#1f2937",
                    bodyColor: "#4b5563",
                    borderColor: "#e5e7eb",
                    borderWidth: 1,
                    padding: 10,
                    callbacks: {
                      label: function (context) {
                        const label = context.label || "";
                        const value = context.raw as number;
                        const percentage = Math.round(
                          (value / taskData.total) * 100,
                        );
                        return `${label}: ${value} (${percentage}%)`;
                      },
                    },
                  },
                },
              }}
            />
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-2xl font-bold">{taskData.total}</span>
              <span className="text-sm text-gray-500">Tasks</span>
            </div>
          </div>

          {/* Legend */}
          <div className="ml-6 space-y-2">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-[#0089AD] mr-2"></div>
              <span className="text-sm">Backlog ({backlogPercentage}%)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-[#60a5fa] mr-2"></div>
              <span className="text-sm">
                In Progress ({inProgressPercentage}%)
              </span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-[#a78bfa] mr-2"></div>
              <span className="text-sm">
                Completed ({completedPercentage}%)
              </span>
            </div>
          </div>
        </div>
      </NeumorphicContainer>
    </div>
  );
};

export default TaskAnalytics;
