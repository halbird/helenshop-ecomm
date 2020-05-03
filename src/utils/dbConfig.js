const mysql = require("mysql"); 

const options = {
  host: localhost,
  user: helen,
  password: ZKstIDDnueBxgiloSci3t8Jd70Cm5B,
  database: helenshop
};

const connection = mysql.createConnection(options);

connection.connect((err) => {
  if (err) {
    console.log(err, err.code);
  } else {
    console.log("Connected to DB");
  }
});

module.exports = connection;