// src/data/places.ts
export type Place = {
  id: string;
  name: string;
  aliases?: string[];
  category:
    | "emergency"
    | "clinic"
    | "diagnostics"
    | "mother-child"
    | "amenity"
    | "gate";
  parentId?: string;
  building?: string;
  badge?: string;
  popular?: boolean;
};

export const places: Place[] = [
  // Popular
  {
    id: "ae",
    name: "Accident & Emergency",
    aliases: ["a&e", "emergency", "casualty", "accident"],
    category: "emergency",
    building: "Emergency Wing, Ground Floor",
    badge: "24/7 Priority",
    popular: true,
  },
  {
    id: "gopd",
    name: "General Out-Patient Department (GOPD)",
    aliases: ["gopd", "general outpatient", "general out-patient"],
    category: "clinic",
    building: "Central Clinic Block, Ground Floor",
    popular: true,
  },
  {
    id: "sopd",
    name: "Surgical Out-Patient Department (SOPD)",
    aliases: ["sopd", "surgical outpatient", "surgical out-patient"],
    category: "clinic",
    building: "Surgical Complex, Main Quadrangle",
    popular: true,
  },
  {
    id: "mopc",
    name: "Medical Out-Patient Clinic",
    aliases: ["mopd", "mopc", "medical outpatient"],
    category: "clinic",
    building: "Physicians Pavilion, Block D",
    popular: true,
  },
  {
    id: "main-gate",
    name: "Main Gate",
    aliases: ["gate", "exit", "entrance", "main entrance"],
    category: "gate",
    building: "Campus entrance",
    popular: true,
  },

  // A&E children
  {
    id: "ae-trauma",
    name: "Trauma Unit",
    aliases: ["trauma", "resuscitation"],
    category: "emergency",
    parentId: "ae",
    building: "Red Zone Resuscitation, North Portal",
    badge: "Bay 1-14",
  },
  {
    id: "ae-medical",
    name: "Medical Emergency",
    aliases: ["medical emergency", "acute admission"],
    category: "emergency",
    parentId: "ae",
    building: "Acute Admission & Observation Suite",
    badge: "Bays 15-28",
  },

  // SOPD children
  {
    id: "sopd-paeds",
    name: "Paediatric Surgery",
    aliases: ["paediatric surgery", "children surgery", "kids surgery"],
    category: "clinic",
    parentId: "sopd",
    building: "Children surgical consultations",
    badge: "Suite 1A",
  },
  {
    id: "sopd-neuro",
    name: "Neurosurgery",
    aliases: ["neuro", "brain", "spine"],
    category: "clinic",
    parentId: "sopd",
    building: "Brain and spine outpatient reviews",
    badge: "Suite 2",
  },
  {
    id: "sopd-plastic",
    name: "Plastic Surgery",
    aliases: ["plastic", "reconstructive"],
    category: "clinic",
    parentId: "sopd",
    building: "Reconstructive clinic and wound care",
    badge: "Suite 3",
  },
  {
    id: "sopd-cardio",
    name: "Cardiothoracic Surgery Clinics",
    aliases: ["cardiothoracic", "heart surgery"],
    category: "clinic",
    parentId: "sopd",
    building: "Heart and thoracic surgery post-op",
    badge: "Suite 4",
  },

  // GOPD children
  {
    id: "gopd-ortho",
    name: "Orthopaedics Clinic",
    aliases: ["ortho", "bone", "joint"],
    category: "clinic",
    parentId: "gopd",
    building: "Bone and joint evaluations",
    badge: "Clinic Room 1",
  },
  {
    id: "gopd-cardio",
    name: "Cardiology Clinic & ECG Lab",
    aliases: ["cardiology", "ecg", "heart"],
    category: "clinic",
    parentId: "gopd",
    building: "Cardiology diagnostics and vitals",
    badge: "Clinic Room 4",
  },
  {
    id: "gopd-urology",
    name: "Urology Clinic",
    aliases: ["urology", "kidney"],
    category: "clinic",
    parentId: "gopd",
    building: "Kidney and urological evaluations",
    badge: "Clinic Room 7",
  },
  {
    id: "gopd-general-surgery",
    name: "General Surgery Clinic",
    aliases: ["general surgery"],
    category: "clinic",
    parentId: "gopd",
    building: "Pre-op assessment and consultations",
    badge: "Clinic Room 9",
  },

  // Medical OPC children
  {
    id: "mopc-nephro",
    name: "Nephrology & Neurology",
    aliases: ["nephrology", "neurology", "renal"],
    category: "clinic",
    parentId: "mopc",
    building: "Renal and neurological consultations",
    badge: "Pavilion D1",
  },
  {
    id: "mopc-gastro",
    name: "Gastroenterology & Rheumatology",
    aliases: ["gastro", "rheumatology"],
    category: "clinic",
    parentId: "mopc",
    building: "Digestive health and joint immunology",
    badge: "Pavilion D3",
  },
  {
    id: "mopc-resp",
    name: "Respirology & Asthma Clinic",
    aliases: ["respirology", "asthma", "chest", "lung"],
    category: "clinic",
    parentId: "mopc",
    building: "Pulmonary function tests and chest clinic",
    badge: "Pavilion D4",
  },
  {
    id: "mopc-ultrasound",
    name: "Radiology Ultrasound Department",
    aliases: ["ultrasound", "radiology", "scan"],
    category: "diagnostics",
    parentId: "mopc",
    building: "General scan and Doppler assessments",
    badge: "Scanning Rm 2",
  },

  // Mother & Child
  {
    id: "mother-child",
    name: "Mother & Child Complexes",
    aliases: ["mother and child", "maternal", "maternity"],
    category: "mother-child",
    building: "Maternal Healthcare Zone, South Wing",
  },
  {
    id: "mother-child-arthur",
    name: "Arthur Eze Mother & Child Complex",
    aliases: ["arthur eze", "discharge", "accounts"],
    category: "mother-child",
    parentId: "mother-child",
    building: "Postnatal admissions, billing desk",
    badge: "Block A",
  },
  {
    id: "mother-child-old",
    name: "Old Mother & Child Complex",
    aliases: ["antenatal", "infant"],
    category: "mother-child",
    parentId: "mother-child",
    building: "Antenatal clinic and infant care unit",
    badge: "Block B",
  },

  // Multipurpose
  {
    id: "multipurpose",
    name: "Multipurpose Complex",
    aliases: ["multipurpose", "food court"],
    category: "amenity",
    building: "Campus Commercial & Welfare Hub",
  },
  {
    id: "multipurpose-food",
    name: "Restaurants & Food Court",
    aliases: ["restaurant", "food", "dining"],
    category: "amenity",
    parentId: "multipurpose",
    building: "Dining, meal vouchers, and refreshment stalls",
    badge: "Wing A",
  },
  {
    id: "multipurpose-creche",
    name: "Childcare Services & Creche",
    aliases: ["creche", "childcare", "daycare"],
    category: "amenity",
    parentId: "multipurpose",
    building: "Safe play area and staff family support",
    badge: "Wing B",
  },
];
