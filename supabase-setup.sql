-- MJW Tracker — Supabase setup
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run

-- 1. Create the data table (one row per user per data key)
CREATE TABLE IF NOT EXISTS mjw_user_data (
  username   text        NOT NULL,
  data_key   text        NOT NULL,
  data_value jsonb,
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (username, data_key)
);

-- 2. Enable Row Level Security
ALTER TABLE mjw_user_data ENABLE ROW LEVEL SECURITY;

-- 3. Allow service role full access (our API uses service role key — never exposed to browser)
CREATE POLICY "Service role full access"
  ON mjw_user_data
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Done! The app uses this table via /api/data (server-side only).
-- No other setup needed.
