// Server/data/mockData.js

// --- initial snapshots (do NOT export directly) ---
const __initial = {
  users: [
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
      availability: { dates: ["2025-10-21", "2025-11-02"] },
      preferences: { maxDistanceMiles: 25, notes: "Weekends preferred" },
    },
  ],
  volunteerHistories: [
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
  ],
  notifications: [
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
  ],
  events: [
    {
      id: "e1",
      name: "Community Cleanup",
      date: "2025-10-21",
      location: "Houston, TX",
      requiredSkills: ["first aid", "organization"],
      capacity: 25,
      status: "Open",
      description: "Help clean up the community park.",
    },
    {
      id: "e2",
      name: "Food Drive",
      date: "2025-10-25",
      location: "Houston, TX",
      requiredSkills: ["logistics"],
      capacity: 40,
      status: "Open",
      description: "Assist with sorting and packaging food.",
    },
  ],
};

// --- exported live arrays ---
const users = JSON.parse(JSON.stringify(__initial.users));
const volunteerHistories = JSON.parse(JSON.stringify(__initial.volunteerHistories));
const notifications = JSON.parse(JSON.stringify(__initial.notifications));
const events = JSON.parse(JSON.stringify(__initial.events));

// mutate-in-place reset for tests
function __resetAll() {
  users.splice(0, users.length, ...JSON.parse(JSON.stringify(__initial.users)));
  volunteerHistories.splice(0, volunteerHistories.length, ...JSON.parse(JSON.stringify(__initial.volunteerHistories)));
  notifications.splice(0, notifications.length, ...JSON.parse(JSON.stringify(__initial.notifications)));
  events.splice(0, events.length, ...JSON.parse(JSON.stringify(__initial.events)));
}

module.exports = { users, volunteerHistories, notifications, events, __resetAll };
