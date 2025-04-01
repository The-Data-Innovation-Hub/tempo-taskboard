import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MoreHorizontal,
  Calendar,
  MessageSquare,
  CheckCircle2,
  Clock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TaskLabel {
  id: string;
  name: string;
  color: string;
}

interface TaskAssignee {
  id: string;
  name: string;
  avatar?: string;
}

export interface TaskCardProps {
  id?: string;
  title?: string;
  description?: string;
  labels?: TaskLabel[];
  dueDate?: string;
  assignees?: TaskAssignee[];
  commentsCount?: number;
  isCompleted?: boolean;
  completedAt?: string;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onView?: (id: string) => void;
  canEdit?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({
  id = "task-1",
  title = "Sample Task",
  description = "This is a sample task description. Click to view more details.",
  labels = [
    { id: "1", name: "Bug", color: "#ff5252" },
    { id: "2", name: "Feature", color: "#4caf50" },
  ],
  dueDate = "2023-12-31",
  assignees = [
    { id: "1", name: "John Doe", avatar: undefined },
    { id: "2", name: "Jane Smith", avatar: undefined },
  ],
  commentsCount = 3,
  isCompleted = false,
  completedAt,
  onEdit = () => {},
  onDelete = () => {},
  onView = () => {},
  canEdit = true,
}) => {
  // Format the due date to a more readable format
  const formattedDate = new Date(dueDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  // Format the completed date if available
  const formattedCompletedDate = completedAt
    ? new Date(completedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onView(id);
  };

  return (
    <Card
      className={`w-full max-w-[280px] bg-white rounded-xl p-4 cursor-grab transition-all duration-300 hover:shadow-lg active:cursor-grabbing overflow-hidden group ${isCompleted ? "bg-opacity-80" : ""}`}
      style={{
        boxShadow: "8px 8px 16px #e6e6e6, -8px -8px 16px #ffffff",
        border: "1px solid rgba(0, 137, 173, 0.1)",
        background: isCompleted
          ? "linear-gradient(145deg, #ffe5e5, #ffcccc)"
          : "linear-gradient(145deg, #ffffff, #f5f9fa)",
        position: "relative",
      }}
      onClick={handleCardClick}
    >
      {/* Decorative elements */}
      <div className="absolute -top-10 -right-10 w-20 h-20 rounded-full bg-[#0089AD]/10 group-hover:bg-[#0089AD]/20 transition-all duration-500"></div>
      <div className="absolute -bottom-12 -left-12 w-24 h-24 rounded-full bg-[#0089AD]/5 group-hover:bg-[#0089AD]/15 transition-all duration-500 group-hover:scale-110"></div>
      <div className="absolute top-1/2 right-0 w-2 h-20 bg-gradient-to-b from-transparent via-[#0089AD]/20 to-transparent transform -translate-y-1/2 group-hover:h-24 transition-all duration-500"></div>
      <div className="flex flex-col gap-3 relative z-10">
        {/* Task Title */}
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-2">
            {isCompleted && (
              <CheckCircle2
                size={16}
                className="text-green-500 mt-1 flex-shrink-0"
              />
            )}
            <h3
              className={`font-medium line-clamp-2 group-hover:text-[#0089AD] transition-colors duration-300 ${isCompleted ? "text-gray-600" : "text-gray-900"}`}
            >
              {title}
            </h3>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-1 rounded-full hover:bg-gray-100"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal size={16} className="text-gray-500" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canEdit ? (
                <>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(id);
                    }}
                  >
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(id);
                    }}
                  >
                    Delete
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onView(id);
                  }}
                >
                  View Details
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Task Description */}
        <p
          className={`text-sm line-clamp-2 group-hover:text-gray-700 transition-colors duration-300 ${isCompleted ? "text-gray-500" : "text-gray-600"}`}
        >
          {description}
        </p>

        {/* Completed Date (if completed) */}
        {isCompleted && formattedCompletedDate && (
          <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
            <Clock size={14} className="mr-1" />
            Completed: {formattedCompletedDate}
          </div>
        )}

        {/* Task Labels */}
        {labels && labels.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {labels.map((label) => (
              <Badge
                key={label.id}
                style={{
                  backgroundColor: label.color,
                  color: "#fff",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}
                className="px-2 py-0.5 text-xs font-medium rounded-full transform transition-all duration-300 group-hover:scale-105 hover:scale-110"
              >
                {label.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Task Footer */}
        <div className="flex justify-between items-center mt-2">
          {/* Due Date */}
          <div className="flex items-center text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full transition-all duration-300 group-hover:bg-gray-100">
            <Calendar
              size={14}
              className="mr-1 text-[#0089AD] group-hover:text-[#006d8a] transition-colors duration-300"
            />
            {formattedDate}
          </div>

          {/* Comments Count */}
          <div className="flex items-center text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full transition-all duration-300 group-hover:bg-gray-100">
            <MessageSquare
              size={14}
              className="mr-1 text-[#0089AD] group-hover:text-[#006d8a] transition-colors duration-300"
            />
            {commentsCount}
          </div>
        </div>

        {/* Assignees */}
        {assignees && assignees.length > 0 && (
          <div className="flex -space-x-2 mt-2 relative">
            <div className="absolute -left-1 -top-1 w-3 h-3 bg-[#0089AD]/10 rounded-full animate-pulse"></div>
            <TooltipProvider>
              {assignees.map((assignee) => (
                <Tooltip key={assignee.id}>
                  <TooltipTrigger asChild>
                    <Avatar className="h-6 w-6 border-2 border-white transform transition-all duration-300 hover:scale-110 hover:border-[#0089AD]/30 hover:z-10">
                      {assignee.avatar ? (
                        <AvatarImage
                          src={assignee.avatar}
                          alt={assignee.name}
                        />
                      ) : (
                        <AvatarFallback className="bg-[#0089AD] text-white text-xs group-hover:bg-gradient-to-br group-hover:from-[#0089AD] group-hover:to-[#006d8a] transition-all duration-500">
                          {assignee.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>{assignee.name}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
          </div>
        )}
      </div>
    </Card>
  );
};

export default TaskCard;
