import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  MoreHorizontal,
  Plus,
  Users,
  Settings,
  Star,
  Trash2,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";

interface BoardHeaderProps {
  projectId?: string;
  projectTitle?: string;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onAddColumn?: () => void;
  onInviteMembers?: () => void;
  onOpenSettings?: () => void;
}

const BoardHeader = ({
  projectId = "1",
  projectTitle = "Project Management Board",
  isFavorite = false,
  onToggleFavorite = () => {},
  onAddColumn = () => {},
  onInviteMembers = () => {},
  onOpenSettings = () => {},
}: BoardHeaderProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  const handleBackToProjects = () => {
    navigate("/projects");
  };

  const handleToggleFavorite = async () => {
    try {
      // Call the API to toggle favorite status
      const { projectApi } = await import("@/lib/api");
      await projectApi.toggleFavorite(projectId);
      // Then call the callback to update UI
      onToggleFavorite();
    } catch (error) {
      console.error("Error toggling favorite status:", error);
    }
  };

  const handleDeleteProject = async () => {
    try {
      // Close the dialog first
      setDeleteDialogOpen(false);

      // Show loading toast
      toast({
        title: "Deleting project",
        description: "Please wait while we delete the project...",
      });

      // Call the API to delete the project
      const { projectApi } = await import("@/lib/api");
      await projectApi.delete(projectId);

      // Show success toast
      toast({
        title: "Project deleted",
        description: `Project "${projectTitle}" has been deleted successfully.`,
      });

      // Navigate back to projects page
      navigate("/projects");
    } catch (error) {
      console.error("Error deleting project:", error);

      // Show error toast
      toast({
        title: "Error deleting project",
        description:
          "There was an error deleting the project. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <header className="w-full bg-white border-b border-gray-200">
        <div className="max-w-[1512px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBackToProjects}
              className="rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </Button>

            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-gray-900">
                {projectTitle}
              </h1>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleToggleFavorite}
                      className="rounded-full hover:bg-gray-100"
                    >
                      <Star
                        className={cn(
                          "h-5 w-5",
                          isFavorite
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-400",
                        )}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {isFavorite
                        ? "Remove from favorites"
                        : "Add to favorites"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-md border-gray-300 shadow-sm hover:bg-gray-50"
                      >
                        <MoreHorizontal className="h-4 w-4 text-gray-700" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>More options</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={onOpenSettings}
                  className="cursor-pointer"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  <span>Board settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeleteDialogOpen(true)}
                  className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  <span>Delete project</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Delete Project Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete this project?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              project "{projectTitle}" and all of its data including tasks,
              columns, and assignments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default BoardHeader;
