const dotenv = require("dotenv");
dotenv.config();

const HOST = process.env.HOST;
const USER = process.env.USER;
const PASSWORD = process.env.PASSWORD;
const DATABASE = process.env.DATABASE;
const STORESECRET = process.env.STORESECRET;
const PORT = process.env.PORT || 3000;


const mysql = require("mysql");
const express = require("express");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const passport = require("passport");
const LocalStrategy = require("passport-local");
const bodyParser = require("body-parser");
const pug = require("pug");
const flash = require("connect-flash");
const fs = require("fs");
const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);
const {check, body, validationResult} = require("express-validator");

const {isLoggedIn} = require("./middlewares/isLoggedIn");
const {requireFname, requireLname, requireEmail, requirePassword} = require("./utils/validators");
const app = express();

app.set("views", __dirname + "/views");
app.set("view engine", "pug");
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({extended: true}));


const options = {
  host: HOST,
  user: USER,
  password: PASSWORD,
  database: DATABASE,
  connectionLimit: 10
};

const pool = mysql.createPool(options);

pool.on('acquire', (connection) => {
  console.log('Connection acquired: ', connection.threadId);
});

pool.on('error', (err) => {
  console.log("ERROR HAS OCCURRED:", err.code);
});

const sessionStore = new MySQLStore({port: 3306},pool);
app.use(session({
  secret: STORESECRET,
  store: sessionStore,
  resave: false,
  saveUninitialized: false
}));

app.use(flash());

app.use(passport.initialize());
app.use(passport.session());


passport.use("local-signup", new LocalStrategy({
  usernameField: "email",
  passwordField: "password",
  passReqToCallback: true
},
  (req, email, password, cb) => {
    if(!email || !password) { return cb(null, false); }    // missing input
    pool.query("SELECT * FROM users WHERE email = ?", [email], async (err, rows) => {
      if(err) { return cb(null, false); }   // error
      if(rows.length) { return cb(null, false, {message: "Email is already in use."}); }   // email in use
      // else, create new user:
      const newUser = new Object();
      newUser.fname = req.body.fname;
      newUser.lname = req.body.lname;
      newUser.email = email;
    
      const encryptPassword = async (password) => {
        const salt = crypto.randomBytes(32).toString("hex");
        newUser.salt = salt;
        const buffer = await scrypt(password, salt, 64)
        const newPass = `${buffer.toString("hex")}`;
        newUser.password = newPass;
        return newPass;
      }; 
    await encryptPassword(password);

    console.log("New user created: ", newUser);
    pool.query("INSERT INTO users (fname, lname, email, password, salt) VALUES (?, ?, ?, ?, ?)", [newUser.fname, newUser.lname, newUser.email, newUser.password, newUser.salt], (err, rows) => {
      req.session.userId = rows.insertId;
      return cb(null, newUser, {message: "Success!"});
      });
    });
  }
));


passport.use("local-signin", new LocalStrategy({
    usernameField: "email",
    passwordField: "password",
    passReqToCallback: true
  },
    (req, email, password, cb) => {
      if(!email || !password) { return cb(null, false); }    // missing input
      pool.query("SELECT * FROM users WHERE email = ?", [email], async (err, rows) => {
        if(err) { return cb(null, false); }   // error
        if(!rows.length) { return cb(null, false, {message: "No users found!"}); }    // no users found
        const dbPassword = rows[0].password;
        const dbSalt = rows[0].salt;
        const enteredPassword = req.body.password;

        const comparePasswords = async function(hashed, salt, supplied) {
          const hashedSupplied = await scrypt(supplied, salt, 64);
          return hashed === hashedSupplied.toString("hex");
        }

        if (await comparePasswords(dbPassword, dbSalt, enteredPassword)) {
          req.session.userId = rows[0].id;
          return cb(null, rows[0], {message: "Success!"});   // logged in
        }
        return cb(null, false, {message: "Incorrect password!"});
      });
    }));

passport.serializeUser(function(user, cb){
  cb(null, user);
});
passport.deserializeUser(function(user, cb){
  cb(null, user);
});


app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  next();
});

// check product ownership middleware
function isProductOwner(req, res, next) {
  if (req.isAuthenticated()) {
    pool.query("SELECT * FROM products WHERE id = ?", [req.params.id], (err, results) => {
      if (results[0].created_by === req.session.userId) {
        next();
      }
    })
  } else {
    req.flash("error", "You can only do with products you posted.");
    res.redirect("/products");
  };
};


// dashboard
app.get("/", (req, res) => {
  if (req.session.anonCart && req.session.userId) {
    pool.query("SELECT * FROM carts WHERE user_id = ?", [req.session.userId], (err, result) => {
      if (result.length != 0) {
        pool.query("DELETE FROM carts WHERE session_id = ?", [req.sessionID]);
        req.session.anonCart = false;
        req.flash("success", "Here's your cart from last time.");
      } else {
        pool.query("UPDATE carts SET user_id = ? WHERE session_id = ?", [req.session.userId, req.sessionID]);
        req.session.anonCart = false;
        req.flash("success", "Here's what you have so far.");
      }
      res.redirect("/cart");
    });
  } else if (req.session.userId) {
    pool.query("SELECT id, fname, lname FROM users WHERE id = ?", [req.session.userId], (err, results) => {
      res.render("dashboard", {req, results});
    });
  } else {
    res.render("dashboard", {req});
  }
  console.log("sessionID: ", req.sessionID);
});


// USER
// signup
app.get("/signup", (req, res) => {
  res.render("users/signup", {req});
}); 

app.post("/signup", [requireFname, requireLname, requireEmail, requirePassword], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorArray = errors.array();
    let msgArr = [];
    errorArray.forEach(error => {
      msgArr.push(" " + error.msg);
    });
    req.flash("error", msgArr);
    res.redirect("signup");
  } else {
  passport.authenticate("local-signup", {
    successRedirect: "/",
    failureRedirect: "/signup",
    failureFlash: true,
    successFlash: "Welcome new user!"
  })(req, res, next)
}});

// signin
app.get("/signin", (req, res) => {
  res.render("users/signin", {req});
});

app.post("/signin", passport.authenticate("local-signin", {
  successRedirect: "/",
  failureRedirect: "/signin",
  failureFlash: true,
}), (req, res) => {
});

// signout
app.get("/signout", (req, res) => {
  req.logOut();
  if (req.session.userId) {
    delete req.session.userId;
  }
  req.session.regenerate((err) => {
    if (err) {
      console.log(err);
    }
    req.flash("success", "Successfully signed out. Sign back in?");
    res.redirect("/signin");
  })
});

// show account info
app.get("/account", isLoggedIn, (req, res) => {
  pool.query("SELECT users.id AS user_id, fname, lname, email, products.id AS product_id, title, price, img, inventory, created_by FROM products JOIN users ON products.created_by = users.id", (err, results) => {
    if (err) console.log("error", err);
    res.render("users/account", {req, results});
  });
});


app.get("/account/edit", isLoggedIn, (req, res) => {
  pool.query("SELECT id, fname, lname, email FROM users WHERE id = ?", [req.session.userId], (err, results) => {
    if (results.length != 0) {
      res.render("users/edit", {req, results});
    } else {
      req.flash("error", "Couldn't find your account.");
      res.redirect("/");
    }
  });
});

app.post("/account/edit", isLoggedIn, (req, res) => {
  pool.query("UPDATE users SET fname = ?, lname = ?, email = ? WHERE id = ?", [req.body.fname, req.body.lname, req.body.email, req.session.userId], (err) => {
    if (err) {
      req.flash("error", "Unable to save your changes, email already in use.");
      return res.redirect("/account");    
    } else {
      req.flash("success", "Your account changes have been saved.");
      res.redirect("/account");
    }
  });
});

app.post("/account/delete", isLoggedIn, (req, res) => {
  pool.query("DELETE FROM users WHERE id = ?", [req.session.userId], (err) => {
    if (err) console.log("Could not delete the user.")
  });
  req.flash("success", "Your account has been deleted.");
  res.redirect("/signout");
});

// CART
// show cart
app.get("/cart", (req, res) => {
  if (req.isAuthenticated()) {
    pool.query("SELECT user_id, quantity, product_id, title, price, img, inventory FROM products LEFT JOIN carts ON products.id = carts.product_id HAVING carts.user_id = ?", [req.session.userId], (err, results) => {
      if(err) throw err;
      res.render("cart", {results, req});
    });
  } else if (req.session.anonCart) {
    pool.query("SELECT session_id, quantity, product_id, title, price, img, inventory FROM products LEFT JOIN carts ON products.id = carts.product_id HAVING carts.session_id=?", [req.sessionID], (err, results) => {
      if(err) throw err;
      res.render("cart", {results, req});
    });
  } else {
    res.render("cart", {req});
  }
});

// add 1 quantity of product to cart from products page
app.post("/cart/product/add", (req, res) => {
  pool.query("SELECT title, inventory FROM products WHERE id = ?", [req.body.productId], (err, results) => {
    if (results[0].inventory > 0) {
      if (req.isAuthenticated()) {
        pool.query("INSERT INTO carts (user_id, session_id, product_id, quantity) VALUES (?, ?, ?, 1) ON DUPLICATE KEY UPDATE quantity=quantity+1, user_id = ?", [req.session.userId, req.sessionID, req.body.productId, req.session.userId]);
      } else {
        req.session.anonCart = true;
        pool.query("INSERT INTO carts (session_id, product_id, quantity) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE quantity=quantity+1", [req.sessionID, req.body.productId]);
      }
      pool.query("UPDATE products SET inventory=inventory-1 WHERE id = ?", [req.body.productId]);
      pool.query("SELECT id, title FROM products WHERE id = ?", [req.body.productId], (err, results) => {
        req.flash("success", `Successfully added ${results[0].title} to your cart!`);
        res.redirect("back");
        // res.render("products/success", {req, results});
      });
    } else {
      req.flash("error", "Unable to add to cart due to insufficient inventory.");
      res.redirect("/products");
    }
  });
});

// increase quantity +1 of product in cart
app.post("/cart/product/increase", (req, res) => {
  pool.query("SELECT inventory FROM products WHERE id = ?", [req.body.productId], (err, results) => {
    if (results[0].inventory > 0) {
      if (req.isAuthenticated()) {
        pool.query("INSERT INTO carts (user_id, session_id, product_id, quantity) VALUES (?, ?, ?, 1) ON DUPLICATE KEY UPDATE quantity=quantity+1, user_id = ?", [req.session.userId, req.sessionID, req.body.productId, req.session.userId]);
      } else {
        req.session.anonCart = true;
        pool.query("INSERT INTO carts (session_id, product_id, quantity) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE quantity=quantity+1", [req.sessionID, req.body.productId]);
      }
      pool.query("UPDATE products SET inventory=inventory-1 WHERE id = ?", [req.body.productId]);
      res.redirect("/cart");
    } else {
      req.flash("error", "Unable to add to cart due to insufficient inventory.");
      res.redirect("/cart");
    }
  });
});

// decrease quantity -1 of product in cart
app.post("/cart/product/decrease", (req, res) => {
  if (req.isAuthenticated()) {
    pool.query("UPDATE carts SET quantity=quantity-1 WHERE user_id = ? AND product_id = ?", [req.session.userId, req.body.productId]);
  } else if (req.session.anonCart) {
    pool.query("UPDATE carts SET quantity=quantity-1 WHERE session_id = ? AND product_id = ?", [req.sessionID, req.body.productId]);
  }
  pool.query("UPDATE products SET inventory=inventory+1 WHERE id = ?", [req.body.productId]);
  res.redirect("/cart");
});

// remove entire product from cart
app.post("/cart/product/delete", (req, res) => {
  if (req.isAuthenticated()) {
    pool.query("DELETE FROM carts WHERE user_id = ? AND product_id = ? AND quantity=1", [req.session.userId, req.body.productId]);
  } else if (req.session.anonCart) {
    pool.query("DELETE FROM carts WHERE session_id = ? AND product_id = ? AND quantity=1", [req.sessionID, req.body.productId]);
  }
  pool.query("UPDATE products SET inventory=inventory+1 WHERE id = ?", [req.body.productId]);
  req.flash("success", "Item removed from cart.");
  res.redirect("/cart");
});

// checkout cart
app.get("/checkout", (req, res) => {
  res.render("products/checkout", {req});
});


// PRODUCTS
// show products
app.get("/products", (req, res) => {
  pool.query("SELECT * FROM products", (err, results) => {
    if (err) throw err;
    res.render("products/products", {results, req});
  });
});

// new product form
app.get("/products/new", isLoggedIn, (req, res) => {
  res.render("products/new", {req});
});

// submit new product
app.post("/products/new", isLoggedIn, (req, res) => {
  pool.query("INSERT INTO products (title, price, img, inventory, created_by) VALUES (?, ?, ?, ?, ?)", [req.body.title, parseFloat(req.body.price), req.body.img, parseInt(req.body.inventory), req.session.userId]);
  req.flash("success", "New product added!");
  res.redirect("/products");
});

// show details for one product
app.get("/products/:id", (req, res) => {
  pool.query("SELECT id, title, price, img, inventory, created_by, DATE_FORMAT(created_at, '%M %D %Y') AS created_at FROM products WHERE id = ?", [req.params.id], (err, results) => {
    if (err) throw err;
    if (results.length != 0) {
      res.render("products/details", {results, req});
    } else {
      req.flash("error", "Couldn't find that product!");
      res.redirect("/products");
    }
  });
});

// show edit form for one product
app.get("/products/:id/edit", isProductOwner, (req, res) => {
  pool.query("SELECT * FROM products WHERE id = ?", [req.params.id], (err, results) => {
    if (results.length != 0) {
      res.render("products/edit", {req, results});
    } else {
      req.flash("error", "Couldn't find that product!");
      res.redirect("/products");
    }
  });
});

// submit editted product
app.post("/products/:id/edit", isProductOwner, (req, res) => {
  pool.query("UPDATE products SET title = ?, price = ?, img = ?, inventory = ? WHERE id = ?", [req.body.title, parseFloat(req.body.price), req.body.img, parseFloat(req.body.inventory), req.params.id]);
  req.flash("success", "Product updated successfully.");
  res.redirect("/products/" + req.params.id);
});

// delete a product
app.post("/products/:id/delete", isProductOwner, (req, res) => {
  pool.query("DELETE FROM products WHERE id = ?", [req.body.productId]);
  res.redirect("/products");      // to account page with list of your products maybe?
});


app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});