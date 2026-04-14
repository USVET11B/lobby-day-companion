import type {
  Legislator,
  Committee,
  CommitteesData,
  ClientOrg,
  HearingRoom,
  Quadrant,
} from "@/types";

import legislatorsJson from "@/data/legislators.json";
import committeesJson from "@/data/committees.json";
import hearingRoomsJson from "@/data/hearing-rooms.json";

export function getLegislators(): Legislator[] {
  return (legislatorsJson as Legislator[])
    .slice()
    .sort((a, b) => {
      if (a.chamber !== b.chamber) return a.chamber === "Senate" ? -1 : 1;
      return a.district - b.district;
    });
}

export function getLegislatorById(id: string): Legislator | undefined {
  return (legislatorsJson as Legislator[]).find((l) => l.id === id);
}

export function getFloor(room: string | null | undefined): number | null {
  if (!room) return null;
  const match = room.match(/^(\d)/);
  return match ? parseInt(match[1], 10) : null;
}

export function getBuildingLabel(address: string | null | undefined): string | null {
  if (!address) return null;
  if (address.includes("1021 O")) return "Swing Space (1021 O St.)";
  if (address.includes("1020 N")) return "Legislative Office Building (1020 N St.)";
  if (address.toLowerCase().includes("state capitol") || address.includes("1315"))
    return "State Capitol (1315 10th St.)";
  return address;
}

export function getBuildingShort(address: string | null | undefined): string {
  if (!address) return "";
  if (address.includes("1021 O")) return "Swing";
  if (address.includes("1020 N")) return "LOB";
  if (address.toLowerCase().includes("state capitol") || address.includes("1315"))
    return "Capitol";
  return address;
}

export function getHearingRooms(): HearingRoom[] {
  return (hearingRoomsJson as { rooms: HearingRoom[] }).rooms;
}

/**
 * For Swing Space rooms, derive the floor quadrant from the room number.
 * Layout (same on every floor, per the building map):
 *   Top-left (10th St/inside): X220-X350    [NW]
 *   Top-right (11th St/inside): X510-X640   [NE]
 *   Bottom-left (10th/O St corner): X100-X240 [SW]
 *   Bottom-right (11th/O St corner): X620-X740 [SE]
 *   Center: elevators, lobby, restrooms
 */
export function getSwingQuadrant(room: string | null | undefined): Quadrant {
  if (!room) return "unknown";
  const digits = room.replace(/\D/g, "");
  if (digits.length < 4) return "unknown";
  const sub = parseInt(digits.slice(1), 10); // ignore floor digit
  if (Number.isNaN(sub)) return "unknown";
  if (sub >= 100 && sub <= 199) return "SW";
  if (sub >= 200 && sub <= 240) return "SW";
  if (sub >= 241 && sub <= 350) return "NW";
  if (sub >= 510 && sub <= 620) return "NE";
  if (sub >= 621 && sub <= 740) return "SE";
  return "unknown";
}

/**
 * Per the orientation video: which chambers occupy which floors of the
 * Swing Space. Used to label the floor map.
 */
export function getSwingFloorOccupancy(
  floor: number
): {
  label: string;
  detail: string | null;
} {
  switch (floor) {
    case 3:
      return {
        label: "Committees & cafeteria",
        detail:
          "Senate committee offices, Dept. of Finance, Legislative Counsel, small cafeteria (no seating)",
      };
    case 4:
    case 5:
      return { label: "Assembly only", detail: null };
    case 6:
      return {
        label: "Split floor",
        detail: "Senate offices east side · Assembly offices west side",
      };
    case 7:
      return { label: "Senate only", detail: null };
    case 8:
      return {
        label: "Leadership · split",
        detail:
          "Most leadership offices · Senate east side · Assembly west side · Lt. Governor also here",
      };
    case 9:
    case 10:
      return { label: "Governor's office", detail: null };
    default:
      return { label: `Floor ${floor}`, detail: null };
  }
}

export function getAvailableFloors(): number[] {
  const floors = new Set<number>();
  for (const leg of legislatorsJson as Legislator[]) {
    const f = getFloor(leg.capitol_room);
    if (f !== null) floors.add(f);
  }
  return Array.from(floors).sort((a, b) => a - b);
}

export type SortMode = "default" | "alpha" | "room";

export function sortLegislators<T extends { name: string; chamber: string; district: number; capitol_room: string | null }>(
  list: T[],
  mode: SortMode
): T[] {
  const sorted = list.slice();
  if (mode === "alpha") {
    sorted.sort((a, b) => {
      const aLast = a.name.split(" ").slice(-1)[0];
      const bLast = b.name.split(" ").slice(-1)[0];
      return aLast.localeCompare(bLast);
    });
  } else if (mode === "room") {
    sorted.sort((a, b) => {
      const aRoom = parseInt(a.capitol_room || "99999", 10);
      const bRoom = parseInt(b.capitol_room || "99999", 10);
      return aRoom - bRoom;
    });
  } else {
    sorted.sort((a, b) => {
      if (a.chamber !== b.chamber) return a.chamber === "Senate" ? -1 : 1;
      return a.district - b.district;
    });
  }
  return sorted;
}

export function getCommittees(): Committee[] {
  return (committeesJson as CommitteesData).committees;
}

export function getClientOrgs(): ClientOrg[] {
  return [
    { key: "AMVETS", name: "AMVETS", display_name: "AMVETS Department of California" },
    { key: "AL", name: "American Legion", display_name: "American Legion Department of California" },
    { key: "CSCVC", name: "CSCVC", display_name: "California State Commanders Veterans Council" },
    { key: "MOAA", name: "MOAA", display_name: "Military Officers Association of America - CA Council" },
    { key: "VVA", name: "VVA", display_name: "Vietnam Veterans of America - CA State Council" },
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
