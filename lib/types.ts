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
