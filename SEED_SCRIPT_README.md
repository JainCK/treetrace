# TreeTrace Seed Data Script

This script populates your TreeTrace database with sample data including the new features.

## What the Script Creates

### Tree Data Features:

- **15 sample trees** (configurable via `NUM_TREES_TO_GENERATE`)
- **Mix of species**: Oak, Pine, Maple, Birch, Willow, Ash, Elm, Spruce, Fir, Cypress, Banyan, Neem, Mango, Teak, Eucalyptus
- **Locations**: Various locations around Mumbai area (Hindalco's operational area)
- **Premium Trees**: ~33% of trees are premium with additional details
- **New Fields**: Location, Landmark, Carbon Footprint data
- **Images**: 2-5 placeholder images per tree

### Premium Tree Features Include:

- Age (5-55 years)
- Biological conditions
- Care timeline with maintenance events
- Environmental benefits
- Complete tree management history

### Mumbai Locations Used:

- Central Park, Mumbai
- Bandra Kurla Complex, Mumbai
- Powai Lake Area, Mumbai
- Worli Seaface, Mumbai
- Juhu Beach vicinity, Mumbai
- And 10 more realistic Mumbai locations

## Prerequisites

1. **Apply Database Changes First**

   ```sql
   ALTER TABLE trees ADD COLUMN location TEXT;
   ALTER TABLE trees ADD COLUMN landmark TEXT;
   ALTER TABLE trees ADD COLUMN carbon_footprint DECIMAL(10,2);
   ```

2. **Environment Setup**

   - Ensure your `.env` file contains:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
     DUMMY_USER_ID=your_actual_user_id_from_auth_users_table
     ```

3. **Get User ID**
   - Go to Supabase Dashboard → Authentication → Users
   - Copy a user ID from the table
   - Add it to your `.env` file as `DUMMY_USER_ID`

## How to Run

### Method 1: Using Node.js directly

```bash
cd scripts
node seed-data.js
```

### Method 2: Using npm script (if added to package.json)

```bash
npm run seed
```

## Sample Output

```
🌱 Starting data seeding for 15 trees...
📍 Location: Mumbai area (Hindalco Pvt Limited)
🏆 Premium trees: ~33% of total trees
🆕 New features: Location, Landmark, Carbon Footprint tracking
────────────────────────────────────────────────────────────

✅ Successfully inserted tree: Oak Tree #1 (ID: abc-123...)
   📍 Location: Central Park, Mumbai
   🏛️ Landmark: Near the main fountain
   🌱 Carbon absorption: 28.45 kg CO₂/year
   📸 Successfully inserted 3 images
────────────────────────────────────────────────────────────

🎉 SEEDING COMPLETED!
📊 Summary:
   • Total trees created: 15/15
   • Premium trees: 5 (33%)
   • Regular trees: 10
   • Total images: 52
   • Average images per tree: 3.5

🌳 Your TreeTrace database is now populated with sample data!
💡 Features included:
   • Location-based search
   • Landmark references
   • Carbon footprint tracking
   • Premium tree details (age, care timeline, benefits)
```

## Configuration

Edit the script to customize:

- `NUM_TREES_TO_GENERATE`: Change number of trees (default: 15)
- Add more locations in the `locations` array
- Add more landmarks in the `landmarks` array
- Modify premium tree percentage (currently every 3rd tree)

## Testing Search Features

After seeding, you can test the new search functionality:

- Search by tree name: "Oak", "Pine", "Maple"
- Search by location: "Central Park", "Bandra", "Powai"
- Search by landmark: "fountain", "playground", "entrance"

## Troubleshooting

1. **User ID Error**: Make sure `DUMMY_USER_ID` is set to a real user ID from your auth.users table
2. **Database Error**: Ensure the new columns are added to your trees table
3. **Permission Error**: Verify your service role key has the correct permissions

## Clean Up

To remove seeded data (optional):

```sql
-- Delete trees created by the seed script
DELETE FROM trees WHERE common_name LIKE '%Tree #%';
```

The script creates realistic, varied data perfect for testing all the new TreeTrace features!
