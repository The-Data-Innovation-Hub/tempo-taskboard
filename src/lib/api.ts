import { supabase } from "./supabase";
import { User, UserRole } from "./auth";
import type { Database } from "@/types/supabase";

// Type definitions for Supabase responses
type SupabaseResponse<T> = {
  data: T | null;
  error: Error | null;
};

type SupabaseCountResponse = {
  count: number | null;
  error: Error | null;
};

type SupabaseListResponse<T> = {
  data: T[] | null;
  error: Error | null;
};

type SupabaseSingleResponse<T> = {
  data: T;
  error: Error | null;
};

type SupabaseAuthResponse = {
  data: {
    user: any;
    session: any;
  };
  error: Error | null;
};

type SupabaseStorageResponse = {
  data: any;
  error: Error | null;
};

// Organization types
export interface Organization {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  created_at: string;
  is_default: boolean;
  user_id: string;
  projectCount?: number;
  memberCount?: number;
}

// Project types
export interface Project {
  id: string;
  title: string;
  description?: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  organization_id?: string;
  user_id: string;
  // Computed properties
  lastUpdated?: string;
  memberCount?: number;
  taskCount?: number;
}

// Column types
export interface Column {
  id: string;
  title: string;
  project_id: string;
  order: number;
  created_at: string;
  updated_at: string;
  tasks?: Task[];
}

// Task file types
export interface TaskFile {
  id: string;
  task_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  created_at: string;
  updated_at: string;
}

// Task types
export interface Task {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  column_id: string;
  project_id: string;
  order: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  completed_at?: string;
  is_completed?: boolean;
  labels?: Label[];
  assignees?: User[];
  commentsCount?: number;
  files?: TaskFile[];
}

// Label types
export interface Label {
  id: string;
  name: string;
  color: string;
  organization_id?: string;
  created_at: string;
}

// Organization member types
export interface OrganizationMember {
  id: string;
  name: string;
  email: string;
  role: string;
  jobTitle?: string;
  avatar?: string;
  created_at: string;
}

// API functions for users
export const userApi = {
  async getAll(): Promise<User[]> {
    try {
      console.log("API: Fetching all users");
      const { data, error } = (await supabase
        .from("profiles")
        .select("*, organizations(*), user_projects(project_id, projects(*))")
        .order("created_at", { ascending: false })) as SupabaseListResponse<
        Database["public"]["Tables"]["profiles"]["Row"] & {
          organizations:
            | Database["public"]["Tables"]["organizations"]["Row"]
            | null;
          user_projects:
            | {
                project_id: string;
                projects: Database["public"]["Tables"]["projects"]["Row"];
              }[]
            | null;
        }
      >;

      if (error) {
        console.error("API: Error fetching all users:", error);
        throw error;
      }

      console.log(`API: Found ${data?.length || 0} users`);
      return data.map((profile) => ({
        id: profile.id,
        name: profile.name || "",
        email: profile.email || "",
        role: (profile.role as UserRole) || "user",
        jobTitle: profile.job_title,
        organizationId: profile.organization_id,
        organization: profile.organizations,
        avatar:
          profile.avatar ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.email}`,
        projects: profile.user_projects?.map((up) => up.projects) || [],
      }));
    } catch (error) {
      console.error("API: Exception in getAll users:", error);
      throw error;
    }
  },

  async getById(id: string): Promise<User | null> {
    try {
      console.log("API: Fetching user with ID:", id);
      const { data, error } = (await supabase
        .from("profiles")
        .select("*, organizations(*), user_projects(project_id, projects(*))")
        .eq("id", id)
        .single()) as SupabaseSingleResponse<
        Database["public"]["Tables"]["profiles"]["Row"] & {
          organizations:
            | Database["public"]["Tables"]["organizations"]["Row"]
            | null;
          user_projects:
            | {
                project_id: string;
                projects: Database["public"]["Tables"]["projects"]["Row"];
              }[]
            | null;
        }
      >;

      if (error) {
        console.error("API: Error fetching user:", error);
        throw error;
      }

      return {
        id: data.id,
        name: data.name || "",
        email: data.email || "",
        role: (data.role as UserRole) || "user",
        jobTitle: data.job_title,
        organizationId: data.organization_id,
        organization: data.organizations,
        avatar:
          data.avatar ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.email}`,
        projects: data.user_projects?.map((up) => up.projects) || [],
      };
    } catch (error) {
      console.error("API: Exception in getById user:", error);
      throw error;
    }
  },

  async create(userData: {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
    jobTitle?: string;
    organizationId?: string;
    projects?: string[];
  }): Promise<User> {
    try {
      // 1. Create the user in auth.users
      const { data: authData, error: authError } = (await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            role: userData.role || "user",
          },
        },
      })) as SupabaseAuthResponse;

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create user");

      // 2. IMPORTANT: Create the user record in public.users FIRST
      // This is critical for RLS policies to work correctly
      const { error: userError } = (await supabase
        .from("users")
        .insert([{ id: authData.user.id }])) as SupabaseResponse<any>;

      if (userError) {
        console.error("Error creating user record:", userError);
        throw new Error(`Failed to create user record: ${userError.message}`);
      }

      // 3. Create the profile record AFTER the user record exists
      const { error: profileError } = (await supabase.from("profiles").insert([
        {
          id: authData.user.id,
          name: userData.name,
          email: userData.email,
          role: userData.role || "user",
          job_title: userData.jobTitle,
          organization_id: userData.organizationId,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.email}`,
        },
      ])) as SupabaseResponse<any>;

      if (profileError) {
        console.error("Error creating profile:", profileError);
        throw new Error(`Failed to create profile: ${profileError.message}`);
      }

      // 4. Add project associations if provided
      if (userData.projects && userData.projects.length > 0) {
        const projectAssociations = userData.projects.map((projectId) => ({
          user_id: authData.user!.id,
          project_id: projectId,
        }));

        const { error: projectError } = (await supabase
          .from("user_projects")
          .insert(projectAssociations)) as SupabaseResponse<any>;

        if (projectError) {
          console.error("Error associating projects:", projectError);
          throw new Error(
            `Failed to associate projects: ${projectError.message}`,
          );
        }
      }

      // 5. Return the created user
      return {
        id: authData.user.id,
        name: userData.name,
        email: userData.email,
        role: userData.role || "user",
        jobTitle: userData.jobTitle,
        organizationId: userData.organizationId,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.email}`,
      };
    } catch (error) {
      console.error("API: Exception in create user:", error);
      throw error;
    }
  },

  async update(
    id: string,
    updates: {
      name?: string;
      password?: string;
      role?: UserRole;
      jobTitle?: string;
      organizationId?: string;
      projects?: string[];
    },
  ): Promise<void> {
    try {
      // 1. Update password if provided
      if (updates.password) {
        const { error: passwordError } =
          (await supabase.auth.admin.updateUserById(id, {
            password: updates.password,
          })) as SupabaseResponse<any>;
        if (passwordError) throw passwordError;
      }

      // 2. Update profile information
      const profileUpdates: any = {};
      if (updates.name) profileUpdates.name = updates.name;
      if (updates.role) profileUpdates.role = updates.role;
      if (updates.jobTitle) profileUpdates.job_title = updates.jobTitle;
      if (updates.organizationId)
        profileUpdates.organization_id = updates.organizationId;

      if (Object.keys(profileUpdates).length > 0) {
        const { error: profileError } = (await supabase
          .from("profiles")
          .update(profileUpdates)
          .eq("id", id)) as SupabaseResponse<any>;

        if (profileError) throw profileError;
      }

      // 3. Update project associations if provided
      if (updates.projects) {
        // First delete existing associations
        const { error: deleteError } = (await supabase
          .from("user_projects")
          .delete()
          .eq("user_id", id)) as SupabaseResponse<any>;

        if (deleteError) throw deleteError;

        // Then add new associations
        if (updates.projects.length > 0) {
          const projectAssociations = updates.projects.map((projectId) => ({
            user_id: id,
            project_id: projectId,
          }));

          const { error: insertError } = (await supabase
            .from("user_projects")
            .insert(projectAssociations)) as SupabaseResponse<any>;

          if (insertError) throw insertError;
        }
      }
    } catch (error) {
      console.error("API: Exception in update user:", error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      // 1. Delete user projects associations
      const { error: projectsError } = (await supabase
        .from("user_projects")
        .delete()
        .eq("user_id", id)) as SupabaseResponse<any>;

      if (projectsError) throw projectsError;

      // 2. Delete profile
      const { error: profileError } = (await supabase
        .from("profiles")
        .delete()
        .eq("id", id)) as SupabaseResponse<any>;

      if (profileError) throw profileError;

      // 3. Delete auth user
      const { error: authError } = (await supabase.auth.admin.deleteUser(
        id,
      )) as SupabaseResponse<any>;

      if (authError) throw authError;
    } catch (error) {
      console.error("API: Exception in delete user:", error);
      throw error;
    }
  },
};

// API functions for organizations
export const organizationApi = {
  async getAll(): Promise<Organization[]> {
    try {
      console.log("API: Fetching all organizations");
      const { data, error } = (await supabase
        .from("organizations")
        .select("*")
        .order("created_at", { ascending: false })) as SupabaseListResponse<
        Database["public"]["Tables"]["organizations"]["Row"]
      >;

      if (error) {
        // Check if it's a missing table error
        if (
          error.code === "42P01" &&
          error.message.includes(
            'relation "public.organizations" does not exist',
          )
        ) {
          console.warn(
            "Organizations table doesn't exist yet. This is expected if you haven't run the migration.",
          );
          return [];
        }

        console.error("API: Error fetching all organizations:", error);
        throw error;
      }

      console.log(`API: Found ${data?.length || 0} organizations`);

      // Fetch project counts and member counts for each organization
      const orgsWithCounts = await Promise.all(
        (data || []).map(async (org) => {
          // Get project count
          let projectCount = 0;
          try {
            const { count: projectsCount, error: projectsError } =
              (await supabase
                .from("projects")
                .select("*", { count: "exact", head: true })
                .eq("organization_id", org.id)) as SupabaseCountResponse;

            if (!projectsError && projectsCount !== null) {
              projectCount = projectsCount;
            } else if (projectsError?.code === "42P01") {
              console.warn(
                "Projects table doesn't exist yet. This is expected if you haven't run the migration.",
              );
            } else if (projectsError) {
              console.warn(
                `Error fetching project count for organization ${org.id}:`,
                projectsError,
              );
            }
          } catch (countError) {
            console.warn(
              `Error fetching project count for organization ${org.id}:`,
              countError,
            );
          }

          // Get member count
          let memberCount = 0;
          try {
            const { count: membersCount, error: membersError } = (await supabase
              .from("profiles")
              .select("*", { count: "exact", head: true })
              .eq("organization_id", org.id)) as SupabaseCountResponse;

            if (!membersError && membersCount !== null) {
              memberCount = membersCount;
            } else if (membersError?.code === "42P01") {
              console.warn(
                "Profiles table doesn't exist yet. This is expected if you haven't run the migration.",
              );
            } else if (membersError) {
              console.warn(
                `Error fetching member count for organization ${org.id}:`,
                membersError,
              );
            }
          } catch (countError) {
            console.warn(
              `Error fetching member count for organization ${org.id}:`,
              countError,
            );
          }

          return {
            ...org,
            projectCount,
            memberCount,
          };
        }),
      );

      return orgsWithCounts;
    } catch (error) {
      console.error("API: Exception in getAll:", error);

      // Check if it's a missing table error
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "42P01" &&
        "message" in error &&
        typeof error.message === "string" &&
        error.message.includes('relation "public.organizations" does not exist')
      ) {
        console.warn(
          "Organizations table doesn't exist yet. This is expected if you haven't run the migration.",
        );
        return [];
      }

      throw error;
    }
  },

  async getById(id: string): Promise<Organization | null> {
    try {
      console.log("API: Fetching organization with ID:", id);
      const { data, error } = (await supabase
        .from("organizations")
        .select("*")
        .eq("id", id)
        .single()) as SupabaseSingleResponse<
        Database["public"]["Tables"]["organizations"]["Row"]
      >;

      if (error) {
        if (error.code === "PGRST116") {
          console.log(`Organization with ID ${id} not found`);
          return null;
        }
        console.error("API: Error fetching organization:", error);
        throw error;
      }

      // Get project count
      let projectCount = 0;
      try {
        const { count, error: countError } = (await supabase
          .from("projects")
          .select("*", { count: "exact", head: true })
          .eq("organization_id", id)) as SupabaseCountResponse;

        if (!countError && count !== null) {
          projectCount = count;
        }
      } catch (countError) {
        console.warn(
          `Error fetching project count for organization ${id}:`,
          countError,
        );
      }

      // Get member count
      let memberCount = 0;
      try {
        const { count, error: countError } = (await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("organization_id", id)) as SupabaseCountResponse;

        if (!countError && count !== null) {
          memberCount = count;
        }
      } catch (countError) {
        console.warn(
          `Error fetching member count for organization ${id}:`,
          countError,
        );
      }

      return {
        ...data,
        projectCount,
        memberCount,
        is_default: false, // This field is not in the database but required by the interface
        user_id: "", // This field is not in the database but required by the interface
      };
    } catch (error) {
      console.error("API: Exception in getById organization:", error);
      throw error;
    }
  },

  async create(orgData: {
    name: string;
    description?: string;
    logo?: string;
    userId: string;
  }): Promise<Organization> {
    try {
      console.log("API: Creating new organization");
      const { data, error } = (await supabase
        .from("organizations")
        .insert([
          {
            name: orgData.name,
            description: orgData.description || null,
            logo: orgData.logo || null,
          },
        ])
        .select()) as SupabaseListResponse<
        Database["public"]["Tables"]["organizations"]["Row"]
      >;

      if (error) {
        console.error("API: Error creating organization:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error("Failed to create organization: No data returned");
      }

      const newOrg = data[0];
      return {
        ...newOrg,
        is_default: false,
        user_id: orgData.userId,
        projectCount: 0,
        memberCount: 0,
      };
    } catch (error) {
      console.error("API: Exception in create organization:", error);
      throw error;
    }
  },

  async update(
    id: string,
    updates: {
      name?: string;
      description?: string;
      logo?: string;
    },
  ): Promise<Organization> {
    try {
      console.log("API: Updating organization with ID:", id);
      const { data, error } = (await supabase
        .from("organizations")
        .update(updates)
        .eq("id", id)
        .select()) as SupabaseListResponse<
        Database["public"]["Tables"]["organizations"]["Row"]
      >;

      if (error) {
        console.error("API: Error updating organization:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error(
          `Failed to update organization with ID ${id}: No data returned`,
        );
      }

      const updatedOrg = data[0];
      return {
        ...updatedOrg,
        is_default: false, // This field is not in the database but required by the interface
        user_id: "", // This field is not in the database but required by the interface
        projectCount: 0,
        memberCount: 0,
      };
    } catch (error) {
      console.error("API: Exception in update organization:", error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      console.log("API: Deleting organization with ID:", id);

      // First update any profiles that reference this organization
      const { error: profilesError } = (await supabase
        .from("profiles")
        .update({ organization_id: null })
        .eq("organization_id", id)) as SupabaseResponse<any>;

      if (profilesError) {
        console.error(
          "API: Error updating profiles for organization deletion:",
          profilesError,
        );
        throw profilesError;
      }

      // Then update any projects that reference this organization
      const { error: projectsError } = (await supabase
        .from("projects")
        .update({ organization_id: null })
        .eq("organization_id", id)) as SupabaseResponse<any>;

      if (projectsError) {
        console.error(
          "API: Error updating projects for organization deletion:",
          projectsError,
        );
        throw projectsError;
      }

      // Finally delete the organization
      const { error } = (await supabase
        .from("organizations")
        .delete()
        .eq("id", id)) as SupabaseResponse<any>;

      if (error) {
        console.error("API: Error deleting organization:", error);
        throw error;
      }
    } catch (error) {
      console.error("API: Exception in delete organization:", error);
      throw error;
    }
  },

  async getMembers(organizationId: string): Promise<OrganizationMember[]> {
    try {
      console.log("API: Fetching members for organization ID:", organizationId);
      const { data, error } = (await supabase
        .from("profiles")
        .select("*")
        .eq("organization_id", organizationId)
        .order("name")) as SupabaseListResponse<
        Database["public"]["Tables"]["profiles"]["Row"]
      >;

      if (error) {
        console.error("API: Error fetching organization members:", error);
        throw error;
      }

      return (data || []).map((profile) => ({
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        jobTitle: profile.job_title || undefined,
        avatar:
          profile.avatar ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.email}`,
        created_at: profile.created_at,
      }));
    } catch (error) {
      console.error("API: Exception in getMembers:", error);
      throw error;
    }
  },
};

// API functions for projects
export const projectApi = {
  async getAll(): Promise<Project[]> {
    try {
      console.log("API: Fetching all projects");
      const { data, error } = (await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false })) as SupabaseListResponse<
        Database["public"]["Tables"]["projects"]["Row"]
      >;

      if (error) {
        // Check if it's a missing table error
        if (
          error.code === "42P01" &&
          error.message.includes('relation "public.projects" does not exist')
        ) {
          console.warn(
            "Projects table doesn't exist yet. This is expected if you haven't run the migration.",
          );
          return [];
        }

        console.error("API: Error fetching all projects:", error);
        throw error;
      }

      console.log(`API: Found ${data?.length || 0} projects`);
      return data || [];
    } catch (error) {
      console.error("API: Exception in getAll projects:", error);

      // Check if it's a missing table error
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "42P01" &&
        "message" in error &&
        typeof error.message === "string" &&
        error.message.includes('relation "public.projects" does not exist')
      ) {
        console.warn(
          "Projects table doesn't exist yet. This is expected if you haven't run the migration.",
        );
        return [];
      }

      throw error;
    }
  },

  async getById(id: string): Promise<Project | null> {
    try {
      console.log("API: Fetching project with ID:", id);
      const { data, error } = (await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .single()) as SupabaseSingleResponse<
        Database["public"]["Tables"]["projects"]["Row"]
      >;

      if (error) {
        if (error.code === "PGRST116") {
          console.log(`Project with ID ${id} not found`);
          return null;
        }
        console.error("API: Error fetching project:", error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error("API: Exception in getById project:", error);
      throw error;
    }
  },

  async getByUserId(userId: string): Promise<Project[]> {
    try {
      console.log("API: Fetching projects for user ID:", userId);

      // First try to get projects directly owned by the user
      const { data: ownedProjects, error: ownedError } = (await supabase
        .from("projects")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })) as SupabaseListResponse<
        Database["public"]["Tables"]["projects"]["Row"]
      >;

      if (ownedError) {
        console.error("API: Error fetching owned projects:", ownedError);
        throw ownedError;
      }

      // Then get projects the user is associated with through user_projects
      const { data: associatedData, error: associatedError } = (await supabase
        .from("user_projects")
        .select("project_id, projects(*)")
        .eq("user_id", userId)) as SupabaseListResponse<{
        project_id: string;
        projects: Database["public"]["Tables"]["projects"]["Row"];
      }>;

      if (associatedError) {
        console.error(
          "API: Error fetching associated projects:",
          associatedError,
        );
        throw associatedError;
      }

      // Extract the projects from the associated data
      const associatedProjects = (associatedData || [])
        .map((item) => item.projects)
        .filter(
          (
            project,
          ): project is Database["public"]["Tables"]["projects"]["Row"] =>
            !!project,
        );

      // Combine the two lists, removing duplicates by ID
      const allProjects = [...(ownedProjects || [])];

      // Add associated projects that aren't already in the list
      for (const project of associatedProjects) {
        if (!allProjects.some((p) => p.id === project.id)) {
          allProjects.push(project);
        }
      }

      return allProjects;
    } catch (error) {
      console.error("API: Exception in getByUserId projects:", error);
      throw error;
    }
  },

  async getByOrganizationId(organizationId: string): Promise<Project[]> {
    try {
      console.log(
        "API: Fetching projects for organization ID:",
        organizationId,
      );
      const { data, error } = (await supabase
        .from("projects")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })) as SupabaseListResponse<
        Database["public"]["Tables"]["projects"]["Row"]
      >;

      if (error) {
        console.error("API: Error fetching organization projects:", error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error("API: Exception in getByOrganizationId projects:", error);
      throw error;
    }
  },

  async create(projectData: {
    title: string;
    description?: string;
    organizationId?: string;
    userId: string;
    isFavorite?: boolean;
  }): Promise<Project> {
    try {
      console.log("API: Creating new project");
      const { data, error } = (await supabase
        .from("projects")
        .insert([
          {
            title: projectData.title,
            description: projectData.description || null,
            organization_id: projectData.organizationId || null,
            user_id: projectData.userId,
            is_favorite: projectData.isFavorite || false,
          },
        ])
        .select()) as SupabaseListResponse<
        Database["public"]["Tables"]["projects"]["Row"]
      >;

      if (error) {
        console.error("API: Error creating project:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error("Failed to create project: No data returned");
      }

      const newProject = data[0];

      // Create default columns for the new project
      try {
        await this.createDefaultColumns(newProject.id);
      } catch (columnError) {
        console.error("API: Error creating default columns:", columnError);
        // Continue even if column creation fails
      }

      return newProject;
    } catch (error) {
      console.error("API: Exception in create project:", error);
      throw error;
    }
  },

  async createDefaultColumns(projectId: string): Promise<void> {
    try {
      console.log("API: Creating default columns for project ID:", projectId);
      const defaultColumns = [
        { title: "Backlog", order: 0 },
        { title: "In Progress", order: 1 },
        { title: "Completed", order: 2 },
      ];

      const columnsToInsert = defaultColumns.map((column) => ({
        title: column.title,
        project_id: projectId,
        order: column.order,
      }));

      const { error } = (await supabase
        .from("columns")
        .insert(columnsToInsert)) as SupabaseResponse<any>;

      if (error) {
        console.error("API: Error creating default columns:", error);
        throw error;
      }
    } catch (error) {
      console.error("API: Exception in createDefaultColumns:", error);
      throw error;
    }
  },

  async update(
    id: string,
    updates: {
      title?: string;
      description?: string;
      organizationId?: string | null;
      isFavorite?: boolean;
    },
  ): Promise<Project> {
    try {
      console.log("API: Updating project with ID:", id);

      // Convert the updates to match the database column names
      const dbUpdates: Partial<
        Database["public"]["Tables"]["projects"]["Update"]
      > = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.description !== undefined)
        dbUpdates.description = updates.description;
      if (updates.organizationId !== undefined)
        dbUpdates.organization_id = updates.organizationId;
      if (updates.isFavorite !== undefined)
        dbUpdates.is_favorite = updates.isFavorite;

      const { data, error } = (await supabase
        .from("projects")
        .update(dbUpdates)
        .eq("id", id)
        .select()) as SupabaseListResponse<
        Database["public"]["Tables"]["projects"]["Row"]
      >;

      if (error) {
        console.error("API: Error updating project:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error(
          `Failed to update project with ID ${id}: No data returned`,
        );
      }

      return data[0];
    } catch (error) {
      console.error("API: Exception in update project:", error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      console.log("API: Deleting project with ID:", id);

      // First delete all columns (which will cascade to tasks)
      const { error: columnsError } = (await supabase
        .from("columns")
        .delete()
        .eq("project_id", id)) as SupabaseResponse<any>;

      if (columnsError) {
        console.error("API: Error deleting project columns:", columnsError);
        throw columnsError;
      }

      // Delete user project associations
      const { error: userProjectsError } = (await supabase
        .from("user_projects")
        .delete()
        .eq("project_id", id)) as SupabaseResponse<any>;

      if (userProjectsError) {
        console.error(
          "API: Error deleting user project associations:",
          userProjectsError,
        );
        throw userProjectsError;
      }

      // Finally delete the project
      const { error } = (await supabase
        .from("projects")
        .delete()
        .eq("id", id)) as SupabaseResponse<any>;

      if (error) {
        console.error("API: Error deleting project:", error);
        throw error;
      }
    } catch (error) {
      console.error("API: Exception in delete project:", error);
      throw error;
    }
  },

  async addUser(projectId: string, userId: string): Promise<void> {
    try {
      console.log(`API: Adding user ${userId} to project ${projectId}`);
      const { error } = (await supabase.from("user_projects").insert([
        {
          user_id: userId,
          project_id: projectId,
        },
      ])) as SupabaseResponse<any>;

      if (error) {
        // Check if it's a duplicate key error
        if (error.code === "23505") {
          console.log(
            `User ${userId} is already associated with project ${projectId}`,
          );
          return;
        }
        console.error("API: Error adding user to project:", error);
        throw error;
      }
    } catch (error) {
      console.error("API: Exception in addUser to project:", error);
      throw error;
    }
  },

  async removeUser(projectId: string, userId: string): Promise<void> {
    try {
      console.log(`API: Removing user ${userId} from project ${projectId}`);
      const { error } = (await supabase
        .from("user_projects")
        .delete()
        .eq("project_id", projectId)
        .eq("user_id", userId)) as SupabaseResponse<any>;

      if (error) {
        console.error("API: Error removing user from project:", error);
        throw error;
      }
    } catch (error) {
      console.error("API: Exception in removeUser from project:", error);
      throw error;
    }
  },

  async getUsers(projectId: string): Promise<User[]> {
    try {
      console.log("API: Fetching users for project ID:", projectId);
      const { data, error } = (await supabase
        .from("user_projects")
        .select("user_id, profiles(*)")
        .eq("project_id", projectId)) as SupabaseListResponse<{
        user_id: string;
        profiles: Database["public"]["Tables"]["profiles"]["Row"];
      }>;

      if (error) {
        console.error("API: Error fetching project users:", error);
        throw error;
      }

      return (data || [])
        .filter((item) => item.profiles) // Filter out any null profiles
        .map((item) => ({
          id: item.profiles.id,
          name: item.profiles.name,
          email: item.profiles.email,
          role: item.profiles.role as UserRole,
          jobTitle: item.profiles.job_title || undefined,
          organizationId: item.profiles.organization_id || undefined,
          avatar:
            item.profiles.avatar ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.profiles.email}`,
        }));
    } catch (error) {
      console.error("API: Exception in getUsers for project:", error);
      throw error;
    }
  },
};

// API functions for columns
export const columnApi = {
  async getByProjectId(projectId: string): Promise<Column[]> {
    try {
      console.log("API: Fetching columns for project ID:", projectId);
      const { data, error } = (await supabase
        .from("columns")
        .select("*")
        .eq("project_id", projectId)
        .order("order")) as SupabaseListResponse<
        Database["public"]["Tables"]["columns"]["Row"]
      >;

      if (error) {
        console.error("API: Error fetching project columns:", error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error("API: Exception in getByProjectId columns:", error);
      throw error;
    }
  },

  async getById(id: string): Promise<Column | null> {
    try {
      console.log("API: Fetching column with ID:", id);
      const { data, error } = (await supabase
        .from("columns")
        .select("*")
        .eq("id", id)
        .single()) as SupabaseSingleResponse<
        Database["public"]["Tables"]["columns"]["Row"]
      >;

      if (error) {
        if (error.code === "PGRST116") {
          console.log(`Column with ID ${id} not found`);
          return null;
        }
        console.error("API: Error fetching column:", error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error("API: Exception in getById column:", error);
      throw error;
    }
  },

  async create(columnData: {
    title: string;
    projectId: string;
    order: number;
  }): Promise<Column> {
    try {
      console.log("API: Creating new column");
      const { data, error } = (await supabase
        .from("columns")
        .insert([
          {
            title: columnData.title,
            project_id: columnData.projectId,
            order: columnData.order,
          },
        ])
        .select()) as SupabaseListResponse<
        Database["public"]["Tables"]["columns"]["Row"]
      >;

      if (error) {
        console.error("API: Error creating column:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error("Failed to create column: No data returned");
      }

      return data[0];
    } catch (error) {
      console.error("API: Exception in create column:", error);
      throw error;
    }
  },

  async update(
    id: string,
    updates: {
      title?: string;
      order?: number;
    },
  ): Promise<Column> {
    try {
      console.log("API: Updating column with ID:", id);
      const { data, error } = (await supabase
        .from("columns")
        .update(updates)
        .eq("id", id)
        .select()) as SupabaseListResponse<
        Database["public"]["Tables"]["columns"]["Row"]
      >;

      if (error) {
        console.error("API: Error updating column:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error(
          `Failed to update column with ID ${id}: No data returned`,
        );
      }

      return data[0];
    } catch (error) {
      console.error("API: Exception in update column:", error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      console.log("API: Deleting column with ID:", id);

      // First get the column to check its project_id and order
      const { data: column, error: getError } = (await supabase
        .from("columns")
        .select("project_id, order")
        .eq("id", id)
        .single()) as SupabaseSingleResponse<{
        project_id: string;
        order: number;
      }>;

      if (getError) {
        console.error("API: Error fetching column for deletion:", getError);
        throw getError;
      }

      // Delete the column
      const { error: deleteError } = (await supabase
        .from("columns")
        .delete()
        .eq("id", id)) as SupabaseResponse<any>;

      if (deleteError) {
        console.error("API: Error deleting column:", deleteError);
        throw deleteError;
      }

      // Update the order of remaining columns
      const { error: updateError } = (await supabase
        .from("columns")
        .update({ order: supabase.sql`order - 1` })
        .eq("project_id", column.project_id)
        .gt("order", column.order)) as SupabaseResponse<any>;

      if (updateError) {
        console.error(
          "API: Error updating column orders after deletion:",
          updateError,
        );
        // Don't throw here, as the main deletion was successful
      }
    } catch (error) {
      console.error("API: Exception in delete column:", error);
      throw error;
    }
  },

  async reorder(
    projectId: string,
    columnOrders: { id: string; order: number }[],
  ): Promise<void> {
    try {
      console.log("API: Reordering columns for project ID:", projectId);

      // Update each column's order in a transaction
      for (const { id, order } of columnOrders) {
        const { error } = (await supabase
          .from("columns")
          .update({ order })
          .eq("id", id)
          .eq("project_id", projectId)) as SupabaseResponse<any>;

        if (error) {
          console.error(`API: Error updating order for column ${id}:`, error);
          throw error;
        }
      }
    } catch (error) {
      console.error("API: Exception in reorder columns:", error);
      throw error;
    }
  },
};

// API functions for tasks
export const taskApi = {
  async getByColumnId(columnId: string): Promise<Task[]> {
    try {
      console.log("API: Fetching tasks for column ID:", columnId);
      const { data, error } = (await supabase
        .from("tasks")
        .select("*")
        .eq("column_id", columnId)
        .order("order")) as SupabaseListResponse<
        Database["public"]["Tables"]["tasks"]["Row"]
      >;

      if (error) {
        console.error("API: Error fetching column tasks:", error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error("API: Exception in getByColumnId tasks:", error);
      throw error;
    }
  },

  async getByProjectId(projectId: string): Promise<Task[]> {
    try {
      console.log("API: Fetching tasks for project ID:", projectId);
      const { data, error } = (await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })) as SupabaseListResponse<
        Database["public"]["Tables"]["tasks"]["Row"]
      >;

      if (error) {
        console.error("API: Error fetching project tasks:", error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error("API: Exception in getByProjectId tasks:", error);
      throw error;
    }
  },

  async getById(id: string): Promise<Task | null> {
    try {
      console.log("API: Fetching task with ID:", id);
      const { data, error } = (await supabase
        .from("tasks")
        .select("*")
        .eq("id", id)
        .single()) as SupabaseSingleResponse<
        Database["public"]["Tables"]["tasks"]["Row"]
      >;

      if (error) {
        if (error.code === "PGRST116") {
          console.log(`Task with ID ${id} not found`);
          return null;
        }
        console.error("API: Error fetching task:", error);
        throw error;
      }

      // Get task labels
      const { data: labelData, error: labelError } = (await supabase
        .from("task_labels")
        .select("label_id, labels(*)")
        .eq("task_id", id)) as SupabaseListResponse<{
        label_id: string;
        labels: Database["public"]["Tables"]["labels"]["Row"];
      }>;

      if (labelError) {
        console.warn("API: Error fetching task labels:", labelError);
      }

      const labels = labelData
        ? labelData.filter((item) => item.labels).map((item) => item.labels)
        : [];

      // Get task assignees
      const { data: assigneeData, error: assigneeError } = (await supabase
        .from("task_assignees")
        .select("user_id, profiles(*)")
        .eq("task_id", id)) as SupabaseListResponse<{
        user_id: string;
        profiles: Database["public"]["Tables"]["profiles"]["Row"];
      }>;

      if (assigneeError) {
        console.warn("API: Error fetching task assignees:", assigneeError);
      }

      const assignees = assigneeData
        ? assigneeData
            .filter((item) => item.profiles)
            .map((item) => ({
              id: item.profiles.id,
              name: item.profiles.name,
              email: item.profiles.email,
              role: item.profiles.role as UserRole,
              jobTitle: item.profiles.job_title || undefined,
              organizationId: item.profiles.organization_id || undefined,
              avatar:
                item.profiles.avatar ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.profiles.email}`,
            }))
        : [];

      // Get task files
      const { data: fileData, error: fileError } = (await supabase
        .from("task_files")
        .select("*")
        .eq("task_id", id)) as SupabaseListResponse<
        Database["public"]["Tables"]["task_files"]["Row"]
      >;

      if (fileError) {
        console.warn("API: Error fetching task files:", fileError);
      }

      return {
        ...data,
        labels,
        assignees,
        files: fileData || [],
      };
    } catch (error) {
      console.error("API: Exception in getById task:", error);
      throw error;
    }
  },

  async create(taskData: {
    title: string;
    description?: string;
    columnId: string;
    projectId: string;
    userId: string;
    order: number;
    dueDate?: string;
    labelIds?: string[];
    assigneeIds?: string[];
  }): Promise<Task> {
    try {
      console.log("API: Creating new task");
      const { data, error } = (await supabase
        .from("tasks")
        .insert([
          {
            title: taskData.title,
            description: taskData.description || null,
            column_id: taskData.columnId,
            project_id: taskData.projectId,
            user_id: taskData.userId,
            order: taskData.order,
            due_date: taskData.dueDate || null,
            is_completed: false,
          },
        ])
        .select()) as SupabaseListResponse<
        Database["public"]["Tables"]["tasks"]["Row"]
      >;

      if (error) {
        console.error("API: Error creating task:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error("Failed to create task: No data returned");
      }

      const newTask = data[0];

      // Add labels if provided
      if (taskData.labelIds && taskData.labelIds.length > 0) {
        const labelAssociations = taskData.labelIds.map((labelId) => ({
          task_id: newTask.id,
          label_id: labelId,
        }));

        const { error: labelError } = (await supabase
          .from("task_labels")
          .insert(labelAssociations)) as SupabaseResponse<any>;

        if (labelError) {
          console.error("API: Error associating labels with task:", labelError);
          // Continue even if label association fails
        }
      }

      // Add assignees if provided
      if (taskData.assigneeIds && taskData.assigneeIds.length > 0) {
        const assigneeAssociations = taskData.assigneeIds.map((userId) => ({
          task_id: newTask.id,
          user_id: userId,
        }));

        const { error: assigneeError } = (await supabase
          .from("task_assignees")
          .insert(assigneeAssociations)) as SupabaseResponse<any>;

        if (assigneeError) {
          console.error(
            "API: Error associating assignees with task:",
            assigneeError,
          );
          // Continue even if assignee association fails
        }
      }

      // Return the created task with empty arrays for related entities
      return {
        ...newTask,
        labels: [],
        assignees: [],
        files: [],
      };
    } catch (error) {
      console.error("API: Exception in create task:", error);
      throw error;
    }
  },

  async update(
    id: string,
    updates: {
      title?: string;
      description?: string | null;
      columnId?: string;
      order?: number;
      dueDate?: string | null;
      isCompleted?: boolean;
      completedAt?: string | null;
      labelIds?: string[];
      assigneeIds?: string[];
    },
  ): Promise<Task> {
    try {
      console.log("API: Updating task with ID:", id);

      // Convert the updates to match the database column names
      const dbUpdates: Partial<
        Database["public"]["Tables"]["tasks"]["Update"]
      > = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.description !== undefined)
        dbUpdates.description = updates.description;
      if (updates.columnId !== undefined)
        dbUpdates.column_id = updates.columnId;
      if (updates.order !== undefined) dbUpdates.order = updates.order;
      if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
      if (updates.isCompleted !== undefined) {
        dbUpdates.is_completed = updates.isCompleted;
        // If marking as completed, set the completed_at timestamp
        if (updates.isCompleted) {
          dbUpdates.completed_at =
            updates.completedAt || new Date().toISOString();
        } else {
          dbUpdates.completed_at = null;
        }
      }

      const { data, error } = (await supabase
        .from("tasks")
        .update(dbUpdates)
        .eq("id", id)
        .select()) as SupabaseListResponse<
        Database["public"]["Tables"]["tasks"]["Row"]
      >;

      if (error) {
        console.error("API: Error updating task:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error(
          `Failed to update task with ID ${id}: No data returned`,
        );
      }

      const updatedTask = data[0];

      // Update labels if provided
      if (updates.labelIds !== undefined) {
        // First delete existing label associations
        const { error: deleteLabelError } = (await supabase
          .from("task_labels")
          .delete()
          .eq("task_id", id)) as SupabaseResponse<any>;

        if (deleteLabelError) {
          console.error(
            "API: Error deleting task label associations:",
            deleteLabelError,
          );
          // Continue even if deletion fails
        }

        // Then add new label associations
        if (updates.labelIds.length > 0) {
          const labelAssociations = updates.labelIds.map((labelId) => ({
            task_id: id,
            label_id: labelId,
          }));

          const { error: insertLabelError } = (await supabase
            .from("task_labels")
            .insert(labelAssociations)) as SupabaseResponse<any>;

          if (insertLabelError) {
            console.error(
              "API: Error inserting task label associations:",
              insertLabelError,
            );
            // Continue even if insertion fails
          }
        }
      }

      // Update assignees if provided
      if (updates.assigneeIds !== undefined) {
        // First delete existing assignee associations
        const { error: deleteAssigneeError } = (await supabase
          .from("task_assignees")
          .delete()
          .eq("task_id", id)) as SupabaseResponse<any>;

        if (deleteAssigneeError) {
          console.error(
            "API: Error deleting task assignee associations:",
            deleteAssigneeError,
          );
          // Continue even if deletion fails
        }

        // Then add new assignee associations
        if (updates.assigneeIds.length > 0) {
          const assigneeAssociations = updates.assigneeIds.map((userId) => ({
            task_id: id,
            user_id: userId,
          }));

          const { error: insertAssigneeError } = (await supabase
            .from("task_assignees")
            .insert(assigneeAssociations)) as SupabaseResponse<any>;

          if (insertAssigneeError) {
            console.error(
              "API: Error inserting task assignee associations:",
              insertAssigneeError,
            );
            // Continue even if insertion fails
          }
        }
      }

      // Get the updated task with all its associations
      return this.getById(id) as Promise<Task>;
    } catch (error) {
      console.error("API: Exception in update task:", error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      console.log("API: Deleting task with ID:", id);

      // First get the task to check its column_id and order
      const { data: task, error: getError } = (await supabase
        .from("tasks")
        .select("column_id, order")
        .eq("id", id)
        .single()) as SupabaseSingleResponse<{
        column_id: string;
        order: number;
      }>;

      if (getError) {
        console.error("API: Error fetching task for deletion:", getError);
        throw getError;
      }

      // Delete task label associations
      const { error: labelError } = (await supabase
        .from("task_labels")
        .delete()
        .eq("task_id", id)) as SupabaseResponse<any>;

      if (labelError) {
        console.error(
          "API: Error deleting task label associations:",
          labelError,
        );
        // Continue even if deletion fails
      }

      // Delete task assignee associations
      const { error: assigneeError } = (await supabase
        .from("task_assignees")
        .delete()
        .eq("task_id", id)) as SupabaseResponse<any>;

      if (assigneeError) {
        console.error(
          "API: Error deleting task assignee associations:",
          assigneeError,
        );
        // Continue even if deletion fails
      }

      // Delete task files
      const { error: fileError } = (await supabase
        .from("task_files")
        .delete()
        .eq("task_id", id)) as SupabaseResponse<any>;

      if (fileError) {
        console.error("API: Error deleting task files:", fileError);
        // Continue even if deletion fails
      }

      // Delete the task
      const { error: deleteError } = (await supabase
        .from("tasks")
        .delete()
        .eq("id", id)) as SupabaseResponse<any>;

      if (deleteError) {
        console.error("API: Error deleting task:", deleteError);
        throw deleteError;
      }

      // Update the order of remaining tasks in the same column
      const { error: updateError } = (await supabase
        .from("tasks")
        .update({ order: supabase.sql`order - 1` })
        .eq("column_id", task.column_id)
        .gt("order", task.order)) as SupabaseResponse<any>;

      if (updateError) {
        console.error(
          "API: Error updating task orders after deletion:",
          updateError,
        );
        // Don't throw here, as the main deletion was successful
      }
    } catch (error) {
      console.error("API: Exception in delete task:", error);
      throw error;
    }
  },

  async reorder(
    columnId: string,
    taskOrders: { id: string; order: number }[],
  ): Promise<void> {
    try {
      console.log("API: Reordering tasks for column ID:", columnId);

      // Update each task's order in a transaction
      for (const { id, order } of taskOrders) {
        const { error } = (await supabase
          .from("tasks")
          .update({ order })
          .eq("id", id)
          .eq("column_id", columnId)) as SupabaseResponse<any>;

        if (error) {
          console.error(`API: Error updating order for task ${id}:`, error);
          throw error;
        }
      }
    } catch (error) {
      console.error("API: Exception in reorder tasks:", error);
      throw error;
    }
  },

  async moveToColumn(
    taskId: string,
    newColumnId: string,
    newOrder: number,
  ): Promise<Task> {
    try {
      console.log(
        `API: Moving task ${taskId} to column ${newColumnId} at order ${newOrder}`,
      );

      // Get the current task details
      const { data: task, error: getError } = (await supabase
        .from("tasks")
        .select("column_id, order")
        .eq("id", taskId)
        .single()) as SupabaseSingleResponse<{
        column_id: string;
        order: number;
      }>;

      if (getError) {
        console.error("API: Error fetching task for moving:", getError);
        throw getError;
      }

      const oldColumnId = task.column_id;
      const oldOrder = task.order;

      // Update the task with the new column and order
      const { data, error: updateError } = (await supabase
        .from("tasks")
        .update({
          column_id: newColumnId,
          order: newOrder,
        })
        .eq("id", taskId)
        .select()) as SupabaseListResponse<
        Database["public"]["Tables"]["tasks"]["Row"]
      >;

      if (updateError) {
        console.error(
          "API: Error updating task column and order:",
          updateError,
        );
        throw updateError;
      }

      if (!data || data.length === 0) {
        throw new Error(
          `Failed to move task with ID ${taskId}: No data returned`,
        );
      }

      // Update the order of tasks in the old column
      if (oldColumnId !== newColumnId) {
        const { error: oldColumnError } = (await supabase
          .from("tasks")
          .update({ order: supabase.sql`order - 1` })
          .eq("column_id", oldColumnId)
          .gt("order", oldOrder)) as SupabaseResponse<any>;

        if (oldColumnError) {
          console.error(
            "API: Error updating task orders in old column:",
            oldColumnError,
          );
          // Don't throw here, as the main update was successful
        }
      }

      // Update the order of tasks in the new column
      const { error: newColumnError } = (await supabase
        .from("tasks")
        .update({ order: supabase.sql`order + 1` })
        .eq("column_id", newColumnId)
        .gte("order", newOrder)
        .neq("id", taskId)) as SupabaseResponse<any>;

      if (newColumnError) {
        console.error(
          "API: Error updating task orders in new column:",
          newColumnError,
        );
        // Don't throw here, as the main update was successful
      }

      // Get the updated task with all its associations
      return this.getById(taskId) as Promise<Task>;
    } catch (error) {
      console.error("API: Exception in moveToColumn task:", error);
      throw error;
    }
  },
};

// API functions for task files
export const taskFileApi = {
  async getByTaskId(taskId: string): Promise<TaskFile[]> {
    try {
      console.log("API: Fetching files for task ID:", taskId);
      const { data, error } = (await supabase
        .from("task_files")
        .select("*")
        .eq("task_id", taskId)
        .order("created_at", { ascending: false })) as SupabaseListResponse<
        Database["public"]["Tables"]["task_files"]["Row"]
      >;

      if (error) {
        console.error("API: Error fetching task files:", error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error("API: Exception in getByTaskId files:", error);
      throw error;
    }
  },

  async getById(id: string): Promise<TaskFile | null> {
    try {
      console.log("API: Fetching file with ID:", id);
      const { data, error } = (await supabase
        .from("task_files")
        .select("*")
        .eq("id", id)
        .single()) as SupabaseSingleResponse<
        Database["public"]["Tables"]["task_files"]["Row"]
      >;

      if (error) {
        if (error.code === "PGRST116") {
          console.log(`File with ID ${id} not found`);
          return null;
        }
        console.error("API: Error fetching file:", error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error("API: Exception in getById file:", error);
      throw error;
    }
  },

  async upload(taskId: string, file: File): Promise<TaskFile> {
    try {
      console.log(`API: Uploading file ${file.name} for task ${taskId}`);

      // 1. Upload the file to storage
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `${taskId}/${fileName}`;

      const { data: uploadData, error: uploadError } = (await supabase.storage
        .from("task-files")
        .upload(filePath, file)) as SupabaseStorageResponse;

      if (uploadError) {
        console.error("API: Error uploading file to storage:", uploadError);
        throw uploadError;
      }

      // 2. Get the public URL for the file
      const { data: urlData } = supabase.storage
        .from("task-files")
        .getPublicUrl(filePath);

      if (!urlData || !urlData.publicUrl) {
        throw new Error("Failed to get public URL for uploaded file");
      }

      // 3. Create a record in the task_files table
      const { data, error } = (await supabase
        .from("task_files")
        .insert([
          {
            task_id: taskId,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            file_url: urlData.publicUrl,
          },
        ])
        .select()) as SupabaseListResponse<
        Database["public"]["Tables"]["task_files"]["Row"]
      >;

      if (error) {
        console.error("API: Error creating file record:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error("Failed to create file record: No data returned");
      }

      return data[0];
    } catch (error) {
      console.error("API: Exception in upload file:", error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      console.log("API: Deleting file with ID:", id);

      // 1. Get the file record to get the file path
      const { data: file, error: getError } = (await supabase
        .from("task_files")
        .select("file_url, task_id")
        .eq("id", id)
        .single()) as SupabaseSingleResponse<{
        file_url: string;
        task_id: string;
      }>;

      if (getError) {
        console.error("API: Error fetching file for deletion:", getError);
        throw getError;
      }

      // 2. Delete the file from storage
      // Extract the path from the URL
      const url = new URL(file.file_url);
      const pathMatch = url.pathname.match(
        /\/storage\/v1\/object\/public\/task-files\/(.+)/,
      );

      if (pathMatch && pathMatch[1]) {
        const storagePath = decodeURIComponent(pathMatch[1]);

        const { error: storageError } = (await supabase.storage
          .from("task-files")
          .remove([storagePath])) as SupabaseStorageResponse;

        if (storageError) {
          console.error("API: Error deleting file from storage:", storageError);
          // Continue even if storage deletion fails
        }
      }

      // 3. Delete the file record
      const { error: deleteError } = (await supabase
        .from("task_files")
        .delete()
        .eq("id", id)) as SupabaseResponse<any>;

      if (deleteError) {
        console.error("API: Error deleting file record:", deleteError);
        throw deleteError;
      }
    } catch (error) {
      console.error("API: Exception in delete file:", error);
      throw error;
    }
  },
};

// API functions for labels
export const labelApi = {
  async getAll(): Promise<Label[]> {
    try {
      console.log("API: Fetching all labels");
      const { data, error } = (await supabase
        .from("labels")
        .select("*")
        .order("name")) as SupabaseListResponse<
        Database["public"]["Tables"]["labels"]["Row"]
      >;

      if (error) {
        // Check if it's a missing table error
        if (
          error.code === "42P01" &&
          error.message.includes('relation "public.labels" does not exist')
        ) {
          console.warn(
            "Labels table doesn't exist yet. This is expected if you haven't run the migration.",
          );
          return [];
        }

        console.error("API: Error fetching all labels:", error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error("API: Exception in getAll labels:", error);

      // Check if it's a missing table error
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "42P01" &&
        "message" in error &&
        typeof error.message === "string" &&
        error.message.includes('relation "public.labels" does not exist')
      ) {
        console.warn(
          "Labels table doesn't exist yet. This is expected if you haven't run the migration.",
        );
        return [];
      }

      throw error;
    }
  },

  async create(labelData: {
    name: string;
    color: string;
    organizationId?: string;
  }): Promise<Label> {
    try {
      console.log("API: Creating new label");
      const { data, error } = (await supabase
        .from("labels")
        .insert([
          {
            name: labelData.name,
            color: labelData.color,
            organization_id: labelData.organizationId || null,
          },
        ])
        .select()) as SupabaseListResponse<
        Database["public"]["Tables"]["labels"]["Row"]
      >;

      if (error) {
        console.error("API: Error creating label:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error("Failed to create label: No data returned");
      }

      return data[0];
    } catch (error) {
      console.error("API: Exception in create label:", error);
      throw error;
    }
  },

  async update(
    id: string,
    updates: {
      name?: string;
      color?: string;
    },
  ): Promise<Label> {
    try {
      console.log("API: Updating label with ID:", id);
      const { data, error } = (await supabase
        .from("labels")
        .update(updates)
        .eq("id", id)
        .select()) as SupabaseListResponse<
        Database["public"]["Tables"]["labels"]["Row"]
      >;

      if (error) {
        console.error("API: Error updating label:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error(
          `Failed to update label with ID ${id}: No data returned`,
        );
      }

      return data[0];
    } catch (error) {
      console.error("API: Exception in update label:", error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      console.log("API: Deleting label with ID:", id);

      // First delete task label associations
      const { error: taskLabelError } = (await supabase
        .from("task_labels")
        .delete()
        .eq("label_id", id)) as SupabaseResponse<any>;

      if (taskLabelError) {
        console.error(
          "API: Error deleting task label associations:",
          taskLabelError,
        );
        // Continue even if deletion fails
      }

      // Then delete the label
      const { error } = (await supabase
        .from("labels")
        .delete()
        .eq("id", id)) as SupabaseResponse<any>;

      if (error) {
        console.error("API: Error deleting label:", error);
        throw error;
      }
    } catch (error) {
      console.error("API: Exception in delete label:", error);
      throw error;
    }
  },
};
