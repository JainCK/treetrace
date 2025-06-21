// app/trees/[id]/page.tsx
import { createClient } from "@/utils/supabase/server";
import { TreeWithImages } from "@/lib/types";
import { TreeDetailClient } from "@/components/tree-detail-client";
import { notFound, redirect } from "next/navigation";

async function getTree(id: string): Promise<TreeWithImages | null> {
  // Await the creation of the Supabase client
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
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
    .eq("user_id", user.id)
    .single();

  if (error) {
    console.error("Error fetching tree:", error);
    return null;
  }

  return tree as TreeWithImages;
}

export default async function TreeDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const tree = await getTree(params.id);

  if (!tree) {
    notFound();
  }

  return <TreeDetailClient tree={tree} />;
}
