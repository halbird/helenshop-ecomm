// const express = require("express");
// const {requireFname, requireLname, requireEmail, requirePassword} = require("../utils/validators");
// const passport = require("passport");
// const router = express.Router();

// // signup
// router.get("/signup", (req, res) => {
//   res.render("signup", {message: req.flash("error"), req});
// });

// router.post("/signup", [requireFname, requireLname, requireEmail, requirePassword], (req, res, next) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     const errorArray = errors.array();
//     let message = "";
//     let msgArr = [];
//     errorArray.forEach(error => {
//       message = error.msg;
//       msgArr.push(" " + message);
//     });
//     console.log("Errors: ", msgArr);
//     res.render("signup", {message: msgArr})
//   } else {
//   passport.authenticate("local-signup", {
//     successRedirect: "/",
//     failureRedirect: "/signup",
//     failureFlash: true
//   })(req, res, next)
// }});

// // signin
// router.get("/signin", (req, res) => {
//   res.render("signin", {message: req.flash("error"), req});
// });

// router.post("/signin", passport.authenticate("local-signin", {
//   successRedirect: "/",
//   failureRedirect: "/signin",
//   failureFlash: true
// }), (req, res) => {
// });

// // signout
// router.get("/signout", (req, res) => {
//   req.session.destroy((err) => {
//   });
//   req.logOut();
//   res.render("signin", {message: "You've signed out, sign back in?", req, isSignedOut: true});
// });


// module.exports = router;