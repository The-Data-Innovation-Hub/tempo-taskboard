import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

const ResetTestUsersButton = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async () => {
    setIsLoading(true);
    try {
      // Direct database operations instead of using edge function
      // First, update the admin user's role
      const { error: adminRoleError } = await supabase
        .from("profiles")
        .update({ role: "admin" })
        .eq("email", "admin@example.com");

      if (adminRoleError) {
        console.error("Error updating admin role:", adminRoleError);
      }

      // Then update the regular user's role
      const { error: userRoleError } = await supabase
        .from("profiles")
        .update({ role: "user" })
        .eq("email", "user@example.com");

      if (userRoleError) {
        console.error("Error updating user role:", userRoleError);
      }

      toast({
        title: "Test users updated",
        description:
          "User roles have been updated. Please log out and log back in for changes to take effect.",
      });
    } catch (error) {
      console.error("Error resetting test users:", error);
      toast({
        title: "Reset failed",
        description:
          error instanceof Error ? error.message : "Failed to reset test users",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleReset}
      variant="outline"
      className="w-full mt-4"
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Resetting users...
        </>
      ) : (
        "Reset Test Users"
      )}
    </Button>
  );
};

export default ResetTestUsersButton;
