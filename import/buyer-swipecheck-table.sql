-- ============================================================
-- Buyer SwipeCheck Lite — table migration
-- Run this in the Supabase SQL editor BEFORE deploying the page
-- ============================================================

CREATE TABLE IF NOT EXISTS buyer_swipecheck_logs (
  id                      bigserial PRIMARY KEY,
  property_address        text NOT NULL,
  roof_condition          text CHECK (roof_condition IN ('Looks New', 'Aging', 'Needs Replacement')),
  hvac_condition          text CHECK (hvac_condition IN ('Looks New', 'Aging', 'Needs Replacement')),
  water_heater_condition  text CHECK (water_heater_condition IN ('Looks New', 'Aging', 'Needs Replacement')),
  windows_condition       text CHECK (windows_condition IN ('Original', 'Updated', 'Broken Seals')),
  water_intrusion_flag    boolean NOT NULL DEFAULT false,
  foundation_issues_flag  boolean NOT NULL DEFAULT false,
  estimated_capex         numeric(12, 2),
  submitted_by_user_id    integer REFERENCES profiles(id) ON DELETE SET NULL,
  created_at              timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_buyer_swipecheck_logs_created ON buyer_swipecheck_logs(created_at DESC);
