import React, { useState, useEffect } from "react";
import { Check, ChevronDown, Building, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { organizationApi, Organization } from "@/lib/api";

interface OrganizationSelectorProps {
  onOrganizationChange?: (organization: Organization) => void;
  className?: string;
}

const OrganizationSelector = ({
  onOrganizationChange,
  className = "",
}: OrganizationSelectorProps) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;
    const fetchOrganizations = async () => {
      try {
        setIsLoading(true);
        const data = await organizationApi.getAll();

        // Only update state if component is still mounted
        if (!isMounted) return;

        setOrganizations(data);

        // Set default organization as selected
        const defaultOrg = data.find((org) => org.is_default);
        if (defaultOrg) {
          setSelectedOrg(defaultOrg);
          if (onOrganizationChange) {
            onOrganizationChange(defaultOrg);
          }
        } else if (data.length > 0) {
          // If no default, use the first one
          setSelectedOrg(data[0]);
          if (onOrganizationChange) {
            onOrganizationChange(data[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching organizations:", error);
        if (isMounted) {
          toast({
            title: "Failed to load organizations",
            description: "There was an error loading your organizations.",
            variant: "destructive",
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchOrganizations();

    // Cleanup function to prevent state updates after unmounting
    return () => {
      isMounted = false;
    };
  }, [toast]); // Removed onOrganizationChange from dependencies to prevent re-fetching

  const handleSelectOrganization = (org: Organization) => {
    setSelectedOrg(org);
    if (onOrganizationChange) {
      onOrganizationChange(org);
    }
  };

  if (isLoading) {
    return (
      <Button
        variant="outline"
        className={`flex items-center gap-2 ${className}`}
        disabled
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading...</span>
      </Button>
    );
  }

  if (organizations.length === 0) {
    return (
      <Button
        variant="outline"
        className={`flex items-center gap-2 ${className}`}
        onClick={() => {
          toast({
            title: "No organizations",
            description: "Please create an organization first.",
          });
        }}
      >
        <Building className="h-4 w-4" />
        <span>No Organizations</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={`flex items-center gap-2 ${className}`}
        >
          {selectedOrg?.logo ? (
            <img
              src={selectedOrg.logo}
              alt={selectedOrg.name}
              className="h-4 w-4 rounded-full"
            />
          ) : (
            <Building className="h-4 w-4" />
          )}
          <span className="max-w-[150px] truncate">
            {selectedOrg?.name || "Select Organization"}
          </span>
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => handleSelectOrganization(org)}
            className="flex items-center gap-2 cursor-pointer"
          >
            {org.logo ? (
              <img
                src={org.logo}
                alt={org.name}
                className="h-5 w-5 rounded-full"
              />
            ) : (
              <Building className="h-5 w-5" />
            )}
            <span className="flex-1 truncate">{org.name}</span>
            {org.is_default && (
              <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-800 rounded-full flex items-center">
                <Check size={10} className="mr-1" /> Default
              </span>
            )}
            {selectedOrg?.id === org.id && (
              <Check className="h-4 w-4 text-[#0089AD]" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default OrganizationSelector;
