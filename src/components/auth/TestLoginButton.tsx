import React from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/use-toast";

interface TestLoginButtonProps {
  email: string;
  password: string;
  label: string;
}

const TestLoginButton = ({
  email = "admin@example.com",
  password = "password123",
  label = "Login as Admin",
}: TestLoginButtonProps) => {
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      console.log(`Attempting to login with ${email} and password`);
      const user = await login(email, password);
      console.log("Login successful, user:", user);
      console.log("User role:", user.role);
      console.log("Is admin:", user.role === "admin");
      toast({
        title: "Login successful",
        description: `Logged in as ${user.name || email} with role ${user.role}`,
      });
    } catch (error) {
      console.error("Test login error:", error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleLogin}
      className="w-full bg-[#0089AD] hover:bg-[#007a9d] text-white"
      disabled={isLoading}
    >
      {isLoading ? "Logging in..." : label}
    </Button>
  );
};

export default TestLoginButton;
