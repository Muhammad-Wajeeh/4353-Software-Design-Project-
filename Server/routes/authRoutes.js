// routes/userRoutes.js
const express = require("express");
const router = express.Router();



router.get("/register", async (req, res) => {
  const { firstName, lastName, username, email, password } = req.body;
  console.log(req.body);

  try {
    // hard coding the storage for now
    const tempStorageForRegistrationInfo = {
      firstName: firstName,
      lastName: lastName,
      username: username,
      password: password,
      email: email,
    };

    console.log(tempStorageForRegistrationInfo);

    // ----------- will be used when we implement DB

    // const saltRounds = 10;
    // const hash = await bcrypt.hash(password, saltRounds);

    // await pool.query(
    //   "INSERT INTO members (firstName, LastName, username, password, email) VALUES($1, $2, $3, $4, $5)",
    //   [firstName, lastName, username, hash, email]
    // );
    res.json("Account Created");
  } catch (err) {
    console.log(err.message);
    // need something here to let client side know that the user they are attempting is taken, or the id, maybe even enforce stronger password
  }
});

module.exports = router;
