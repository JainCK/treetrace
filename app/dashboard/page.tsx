"use client";

import type React from "react";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import type { TreeWithImages, UserProfileWithSingleRole } from "@/lib/types";
import { TreeCard } from "@/components/tree-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import {
  Search,
  Plus,
  Settings,
  LogOut,
  Trees,
  ChevronLeft,
  ChevronRight,
  Leaf,
} from "lucide-react";

const PAGE_SIZE = 12;

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
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (searchQuery) {
    query = query.or(
      `common_name.ilike.%${searchQuery}%,scientific_name.ilike.%${searchQuery}%`
    );
  }

  const { data: trees, error, count } = await query.range(from, to);

  if (error) {
    console.error("Error fetching trees:", error);
    return { trees: [], count: 0 };
  }

  return { trees: trees as TreeWithImages[], count: count || 0 };
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [trees, setTrees] = useState<TreeWithImages[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalTrees, setTotalTrees] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = useCallback(async (page: number, query: string) => {
    setLoading(true);
    const { trees: fetchedTrees, count: fetchedCount } = await fetchTrees(
      page,
      PAGE_SIZE,
      query
    );
    setTrees(fetchedTrees);
    setTotalTrees(fetchedCount);
    setLoading(false);
  }, []);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);

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
  }, [router, fetchData, currentPage, searchQuery]);

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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(0);
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-6 gap-4">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-2 rounded-lg">
                <Trees className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-800 to-cyan-700 bg-clip-text text-transparent">
                  Tree Trace
                </h1>
                <p className="text-blue-600 text-sm font-medium">
                  Welcome back, {user.email?.split("@")[0]}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {isAdmin && (
                <Link href="/admin">
                  <Button
                    variant="outline"
                    className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Admin Panel
                  </Button>
                </Link>
              )}
              {isAdmin && (
                <Link href="/trees/new">
                  <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Tree
                  </Button>
                </Link>
              )}
              <Button
                onClick={handleLogout}
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section */}
        <div className="mb-8">
          <div className="max-w-4xl mx-auto ">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-16 w-8 text-blue-400" />
              <Input
                type="text"
                placeholder="Search by common or scientific name..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-14 pr-6 py-5 w-full bg-white/80 backdrop-blur-sm border-blue-200 focus:border-blue-400 focus:ring-blue-400 rounded-2xl shadow-xl text-xl h-16"
                style={{ fontSize: "1.25rem", height: "4rem" }}
              />
            </div>
            {searchQuery && (
              <p className="text-center text-blue-600 text-sm mt-2">
                {loading
                  ? "Searching..."
                  : `Found ${totalTrees} result${
                      totalTrees !== 1 ? "s" : ""
                    } for "${searchQuery}"`}
              </p>
            )}
          </div>
        </div>

        {/* Stats Bar */}
        <div className="mb-8">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-blue-100">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-xl font-bold text-blue-600">
                  {totalTrees}
                </div>
                <div className="text-blue-800 font-medium">Total Trees</div>
              </div>
              <div>
                <div className="text-xl font-bold text-cyan-600">
                  {totalPages}
                </div>
                <div className="text-blue-800 font-medium">Pages</div>
              </div>
              <div>
                <div className="text-xl font-bold text-blue-600">
                  {currentPage + 1}
                </div>
                <div className="text-blue-800 font-medium">Current Page</div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {trees.length === 0 && !loading ? (
          <div className="text-center py-16">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-12 shadow-lg border border-blue-100 max-w-2xl mx-auto">
              <div className="bg-gradient-to-r from-blue-100 to-cyan-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <Leaf className="h-12 w-12 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-blue-800 mb-4">
                {searchQuery ? "No matching trees found" : "No trees found"}
              </h3>
              <p className="text-blue-600 mb-8 text-lg">
                {isAdmin
                  ? searchQuery
                    ? "Try adjusting your search terms or add a new tree to get started."
                    : "Get started by adding your first tree to the collection."
                  : "No trees are currently available for your account."}
              </p>
              {isAdmin && (
                <Link href="/trees/new">
                  <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg text-lg px-8 py-3">
                    <Plus className="h-5 w-5 mr-2" />
                    Add a New Tree
                  </Button>
                </Link>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Loading State */}
            {loading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-blue-600 font-medium">Loading trees...</p>
              </div>
            )}

            {/* Tree Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
              {trees.map((tree) => (
                <TreeCard key={tree.id} tree={tree} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-blue-100">
                  <div className="flex items-center space-x-4">
                    <Button
                      onClick={goToPreviousPage}
                      disabled={currentPage === 0 || loading}
                      variant="outline"
                      className="border-blue-200 text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>

                    <div className="flex items-center space-x-2">
                      <span className="text-blue-800 font-medium">
                        Page {currentPage + 1} of {totalPages}
                      </span>
                    </div>

                    <Button
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages - 1 || loading}
                      variant="outline"
                      className="border-blue-200 text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>

                {/* Page Numbers for larger screens */}
                <div className="hidden md:flex bg-white/60 backdrop-blur-sm rounded-xl p-2 shadow-lg border border-blue-100">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum = i;
                    if (totalPages > 5) {
                      if (currentPage < 3) {
                        pageNum = i;
                      } else if (currentPage > totalPages - 4) {
                        pageNum = totalPages - 5 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                    }

                    return (
                      <Button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        variant={currentPage === pageNum ? "default" : "ghost"}
                        className={
                          currentPage === pageNum
                            ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
                            : "text-blue-700 hover:bg-blue-50"
                        }
                        size="sm"
                      >
                        {pageNum + 1}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
