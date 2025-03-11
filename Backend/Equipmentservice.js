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
app.get("/equip", (req, res) => {
    db.query("SELECT * FROM equipment", (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(results);
    });
});

// DELETE user by ID
app.delete("/equip/:id", (req, res) => {
    const id = req.params.id;

    db.query("DELETE FROM equipment WHERE id = ?", [id], (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "User not found!" });
        }

        res.json({ message: "User deleted successfully" });
    });
});

// POST - Add a new user
app.post("/equip", (req, res) => {
    const { name, quantity, vendor, price, contact, place } = req.body;

    // Check if all required fields are provided
    if (!name || !quantity || !vendor || !price || !contact || !place) {
        return res.status(400).json({ message: "All fields are required!" });
    }

    // Check if vendor already exists
    // db.query("SELECT * FROM equipment WHERE vendor = ? && name=?", [vendor,name], (err, results) => {
    //     if (err) {
    //         console.error("Database SELECT error:", err.message); // Improved Debugging
    //         return res.status(500).json({ error: "Database error", details: err.message });
    //     }

    //     if (results.length > 0) {
    //         return res.status(409).json({ message: "Vendor already exists!" });
    //     }

        // Insert new equipment data
        const sql = "INSERT INTO equipment (name, quantity, vendor, price, contact, place) VALUES (?, ?, ?, ?, ?, ?)";
        const values = [name, quantity, vendor, price, contact, place];

        db.query(sql, values, (err, result) => {
            if (err) {
                console.error("Database INSERT error:", err.message); // Improved Debugging
                return res.status(500).json({ error: "Database error", details: err.message });
            }

            console.log("Equipment added successfully:", result);
            res.status(201).json({ message: "Equipment added successfully", id: result.insertId });
        });
    });



// PATCH - Update user by ID
app.patch("/equip/:id", (req, res) => {
    const id = req.params.id;
    const { name, quantity, vendor, price, contact,place } = req.body;

    // Fetch the user first
    db.query("SELECT * FROM equipment WHERE id = ?", [id], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });

        if (results.length === 0) {
            return res.status(404).json({ message: "User not found!" });
        }

        const user = results[0];

        // Update only provided fields
        const updatedUser = {
            name: name || user.name,
            quantity: quantity || user.quantity,
            vendor: vendor || user.vendor,
            price: price || user.price,
            contact: contact || user.contact,
            place: place || user.place
        };

        db.query(
            "UPDATE equipment SET name=?, quantity=?, vendor=?, price=?, contact=?,place=? WHERE id=?",
            [updatedUser.name, updatedUser.quantity, updatedUser.vendor, updatedUser.price, updatedUser.contact,updatedUser.place ,id],
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
