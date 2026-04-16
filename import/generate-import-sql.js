/**
 * generate-import-sql.js
 *
 * Reads CSVs from ~/Downloads and generates a single SQL file
 * that can be pasted into the Supabase SQL editor.
 *
 * Run with: node import/generate-import-sql.js
 * Output:   import/import-data.sql
 */

const fs   = require("fs");
const path = require("path");

const DOWNLOADS = path.join(process.env.USERPROFILE || process.env.HOME, "Downloads");
const OUT_FILE  = path.join(__dirname, "import-data.sql");

// ── CSV PARSER ────────────────────────────────────────────────────────────────
function parseCSV(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const lines = raw.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = splitCSVLine(lines[0]).map(h => h.replace(/^"|"$/g, "").trim());

  return lines.slice(1).map(line => {
    const vals = splitCSVLine(line);
    const row = {};
    headers.forEach((h, i) => {
      let v = (vals[i] || "").replace(/^"|"$/g, "").trim();
      row[h] = v === "" ? null : v;
    });
    return row;
  }).filter(r => Object.values(r).some(v => v !== null));
}

function splitCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (c === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += c;
    }
  }
  result.push(current);
  return result;
}

// ── SQL HELPERS ───────────────────────────────────────────────────────────────
function esc(val) {
  if (val === null || val === undefined || val === "") return "NULL";
  const s = String(val);
  return "'" + s.replace(/'/g, "''") + "'";
}

function escJson(val) {
  if (!val) return "NULL";
  // Already a JSON string — just escape quotes
  return "'" + String(val).replace(/'/g, "''") + "'::jsonb";
}

function escNum(val) {
  if (val === null || val === undefined || val === "") return "NULL";
  const n = Number(val);
  return isNaN(n) ? "NULL" : String(n);
}

function escBool(val) {
  if (val === null || val === undefined || val === "") return "NULL";
  return (val === "true" || val === "1" || val === "t") ? "TRUE" : "FALSE";
}

function escTs(val) {
  if (!val) return "NULL";
  return esc(val);
}

const lines = [
  "-- ============================================================",
  "-- Swipe Home MVP — Data Import",
  "-- Generated: " + new Date().toISOString(),
  "-- Run this in the Supabase SQL editor",
  "-- ============================================================",
  "",
  "-- Disable triggers during import to skip auth checks",
  "SET session_replication_role = replica;",
  "",
];

// ── 1. PROFILES (from auth_users) ─────────────────────────────────────────────
console.log("Processing auth_users → profiles...");
const authUsers = parseCSV(path.join(DOWNLOADS, "auth_users.csv"));

lines.push("-- ── PROFILES ────────────────────────────────────────────────");
lines.push("INSERT INTO profiles (id, name, email, role, created_at)");
lines.push("VALUES");

// Deduplicate by email — keep the row with the lowest id
const emailSeen = new Map();
for (const u of authUsers.filter(u => u.id && u.email)) {
  const emailKey = u.email.toLowerCase().trim();
  const existing = emailSeen.get(emailKey);
  if (!existing || parseInt(u.id) < parseInt(existing.id)) {
    emailSeen.set(emailKey, u);
  }
}
const dedupedUsers = Array.from(emailSeen.values()).sort((a, b) => parseInt(a.id) - parseInt(b.id));
console.log(`  Deduplicated ${authUsers.filter(u=>u.id&&u.email).length} users → ${dedupedUsers.length} unique emails`);

const profileRows = dedupedUsers
  .map(u =>
    `  (${escNum(u.id)}, ${esc(u.name || u.email.split("@")[0])}, ${esc(u.email.toLowerCase().trim())}, ${esc(u.role || "user")}, ${escTs(u.emailVerified || "2025-12-01T00:00:00Z")})`
  );

lines.push(profileRows.join(",\n"));
lines.push("ON CONFLICT (id) DO UPDATE SET");
lines.push("  name = EXCLUDED.name,");
lines.push("  email = EXCLUDED.email,");
lines.push("  role = EXCLUDED.role;");
lines.push("");

// Advance sequence
const maxUserId = Math.max(...authUsers.map(u => parseInt(u.id) || 0));
lines.push(`SELECT setval('profiles_id_seq', GREATEST(nextval('profiles_id_seq') - 1, ${maxUserId + 10}));`);
lines.push("");

// ── 2. CONTRACTORS ────────────────────────────────────────────────────────────
console.log("Processing contractors...");
const contractors = parseCSV(path.join(DOWNLOADS, "contractors.csv"));

lines.push("-- ── CONTRACTORS ─────────────────────────────────────────────");
lines.push("INSERT INTO contractors (id, name, trade, zip, phone, email, address, rating, is_insured, website, profile_status, business_name, contact_name, years_in_business, license_number, bio, created_at, updated_at)");
lines.push("VALUES");

const contractorRows = contractors
  .filter(c => c.id && c.name)
  .map(c =>
    `  (${escNum(c.id)}, ${esc(c.name)}, ${esc(c.trade)}, ${esc(c.zip)}, ${esc(c.phone)}, ${esc(c.email)}, ${esc(c.address)}, ${escNum(c.rating)}, ${escBool(c.is_insured)}, ${esc(c.website)}, ${esc(c.profile_status || "draft")}, ${esc(c.business_name)}, ${esc(c.contact_name)}, ${escNum(c.years_in_business)}, ${esc(c.license_number)}, ${esc(c.bio)}, ${escTs(c.created_at)}, ${escTs(c.updated_at)})`
  );

lines.push(contractorRows.join(",\n"));
lines.push("ON CONFLICT (id) DO NOTHING;");
lines.push("");

const maxContractorId = Math.max(...contractors.map(c => parseInt(c.id) || 0));
lines.push(`SELECT setval('contractors_id_seq', GREATEST(nextval('contractors_id_seq') - 1, ${maxContractorId + 10}));`);
lines.push("");

// ── 3. CONTRACTOR LEADS ───────────────────────────────────────────────────────
console.log("Processing contractor_leads...");
const leads = parseCSV(path.join(DOWNLOADS, "contractor_leads.csv"));

lines.push("-- ── CONTRACTOR LEADS ────────────────────────────────────────");
lines.push("INSERT INTO contractor_leads (id, name, company, email, phone, trade, zip, notes, created_at)");
lines.push("VALUES");

const leadRows = leads
  .filter(l => l.id && l.email)
  .map(l =>
    `  (${escNum(l.id)}, ${esc(l.name)}, ${esc(l.company)}, ${esc(l.email)}, ${esc(l.phone)}, ${esc(l.trade)}, ${esc(l.zip)}, ${esc(l.notes)}, ${escTs(l.created_at)})`
  );

if (leadRows.length) {
  lines.push(leadRows.join(",\n"));
  lines.push("ON CONFLICT (id) DO NOTHING;");
}
lines.push("");

const maxLeadId = Math.max(...leads.map(l => parseInt(l.id) || 0), 0);
if (maxLeadId > 0) {
  lines.push(`SELECT setval('contractor_leads_id_seq', GREATEST(nextval('contractor_leads_id_seq') - 1, ${maxLeadId + 10}));`);
}
lines.push("");

// ── 4. PROPERTIES (user-owned only) ──────────────────────────────────────────
console.log("Processing properties (user-owned only)...");
const allProperties = parseCSV(path.join(DOWNLOADS, "properties.csv"));
const userProperties = allProperties.filter(p => p.user_id && p.user_id.trim && p.user_id.trim() !== "");

lines.push("-- ── PROPERTIES (user-owned) ─────────────────────────────────");
lines.push("INSERT INTO properties (id, user_id, address, unit, city, state, zip, bedrooms, bathrooms, square_feet, year_built, latitude, longitude, created_at)");
lines.push("VALUES");

const propRows = userProperties
  .filter(p => p.id && p.address)
  .map(p =>
    `  (${escNum(p.id)}, ${escNum(p.user_id)}, ${esc(p.address)}, ${esc(p.unit)}, ${esc(p.city)}, ${esc(p.state)}, ${esc(p.zip)}, ${escNum(p.bedrooms)}, ${escNum(p.bathrooms)}, ${escNum(p.square_feet)}, ${escNum(p.year_built)}, ${escNum(p.latitude)}, ${escNum(p.longitude)}, ${escTs(p.created_at)})`
  );

lines.push(propRows.join(",\n"));
lines.push("ON CONFLICT (id) DO NOTHING;");
lines.push("");

const maxPropId = Math.max(...userProperties.map(p => parseInt(p.id) || 0));
lines.push(`SELECT setval('properties_id_seq', GREATEST(nextval('properties_id_seq') - 1, ${maxPropId + 10}));`);
lines.push("");

// ── 5. DIDPIDs (for user-owned properties only) ───────────────────────────────
console.log("Processing didpids (user-owned only)...");
const allDidpids = parseCSV(path.join(DOWNLOADS, "didpids.csv"));
const userPropIds = new Set(userProperties.map(p => p.id));
const userDidpids = allDidpids.filter(d => userPropIds.has(d.property_id));

lines.push(`-- ── DIDPIDs (user-owned, ${userDidpids.length} rows) ──────────────────────────`);
lines.push("INSERT INTO didpids (id, property_id, didpid_code, created_at)");
lines.push("VALUES");

const didpidRows = userDidpids
  .filter(d => d.id && d.property_id && d.didpid_code)
  .map(d =>
    `  (${escNum(d.id)}, ${escNum(d.property_id)}, ${esc(d.didpid_code)}, ${escTs(d.created_at)})`
  );

if (didpidRows.length) {
  lines.push(didpidRows.join(",\n"));
  lines.push("ON CONFLICT (id) DO NOTHING;");
}
lines.push("");

const maxDidpidId = Math.max(...userDidpids.map(d => parseInt(d.id) || 0), 0);
if (maxDidpidId > 0) {
  lines.push(`SELECT setval('didpids_id_seq', GREATEST(nextval('didpids_id_seq') - 1, ${maxDidpidId + 10}));`);
}
lines.push("");

// ── 6. SWIPECHECK QUESTIONS ───────────────────────────────────────────────────
console.log("Processing swipecheck_questions...");
const questions = parseCSV(path.join(DOWNLOADS, "swipecheck_questions.csv"));

lines.push("-- ── SWIPECHECK QUESTIONS ────────────────────────────────────");
lines.push("INSERT INTO swipecheck_questions (id, category, mode, order_index, text, options_json)");
lines.push("VALUES");

const questionRows = questions
  .filter(q => q.id && q.text)
  .map(q => {
    // options_json may be a comma-separated string or JSON array
    let opts = q.options_json;
    if (opts && !opts.startsWith("[")) {
      // it's comma-separated options
      const arr = opts.split(",").map(o => o.trim()).filter(Boolean);
      opts = JSON.stringify(arr);
    }
    return `  (${escNum(q.id)}, ${esc(q.category)}, ${esc(q.mode || "lite")}, ${escNum(q.order_index)}, ${esc(q.text)}, ${opts ? `'${opts.replace(/'/g, "''")}'::jsonb` : "NULL"})`;
  });

lines.push(questionRows.join(",\n"));
lines.push("ON CONFLICT (id) DO NOTHING;");
lines.push("");

const maxQId = Math.max(...questions.map(q => parseInt(q.id) || 0));
lines.push(`SELECT setval('swipecheck_questions_id_seq', GREATEST(nextval('swipecheck_questions_id_seq') - 1, ${maxQId + 10}));`);
lines.push("");

// ── 7. SWIPE CHECKS ───────────────────────────────────────────────────────────
console.log("Processing swipe_checks...");
const checks = parseCSV(path.join(DOWNLOADS, "swipe_checks.csv"));

lines.push("-- ── SWIPE CHECKS ────────────────────────────────────────────");
lines.push("INSERT INTO swipe_checks (id, property_id, category, mode, answers_json, condition, condition_label, findings_json, summary_text, key_findings_json, gentle_guidance_json, recommended_contractor_type, suggested_timeframe, created_by_user_id, created_at, updated_at)");
lines.push("VALUES");

// Converts a value to a valid jsonb SQL literal.
// Handles: already-valid JSON, comma-separated plain text, null.
function toJsonb(val) {
  if (!val) return "NULL";
  const s = String(val).trim();
  // Already valid JSON (array or object)
  try { JSON.parse(s); return `'${s.replace(/'/g, "''")}'::jsonb`; } catch {}
  // Plain comma-separated string → JSON array
  const arr = s.split(",").map(i => i.trim()).filter(Boolean);
  return `'${JSON.stringify(arr).replace(/'/g, "''")}'::jsonb`;
}

const checkRows = checks
  .filter(c => c.id && c.category)
  .map(c => {
    const answersJson = c.answers_json && c.answers_json !== "[object Object]"
      ? toJsonb(c.answers_json)
      : "'{}'::jsonb";

    return `  (${escNum(c.id)}, ${escNum(c.property_id)}, ${esc(c.category)}, ${esc(c.mode || "lite")}, ${answersJson}, ${esc(c.condition)}, ${esc(c.condition_label)}, ${toJsonb(c.findings_json)}, ${esc(c.summary_text)}, ${toJsonb(c.key_findings_json)}, ${toJsonb(c.gentle_guidance_json)}, ${esc(c.recommended_contractor_type)}, ${esc(c.suggested_timeframe)}, ${escNum(c.created_by_user_id)}, ${escTs(c.created_at)}, ${escTs(c.updated_at)})`;
  });

lines.push(checkRows.join(",\n"));
lines.push("ON CONFLICT (id) DO NOTHING;");
lines.push("");

const maxCheckId = Math.max(...checks.map(c => parseInt(c.id) || 0));
lines.push(`SELECT setval('swipe_checks_id_seq', GREATEST(nextval('swipe_checks_id_seq') - 1, ${maxCheckId + 10}));`);
lines.push("");

// ── 8. RE-ENABLE TRIGGERS ────────────────────────────────────────────────────
lines.push("-- Re-enable triggers");
lines.push("SET session_replication_role = DEFAULT;");
lines.push("");
lines.push("-- Verify row counts");
lines.push("SELECT 'profiles' as table_name, COUNT(*) FROM profiles");
lines.push("UNION ALL SELECT 'contractors', COUNT(*) FROM contractors");
lines.push("UNION ALL SELECT 'properties', COUNT(*) FROM properties WHERE user_id IS NOT NULL");
lines.push("UNION ALL SELECT 'didpids', COUNT(*) FROM didpids");
lines.push("UNION ALL SELECT 'swipecheck_questions', COUNT(*) FROM swipecheck_questions");
lines.push("UNION ALL SELECT 'swipe_checks', COUNT(*) FROM swipe_checks;");

// ── WRITE FILE ────────────────────────────────────────────────────────────────
fs.writeFileSync(OUT_FILE, lines.join("\n"), "utf8");
console.log("\n✅ Done! SQL written to:", OUT_FILE);
console.log(`   ${authUsers.filter(u => u.id).length} users (profiles)`);
console.log(`   ${contractors.length} contractors`);
console.log(`   ${leads.length} contractor leads`);
console.log(`   ${userProperties.length} user-owned properties`);
console.log(`   ${userDidpids.length} DIDPIDs`);
console.log(`   ${questions.length} SwipeCheck questions`);
console.log(`   ${checks.length} swipe checks`);
console.log("\nNext: paste import/import-data.sql into the Supabase SQL editor.");
