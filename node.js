require("dotenv").config();
const http = require("http");
const mysql = require("mysql2");
const url = require("url");

// Create MySQL connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.PORT
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
  const { pathname, query } = parsedUrl;

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });
    res.end();
    return;
  }

  // Set common response headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "*");
  res.setHeader("Content-Type", "application/json");

  // Handle GET request for executing queries
  if (req.method === "GET") {
    const sqlQuery = decodeURIComponent();

    db.query(sqlQuery, (err, results) => {
      if (err) {
        res.writeHead(500);
        return res.end(JSON.stringify({ error: err.message }));
      }
      res.writeHead(200);
      res.end(JSON.stringify(results));
    });
  }

  // Handle POST request for inserting patients
  else if (req.method === "POST") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        const patients = JSON.parse(body);

        if (!Array.isArray(patients)) {
          res.writeHead(400);
          return res.end(JSON.stringify({ error: "Invalid input, expected an array" }));
        }

        const values = patients.map(p => [p.name, p.dateOfBirth]);
        const sql = "INSERT INTO Patients (name, dateOfBirth) VALUES ?";

        db.query(sql, [values], (err, result) => {
          if (err) {
            res.writeHead(500);
            return res.end(JSON.stringify({ error: err.message }));
          }
          res.writeHead(201);
          res.end(JSON.stringify({ message: "Patients added", insertedRows: result.affectedRows }));
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

// Start server on port 3000
server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
