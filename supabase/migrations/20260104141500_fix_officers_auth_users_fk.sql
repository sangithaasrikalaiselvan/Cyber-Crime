/*
  # Fix officers table to link with Supabase Auth

  Problem:
  - officers.id was generated independently (gen_random_uuid())
  - Frontend uses auth.users.id for officer profile

  Fix:
  - Recreate officers so officers.id references auth.users(id)
  - Re-add status_updates.updated_by FK to officers(id)
  - Add RLS policies for self-service profile

  NOTE:
  - This migration DROPS the officers table (data loss for officers).
*/

-- Drop & recreate officers to match auth.users
DROP TABLE IF EXISTS officers CASCADE;

CREATE TABLE officers (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  badge_number text UNIQUE NOT NULL,
  dob date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE officers ENABLE ROW LEVEL SECURITY;

-- Officers can only access their own profile
DROP POLICY IF EXISTS "Officers can view own profile" ON officers;
DROP POLICY IF EXISTS "Officers can create own profile" ON officers;
DROP POLICY IF EXISTS "Officers can update own profile" ON officers;

CREATE POLICY "Officers can view own profile"
  ON officers FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Officers can create own profile"
  ON officers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Officers can update own profile"
  ON officers FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Restore FK from status_updates.updated_by to officers(id)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'status_updates'
  ) THEN
    -- Drop any existing constraint with this name, then add it back.
    ALTER TABLE public.status_updates
      DROP CONSTRAINT IF EXISTS status_updates_updated_by_fkey;

    ALTER TABLE public.status_updates
      ADD CONSTRAINT status_updates_updated_by_fkey
      FOREIGN KEY (updated_by)
      REFERENCES public.officers(id);
  END IF;
END $$;
