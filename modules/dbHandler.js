require("dotenv").config();
const mysql = require("mysql2");

class DBHandler {
  constructor() {
    this.connection = null;
    this.connect();
  }

  connect() {
    this.connection = mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: 25060,
      ssl: process.env.DB_SSL === "REQUIRED" ? { rejectUnauthorized: false } : null,
    });

    this.connection.connect((err) => {
      if (err) {
        console.error("Database connection failed:", err);
        setTimeout(() => this.connect(), 5000); // Retry after 5 seconds
      } else {
        console.log("Connected to MySQL database");
      }
    });

    this.connection.on("error", (err) => {
      console.error("MySQL error:", err);
      if (err.code === "PROTOCOL_CONNECTION_LOST") {
        console.log("Reconnecting to database...");
        this.connect(); // Reconnect on connection loss
      } else {
        throw err;
      }
    });
  }

  query(sql, params, callback) {
    this.connection.query(sql, params, (err, results) => {
      callback(err, results);
    });
  }
}

module.exports = new DBHandler();
