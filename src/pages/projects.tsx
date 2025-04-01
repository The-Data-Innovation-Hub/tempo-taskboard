import React from "react";
import { useNavigate } from "react-router-dom";
import ProjectGrid from "@/components/dashboard/ProjectGrid";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const ProjectsPage = () => {
  const navigate = useNavigate();

  const handleBackToDashboard = () => {
    navigate("/");
  };

  const handleSelectProject = (id: string) => {
    navigate(`/project/${id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="w-full bg-white border-b border-gray-200">
        <div className="max-w-[1512px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBackToDashboard}
              className="rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </Button>

            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-gray-900">Projects</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1512px] mx-auto p-6">
        <ProjectGrid onSelectProject={handleSelectProject} />
      </main>
    </div>
  );
};

export default ProjectsPage;
