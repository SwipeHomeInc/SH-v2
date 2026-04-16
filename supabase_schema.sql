-- ============================================================
-- SWIPE HOME - SUPABASE SCHEMA
-- Generated: 2026-04-15
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- NOTE: Supabase manages its own auth schema.
-- We create a `profiles` table that extends auth.users.
-- All user_id references in app tables point to profiles.id (integer)
-- during migration. The profiles table bridges Supabase Auth (UUID)
-- to your existing integer-based user data.

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  id            serial PRIMARY KEY,
  auth_uid      uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name          varchar,
  email         varchar UNIQUE,
  image         text,
  role          text DEFAULT 'user',
  welcome_email_sent_at  timestamptz,
  tutorial_seen_at       timestamptz,
  created_at    timestamp DEFAULT now(),
  updated_at    timestamp DEFAULT now()
);

-- ============================================================
-- PROPERTIES
-- ============================================================

CREATE TABLE IF NOT EXISTS properties (
  id                        serial PRIMARY KEY,
  user_id                   integer REFERENCES profiles(id) ON DELETE SET NULL,
  address                   text NOT NULL,
  unit                      text,
  city                      text NOT NULL,
  state                     text NOT NULL,
  zip                       text NOT NULL,
  bedrooms                  integer,
  bathrooms                 numeric,
  square_feet               integer,
  year_built                integer,
  latitude                  double precision,
  longitude                 double precision,
  address_key               text,
  has_garage                boolean,
  garage_spaces             numeric,
  has_pool                  boolean,
  stories                   integer,
  hvac_type                 text,
  lot_dimensions            text,
  parcel_number             text,
  roof_year                 integer,
  hvac_year                 integer,
  water_heater_year         integer,
  electrical_panel_year     integer,
  plumbing_year             integer,
  last_crawlspace_inspection timestamptz,
  last_attic_inspection     timestamptz,
  is_high_humidity_area     boolean DEFAULT false,
  last_roof_inspection      timestamptz,
  last_hvac_service         timestamptz,
  landlord_name             text,
  flood_zone                text,
  flood_zone_subtype        text,
  flood_firm_panel          text,
  flood_firm_effective_date date,
  fire_hazard_class         text,
  fire_hazard_value         integer,
  risk_data_json            jsonb,
  risk_updated_at           timestamptz,
  created_at                timestamp DEFAULT now()
);

-- ============================================================
-- DIDPIDS (property claiming system)
-- ============================================================

CREATE TABLE IF NOT EXISTS didpids (
  id           serial PRIMARY KEY,
  property_id  integer REFERENCES properties(id) ON DELETE SET NULL,
  didpid_code  text NOT NULL UNIQUE,
  created_at   timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS didpid_claims (
  id          serial PRIMARY KEY,
  didpid_id   integer NOT NULL REFERENCES didpids(id) ON DELETE CASCADE,
  user_id     integer NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role        text NOT NULL DEFAULT 'owner',
  claimed_at  timestamp DEFAULT now(),
  revoked_at  timestamp
);

-- ============================================================
-- PROPERTY MEMBERSHIPS & SHARING
-- ============================================================

CREATE TABLE IF NOT EXISTS property_memberships (
  id           serial PRIMARY KEY,
  property_id  integer NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id      integer NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role         text NOT NULL,
  permissions_json jsonb,
  created_at   timestamp DEFAULT now(),
  revoked_at   timestamp
);

CREATE TABLE IF NOT EXISTS property_sharing_settings (
  id                     serial PRIMARY KEY,
  property_id            integer NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  private_only           boolean NOT NULL DEFAULT true,
  share_with_brokerage   boolean NOT NULL DEFAULT false,
  public_listing_allowed boolean NOT NULL DEFAULT false,
  share_didpid_publicly  boolean NOT NULL DEFAULT false,
  updated_by_user_id     integer REFERENCES profiles(id) ON DELETE SET NULL,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS property_transfer_invites (
  id                   serial PRIMARY KEY,
  property_id          integer NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  invited_by_user_id   integer NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_email      text,
  recipient_name       text,
  recipient_phone      text,
  token                text NOT NULL UNIQUE,
  status               text NOT NULL DEFAULT 'pending',
  claimed_by_user_id   integer REFERENCES profiles(id) ON DELETE SET NULL,
  claimed_at           timestamp,
  expires_at           timestamptz NOT NULL,
  created_at           timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS access_requests (
  id                    serial PRIMARY KEY,
  property_id           integer NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  requester_user_id     integer NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role_requested        text NOT NULL,
  message               text,
  status                text NOT NULL DEFAULT 'pending',
  created_at            timestamp DEFAULT now(),
  responded_at          timestamp,
  responded_by_user_id  integer REFERENCES profiles(id) ON DELETE SET NULL,
  denied_reason         text
);

-- ============================================================
-- PROPERTY DOCUMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS property_documents (
  id                   serial PRIMARY KEY,
  property_id          integer NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  url                  text NOT NULL,
  title                text,
  mime_type            text,
  size_bytes           integer,
  source               text,
  uploaded_at          timestamp DEFAULT now(),
  uploaded_by_user_id  integer REFERENCES profiles(id) ON DELETE SET NULL,
  notes                text,
  system               text,
  category             text,
  imaging_job_id       integer
);

-- ============================================================
-- SWIPECHECK
-- ============================================================

CREATE TABLE IF NOT EXISTS swipecheck_categories (
  id           serial PRIMARY KEY,
  key          text NOT NULL UNIQUE,
  label        text NOT NULL,
  order_index  integer NOT NULL DEFAULT 0,
  active       boolean NOT NULL DEFAULT true,
  created_at   timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS swipecheck_questions (
  id             serial PRIMARY KEY,
  category       text NOT NULL,
  mode           text NOT NULL DEFAULT 'lite',
  order_index    integer NOT NULL,
  text           text NOT NULL,
  options_json   jsonb NOT NULL,
  hint           text,
  guidance_type  text DEFAULT 'assessment',
  smart_prompts_json jsonb
);

CREATE TABLE IF NOT EXISTS swipecheck_runs (
  id                        serial PRIMARY KEY,
  property_id               integer REFERENCES properties(id) ON DELETE SET NULL,
  created_by_user_id        integer NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status                    text NOT NULL DEFAULT 'in_progress',
  rooms_json                jsonb NOT NULL DEFAULT '[]',
  completed_room_keys_json  jsonb NOT NULL DEFAULT '[]',
  summary_text              text,
  key_findings_json         jsonb,
  gentle_guidance_json      jsonb,
  recommended_trades_json   jsonb,
  suggested_timeframe       text,
  type                      text DEFAULT 'standard',
  created_at                timestamp DEFAULT now(),
  updated_at                timestamp DEFAULT now(),
  completed_at              timestamp
);

CREATE TABLE IF NOT EXISTS swipe_checks (
  id                          serial PRIMARY KEY,
  property_id                 integer REFERENCES properties(id) ON DELETE SET NULL,
  created_by_user_id          integer REFERENCES profiles(id) ON DELETE SET NULL,
  run_id                      integer REFERENCES swipecheck_runs(id) ON DELETE SET NULL,
  category                    text NOT NULL,
  mode                        text NOT NULL DEFAULT 'lite',
  answers_json                jsonb NOT NULL,
  condition                   text,
  condition_label             text,
  findings_json               jsonb,
  summary_text                text,
  key_findings_json           jsonb,
  gentle_guidance_json        jsonb,
  recommended_contractor_type text,
  suggested_timeframe         text,
  room_key                    text,
  room_label                  text,
  room_index                  integer,
  current_condition_text      text,
  recommended_work_text       text,
  estimated_cost              numeric,
  priority                    text,
  triage_json                 jsonb,
  created_at                  timestamp DEFAULT now(),
  updated_at                  timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS swipecheck_photos (
  id             serial PRIMARY KEY,
  swipecheck_id  integer NOT NULL REFERENCES swipe_checks(id) ON DELETE CASCADE,
  category       text DEFAULT 'general',
  url            text NOT NULL,
  caption        text,
  created_at     timestamp DEFAULT now()
);

-- ============================================================
-- CONTRACTORS
-- ============================================================

CREATE TABLE IF NOT EXISTS contractors (
  id                      serial PRIMARY KEY,
  user_id                 integer REFERENCES profiles(id) ON DELETE SET NULL,
  name                    text NOT NULL,
  business_name           text,
  contact_name            text,
  trade                   text NOT NULL,
  zip                     text NOT NULL,
  phone                   text,
  email                   text,
  address                 text,
  website                 text,
  bio                     text,
  logo_url                text,
  rating                  numeric,
  is_insured              boolean,
  years_in_business       integer,
  license_number          text,
  insurance_document_url  text,
  profile_status          text DEFAULT 'draft',
  submitted_at            timestamp,
  reviewed_at             timestamp,
  reviewed_by_user_id     integer REFERENCES profiles(id) ON DELETE SET NULL,
  rejection_reason        text,
  created_at              timestamp DEFAULT now(),
  updated_at              timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contractor_leads (
  id          serial PRIMARY KEY,
  name        text NOT NULL,
  company     text,
  email       text NOT NULL,
  phone       text,
  trade       text NOT NULL,
  zip         text NOT NULL,
  notes       text,
  created_at  timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contractor_photos (
  id             serial PRIMARY KEY,
  contractor_id  integer NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  url            text NOT NULL,
  caption        text,
  created_at     timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contractor_service_zips (
  id             serial PRIMARY KEY,
  contractor_id  integer NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  zip            text NOT NULL,
  created_at     timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contractor_verifications (
  id                   serial PRIMARY KEY,
  contractor_id        integer NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  type                 text NOT NULL,
  status               text NOT NULL DEFAULT 'pending',
  reference_number     text,
  issuer               text,
  coverage_amount      numeric,
  issued_date          date,
  expires_at           timestamptz,
  document_url         text,
  verified_at          timestamp,
  verified_by_user_id  integer REFERENCES profiles(id) ON DELETE SET NULL,
  rejection_reason     text,
  notes                text,
  created_at           timestamp DEFAULT now(),
  updated_at           timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contractor_subscriptions (
  id                          serial PRIMARY KEY,
  contractor_user_id          integer NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_customer_id          text,
  stripe_checkout_session_id  text,
  stripe_subscription_id      text,
  plan_key                    text NOT NULL,
  status                      text NOT NULL DEFAULT 'pending',
  zip_count                   integer NOT NULL DEFAULT 0,
  current_period_end          timestamptz,
  claim_error                 text,
  created_at                  timestamp DEFAULT now(),
  updated_at                  timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contractor_subscription_zips (
  id               serial PRIMARY KEY,
  subscription_id  integer NOT NULL REFERENCES contractor_subscriptions(id) ON DELETE CASCADE,
  zip              text NOT NULL,
  created_at       timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contractor_zip_claims (
  id                   bigserial PRIMARY KEY,
  zip                  text NOT NULL,
  contractor_user_id   integer NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subscription_id      integer NOT NULL REFERENCES contractor_subscriptions(id) ON DELETE CASCADE,
  status               text NOT NULL DEFAULT 'active',
  claimed_at           timestamp NOT NULL DEFAULT now(),
  released_at          timestamp
);

CREATE TABLE IF NOT EXISTS contractor_47point_checks (
  id                   serial PRIMARY KEY,
  contractor_id        integer NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  checkpoint_id        integer NOT NULL,
  status               text NOT NULL DEFAULT 'pending',
  notes                text,
  checked_by_user_id   integer REFERENCES profiles(id) ON DELETE SET NULL,
  checked_at           timestamp,
  created_at           timestamp DEFAULT now(),
  updated_at           timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contractor_47point_decisions (
  id                   serial PRIMARY KEY,
  contractor_id        integer NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  decision             text NOT NULL,
  passed_count         integer NOT NULL DEFAULT 0,
  failed_count         integer NOT NULL DEFAULT 0,
  pending_count        integer NOT NULL DEFAULT 0,
  critical_passed      boolean NOT NULL DEFAULT false,
  notes                text,
  decided_by_user_id   integer REFERENCES profiles(id) ON DELETE SET NULL,
  created_at           timestamp DEFAULT now()
);

-- ============================================================
-- SERVICE REQUESTS & JOBS
-- ============================================================

CREATE TABLE IF NOT EXISTS service_requests (
  id                           bigserial PRIMARY KEY,
  property_id                  integer REFERENCES properties(id) ON DELETE SET NULL,
  homeowner_user_id            integer NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category                     text NOT NULL,
  description                  text,
  zip                          text,
  status                       text NOT NULL DEFAULT 'open',
  assigned_contractor_user_id  integer REFERENCES profiles(id) ON DELETE SET NULL,
  created_at                   timestamp NOT NULL DEFAULT now(),
  updated_at                   timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversations (
  id               serial PRIMARY KEY,
  property_id      integer REFERENCES properties(id) ON DELETE SET NULL,
  participant_1_id integer NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  participant_2_id integer NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at       timestamp DEFAULT now(),
  updated_at       timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id               serial PRIMARY KEY,
  conversation_id  integer NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id        integer NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content          text NOT NULL,
  is_read          boolean NOT NULL DEFAULT false,
  created_at       timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_conversations (
  id              serial PRIMARY KEY,
  property_id     integer REFERENCES properties(id) ON DELETE SET NULL,
  homeowner_id    integer NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  contractor_id   integer NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at      timestamp DEFAULT now(),
  updated_at      timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id               serial PRIMARY KEY,
  conversation_id  integer NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender_id        integer NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content          text NOT NULL,
  is_read          boolean DEFAULT false,
  created_at       timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS jobs (
  id                     serial PRIMARY KEY,
  conversation_id        integer REFERENCES conversations(id) ON DELETE SET NULL,
  swipecheck_id          integer REFERENCES swipe_checks(id) ON DELETE SET NULL,
  property_id            integer REFERENCES properties(id) ON DELETE SET NULL,
  homeowner_id           integer REFERENCES profiles(id) ON DELETE SET NULL,
  contractor_user_id     integer NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  contractor_profile_id  integer REFERENCES contractors(id) ON DELETE SET NULL,
  category               text NOT NULL,
  issue_summary          text,
  status                 text NOT NULL DEFAULT 'in_progress',
  pipeline_status        text DEFAULT 'lead',
  scheduled_date         date,
  ready_for_review_at    timestamp,
  completed_at           timestamp,
  created_at             timestamp DEFAULT now(),
  updated_at             timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS job_checklist_templates (
  id           serial PRIMARY KEY,
  category     text NOT NULL,
  role         text NOT NULL,
  order_index  integer NOT NULL DEFAULT 0,
  text         text NOT NULL,
  active       boolean NOT NULL DEFAULT true,
  created_at   timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS job_checklist_items (
  id                    serial PRIMARY KEY,
  job_id                integer NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  role                  text NOT NULL,
  order_index           integer NOT NULL DEFAULT 0,
  text                  text NOT NULL,
  is_completed          boolean NOT NULL DEFAULT false,
  completed_at          timestamp,
  completed_by_user_id  integer REFERENCES profiles(id) ON DELETE SET NULL,
  created_at            timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS job_photos (
  id                   serial PRIMARY KEY,
  job_id               integer NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  url                  text NOT NULL,
  caption              text,
  uploaded_by_user_id  integer REFERENCES profiles(id) ON DELETE SET NULL,
  created_at           timestamp NOT NULL DEFAULT now()
);

-- ============================================================
-- WORK RECORDS
-- ============================================================

CREATE TABLE IF NOT EXISTS work_records (
  id                      serial PRIMARY KEY,
  property_id             integer NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  contractor_id           integer REFERENCES contractors(id) ON DELETE SET NULL,
  contractor_user_id      integer REFERENCES profiles(id) ON DELETE SET NULL,
  created_by_user_id      integer NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_by_role         text NOT NULL,
  category                text NOT NULL,
  date_completed          date NOT NULL,
  scope_summary           text NOT NULL,
  status                  text NOT NULL DEFAULT 'draft',
  verification_type       text,
  photos_visible_to_viewers boolean NOT NULL DEFAULT false,
  finalized_at            timestamp,
  finalized_by_user_id    integer REFERENCES profiles(id) ON DELETE SET NULL,
  created_at              timestamp DEFAULT now(),
  updated_at              timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS work_record_photos (
  id               serial PRIMARY KEY,
  work_record_id   integer NOT NULL REFERENCES work_records(id) ON DELETE CASCADE,
  photo_type       text NOT NULL,
  url              text NOT NULL,
  caption          text,
  created_at       timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS work_record_ratings (
  id               serial PRIMARY KEY,
  work_record_id   integer NOT NULL REFERENCES work_records(id) ON DELETE CASCADE,
  rated_by_user_id integer NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating           integer NOT NULL,
  feedback         text,
  created_at       timestamp DEFAULT now()
);

-- ============================================================
-- MAINTENANCE
-- ============================================================

CREATE TABLE IF NOT EXISTS maintenance_tasks (
  id                   serial PRIMARY KEY,
  property_id          integer NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  title                text NOT NULL,
  description          text,
  due_date             timestamptz,
  frequency            text DEFAULT 'once',
  status               text DEFAULT 'pending',
  completed_at         timestamptz,
  created_by_user_id   integer REFERENCES profiles(id) ON DELETE SET NULL,
  created_at           timestamp DEFAULT now()
);

-- ============================================================
-- PROJECTS
-- ============================================================

CREATE TABLE IF NOT EXISTS projects (
  id            serial PRIMARY KEY,
  property_id   integer NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id       integer REFERENCES profiles(id) ON DELETE SET NULL,
  title         text NOT NULL,
  description   text,
  status        text NOT NULL DEFAULT 'active',
  ai_assessment jsonb,
  created_at    timestamp DEFAULT now(),
  updated_at    timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_photos (
  id          serial PRIMARY KEY,
  project_id  integer NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  url         text NOT NULL,
  caption     text,
  created_at  timestamp DEFAULT now()
);

-- ============================================================
-- IMAGING JOBS
-- ============================================================

CREATE TABLE IF NOT EXISTS imaging_jobs (
  id                   serial PRIMARY KEY,
  property_id          integer NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  title                text NOT NULL DEFAULT 'Property Imaging',
  capture_date         date NOT NULL DEFAULT CURRENT_DATE,
  scope_notes          text,
  created_by_user_id   integer NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status               text NOT NULL DEFAULT 'active',
  created_at           timestamp DEFAULT now(),
  updated_at           timestamp DEFAULT now()
);

-- ============================================================
-- BROKERAGE
-- ============================================================

CREATE TABLE IF NOT EXISTS brokerage_agents (
  id              serial PRIMARY KEY,
  auth_user_id    integer REFERENCES profiles(id) ON DELETE SET NULL,
  name            text NOT NULL,
  email           text NOT NULL UNIQUE,
  phone           text,
  photo_url       text,
  bio             text,
  license_number  text,
  slug            text NOT NULL UNIQUE,
  title           text,
  specialties     text[],
  active          boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS brokerage_leads (
  id          serial PRIMARY KEY,
  type        text NOT NULL DEFAULT 'contact',
  name        text NOT NULL,
  email       text NOT NULL,
  phone       text,
  message     text,
  listing_id  integer,
  didpid      text,
  agent_id    integer REFERENCES brokerage_agents(id) ON DELETE SET NULL,
  source      text DEFAULT 'website',
  status      text NOT NULL DEFAULT 'new',
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS brokerage_waitlist (
  id             serial PRIMARY KEY,
  name           text,
  email          text NOT NULL,
  phone          text,
  zip            text,
  interest_type  text NOT NULL DEFAULT 'waitlist',
  source         text NOT NULL DEFAULT 'mobile',
  notes          text,
  created_at     timestamp NOT NULL DEFAULT now()
);

-- ============================================================
-- MLS / IDX LISTINGS
-- ============================================================

CREATE TABLE IF NOT EXISTS idx_feed_sources (
  id              serial PRIMARY KEY,
  provider        text NOT NULL,
  label           text,
  base_url        text,
  api_key_hint    text,
  active          boolean NOT NULL DEFAULT true,
  last_synced_at  timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS idx_sync_runs (
  id              serial PRIMARY KEY,
  provider        text NOT NULL,
  started_at      timestamptz NOT NULL DEFAULT now(),
  completed_at    timestamptz,
  status          text NOT NULL DEFAULT 'running',
  records_synced  integer DEFAULT 0,
  records_failed  integer DEFAULT 0,
  error_message   text
);

CREATE TABLE IF NOT EXISTS mls_listings (
  id                  serial PRIMARY KEY,
  provider            text NOT NULL DEFAULT 'manual',
  external_id         text,
  didpid              text,
  status              text NOT NULL DEFAULT 'active',
  title               text,
  address             text,
  city                text,
  state               text,
  zip                 text,
  price               numeric,
  bedrooms            integer,
  bathrooms           numeric,
  square_feet         integer,
  lot_size            text,
  year_built          integer,
  property_type       text,
  description         text,
  photos              text[],
  highlights          text[],
  latitude            numeric,
  longitude           numeric,
  agent_id            integer REFERENCES brokerage_agents(id) ON DELETE SET NULL,
  raw_payload         jsonb,
  normalized_payload  jsonb,
  last_synced_at      timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mls_listing_intakes (
  id                          serial PRIMARY KEY,
  user_id                     integer REFERENCES profiles(id) ON DELETE SET NULL,
  status                      text NOT NULL DEFAULT 'draft',
  street_number               text,
  street_name                 text,
  street_suffix               text,
  unit_number                 text,
  city                        text,
  state                       text,
  postal_code                 text,
  county                      text,
  in_corporate_limits         text,
  occupancy_status            text,
  proposed_list_date          date,
  desired_active_date         date,
  is_new_construction         boolean,
  new_construction_notes      text,
  property_type               text,
  property_subtype            text,
  attached_yn                 boolean,
  year_built                  integer,
  exterior_material           text,
  bedrooms_total              integer,
  bathrooms_full              integer,
  bathrooms_half              integer,
  basement_yn                 boolean,
  basement_description        text,
  living_area                 integer,
  lot_size_dimensions         text,
  lot_size_acres              numeric,
  garage_yn                   boolean,
  garage_type                 text,
  garage_spaces               integer,
  additional_parking_yn       boolean,
  additional_parking_spaces   integer,
  elementary_school_district  text,
  middle_school_district      text,
  high_school_district        text,
  tax_year                    integer,
  tax_annual_amount           numeric,
  hoa_yn                      boolean,
  hoa_fee                     numeric,
  hoa_fee_frequency           text,
  allow_internet_display      boolean,
  allow_address_display       boolean,
  allow_third_party_photos    boolean,
  primary_photo_url           text,
  photo_urls                  jsonb DEFAULT '[]',
  has_virtual_staging         boolean,
  list_price                  numeric,
  seller_concessions          text,
  inclusions                  text,
  exclusions                  text,
  showing_instructions        text,
  preferred_closing_date      date,
  admin_notes                 text,
  assigned_agent_name         text,
  assigned_agent_email        text,
  listing_type                text DEFAULT 'fsbo',
  reviewed_by_admin_id        integer REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at                 timestamp,
  rejected_reason             text,
  linked_property_id          integer REFERENCES properties(id) ON DELETE SET NULL,
  source                      text DEFAULT 'manual',
  mls_number                  text,
  mls_source                  text,
  mls_synced_at               timestamp,
  listing_description         text,
  submitted_at                timestamp,
  created_at                  timestamp DEFAULT now(),
  updated_at                  timestamp DEFAULT now()
);

-- ============================================================
-- ARTICLES
-- ============================================================

CREATE TABLE IF NOT EXISTS articles (
  id          serial PRIMARY KEY,
  title       text NOT NULL,
  excerpt     text,
  content     text NOT NULL,
  image_url   text,
  published   boolean NOT NULL DEFAULT false,
  category    text DEFAULT 'general',
  author_id   integer REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  timestamp DEFAULT now(),
  updated_at  timestamp DEFAULT now()
);

-- ============================================================
-- DEVICE PUSH TOKENS
-- ============================================================

CREATE TABLE IF NOT EXISTS device_push_tokens (
  id          bigserial PRIMARY KEY,
  user_id     integer NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token       text NOT NULL,
  platform    text DEFAULT 'expo',
  created_at  timestamp DEFAULT now(),
  updated_at  timestamp DEFAULT now()
);

-- ============================================================
-- PHOTO CHECK UPLOADS (temp storage for photo analysis)
-- ============================================================

CREATE TABLE IF NOT EXISTS photo_check_uploads (
  id          bigserial PRIMARY KEY,
  data_url    text NOT NULL,
  created_at  timestamp NOT NULL DEFAULT now()
);

-- ============================================================
-- UPLOADS (generic file storage)
-- ============================================================

CREATE TABLE IF NOT EXISTS uploads (
  id          bigserial PRIMARY KEY,
  token       text NOT NULL DEFAULT md5(random()::text || clock_timestamp()::text),
  mime_type   text NOT NULL,
  data        bytea NOT NULL,
  created_at  timestamp NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES (performance)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_zip ON properties(zip);
CREATE INDEX IF NOT EXISTS idx_properties_parcel_number ON properties(parcel_number);
CREATE INDEX IF NOT EXISTS idx_didpids_property_id ON didpids(property_id);
CREATE INDEX IF NOT EXISTS idx_didpids_code ON didpids(didpid_code);
CREATE INDEX IF NOT EXISTS idx_didpid_claims_user_id ON didpid_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_didpid_claims_didpid_id ON didpid_claims(didpid_id);
CREATE INDEX IF NOT EXISTS idx_swipe_checks_property_id ON swipe_checks(property_id);
CREATE INDEX IF NOT EXISTS idx_swipe_checks_user_id ON swipe_checks(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_swipe_checks_category ON swipe_checks(category);
CREATE INDEX IF NOT EXISTS idx_swipecheck_questions_category_mode ON swipecheck_questions(category, mode);
CREATE INDEX IF NOT EXISTS idx_swipecheck_photos_swipecheck_id ON swipecheck_photos(swipecheck_id);
CREATE INDEX IF NOT EXISTS idx_contractors_zip ON contractors(zip);
CREATE INDEX IF NOT EXISTS idx_contractors_trade ON contractors(trade);
CREATE INDEX IF NOT EXISTS idx_service_requests_homeowner ON service_requests(homeowner_user_id);
CREATE INDEX IF NOT EXISTS idx_mls_listings_zip ON mls_listings(zip);
CREATE INDEX IF NOT EXISTS idx_mls_listings_status ON mls_listings(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_property_id ON maintenance_tasks(property_id);
CREATE INDEX IF NOT EXISTS idx_work_records_property_id ON work_records(property_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_auth_uid ON profiles(auth_uid);

-- ============================================================
-- ROW LEVEL SECURITY (basic setup - expand as needed)
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipe_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipecheck_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_push_tokens ENABLE ROW LEVEL SECURITY;

-- Users can read/update their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = auth_uid);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = auth_uid);

-- Users can view their own properties
CREATE POLICY "Users can view own properties"
  ON properties FOR SELECT
  USING (
    user_id IN (SELECT id FROM profiles WHERE auth_uid = auth.uid())
  );

-- Users can view their own swipe checks
CREATE POLICY "Users can view own swipe checks"
  ON swipe_checks FOR SELECT
  USING (
    created_by_user_id IN (SELECT id FROM profiles WHERE auth_uid = auth.uid())
  );

-- ============================================================
-- HELPER: get current user's profile id
-- ============================================================

CREATE OR REPLACE FUNCTION get_profile_id()
RETURNS integer AS $$
  SELECT id FROM profiles WHERE auth_uid = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- TRIGGER: auto-create profile row on new Supabase auth user
-- ============================================================
-- When Supabase Auth creates a new user (sign-up, OAuth, invite, etc.)
-- this trigger immediately inserts a matching profiles row so that
-- all app tables with user_id → profiles(id) FK work out of the box.

CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (auth_uid, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (auth_uid) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_auth_user();

