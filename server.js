const http = require("http");
const url = require("url");
const db = require("./modules/dbHandler.js"); // Import the Database class

const GET_TABLE = "SHOW TABLES LIKE 'Patients'";
const CREATE_TABLE = `
  CREATE TABLE Patients (
    id INT(11) AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    dateOfBirth DATE NOT NULL
  ) ENGINE=InnoDB;
`;

let tableCreating = false;

// Create HTTP server
const server = http.createServer(async (req, res) => {
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

  try {
    const results = await db.query(GET_TABLE);
    if (results.length === 0 && !tableCreating) {
      tableCreating = true;
      await db.query(CREATE_TABLE);
      console.log("Table Patients created with InnoDB engine.");
      tableCreating = false;
    }
  } catch (error) {
    console.error("Error checking table existence:", error);
    res.writeHead(500);
    return res.end(JSON.stringify({ error: "Database error" }));
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

    try {
      const results = await db.query(sqlQuery);
      res.writeHead(200);
      res.end(JSON.stringify(results));
    } catch (error) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: error.message }));
    }
  }

  // Handle POST request for inserting a patient
  else if (req.method === "POST" && pathname === "/api/v1/sql/") {
    let body = "";
    req.on("data", (chunk) => (body += chunk.toString()));

    req.on("end", async () => {
      try {
        const patient = JSON.parse(body);
        console.log(patient);

        if (!patient.name || !patient.dateOfBirth) {
          if (patient.query) {
            try {
              await db.query(patient.query);
              res.writeHead(201);
              res.end(JSON.stringify({ message: "Query executed successfully" }));
            } catch (error) {
              res.writeHead(500);
              res.end(JSON.stringify({ error: error.message }));
            }
            return;
          }

          res.writeHead(400);
          return res.end(JSON.stringify({ error: "Missing name or dateOfBirth" }));
        }

        const sql = "INSERT INTO Patients (name, dateOfBirth) VALUES (?, ?)";
        const result = await db.query(sql, [patient.name, patient.dateOfBirth]);

        res.writeHead(201);
        res.end(JSON.stringify({ message: "Patient added", insertedId: result.insertId }));
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
