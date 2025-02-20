const http = require("http");
const url = require("url");
const db = require("../modules/dbHandler.js"); // Import the database handler module
import { messages } from "../lang/messages/en/messages.js";


// SQL query to check if the "Patients" table exists
const GET_TABLE = "SHOW TABLES LIKE 'Patients'";

// SQL query to create the "Patients" table if it does not exist
const CREATE_TABLE = `
  CREATE TABLE Patients (
    id INT(11) AUTO_INCREMENT PRIMARY KEY,  
    name VARCHAR(100) NOT NULL,             
    dateOfBirth DATE NOT NULL               
  ) ENGINE=InnoDB;                          
`;

let tableCreating = false; // Flag to prevent multiple table creation attempts

// Create HTTP server
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const { pathname } = parsedUrl;

  // Handle CORS preflight requests (for cross-origin support)
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
    // Check if the "Patients" table exists
    const results = await db.query(GET_TABLE);
    if (results.length === 0 && !tableCreating) {
      tableCreating = true;
      await db.query(CREATE_TABLE); // Create table if it doesn't exist
      console.log("Table Patients created with InnoDB engine.");
      tableCreating = false;
    }
  } catch (error) {
    console.error("Error checking table existence:", error);
    res.writeHead(500);
    return res.end(JSON.stringify({ error: messages.dbError }));
  }

  // Set common response headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST");
  res.setHeader("Content-Type", "application/json");

  // Handle GET request for executing SQL queries (Only SELECT queries are allowed)
  if (req.method === "GET" && pathname.startsWith("/api/v1/sql/")) {
    const sqlQuery = decodeURIComponent(pathname.replace("/api/v1/sql/", "")); // Extract query from URL

    // Ensure only SELECT queries are executed
    if (!sqlQuery.toUpperCase().startsWith("SELECT")) {
      res.writeHead(404);
      return res.end(JSON.stringify({ error: messages.selectOnly }));
    }

    try {
      const results = await db.query(sqlQuery); // Execute the SELECT query
      res.writeHead(200);
      res.end(JSON.stringify(results)); // Return query results as JSON
    } catch (error) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: error.message }));
    }
  }

  // Handle POST request for inserting multiple patients
  else if (req.method === "POST" && pathname === "/api/v1/sql/") {
    let body = "";

    // Collect request body data
    req.on("data", (chunk) => (body += chunk.toString()));

    req.on("end", async () => {
      try {
        const patients = JSON.parse(body); // Parse JSON data
        console.log(patients);

        // Validate that the data is an array and contains valid patient objects
        if (!Array.isArray(patients) || !patients.every(patient => patient.name && patient.dateOfBirth)) {
          // If data is a query, send it to the db no parsing required
          if (patients.query){
            const query = patients.query;
            await db.query(query);
            res.writeHead(201);
            res.end(JSON.stringify({ message: messages.success }));
            return;
          }
        }

        // Prepare SQL statement with multiple placeholders for batch insert
        const values = patients.flatMap(patient => [patient.name, patient.dateOfBirth]);
        const placeholders = patients.map(() => "(?, ?)").join(", ");
        const sql = `INSERT INTO Patients (name, dateOfBirth) VALUES ${placeholders}`;

        // Execute the bulk insert query
        const result = await db.query(sql, values);

        // Generate response with inserted patient IDs (assuming auto-increment)
        const insertedIdsStart = result.insertId;
        const insertedPatients = patients.map((patient, index) => ({
          id: insertedIdsStart + index, // Assign sequential IDs based on auto-increment
          name: patient.name,
          dateOfBirth: patient.dateOfBirth,
        }));

        res.writeHead(201);
        res.end(JSON.stringify({ message: messages.success, patients: insertedPatients }));
      } catch (error) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  }

  // Handle 404 for unrecognized routes
  else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: messages.routeNotFound }));
  }
});

// Start the server on port 3000
server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
