import React from "react";
import { Card } from "../ui/card";
import { Clock, Users, Edit, Trash2, Building } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

interface ProjectCardProps {
  id?: string;
  title?: string;
  description?: string;
  lastUpdated?: string;
  memberCount?: number;
  taskCount?: number;
  organizationName?: string;
  onClick?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const ProjectCard = ({
  id = "project-1",
  title = "Marketing Campaign",
  description = "Q3 marketing initiatives including social media, email campaigns, and content creation.",
  lastUpdated = "2 days ago",
  memberCount = 5,
  taskCount = 12,
  organizationName,
  onClick = (id) => console.log("Project card clicked", id),
  onEdit = (id) => console.log("Edit project", id),
  onDelete = (id) => console.log("Delete project", id),
}: ProjectCardProps) => {
  const handleClick = () => {
    onClick(id);
    // Let the Link component handle the navigation
  };

  return (
    <Link
      to={`/project/${id}`}
      className="block cursor-pointer transition-all duration-300 hover:translate-y-[-5px] hover:rotate-[0.5deg]"
      onClick={(e) => {
        // Don't prevent default - allow Link to handle navigation
        handleClick();
      }}
    >
      <div className="bg-gradient-to-br from-blue-50 via-white to-cyan-50 rounded-xl p-6 shadow-neumorphic-flat hover:shadow-neumorphic-hover transition-all duration-300 border-l-4 border-brand overflow-hidden relative group">
        <div className="absolute -right-12 -top-12 w-24 h-24 bg-brand/10 rounded-full group-hover:scale-150 transition-all duration-500"></div>
        <div className="absolute -left-4 -bottom-4 w-16 h-16 bg-brand/5 rounded-full group-hover:scale-150 transition-all duration-700"></div>
        <div className="mb-4">
          <h3 className="text-xl font-semibold text-brand-dark truncate relative z-10 group-hover:text-brand transition-colors duration-300">
            {title}
          </h3>
          {organizationName && (
            <div className="flex items-center text-xs text-gray-500 mt-1">
              <Building className="h-3 w-3 mr-1" />
              <span className="truncate">{organizationName}</span>
            </div>
          )}
        </div>

        <p className="text-gray-600 text-sm mb-6 line-clamp-3 relative z-10 group-hover:text-gray-700 transition-colors duration-300">
          {description}
        </p>

        <div className="flex justify-between items-center relative z-10">
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-brand-dark text-xs">
              <Clock className="h-4 w-4 mr-1" />
              <span>{lastUpdated}</span>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center text-brand-dark text-xs cursor-help">
                    <Users className="h-4 w-4 mr-1" />
                    <span>{memberCount}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {memberCount} {memberCount === 1 ? "user" : "users"} linked
                    to this project
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="flex items-center space-x-2">
            <div className="bg-brand text-white text-xs font-medium px-2 py-1 rounded-full shadow-neumorphic-pressed transform group-hover:scale-110 transition-transform duration-300">
              {taskCount} {taskCount === 1 ? "task" : "tasks"}
            </div>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full bg-gray-100 hover:bg-gray-200 hover:scale-110 transition-transform duration-200"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log("Edit button clicked for project:", id);
                      onEdit(id);
                    }}
                  >
                    <Edit className="h-3.5 w-3.5 text-gray-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit project</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full bg-gray-100 hover:bg-red-100 hover:scale-110 transition-transform duration-200"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDelete(id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-gray-600 hover:text-red-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete project</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProjectCard;
