import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth";
import { organizationApi } from "@/lib/api";
import { Loader2, Upload, X, Image as ImageIcon } from "lucide-react";
import { DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";

interface OrganizationFormProps {
  onOrganizationCreated?: (organization: any) => void;
  inModal?: boolean;
  initialData?: any;
  isEditing?: boolean;
}

const OrganizationForm = ({
  onOrganizationCreated = () => {},
  inModal = false,
  initialData = null,
  isEditing = false,
}: OrganizationFormProps) => {
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(
    initialData?.description || "",
  );
  const [logo, setLogo] = useState<string | null>(initialData?.logo || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPEG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Logo image must be less than 2MB",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);

      // Generate a unique file name
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `organization_logos/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      setLogo(urlData.publicUrl);

      toast({
        title: "Logo uploaded",
        description: "Your organisation logo has been uploaded successfully.",
      });
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast({
        title: "Upload failed",
        description:
          "There was an error uploading your logo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    setLogo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: "Organisation name required",
        description: "Please enter a name for your organisation",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    let result: any = null;

    try {
      // If no custom logo was uploaded, generate one using the organisation name
      const logoUrl =
        logo ||
        `https://api.dicebear.com/7.x/shapes/svg?seed=${name.trim().toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;

      // Check if we're using mock data (user id is a simple string like '1')
      // In that case, we need to omit the user_id field and let the database handle it
      const organisationData = {
        name: name.trim(),
        description: description.trim(),
        logo: logoUrl,
        // Only include user_id if it's a valid UUID and we're not editing
        ...(!isEditing && user?.id && user.id.includes("-")
          ? { user_id: user.id }
          : {}),
        // Let the database handle timestamps with DEFAULT NOW()
      };

      console.log(
        isEditing ? "Updating" : "Creating",
        "organisation with data:",
        organisationData,
      );

      try {
        if (isEditing && initialData?.id) {
          result = await organizationApi.update(
            initialData.id,
            organisationData,
          );
          console.log("Organisation updated:", result);
        } else {
          result = await organizationApi.create(organisationData);
          console.log("Organisation created:", result);

          // Only reset form if creating a new organization
          setName("");
          setDescription("");
          setLogo(null);
        }
      } catch (error) {
        console.error("Error details from API:", error);
        throw error;
      }

      // Notify parent component
      onOrganizationCreated(result);
    } catch (error) {
      console.error(
        isEditing ? "Error updating" : "Error creating",
        "organisation:",
        error,
      );
      toast({
        title: isEditing
          ? "Failed to update organisation"
          : "Failed to create organisation",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred. Please check the console for details.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formContent = (
    <>
      {/* Logo Upload Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Organisation Logo
        </label>
        <div className="flex items-center space-x-4">
          <div className="relative">
            {logo ? (
              <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
                <img
                  src={logo}
                  alt="Organisation logo"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                  aria-label="Remove logo"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="w-24 h-24 flex items-center justify-center bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                <ImageIcon className="h-8 w-8 text-gray-400" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
              disabled={isUploading || isSubmitting}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isSubmitting}
              className="w-full mb-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {logo ? "Change Logo" : "Upload Logo"}
                </>
              )}
            </Button>
            <p className="text-xs text-gray-500">
              Recommended: Square image, max 2MB (PNG or JPEG)
            </p>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Organisation Name
        </label>
        <Input
          placeholder="Enter organisation name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isSubmitting}
          autoFocus
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0089AD]"
          rows={3}
          placeholder="Enter organisation description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isSubmitting}
        />
      </div>
    </>
  );

  const submitButton = (
    <Button
      type="submit"
      className="bg-[#0089AD] hover:bg-[#0089AD]/90 text-white"
      disabled={isSubmitting || isUploading}
    >
      {isSubmitting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {isEditing ? "Updating..." : "Creating..."}
        </>
      ) : isEditing ? (
        "Update Organisation"
      ) : (
        "Create Organisation"
      )}
    </Button>
  );

  if (inModal) {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        {formContent}
        <DialogFooter>{submitButton}</DialogFooter>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formContent}
      <div className="flex justify-end">{submitButton}</div>
    </form>
  );
};

export default OrganizationForm;
