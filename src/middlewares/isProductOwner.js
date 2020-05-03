// module.exports = {
//   // middleware to see is user is logged in
//   isLoggedIn(req, res, next) {
//     if (req.isAuthenticated()) {
//       return next();
//     }
//     req.flash("error", "You must be signed in to access that.");
//     res.redirect("/signin");
//   }
// };



module.exports = {
  isProductOwner(req, res, next) {
    connection.query(`SELECT * FROM products WHERE id=${productID-from-button/form}`, (err, results) => {
      if (results[0].created_by === req.session.userId) {
        next()
      }
    })
  }



};

// find product
// check if product owner matches current logged in 