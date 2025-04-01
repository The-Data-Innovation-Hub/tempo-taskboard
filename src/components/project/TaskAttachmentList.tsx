import React from "react";
import { Button } from "@/components/ui/button";
import { Paperclip, FileText, Image, Download, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

interface TaskAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  createdAt: string;
}

interface TaskAttachmentListProps {
  taskId: string;
  attachments: TaskAttachment[];
  onAttachmentDeleted: (attachmentId: string) => void;
  readOnly?: boolean;
}

const TaskAttachmentList: React.FC<TaskAttachmentListProps> = ({
  taskId,
  attachments = [],
  onAttachmentDeleted,
  readOnly = false,
}) => {
  const { toast } = useToast();

  if (!attachments || attachments.length === 0) {
    return null;
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) {
      return <Image className="h-4 w-4 text-blue-500" />;
    }
    return <FileText className="h-4 w-4 text-blue-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDelete = async (attachment: TaskAttachment) => {
    try {
      // Extract the file path from the URL
      const url = new URL(attachment.url);
      const pathParts = url.pathname.split("/");
      const filePath = pathParts
        .slice(pathParts.indexOf("task_files") + 1)
        .join("/");

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("task_files")
        .remove([filePath]);

      if (storageError) {
        console.error("Error deleting file from storage:", storageError);
        toast({
          title: "Error deleting file",
          description: storageError.message,
          variant: "destructive",
        });
        return;
      }

      // Get current task data with explicit column selection
      const { data: taskData, error: taskError } = await supabase
        .from("tasks")
        .select(
          "id, title, description, column_id, position, created_at, updated_at, is_completed, completed_at, attachments",
        )
        .eq("id", taskId)
        .single();

      if (taskError) {
        console.error("Error fetching task:", taskError);
        toast({
          title: "Error updating task",
          description: "Could not fetch current task data",
          variant: "destructive",
        });
        return;
      }

      // Filter out the deleted attachment
      const updatedAttachments = (taskData?.attachments || []).filter(
        (a: TaskAttachment) => a.id !== attachment.id,
      );

      // Update the task
      console.log("Updating task attachments in TaskAttachmentList:", {
        taskId,
        updatedAttachments,
        operation: "delete",
      });

      try {
        const { error: updateError } = await supabase
          .from("tasks")
          .update({ attachments: updatedAttachments })
          .eq("id", taskId);

        if (updateError) {
          console.error(
            "Error updating task with regular update:",
            updateError,
          );
          // Fallback to RPC call
          const { error: rpcError } = await supabase.rpc(
            "update_task_attachments",
            {
              task_id: taskId,
              attachments_json: JSON.stringify(updatedAttachments),
            },
          );

          if (rpcError) {
            console.error("Error updating task with RPC:", rpcError);
            toast({
              title: "Error updating task",
              description: "Could not update task with attachment changes",
              variant: "destructive",
            });
            return;
          }
        }
      } catch (error) {
        console.error("Error in update attempt:", error);
        toast({
          title: "Error updating task",
          description: "An unexpected error occurred while updating the task",
          variant: "destructive",
        });
        return;
      }

      // Notify parent component
      onAttachmentDeleted(attachment.id);

      toast({
        title: "File deleted",
        description: `${attachment.name} has been deleted.`,
      });
    } catch (error) {
      console.error("Error deleting attachment:", error);
      toast({
        title: "Error deleting file",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="mt-4">
      <div className="flex items-center mb-2">
        <Paperclip className="h-4 w-4 mr-2 text-gray-500" />
        <h4 className="text-sm font-medium text-gray-700">Attachments</h4>
      </div>
      <div className="space-y-2">
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="flex items-center justify-between p-2 bg-gray-50 rounded-md border border-gray-200"
          >
            <div className="flex items-center">
              {getFileIcon(attachment.type)}
              <div className="ml-2">
                <div className="text-sm font-medium text-gray-700 truncate max-w-[200px]">
                  {attachment.name}
                </div>
                <div className="text-xs text-gray-500">
                  {formatFileSize(attachment.size)}
                </div>
              </div>
            </div>
            <div className="flex space-x-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => window.open(attachment.url, "_blank")}
                title="Download"
              >
                <Download className="h-4 w-4 text-gray-500" />
              </Button>
              {!readOnly && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleDelete(attachment)}
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskAttachmentList;
