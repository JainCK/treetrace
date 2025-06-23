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
  initialTotalProfiles: number;
  initialPage: number;
  initialSearchQuery: string;
  adminPageSize: number;
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

  // NEW: Separate error/success states for create user form
  const [createUserError, setCreateUserError] = useState<string | null>(null);
  const [createUserSuccess, setCreateUserSuccess] = useState<string | null>(
    null
  );

  // NEW: Separate error/success states for manage users table operations
  const [manageUserError, setManageUserError] = useState<string | null>(null);
  const [manageUserSuccess, setManageUserSuccess] = useState<string | null>(
    null
  );

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // NEW: Granular loading states
  const [isFetchingUsers, setIsFetchingUsers] = useState(true); // For main table data fetch
  const [isCreatingUser, setIsCreatingUser] = useState(false); // For new user form submission
  const [isUpdatingRole, setIsUpdatingRole] = useState<string | null>(null); // Stores profileId being updated
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null); // Stores profileId being deleted

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
  } = useForm<NewUserData>({
    resolver: zodResolver(newUserSchema),
    defaultValues: {
      role: "",
    },
  });

  useEffect(() => {
    if (roles.length > 0 && selectedNewUserRole === "") {
      const defaultRole = roles.find((r) => r.name === "user");
      if (defaultRole) {
        setSelectedNewUserRole(defaultRole.name);
        setValue("role", defaultRole.name);
      }
    }
  }, [roles, selectedNewUserRole, setValue]);

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

  useEffect(() => {
    const fetchRoles = async () => {
      // This is a static fetch, no need for a dedicated loading state unless it's slow
      // We can use isFetchingUsers if it's the only initial load.
      setIsFetchingUsers(true);
      const { data, error } = await supabase
        .from("roles")
        .select("*")
        .order("name");
      if (error) {
        console.error("Error fetching roles:", error);
        setManageUserError("Failed to load roles."); // Use manageUserError for global admin errors
      } else {
        setRoles(data as Role[]);
      }
      setIsFetchingUsers(false);
    };
    fetchRoles();
  }, []);

  const fetchUsers = useCallback(
    async (page: number, query: string) => {
      setIsFetchingUsers(true); // Set loading for fetching users
      setManageUserError(null); // Clear previous errors for user list

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
        setManageUserError("Failed to load users.");
        setProfiles([]);
        setTotalProfiles(0);
      } else {
        setProfiles(fetchedProfiles as ProfileWithRole[]);
        setTotalProfiles(count || 0);
      }
      setIsFetchingUsers(false); // End loading for fetching users
    },
    [adminPageSize]
  );

  useEffect(() => {
    fetchUsers(currentPage, searchQuery);
  }, [currentPage, searchQuery, fetchUsers]);

  const handleRoleChange = async (profileId: string, newRoleName: string) => {
    setManageUserError(null);
    setManageUserSuccess(null);
    setIsUpdatingRole(profileId); // Set specific user as loading

    const newRoleId = roles.find((role) => role.name === newRoleName)?.id;

    if (!newRoleId) {
      setManageUserError("Invalid role selected.");
      setIsUpdatingRole(null);
      return;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role_id: newRoleId })
        .eq("id", profileId);

      if (error) {
        console.error("Error updating user role:", error);
        setManageUserError(
          `Failed to update role for ${profileId.substring(0, 8)}...: ${
            error.message
          }`
        );
      } else {
        setProfiles((prevProfiles) =>
          prevProfiles.map((profile) =>
            profile.id === profileId
              ? { ...profile, role: [{ id: newRoleId, name: newRoleName }] }
              : profile
          )
        );
        console.log(`Role for ${profileId} updated to ${newRoleName}`);
        setManageUserSuccess(
          `Role for ${profileId.substring(0, 8)}... updated to ${newRoleName}`
        );
      }
    } catch (err: any) {
      console.error("Error updating user role (catch block):", err);
      setManageUserError(
        err.message || "An unexpected error occurred while updating role."
      );
    } finally {
      setIsUpdatingRole(null); // End loading for this specific user
    }
  };

  const handleCreateUser = async (data: NewUserData) => {
    setCreateUserError(null); // Clear errors for create form
    setCreateUserSuccess(null); // Clear success for create form
    setIsCreatingUser(true); // Set loading for create user operation

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

      setCreateUserSuccess(
        `User "${email}" created with role "${roleName}" successfully!`
      );
      resetNewUserForm();
      setSelectedNewUserRole("");
      setCurrentPage(0); // Go back to the first page to see the new user
      setSearchQuery(""); // Clear search query to ensure new user is visible
      // Data will re-fetch via useEffect due to currentPage/searchQuery change
    } catch (err: any) {
      console.error("Error creating user:", err);
      setCreateUserError(
        err.message || "An error occurred during user creation."
      );
    } finally {
      setIsCreatingUser(false); // End loading for create user operation
    }
  };

  const handleDeleteUser = async (userIdToDelete: string) => {
    setManageUserError(null);
    setManageUserSuccess(null);
    setDeletingUserId(userIdToDelete); // Set specific user as loading

    // Using browser confirm, ideally replace with a custom modal
    if (
      !confirm(
        `Are you sure you want to delete user ${userIdToDelete.substring(
          0,
          8
        )}...? This cannot be undone.`
      )
    ) {
      setDeletingUserId(null); // Clear loading if cancelled
      return;
    }

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

      setManageUserSuccess(
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
      setManageUserError(
        err.message || "An error occurred during user deletion."
      );
    } finally {
      setDeletingUserId(null); // End loading for this specific user
    }
  };

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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(0);
  };

  if (isFetchingUsers && profiles.length === 0 && roles.length === 0) {
    return (
      <div className="flex justify-center items-center h-48">
        <p className="text-gray-700">Loading user management...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Add New User Card */}
      <Card className="rounded-xl shadow-lg p-4 md:p-8 border border-blue-100 bg-white">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Add New User
          </CardTitle>
          <p className="text-gray-600 text-lg">
            Create new user accounts and assign their roles.
          </p>
          {createUserError && ( // Use specific error state
            <p className="text-red-600 text-sm mt-4 p-2 border border-red-300 bg-red-50 rounded-md">
              {createUserError}
            </p>
          )}
          {createUserSuccess && ( // Use specific success state
            <p className="text-green-600 text-sm mt-4 p-2 border border-green-300 bg-green-50 rounded-md">
              {createUserSuccess}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleCreateUser)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="newUserEmail">Email</Label>
                <Input
                  id="newUserEmail"
                  type="email"
                  {...register("email")}
                  disabled={isCreatingUser} // Disable based on specific loading state
                  className="w-full rounded-md px-3 py-2 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                />
                {newUserErrors.email && (
                  <p className="text-red-600 text-sm">
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
                  disabled={isCreatingUser} // Disable based on specific loading state
                  className="w-full rounded-md px-3 py-2 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                />
                {newUserErrors.password && (
                  <p className="text-red-600 text-sm">
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
                disabled={isCreatingUser || isFetchingUsers} // Disable based on specific loading states
              >
                <SelectTrigger className="w-full md:w-[180px] rounded-md px-3 py-2 border border-gray-300 focus:ring-blue-500 focus:border-blue-500">
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
                <p className="text-red-600 text-sm">
                  {newUserErrors.role.message}
                </p>
              )}
            </div>
            <div className="flex justify-center pt-4">
              <Button
                type="submit"
                disabled={isCreatingUser} // Disable based on specific loading state
                className="w-full md:w-auto px-8 py-3 text-lg font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ease-in-out bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isCreatingUser ? "Creating..." : "Create New User"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Manage Existing Users Card */}
      <Card className="rounded-xl shadow-lg p-4 md:p-8 border border-blue-100 bg-white">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Manage Existing Users
          </CardTitle>
          <p className="text-gray-600 text-lg">
            View, search, and update roles for existing users.
          </p>
          {manageUserError && ( // Use specific error state
            <p className="text-red-600 text-sm mt-4 p-2 border border-red-300 bg-red-50 rounded-md">
              {manageUserError}
            </p>
          )}
          {manageUserSuccess && ( // Use specific success state
            <p className="text-green-600 text-sm mt-4 p-2 border border-green-300 bg-green-50 rounded-md">
              {manageUserSuccess}
            </p>
          )}
        </CardHeader>
        <CardContent>
          {/* Search Input for User List */}
          <div className="mb-6">
            <Input
              type="text"
              placeholder="Search users by full name..."
              value={searchQuery}
              onChange={handleSearchChange}
              disabled={
                isFetchingUsers ||
                isUpdatingRole !== null ||
                deletingUserId !== null
              } // Disable during any operation
              className="w-full max-w-md mx-auto block rounded-md px-3 py-2 border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-blue-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider"
                  >
                    User ID
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider"
                  >
                    Full Name (Email)
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider"
                  >
                    Current Role
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isFetchingUsers && profiles.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      Loading users...
                    </td>
                  </tr>
                ) : profiles.length === 0 && !searchQuery ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No users found.
                    </td>
                  </tr>
                ) : profiles.length === 0 && searchQuery ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No matching users found for "{searchQuery}".
                    </td>
                  </tr>
                ) : (
                  profiles.map((profile) => (
                    <tr
                      key={profile.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {profile.id.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {profile.full_name || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <Select
                          value={profile.role?.[0]?.name || ""}
                          onValueChange={(newRoleName) =>
                            handleRoleChange(profile.id, newRoleName)
                          }
                          disabled={
                            isUpdatingRole === profile.id ||
                            deletingUserId !== null ||
                            isFetchingUsers
                          } // Disable if this user's role is updating OR any user is deleting OR fetching
                        >
                          <SelectTrigger className="w-full md:w-[180px] rounded-md px-3 py-2 border border-gray-300 focus:ring-blue-500 focus:border-blue-500">
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteUser(profile.id)}
                          disabled={
                            deletingUserId === profile.id || // Disable if this user is being deleted
                            isCreatingUser || // Disable if new user is being created
                            isUpdatingRole !== null || // Disable if any role is being updated
                            currentUserId === profile.id // Always disable deleting self
                          }
                          className="shadow-sm hover:shadow-md transition-shadow"
                        >
                          {deletingUserId === profile.id
                            ? "Deleting..."
                            : "Delete"}
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
            <div className="flex justify-center items-center space-x-4 mt-8 py-3 bg-gray-50 rounded-lg border border-gray-200">
              <Button
                onClick={goToPreviousPage}
                disabled={
                  currentPage === 0 ||
                  isFetchingUsers ||
                  isCreatingUser ||
                  isUpdatingRole !== null ||
                  deletingUserId !== null
                }
                variant="outline"
                className="shadow-sm hover:shadow-md transition-shadow"
              >
                Previous
              </Button>
              <span className="text-gray-700 font-medium">
                Page {currentPage + 1} of {totalPages}
              </span>
              <Button
                onClick={goToNextPage}
                disabled={
                  currentPage === totalPages - 1 ||
                  isFetchingUsers ||
                  isCreatingUser ||
                  isUpdatingRole !== null ||
                  deletingUserId !== null
                }
                variant="outline"
                className="shadow-sm hover:shadow-md transition-shadow"
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
