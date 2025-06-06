const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");

const app = express();
app.use(express.json());
const port = 5000;

app.use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PATCH", "DELETE"]
}));

// MySQL Database Connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",      // Change this to your MySQL username
    password: "ribai123",      // Change this to your MySQL password
    database: "alpha" // Change this to your MySQL database name
});

// Connect to MySQL
db.connect(err => {
    if (err) {
        console.error("Database connection failed:", err);
        return;
    }
    console.log("Connected to MySQL database");
});



// GET all tusers
app.get("/tusers", (req, res) => {
    db.query("SELECT * FROM trainer", (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(results);
    });
});

// DELETE user by ID
app.delete("/tusers/:id", (req, res) => {
    const id = req.params.id;

    db.query("DELETE FROM trainer WHERE id = ?", [id], (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "User not found!" });
        }

        res.json({ message: "User deleted successfully" });
    });
});

// POST - Add a new user
app.post("/tusers", (req, res) => {
    const { name, age, city, experience, mobile, email } = req.body;

    if (!name || !age || !city || !experience || !mobile || !email) {
        return res.status(400).json({ message: "All fields are required!" });
    }

    // Check if user already exists
    db.query("SELECT * FROM trainer WHERE mobile = ?", [mobile], (err, results) => {
        if (err) {
            console.error("Database SELECT error:", err);  // Debugging
            return res.status(500).json({ error: "Database error" });
        }

        if (results.length > 0) {
            return res.status(409).json({ message: "User with this mobile number already exists!" });
        }

        // Insert new user
        const sql = "INSERT INTO trainer (name, age, city, experience, mobile, email) VALUES (?, ?, ?, ?, ?, ?)";
        const values = [name, age, city, experience, mobile, email];

        db.query(sql, values, (err, result) => {
            if (err) {
                console.error("Database INSERT error:", err);  // Debugging
                return res.status(500).json({ error: "Database error" });
            }

            console.log("User added successfully:", result);
            res.json({ message: "User added successfully", id: result.insertId });
        });
    });
});


// PATCH - Update user by ID
app.patch("/tusers/:id", (req, res) => {
    const id = req.params.id;
    const { name, age, city, experience, mobile,email } = req.body;

    // Fetch the user first
    db.query("SELECT * FROM trainer WHERE id = ?", [id], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });

        if (results.length === 0) {
            return res.status(404).json({ message: "User not found!" });
        }

        const user = results[0];

        // Update only provided fields
        const updatedUser = {
            name: name || user.name,
            age: age || user.age,
            city: city || user.city,
            experience: experience || user.experience,
            mobile: mobile || user.mobile,
        
            email: email || user.email
        };

        db.query(
            "UPDATE trainer SET name=?, age=?, city=?, experience=?, mobile=?,email=? WHERE id=?",
            [updatedUser.name, updatedUser.age, updatedUser.city, updatedUser.experience, updatedUser.mobile,updatedUser.email ,id],
            (err) => {
                if (err) return res.status(500).json({ error: "Database error" });

                res.json({ message: "User updated successfully" });
            }
        );
    });
});

// Start server
app.listen(port, () => {
    console.log(`Running on port ${port}`);
});
