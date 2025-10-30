const Pool = require("pg").Pool;
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

module.exports = pool;

// const pool = new Pool({
//   user: "postgres",
//   password: "cgiang743",
//   host: "localhost",
//   port: "5432",
//   database: "volunteerhub",
// });

// module.exports = pool;
