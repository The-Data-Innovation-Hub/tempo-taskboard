import type { Database } from "./supabase";

export type UserRole = "admin" | "user";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  jobTitle?: string;
  organizationId?: string;
  organization?: Organization;
  projects?: Project[];
}

export interface Organization {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  organization_id?: string;
  user_id: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  lastUpdated?: string;
  memberCount?: number;
  taskCount?: number;
  columns: Column[];
}

export interface Column {
  id: string;
  title: string;
  project_id: string;
  order: number;
  created_at: string;
  updated_at: string;
  tasks: Task[];
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  column_id: string;
  project_id: string;
  user_id: string;
  order: number;
  due_date?: string;
  is_completed: boolean;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  labels?: Label[];
  assignees?: { id: string; name: string; avatar: string }[];
  attachments?: TaskAttachment[];
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface TaskAttachment {
  id: string;
  task_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  created_at: string;
  updated_at: string;
}

// Type definitions for Supabase PostgreSQL functions
export type PostgrestError = {
  message: string;
  details: string;
  hint: string;
  code: string;
};

export type PostgrestResponse<T> = {
  data: T | null;
  error: PostgrestError | null;
  count: number | null;
  status: number;
  statusText: string;
};

// Export database types for use in the application
export type Tables = Database["public"]["Tables"];
export type TablesInsert = {
  [K in keyof Tables]: Tables[K]["Insert"];
};
export type TablesUpdate = {
  [K in keyof Tables]: Tables[K]["Update"];
};
export type TablesRow = {
  [K in keyof Tables]: Tables[K]["Row"];
};
