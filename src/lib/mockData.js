// Mock data used until Firestore is wired up.

export const DORMS = [
  "Harrington Hall",
  "Wells House",
  "Founders Court",
  "Birchwood Commons",
  "Lakeside Terrace",
  "Maple Residence",
];

export const CATEGORIES = [
  "Furniture",
  "Electronics",
  "Kitchen",
  "Decor",
  "Clothing",
  "Books",
  "Storage",
  "Misc",
];

export const CURRENT_USER = {
  id: "u-001",
  name: "Jordan Avery",
  email: "javery@campus.edu",
  dorm: "Harrington Hall",
  room: "4B",
  interests: ["minimalist", "budget-conscious", "setting up a dorm room"],
  sustainabilityScore: 12, // lbs of stuff kept out of landfill via this account
  joined: "2026-08-01",
};

export const MOCK_LISTINGS = [
  {
    id: "l-001",
    title: "Mini Fridge — 3.2 cu ft",
    description:
      "Works perfectly, moving out at end of semester. Great for a dorm room, holds a lot more than it looks. Minor scuff on the door, doesn't affect function.",
    category: "Electronics",
    condition: "Good",
    price: 45,
    dorm: "Harrington Hall",
    room: "2C",
    seller: { id: "u-014", name: "Priya N.", dorm: "Harrington Hall" },
    tags: ["fridge", "appliance", "move-out"],
    postedAt: "2026-08-10",
    photoTone: "navy",
    photoLabel: "FRIDGE",
  },
  {
    id: "l-002",
    title: "Desk Lamp, Warm LED",
    description:
      "Adjustable arm, three brightness settings. Barely used, I just have two now. Great for late-night studying without waking your roommate.",
    category: "Decor",
    condition: "Like new",
    price: 12,
    dorm: "Wells House",
    room: "1A",
    seller: { id: "u-022", name: "Sam T.", dorm: "Wells House" },
    tags: ["lamp", "desk", "lighting"],
    postedAt: "2026-08-11",
    photoTone: "forest",
    photoLabel: "LAMP",
  },
  {
    id: "l-003",
    title: "Twin XL Comforter — Navy",
    description:
      "Washed and ready to go. Soft, warm, no stains or tears. Selling because I'm switching to a different color scheme, not because anything's wrong with it.",
    category: "Furniture",
    condition: "Good",
    price: 18,
    dorm: "Founders Court",
    room: "3D",
    seller: { id: "u-031", name: "Alex R.", dorm: "Founders Court" },
    tags: ["bedding", "comforter", "twin-xl"],
    postedAt: "2026-08-09",
    photoTone: "stamp",
    photoLabel: "BEDDING",
  },
  {
    id: "l-004",
    title: "Stackable Storage Bins (Set of 3)",
    description:
      "Perfect for a closet or under the bed. Sturdy plastic, held up all year. Great for organizing move-out chaos or just general dorm clutter.",
    category: "Storage",
    condition: "Good",
    price: 10,
    dorm: "Harrington Hall",
    room: "4B",
    seller: { id: "u-002", name: "Jordan A.", dorm: "Harrington Hall" },
    tags: ["storage", "bins", "organization"],
    postedAt: "2026-08-12",
    photoTone: "kraft",
    photoLabel: "BINS",
  },
  {
    id: "l-005",
    title: "Electric Kettle, 1L",
    description:
      "Boils water in under 3 minutes. Auto shut-off. Used mostly for instant ramen and tea, works great. Selling because I'm going abroad next semester.",
    category: "Kitchen",
    condition: "Like new",
    price: 15,
    dorm: "Lakeside Terrace",
    room: "5A",
    seller: { id: "u-045", name: "Devon K.", dorm: "Lakeside Terrace" },
    tags: ["kettle", "kitchen", "appliance"],
    postedAt: "2026-08-13",
    photoTone: "navy",
    photoLabel: "KETTLE",
  },
  {
    id: "l-006",
    title: "Textbook Bundle — Intro CS",
    description:
      "CS 101 and CS 201 textbooks, both editions match this year's syllabus. Some highlighting but all pages intact. Save yourself the bookstore markup.",
    category: "Books",
    condition: "Fair",
    price: 30,
    dorm: "Birchwood Commons",
    room: "2F",
    seller: { id: "u-051", name: "Morgan L.", dorm: "Birchwood Commons" },
    tags: ["textbooks", "cs", "school"],
    postedAt: "2026-08-08",
    photoTone: "forest",
    photoLabel: "BOOKS",
  },
];

export const MOCK_SWIPE_HISTORY = [];
export const MOCK_SAVED_LISTING_IDS = [];
