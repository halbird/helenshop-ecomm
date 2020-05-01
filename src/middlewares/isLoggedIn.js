module.exports = {
  // middleware to see is user is logged in
  isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    req.flash("error", "You must be signed in to access that.");
    res.redirect("/signin");
  }
};