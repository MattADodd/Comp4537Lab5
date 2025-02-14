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
  const { pathname } = parsedUrl;

// Handle CORS preflight requests
if (req.method === 'OPTIONS') {
    res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end(); // End the response
    return;
}

  // Handle GET request (Fetch Patients)
  if (req.method === "GET") {
    db.query("SELECT * FROM Patients", (err, results) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "*" });
        return res.end(JSON.stringify({ error: err.message }));
      }
      res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "*" });
      res.end(JSON.stringify(results));
    });
  }

  // Handle POST request (Insert user)
  else if (req.method === "POST") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        const { name, dateOfBirth} = JSON.parse(body);

        if (!name || !email) {
          res.writeHead(400, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "*" });
          return res.end(JSON.stringify({ error: "Name and dateOfBirth are required" }));
        }

        const sql = "INSERT INTO Patients (name, dateOfBirth) VALUES (?, ?)";
        db.query(sql, [name, dateOfBirth], (err, result) => {
          if (err) {
            res.writeHead(500, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "*" });
            return res.end(JSON.stringify({ error: err.message }));
          }
          res.writeHead(201, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: "User added", userId: result.insertId }));
        });
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "*" });
        res.end(JSON.stringify({ error: "Invalid JSON format" }));
      }
    });
  }

  // Handle 404 Not Found
  else {
    res.writeHead(404, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "*" });
    res.end(JSON.stringify({ error: "Route not found" }));
  }
});

// Start server on port 3000
server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
