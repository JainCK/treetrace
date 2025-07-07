// seed-data.js
// Try loading .env from multiple possible locations
try {
  require("dotenv").config({ path: "../.env" }); // From scripts/ directory
} catch (e) {
  try {
    require("dotenv").config({ path: ".env" }); // From project root
  } catch (e2) {
    require("dotenv").config(); // Default behavior
  }
}

const { createClient } = require("@supabase/supabase-js");
const { v4: uuidv4 } = require("uuid"); // For generating unique IDs if needed, though Supabase handles tree.id

console.log("🔍 Checking environment variables...");
console.log(
  "SUPABASE_URL:",
  process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Found" : "❌ Missing"
);
console.log(
  "SERVICE_ROLE_KEY:",
  process.env.SUPABASE_SERVICE_ROLE_KEY ? "✅ Found" : "❌ Missing"
);
console.log(
  "DUMMY_USER_ID:",
  process.env.DUMMY_USER_ID ? "✅ Found" : "❌ Missing"
);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error(
    "Missing Supabase URL or Service Role Key. Ensure your .env file has them."
  );
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false, // Important for server-side scripts
  },
});

// --- IMPORTANT: Replace with an actual user_id from your Supabase Auth -> Users table ---
// You must have at least one user registered in Supabase Auth (e.g., your admin user)
// You can get this ID from the Supabase UI or by querying `auth.users` table
const DUMMY_USER_ID =
  process.env.DUMMY_USER_ID || "YOUR_ACTUAL_DUMMY_USER_UUID";

// --- Configuration for generating more trees ---
const NUM_TREES_TO_GENERATE = 15; // You can change this number (e.g., 50, 100, 200)

const baseTreeNames = [
  { common: "Oak", scientific: "Quercus robur" },
  { common: "Pine", scientific: "Pinus sylvestris" },
  { common: "Maple", scientific: "Acer platanoides" },
  { common: "Birch", scientific: "Betula pendula" },
  { common: "Willow", scientific: "Salix babylonica" },
  { common: "Ash", scientific: "Fraxinus excelsior" },
  { common: "Elm", scientific: "Ulmus americana" },
  { common: "Spruce", scientific: "Picea abies" },
  { common: "Fir", scientific: "Abies alba" },
  { common: "Cypress", scientific: "Cupressus sempervirens" },
  { common: "Banyan", scientific: "Ficus benghalensis" },
  { common: "Neem", scientific: "Azadirachta indica" },
  { common: "Mango", scientific: "Mangifera indica" },
  { common: "Teak", scientific: "Tectona grandis" },
  { common: "Eucalyptus", scientific: "Eucalyptus globulus" },
];

const locations = [
  "Central Park, Mumbai",
  "Bandra Kurla Complex, Mumbai",
  "Powai Lake Area, Mumbai",
  "Worli Seaface, Mumbai",
  "Juhu Beach vicinity, Mumbai",
  "Andheri Sports Complex, Mumbai",
  "Malad Industrial Area, Mumbai",
  "Thane Creek, Mumbai",
  "Versova Beach Park, Mumbai",
  "Aarey Colony, Mumbai",
  "Sanjay Gandhi National Park, Mumbai",
  "Marine Drive, Mumbai",
  "Shivaji Park, Mumbai",
  "Matunga Station Road, Mumbai",
  "Ghatkopar Hills, Mumbai",
];

const landmarks = [
  "Near the main fountain",
  "Behind the administrative building",
  "Next to the parking area",
  "Close to the children's playground",
  "Adjacent to the security gate",
  "By the main entrance",
  "Near the cafeteria",
  "Next to the jogging track",
  "Close to the bus stop",
  "Behind the visitor center",
  "Near the meditation garden",
  "By the artificial lake",
  "Next to the sports field",
  "Close to the memorial statue",
  "Near the botanical garden",
];

const benefitsOptions = [
  "Air purification\nCarbon sequestration\nSoil conservation",
  "Noise reduction\nTemperature regulation\nBiodiversity support",
  "Erosion control\nWildlife habitat\nOxygen production",
  "Urban cooling\nStormwater management\nAesthetic enhancement",
  "Mental health benefits\nProperty value increase\nWindbreak protection",
];

const biologicalConditionsOptions = [
  "Healthy root system with good drainage. Regular watering schedule maintained. No signs of disease or pest infestation.",
  "Established mature tree with strong trunk. Seasonal pruning completed. Excellent soil conditions with proper pH balance.",
  "Young sapling with developing root structure. Protected from strong winds. Regular fertilization program in place.",
  "Mature specimen showing excellent growth patterns. Well-adapted to local climate conditions. Minimal maintenance required.",
  "Recently transplanted with careful root ball preservation. Monitoring for transplant shock. Supplemental watering ongoing.",
];

function generateCareTimeline() {
  const events = [
    { date: "2024-01-15", event: "Initial planting and soil preparation" },
    { date: "2024-02-20", event: "First fertilization and mulching" },
    { date: "2024-04-10", event: "Pruning of lower branches for clearance" },
    { date: "2024-06-05", event: "Pest inspection and treatment application" },
    { date: "2024-08-12", event: "Deep watering system installation" },
    { date: "2024-10-18", event: "Health assessment and growth measurement" },
    { date: "2024-12-22", event: "Winter protection and stake adjustment" },
  ];

  // Return 3-5 random events for each tree
  const numEvents = Math.floor(Math.random() * 3) + 3;
  return events.slice(0, numEvents);
}

function generateDummyTree(index) {
  const baseName = baseTreeNames[index % baseTreeNames.length];
  const common_name = `${baseName.common} Tree #${index + 1}`;
  const scientific_name = baseName.scientific;
  const location = locations[index % locations.length];
  const landmark = landmarks[index % landmarks.length];

  // Make every 3rd tree premium (roughly 33% premium trees)
  const is_premium = (index + 1) % 3 === 0;

  const facts = `${common_name} is known for its exceptional environmental benefits.\nThis species typically grows ${
    20 + Math.floor(Math.random() * 30)
  } meters tall.\nNative to various regions and widely cultivated for sustainability projects.\nExcellent for urban environments due to pollution tolerance.`;

  const description = `This magnificent ${common_name} stands as a testament to Hindalco's commitment to environmental sustainability. Located in ${location}, this tree serves as both a natural air purifier and a symbol of our green initiatives. The specimen has been carefully selected and maintained as part of our comprehensive tree plantation program, contributing significantly to the local ecosystem and carbon offset goals.`;

  // Vary latitude and longitude around Mumbai area
  const latitude = 19.076 + (Math.random() - 0.5) * 0.2; // Around Mumbai
  const longitude = 72.8777 + (Math.random() - 0.5) * 0.2; // Around Mumbai

  // Carbon footprint between 15-50 kg CO2 per year
  const carbon_footprint = Math.round((15 + Math.random() * 35) * 100) / 100;

  const numImages = Math.floor(Math.random() * 4) + 2; // 2 to 5 images per tree
  const image_urls = Array.from({ length: numImages }).map((_, imgIndex) => {
    const width = 800 + imgIndex * 50;
    const height = 600 + imgIndex * 50;
    const bgColor = Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, "0");
    const textColor = "ffffff";
    return `https://placehold.co/${width}x${height}/${bgColor}/${textColor}?text=${encodeURIComponent(
      baseName.common
    )}+${index + 1}-${imgIndex + 1}`;
  });

  const tree = {
    common_name,
    scientific_name,
    facts,
    description,
    latitude,
    longitude,
    location,
    landmark,
    carbon_footprint,
    is_premium,
    image_urls,
  };

  // Add premium fields if it's a premium tree
  if (is_premium) {
    tree.age = Math.floor(Math.random() * 50) + 5; // 5-55 years old
    tree.biological_conditions =
      biologicalConditionsOptions[index % biologicalConditionsOptions.length];
    tree.care_timeline = generateCareTimeline();
    tree.benefits = benefitsOptions[index % benefitsOptions.length];
  }

  return tree;
}

async function seedData() {
  console.log(`🌱 Starting data seeding for ${NUM_TREES_TO_GENERATE} trees...`);
  console.log("📍 Location: Mumbai area (Hindalco Pvt Limited)");
  console.log("🏆 Premium trees: ~33% of total trees");
  console.log("🆕 New features: Location, Landmark, Carbon Footprint tracking");
  console.log("─".repeat(60));

  if (DUMMY_USER_ID === "YOUR_ACTUAL_DUMMY_USER_UUID") {
    console.error(
      "❌ ERROR: Please replace DUMMY_USER_ID in seed-data.js with an actual user ID from your Supabase Auth -> Users table."
    );
    process.exit(1);
  }

  const allDummyTrees = Array.from({ length: NUM_TREES_TO_GENERATE }).map(
    (_, i) => generateDummyTree(i)
  );

  let successCount = 0;
  let premiumCount = 0;
  let totalImages = 0;

  for (const tree of allDummyTrees) {
    try {
      // Prepare tree data object
      const treeData = {
        user_id: DUMMY_USER_ID,
        common_name: tree.common_name,
        scientific_name: tree.scientific_name,
        facts: tree.facts,
        description: tree.description,
        latitude: tree.latitude,
        longitude: tree.longitude,
        location: tree.location,
        landmark: tree.landmark,
        carbon_footprint: tree.carbon_footprint,
        is_premium: tree.is_premium,
      };

      // Add premium fields if it's a premium tree
      if (tree.is_premium) {
        treeData.age = tree.age;
        treeData.biological_conditions = tree.biological_conditions;
        treeData.care_timeline = tree.care_timeline;
        treeData.benefits = tree.benefits;
      }

      // Insert tree data
      const { data: newTree, error: treeError } = await supabaseAdmin
        .from("trees")
        .insert([treeData])
        .select()
        .single();

      if (treeError) {
        throw new Error(
          `Tree insert failed for ${tree.common_name}: ${treeError.message}`
        );
      }

      const premiumStatus = tree.is_premium ? " (PREMIUM)" : "";
      console.log(
        `✅ Successfully inserted tree: ${newTree.common_name} (ID: ${newTree.id})${premiumStatus}`
      );
      console.log(`   📍 Location: ${tree.location}`);
      console.log(`   🏛️ Landmark: ${tree.landmark}`);
      console.log(
        `   🌱 Carbon absorption: ${tree.carbon_footprint} kg CO₂/year`
      );

      successCount++;
      if (tree.is_premium) premiumCount++;

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
        totalImages += imageInserts.length;
        console.log(
          `   📸 Successfully inserted ${imageInserts.length} images`
        );
      }
      console.log("─".repeat(60));
    } catch (error) {
      console.error(
        `❌ Failed to seed data for a tree:`,
        error.message || error
      );
    }
  }

  console.log("\n🎉 SEEDING COMPLETED!");
  console.log(`📊 Summary:`);
  console.log(
    `   • Total trees created: ${successCount}/${NUM_TREES_TO_GENERATE}`
  );
  console.log(
    `   • Premium trees: ${premiumCount} (${Math.round(
      (premiumCount / successCount) * 100
    )}%)`
  );
  console.log(`   • Regular trees: ${successCount - premiumCount}`);
  console.log(`   • Total images: ${totalImages}`);
  console.log(
    `   • Average images per tree: ${
      Math.round((totalImages / successCount) * 10) / 10
    }`
  );
  console.log(
    "\n🌳 Your TreeTrace database is now populated with sample data!"
  );
  console.log("💡 Features included:");
  console.log("   • Location-based search");
  console.log("   • Landmark references");
  console.log("   • Carbon footprint tracking");
  console.log("   • Premium tree details (age, care timeline, benefits)");
}

seedData();
