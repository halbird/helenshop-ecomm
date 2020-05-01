const {check} = require("express-validator");

module.exports = {
  requireFname: check("fname")
    .trim()
    .isLength({min: 1})
    .withMessage("First name must be at least 1 character"),
  requireLname: check("lname")
    .trim()
    .isLength({min: 1})
    .withMessage("Last name must be at least 1 character"),
  requireEmail: check("email")
    .trim()
    .normalizeEmail()
    .isEmail()
    .withMessage("Must be a valid email"),
  requirePassword: check("password")
    .trim()
    .isLength({min: 7, max: 80})
    .withMessage("Password must be between 7 and 80 characters")
    .custom((value, {req}) => {
      if (value !== req.body.passwordConfirmation) {
        throw new Error("The passwords must match.");
      }
      return true;
    })
}