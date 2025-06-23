// app/admin/page.tsx
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { ProfileWithRole, UserProfileWithSingleRole } from "@/lib/types";
import { UserManagerClient } from "@/components/user-manager-client";

// Define page size for consistency
const ADMIN_PAGE_SIZE = 10; // Display 10 users per page on admin panel

// Function to fetch users with pagination and search on the server
async function getUsersData(
  page: number = 0, // Default to page 0
  searchQuery: string = "" // Default to empty search
): Promise<{ profiles: ProfileWithRole[]; count: number; isAdmin: boolean }> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/"); // Redirect to login if not authenticated
  }

  // Fetch current user's profile to check their role
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
    userProfileError ||
    !userProfileData ||
    !userProfileData.role ||
    userProfileData.role.name !== "admin"
  ) {
    console.error(
      "Access denied. User is not an admin or profile not found.",
      userProfileError
    );
    redirect("/dashboard"); // Redirect non-admins to dashboard
  } else {
    isAdmin = true; // Confirm admin status
  }

  // --- Fetch all profiles with pagination and search ---
  const from = page * ADMIN_PAGE_SIZE;
  const to = from + ADMIN_PAGE_SIZE - 1;

  let query = supabase.from("profiles").select(
    `
      id,
      full_name,
      role:role_id (
        id,
        name
      )
    `,
    { count: "exact" }
  ); // Request exact count for pagination

  // Apply search filter if a query is provided
  if (searchQuery) {
    // Search across full_name or email (email is not directly in profiles table,
    // but often full_name is initialized with email).
    // For more robust search across auth.users.email, you'd need a separate Edge Function or RPC.
    // For now, we'll search full_name as that's directly available in profiles.
    query = query.ilike("full_name", `%${searchQuery}%`);
  }

  const {
    data: allProfiles,
    error: profilesError,
    count,
  } = await query.order("full_name", { ascending: true }).range(from, to);

  if (profilesError) {
    console.error("Error fetching all profiles for admin page:", profilesError);
    return { profiles: [], count: 0, isAdmin: isAdmin };
  }

  return {
    profiles: allProfiles as ProfileWithRole[],
    count: count || 0,
    isAdmin: isAdmin,
  };
}

// Next.js convention to access search params in Server Components
interface AdminPageProps {
  searchParams: {
    page?: string;
    search?: string;
  };
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const page = parseInt(searchParams.page || "0", 10);
  const searchQuery = searchParams.search || "";

  const {
    profiles,
    count: totalProfiles,
    isAdmin,
  } = await getUsersData(page, searchQuery);

  // If for some reason the isAdmin check in getUsersData failed here, it would redirect.
  // This return assumes isAdmin is true if we reached here.

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Admin Dashboard
        </h1>
        {/* Pass props including new pagination/search info */}
        <UserManagerClient
          initialProfiles={profiles}
          initialTotalProfiles={totalProfiles}
          initialPage={page}
          initialSearchQuery={searchQuery}
          adminPageSize={ADMIN_PAGE_SIZE}
        />
      </div>
    </div>
  );
}
