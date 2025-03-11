require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const redis = require("redis");

const app = express();
app.use(cors());
app.use(express.json());

// Redis client for token blacklisting
const client = redis.createClient();
client.on("error", (err) => {
  console.error("Redis error:", err);
});
client.connect();

// Database connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root", // Change according to your MySQL user
  password: "ribai123", // Change according to your MySQL password
  database: "alpha",
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
  } else {
    console.log("Connected to MySQL database.");
  }
});

// Signup Endpoint
app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  const checkUser = "SELECT * FROM customer WHERE email = ?";
  db.query(checkUser, [email], async (err, result) => {
    if (result.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = "INSERT INTO customer (name, email, password) VALUES (?, ?, ?)";
    db.query(sql, [name, email, hashedPassword], (err, result) => {
      if (err) return res.status(500).json({ error: "Registration failed" });
      res.json({ message: "Registration successful" });
    });
  });
});

// Login Endpoint
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM customer WHERE email = ?";
  db.query(sql, [email], async (err, results) => {
    if (err || results.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      "your_secret_key",
      { expiresIn: "1h" }
    );

    res.json({ message: "Login successful", token });
  });
});

// Logout Endpoint (Blacklist token)
app.post("/logout", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(400).json({ message: "No token provided" });
  }

  await client.set(token, "blacklisted", "EX", 3600); // Expire in 1 hour

  res.json({ message: "Logout successful" });
});

// Middleware to check if token is blacklisted
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Access denied" });

  const isBlacklisted = await client.get(token);
  if (isBlacklisted) return res.status(401).json({ message: "Token is invalid" });

  jwt.verify(token, "your_secret_key", (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });

    req.user = user;
    next();
  });
};

// Example of a protected route
app.get("/protected", authMiddleware, (req, res) => {
  res.json({ message: "This is a protected route", user: req.user });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
