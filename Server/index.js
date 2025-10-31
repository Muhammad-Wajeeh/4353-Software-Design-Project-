// Server/index.js
require("dotenv").config();
const app = require("./app");
const PORT = process.env.PORT || 5000;

// start server
app.listen(PORT, () => {
  console.log(`✅ Server has started on port ${PORT}`);
});

// optional: quick DB check
const pool = require("./DB");
(async () => {
  try {
    const { rows } = await pool.query("SELECT NOW()");
    console.log("🗄️  DB connected:", rows[0].now);
  } catch (e) {
    console.error("❌ DB connection failed:", e.message);
  }
})();
