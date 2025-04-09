const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
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



// GET all users
app.get("/users", (req, res) => {
    db.query("SELECT * FROM userdata", (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(results);
    });
});

// DELETE user by ID
app.delete("/users/:id", (req, res) => {
    const id = req.params.id;

    db.query("DELETE FROM userdata WHERE id = ?", [id], (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "User not found!" });
        }

        res.json({ message: "User deleted successfully" });
    });
});

// POST - Add a new user
app.post("/users", (req, res) => {
    const { name, age, city, membertype, plan, mobile, email } = req.body;

    if (!name || !age || !city || !membertype || !mobile || !plan || !email) {
        return res.status(400).json({ message: "All fields are required!" });
    }

    // Check if user already exists
    db.query("SELECT * FROM userdata WHERE mobile = ?", [mobile], (err, results) => {
        if (err) {
            console.error("Database SELECT error:", err);  // Debugging
            return res.status(500).json({ error: "Database error" });
        }

        if (results.length > 0) {
            return res.status(409).json({ message: "User with this mobile number already exists!" });
        }

        // Insert new user
        const sql = "INSERT INTO userdata (name, age, city, membertype, mobile, plan, email) VALUES (?, ?, ?, ?, ?, ?, ?)";
        const values = [name, age, city, membertype, mobile, plan, email];

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
app.patch("/users/:id", (req, res) => {
    const id = req.params.id;
    const { name, age, city, membertype, mobile,plan,email } = req.body;

    // Fetch the user first
    db.query("SELECT * FROM userdata WHERE id = ?", [id], (err, results) => {
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
            membertype: membertype || user.membertype,
            mobile: mobile || user.mobile,
            plan: plan || user.plan,
            email: email || user.email
        };

        db.query(
            "UPDATE userdata SET name=?, age=?, city=?, membertype=?, mobile=?,plan=?,email=? WHERE id=?",
            [updatedUser.name, updatedUser.age, updatedUser.city, updatedUser.membertype, updatedUser.mobile,updatedUser.plan,updatedUser.email ,id],
            (err) => {
                if (err) return res.status(500).json({ error: "Database error" });

                res.json({ message: "User updated successfully" });
            }
        );
    });
});


// signup code

// app.post("/signup", async (req, res) => {
//   const { name, email, password } = req.body;

//   const checkUser = "SELECT * FROM customer WHERE email = ?";
//   db.query(checkUser, [email], async (err, result) => {
//     if (result.length > 0) {
//       return res.status(400).json({ message: "Email already registered" });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);
//     const sql = "INSERT INTO customer (name, email, password) VALUES (?, ?, ?)";
//     db.query(sql, [name, email, hashedPassword], (err, result) => {
//       if (err) return res.status(500).json({ error: "Registration failed" });
//       res.json({ message: "Registration successful" });
//     });
//   });
// });

// Start server
app.listen(port, () => {
    console.log(`Running on port ${port}`);
});
