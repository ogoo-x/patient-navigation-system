// data/graph.ts
// B* / R* = bends (your measurements)
// named ids = building entrances (known pins)

export type GraphNode = { lat: number; lng: number };

export const nodes: Record<string, GraphNode> = {
  // ── Bends (your coords) ─────────────────────────────────────
  B1: { lat: 6.00030573925572, lng: 6.882315735602933 },
  B2: { lat: 6.000201039318464, lng: 6.88182086805985 },
  B3: { lat: 6.000209041861718, lng: 6.88097731332142 },
  B4: { lat: 6.0000863361793675, lng: 6.880967255030117 },
  B5: { lat: 6.0000576603902775, lng: 6.880383874575527 },
  B6: { lat: 6.0001170126039405, lng: 6.881236146489394 },
  B7: { lat: 5.999396783075296, lng: 6.880933056866867 },
  B8: { lat: 5.999392781795986, lng: 6.881568740395669 },
  B9: { lat: 5.999394442549889, lng: 6.882003501311673 },
  B10: { lat: 5.999406446387504, lng: 6.882306590928261 },
  B11: { lat: 5.998732851533283, lng: 6.88224985336088 },
  B12: { lat: 5.997950933643678, lng: 6.880600630117529 },
  B14: { lat: 5.997525463144325, lng: 6.880588560175134 },
  B16: { lat: 5.995339237840225, lng: 6.880661166346529 },
  B17: { lat: 5.999429839328167, lng: 6.8796134032633125 },
  B18: { lat: 5.998720893704262, lng: 6.880303651356795 },
  B19: { lat: 5.99865277373071, lng: 6.879943610550272 },
  B20: { lat: 5.999865926252326, lng: 6.882330730817785 },
  B21: { lat: 5.997529863216594, lng: 6.879402854709139 },
  B22: { lat: 5.999301746276476, lng: 6.8806516679691825 },
  B23: { lat: 5.99873023003064, lng: 6.880640268572472 },
  B24: { lat: 5.998667745722474, lng: 6.880695337970404 },

  R1: { lat: 6.000257102835813, lng: 6.879135634802903 },
  R2: { lat: 5.999459182029066, lng: 6.879105795209763 },
  R3: { lat: 5.998660259727393, lng: 6.879056174388359 },
  R4: { lat: 5.9975376958550495, lng: 6.879012764769265 },
  R5: { lat: 5.996572639510508, lng: 6.878949581731471 },
  R6: { lat: 5.995411261376004, lng: 6.878882861795758 },

  // ── Entrances (known place pins) ────────────────────────────
  main_gate: { lat: 6.001417, lng: 6.882389 },
  ibeto_ict: { lat: 6.000278, lng: 6.882667 },
  ae_entrance: { lat: 6.000139, lng: 6.881833 },
  children_emergency: { lat: 5.999917, lng: 6.880361 },
  sopd: { lat: 5.999333, lng: 6.881 },
  blood_bank: { lat: 5.999139, lng: 6.881444 },
  gopd: { lat: 5.999056, lng: 6.882167 },
  mopc: { lat: 5.99925, lng: 6.879611 },
  microbiology: { lat: 5.998833, lng: 6.879194 },
  anc: { lat: 5.998806, lng: 6.880306 },
  multipurpose: { lat: 5.998556, lng: 6.88075 },
  medical_ward: { lat: 5.998417, lng: 6.879694 },
  old_mother_child: { lat: 5.997778, lng: 6.879417 },
  arthur_eze: { lat: 5.997417, lng: 6.879472 },
  surgical_ward: { lat: 5.996528, lng: 6.879722 },
  ot: { lat: 5.996389, lng: 6.879694 },
};

/** Undirected walk links from your graph diagram */
export const edges: [string, string][] = [
  // North entry
  ["main_gate", "B1"],
  ["B1", "ibeto_ict"],
  ["B1", "B2"],
  ["B2", "B3"],
  ["B3", "R1"],

  // On the right of B1:
  ["B1", "B20"],
  ["B20", "B10"],
  ["B10", "B9"],
  ["B9", "B8"],
  ["B8", "B7"],

  // Further down from B10:
  ["B10", "B11"],
  ["B11", "B12"],
  ["B12", "B24"],
  ["B12", "B14"],
  ["B14", "B21"],

  // A&E spur (side path) — not through-route to children
  ["B3", "B4"],
  ["B4", "B6"],
  ["B6", "ae_entrance"],
  ["B6", "B20"],
  ["B7", "B4"],
  ["sopd", "B7"],

  // Left branch → children emergency
  ["B4", "B5"],
  ["B5", "children_emergency"],

  // West spine R1–R6
  ["R1", "R2"],
  ["R2", "R3"],
  ["R3", "R4"],
  ["R4", "R5"],
  ["R5", "R6"],

  // Mid row: R2 – B17 – B22 – B7 – B8 – B9 – B10
  ["R2", "B17"],
  ["B17", "B22"],
  ["B22", "B7"],
  ["B7", "B8"],
  ["B8", "B9"],
  ["B9", "B10"],

  // Mid entrances
  ["B17", "mopc"],
  ["B17", "microbiology"],
  ["B7", "sopd"],
  ["B8", "blood_bank"],
  ["B9", "gopd"],

  // East spine down from B10
  ["B10", "B11"],
  ["B11", "B12"], // B13 skipped
  ["B12", "B14"],
  ["B14", "B16"],
  ["R6", "B16"],

  // Footpath B22–B23 (dashed on diagram)
  ["B22", "B23"],

  // Lower mid: R3 – B19 – B18 – B23 – B24 – B12
  ["R3", "B19"],
  ["B19", "B18"],
  ["B18", "B23"],
  ["B23", "B24"],
  ["B24", "B12"], // dashed “confirm” on diagram — included for routing

  ["B19", "medical_ward"],
  ["B18", "anc"],
  ["B23", "multipurpose"],

  // South: R4 – B21 – mother-child / Arthur Eze
  ["R4", "B21"],
  ["B21", "B14"],
  ["B21", "old_mother_child"],
  ["B21", "arthur_eze"],

  // Surgical (R5 dashed link on diagram)
  ["R5", "surgical_ward"],
  ["surgical_ward", "ot"],
];
