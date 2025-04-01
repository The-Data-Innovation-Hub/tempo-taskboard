import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import CreateProjectModal from "@/components/modals/CreateProjectModal";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth";

interface CreateProjectButtonProps {
  onProjectCreated?: (project: any) => void;
  organizationId?: string;
}

const CreateProjectButton = ({
  onProjectCreated = () => {},
  organizationId,
}: CreateProjectButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleCreateProject = (projectData: any) => {
    setIsModalOpen(false);
    onProjectCreated(projectData);
    // Force refresh of the project list
    window.location.href = "/";
  };

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        className="bg-[#0089AD] hover:bg-[#0089AD]/90 text-white flex items-center gap-2"
      >
        <Plus className="h-4 w-4" />
        <span>New Project</span>
      </Button>

      {isModalOpen && (
        <CreateProjectModal
          onClose={() => setIsModalOpen(false)}
          onCreateProject={handleCreateProject}
          organizationId={organizationId}
        />
      )}
    </>
  );
};

export default CreateProjectButton;
