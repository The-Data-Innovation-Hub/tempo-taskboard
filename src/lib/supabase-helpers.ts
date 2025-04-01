import { supabase } from "./supabase";

// Helper functions for common Supabase operations

// Select with pagination
export const selectWithPagination = async (
  table: keyof Database["public"]["Tables"],
  page = 1,
  pageSize = 10,
  query?: (queryBuilder: any) => any,
) => {
  const from = supabase.from(table);
  const queryBuilder = query ? query(from) : from;

  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;

  const { data, error } = await queryBuilder.select("*").range(start, end);

  return { data, error };
};

// Count records
export const countRecords = async (
  table: keyof Database["public"]["Tables"],
  query?: (queryBuilder: any) => any,
) => {
  const from = supabase.from(table);
  const queryBuilder = query ? query(from) : from;

  const { count, error } = await queryBuilder.select("*", {
    count: "exact",
    head: true,
  });

  return { count, error };
};

// Filter by multiple IDs
export const filterByIds = async (
  table: keyof Database["public"]["Tables"],
  ids: string[],
  column = "id",
) => {
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .in(column, ids);

  return { data, error };
};

// Storage operations
export const uploadFile = async (bucket: string, path: string, file: File) => {
  if (!supabase.storage) {
    console.error("Storage is not available");
    return { error: { message: "Storage is not available" } };
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    });

  return { data, error };
};

export const getFileUrl = (bucket: string, path: string) => {
  if (!supabase.storage) {
    console.error("Storage is not available");
    return null;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);

  return data?.publicUrl;
};

export const listBuckets = async () => {
  if (!supabase.storage) {
    console.error("Storage is not available");
    return { error: { message: "Storage is not available" } };
  }

  const { data, error } = await supabase.storage.listBuckets();
  return { data, error };
};
