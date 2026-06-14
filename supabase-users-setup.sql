-- MJW Tracker — Users table (run this after supabase-setup.sql)
-- Enables open registration and real username/password changes

CREATE TABLE IF NOT EXISTS mjw_users (
  username     text        PRIMARY KEY,
  password_hash text       NOT NULL,
  display_name text        NOT NULL,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE mjw_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access"
  ON mjw_users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
