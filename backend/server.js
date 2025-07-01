const express = require("express");
const mysql2 = require("mysql2");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

// db connection

const db = mysql2.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "user_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

db.getConnection((err) => {
  if (err) {
    console.log("Database connection failed", err);
  } else {
    console.log("Connected to MySQL database");
  }
});

//Register

app.post("/register", async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const checkUserSql = "SELECT * FROM users WHERE username = ?";
  db.query(checkUserSql, [username], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });

    if (results.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    const insertUserSql = "INSERT INTO users (username, password, role) VALUES (?,?, ?)";
    db.query(insertUserSql, [username, hashedPassword, role], (err, result) => {
      if (err) return res.status(500).json({ message: "Registration Failed" });

      res.status(201).json({ message: "User registered Successfully" });
    });
  });
});


// Login User
// Login User
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const sql = "SELECT * FROM users WHERE username = ?";
  db.query(sql, [username], async (err, results) => {
    if (err || results.length === 0) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },  // role is included in the token
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Log to confirm that role is included in the response
    console.log("Login response:", { token, username: user.username, role: user.role });

    // Send the role along with username and token in the response
    res.json({
      message: "Login successful",
      token,
      username: user.username,
      role: user.role, // Ensure this is being sent back
    });
  });
});





app.listen(5000, () => {
  console.log("Server is running on Port 5000");
});