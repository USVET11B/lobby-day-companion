export interface Legislator {
  id: string;
  name: string;
  chamber: "Senate" | "Assembly";
  district: number;
  party: "D" | "R";
  email: string | null;
  phone: string | null;
  capitol_office: string | null;
  district_office: string | null;
  is_veteran: boolean;
  veteran_branch: string | null;
  leadership_position: string | null;
  committees?: CommitteeAssignment[];
}

export interface CommitteeAssignment {
  committee_name: string;
  chamber: string;
  role: string;
}

export interface Committee {
  name: string;
  chamber: "Senate" | "Assembly";
  type: "Standing" | "Budget" | "Subcommittee";
  members: CommitteeMember[];
  consultant?: {
    name: string;
    email: string;
  };
}

export interface CommitteeMember {
  name: string;
  role: "Chair" | "Vice Chair" | "Member";
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
  description: string;
  talking_points: string[];
  key_bills: string[];
}

export interface LegislatorRaw {
  name: string;
  first_name: string;
  last_name: string;
  party: string;
  role: string;
  chamber: string;
  district: number;
  email: string;
  phone: string;
  capitol_phone: string;
  district_phone: string;
  committees: {
    committee_name: string;
    chamber: string;
    role: string;
  }[];
}

export interface LegislatorDB {
  id: string;
  name: string;
  chamber: string;
  district: number;
  party: string;
  email: string | null;
  phone: string | null;
  capitol_office: string | null;
  district_office: string | null;
  is_veteran: boolean;
  veteran_branch: string | null;
  leadership_position: string | null;
}

export interface CommitteesData {
  metadata: {
    source: string;
    generated_at: string;
    total_committees: number;
    note: string;
  };
  committees: Committee[];
}
