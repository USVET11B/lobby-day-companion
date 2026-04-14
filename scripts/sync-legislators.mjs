import { createClient } from "@supabase/supabase-js";
import fs from "node:fs/promises";
import path from "node:path";

const SUPABASE_URL = "https://uwmbqudhfqvfgqrpmpxj.supabase.co";
const SUPABASE_KEY = "sb_publishable_CW09lo3--CgF8xsfagy0DQ_RN80LEAf";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

const OUT = path.resolve("src/data");

async function fetchAllLegislators() {
  const { data, error } = await supabase
    .from("ca_legislators")
    .select(
      "id, first_name, last_name, full_name, chamber, party, district, capitol_room, capitol_phone, capitol_email, district_office_street, district_office_city, district_office_state, district_office_zip, district_office_phone, scheduling_portal_url, scheduler_emails, veteran_relevance_score, veteran_relevance_notes, has_veteran_legislation, has_military_base, has_va_facility, bio_notes, updated_at"
    )
    .order("chamber")
    .order("district");
  if (error) throw error;
  return data;
}

async function fetchCommittees() {
  const { data, error } = await supabase
    .from("ca_committees")
    .select(
      "id, name, chamber, committee_type, phone, secretary_name, chair_legislator_id, vice_chair_legislator_id"
    )
    .order("chamber")
    .order("name");
  if (error) throw error;
  return data;
}

async function fetchMemberships() {
  const { data, error } = await supabase
    .from("ca_committee_memberships")
    .select("committee_id, legislator_id, role");
  if (error) throw error;
  return data;
}

function parseCapitolRoom(raw) {
  if (!raw) return { room: null, building: null };
  const match = raw.match(/^([0-9A-Za-z.-]+)\s*(?:\((.+)\))?$/);
  if (!match) return { room: raw, building: null };
  return { room: match[1], building: match[2] ?? null };
}

const legislators = await fetchAllLegislators();
const committees = await fetchCommittees();
const memberships = await fetchMemberships();

const membershipsByLeg = new Map();
for (const m of memberships) {
  if (!m.legislator_id) continue;
  if (!membershipsByLeg.has(m.legislator_id)) membershipsByLeg.set(m.legislator_id, []);
  membershipsByLeg.get(m.legislator_id).push(m);
}

const committeesById = new Map(committees.map((c) => [c.id, c]));

const enriched = legislators.map((l) => {
  const { room, building } = parseCapitolRoom(l.capitol_room);
  const legMemberships = (membershipsByLeg.get(l.id) || [])
    .map((m) => {
      const c = committeesById.get(m.committee_id);
      if (!c) return null;
      return { committee: c.name, chamber: c.chamber, role: m.role || "Member" };
    })
    .filter(Boolean);
  return {
    id: l.id,
    name: l.full_name || `${l.first_name ?? ""} ${l.last_name ?? ""}`.trim(),
    first_name: l.first_name,
    last_name: l.last_name,
    chamber: l.chamber,
    district: l.district,
    party: l.party,
    capitol_room: room,
    capitol_building: building,
    capitol_phone: l.capitol_phone,
    capitol_email: l.capitol_email,
    district_office: {
      street: l.district_office_street,
      city: l.district_office_city,
      state: l.district_office_state,
      zip: l.district_office_zip,
      phone: l.district_office_phone,
    },
    scheduling_portal_url: l.scheduling_portal_url,
    scheduler_emails: l.scheduler_emails || [],
    veteran_relevance_score: l.veteran_relevance_score,
    veteran_relevance_notes: l.veteran_relevance_notes,
    has_veteran_legislation: !!l.has_veteran_legislation,
    has_military_base: !!l.has_military_base,
    has_va_facility: !!l.has_va_facility,
    bio_notes: l.bio_notes,
    committees: legMemberships,
  };
});

await fs.writeFile(
  path.join(OUT, "legislators.json"),
  JSON.stringify(enriched, null, 2)
);

const committeesOut = committees.map((c) => ({
  id: c.id,
  name: c.name,
  chamber: c.chamber,
  committee_type: c.committee_type,
  phone: c.phone,
  secretary_name: c.secretary_name,
  chair_legislator_id: c.chair_legislator_id,
  vice_chair_legislator_id: c.vice_chair_legislator_id,
}));

await fs.writeFile(
  path.join(OUT, "committees.json"),
  JSON.stringify({ committees: committeesOut }, null, 2)
);

console.log(
  `✓ Wrote ${enriched.length} legislators and ${committeesOut.length} committees`
);
console.log(
  `✓ Last legislator update: ${enriched.map((l) => l.updated_at ?? "").filter(Boolean).sort().pop() || "unknown"}`
);
