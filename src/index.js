const dotenv = require("dotenv");
dotenv.config();

const HOST = process.env.HOST;
const USER = process.env.USER;
const PASSWORD = process.env.PASSWORD;
const DATABASE = process.env.DATABASE;


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

// -------------- for refactor into separate files ---------
// const routerNames = require("files with routers");
// const authRouter = require("./routes/auth");
// const accountRouter = require("./routes/account");

// app.use(routerNames); when separate routers out
// app.use(authRouter);
// app.use(accountRouter);
// -----------------------------------------------------------

const {isLoggedIn} = require("./middlewares/isLoggedIn");
const {requireFname, requireLname, requireEmail, requirePassword} = require("./utils/validators");
const app = express();

// const connection = require("../src/utils/dbConfig");

app.set("view engine", "pug");
app.use("/public", express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));


const options = {
  host: HOST,
  user: USER,
  password: PASSWORD,
  database: DATABASE
};

const connection = mysql.createConnection(options);

connection.connect((err) => {
  if (err) {
    console.log(err, err.code);
  } else {
    console.log("Connected to DB");
  }
});

const sessionStore = new MySQLStore({port: 3306},connection);
app.use(session({
  secret: "K4`8;`Slldq^.&83K900UyvQ:%:4M",
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
    connection.query("SELECT * FROM users WHERE email = ?", [email], async (err, rows) => {
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
    connection.query(`INSERT INTO users (fname, lname, email, password, salt) VALUES ("${newUser.fname}", "${newUser.lname}", "${newUser.email}", "${newUser.password}", "${newUser.salt}")`, (err, rows) => {
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
      connection.query("SELECT * FROM users WHERE email = ?", [email], async (err, rows) => {
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
    connection.query(`SELECT * FROM products WHERE id=${req.params.id}`, (err, results) => {
      if (results[0].created_by === req.session.userId) {
        productOwner = true;
      } else {
        productOwner = false;
      }
    })
  } else {
    productOwner = false;
  }
  next();
};


// dashboard
app.get("/", (req, res) => {
  if (req.session.anonCart && req.session.userId) {
    connection.query(`SELECT * FROM carts WHERE user_id=${req.session.userId}`, (err, result) => {
      if (result.length != 0) {
        connection.query(`DELETE FROM carts WHERE session_id="${req.sessionID}"`);
        req.session.anonCart = false;
        req.flash("success", "Here's your cart from last time.");
      } else {
        connection.query(`UPDATE carts SET user_id=${req.session.userId} WHERE session_id="${req.sessionID}"`);
        req.session.anonCart = false;
        req.flash("success", "Here's what you have so far.");
      }
      res.redirect("/cart");
    });
  } else {
    res.render("dashboard", {req});
  }
  console.log(req.sessionID);
});

// signup
app.get("/signup", (req, res) => {
  res.render("signup", {req});
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
  res.render("signin", {req});
});

app.post("/signin", passport.authenticate("local-signin", {
  successRedirect: "/",
  failureRedirect: "/signin",
  failureFlash: true,
  successFlash: "Welcome!"
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
  connection.query(`SELECT * FROM users WHERE id=${req.session.userId}`, (err, results) => {
    if (err) {throw err}
    res.render("account", {results, req})
  });
});

// show cart
app.get("/cart", (req, res) => {
  if (req.isAuthenticated()) {
    connection.query(`SELECT user_id, quantity, product_id, title, price, img, inventory FROM products LEFT JOIN carts ON products.id = carts.product_id HAVING carts.user_id=${req.session.userId}`, (err, results) => {
      if(err) throw err;
      res.render("cart", {results, req});
    });
  } else if (req.session.anonCart) {
    connection.query(`SELECT session_id, quantity, product_id, title, price, img, inventory FROM products LEFT JOIN carts ON products.id = carts.product_id HAVING carts.session_id="${req.sessionID}"`, (err, results) => {
      if(err) throw err;
      res.render("cart", {results, req});
    });
  } else {
    res.render("cart", {req});
  }
});

// add 1 quantity of product to cart from products page
app.post("/cart/product/add", (req, res) => {
  connection.query(`SELECT inventory FROM products WHERE id=${req.body.productId};`, (err, results) => {
    if (results[0].inventory > 0) {
      if (req.isAuthenticated()) {
        connection.query(`INSERT INTO carts (user_id, session_id, product_id, quantity) VALUES (${req.session.userId}, "${req.sessionID}", ${req.body.productId}, 1) ON DUPLICATE KEY UPDATE quantity=quantity+1, user_id=${req.session.userId};`);
      } else {
        req.session.anonCart = true;
        connection.query(`INSERT INTO carts (session_id, product_id, quantity) VALUES ("${req.sessionID}", ${req.body.productId}, 1) ON DUPLICATE KEY UPDATE quantity=quantity+1;`);
      }
      connection.query(`UPDATE products SET inventory=inventory-1 WHERE id=${req.body.productId};`);
      connection.query(`SELECT id, title FROM products WHERE id=${req.body.productId}`, (err, results) => {
        res.render("products/success", {req, results});
      });
    } else {
      req.flash("error", "Unable to add to cart due to insufficient inventory.");
      res.redirect("/products");
    }
  });
});

// increase quantity +1 of product in cart
app.post("/cart/product/increase", (req, res) => {
  connection.query(`SELECT inventory FROM products WHERE id=${req.body.productId};`, (err, results) => {
    if (results[0].inventory > 0) {
      if (req.isAuthenticated()) {
        connection.query(`INSERT INTO carts (user_id, session_id, product_id, quantity) VALUES (${req.session.userId}, "${req.sessionID}", ${req.body.productId}, 1) ON DUPLICATE KEY UPDATE quantity=quantity+1, user_id=${req.session.userId};`);
      } else {
        req.session.anonCart = true;
        connection.query(`INSERT INTO carts (session_id, product_id, quantity) VALUES ("${req.sessionID}", ${req.body.productId}, 1) ON DUPLICATE KEY UPDATE quantity=quantity+1;`);
      }
      connection.query(`UPDATE products SET inventory=inventory-1 WHERE id=${req.body.productId};`);
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
    connection.query(`UPDATE carts SET quantity=quantity-1 WHERE user_id=${req.session.userId} AND product_id=${req.body.productId}`);
  } else if (req.session.anonCart) {
    connection.query(`UPDATE carts SET quantity=quantity-1 WHERE session_id="${req.sessionID}" AND product_id=${req.body.productId}`);
  }
  connection.query(`UPDATE products SET inventory=inventory+1 WHERE id=${req.body.productId};`);
  res.redirect("/cart");
});

// remove entire product from cart
app.post("/cart/product/delete", (req, res) => {
  if (req.isAuthenticated()) {
    connection.query(`DELETE FROM carts WHERE user_id=${req.session.userId} AND product_id=${req.body.productId} AND quantity=1`);
  } else if (req.session.anonCart) {
    connection.query(`DELETE FROM carts WHERE session_id="${req.sessionID}" AND product_id=${req.body.productId} AND quantity=1`);
  }
  connection.query(`UPDATE products SET inventory=inventory+1 WHERE id=${req.body.productId};`);
  req.flash("success", "Item removed from cart.");
  res.redirect("/cart");
});

// checkout cart
app.get("/checkout", (req, res) => {
  res.render("products/checkout", {req});
});

// show products
app.get("/products", (req, res) => {
  connection.query("SELECT * FROM products", (err, results) => {
    if (err) throw err;
    res.render("products/products", {results, req});
  });
});

// new product form
app.get("/products/new", isLoggedIn, (req, res) => {
  res.render("products/new", {req});
});

// submit new product
app.post("/products/new", (req, res) => {
  connection.query(`INSERT INTO products (title, price, img, inventory) VALUES ("${req.body.title}", ${parseFloat(req.body.price)}, "${req.body.img}", ${parseInt(req.body.inventory)});`);
  req.flash("success", "New product added!");
  res.redirect("/products");
});

// show details for one product
app.get("/products/:id", isProductOwner, (req, res) => {
  connection.query(`SELECT id, title, price, img, inventory, DATE_FORMAT(created_at, "%M %D %Y") AS created_at FROM products WHERE id=${req.params.id}`, (err, results) => {
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
app.get("/products/:id/edit", (req, res) => {
  connection.query(`SELECT * FROM products WHERE id=${req.params.id}`, (err, results) => {
    if (results.length != 0) {
      res.render("products/edit", {req, results});
    } else {
      req.flash("error", "Couldn't find that product!");
      res.redirect("/products");
    }
  });
});

// submit editted product
app.post("/products/:id/edit", (req, res) => {
  connection.query(`UPDATE products SET title="${req.body.title}", price=${parseFloat(req.body.price)}, img="${req.body.img}", inventory=${parseFloat(req.body.inventory)} WHERE id=${req.params.id}`);
  req.flash("success", "Product updated successfully.");
  res.redirect("/products/" + req.params.id);
});

// delete a product
app.post("/products/:id/delete", (req, res) => {      // button should be in account list of products
  connection.query(`DELETE FROM products WHERE id=${req.body.productId}`);
  res.redirect("/products");      // to account page with list of your products
});


// ADD -----------------

// app.post("/account", isLoggedIn, ** edit the info on file)
  //get /:id        (view and edit user info)
  //get /:id/edit
  //post /:id/edit
  //post /:id/delete

app.get("/cart/products/delete", (req, res) => {
  res.send("item removed from cart");
});
// add buttons on cart page for checkout cart and delete cart

// ------------------------------------------------



app.listen(3000, () => {
  console.log("listening on port 3000");
});













// to cleanly close the session store:
// sessionStore.close();