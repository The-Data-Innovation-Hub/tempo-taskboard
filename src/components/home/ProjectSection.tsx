import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ProjectGrid from "@/components/dashboard/ProjectGrid";
import OrganizationSelector from "@/components/organization/OrganizationSelector";
import { Organization } from "@/lib/api";
import NeumorphicContainer from "@/components/common/NeumorphicContainer";
import CreateProjectModal from "@/components/modals/CreateProjectModal";
import { useToast } from "@/components/ui/use-toast";

const ProjectSection = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedOrganization, setSelectedOrganization] =
    useState<Organization | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState<any>(null);

  const handleOrganizationChange = (organization: Organization) => {
    // Ensure we have a valid UUID for the organization ID
    if (organization && organization.id && organization.id.includes("-")) {
      setSelectedOrganization(organization);
    } else {
      console.warn(
        "Invalid organization ID format received:",
        organization?.id,
      );
      setSelectedOrganization(null);
    }
  };

  const handleSelectProject = (id: string) => {
    navigate(`/project/${id}`);
  };

  const handleEditProject = (id: string) => {
    // Find the project to edit
    // In a real app, you would fetch the project details from the API
    setCurrentProject({
      id,
      title: "Project Title",
      description: "Project Description",
    });
    setIsEditModalOpen(true);
  };

  const handleProjectCreated = () => {
    setIsEditModalOpen(false);
    // Refresh projects would happen here
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Projects</h2>
        <OrganizationSelector onOrganizationChange={handleOrganizationChange} />
      </div>

      <NeumorphicContainer elevation="medium" className="p-0 overflow-hidden">
        <ProjectGrid
          onSelectProject={handleSelectProject}
          onEditProject={handleEditProject}
        />
      </NeumorphicContainer>

      {isEditModalOpen && (
        <CreateProjectModal
          project={currentProject}
          isEditing={true}
          onClose={() => setIsEditModalOpen(false)}
          onCreateProject={handleProjectCreated}
          organizationId={selectedOrganization?.id}
        />
      )}
    </div>
  );
};

export default ProjectSection;
