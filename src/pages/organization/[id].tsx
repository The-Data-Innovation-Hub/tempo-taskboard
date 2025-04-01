import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building,
  Users,
  Folder,
  Loader2,
  UserPlus,
  Trash2,
  Check,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import NeumorphicContainer from "@/components/common/NeumorphicContainer";
import {
  organizationApi,
  projectApi,
  Organization,
  Project,
  OrganizationMember,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import InviteUserModal from "@/components/modals/InviteUserModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import OrganizationForm from "@/components/organization/OrganizationForm";

const OrganisationDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [organisation, setOrganisation] = useState<Organization | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    const fetchOrganisationData = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        // Fetch organisation details
        console.log("Fetching organization with ID:", id);
        const orgData = await organizationApi.getById(id);
        console.log("Organization data received:", orgData);
        setOrganisation(orgData);

        // Fetch projects for this organisation
        try {
          const allProjects = await projectApi.getAll();
          const orgProjects = allProjects.filter(
            (project) => project.organization_id === id,
          );
          setProjects(orgProjects);
        } catch (projectError) {
          console.error("Error fetching projects:", projectError);
          // Continue with empty projects array
          setProjects([]);
        }

        // Fetch organization members
        try {
          const membersData = await organizationApi.getMembers(id);
          setMembers(membersData);
        } catch (membersError) {
          console.error("Error fetching organization members:", membersError);

          // Check if it's a missing table error
          const isProfilesTableMissing =
            typeof membersError === "object" &&
            membersError !== null &&
            "message" in membersError &&
            typeof membersError.message === "string" &&
            membersError.message.includes(
              'relation "public.profiles" does not exist',
            );

          if (isProfilesTableMissing) {
            console.warn(
              "Profiles table doesn't exist yet. This is expected if you haven't run the migration.",
            );
            toast({
              title: "Missing profiles table",
              description:
                "The profiles table doesn't exist in the database. Please run the migration to create it.",
              variant: "destructive",
            });
          }

          // If we can't get members, at least show the creator
          if (orgData && orgData.user_id) {
            setMembers([
              {
                id: orgData.user_id,
                name: user?.name || "Organisation Creator",
                email: user?.email || "",
                role: "Owner",
                created_at: orgData.created_at,
              },
            ]);
          }
        }
      } catch (error) {
        console.error("Error fetching organisation data:", error);
        // Add more detailed error information
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error("Error details:", errorMessage);

        // Check if it's a missing table error
        const isMissingTableError =
          typeof error === "object" &&
          error !== null &&
          "message" in error &&
          typeof error.message === "string" &&
          error.message.includes('relation "public.projects" does not exist');

        if (isMissingTableError) {
          console.warn(
            "Projects table doesn't exist yet. This is expected if you haven't run the migration.",
          );
          toast({
            title: "Missing projects table",
            description:
              "The projects table doesn't exist in the database. Please run the migration to create it.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Failed to load organisation",
            description: `There was an error loading the organisation details: ${errorMessage}`,
            variant: "destructive",
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrganisationData();
  }, [id, toast, user]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 size={40} className="animate-spin text-[#0089AD]" />
      </div>
    );
  }

  if (!organisation) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/organization")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Organisations
        </Button>

        <NeumorphicContainer className="p-8 text-center" elevation="medium">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            Organisation Not Found
          </h2>
          <p className="text-gray-500">
            The organisation you're looking for doesn't exist or you don't have
            permission to view it.
          </p>
        </NeumorphicContainer>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto bg-white">
      <Button
        variant="ghost"
        onClick={() => navigate("/organization")}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Organisations
      </Button>

      {/* Organisation Header */}
      <NeumorphicContainer className="p-6 mb-6" elevation="medium">
        <div className="flex items-start">
          <div className="flex-shrink-0 mr-6">
            <div className="w-24 h-24 rounded-full bg-[#0089AD]/10 flex items-center justify-center">
              {organisation.logo ? (
                <img
                  src={organisation.logo}
                  alt={organisation.name}
                  className="w-20 h-20 rounded-full"
                  onError={(e) => {
                    e.currentTarget.src = "";
                    e.currentTarget.style.display = "none";
                    e.currentTarget.parentElement!.innerHTML =
                      '<div class="flex items-center justify-center w-full h-full"><Building size={36} className="text-[#0089AD]" /></div>';
                  }}
                />
              ) : (
                <Building size={36} className="text-[#0089AD]" />
              )}
            </div>
          </div>

          <div className="flex-grow">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <h1 className="text-3xl font-bold text-gray-800">
                  {organisation.name}
                </h1>
                {organisation.is_default && (
                  <span className="ml-3 text-sm px-3 py-1 bg-green-100 text-green-800 rounded-full flex items-center">
                    <Check size={14} className="mr-1" /> Default Organisation
                  </span>
                )}
              </div>
              <Button
                onClick={() => setShowEditModal(true)}
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
              >
                <Edit size={16} />
                Edit
              </Button>
            </div>

            {organisation.description && (
              <p className="text-gray-600 mt-2">{organisation.description}</p>
            )}

            <p className="text-sm text-gray-500 mt-2">
              Created on {formatDate(organisation.created_at)}
            </p>
            <div className="flex space-x-6 mt-3">
              <div className="flex items-center text-sm text-gray-600">
                <Folder size={16} className="mr-2 text-[#0089AD]" />
                <span>
                  {projects.length}{" "}
                  {projects.length === 1 ? "Project" : "Projects"}
                </span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Users size={16} className="mr-2 text-[#0089AD]" />
                <span>
                  {members.length} {members.length === 1 ? "Member" : "Members"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </NeumorphicContainer>

      {/* Projects Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-700 flex items-center">
            <Folder className="mr-2 h-5 w-5 text-[#0089AD]" />
            Projects
          </h2>
          <Button
            onClick={() =>
              navigate("/projects/new", {
                state: { organisationId: organisation.id },
              })
            }
            className="bg-[#0089AD] hover:bg-[#0089AD]/90 text-white"
            size="sm"
          >
            Add Project
          </Button>
        </div>

        {projects.length === 0 ? (
          <NeumorphicContainer className="p-6 text-center" elevation="medium">
            <p className="text-gray-500">
              No projects found for this organisation.
            </p>
            <Button
              onClick={() =>
                navigate("/projects/new", {
                  state: { organisationId: organisation.id },
                })
              }
              className="bg-[#0089AD] hover:bg-[#0089AD]/90 text-white mt-4"
            >
              Create Your First Project
            </Button>
          </NeumorphicContainer>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <NeumorphicContainer
                key={project.id}
                className="p-4 cursor-pointer transition-all hover:shadow-lg"
                elevation="medium"
                interactive
                onClick={() => navigate(`/project/${project.id}`)}
              >
                <h3 className="font-semibold text-lg mb-2">{project.title}</h3>
                {project.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {project.description}
                  </p>
                )}
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Tasks: {project.taskCount || 0}</span>
                  <span>Last updated: {project.lastUpdated}</span>
                </div>
              </NeumorphicContainer>
            ))}
          </div>
        )}
      </div>

      {/* Users Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-700 flex items-center">
            <Users className="mr-2 h-5 w-5 text-[#0089AD]" />
            Team Members
          </h2>
          <div className="flex space-x-2">
            <Button
              onClick={() => setShowInviteModal(true)}
              className="bg-[#0089AD] hover:bg-[#0089AD]/90 text-white"
              size="sm"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Invite User
            </Button>
            <Button
              onClick={() =>
                navigate("/team", {
                  state: { organisationId: organisation.id },
                })
              }
              variant="outline"
              size="sm"
            >
              Manage Team
            </Button>
          </div>
        </div>

        {members.length === 0 ? (
          <NeumorphicContainer className="p-6 text-center" elevation="medium">
            <p className="text-gray-500">
              No team members found for this organisation.
            </p>
            <Button
              onClick={() => setShowInviteModal(true)}
              className="bg-[#0089AD] hover:bg-[#0089AD]/90 text-white mt-4"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Your First Team Member
            </Button>
          </NeumorphicContainer>
        ) : (
          <NeumorphicContainer className="p-4" elevation="medium">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-4 font-semibold text-gray-700">
                    Name
                  </th>
                  <th className="text-left py-2 px-4 font-semibold text-gray-700">
                    Email
                  </th>
                  <th className="text-left py-2 px-4 font-semibold text-gray-700">
                    Job Title
                  </th>
                  <th className="text-left py-2 px-4 font-semibold text-gray-700">
                    Role
                  </th>
                  <th className="text-right py-2 px-4 font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr
                    key={member.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4">{member.name}</td>
                    <td className="py-3 px-4">{member.email}</td>
                    <td className="py-3 px-4">{member.jobTitle || "-"}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {member.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {member.id !== organisation.user_id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={async () => {
                            try {
                              await organizationApi.removeUserFromOrganization(
                                member.id,
                                organisation.id,
                              );
                              setMembers(
                                members.filter((m) => m.id !== member.id),
                              );
                              toast({
                                title: "Member removed",
                                description: `${member.name} has been removed from the organization.`,
                              });
                            } catch (error: any) {
                              toast({
                                title: "Failed to remove member",
                                description:
                                  error.message ||
                                  "An unexpected error occurred.",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </NeumorphicContainer>
        )}

        {/* Invite User Modal */}
        <InviteUserModal
          open={showInviteModal}
          onOpenChange={setShowInviteModal}
          organizationId={organisation?.id || ""}
          onSuccess={() => {
            // Refresh the members list
            if (organisation) {
              organizationApi
                .getMembers(organisation.id)
                .then((data) => {
                  setMembers(data);
                })
                .catch((error) => {
                  console.error("Error refreshing members:", error);
                });
            }
          }}
        />

        {/* Edit Organization Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-800">
                Edit Organization
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Update the details of your organization.
              </DialogDescription>
            </DialogHeader>
            <OrganizationForm
              initialData={organisation}
              isEditing={true}
              onOrganizationCreated={(updatedOrg) => {
                setShowEditModal(false);
                setOrganisation(updatedOrg);
                toast({
                  title: "Organization updated",
                  description: `Organization "${updatedOrg.name}" has been updated successfully.`,
                });
              }}
              inModal={true}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default OrganisationDetails;
