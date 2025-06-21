require("dotenv").config({ path: "../.env" });
const { createClient } = require("@supabase/supabase-js");
const { v4: uuidv4 } = require("uuid");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error(
    "Missing Supabase URL or Service Role Key. Ensure seed.env has them."
  );
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false, // Important for server-side scripts
  },
});

// --- IMPORTANT: Replace with an actual user_id from your Supabase Auth -> Users table ---
// You must have at least one user registered in Supabase Auth (see Step 5)
// You can get this ID from the Supabase UI or by querying `auth.users` table
const DUMMY_USER_ID =
  process.env.DUMMY_USER_ID || "YOUR_ACTUAL_DUMMY_USER_UUID";

const dummyTreeData = [
  {
    common_name: "Weeping Willow",
    scientific_name: "Salix babylonica",
    facts: "Graceful, water-loving tree known for its drooping branches.",
    description:
      "A beautiful deciduous tree often found near water bodies, providing shade and a calming presence.",
    latitude: 37.7749,
    longitude: -122.4194,
    // Use placeholder images for seeding, or upload actual images to Supabase Storage manually
    // and get their public URLs. This script won't upload images for simplicity.
    image_urls: [
      "https://placehold.co/400x300/A0B2C0/FFFFFF?text=Willow+1",
      "https://placehold.co/400x300/B2A0C0/FFFFFF?text=Willow+2",
    ],
  },
  {
    common_name: "Red Maple",
    scientific_name: "Acer rubrum",
    facts: "Known for its vibrant red autumn foliage and fast growth.",
    description:
      "A popular ornamental tree in North America, adaptable to various soils.",
    latitude: 40.7128,
    longitude: -74.006,
    image_urls: ["https://placehold.co/400x300/C0A0B2/FFFFFF?text=Maple+1"],
  },
  {
    common_name: "Silver Birch",
    scientific_name: "Betula pendula",
    facts: "Distinctive white, peeling bark and slender branches.",
    description:
      "A medium-sized deciduous tree native to Europe and Asia, often grown for its ornamental value.",
    latitude: 51.5074,
    longitude: 0.1278,
    image_urls: [
      "https://placehold.co/400x300/C0B2A0/FFFFFF?text=Birch+1",
      "https://placehold.co/400x300/A0C0B2/FFFFFF?text=Birch+2",
      "https://placehold.co/400x300/B2C0A0/FFFFFF?text=Birch+3",
    ],
  },
];

async function seedData() {
  console.log("Starting data seeding...");
  if (DUMMY_USER_ID === "YOUR_ACTUAL_DUMMY_USER_UUID") {
    console.error(
      "ERROR: Please replace DUMMY_USER_ID in seed-data.js with an actual user ID from your Supabase Auth -> Users table."
    );
    process.exit(1);
  }

  for (const tree of dummyTreeData) {
    try {
      // Insert tree data
      const { data: newTree, error: treeError } = await supabaseAdmin
        .from("trees")
        .insert([
          {
            user_id: DUMMY_USER_ID,
            common_name: tree.common_name,
            scientific_name: tree.scientific_name,
            facts: tree.facts,
            description: tree.description,
            latitude: tree.latitude,
            longitude: tree.longitude,
          },
        ])
        .select()
        .single();

      if (treeError) {
        throw new Error(
          `Tree insert failed for ${tree.common_name}: ${treeError.message}`
        );
      }
      console.log(`Successfully inserted tree: ${tree.common_name}`);

      // Insert image URLs
      if (tree.image_urls && tree.image_urls.length > 0) {
        const imageInserts = tree.image_urls.map((url) => ({
          tree_id: newTree.id,
          image_url: url,
        }));
        const { error: imageError } = await supabaseAdmin
          .from("tree_images")
          .insert(imageInserts);

        if (imageError) {
          throw new Error(
            `Image insert failed for ${tree.common_name}: ${imageError.message}`
          );
        }
        console.log(`Successfully inserted images for: ${tree.common_name}`);
      }
    } catch (error) {
      console.error(
        `Failed to seed data for ${tree.common_name}:`,
        error.message
      );
    }
  }
  console.log("Seeding process finished.");
}

seedData();
