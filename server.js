require("dotenv").config();
const http = require("http");
const mysql = require("mysql2");
const url = require("url");
const GET_TABLE = "SHOW TABLES LIKE 'Patients'";
const CREATE_TABLE = `
      CREATE TABLE Patients (
        id INT(11) AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        dateOfBirth DATE NOT NULL
      ) ENGINE=InnoDB;
    `;
let tableCreating = false;

// Create MySQL connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 25060,
  ssl: process.env.DB_SSL === 'REQUIRED' ? { rejectUnauthorized: false } : null
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
    process.exit(1);
  }
  console.log("Connected to MySQL database");
});

// Create HTTP server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const { pathname } = parsedUrl;

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  db.query(GET_TABLE, (err, results) => {
    if (err) {
      console.error("Error checking table existence:", err);
      return;
    }

    if (results.length === 0 && !tableCreating) {
      tableCreating = true;
      db.query(CREATE_TABLE, (err, result) => {
        tableCreating = false;
        if (err) {
          console.error("Error creating table:", err);
          return;
        }
        console.log(`Table Patients created with InnoDB engine.`);
      });
    }
    // Set common response headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST");
  res.setHeader("Content-Type", "application/json");

  // Handle GET request for executing queries (Only SELECT allowed)
  if (req.method === "GET" && pathname.startsWith("/api/v1/sql/")) {
    const sqlQuery = decodeURIComponent(pathname.replace("/api/v1/sql/", ""));

    if (!sqlQuery.toUpperCase().startsWith("SELECT")) {
      res.writeHead(400);
      return res.end(JSON.stringify({ error: "Only SELECT queries are allowed" }));
    }

    db.query(sqlQuery, (err, results) => {
      if (err) {
        res.writeHead(500);
        return res.end(JSON.stringify({ error: err.message }));
      }
      res.writeHead(200);
      res.end(JSON.stringify(results));
    });
  }

  // Handle POST request for inserting a patient
  else if (req.method === "POST" && pathname === "/api/v1/sql/") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        const patient = JSON.parse(body); // Expecting a single patient object
        console.log(patient);

        if (!patient.name || !patient.dateOfBirth) {
          if (patient.query) {
            const sql = patient.query;
            db.query(sql, (err, result) => {
              if (err) {
                res.writeHead(500);
                return res.end(JSON.stringify({ error: err.message }));
              }
              res.writeHead(201);
              res.end(JSON.stringify({ message: "Patient added", insertedId: result.insertId }));
            });
            return;
          }

          res.writeHead(400);
          return res.end(JSON.stringify({ error: "Missing name or dateOfBirth" }));
        }

        const sql = "INSERT INTO Patients (name, dateOfBirth) VALUES (?, ?)";
        db.query(sql, [patient.name, patient.dateOfBirth], (err, result) => {
          if (err) {
            res.writeHead(500);
            return res.end(JSON.stringify({ error: err.message }));
          }
          res.writeHead(201);
          res.end(JSON.stringify({ message: "Patient added", insertedId: result.insertId }));
        });
      } catch (error) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: "Invalid JSON format" }));
      }
    });
  }

  // Handle 404 Not Found
  else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: "Route not found" }));
  }
  });

  
});

// Start server on port 3000
server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});