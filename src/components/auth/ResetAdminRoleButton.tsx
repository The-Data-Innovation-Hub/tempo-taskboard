import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";

const ResetAdminRoleButton = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { refreshSession } = useAuth();

  const handleReset = async () => {
    setIsLoading(true);
    try {
      // Direct database update instead of using edge function
      const { data, error } = await supabase
        .from("profiles")
        .update({ role: "admin" })
        .eq("email", "admin@example.com")
        .select();

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "Admin role reset",
        description:
          "Admin user role has been reset successfully. Please log out and log back in for changes to take effect.",
      });

      // Refresh the session to update the user role
      await refreshSession();
    } catch (error) {
      console.error("Error resetting admin role:", error);
      toast({
        title: "Reset failed",
        description:
          error instanceof Error ? error.message : "Failed to reset admin role",
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
          Resetting admin role...
        </>
      ) : (
        "Reset Admin Role"
      )}
    </Button>
  );
};

export default ResetAdminRoleButton;
