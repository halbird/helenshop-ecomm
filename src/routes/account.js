// const express = require("express");
// const router = express.Router();


// router.get("/account", (req, res) => {
//   if (req.session.userId) {
//     connection.query(`SELECT * FROM users WHERE id=${req.session.userId}`, (err, results) => {
//       if (err) {throw err}
//       res.render("account", {results, req})
//     });
//   } else {
//     res.render("signin", {message: "You have to be signed in to access that page.", req})
//   }
// });

// module.exports = router;