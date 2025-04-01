import React from "react";
import SupabaseConfigCheck from "@/components/SupabaseConfigCheck";

const SupabaseConfigPage = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Supabase Configuration</h1>
      <SupabaseConfigCheck />
    </div>
  );
};

export default SupabaseConfigPage;
