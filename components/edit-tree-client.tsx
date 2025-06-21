"use client";

import { useRouter } from "next/navigation";
import { TreeForm } from "@/components/tree-form";
import { TreeWithImages } from "@/lib/types";
import Link from "next/link";

interface EditTreeClientProps {
  tree: TreeWithImages;
}

export function EditTreeClient({ tree }: EditTreeClientProps) {
  const router = useRouter();

  const handleSuccess = (treeId: string) => {
    router.push(`/trees/${treeId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href={`/trees/${tree.id}`}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Back to Tree Details
          </Link>
        </div>

        <TreeForm initialData={tree} onSuccess={handleSuccess} />
      </div>
    </div>
  );
}
