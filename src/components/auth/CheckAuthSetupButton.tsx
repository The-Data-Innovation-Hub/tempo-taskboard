import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { Database } from "@/types/supabase";

type UsersCountResult =
  | Database["public"]["Tables"]["users"]["Row"][]
  | { count: number }[];
type ProfilesCountResult =
  | Database["public"]["Tables"]["profiles"]["Row"][]
  | { count: number }[];

const CheckAuthSetupButton = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleCheck = async () => {
    setIsLoading(true);
    try {
      // Direct database queries instead of using edge function
      // Check users table
      const { data: usersData, error: usersError } = (await supabase
        .from("users")
        .select("count(*)")) as { data: UsersCountResult | null; error: any };

      // Check profiles table
      const { data: profilesData, error: profilesError } = (await supabase
        .from("profiles")
        .select("count(*)")) as {
        data: ProfilesCountResult | null;
        error: any;
      };

      // Check admin user
      const { data: adminData, error: adminError } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", "admin@example.com");

      // Check regular user
      const { data: regularUserData, error: regularUserError } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", "user@example.com");

      const result = {
        users_table: usersError ? { error: usersError.message } : usersData,
        profiles_table: profilesError
          ? { error: profilesError.message }
          : profilesData,
        admin_user: adminError ? { error: adminError.message } : adminData,
        regular_user: regularUserError
          ? { error: regularUserError.message }
          : regularUserData,
      };

      toast({
        title: "Auth Setup Check",
        description: (
          <pre className="mt-2 w-full rounded-md bg-slate-950 p-4 overflow-x-auto">
            <code className="text-white text-xs">
              {JSON.stringify(result, null, 2)}
            </code>
          </pre>
        ),
      });
    } catch (error) {
      console.error("Error checking auth setup:", error);
      toast({
        title: "Check failed",
        description:
          error instanceof Error ? error.message : "Failed to check auth setup",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCheck}
      variant="outline"
      className="w-full mt-4"
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Checking auth setup...
        </>
      ) : (
        "Check Auth Setup"
      )}
    </Button>
  );
};

export default CheckAuthSetupButton;
