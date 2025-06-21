"use client";

import { useRouter } from "next/navigation";
import { TreeForm } from "@/components/tree-form";

export default function NewTreePage() {
  const router = useRouter();

  const handleSuccess = (treeId: string) => {
    router.push(`/trees/${treeId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Back
          </button>
        </div>

        <TreeForm onSuccess={handleSuccess} />
      </div>
    </div>
  );
}
