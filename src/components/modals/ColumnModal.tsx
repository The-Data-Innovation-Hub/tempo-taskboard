import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
// Import supabase client
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

const formSchema = z.object({
  name: z.string().min(1, { message: "Column name is required" }),
});

type FormValues = z.infer<typeof formSchema>;

interface ColumnModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit?: (values: FormValues, columnId?: string) => void;
  initialValues?: FormValues;
  title?: string;
  submitLabel?: string;
  isEditing?: boolean;
  projectId?: string;
  columnId?: string;
}

const ColumnModal = ({
  open = true,
  onOpenChange,
  onSubmit,
  initialValues = { name: "" },
  title = "Create Column",
  submitLabel = "Create",
  isEditing = false,
  projectId,
  columnId,
}: ColumnModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues,
  });

  const handleSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);

      // Check if Supabase is configured
      if (projectId && import.meta.env.VITE_SUPABASE_URL) {
        if (isEditing && columnId) {
          // Update existing column
          const { error } = await supabase
            .from("columns")
            .update({ title: values.name })
            .eq("id", columnId);

          if (error) throw error;
        } else {
          // Create new column without user_id
          const { error } = await supabase.from("columns").insert([
            {
              title: values.name,
              project_id: projectId,
              order: 9999, // Will be reordered by the client
            },
          ]);

          if (error) throw error;
        }
      } else {
        // Mock delay for better UX
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Call the onSubmit callback with the values
      onSubmit?.(values, columnId);
      form.reset();
      onOpenChange?.(false);
    } catch (error) {
      console.error("Error saving column:", error);
      toast({
        title: "Failed to save column",
        description: "There was an error saving the column. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white rounded-lg shadow-lg">
        <div className="absolute right-4 top-4">
          <DialogClose className="rounded-full p-1 hover:bg-gray-100">
            <X className="h-4 w-4 text-gray-500" />
          </DialogClose>
        </div>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-black">
            {title}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Column Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter column name"
                      className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm shadow-sm focus:border-[#0089AD] focus:ring-1 focus:ring-[#0089AD]"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-red-500" />
                </FormItem>
              )}
            />

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange?.(false)}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-md bg-[#0089AD] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#0089AD]/90 focus:outline-none focus:ring-2 focus:ring-[#0089AD] focus:ring-offset-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    {isEditing ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  submitLabel
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ColumnModal;
