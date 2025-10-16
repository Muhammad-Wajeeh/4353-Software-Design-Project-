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

module.exports = { users };
