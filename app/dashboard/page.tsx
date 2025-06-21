// app/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react"; // Import useEffect and useState
import { useRouter } from "next/navigation"; // Import useRouter
import { supabase } from "@/utils/supabase/client";
import { TreeWithImages } from "@/lib/types";
import { TreeCard } from "@/components/tree-card";
import { LogoutButton } from "@/components/logout-button";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// We'll move the redirect logic from here,
// and make getTrees a regular async function that can be called.
async function fetchTrees(userId: string): Promise<TreeWithImages[]> {
  const { data: trees, error } = await supabase
    .from("trees")
    .select(
      `
      *,
      tree_images (*)
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching trees:", error);
    return [];
  }

  return trees as TreeWithImages[];
}

export default function DashboardPage() {
  const router = useRouter(); // Initialize useRouter
  const [user, setUser] = useState<any>(null); // State to hold user info
  const [trees, setTrees] = useState<TreeWithImages[]>([]); // State to hold trees
  const [loading, setLoading] = useState(true); // Loading state for initial fetch

  useEffect(() => {
    // This effect runs once on component mount
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // User is logged in
        setUser(session.user);
        // Fetch trees only when user is confirmed
        const userTrees = await fetchTrees(session.user.id);
        setTrees(userTrees);
        setLoading(false);
      } else {
        // No user session, redirect to login
        setUser(null);
        setTrees([]);
        setLoading(false);
        router.push("/"); // Use router.push for client-side navigation
      }
    });

    // Cleanup subscription on component unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [router]); // Depend on router to ensure effect logic is stable

  // Show a loading indicator while checking auth state and fetching data
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  // If after loading, there's no user, it means the redirect to '/' should have already happened
  // This is a fallback, primarily, as the useEffect should handle the redirect.
  if (!user) {
    // If we somehow get here without a user, ensure redirect.
    // This path should ideally be handled by the useEffect above.
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Tree Management
            </h1>
            <div className="flex space-x-4">
              <Link href="/trees/new">
                <Button>Add New Tree</Button>
              </Link>
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {trees.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No trees found
            </h3>
            <p className="text-gray-600 mb-4">
              Get started by adding your first tree.
            </p>
            <Link href="/trees/new">
              <Button>Add Your First Tree</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {trees.map((tree) => (
              <TreeCard key={tree.id} tree={tree} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
