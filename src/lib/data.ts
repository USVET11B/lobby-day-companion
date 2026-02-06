import type {
  Legislator,
  LegislatorRaw,
  LegislatorDB,
  Committee,
  CommitteesData,
  ClientOrg,
  CommitteeAssignment,
} from "@/types";

import legislatorsRaw from "@/data/legislators.json";
import legislatorsDB from "@/data/legislators-db.json";
import committeesData from "@/data/committees.json";

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/,\s*m\.d\.$/i, "")
    .replace(/\s+/g, " ")
    .replace(/[^a-z\s-]/g, "")
    .trim();
}

function findMatchingRaw(
  dbLeg: LegislatorDB,
  rawList: LegislatorRaw[]
): LegislatorRaw | undefined {
  const dbNorm = normalizeName(dbLeg.name);
  return rawList.find((raw) => {
    const rawNorm = normalizeName(raw.name);
    if (rawNorm === dbNorm) return true;
    if (raw.chamber === dbLeg.chamber && raw.district === dbLeg.district)
      return true;
    if (dbNorm.includes(rawNorm) || rawNorm.includes(dbNorm)) return true;
    return false;
  });
}

export function getLegislators(): Legislator[] {
  const raw = legislatorsRaw as LegislatorRaw[];
  const db = legislatorsDB as LegislatorDB[];

  return db
    .map((dbLeg): Legislator => {
      const matchRaw = findMatchingRaw(dbLeg, raw);
      const committees: CommitteeAssignment[] = matchRaw?.committees || [];

      return {
        id: dbLeg.id,
        name: dbLeg.name,
        chamber: dbLeg.chamber as "Senate" | "Assembly",
        district: dbLeg.district,
        party: dbLeg.party as "D" | "R",
        email: matchRaw?.email || dbLeg.email,
        phone: matchRaw?.phone || dbLeg.phone,
        capitol_office:
          dbLeg.capitol_office || matchRaw?.capitol_phone || null,
        district_office:
          dbLeg.district_office || matchRaw?.district_phone || null,
        is_veteran: dbLeg.is_veteran,
        veteran_branch: dbLeg.veteran_branch,
        leadership_position: dbLeg.leadership_position,
        committees,
      };
    })
    .sort((a, b) => {
      if (a.chamber !== b.chamber) return a.chamber === "Senate" ? -1 : 1;
      return a.district - b.district;
    });
}

export function getCommittees(): Committee[] {
  const data = committeesData as CommitteesData;
  return data.committees;
}

export function getClientOrgs(): ClientOrg[] {
  return [
    {
      key: "AMVETS",
      name: "AMVETS",
      display_name: "AMVETS Department of California",
      description:
        "AMVETS (American Veterans) is a veteran service organization open to anyone who has honorably served or is currently serving in the U.S. Armed Forces. The California Department focuses on veteran employment, healthcare access, and housing stability.",
      talking_points: [
        "Veterans face a 33% higher unemployment rate in their first year after service compared to the general population",
        "Expand state-funded veteran employment training programs and job placement services",
        "Increase funding for transitional housing and rapid rehousing programs for homeless veterans",
        "Support legislation that improves access to mental health and substance abuse treatment for veterans",
        "Strengthen the Disabled Veteran Business Enterprise (DVBE) program to increase veteran entrepreneurship",
      ],
      key_bills: [
        "Veteran Employment Tax Credit expansion",
        "Homeless Veterans Housing Assistance Act",
        "CalVet Healthcare Access Improvement",
      ],
    },
    {
      key: "AL",
      name: "American Legion",
      display_name: "American Legion Department of California",
      description:
        "The American Legion is the nation's largest wartime veterans service organization, with over 100,000 members in California. The Department advocates for veteran benefits, education, and a strong national defense at the state level.",
      talking_points: [
        "Over 1.6 million veterans call California home - the largest veteran population in the nation",
        "Support full funding of the CalVet budget to maintain and improve state veteran homes",
        "Advocate for expanded education benefits including fee waivers for veteran dependents",
        "Ensure the California National Guard has adequate funding and resources",
        "Protect and expand state veteran cemetery operations",
      ],
      key_bills: [
        "CalVet Budget Full Funding Act",
        "Veteran Dependent Education Fee Waiver Expansion",
        "State Veterans Cemetery Improvement Act",
      ],
    },
    {
      key: "CSCVC",
      name: "CSCVC",
      display_name: "California State Commanders Veterans Council",
      description:
        "CSCVC serves as the umbrella coordinating body for major veteran service organizations in California. It facilitates coalition coordination and unified advocacy on veteran legislative priorities.",
      talking_points: [
        "CSCVC represents the unified voice of California's major veteran organizations",
        "Coordinate legislative priorities across all VSOs for maximum advocacy impact",
        "Advocate for adequate state funding for veteran programs and services",
        "Support CalVet's mission to serve California's 1.6 million veterans",
        "Ensure veterans have a seat at the table in all policy discussions affecting their community",
      ],
      key_bills: [
        "Veteran Services Coordination Act",
        "CalVet Oversight and Accountability Enhancement",
        "Interagency Veteran Services Task Force Establishment",
      ],
    },
    {
      key: "MOAA",
      name: "MOAA",
      display_name: "Military Officers Association of America - CA Council",
      description:
        "MOAA's California Council advocates for military officers on issues including retirement benefits, healthcare, and survivor benefits. The organization focuses on officer-specific issues while supporting all veteran causes.",
      talking_points: [
        "Protect state tax exemptions for military retirement pay",
        "Ensure surviving spouses of military members retain full state benefits",
        "Support legislation that assists military families during PCS (Permanent Change of Station) moves",
        "Advocate for improved healthcare access for retired military officers and their families",
        "Strengthen protections for military members against predatory financial practices",
      ],
      key_bills: [
        "Military Retirement Pay Tax Exemption",
        "Military Spouse Employment Licensure Compact",
        "Survivor Benefits Protection Act",
      ],
    },
    {
      key: "VVA",
      name: "VVA",
      display_name: "Vietnam Veterans of America - CA State Council",
      description:
        "VVA's California State Council focuses on issues uniquely affecting Vietnam-era veterans, including Agent Orange exposure, PTSD treatment, and services for aging veterans.",
      talking_points: [
        "Many Vietnam-era veterans are now in their 70s and 80s and need increased geriatric care support",
        "Expand state programs for Agent Orange-related health conditions and presumptive coverage",
        "Increase funding for PTSD treatment programs specifically designed for combat veterans",
        "Support legislation to improve veteran nursing home care and assisted living options",
        "Ensure veterans exposed to toxic substances receive comprehensive healthcare coverage",
      ],
      key_bills: [
        "Agent Orange Health Registry and Treatment Act",
        "Aging Veterans Care Enhancement Act",
        "Toxic Exposure Veterans Healthcare Expansion",
      ],
    },
  ];
}

export function getClientOrgByKey(key: string): ClientOrg | undefined {
  return getClientOrgs().find(
    (org) => org.key.toLowerCase() === key.toLowerCase()
  );
}

export function getLegislatorCount(): {
  total: number;
  senate: number;
  assembly: number;
} {
  const legislators = getLegislators();
  return {
    total: legislators.length,
    senate: legislators.filter((l) => l.chamber === "Senate").length,
    assembly: legislators.filter((l) => l.chamber === "Assembly").length,
  };
}
