import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Upload } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface FileUploadButtonProps {
  taskId: string;
  onFileUploaded?: (fileData: any) => void;
  disabled?: boolean;
}

interface TaskAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  createdAt: string;
}

const FileUploadButton: React.FC<FileUploadButtonProps> = ({
  taskId,
  onFileUploaded = () => {},
  disabled = false,
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setProgress(0);

    try {
      // Process each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Check file size (limit to 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: `${file.name} exceeds the 10MB limit.`,
            variant: "destructive",
          });
          continue;
        }

        // Upload directly to Supabase Storage
        const fileExt = file.name.split(".").pop() || "";
        const fileName = `${taskId}/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;

        // Upload the file
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("task_files")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: true,
          });

        if (uploadError) {
          toast({
            title: `Failed to upload ${file.name}`,
            description:
              uploadError.message || "There was an error uploading this file.",
            variant: "destructive",
          });
          continue;
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("task_files").getPublicUrl(fileName);

        // Create attachment object
        const attachment: TaskAttachment = {
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
          name: file.name,
          type: file.type,
          size: file.size,
          url: publicUrl,
          createdAt: new Date().toISOString(),
        };

        // Update the task with the new attachment
        try {
          // First get the current task to check if it already has attachments
          // Use explicit column selection to ensure we get the attachments column
          const { data: taskData, error: taskError } = await supabase
            .from("tasks")
            .select(
              "id, title, description, column_id, position, created_at, updated_at, is_completed, completed_at, attachments",
            )
            .eq("id", taskId)
            .single();

          if (taskError) {
            console.error("Error fetching task:", taskError);
            throw new Error("Could not fetch task data");
          }

          // Prepare the attachments array (append to existing or create new)
          const existingAttachments = taskData?.attachments || [];
          const updatedAttachments = [...existingAttachments, attachment];

          console.log("Updating task with attachments:", {
            taskId,
            existingCount: existingAttachments.length,
            newCount: updatedAttachments.length,
          });

          // Update the task with the new attachment
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
                throw new Error("Could not update task with attachment");
              }
            }
          } catch (error) {
            console.error("Error in update attempt:", error);
            throw new Error("Could not update task with attachment");
          }

          // Notify parent component
          onFileUploaded(attachment);
        } catch (error) {
          console.error("Error updating task with attachment:", error);
          // If we can't update the task, delete the uploaded file to avoid orphaned files
          await supabase.storage.from("task_files").remove([fileName]);
          toast({
            title: `Failed to attach ${file.name}`,
            description: "Could not update task with attachment information.",
            variant: "destructive",
          });
          continue;
        }

        // Update progress
        setProgress(Math.round(((i + 1) / files.length) * 100));
      }

      // Only show success toast if at least one file was uploaded successfully
      if (progress > 0) {
        toast({
          title: "Files uploaded",
          description: "Files have been successfully uploaded.",
        });
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your files.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        multiple
        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.json,.zip,.rar,.jpg,.jpeg,.png,.gif"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading || disabled}
        className="flex items-center space-x-1"
      >
        {uploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
            Uploading... {progress}%
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-1" />
            Upload Files
          </>
        )}
      </Button>
    </div>
  );
};

export default FileUploadButton;
