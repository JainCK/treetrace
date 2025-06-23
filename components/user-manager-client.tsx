// src/components/admin/user-manager-client.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User } from "@supabase/supabase-js";

import { ProfileWithRole, Role } from "@/lib/types";

interface UserManagerClientProps {
  initialProfiles: ProfileWithRole[];
  initialTotalProfiles: number; // NEW: Total count from server
  initialPage: number; // NEW: Initial page from server
  initialSearchQuery: string; // NEW: Initial search query from server
  adminPageSize: number; // NEW: Page size from server
}

const newUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.string().min(1, "Role is required"),
});

type NewUserData = z.infer<typeof newUserSchema>;

export function UserManagerClient({
  initialProfiles,
  initialTotalProfiles,
  initialPage,
  initialSearchQuery,
  adminPageSize,
}: UserManagerClientProps) {
  const [profiles, setProfiles] = useState<ProfileWithRole[]>(initialProfiles);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creationSuccess, setCreationSuccess] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Pagination and Search states
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalProfiles, setTotalProfiles] = useState(initialTotalProfiles);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);

  const [selectedNewUserRole, setSelectedNewUserRole] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors: newUserErrors },
    reset: resetNewUserForm,
    setValue,
    watch,
  } = useForm<NewUserData>({
    resolver: zodResolver(newUserSchema),
    defaultValues: {
      role: "",
    },
  });

  // Effect to set initial default role for the new user form
  useEffect(() => {
    if (roles.length > 0 && selectedNewUserRole === "") {
      const defaultRole = roles.find((r) => r.name === "user");
      if (defaultRole) {
        setSelectedNewUserRole(defaultRole.name);
        setValue("role", defaultRole.name);
      }
    }
  }, [roles, selectedNewUserRole, setValue]);

  // Fetch current user ID on mount
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    fetchUser();
  }, []);

  // Fetch roles dynamically
  useEffect(() => {
    const fetchRoles = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("roles")
        .select("*")
        .order("name");
      if (error) {
        console.error("Error fetching roles:", error);
        setError("Failed to load roles.");
      } else {
        setRoles(data as Role[]);
      }
      setLoading(false);
    };
    fetchRoles();
  }, []);

  // --- NEW: Client-side data fetching for pagination/search ---
  const fetchUsers = useCallback(
    async (page: number, query: string) => {
      setLoading(true);
      setError(null); // Clear previous errors

      const from = page * adminPageSize;
      const to = from + adminPageSize - 1;

      let supabaseQuery = supabase.from("profiles").select(
        `
        id,
        full_name,
        role:role_id (
          id,
          name
        )
      `,
        { count: "exact" }
      );

      if (query) {
        supabaseQuery = supabaseQuery.ilike("full_name", `%${query}%`);
      }

      const {
        data: fetchedProfiles,
        error: fetchError,
        count,
      } = await supabaseQuery
        .order("full_name", { ascending: true })
        .range(from, to);

      if (fetchError) {
        console.error("Error fetching users:", fetchError);
        setError("Failed to load users.");
        setProfiles([]);
        setTotalProfiles(0);
      } else {
        setProfiles(fetchedProfiles as ProfileWithRole[]);
        setTotalProfiles(count || 0);
      }
      setLoading(false);
    },
    [adminPageSize]
  ); // Dependency on adminPageSize

  // Effect to re-fetch data when currentPage or searchQuery changes
  useEffect(() => {
    fetchUsers(currentPage, searchQuery);
  }, [currentPage, searchQuery, fetchUsers]); // Add fetchUsers to dependencies

  const handleRoleChange = async (profileId: string, newRoleName: string) => {
    setError(null);
    setCreationSuccess(null);
    setLoading(true);

    const newRoleId = roles.find((role) => role.name === newRoleName)?.id;

    if (!newRoleId) {
      setError("Invalid role selected.");
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ role_id: newRoleId })
      .eq("id", profileId);

    if (error) {
      console.error("Error updating user role:", error);
      setError(
        `Failed to update role for ${profileId.substring(0, 8)}...: ${
          error.message
        }`
      );
    } else {
      // Optimistically update UI
      setProfiles((prevProfiles) =>
        prevProfiles.map((profile) =>
          profile.id === profileId
            ? { ...profile, role: [{ id: newRoleId, name: newRoleName }] }
            : profile
        )
      );
      console.log(`Role for ${profileId} updated to ${newRoleName}`);
      setCreationSuccess(
        `Role for ${profileId.substring(0, 8)}... updated to ${newRoleName}`
      );
    }
    setLoading(false);
  };

  const handleCreateUser = async (data: NewUserData) => {
    setError(null);
    setCreationSuccess(null);
    setLoading(true);

    try {
      const { email, password, role: roleName } = data;

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error("No active session. Please log in.");
      }

      const response = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ email, password, roleName }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create user via admin.");
      }

      setCreationSuccess(
        `User "${email}" created with role "${roleName}" successfully!`
      );
      resetNewUserForm();
      setSelectedNewUserRole(""); // Reset the local state for the Select as well
      setCurrentPage(0); // Go back to the first page to see the new user
      setSearchQuery(""); // Clear search query to ensure new user is visible
      // Data will re-fetch via useEffect due to currentPage/searchQuery change
    } catch (err: any) {
      console.error("Error creating user:", err);
      setError(err.message || "An error occurred during user creation.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userIdToDelete: string) => {
    setError(null);
    setCreationSuccess(null);

    // Using browser confirm, ideally replace with a custom modal
    if (
      !confirm(
        `Are you sure you want to delete user ${userIdToDelete.substring(
          0,
          8
        )}...? This cannot be undone.`
      )
    ) {
      return;
    }

    setLoading(true);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error("No active session. Please log in.");
      }

      const response = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ userId: userIdToDelete }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete user.");
      }

      setCreationSuccess(
        `User ${userIdToDelete.substring(0, 8)}... deleted successfully.`
      );
      setCurrentPage(0); // Go back to first page after deletion
      setSearchQuery(""); // Clear search query
      // Data will re-fetch via useEffect due to currentPage/searchQuery change
      if (userIdToDelete === currentUserId) {
        await supabase.auth.signOut();
        window.location.href = "/";
      }
    } catch (err: any) {
      console.error("Error deleting user:", err);
      setError(err.message || "An error occurred during user deletion.");
    } finally {
      setLoading(false);
    }
  };

  // Handlers for pagination
  const totalPages = Math.ceil(totalProfiles / adminPageSize);

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

  if (loading && profiles.length === 0 && roles.length === 0) {
    return (
      <div className="flex justify-center items-center h-48">
        <p>Loading user management...</p>
      </div>
    );
  }

  return (
    <>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Add New User</CardTitle>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          {creationSuccess && (
            <p className="text-green-500 text-sm mt-2">{creationSuccess}</p>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleCreateUser)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newUserEmail">Email</Label>
                <Input
                  id="newUserEmail"
                  type="email"
                  {...register("email")}
                  disabled={loading}
                />
                {newUserErrors.email && (
                  <p className="text-red-500 text-sm">
                    {newUserErrors.email.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="newUserPassword">Password</Label>
                <Input
                  id="newUserPassword"
                  type="password"
                  {...register("password")}
                  disabled={loading}
                />
                {newUserErrors.password && (
                  <p className="text-red-500 text-sm">
                    {newUserErrors.password.message}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newUserRole">Assign Role</Label>
              <Select
                value={selectedNewUserRole}
                onValueChange={(value) => {
                  setSelectedNewUserRole(value);
                  setValue("role", value, { shouldValidate: true });
                }}
                disabled={loading}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.name}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {newUserErrors.role && (
                <p className="text-red-500 text-sm">
                  {newUserErrors.role.message}
                </p>
              )}
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create New User"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manage Existing Users</CardTitle>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          {creationSuccess && (
            <p className="text-green-500 text-sm mt-2">{creationSuccess}</p>
          )}
        </CardHeader>
        <CardContent>
          {/* Search Input for User List */}
          <div className="mb-6">
            <Input
              type="text"
              placeholder="Search by full name..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full max-w-md mx-auto block"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    User ID
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Full Name (Email)
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Current Role
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {profiles.length === 0 && !loading && searchQuery ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No matching users found.
                    </td>
                  </tr>
                ) : profiles.length === 0 && !loading && !searchQuery ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No users found.
                    </td>
                  </tr>
                ) : (
                  profiles.map((profile) => (
                    <tr key={profile.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {profile.id.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {profile.full_name || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <Select
                          value={profile.role?.[0]?.name || ""}
                          onValueChange={(newRoleName) =>
                            handleRoleChange(profile.id, newRoleName)
                          }
                          disabled={loading}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map((role) => (
                              <SelectItem key={role.id} value={role.name}>
                                {role.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteUser(profile.id)}
                          disabled={loading || currentUserId === profile.id}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
        </CardContent>
      </Card>
    </>
  );
}
