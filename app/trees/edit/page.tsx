import { supabase } from "@/utils/supabase/client";
import { TreeWithImages } from "@/lib/types";
import { EditTreeClient } from "@/components/edit-tree-client";
import { notFound, redirect } from "next/navigation";

async function getTree(id: string): Promise<TreeWithImages | null> {
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

export default async function EditTreePage({
  params,
}: {
  params: { id: string };
}) {
  const tree = await getTree(params.id);

  if (!tree) {
    notFound();
  }

  return <EditTreeClient tree={tree} />;
}
