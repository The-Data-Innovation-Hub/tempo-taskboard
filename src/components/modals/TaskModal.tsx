import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  Plus,
  X,
  Loader2,
  CheckCircle2,
  FileText,
  Upload,
  File,
  Trash2,
  Download,
  FileIcon,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
// Import supabase client
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { taskFileApi } from "@/lib/api";
import FileUploadButton from "@/components/project/FileUploadButton";
import TaskAttachmentList from "@/components/project/TaskAttachmentList";

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

interface TaskFile {
  id: string;
  task_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  created_at: string;
  updated_at: string;
}

interface TaskAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  createdAt: string;
}

interface TaskData {
  title: string;
  description?: string;
  dueDate?: Date;
  labels?: TaskLabel[];
  assignees?: TaskAssignee[];
  isCompleted?: boolean;
  completedAt?: Date | null;
  files?: TaskFile[];
  attachments?: TaskAttachment[];
}

interface TaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: {
    id: string;
    title: string;
    description?: string;
    dueDate?: Date;
    labels?: TaskLabel[];
    assignees?: TaskAssignee[];
    commentsCount?: number;
    isCompleted?: boolean;
    completedAt?: string | null;
    files?: TaskFile[];
    attachments?: TaskAttachment[];
  };
  mode: "create" | "edit";
  columnId?: string;
  projectId?: string;
  onSave: (taskData: TaskData) => void;
  availableLabels: TaskLabel[];
  availableAssignees: TaskAssignee[];
}

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  dueDate: z.date().optional(),
  isCompleted: z.boolean().optional(),
});

const TaskModal: React.FC<TaskModalProps> = ({
  open,
  onOpenChange,
  task,
  mode,
  columnId,
  projectId,
  onSave,
  availableLabels = [],
  availableAssignees = [],
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedLabels, setSelectedLabels] = useState<TaskLabel[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<TaskAssignee[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completedAt, setCompletedAt] = useState<Date | null>(null);
  const [taskFiles, setTaskFiles] = useState<TaskFile[]>([]);
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      dueDate: undefined,
      isCompleted: false,
    },
  });

  // Reset form when modal opens/closes or task changes
  useEffect(() => {
    if (open && task) {
      form.reset({
        title: task.title,
        description: task.description || "",
        dueDate: task.dueDate,
        isCompleted: task.isCompleted || false,
      });
      setSelectedLabels(task.labels || []);
      setSelectedAssignees(task.assignees || []);
      setTaskFiles(task.files || []);
      setAttachments(task.attachments || []);
      setIsCompleted(task.isCompleted || false);
      setCompletedAt(task.completedAt ? new Date(task.completedAt) : null);
    } else if (open) {
      form.reset({
        title: "",
        description: "",
        dueDate: undefined,
        isCompleted: false,
      });
      setSelectedLabels([]);
      setSelectedAssignees([]);
      setTaskFiles([]);
      setAttachments([]);
      setIsCompleted(false);
      setCompletedAt(null);
    }
  }, [open, task, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      console.log("TaskModal - Submitting task with values:", values);
      console.log(
        "TaskModal - Mode:",
        mode,
        "Column ID:",
        columnId,
        "Project ID:",
        projectId,
      );

      // Prepare task data
      const taskData: TaskData = {
        title: values.title,
        description: values.description,
        dueDate: values.dueDate,
        labels: selectedLabels,
        assignees: selectedAssignees,
        isCompleted: isCompleted,
        completedAt: isCompleted ? completedAt || new Date() : null,
        files: taskFiles,
        attachments: attachments,
      };

      console.log("TaskModal - Prepared task data:", taskData);

      // Check if we have the required Supabase configuration
      if (!supabase) {
        console.error("TaskModal - Supabase client is not initialized");
        throw new Error("Supabase client is not initialized");
      }

      // For create mode, verify we have column and project IDs
      if (mode === "create" && (!columnId || !projectId)) {
        console.error(
          "TaskModal - Missing columnId or projectId for task creation",
        );
        throw new Error("Missing column or project information");
      }

      // Create or update the task in Supabase
      if (mode === "edit" && task?.id) {
        console.log("TaskModal - Updating existing task:", task.id);

        // Update task in database
        const { data: updatedTask, error } = await supabase
          .from("tasks")
          .update({
            title: values.title,
            description: values.description,
            due_date: values.dueDate,
            is_completed: isCompleted,
            completed_at: isCompleted ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", task.id)
          .select()
          .single();

        if (error) {
          console.error("TaskModal - Error updating task:", error);
          throw error;
        }

        console.log("TaskModal - Task updated successfully:", updatedTask);

        // Update labels if we have any
        if (selectedLabels.length > 0) {
          console.log("TaskModal - Updating task labels:", selectedLabels);
          try {
            // First delete existing labels
            const { error: deleteError } = await supabase
              .from("task_labels")
              .delete()
              .eq("task_id", task.id);

            if (deleteError) {
              console.error(
                "TaskModal - Error deleting existing labels:",
                deleteError,
              );
              throw deleteError;
            }

            // Then add new labels
            const labelInserts = selectedLabels.map((label) => ({
              task_id: task.id,
              label_id: label.id,
            }));

            if (labelInserts.length > 0) {
              const { error: insertError } = await supabase
                .from("task_labels")
                .insert(labelInserts);

              if (insertError) {
                console.error(
                  "TaskModal - Error inserting new labels:",
                  insertError,
                );
                throw insertError;
              }
            }
          } catch (labelError) {
            console.error("TaskModal - Error updating labels:", labelError);
            // Continue with other updates even if labels fail
          }
        }

        // Update assignees if we have any
        if (selectedAssignees.length > 0) {
          console.log(
            "TaskModal - Updating task assignees:",
            selectedAssignees,
          );
          try {
            // First delete existing assignees
            const { error: deleteError } = await supabase
              .from("task_assignees")
              .delete()
              .eq("task_id", task.id);

            if (deleteError) {
              console.error(
                "TaskModal - Error deleting existing assignees:",
                deleteError,
              );
              throw deleteError;
            }

            // Then add new assignees
            const assigneeInserts = selectedAssignees.map((assignee) => ({
              task_id: task.id,
              user_id: assignee.id,
            }));

            if (assigneeInserts.length > 0) {
              const { error: insertError } = await supabase
                .from("task_assignees")
                .insert(assigneeInserts);

              if (insertError) {
                console.error(
                  "TaskModal - Error inserting new assignees:",
                  insertError,
                );
                throw insertError;
              }
            }
          } catch (assigneeError) {
            console.error(
              "TaskModal - Error updating assignees:",
              assigneeError,
            );
            // Continue with other updates even if assignees fail
          }
        }
      } else if (mode === "create") {
        console.log(
          "TaskModal - Creating new task in column:",
          columnId,
          "project:",
          projectId,
        );

        // Create new task in database
        const { data: newTask, error } = await supabase
          .from("tasks")
          .insert([
            {
              title: values.title,
              description: values.description || "",
              due_date: values.dueDate,
              column_id: columnId,
              project_id: projectId,
              user_id: user?.id,
              is_completed: isCompleted,
              completed_at: isCompleted ? new Date().toISOString() : null,
              order: 9999, // Will be reordered by the client
            },
          ])
          .select()
          .single();

        if (error) {
          console.error("TaskModal - Error creating task:", error);
          throw error;
        }

        console.log("TaskModal - Task created successfully:", newTask);

        // Add labels if we have any and the task was created successfully
        if (selectedLabels.length > 0 && newTask) {
          console.log("TaskModal - Adding labels to new task:", selectedLabels);
          try {
            const labelInserts = selectedLabels.map((label) => ({
              task_id: newTask.id,
              label_id: label.id,
            }));

            const { error: labelError } = await supabase
              .from("task_labels")
              .insert(labelInserts);

            if (labelError) {
              console.error(
                "TaskModal - Error adding labels to new task:",
                labelError,
              );
              // Continue even if labels fail
            }
          } catch (labelError) {
            console.error("TaskModal - Exception adding labels:", labelError);
            // Continue even if labels fail
          }
        }

        // Add assignees if we have any and the task was created successfully
        if (selectedAssignees.length > 0 && newTask) {
          console.log(
            "TaskModal - Adding assignees to new task:",
            selectedAssignees,
          );
          try {
            const assigneeInserts = selectedAssignees.map((assignee) => ({
              task_id: newTask.id,
              user_id: assignee.id,
            }));

            const { error: assigneeError } = await supabase
              .from("task_assignees")
              .insert(assigneeInserts);

            if (assigneeError) {
              console.error(
                "TaskModal - Error adding assignees to new task:",
                assigneeError,
              );
              // Continue even if assignees fail
            }
          } catch (assigneeError) {
            console.error(
              "TaskModal - Exception adding assignees:",
              assigneeError,
            );
            // Continue even if assignees fail
          }
        }
      }

      // Call the onSave callback with the values
      onSave(taskData);

      // Show success toast
      toast({
        title: mode === "create" ? "Task created" : "Task updated",
        description:
          mode === "create"
            ? "New task has been created"
            : "Task has been updated",
      });

      // Close the modal
      onOpenChange(false);
    } catch (error) {
      console.error("TaskModal - Error saving task:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? `Failed to save task: ${error.message}`
            : "Failed to save task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to check if a task ID is a valid UUID
  const isValidUUID = (id: string): boolean => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      id,
    );
  };

  const toggleLabel = (label: TaskLabel) => {
    setSelectedLabels((prev) => {
      const exists = prev.some((l) => l.id === label.id);
      if (exists) {
        return prev.filter((l) => l.id !== label.id);
      } else {
        return [...prev, label];
      }
    });
  };

  const toggleAssignee = (assignee: TaskAssignee) => {
    setSelectedAssignees((prev) => {
      const exists = prev.some((a) => a.id === assignee.id);
      if (exists) {
        return prev.filter((a) => a.id !== assignee.id);
      } else {
        return [...prev, assignee];
      }
    });
  };

  const handleCompletionChange = (checked: boolean) => {
    setIsCompleted(checked);
    if (checked && !completedAt) {
      setCompletedAt(new Date());
    } else if (!checked) {
      setCompletedAt(null);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Generate a temporary ID if we're in create mode
    if (!task?.id) {
      task = {
        ...task,
        id: `task-${Date.now()}`,
      };
      console.log(`Generated temporary task ID: ${task.id}`);
    }

    // Use the actual task ID since we've verified it exists
    const currentTaskId = task.id;

    // Check if this is a temporary task (non-UUID)
    const isTemporaryTask = !isValidUUID(currentTaskId);
    if (isTemporaryTask) {
      console.log(`Working with temporary task ID: ${currentTaskId}`);
    }

    setUploadingFiles(true);
    setUploadProgress(0);

    try {
      console.log(`Starting file upload process for task ID: ${currentTaskId}`);
      // Process each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(
          `Processing file: ${file.name}, type: ${file.type}, size: ${file.size} bytes`,
        );

        // Check file size (limit to 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: `${file.name} exceeds the 10MB limit.`,
            variant: "destructive",
          });
          console.log(`File ${file.name} exceeds size limit, skipping`);
          continue;
        }

        // Check file type
        const allowedTypes = [
          "application/pdf", // PDF
          "application/vnd.ms-powerpoint", // PPT
          "application/vnd.openxmlformats-officedocument.presentationml.presentation", // PPTX
          "application/msword", // DOC
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // DOCX
          "application/vnd.ms-excel", // XLS
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // XLSX
          "text/plain", // TXT
          "text/csv", // CSV
          "application/json", // JSON
          "application/zip", // ZIP
          "application/x-rar-compressed", // RAR
          "image/jpeg", // JPEG
          "image/png", // PNG
          "image/gif", // GIF
        ];

        if (!allowedTypes.includes(file.type)) {
          toast({
            title: "Unsupported file type",
            description: `${file.name} has an unsupported file type.`,
            variant: "destructive",
          });
          console.log(
            `File ${file.name} has unsupported type: ${file.type}, skipping`,
          );
          continue;
        }

        try {
          // Upload directly to Supabase Storage
          const fileExt = file.name.split(".").pop() || "";
          const fileName = `${currentTaskId}/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;

          console.log(
            `Attempting to upload file ${file.name} for task ${currentTaskId}`,
          );

          // Upload the file
          const { data: uploadData, error: uploadError } =
            await supabase.storage.from("task_files").upload(fileName, file, {
              cacheControl: "3600",
              upsert: true,
            });

          if (uploadError) {
            console.error(`Error uploading file ${file.name}:`, uploadError);
            toast({
              title: `Failed to upload ${file.name}`,
              description:
                uploadError.message ||
                "There was an error uploading this file.",
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
            // Check if the task ID is a UUID or a custom string format
            const isUUID = isValidUUID(currentTaskId);

            // For temporary tasks (non-UUID IDs), we only update the local state
            // and don't try to update the database
            if (!isUUID) {
              console.log(
                `Task ID ${currentTaskId} is temporary - updating local state only`,
              );

              // Add to local state
              setAttachments((prev) => [...prev, attachment]);

              // Update progress
              setUploadProgress(Math.round(((i + 1) / files.length) * 100));
              continue; // Skip database update for temporary tasks
            }

            // For real tasks with UUID, proceed with database update
            // First get the current task to check if it already has attachments
            const result = await supabase
              .from("tasks")
              .select(
                "id, title, description, column_id, created_at, updated_at, attachments",
              )
              .eq("id", currentTaskId)
              .single();

            const taskData = result.data;
            const taskError = result.error;

            if (taskError) {
              console.error("Error fetching task:", taskError);
              throw new Error("Could not fetch task data");
            }

            // Prepare the attachments array (append to existing or create new)
            const existingAttachments = taskData?.attachments || [];
            const updatedAttachments = [...existingAttachments, attachment];

            // Update the task with the new attachment
            console.log("Updating task with attachments in TaskModal:", {
              taskId: currentTaskId,
              existingCount: existingAttachments.length,
              newCount: updatedAttachments.length,
              attachmentsData: updatedAttachments,
            });

            // Update the database record
            const { error: updateError } = await supabase
              .from("tasks")
              .update({ attachments: updatedAttachments })
              .eq("id", currentTaskId);

            if (updateError) {
              console.error(
                "Error updating task with attachment in database:",
                updateError,
              );
              throw new Error("Could not update task with attachment");
            }

            // Add to local state
            setAttachments((prev) => [...prev, attachment]);

            // Update progress
            setUploadProgress(Math.round(((i + 1) / files.length) * 100));
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
        } catch (fileError) {
          console.error(`Error uploading file ${file.name}:`, fileError);

          // Check for specific error messages
          let errorMessage =
            "There was an error uploading this file. Please try again.";
          if (typeof fileError === "object" && fileError !== null) {
            const errorStr = fileError.toString();
            if (
              errorStr.includes("bucket not found") ||
              errorStr.includes("task_files bucket does not exist")
            ) {
              errorMessage =
                "The storage bucket for files does not exist. Please contact an administrator.";
            } else if (errorStr.includes("task_files table does not exist")) {
              errorMessage =
                "The database table for files does not exist. Please contact an administrator.";
            } else if (errorStr.includes("row-level security")) {
              errorMessage =
                "You don't have permission to upload files. Please contact an administrator.";
            }
          }

          toast({
            title: `Failed to upload ${file.name}`,
            description: errorMessage,
            variant: "destructive",
          });
        }
      }

      // Only show success toast if at least one file was uploaded successfully
      if (uploadProgress > 0) {
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
      console.error(
        "Error uploading files:",
        error,
        typeof error === "object" ? JSON.stringify(error) : "",
      );
      toast({
        title: "Upload failed",
        description:
          "There was an error uploading your files. Please check the console for details.",
        variant: "destructive",
      });
    } finally {
      setUploadingFiles(false);
      setUploadProgress(0);
    }
  };

  const handleAttachmentDeleted = (attachmentId: string) => {
    setAttachments((prev) =>
      prev.filter((attachment) => attachment.id !== attachmentId),
    );
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!task?.id) return;

    try {
      setLoading(true);
      await taskFileApi.deleteFile(fileId);
      setTaskFiles((prev) => prev.filter((file) => file.id !== fileId));

      toast({
        title: "File deleted",
        description: "File has been successfully deleted.",
      });
    } catch (error) {
      console.error("Error deleting file:", error);
      toast({
        title: "Delete failed",
        description: "There was an error deleting your file.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " bytes";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes("pdf")) return <FileText className="h-4 w-4" />;
    if (fileType.includes("presentation") || fileType.includes("powerpoint"))
      return <FileIcon className="h-4 w-4" />;
    if (fileType.includes("word") || fileType.includes("document"))
      return <FileText className="h-4 w-4" />;
    if (fileType.includes("excel") || fileType.includes("spreadsheet"))
      return <FileIcon className="h-4 w-4" />;
    if (fileType.includes("image")) return <FileIcon className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white rounded-xl shadow-[8px_8px_16px_rgba(0,0,0,0.05),-8px_-8px_16px_rgba(255,255,255,0.8)] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800">
            {mode === "create" ? "Create New Task" : "Edit Task"}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {mode === "create"
              ? "Add a new task to your project board"
              : "Update the details of your task"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter task title"
                      className="border-gray-300 focus:border-[#0089AD] focus:ring-[#0089AD]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter task description"
                      className="min-h-[100px] border-gray-300 focus:border-[#0089AD] focus:ring-[#0089AD]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-gray-700">Due Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={`w-full pl-3 text-left font-normal ${!field.value ? "text-muted-foreground" : ""}`}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div>
                <h3 className="text-gray-700 font-medium mb-2">Labels</h3>
                <div className="flex flex-wrap gap-2">
                  {availableLabels.map((label) => {
                    const isSelected = selectedLabels.some(
                      (l) => l.id === label.id,
                    );
                    return (
                      <Badge
                        key={label.id}
                        style={{
                          backgroundColor: isSelected
                            ? label.color
                            : "transparent",
                          color: isSelected ? "white" : label.color,
                          borderColor: label.color,
                          borderWidth: "1px",
                        }}
                        className="px-3 py-1 cursor-pointer transition-all duration-200 hover:shadow-md"
                        onClick={() => toggleLabel(label)}
                      >
                        {label.name}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-gray-700 font-medium mb-2">Assignees</h3>
                <div className="flex flex-wrap gap-3">
                  {availableAssignees.map((assignee) => {
                    const isSelected = selectedAssignees.some(
                      (a) => a.id === assignee.id,
                    );
                    return (
                      <div
                        key={assignee.id}
                        className={`flex items-center gap-2 px-3 py-2 rounded-full cursor-pointer transition-all duration-200 ${isSelected ? "bg-[#0089AD]/10 border border-[#0089AD]/30" : "bg-gray-100 border border-transparent"}`}
                        onClick={() => toggleAssignee(assignee)}
                      >
                        <Avatar className="h-6 w-6">
                          {assignee.avatar ? (
                            <AvatarImage
                              src={assignee.avatar}
                              alt={assignee.name}
                            />
                          ) : (
                            <AvatarFallback
                              className={`${isSelected ? "bg-[#0089AD] text-white" : "bg-gray-300 text-gray-600"}`}
                            >
                              {assignee.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <span
                          className={`text-sm ${isSelected ? "text-[#0089AD] font-medium" : "text-gray-600"}`}
                        >
                          {assignee.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="task-completed"
                  checked={isCompleted}
                  onCheckedChange={handleCompletionChange}
                />
                <label
                  htmlFor="task-completed"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Mark as completed
                </label>
              </div>

              {mode === "edit" && (
                <div>
                  <h3 className="text-gray-700 font-medium mb-2">Files</h3>
                  <div className="space-y-2">
                    {/* Legacy files section */}
                    {taskFiles.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm text-gray-600 mb-2">
                          Legacy Files
                        </h4>
                        {taskFiles.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded-md border border-gray-200 mb-2"
                          >
                            <div className="flex items-center space-x-2">
                              {getFileIcon(file.file_type)}
                              <span className="text-sm font-medium">
                                {file.file_name}
                              </span>
                              <span className="text-xs text-gray-500">
                                ({formatFileSize(file.file_size)})
                              </span>
                            </div>
                            <div className="flex space-x-2">
                              <a
                                href={file.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                                title="Download"
                              >
                                <Download className="h-4 w-4 text-gray-600" />
                              </a>
                              <button
                                onClick={() => handleDeleteFile(file.id)}
                                className="p-1 hover:bg-red-100 rounded-full transition-colors"
                                title="Delete"
                                type="button"
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* New attachments section */}
                    <TaskAttachmentList
                      taskId={task?.id || ""}
                      attachments={attachments}
                      onAttachmentDeleted={handleAttachmentDeleted}
                      readOnly={false}
                    />

                    <div className="mt-4">
                      <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        multiple
                        onChange={handleFileUpload}
                        ref={fileInputRef}
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.json,.zip,.rar,.jpg,.jpeg,.png,.gif"
                      />
                      <label
                        htmlFor="file-upload"
                        className="inline-flex items-center px-4 py-2 bg-gray-100 border border-gray-300 rounded-md font-medium text-sm text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0089AD] cursor-pointer transition-colors"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Files
                      </label>
                      {uploadingFiles && (
                        <div className="mt-2">
                          <div className="flex items-center">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            <span className="text-sm">
                              Uploading... {uploadProgress}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                            <div
                              className="bg-[#0089AD] h-2.5 rounded-full"
                              style={{ width: `${uploadProgress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#0089AD] hover:bg-[#0089AD]/90"
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === "create" ? "Create Task" : "Update Task"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskModal;
