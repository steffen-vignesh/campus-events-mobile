export type Category =
  | "technical"
  | "cultural"
  | "sports"
  | "workshop"
  | "seminar"
  | "hackathon"
  | "arts"
  | "social";

export type EventStatus = "upcoming" | "ongoing" | "completed" | "cancelled" | "postponed";

export interface Event {
  id: string;
  title: string;
  description: string;
  category: Category;
  date: string;
  endDate?: string;
  time: string;
  venue: string;
  mapLink?: string;
  organizer: string;
  contactEmail: string;
  registrationDeadline: string;
  capacity: number;
  registrations: number;
  views: number;
  registrationFee: number;
  eligibility: string;
  tags: string[];
  status: EventStatus;
  bannerImage: string;
  bannerLink?: string;
  ticketUrl?: string;
  attachments: { name: string; url: string }[];
}

export interface Registrant {
  id: string;
  eventId: string;
  name: string;
  email: string;
  phone: string;
  year: string;
  department: string;
  registeredAt: string;
  attended: boolean;
}

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: "technical", label: "Technical" },
  { value: "cultural", label: "Cultural" },
  { value: "sports", label: "Sports" },
  { value: "workshop", label: "Workshop" },
  { value: "seminar", label: "Seminar" },
  { value: "hackathon", label: "Hackathon" },
  { value: "arts", label: "Arts" },
  { value: "social", label: "Social" },
];

export const CATEGORY_COLORS: Record<Category, { bg: string; text: string }> = {
  technical: { bg: "#EEF2FF", text: "#4338CA" },
  cultural: { bg: "#FDF4FF", text: "#A21CAF" },
  sports: { bg: "#ECFDF5", text: "#059669" },
  workshop: { bg: "#FFFBEB", text: "#D97706" },
  seminar: { bg: "#EFF6FF", text: "#2563EB" },
  hackathon: { bg: "#FFF1F2", text: "#E11D48" },
  arts: { bg: "#FFF7ED", text: "#EA580C" },
  social: { bg: "#F0FDF4", text: "#16A34A" },
};

const DEFAULT_CATEGORY_COLOR = { bg: "#F3F4F6", text: "#374151" };

// Server data can carry category values outside this app's Category enum
// (e.g. "competition", "guest-lecture", "other" from the web app) — always
// fall back instead of crashing on an unrecognized value.
export function getCategoryColor(category: string): { bg: string; text: string } {
  return CATEGORY_COLORS[category as Category] ?? DEFAULT_CATEGORY_COLOR;
}

export function isEventPast(event: Event): boolean {
  const dateStr = event.endDate ?? event.date;
  const timeStr = event.endDate ? "23:59" : (event.time ?? "23:59");
  return new Date(`${dateStr}T${timeStr}:00`) < new Date();
}

export const MOCK_EVENTS: Event[] = [
  {
    id: "e1",
    title: "National Hackathon 2026",
    description:
      "A 48-hour coding marathon where teams of 2-4 solve real-world problems. Prizes worth ₹5 lakhs! Build innovative solutions across domains like fintech, healthtech, edtech, and climate tech. Expert mentors from top companies will be available throughout.",
    category: "hackathon",
    date: "2026-08-08",
    endDate: "2026-08-10",
    time: "09:00 AM",
    venue: "Main Auditorium, Block A",
    mapLink: "https://maps.google.com",
    organizer: "Dr. Ramesh Kumar",
    contactEmail: "hackathon@college.edu",
    registrationDeadline: "2026-08-05",
    capacity: 200,
    registrations: 187,
    views: 4320,
    registrationFee: 0,
    eligibility: "All years, all departments",
    tags: ["coding", "prizes", "team", "innovation"],
    status: "upcoming",
    bannerImage: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80",
    attachments: [{ name: "Problem Statements.pdf", url: "#" }],
  },
  {
    id: "e2",
    title: "Classical Music Night",
    description:
      "An enchanting evening of classical Indian and Western music performances by our talented students and guest artists. Enjoy ragas, symphonies, and fusion pieces in a beautifully decorated auditorium.",
    category: "cultural",
    date: "2026-08-14",
    time: "06:30 PM",
    venue: "Open Air Theatre",
    organizer: "Music Club",
    contactEmail: "music@college.edu",
    registrationDeadline: "2026-08-12",
    capacity: 500,
    registrations: 312,
    views: 2180,
    registrationFee: 50,
    eligibility: "Open to all",
    tags: ["music", "cultural", "performance"],
    status: "upcoming",
    bannerImage: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80",
    attachments: [],
  },
  {
    id: "e3",
    title: "AI/ML Workshop Series",
    description:
      "Three-day intensive workshop covering machine learning fundamentals, deep learning with PyTorch, and real-world deployment. Hands-on labs included with access to GPU cluster.",
    category: "workshop",
    date: "2026-08-20",
    endDate: "2026-08-22",
    time: "10:00 AM",
    venue: "CS Lab 301, Block C",
    organizer: "Prof. Anita Sharma",
    contactEmail: "aiml@college.edu",
    registrationDeadline: "2026-08-17",
    capacity: 60,
    registrations: 58,
    views: 3100,
    registrationFee: 200,
    eligibility: "3rd and 4th year CS/IT/ECE",
    tags: ["AI", "ML", "python", "deep-learning"],
    status: "upcoming",
    bannerImage: "https://images.unsplash.com/photo-1677442136019-21780ecad979?w=800&q=80",
    attachments: [],
  },
  {
    id: "e4",
    title: "Inter-College Cricket Tournament",
    description:
      "Annual 20-over cricket tournament featuring 16 college teams. Day/night format with floodlights. Live commentary, food stalls, and thrilling cricket action over two weekends.",
    category: "sports",
    date: "2026-08-22",
    endDate: "2026-08-30",
    time: "08:00 AM",
    venue: "College Cricket Ground",
    organizer: "Sports Committee",
    contactEmail: "sports@college.edu",
    registrationDeadline: "2026-08-18",
    capacity: 160,
    registrations: 96,
    views: 2750,
    registrationFee: 100,
    eligibility: "Male students, all years",
    tags: ["cricket", "inter-college", "tournament"],
    status: "upcoming",
    bannerImage: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=80",
    attachments: [],
  },
  {
    id: "e5",
    title: "Entrepreneurship Summit 2026",
    description:
      "A day-long summit featuring panel discussions with successful founders, pitch competitions, and networking sessions. Learn from entrepreneurs who built companies from dorm rooms to unicorns.",
    category: "seminar",
    date: "2026-09-05",
    time: "09:30 AM",
    venue: "Seminar Hall 2, Admin Block",
    organizer: "E-Cell",
    contactEmail: "ecell@college.edu",
    registrationDeadline: "2026-09-02",
    capacity: 300,
    registrations: 210,
    views: 3890,
    registrationFee: 0,
    eligibility: "Open to all students and faculty",
    tags: ["startup", "entrepreneurship", "networking"],
    status: "upcoming",
    bannerImage: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80",
    attachments: [],
  },
  {
    id: "e6",
    title: "Photography Exhibition & Contest",
    description:
      "Submit your best shots across 5 categories: Portrait, Nature, Architecture, Street, and Abstract. Top entries will be displayed in the gallery and winners receive cash prizes.",
    category: "arts",
    date: "2026-09-14",
    endDate: "2026-09-16",
    time: "11:00 AM",
    venue: "Art Gallery, Cultural Block",
    organizer: "Photography Club",
    contactEmail: "photo@college.edu",
    registrationDeadline: "2026-09-10",
    capacity: 100,
    registrations: 43,
    views: 1560,
    registrationFee: 0,
    eligibility: "Open to all",
    tags: ["photography", "art", "contest", "exhibition"],
    status: "upcoming",
    bannerImage: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&q=80",
    attachments: [],
  },
  // Past events
  {
    id: "e7",
    title: "Web Dev Bootcamp",
    description:
      "Full-stack web development bootcamp covering HTML, CSS, JavaScript, React, and Node.js. 3-day intensive with project-based learning.",
    category: "workshop",
    date: "2026-07-18",
    endDate: "2026-07-20",
    time: "09:00 AM",
    venue: "CS Lab 201, Block C",
    organizer: "WebTech Club",
    contactEmail: "webtech@college.edu",
    registrationDeadline: "2026-07-15",
    capacity: 80,
    registrations: 78,
    views: 2100,
    registrationFee: 150,
    eligibility: "1st and 2nd year students",
    tags: ["web", "react", "nodejs", "bootcamp"],
    status: "completed",
    bannerImage: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&q=80",
    attachments: [],
  },
  {
    id: "e8",
    title: "Cultural Fest - Rang 2026",
    description:
      "The annual 3-day cultural festival with dance competitions, drama, music, fashion show, and celebrity performances.",
    category: "cultural",
    date: "2026-07-24",
    endDate: "2026-07-26",
    time: "05:00 PM",
    venue: "Main Ground",
    organizer: "Cultural Committee",
    contactEmail: "cultural@college.edu",
    registrationDeadline: "2026-07-20",
    capacity: 1000,
    registrations: 950,
    views: 7800,
    registrationFee: 0,
    eligibility: "Open to all",
    tags: ["fest", "dance", "music", "drama"],
    status: "completed",
    bannerImage: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80",
    attachments: [],
  },
  {
    id: "e9",
    title: "Robotics Competition",
    description:
      "Build and battle autonomous robots in our annual competition. Categories: line follower, maze solver, and combat bots.",
    category: "technical",
    date: "2026-07-28",
    time: "10:00 AM",
    venue: "Mechanical Workshop, Block E",
    organizer: "Robotics Club",
    contactEmail: "robotics@college.edu",
    registrationDeadline: "2026-07-24",
    capacity: 120,
    registrations: 114,
    views: 3200,
    registrationFee: 300,
    eligibility: "Teams of 3, all departments",
    tags: ["robotics", "electronics", "competition"],
    status: "completed",
    bannerImage: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&q=80",
    attachments: [],
  },
  {
    id: "e10",
    title: "Mental Health Awareness Talk",
    description:
      "A candid talk on managing stress, anxiety, and burnout during college life. Guest speaker: Dr. Priya Nair, clinical psychologist.",
    category: "seminar",
    date: "2026-08-01",
    time: "02:00 PM",
    venue: "Seminar Hall 1",
    organizer: "Student Welfare Cell",
    contactEmail: "welfare@college.edu",
    registrationDeadline: "2026-07-30",
    capacity: 200,
    registrations: 189,
    views: 2400,
    registrationFee: 0,
    eligibility: "Open to all",
    tags: ["mental-health", "wellness", "seminar"],
    status: "completed",
    bannerImage: "https://images.unsplash.com/photo-1573497620053-ea5300f94f21?w=800&q=80",
    attachments: [],
  },
];

export const MOCK_REGISTRANTS: Registrant[] = [
  { id: "r1", eventId: "e1", name: "Arjun Mehta", email: "arjun@student.edu", phone: "9876543210", year: "3rd Year", department: "Computer Science", registeredAt: "2026-08-03T10:24:00", attended: false },
  { id: "r2", eventId: "e1", name: "Priya Nair", email: "priya@student.edu", phone: "9876543211", year: "2nd Year", department: "Information Technology", registeredAt: "2026-08-03T11:05:00", attended: false },
  { id: "r3", eventId: "e1", name: "Ravi Shankar", email: "ravi@student.edu", phone: "9876543212", year: "4th Year", department: "ECE", registeredAt: "2026-08-02T14:30:00", attended: false },
  { id: "r4", eventId: "e7", name: "Sana Khan", email: "sana@student.edu", phone: "9876543213", year: "1st Year", department: "Computer Science", registeredAt: "2026-07-14T09:00:00", attended: true },
  { id: "r5", eventId: "e7", name: "Karan Patel", email: "karan@student.edu", phone: "9876543214", year: "2nd Year", department: "IT", registeredAt: "2026-07-13T16:00:00", attended: true },
  { id: "r6", eventId: "e9", name: "Deepa Iyer", email: "deepa@student.edu", phone: "9876543215", year: "3rd Year", department: "Mechanical", registeredAt: "2026-07-22T11:00:00", attended: true },
  { id: "r7", eventId: "e9", name: "Vikram Das", email: "vikram@student.edu", phone: "9876543216", year: "4th Year", department: "ECE", registeredAt: "2026-07-21T10:00:00", attended: false },
  { id: "r8", eventId: "e10", name: "Ananya Roy", email: "ananya@student.edu", phone: "9876543217", year: "1st Year", department: "Arts", registeredAt: "2026-07-29T08:30:00", attended: true },
];
