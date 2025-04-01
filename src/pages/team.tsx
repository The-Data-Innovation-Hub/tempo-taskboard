import React, { useState, useEffect } from "react";
import { Mail, UserPlus, Check, Shield, User as UserIcon } from "lucide-react";
import NeumorphicContainer from "../components/common/NeumorphicContainer";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { useToast } from "../components/ui/use-toast";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  status: "active" | "pending";
}

const Team = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  // Check if user is admin
  useEffect(() => {
    if (user?.role !== "admin") {
      toast({
        title: "Access denied",
        description: "Only administrators can access the team management page",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [user, navigate, toast]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      role: "Admin",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=john",
      status: "active",
    },
    {
      id: "2",
      name: "Jane Smith",
      email: "jane@example.com",
      role: "Editor",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=jane",
      status: "active",
    },
    {
      id: "3",
      name: "Mike Johnson",
      email: "mike@example.com",
      role: "Viewer",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mike",
      status: "pending",
    },
  ]);

  const handleInvite = () => {
    if (!email || !email.includes("@")) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    // Check if email already exists
    if (teamMembers.some((member) => member.email === email)) {
      toast({
        title: "Already invited",
        description: "This email has already been invited",
        variant: "destructive",
      });
      return;
    }

    // Add new pending team member
    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: email.split("@")[0], // Use part of email as temporary name
      email,
      role: "Viewer",
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
      status: "pending",
    };

    setTeamMembers([...teamMembers, newMember]);
    setEmail("");

    toast({
      title: "Invitation sent",
      description: `An invitation has been sent to ${email}`,
    });
  };

  return (
    <div className="team-page p-6 max-w-6xl mx-auto bg-white">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Team Members</h1>

      {/* Team members grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {teamMembers.map((member) => (
          <NeumorphicContainer
            key={member.id}
            className="p-0 overflow-hidden cursor-pointer"
            elevation="medium"
            interactive
          >
            <div className="p-4 flex items-center space-x-4">
              <div className="flex-shrink-0">
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="w-16 h-16 rounded-full"
                />
              </div>
              <div className="flex-grow">
                <h3 className="font-semibold text-lg">{member.name}</h3>
                <div className="flex items-center text-gray-600">
                  <Mail size={14} className="mr-1" />
                  <span className="text-sm">{member.email}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm text-gray-500">{member.role}</span>
                  {member.status === "pending" ? (
                    <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                      Pending
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full flex items-center">
                      <Check size={12} className="mr-1" /> Active
                    </span>
                  )}
                </div>
              </div>
            </div>
          </NeumorphicContainer>
        ))}
      </div>
    </div>
  );
};

export default Team;
