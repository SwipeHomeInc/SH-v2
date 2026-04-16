-- ============================================================
-- SWIPE HOME - CLEANUP SCRIPT
-- Run this BEFORE supabase_schema.sql to drop old tables
-- that have incompatible column types from the previous CA schema.
-- Safe to run — this is the new build DB, not production CA data.
-- ============================================================

-- Drop in reverse dependency order so FK constraints don't block us

DROP TABLE IF EXISTS uploads CASCADE;
DROP TABLE IF EXISTS photo_check_uploads CASCADE;
DROP TABLE IF EXISTS device_push_tokens CASCADE;
DROP TABLE IF EXISTS articles CASCADE;
DROP TABLE IF EXISTS mls_listing_intakes CASCADE;
DROP TABLE IF EXISTS mls_listings CASCADE;
DROP TABLE IF EXISTS idx_sync_runs CASCADE;
DROP TABLE IF EXISTS idx_feed_sources CASCADE;
DROP TABLE IF EXISTS brokerage_waitlist CASCADE;
DROP TABLE IF EXISTS brokerage_leads CASCADE;
DROP TABLE IF EXISTS brokerage_agents CASCADE;
DROP TABLE IF EXISTS imaging_jobs CASCADE;
DROP TABLE IF EXISTS project_photos CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS maintenance_tasks CASCADE;
DROP TABLE IF EXISTS work_record_ratings CASCADE;
DROP TABLE IF EXISTS work_record_photos CASCADE;
DROP TABLE IF EXISTS work_records CASCADE;
DROP TABLE IF EXISTS job_photos CASCADE;
DROP TABLE IF EXISTS job_checklist_items CASCADE;
DROP TABLE IF EXISTS job_checklist_templates CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_conversations CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS service_requests CASCADE;
DROP TABLE IF EXISTS contractor_47point_decisions CASCADE;
DROP TABLE IF EXISTS contractor_47point_checks CASCADE;
DROP TABLE IF EXISTS contractor_zip_claims CASCADE;
DROP TABLE IF EXISTS contractor_subscription_zips CASCADE;
DROP TABLE IF EXISTS contractor_subscriptions CASCADE;
DROP TABLE IF EXISTS contractor_verifications CASCADE;
DROP TABLE IF EXISTS contractor_service_zips CASCADE;
DROP TABLE IF EXISTS contractor_photos CASCADE;
DROP TABLE IF EXISTS contractor_leads CASCADE;
DROP TABLE IF EXISTS contractors CASCADE;
DROP TABLE IF EXISTS swipecheck_photos CASCADE;
DROP TABLE IF EXISTS swipe_checks CASCADE;
DROP TABLE IF EXISTS swipecheck_runs CASCADE;
DROP TABLE IF EXISTS swipecheck_questions CASCADE;
DROP TABLE IF EXISTS swipecheck_categories CASCADE;
DROP TABLE IF EXISTS property_documents CASCADE;
DROP TABLE IF EXISTS access_requests CASCADE;
DROP TABLE IF EXISTS property_transfer_invites CASCADE;
DROP TABLE IF EXISTS property_sharing_settings CASCADE;
DROP TABLE IF EXISTS property_memberships CASCADE;
DROP TABLE IF EXISTS didpid_claims CASCADE;
DROP TABLE IF EXISTS didpids CASCADE;
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop old CA auth tables if they exist from previous schema
DROP TABLE IF EXISTS auth_verification_token CASCADE;
DROP TABLE IF EXISTS auth_sessions CASCADE;
DROP TABLE IF EXISTS auth_accounts CASCADE;
DROP TABLE IF EXISTS auth_users CASCADE;

-- Drop functions and triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_auth_user();
DROP FUNCTION IF EXISTS get_profile_id();

-- (policies are dropped automatically by CASCADE when their tables are dropped)
