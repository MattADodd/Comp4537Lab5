const API_URL = "https://your-server2-url.com/api/v1"; // Change this to your actual backend URL
const messages = require("./lang/messages/en/messages"); // Import message constants for responses
const patients = [
    { name: "Sara Brown", dateOfBirth: "1901-01-01" },
    { name: "John Smith", dateOfBirth: "1941-01-01" },
    { name: "Jack Ma", dateOfBirth: "1961-01-30" },
    { name: "Elon Musk", dateOfBirth: "1999-01-01" }
];

function insertPatients() {
    Promise.all(
        patients.map(patient =>
            fetch(`${API_URL}/insert`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(patient),
            })
            .then(res => res.json())
        )
    )
    .then(results => {
        document.getElementById("response").innerText = JSON.stringify(results, null, 2);
    })
    .catch(err => console.error(err));
}
  
function executeQuery() {
}  

document.getElementById("insertButton").addEventListener("click", function () {
    insertPatients();
    });

document.getElementById("executeButton").addEventListener("click", function () {
    executeQuery();
    });