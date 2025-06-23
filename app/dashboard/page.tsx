// app/dashboard/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client"; // Client-side Supabase
import { TreeWithImages, UserProfileWithSingleRole } from "@/lib/types"; // Import types
import { TreeCard } from "@/components/tree-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { User } from "@supabase/supabase-js"; // Import Supabase User type
import { Input } from "@/components/ui/input"; // Import Input component for search

// Define page size for pagination
const PAGE_SIZE = 12; // Display 12 trees per page

// Modified fetchTrees to include pagination, count, and search
async function fetchTrees(
  page: number,
  pageSize: number,
  searchQuery: string
): Promise<{ trees: TreeWithImages[]; count: number }> {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("trees")
    .select(
      `
      *,
      tree_images (*)
    `,
      { count: "exact" } // Request exact count for pagination
    )
    .order("created_at", { ascending: false });

  // Apply search filter if a query is provided
  if (searchQuery) {
    // Search across common_name and scientific_name
    query = query.or(
      `common_name.ilike.%${searchQuery}%,scientific_name.ilike.%${searchQuery}%`
    );
  }

  const { data: trees, error, count } = await query.range(from, to); // Fetch only the items for the current page

  if (error) {
    console.error("Error fetching trees:", error);
    return { trees: [], count: 0 };
  }

  return { trees: trees as TreeWithImages[], count: count || 0 };
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null); // State to hold user info
  const [trees, setTrees] = useState<TreeWithImages[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false); // State for admin status
  const [currentPage, setCurrentPage] = useState(0); // Current page (0-indexed)
  const [totalTrees, setTotalTrees] = useState(0); // Total number of trees
  const [searchQuery, setSearchQuery] = useState(""); // State for search query

  // Memoized function for fetching data, depends on currentPage and searchQuery
  const fetchData = useCallback(async (page: number, query: string) => {
    setLoading(true);
    // Note: Errors from fetchTrees are logged internally there.
    const { trees: fetchedTrees, count: fetchedCount } = await fetchTrees(
      page,
      PAGE_SIZE,
      query
    );
    setTrees(fetchedTrees);
    setTotalTrees(fetchedCount);
    setLoading(false);
  }, []); // No dependencies for fetchData itself to avoid re-creating on every render

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);

        // Fetch user's profile to determine role client-side
        const { data: userProfileData, error: userProfileError } =
          (await supabase
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
            .eq("id", session.user.id)
            .single()) as {
            data: UserProfileWithSingleRole | null;
            error: any;
          };

        if (userProfileError) {
          console.error(
            "Error fetching user profile for dashboard:",
            userProfileError
          );
        } else if (
          userProfileData &&
          userProfileData.role &&
          userProfileData.role.name === "admin"
        ) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }

        // Initial fetch with current page and search query
        await fetchData(currentPage, searchQuery);
      } else {
        setUser(null);
        setTrees([]);
        setIsAdmin(false);
        setLoading(false);
        router.push("/");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, fetchData, currentPage, searchQuery]); // Add searchQuery to dependencies

  // Handlers for pagination
  const totalPages = Math.ceil(totalTrees / PAGE_SIZE);

  const goToPreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Handler for search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(0); // Reset to first page on new search
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      router.push("/");
    } else {
      console.error("Logout error:", error.message);
      alert("Failed to log out. Please try again.");
    }
  };

  if (loading && trees.length === 0 && !user) {
    // More precise loading state
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (!user) {
    return null; // Should redirect via useEffect if no user
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
              {isAdmin && ( // Conditionally render Admin button
                <Link href="/admin">
                  <Button variant="outline">Admin Panel</Button>
                </Link>
              )}
              {isAdmin && ( // Only show "Add New Tree" for admins
                <Link href="/trees/new">
                  <Button>Add New Tree</Button>
                </Link>
              )}
              <Button onClick={handleLogout}>Logout</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Input */}
        <div className="mb-6">
          <Input
            type="text"
            placeholder="Search by common or scientific name..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full max-w-md mx-auto block"
          />
        </div>

        {trees.length === 0 && !loading ? ( // Display "No trees found" only if truly empty after loading
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? "No matching trees found." : "No trees found."}
            </h3>
            <p className="text-gray-600 mb-4">
              {isAdmin
                ? "Get started by adding your first tree."
                : "No trees available for your account."}
            </p>
            {isAdmin && (
              <Link href="/trees/new">
                <Button>Add Your First Tree</Button>
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {trees.map((tree) => (
                <TreeCard key={tree.id} tree={tree} />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-4 mt-8">
                <Button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 0 || loading}
                  variant="outline"
                >
                  Previous
                </Button>
                <span className="text-gray-700">
                  Page {currentPage + 1} of {totalPages}
                </span>
                <Button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages - 1 || loading}
                  variant="outline"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
