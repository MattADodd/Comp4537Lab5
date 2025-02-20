// ChatGPT was used to help make some of the code below
const API_URL = "https://whale-app-mzuef.ondigitalocean.app/lab5/api/v1/sql/";
import { messages } from "../lang/messages/en/messages.js";
// Sample patient data to be inserted into the database
const patients = [
    { name: "Sara Brown", dateOfBirth: "1901-01-01" },
    { name: "John Smith", dateOfBirth: "1941-01-01" },
    { name: "Jack Ma", dateOfBirth: "1961-01-30" },
    { name: "Elon Musk", dateOfBirth: "1999-01-01" }
];

// Function to insert sample patients into the database
function insertPatients() {
    fetch(`${API_URL}`, {
        method: "POST", // HTTP method to insert data
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patients), // Send all patients as an array
    })
    .then(res => res.json()) // Parse the response as JSON
    .then(results => {
        // Display the API response in the UI
        document.getElementById("response").innerText = JSON.stringify(results, null, 2);
    })
    .catch(err => console.error(err)); // Handle any errors
}

  
// Function to execute user-provided SQL queries
function executeQuery() {
    const query = document.getElementById("sqlQuery").value.trim(); // Get query from input field

    if (query.toUpperCase().startsWith("SELECT")) { // Handle SELECT queries
        fetch(`${API_URL}${encodeURIComponent(query)}`) // Send GET request with the query
            .then(res => res.json()) // Parse response as JSON
            .then(data => {
                document.getElementById("response").innerText = JSON.stringify(data, null, 2); // Display response
            })
            .catch(err => console.error(messages.selectError, err)); // Handle errors
    } else if (query.toUpperCase().startsWith("INSERT")) { // Handle INSERT queries
        fetch(`${API_URL}`, {
            method: "POST", // HTTP method to insert data
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query }) // Send query as JSON payload
        })
        .then(res => res.json()) // Parse response as JSON
        .then(data => {
            document.getElementById("response").innerText = JSON.stringify(data, null, 2); // Display response
        })
        .catch(err => console.error(messages.insertError, err)); // Handle errors
    } else {
        alert(messages.invalideQuery); // Alert user if query is invalid
    }
} 

// Event listener for the insert button to trigger patient insertion
document.getElementById("insertButton").addEventListener("click", function () {
    insertPatients();
});

// Event listener for the execute button to trigger SQL execution
document.getElementById("executeButton").addEventListener("click", function () {
    executeQuery();
});