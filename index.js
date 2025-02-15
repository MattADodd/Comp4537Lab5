const API_URL = "http://localhost:3000"; // Change this to your actual backend URL
import { messages } from "./lang/messages/en/messages.js";
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
    const query = document.getElementById("sqlQuery").value.trim();

    if (query.toUpperCase().startsWith("SELECT")) {
        fetch(`${API_URL}/api/sql/${encodeURIComponent(query)}`)
            .then(res => res.json())
            .then(data => {
                document.getElementById("response").innerText = JSON.stringify(data, null, 2);
            })
            .catch(err => console.error(messages.selectError, err));
    } else if (query.toUpperCase().startsWith("INSERT")) {
        fetch(`${API_URL}/insert`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query })
        })
        .then(res => res.json())
        .then(data => {
            document.getElementById("response").innerText = JSON.stringify(data, null, 2);
        })
        .catch(err => console.error(messages.insertError, err));
    } else {
        alert(messages.invalideQuery);
    }
} 

document.getElementById("insertButton").addEventListener("click", function () {
    insertPatients();
});

document.getElementById("executeButton").addEventListener("click", function () {
    executeQuery();
});