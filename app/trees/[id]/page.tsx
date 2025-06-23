// app/trees/[id]/page.tsx
import { createClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import { TreeWithImages, UserProfileWithSingleRole } from "@/lib/types";
import { TreeDetailClient } from "@/components/tree-detail-client";

async function getTree(
  id: string
): Promise<{ tree: TreeWithImages | null; isAdmin: boolean }> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userAuthError,
  } = await supabase.auth.getUser();

  if (userAuthError || !user) {
    redirect("/");
  }

  // --- DEBUG LOGS START ---
  console.log("Fetching user profile for tree detail page. User ID:", user.id);
  // --- DEBUG LOGS END ---

  // Fetch user's profile to determine if they are admin
  const { data: userProfileData, error: userProfileError } = (await supabase
    .from("profiles")
    .select(
      `
      id,
      full_name,
      role:role_id (
        id,
        name
      )
    `
    )
    .eq("id", user.id)
    .single()) as { data: UserProfileWithSingleRole | null; error: any };

  let isAdmin = false;
  if (
    userProfileData &&
    userProfileData.role &&
    userProfileData.role.name === "admin"
  ) {
    isAdmin = true;
  }

  // --- DEBUG LOGS START ---
  console.log("User profile fetched:", userProfileData);
  if (userProfileError) {
    console.error(
      "Error fetching user profile in tree detail page (server):",
      userProfileError
    );
  }
  console.log("Is Admin (determined on server):", isAdmin);
  // --- DEBUG LOGS END ---

  const { data: tree, error } = await supabase
    .from("trees")
    .select(
      `
      *,
      tree_images (*)
    `
    )
    .eq("id", id)
    .single();

  if (error || !tree) {
    console.error("Error fetching tree for detail page:", error);
    return { tree: null, isAdmin: isAdmin };
  }

  return { tree: tree as TreeWithImages, isAdmin: isAdmin };
}

export default async function TreeDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { tree, isAdmin } = await getTree(params.id);

  if (!tree) {
    notFound();
  }

  return <TreeDetailClient tree={tree} isAdmin={isAdmin} />;
}
