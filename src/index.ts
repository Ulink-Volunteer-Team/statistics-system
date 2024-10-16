import express from 'express';
import { Database } from 'node-sqlite3-wasm';
import bodyParser from 'body-parser';
import { handshake, SessionManger } from './libs/session-manager';
import { AuthenticationManager } from './libs/authentication-manager';

const sessionManager = new SessionManger();
const app = express();
const port = 20090;
const API_VERSION = "0.0.1";

// app.use(bodyParser.json());

// // Connect to SQLite database
// const db = new Database('./students.db')
// console.log('Connected to the SQLite database.');
// // Create table if it doesn't exist
// db.run(`CREATE TABLE IF NOT EXISTS students (
//     id INTEGER PRIMARY KEY,
//     name TEXT NOT NULL,
//     age INTEGER NOT NULL,
//     score REAL NOT NULL
// )`);

// type Student = {
//     id: number;
//     name: string;
//     age: number;
//     score: number;
// };

// // Function to update student in the database (SQL injection protection)
// function updateStudent(student: Student) {
//     const query = `UPDATE students SET name = ?, age = ?, score = ? WHERE id = ?`;
//     return db.run(query, [student.name, student.age, student.score, student.id]);
// }

// function addStudent(student: Student) {
//     const query = `INSERT INTO students (name, age, score) VALUES (?, ?, ?)`;
//     return db.run(query, [student.name, student.age, student.score]);
// }

// app.post('handshake', (req, res) => {
//     const userPublicKey = req.body.userPublicKey;
//     const ip = req.body.ip;
//     res.status(200).json({
//         success: true,
//         api_version: API_VERSION,
//         data: handshake(sessionManager, userPublicKey, ip)
//     });
// });

// // POST route to update a student
// app.post('/db-update-student', (req, res) => {
//     const student = req.body;

//     // Validate input
//     if (Number.isInteger(student.id) || !student.name || !student.age || Number.isInteger(student.score)) {
//         res.status(400).json({ success: false, message: 'Invalid input data' });
//     }

//     console.log(`Updating student with ID ${student.id}`);

//     try {
//         // Update the student in the database
//         const result = updateStudent(student);

//         if (result.changes > 0) {
//             res.json({ success: true, message: `Student with ID ${student.id} updated successfully` });
//             console.log(`Student with ID ${student.id} updated successfully`);
//         } else {
//             res.json({ success: false, message: `No student found with ID ${student.id}` });
//             console.log(`No student found with ID ${student.id}`);
//         }

//     }
//     catch (err) {
//         res.status(500).json({ success: false, message: `Database error: ${err.message}` });
//         console.log(`Database error: ${err.message}`);
//     }
// });

// app.post('/db-add-student', (req, res) => {
//     const student = req.body;

//     // Validate input
//     if (!student.name || !student.age || !student.score) {
//         res.status(400).json({ success: false, message: 'Invalid input data' });
//     }

//     console.log(`Adding student with ID ${student.id}`);

//     try {
//         // Add the student to the database
//         const result = addStudent(student);

//         if (result.changes > 0) {
//             res.json({ success: true, message: `Student with ID ${student.id} added successfully` });
//             console.log(`Student with ID ${student.id} added successfully`);
//         } else {
//             res.json({ success: false, message: `Student with ID ${student.id} already exists` });
//             console.log(`Student with ID ${student.id} already exists`);
//         }

//     }
//     catch (err) {
//         res.status(500).json({ success: false, message: `Database error: ${err.message}` });
//         console.log(`Database error: ${err.message}`);
//     }
// })

// // Placeholder for future authentication (implement later)
// app.get('/auth', (req, res) => {
//     res.status(501).send("Authentication API: Not yet implemented");
//     console.log(`Authentication API: Not yet implemented (requested by ${req.ip})`);
// });

// app.use((req, res) => {
//     res.status(404).send(`Path not found: ${req.url}`);
//     console.log(`Path not found: ${req.url} (requested by ${req.ip})`);
// });


// // Start the Express server
// app.listen(port, '0.0.0.0', () => {
//     console.log(`Server running at ${port} at http`);
// });

(async () => {const inst = new AuthenticationManager();
if(!inst.haveUser('admin')) await inst.addUser('admin', 'password1');
console.log(await inst.haveMatchingUser('admin', 'password'));})()

//inst.updatePassword('admin', 'password1');
