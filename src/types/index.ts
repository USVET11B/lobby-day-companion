export interface Legislator {
  id: string;
  name: string;
  first_name: string | null;
  last_name: string | null;
  chamber: "Senate" | "Assembly";
  district: number;
  party: "D" | "R";
  capitol_room: string | null;
  capitol_building: string | null;
  capitol_phone: string | null;
  capitol_email: string | null;
  district_office: {
    street: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    phone: string | null;
  };
  scheduling_portal_url: string | null;
  scheduler_emails: string[];
  veteran_relevance_score: number | null;
  veteran_relevance_notes: string | null;
  has_veteran_legislation: boolean;
  has_military_base: boolean;
  has_va_facility: boolean;
  bio_notes: string | null;
  committees: CommitteeAssignment[];
}

export interface CommitteeAssignment {
  committee: string;
  chamber: string;
  role: string;
}

export interface Committee {
  id: string;
  name: string;
  chamber: "Senate" | "Assembly";
  committee_type: string | null;
  phone: string | null;
  secretary_name: string | null;
  chair_legislator_id: string | null;
  vice_chair_legislator_id: string | null;
}

export interface CommitteesData {
  committees: Committee[];
}

export interface VisitChecklist {
  legislator_id: string;
  visited: boolean;
  spoke_with_staff: boolean;
  left_materials: boolean;
  notes: string;
}

export interface ClientOrg {
  key: string;
  name: string;
  display_name: string;
}

export interface LobbySession {
  session_token: string;
  participant_name: string;
  organization: string | null;
  lobby_date: string;
}

export interface HearingRoom {
  id: string;
  room: string;
  chamber: "Assembly" | "Senate";
  building: string;
  building_short: string;
  floor: number;
  description: string;
}

export type Quadrant = "NW" | "NE" | "SW" | "SE" | "center" | "unknown";
