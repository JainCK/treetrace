export interface Tree {
  id: string;
  created_at: string;
  user_id: string;
  common_name: string;
  scientific_name: string;
  facts: string | null;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  is_premium?: boolean | null; // Optional flag for premium trees
  age?: number | null;
  biological_conditions?: string | null;
  care_timeline?: any | null; // Use 'any' for JSONB for now, will refine later if needed
  benefits?: string | null;
}

export interface TreeImage {
  id: string;
  tree_id: string;
  image_url: string;
  uploaded_at: string;
}

export interface TreeWithImages extends Tree {
  tree_images: TreeImage[];
}

export interface Role {
  id: number;
  name: string;
}

export interface UserProfileWithSingleRole {
  id: string; // auth.users.id
  full_name: string | null;
  role: Role; // Here, 'role' is a single object
}

export interface ProfileWithRole {
  id: string;
  full_name: string | null;
  role: Role[]; // CRITICAL: This MUST be 'Role', not 'Role[]'
}
