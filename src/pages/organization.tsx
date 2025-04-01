import React, { useState, useEffect } from "react";
import { Building, Plus } from "lucide-react";
import NeumorphicContainer from "../components/common/NeumorphicContainer";
import { useToast } from "../components/ui/use-toast";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { Organization as OrganizationType } from "@/lib/api";
import OrganizationForm from "@/components/organization/OrganizationForm";
import OrganizationList from "@/components/organization/OrganizationList";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const Organization = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Check if user is authenticated (temporarily removed admin check for testing)
  useEffect(() => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to access this page",
        variant: "destructive",
      });
      navigate("/");
    }
    // Temporarily commented out admin check for testing
    // if (user?.role !== "admin") {
    //   toast({
    //     title: "Access denied",
    //     description:
    //       "Only administrators can access the organization management page",
    //     variant: "destructive",
    //   });
    //   navigate("/");
    // }
  }, [user, navigate, toast]);

  const handleOrganizationCreated = (organization: OrganizationType) => {
    // Trigger a refresh of the organization list
    setRefreshTrigger((prev) => prev + 1);
    setIsModalOpen(false);
    toast({
      title: "Organization created",
      description: `Organization "${organization.name}" has been created successfully.`,
    });
  };

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="organization-page p-6 max-w-6xl mx-auto bg-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Organizations</h1>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#0089AD] hover:bg-[#0089AD]/90 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Organization
        </Button>
      </div>

      {/* Create Organization Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-800">
              Create New Organization
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Fill in the details to create a new organization.
            </DialogDescription>
          </DialogHeader>
          <OrganizationForm onOrganizationCreated={handleOrganizationCreated} />
        </DialogContent>
      </Dialog>

      {/* Organizations list */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">
          Your Organizations
        </h2>

        <OrganizationList
          key={refreshTrigger} // Force re-render when refreshTrigger changes
          onRefresh={handleRefresh}
        />
      </div>
    </div>
  );
};

export default Organization;
