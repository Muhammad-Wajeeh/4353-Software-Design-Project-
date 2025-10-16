// Server/data/mockData.js

const users = [
  {
    id: "u1",
    username: "demo@volunteerhub.org",
    password: "password123",     // plain for now (assignment says no DB)
    name: "Demo User",
    location: "Houston, TX",
    skills: ["first aid", "organization"],
    availability: {               // simple example: weekday index -> time blocks
      1: [{ start: "09:00", end: "12:00" }],
      3: [{ start: "13:00", end: "17:00" }],
    },
    preferences: { maxDistanceMiles: 25 }
  }
];

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
        status: "Completed"
      },
      {
        eventId: "e2",
        eventName: "Food Drive",
        date: "2025-09-22",
        hours: 3,
        organization: "Houston Food Bank",
        status: "Completed"
      },
      {
        eventId: "e3",
        eventName: "Animal Shelter Volunteering",
        date: "2025-10-01",
        hours: 5,
        organization: "Houston Animal Rescue",
        status: "Upcoming"
      }
    ]
  }
];

module.exports = { users, volunteerHistories };

