import React, { useState, useEffect } from "react";
import { Check, Trash2, Loader2, Building, Users, Folder } from "lucide-react";
import NeumorphicContainer from "@/components/common/NeumorphicContainer";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { organizationApi, Organization } from "@/lib/api";
import { useNavigate } from "react-router-dom";

interface OrganisationListProps {
  organisations?: Organization[];
  onSetDefault?: (id: string) => void;
  onDelete?: (id: string) => void;
  onRefresh?: () => void;
}

const OrganisationList = ({
  organisations: initialOrganisations,
  onSetDefault,
  onDelete,
  onRefresh,
}: OrganisationListProps) => {
  const [organisations, setOrganisations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // If organisations are provided as props, use them
    if (initialOrganisations) {
      setOrganisations(initialOrganisations);
      setIsLoading(false);
      return;
    }

    // Otherwise fetch from API
    const fetchOrganisations = async () => {
      try {
        setIsLoading(true);
        console.log("OrganizationList: Fetching organisations...");
        const data = await organizationApi.getAll();
        console.log("OrganizationList: Organisations fetched:", data);

        // Check if data is valid
        if (!Array.isArray(data)) {
          console.error("OrganizationList: Invalid data format received", data);
          toast({
            title: "Data format error",
            description: "Received invalid data format from the server.",
            variant: "destructive",
          });
          setOrganisations([]);
          return;
        }

        setOrganisations(data);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error("OrganizationList: Error fetching organisations:", error);
        console.error("OrganizationList: Error details:", errorMessage);
        toast({
          title: "Failed to load organisations",
          description: `There was an error loading your organisations: ${errorMessage}`,
          variant: "destructive",
        });
        // Use empty array if fetch fails
        setOrganisations([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrganisations();
  }, [initialOrganisations, toast]);

  const handleSetDefault = async (id: string) => {
    try {
      await organizationApi.setDefault(id);

      // Update local state
      setOrganisations((prevOrgs) =>
        prevOrgs.map((org) => ({
          ...org,
          is_default: org.id === id,
        })),
      );

      toast({
        title: "Default organisation updated",
        description: "Default organisation has been updated successfully.",
      });

      if (onSetDefault) {
        onSetDefault(id);
      }

      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error setting default organisation:", error);
      toast({
        title: "Failed to update default organisation",
        description:
          "There was an error updating the default organisation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteOrganisation = async (id: string) => {
    const orgToDelete = organisations.find((org) => org.id === id);

    if (orgToDelete?.is_default) {
      toast({
        title: "Cannot delete default organisation",
        description: "Please set another organisation as default first.",
        variant: "destructive",
      });
      return;
    }

    try {
      await organizationApi.delete(id);

      // Update local state
      setOrganisations((prevOrgs) => prevOrgs.filter((org) => org.id !== id));

      toast({
        title: "Organisation deleted",
        description: "Organisation has been deleted successfully.",
      });

      if (onDelete) {
        onDelete(id);
      }

      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error deleting organisation:", error);
      toast({
        title: "Failed to delete organisation",
        description:
          "There was an error deleting the organisation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 size={30} className="animate-spin text-[#0089AD]" />
      </div>
    );
  }

  if (organisations.length === 0) {
    return (
      <NeumorphicContainer className="p-6 text-center" elevation="medium">
        <p className="text-gray-500">
          No organisations found. Create your first organisation using the
          button above.
        </p>
      </NeumorphicContainer>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {organisations.map((org) => (
        <NeumorphicContainer
          key={org.id}
          className="p-4 overflow-hidden h-full cursor-pointer transition-all hover:shadow-lg"
          elevation="medium"
          interactive
          onClick={() => {
            console.log(`Navigating to organization: ${org.id}`);
            console.log(`Navigation path: /organization/${org.id}`);
            navigate(`/organization/${org.id}`);
          }}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-start mb-3">
              <div className="flex-shrink-0 mr-3">
                <div className="w-16 h-16 rounded-full bg-[#0089AD]/10 flex items-center justify-center">
                  {org.logo ? (
                    <img
                      src={org.logo}
                      alt={org.name}
                      className="w-12 h-12 rounded-full"
                      onError={(e) => {
                        e.currentTarget.src = "";
                        e.currentTarget.style.display = "none";
                        e.currentTarget.parentElement!.innerHTML =
                          '<div class="flex items-center justify-center w-full h-full"><Building size={24} className="text-[#0089AD]" /></div>';
                      }}
                    />
                  ) : (
                    <Building size={24} className="text-[#0089AD]" />
                  )}
                </div>
              </div>
              <div className="flex-grow">
                <div className="flex items-center">
                  <h3 className="font-semibold text-lg">{org.name}</h3>
                  {org.is_default && (
                    <span className="ml-2 text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full flex items-center">
                      <Check size={12} className="mr-1" /> Default
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {org.description}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Created on {formatDate(org.created_at)}
                </p>
                <div className="flex space-x-4 mt-2">
                  <div className="flex items-center text-xs text-gray-600">
                    <Folder size={14} className="mr-1 text-[#0089AD]" />
                    <span>
                      {org.projectCount || 0}{" "}
                      {org.projectCount === 1 ? "Project" : "Projects"}
                    </span>
                  </div>
                  <div className="flex items-center text-xs text-gray-600">
                    <Users size={14} className="mr-1 text-[#0089AD]" />
                    <span>
                      {org.memberCount || 0}{" "}
                      {org.memberCount === 1 ? "Member" : "Members"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-auto pt-3 flex justify-end space-x-2 border-t border-gray-100">
              {!org.is_default && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSetDefault(org.id);
                  }}
                  className="text-sm"
                >
                  Set as Default
                </Button>
              )}
              {!org.is_default && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteOrganisation(org.id);
                  }}
                  className="text-sm text-red-500 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </Button>
              )}
            </div>
          </div>
        </NeumorphicContainer>
      ))}
    </div>
  );
};

export default OrganisationList;
