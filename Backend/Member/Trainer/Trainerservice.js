const cors = require("cors");
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());
const port = 5000;

app.use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PATCH", "DELETE"]
}));

// Define the path to the JSON file
const filePath = path.join(__dirname, "Trainerdata.json");

// Utility function to read users from the JSON file
const readUsersFromFile = () => {
    try {
        const data = fs.readFileSync(filePath, "utf8");
        return data ? JSON.parse(data) : [];
    } catch (err) {
        console.error("Error reading file:", err);
        return [];
    }
};

// Utility function to write users to the JSON file
const writeUsersToFile = (users) => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
        return true;
    } catch (err) {
        console.error("Error writing file:", err);
        return false;
    }
};

// GET all users
app.get("/tusers", (req, res) => {
    const users = readUsersFromFile();
    res.json(users);
});

// DELETE user by ID
app.delete("/tusers/:id", (req, res) => {
    let id = req.params.id;  

    fs.readFile(filePath, "utf8", (err, data) => {
        if (err) {
            return res.status(500).json({ error: "Failed to read file" });
        }

        let users = JSON.parse(data);
        let filteredUsers = users.filter((user) => String(user.id) !== id);

        if (filteredUsers.length === users.length) {
            return res.status(404).json({ message: "User not found!" });
        }

        fs.writeFile(filePath, JSON.stringify(filteredUsers, null, 2), (writeErr) => {
            if (writeErr) {
                return res.status(500).json({ error: "Failed to update file" });
            }
            res.json({ message: "User deleted successfully", users: filteredUsers });
        });
    });
});

// POST - Add a new user
app.post("/tusers", (req, res) => {
    let { name, age, city, experience, mobile} = req.body;

    if (!name || !age || !city || !experience || !mobile) {
        return res.status(400).json({ message: "All fields are required!" });
    }

    let users = readUsersFromFile();

    let existingUser = users.find(user => user.mobile === mobile);
    if (existingUser) {
        return res.status(409).json({ message: "User with this mobile number already exists!" });
    }

    let newUser = { id: Date.now(), name, age, city, experience, mobile };
    users.push(newUser);

    if (writeUsersToFile(users)) {
        res.json({ message: "User details added successfully", user: newUser });
    } else {
        res.status(500).json({ message: "Failed to save user data" });
    }
});

// PATCH - Update user by ID
app.patch("/tusers/:id", (req, res) => {
    const id = req.params.id;
    const updatedData = req.body;

    let users = readUsersFromFile();
    let userIndex = users.findIndex(user => String(user.id) === id);

    if (userIndex === -1) {
        return res.status(404).json({ message: "User not found!" });
    }

    // Update user data
    users[userIndex] = { ...users[userIndex], ...updatedData };

    if (writeUsersToFile(users)) {
        res.json({ message: "User updated successfully", user: users[userIndex] });
    } else {
        res.status(500).json({ message: "Failed to update user data" });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Running on port ${port}`);
});
