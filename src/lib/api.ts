import { supabase } from "./supabase";
import { User } from "./auth";

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
      const { data, error } = await supabase
        .from("profiles")
        .select("*, organizations(*), user_projects(project_id, projects(*))")
        .order("created_at", { ascending: false });

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
      const { data, error } = await supabase
        .from("profiles")
        .select("*, organizations(*), user_projects(project_id, projects(*))")
        .eq("id", id)
        .single();

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
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            role: userData.role || "user",
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create user");

      // 2. IMPORTANT: Create the user record in public.users FIRST
      // This is critical for RLS policies to work correctly
      const { error: userError } = await supabase
        .from("users")
        .insert([{ id: authData.user.id }]);

      if (userError) {
        console.error("Error creating user record:", userError);
        throw new Error(`Failed to create user record: ${userError.message}`);
      }

      // 3. Create the profile record AFTER the user record exists
      const { error: profileError } = await supabase.from("profiles").insert([
        {
          id: authData.user.id,
          name: userData.name,
          email: userData.email,
          role: userData.role || "user",
          job_title: userData.jobTitle,
          organization_id: userData.organizationId,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.email}`,
        },
      ]);

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

        const { error: projectError } = await supabase
          .from("user_projects")
          .insert(projectAssociations);

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
          await supabase.auth.admin.updateUserById(id, {
            password: updates.password,
          });
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
        const { error: profileError } = await supabase
          .from("profiles")
          .update(profileUpdates)
          .eq("id", id);

        if (profileError) throw profileError;
      }

      // 3. Update project associations if provided
      if (updates.projects) {
        // First delete existing associations
        const { error: deleteError } = await supabase
          .from("user_projects")
          .delete()
          .eq("user_id", id);

        if (deleteError) throw deleteError;

        // Then add new associations
        if (updates.projects.length > 0) {
          const projectAssociations = updates.projects.map((projectId) => ({
            user_id: id,
            project_id: projectId,
          }));

          const { error: insertError } = await supabase
            .from("user_projects")
            .insert(projectAssociations);

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
      const { error: projectsError } = await supabase
        .from("user_projects")
        .delete()
        .eq("user_id", id);

      if (projectsError) throw projectsError;

      // 2. Delete profile
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", id);

      if (profileError) throw profileError;

      // 3. Delete auth user
      const { error: authError } = await supabase.auth.admin.deleteUser(id);

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
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .order("created_at", { ascending: false });

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
              await supabase
                .from("projects")
                .select("*", { count: "exact", head: true })
                .eq("organization_id", org.id);

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
            const { count: membersCount, error: membersError } = await supabase
              .from("profiles")
              .select("*", { count: "exact", head: true })
              .eq("organization_id", org.id);

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
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("API: Error fetching organization:", error);
        throw error;
      }

      console.log("API: Organization data:", data);

      if (data) {
        // Get project count
        let projectCount = 0;
        try {
          const { count: projectsCount, error: projectsError } = await supabase
            .from("projects")
            .select("*", { count: "exact", head: true })
            .eq("organization_id", id);

          if (!projectsError && projectsCount !== null) {
            projectCount = projectsCount;
            console.log(
              `Found ${projectsCount} projects for organization ${id}`,
            );
          } else if (projectsError?.code === "42P01") {
            console.warn(
              "Projects table doesn't exist yet. This is expected if you haven't run the migration.",
            );
          } else if (projectsError) {
            console.warn(
              `Error fetching project count for organization ${id}:`,
              projectsError,
            );
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
          const { count: membersCount, error: membersError } = await supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .eq("organization_id", id);

          if (!membersError && membersCount !== null) {
            memberCount = membersCount;
            console.log(`Found ${membersCount} members for organization ${id}`);
          } else if (membersError?.code === "42P01") {
            console.warn(
              "Profiles table doesn't exist yet. This is expected if you haven't run the migration.",
            );
          } else if (membersError) {
            console.warn(
              `Error fetching member count for organization ${id}:`,
              membersError,
            );
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
        };
      }

      return data;
    } catch (error) {
      console.error("API: Exception in getById:", error);
      throw error;
    }
  },

  async create(organization: Partial<Organization>): Promise<Organization> {
    const { data, error } = await supabase
      .from("organizations")
      .insert([organization])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(
    id: string,
    updates: Partial<Organization>,
  ): Promise<Organization> {
    const { data, error } = await supabase
      .from("organizations")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("organizations")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  async setDefault(id: string): Promise<void> {
    // First, set all organizations to non-default
    await supabase
      .from("organizations")
      .update({ is_default: false })
      .neq("id", "placeholder");

    // Then set the selected organization as default
    const { error } = await supabase
      .from("organizations")
      .update({ is_default: true })
      .eq("id", id);

    if (error) throw error;
  },

  async getMembers(organizationId: string): Promise<OrganizationMember[]> {
    try {
      console.log("API: Fetching members for organization ID:", organizationId);
      // Get profiles that have this organization_id
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("organization_id", organizationId);

      if (error) {
        // Check if it's a missing table error
        if (
          error.code === "42P01" &&
          error.message.includes('relation "public.profiles" does not exist')
        ) {
          console.warn(
            "Profiles table doesn't exist yet. This is expected if you haven't run the migration.",
          );
          return [];
        }

        console.error("API: Error fetching organization members:", error);
        throw error;
      }

      console.log(`API: Found ${data?.length || 0} organization members`);
      return (data || []).map((profile) => ({
        id: profile.id,
        name: profile.name || "",
        email: profile.email || "",
        role: profile.role || "user",
        jobTitle: profile.job_title,
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

// API functions for columns
export const columnApi = {
  async getByProjectId(projectId: string): Promise<Column[]> {
    try {
      console.log(`API: Fetching columns for project ID: ${projectId}`);
      const { data, error } = await supabase
        .from("columns")
        .select("*")
        .eq("project_id", projectId)
        .order("order", { ascending: true });

      if (error) {
        console.error("API: Error fetching columns:", error);
        throw error;
      }

      console.log(
        `API: Found ${data?.length || 0} columns for project ${projectId}`,
      );
      return data || [];
    } catch (error) {
      console.error("API: Exception in getByProjectId:", error);
      throw error;
    }
  },

  async create(column: {
    title: string;
    project_id: string;
    user_id?: string; // Make user_id optional since we've fixed the database schema
  }): Promise<Column> {
    try {
      // Get the maximum order value for columns in this project
      const { data: orderData, error: orderError } = await supabase
        .from("columns")
        .select("order")
        .eq("project_id", column.project_id)
        .order("order", { ascending: false })
        .limit(1);

      if (orderError) {
        console.error("API: Error getting max order:", orderError);
        throw orderError;
      }

      const maxOrder =
        orderData && orderData.length > 0 ? orderData[0].order : 0;

      // Get current user if user_id is not provided
      let userId = column.user_id;
      if (!userId) {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          userId = user?.id;
        } catch (userError) {
          console.warn("API: Could not get current user:", userError);
          // Continue without user_id
        }
      }

      // Create the column with the next order value
      const columnData = {
        title: column.title,
        project_id: column.project_id,
        order: maxOrder + 1,
      };

      // Don't include user_id at all since the column doesn't exist

      const { data, error } = await supabase
        .from("columns")
        .insert([columnData])
        .select()
        .single();

      if (error) {
        console.error("API: Error creating column:", error);
        throw error;
      }

      console.log(
        `API: Created column ${data.id} for project ${column.project_id}`,
      );
      return data;
    } catch (error) {
      console.error("API: Exception in create column:", error);
      throw error;
    }
  },

  async update(
    id: string,
    updates: { title?: string; order?: number },
  ): Promise<Column> {
    try {
      const { data, error } = await supabase
        .from("columns")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("API: Error updating column:", error);
        throw error;
      }

      console.log(`API: Updated column ${id}`);
      return data;
    } catch (error) {
      console.error("API: Exception in update column:", error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      // No special handling for deleting Completed column

      // Delete the column if it's not a Completed column
      const { error } = await supabase.from("columns").delete().eq("id", id);

      if (error) {
        console.error("API: Error deleting column:", error);
        throw error;
      }

      console.log(`API: Deleted column ${id}`);
    } catch (error) {
      console.error("API: Exception in delete column:", error);
      throw error;
    }
  },

  async reorder(columns: { id: string; order: number }[]): Promise<void> {
    try {
      // Update each column's order in a transaction
      for (const column of columns) {
        const { error } = await supabase
          .from("columns")
          .update({ order: column.order })
          .eq("id", column.id);

        if (error) {
          console.error(`API: Error reordering column ${column.id}:`, error);
          throw error;
        }
      }

      console.log(`API: Reordered ${columns.length} columns`);
    } catch (error) {
      console.error("API: Exception in reorder columns:", error);
      throw error;
    }
  },

  // Removed ensureCompletedColumn and callEnsureCompletedColumnFunction
};

// API functions for task files
export const taskFileApi = {
  async getByTaskId(taskId: string): Promise<TaskFile[]> {
    try {
      console.log(`API: Fetching files for task ID: ${taskId}`);
      const { data, error } = await supabase
        .from("task_files")
        .select("*")
        .eq("task_id", taskId);

      if (error) {
        console.error("API: Error fetching task files:", error);
        throw error;
      }

      console.log(`API: Found ${data?.length || 0} files for task ${taskId}`);
      return data || [];
    } catch (error) {
      console.error("API: Exception in getByTaskId:", error);
      throw error;
    }
  },

  async uploadFile(file: File, taskId: string): Promise<TaskFile> {
    try {
      // 1. First, ensure the task_files bucket and table exist by calling our edge function
      try {
        console.log("API: Ensuring task_files bucket and table exist");
        const { data: setupData, error: setupError } =
          await supabase.functions.invoke("create_task_files_bucket");

        if (setupError) {
          console.error(
            "API: Error setting up task_files resources:",
            setupError,
          );
        } else {
          console.log("API: Task files setup result:", setupData);
        }
      } catch (setupError) {
        console.error("API: Exception in task files setup:", setupError);
        // Continue anyway, we'll try the upload
      }

      // 2. Upload file to storage
      const fileExt = file.name.split(".").pop() || "";
      const fileName = `${taskId}/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;

      console.log(`API: Uploading file to task_files/${fileName}`);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("task_files")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        console.error("API: Error uploading file:", uploadError);

        // Check for specific error types
        if (
          uploadError.message &&
          uploadError.message.includes("bucket not found")
        ) {
          throw new Error(
            "The task_files storage bucket does not exist. Please run the migrations to create it.",
          );
        }

        if (
          uploadError.message &&
          uploadError.message.includes("row-level security")
        ) {
          throw new Error(
            "Row-level security policy violation when uploading to storage. Please check the storage RLS policies.",
          );
        }

        throw uploadError;
      }

      // 3. Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("task_files").getPublicUrl(fileName);

      console.log(`API: Generated public URL: ${publicUrl}`);

      // 4. Create record in task_files table
      const fileRecord = {
        task_id: taskId,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        file_url: publicUrl,
      };

      console.log(`API: Creating file record in database:`, fileRecord);

      // Try to insert the record directly
      try {
        console.log(
          "API: Attempting to insert file record into task_files table",
        );

        // Try to insert the record
        const { data, error } = await supabase
          .from("task_files")
          .insert([fileRecord])
          .select()
          .single();

        if (error) {
          console.error("API: Error creating file record:", error);

          // If we get a 404 or table doesn't exist error
          if (
            error.code === "PGRST116" ||
            error.code === "404" ||
            error.message?.includes('relation "task_files" does not exist')
          ) {
            // Try to run the edge function to create the table
            console.log(
              "API: Table doesn't exist, trying to create it via edge function",
            );

            try {
              const { data: setupData, error: setupError } =
                await supabase.functions.invoke("create_task_files_bucket");

              if (setupError) {
                console.error(
                  "API: Error setting up task_files resources:",
                  setupError,
                );
                console.log("API: Will try to continue anyway");
              } else {
                console.log(
                  "API: Successfully invoked create_task_files_bucket function",
                  setupData,
                );
              }
            } catch (invokeError) {
              console.error("API: Error invoking edge function:", invokeError);
              console.log("API: Will try to continue anyway");
            }

            // Wait a moment for the table to be created
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Try the insert again after creating the table
            console.log("API: Retrying insert after table creation attempt");
            const { data: retryData, error: retryError } = await supabase
              .from("task_files")
              .insert([fileRecord])
              .select()
              .single();

            if (retryError) {
              console.error(
                "API: Error on retry creating file record:",
                retryError,
              );

              // If we still get a table doesn't exist error, provide a more helpful message
              if (
                retryError.code === "PGRST116" ||
                retryError.code === "404" ||
                retryError.message?.includes(
                  'relation "task_files" does not exist',
                )
              ) {
                throw new Error(
                  "The task_files table does not exist after multiple attempts. The migration may not have run successfully. Please check the Supabase dashboard.",
                );
              }

              throw retryError;
            }

            console.log(
              `API: Successfully uploaded file for task ${taskId} on retry:`,
              retryData,
            );
            return retryData;
          }

          // If we get an RLS error, the policies might not be set correctly
          if (error.code === "42501") {
            throw new Error(
              "Row-level security policy violation when creating file record. Please check the RLS policies.",
            );
          }

          throw error;
        }

        console.log(
          `API: Successfully uploaded file for task ${taskId}:`,
          data,
        );
        return data;
      } catch (dbError) {
        // If there's a database error, we should clean up the uploaded file
        try {
          await supabase.storage.from("task_files").remove([fileName]);
          console.log(
            `API: Cleaned up uploaded file after database error: ${fileName}`,
          );
        } catch (cleanupError) {
          console.error(
            "API: Failed to clean up uploaded file after error:",
            cleanupError,
          );
        }
        throw dbError;
      }
    } catch (error) {
      console.error(
        "API: Exception in uploadFile:",
        error,
        typeof error === "object" ? JSON.stringify(error) : "",
      );
      throw error;
    }
  },

  async deleteFile(fileId: string): Promise<void> {
    try {
      // 1. Get the file record to get the file path
      const { data: fileData, error: fileError } = await supabase
        .from("task_files")
        .select("*")
        .eq("id", fileId)
        .single();

      if (fileError) {
        console.error("API: Error fetching file record:", fileError);
        throw fileError;
      }

      // 2. Delete from storage
      // Extract the path from the URL
      const fileUrl = fileData.file_url;
      const filePath = fileUrl.split("/").slice(-2).join("/");

      const { error: storageError } = await supabase.storage
        .from("task_files")
        .remove([filePath]);

      if (storageError) {
        console.error("API: Error deleting file from storage:", storageError);
        // Continue to delete the record even if storage deletion fails
      }

      // 3. Delete the record
      const { error } = await supabase
        .from("task_files")
        .delete()
        .eq("id", fileId);

      if (error) {
        console.error("API: Error deleting file record:", error);
        throw error;
      }

      console.log(`API: Deleted file ${fileId}`);
    } catch (error) {
      console.error("API: Exception in deleteFile:", error);
      throw error;
    }
  },
};

// API functions for tasks
export const taskApi = {
  async getByColumnId(columnId: string): Promise<Task[]> {
    try {
      console.log(`API: Fetching tasks for column ID: ${columnId}`);
      const { data, error } = await supabase
        .from("tasks")
        .select(
          "*, task_labels(label_id, labels(*)), task_assignees(user_id, profiles(*))",
        )
        .eq("column_id", columnId)
        .order("order", { ascending: true });

      if (error) {
        console.error("API: Error fetching tasks:", error);
        throw error;
      }

      console.log(
        `API: Found ${data?.length || 0} tasks for column ${columnId}`,
      );

      // Process the data to extract labels and assignees
      const tasksWithRelations = await Promise.all(
        (data || []).map(async (task) => {
          // Extract labels from task_labels join
          const labels = task.task_labels
            ? task.task_labels.map((tl: any) => ({
                id: tl.label_id,
                name: tl.labels?.name || "",
                color: tl.labels?.color || "#cccccc",
                created_at: tl.labels?.created_at || new Date().toISOString(),
              }))
            : [];

          // Extract assignees from task_assignees join
          const assignees = task.task_assignees
            ? task.task_assignees.map((ta: any) => ({
                id: ta.user_id,
                name: ta.profiles?.name || "",
                email: ta.profiles?.email || "",
                role: ta.profiles?.role || "user",
                avatar:
                  ta.profiles?.avatar ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${ta.profiles?.email || "user"}`,
              }))
            : [];

          // Get files for this task
          let files: TaskFile[] = [];
          try {
            files = await taskFileApi.getByTaskId(task.id);
          } catch (fileError) {
            console.warn(
              `Could not fetch files for task ${task.id}:`,
              fileError,
            );
          }

          // Return the task with processed labels and assignees
          return {
            ...task,
            labels,
            assignees,
            files,
            // Remove the join tables from the final object
            task_labels: undefined,
            task_assignees: undefined,
          };
        }),
      );

      return tasksWithRelations;
    } catch (error) {
      console.error("API: Exception in getByColumnId:", error);
      throw error;
    }
  },

  async getById(taskId: string): Promise<Task | null> {
    try {
      console.log(`API: Fetching task with ID: ${taskId}`);
      const { data, error } = await supabase
        .from("tasks")
        .select(
          "*, task_labels(label_id, labels(*)), task_assignees(user_id, profiles(*))",
        )
        .eq("id", taskId)
        .single();

      if (error) {
        console.error("API: Error fetching task:", error);
        throw error;
      }

      // Extract labels from task_labels join
      const labels = data.task_labels
        ? data.task_labels.map((tl: any) => ({
            id: tl.label_id,
            name: tl.labels?.name || "",
            color: tl.labels?.color || "#cccccc",
            created_at: tl.labels?.created_at || new Date().toISOString(),
          }))
        : [];

      // Extract assignees from task_assignees join
      const assignees = data.task_assignees
        ? data.task_assignees.map((ta: any) => ({
            id: ta.user_id,
            name: ta.profiles?.name || "",
            email: ta.profiles?.email || "",
            role: ta.profiles?.role || "user",
            avatar:
              ta.profiles?.avatar ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${ta.profiles?.email || "user"}`,
          }))
        : [];

      // Get files for this task
      let files: TaskFile[] = [];
      try {
        files = await taskFileApi.getByTaskId(taskId);
      } catch (fileError) {
        console.warn(`Could not fetch files for task ${taskId}:`, fileError);
      }

      // Return the task with processed labels and assignees
      return {
        ...data,
        labels,
        assignees,
        files,
        // Remove the join tables from the final object
        task_labels: undefined,
        task_assignees: undefined,
      };
    } catch (error) {
      console.error("API: Exception in getById:", error);
      return null;
    }
  },

  async create(task: {
    title: string;
    description?: string;
    due_date?: string | null;
    column_id: string;
    project_id: string;
    user_id?: string;
  }): Promise<Task> {
    try {
      // Get the maximum order value for tasks in this column
      const { data: orderData, error: orderError } = await supabase
        .from("tasks")
        .select("order")
        .eq("column_id", task.column_id)
        .order("order", { ascending: false })
        .limit(1);

      if (orderError) {
        console.error("API: Error getting max order:", orderError);
        throw orderError;
      }

      const maxOrder =
        orderData && orderData.length > 0 ? orderData[0].order : 0;

      // Create the task with the next order value
      const { data, error } = await supabase
        .from("tasks")
        .insert([
          {
            title: task.title,
            description: task.description || "",
            due_date: task.due_date,
            column_id: task.column_id,
            project_id: task.project_id,
            user_id: task.user_id,
            order: maxOrder + 1,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("API: Error creating task:", error);
        throw error;
      }

      console.log(`API: Created task ${data.id} for column ${task.column_id}`);
      return data;
    } catch (error) {
      console.error("API: Exception in create task:", error);
      throw error;
    }
  },

  async update(
    id: string,
    updates: {
      title?: string;
      description?: string;
      due_date?: string | null;
      order?: number;
      is_completed?: boolean;
    },
  ): Promise<Task> {
    try {
      // If task is being marked as completed, set completed_at timestamp
      if (updates.is_completed) {
        updates = { ...updates, completed_at: new Date().toISOString() };
      } else if (updates.is_completed === false) {
        updates = { ...updates, completed_at: null };
      }

      const { data, error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("API: Error updating task:", error);
        throw error;
      }

      console.log(`API: Updated task ${id}`);
      return data;
    } catch (error) {
      console.error("API: Exception in update task:", error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      // Delete task labels and assignees first
      await supabase.from("task_labels").delete().eq("task_id", id);
      await supabase.from("task_assignees").delete().eq("task_id", id);

      // Then delete the task
      const { error } = await supabase.from("tasks").delete().eq("id", id);

      if (error) {
        console.error("API: Error deleting task:", error);
        throw error;
      }

      console.log(`API: Deleted task ${id}`);
    } catch (error) {
      console.error("API: Exception in delete task:", error);
      throw error;
    }
  },

  async moveToColumn(taskId: string, columnId: string): Promise<Task> {
    try {
      // Get the maximum order value for tasks in the destination column
      const { data: orderData, error: orderError } = await supabase
        .from("tasks")
        .select("order")
        .eq("column_id", columnId)
        .order("order", { ascending: false })
        .limit(1);

      if (orderError) {
        console.error("API: Error getting max order:", orderError);
        throw orderError;
      }

      const maxOrder =
        orderData && orderData.length > 0 ? orderData[0].order : 0;

      // Update the task with the new column_id and order without special handling for Completed column
      const updates: any = {
        column_id: columnId,
        order: maxOrder + 1,
      };

      const { data, error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", taskId)
        .select()
        .single();

      if (error) {
        console.error("API: Error moving task to column:", error);
        throw error;
      }

      console.log(`API: Moved task ${taskId} to column ${columnId}`);
      return data;
    } catch (error) {
      console.error("API: Exception in moveToColumn:", error);
      throw error;
    }
  },

  async reorder(tasks: { id: string; order: number }[]): Promise<void> {
    try {
      // Update each task's order in a transaction
      for (const task of tasks) {
        const { error } = await supabase
          .from("tasks")
          .update({ order: task.order })
          .eq("id", task.id);

        if (error) {
          console.error(`API: Error reordering task ${task.id}:`, error);
          throw error;
        }
      }

      console.log(`API: Reordered ${tasks.length} tasks`);
    } catch (error) {
      console.error("API: Exception in reorder tasks:", error);
      throw error;
    }
  },

  async updateTaskLabels(taskId: string, labelIds: string[]): Promise<void> {
    try {
      // First delete existing task-label associations
      const { error: deleteError } = await supabase
        .from("task_labels")
        .delete()
        .eq("task_id", taskId);

      if (deleteError) {
        console.error("API: Error deleting task labels:", deleteError);
        throw deleteError;
      }

      // Then add new associations if there are any
      if (labelIds.length > 0) {
        const taskLabels = labelIds.map((labelId) => ({
          task_id: taskId,
          label_id: labelId,
        }));

        const { error: insertError } = await supabase
          .from("task_labels")
          .insert(taskLabels);

        if (insertError) {
          console.error("API: Error adding task labels:", insertError);
          throw insertError;
        }
      }

      console.log(`API: Updated labels for task ${taskId}`);
    } catch (error) {
      console.error("API: Exception in updateTaskLabels:", error);
      throw error;
    }
  },

  async updateTaskAssignees(taskId: string, userIds: string[]): Promise<void> {
    try {
      // First delete existing task-assignee associations
      const { error: deleteError } = await supabase
        .from("task_assignees")
        .delete()
        .eq("task_id", taskId);

      if (deleteError) {
        console.error("API: Error deleting task assignees:", deleteError);
        throw deleteError;
      }

      // Then add new associations if there are any
      if (userIds.length > 0) {
        const taskAssignees = userIds.map((userId) => ({
          task_id: taskId,
          user_id: userId,
        }));

        const { error: insertError } = await supabase
          .from("task_assignees")
          .insert(taskAssignees);

        if (insertError) {
          console.error("API: Error adding task assignees:", insertError);
          throw insertError;
        }
      }

      console.log(`API: Updated assignees for task ${taskId}`);
    } catch (error) {
      console.error("API: Exception in updateTaskAssignees:", error);
      throw error;
    }
  },
};

// API functions for projects
export const projectApi = {
  async getAll(userId?: string): Promise<Project[]> {
    try {
      console.log(
        "API: Fetching projects" + (userId ? " for user: " + userId : ""),
      );

      let query = supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      // If userId is provided, filter projects by user membership
      if (userId) {
        // Get projects where the user is a member
        const { data, error } = await supabase
          .from("user_projects")
          .select("project_id")
          .eq("user_id", userId);

        if (error) {
          console.error("API: Error fetching user's projects:", error);
          throw error;
        }

        if (data && data.length > 0) {
          const projectIds = data.map((item) => item.project_id);
          query = query.in("id", projectIds);
        } else {
          // If user has no projects, return empty array early
          return [];
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error("API: Error fetching projects:", error);
        throw error;
      }

      console.log(`API: Found ${data?.length || 0} projects`);

      // Fetch task counts and member counts for each project
      const projectsWithCounts = await Promise.all(
        (data || []).map(async (project) => {
          // Get task count
          let taskCount = 0;
          try {
            const { count, error: countError } = await supabase
              .from("tasks")
              .select("*", { count: "exact", head: true })
              .eq("project_id", project.id);

            if (!countError && count !== null) {
              taskCount = count;
            }
          } catch (countError) {
            console.warn(
              `Error fetching task count for project ${project.id}:`,
              countError,
            );
          }

          // Get member count
          let memberCount = 0;
          try {
            const { count, error: countError } = await supabase
              .from("user_projects")
              .select("*", { count: "exact", head: true })
              .eq("project_id", project.id);

            if (!countError && count !== null) {
              memberCount = count;
            }
          } catch (countError) {
            console.warn(
              `Error fetching member count for project ${project.id}:`,
              countError,
            );
          }

          // Format the last updated date
          const lastUpdated = new Date(project.updated_at).toLocaleDateString(
            "en-US",
            {
              month: "short",
              day: "numeric",
              year: "numeric",
            },
          );

          return {
            ...project,
            taskCount,
            memberCount,
            lastUpdated,
          };
        }),
      );

      return projectsWithCounts;
    } catch (error) {
      console.error("API: Exception in getAll projects:", error);
      throw error;
    }
  },

  async getById(id: string): Promise<Project | null> {
    try {
      console.log(`API: Fetching project with ID: ${id}`);
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("API: Error fetching project:", error);
        throw error;
      }

      console.log("API: Project data:", data);
      return data;
    } catch (error) {
      console.error("API: Exception in getById project:", error);
      throw error;
    }
  },

  async create(project: {
    title: string;
    description?: string;
    organization_id?: string;
    user_id: string;
  }): Promise<Project> {
    try {
      // Create the project
      const { data, error } = await supabase
        .from("projects")
        .insert([
          {
            title: project.title,
            description: project.description || "",
            organization_id: project.organization_id,
            user_id: project.user_id,
            is_favorite: false,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("API: Error creating project:", error);
        throw error;
      }

      console.log(`API: Created project ${data.id}`);

      // Add the creator as a project member
      const { error: memberError } = await supabase
        .from("user_projects")
        .insert([
          {
            user_id: project.user_id,
            project_id: data.id,
          },
        ]);

      if (memberError) {
        console.error("API: Error adding creator to project:", memberError);
        throw memberError;
      }

      // Default columns are now created by the database trigger
      console.log(
        `API: Default columns will be created by database trigger for project ${data.id}`,
      );

      return data;
    } catch (error) {
      console.error("API: Exception in create project:", error);
      throw error;
    }
  },

  async update(
    id: string,
    updates: {
      title?: string;
      description?: string;
      is_favorite?: boolean;
      organization_id?: string;
    },
  ): Promise<Project> {
    try {
      const { data, error } = await supabase
        .from("projects")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("API: Error updating project:", error);
        throw error;
      }

      console.log(`API: Updated project ${id}`);
      return data;
    } catch (error) {
      console.error("API: Exception in update project:", error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      console.log(`API: Starting deletion of project ${id}`);

      // Delete project members first
      const { error: membersError } = await supabase
        .from("user_projects")
        .delete()
        .eq("project_id", id);

      if (membersError) {
        console.error("API: Error deleting project members:", membersError);
        throw membersError;
      }
      console.log(
        `API: Successfully deleted project members for project ${id}`,
      );

      // Delete tasks and columns (cascade delete should handle this, but just to be safe)
      const { data: columns, error: columnsError } = await supabase
        .from("columns")
        .select("id")
        .eq("project_id", id);

      if (columnsError) {
        console.error("API: Error fetching project columns:", columnsError);
        throw columnsError;
      }
      console.log(
        `API: Found ${columns?.length || 0} columns for project ${id}`,
      );

      // Delete tasks for each column
      if (columns && columns.length > 0) {
        for (const column of columns) {
          // Delete task labels and assignees first
          const { data: tasks, error: tasksError } = await supabase
            .from("tasks")
            .select("id")
            .eq("column_id", column.id);

          if (tasksError) {
            console.error(
              `API: Error fetching tasks for column ${column.id}:`,
              tasksError,
            );
            throw tasksError;
          }

          if (tasks && tasks.length > 0) {
            console.log(
              `API: Found ${tasks.length} tasks for column ${column.id}`,
            );
            for (const task of tasks) {
              // Delete task labels
              const { error: labelsError } = await supabase
                .from("task_labels")
                .delete()
                .eq("task_id", task.id);

              if (labelsError) {
                console.error(
                  `API: Error deleting labels for task ${task.id}:`,
                  labelsError,
                );
                throw labelsError;
              }

              // Delete task assignees
              const { error: assigneesError } = await supabase
                .from("task_assignees")
                .delete()
                .eq("task_id", task.id);

              if (assigneesError) {
                console.error(
                  `API: Error deleting assignees for task ${task.id}:`,
                  assigneesError,
                );
                throw assigneesError;
              }

              console.log(
                `API: Successfully deleted labels and assignees for task ${task.id}`,
              );
            }

            // Delete tasks for this column
            const { error: deleteTasksError } = await supabase
              .from("tasks")
              .delete()
              .eq("column_id", column.id);

            if (deleteTasksError) {
              console.error(
                `API: Error deleting tasks for column ${column.id}:`,
                deleteTasksError,
              );
              throw deleteTasksError;
            }
            console.log(
              `API: Successfully deleted tasks for column ${column.id}`,
            );
          }
        }

        // Delete columns
        const { error: deleteColumnsError } = await supabase
          .from("columns")
          .delete()
          .eq("project_id", id);

        if (deleteColumnsError) {
          console.error(
            `API: Error deleting columns for project ${id}:`,
            deleteColumnsError,
          );
          throw deleteColumnsError;
        }
        console.log(`API: Successfully deleted columns for project ${id}`);
      }

      // Finally delete the project
      const { error } = await supabase.from("projects").delete().eq("id", id);

      if (error) {
        console.error("API: Error deleting project:", error);
        throw error;
      }

      console.log(`API: Successfully deleted project ${id}`);
    } catch (error) {
      console.error("API: Exception in delete project:", error);
      throw error;
    }
  },

  async toggleFavorite(id: string): Promise<Project> {
    try {
      // Get current favorite status
      const { data: project, error: getError } = await supabase
        .from("projects")
        .select("is_favorite")
        .eq("id", id)
        .single();

      if (getError) {
        console.error("API: Error getting project favorite status:", getError);
        throw getError;
      }

      // Toggle the favorite status
      const { data, error } = await supabase
        .from("projects")
        .update({ is_favorite: !project.is_favorite })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("API: Error toggling project favorite:", error);
        throw error;
      }

      console.log(
        `API: Toggled favorite for project ${id} to ${!project.is_favorite}`,
      );
      return data;
    } catch (error) {
      console.error("API: Exception in toggleFavorite:", error);
      throw error;
    }
  },

  async addMember(projectId: string, userId: string): Promise<void> {
    try {
      // Check if the user is already a member
      const { data: existing, error: checkError } = await supabase
        .from("user_projects")
        .select("*")
        .eq("project_id", projectId)
        .eq("user_id", userId);

      if (checkError) {
        console.error("API: Error checking project membership:", checkError);
        throw checkError;
      }

      // If the user is already a member, do nothing
      if (existing && existing.length > 0) {
        console.log(
          `API: User ${userId} is already a member of project ${projectId}`,
        );
        return;
      }

      // Add the user as a project member
      const { error } = await supabase.from("user_projects").insert([
        {
          user_id: userId,
          project_id: projectId,
        },
      ]);

      if (error) {
        console.error("API: Error adding member to project:", error);
        throw error;
      }

      console.log(`API: Added user ${userId} to project ${projectId}`);
    } catch (error) {
      console.error("API: Exception in addMember:", error);
      throw error;
    }
  },

  async removeMember(projectId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("user_projects")
        .delete()
        .eq("project_id", projectId)
        .eq("user_id", userId);

      if (error) {
        console.error("API: Error removing member from project:", error);
        throw error;
      }

      console.log(`API: Removed user ${userId} from project ${projectId}`);
    } catch (error) {
      console.error("API: Exception in removeMember:", error);
      throw error;
    }
  },

  async getMembers(projectId: string): Promise<User[]> {
    try {
      console.log(`API: Fetching members for project ${projectId}`);
      const { data, error } = await supabase
        .from("user_projects")
        .select("user_id, profiles(*)")
        .eq("project_id", projectId);

      if (error) {
        console.error("API: Error fetching project members:", error);
        throw error;
      }

      console.log(
        `API: Found ${data?.length || 0} members for project ${projectId}`,
      );
      return (data || []).map((item) => ({
        id: item.profiles.id,
        name: item.profiles.name || "",
        email: item.profiles.email || "",
        role: (item.profiles.role as UserRole) || "user",
        jobTitle: item.profiles.job_title,
        avatar:
          item.profiles.avatar ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.profiles.email}`,
      }));
    } catch (error) {
      console.error("API: Exception in getMembers:", error);
      throw error;
    }
  },
};
