// Server/data/mockData.js

// ─────────────────────────────────────────────────────────────────────────────
// Users (now with structured address fields)
// ─────────────────────────────────────────────────────────────────────────────
const users = [
  {
    id: "u1",
    username: "demo@volunteerhub.org",
    password: "password123",
    name: "Demo User",
    address1: "123 Main St",
    address2: "",
    city: "Houston",
    state: "TX",
    zip: "77001",
    skills: ["first aid", "organization"],
    availability: {
      dates: ["2025-10-09", "2025-10-23", "2025-10-31"],   // ← unified format
    },
    preferences: { maxDistanceMiles: 25, notes: "" },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Volunteer History (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
const volunteerHistories = [
  {
    userId: "u1",
    events: [
      {
        eventId: "e1",
        eventName: "Community Cleanup",
        date: "2025-09-18",
        hours: 4,
        organization: "City of Houston",
        status: "Completed",
      },
      {
        eventId: "e2",
        eventName: "Food Drive",
        date: "2025-09-22",
        hours: 3,
        organization: "Houston Food Bank",
        status: "Completed",
      },
      {
        eventId: "e3",
        eventName: "Animal Shelter Volunteering",
        date: "2025-10-01",
        hours: 5,
        organization: "Houston Animal Rescue",
        status: "Upcoming",
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Notifications (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
const notifications = [
  {
    id: "n1",
    userId: "u1",
    type: "assignment",
    title: "You were assigned to Food Drive",
    message: "You're confirmed for Food Drive on 2025-10-22 at 10:00 AM.",
    createdAt: "2025-10-15T14:00:00Z",
    read: false,
    meta: { eventId: "e2" },
  },
  {
    id: "n2",
    userId: "u1",
    type: "reminder",
    title: "Event starts tomorrow",
    message: "Community Cleanup starts tomorrow at 9:00 AM.",
    createdAt: "2025-10-16T13:00:00Z",
    read: false,
    meta: { eventId: "e1" },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Events (unchanged; included for completeness if present in your repo)
// ─────────────────────────────────────────────────────────────────────────────
const volunteerEvents = [
  {
    id: "e1",
    name: "Community Cleanup",
    date: "2025-10-21",
    location: "Houston, TX",
    requiredSkills: ["first aid", "organization"],
    description: "Help clean up the community park. Gloves and bags provided.",
    organization: "City of Houston",
    status: "Open",
    capacity: 30,
  },
  {
    id: "e2",
    name: "Food Drive",
    date: "2025-10-25",
    location: "Houston, TX",
    requiredSkills: ["logistics"],
    description: "Sort and pack food donations for distribution.",
    organization: "Houston Food Bank",
    status: "Open",
    capacity: 50,
  },
  {
    id: "e3",
    name: "Animal Shelter Help",
    date: "2025-11-02",
    location: "Katy, TX",
    requiredSkills: ["animal care", "organization"],
    description: "Assist with cleaning and animal care at the shelter.",
    organization: "Houston Animal Rescue",
    status: "Open",
    capacity: 15,
  },
];

module.exports = {
  users,
  volunteerHistories,
  notifications,
  volunteerEvents,
};
