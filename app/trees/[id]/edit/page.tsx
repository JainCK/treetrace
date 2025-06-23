import { createClient } from "@/utils/supabase/server"; // IMPORT THE SERVER CLIENT
import { TreeWithImages } from "@/lib/types";
import { EditTreeClient } from "@/components/edit-tree-client";
import { notFound, redirect } from "next/navigation";

async function getTree(id: string): Promise<TreeWithImages | null> {
  // CRITICAL FIX: Initialize the server-side Supabase client here
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser(); // This will now correctly read the session from server cookies

  if (!user) {
    redirect("/"); // If no user, redirect to login page
  }

  const { data: tree, error } = await supabase
    .from("trees")
    .select(
      `
      *,
      tree_images (*)
    `
    )
    .eq("id", id)
    .eq("user_id", user.id) // Essential for RLS and ownership check
    .single();

  if (error) {
    console.error("Error fetching tree for edit:", error); // Specific log for edit page
    return null; // Or throw a specific error, or notFound()
  }

  return tree as TreeWithImages;
}

export default async function EditTreePage({
  params,
}: {
  params: { id: string };
}) {
  const tree = await getTree(params.id);

  if (!tree) {
    notFound(); // If tree not found or error, show 404
  }

  return <EditTreeClient tree={tree} />;
}
