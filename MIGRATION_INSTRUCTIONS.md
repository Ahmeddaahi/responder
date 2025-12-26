# Database Migration Instructions

## Migration: Add Category and Quantity Columns to Products

### What Changed
Added two new columns to the `user_products` table:
- `category` (TEXT) - Optional field to categorize products
- `quantity` (INTEGER) - Optional field to track product inventory

### How to Apply the Migration

#### Option 1: Using Supabase Dashboard (Recommended)
1. Go to your Supabase Dashboard: https://ilcxoakgntprququdgok.supabase.co
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the following SQL:

```sql
-- Add category and quantity columns to user_products table
ALTER TABLE public.user_products
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS quantity INTEGER;
```

5. Click **Run** to execute the migration
6. Verify the migration by checking the table structure in **Table Editor** → **user_products**

#### Option 2: Using Supabase CLI (If installed)
If you have the Supabase CLI installed, you can run:
```bash
supabase db push
```

This will automatically apply all pending migrations in the `supabase/migrations` folder.

### Migration File Location
The migration SQL file has been created at:
`supabase/migrations/20251209000000_add_category_quantity_to_products.sql`

### Verification
After applying the migration, you should see:
- A new "Category" column in the products table
- A new "Quantity" column in the products table
- Both columns should allow NULL values
- Existing products will have NULL values for these new columns

### Code Changes Summary
The following files have been updated to support the new columns:

1. **Database Schema** (`supabase/migrations/20251209000000_add_category_quantity_to_products.sql`)
   - Added `category` and `quantity` columns

2. **TypeScript Types** (`src/integrations/supabase/types.ts`)
   - Updated `user_products` Row, Insert, and Update types

3. **Knowledge Page** (`src/pages/Knowledge.tsx`)
   - Updated Product interface
   - Added category and quantity to product form
   - Updated table headers and columns
   - Updated CRUD operations to handle new fields

### Testing
After applying the migration:
1. Navigate to the Knowledge page
2. Try adding a new product with category and quantity
3. Try editing an existing product to add category and quantity
4. Verify the data is saved correctly in the database
