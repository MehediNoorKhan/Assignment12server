const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const fs = require('fs');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB setup
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);
let usersCollection;

// Connect to MongoDB
async function run() {
    try {
        await client.connect();
        await client.db("admin").command({ ping: 1 });
        console.log("Connected to MongoDB");

        const db = client.db('blood-donation');
        usersCollection = db.collection('users');
    } catch (error) {
        console.error("MongoDB connection failed:", error);
        process.exit(1); // Exit if Mongo fails
    }
}
run();

// === Routes ===

// Serve districts.json
app.get('/districts', (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync('./districts.json', 'utf-8'));
        const sorted = data.sort((a, b) => a.name.localeCompare(b.name));
        res.json(sorted);
    } catch (err) {
        res.status(500).json({ error: 'Failed to load districts' });
    }
});

// Serve upazilas.json
app.get('/upazilas', (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync('./upazilas.json', 'utf-8'));
        const sorted = data.sort((a, b) => a.name.localeCompare(b.name));
        res.json(sorted);
    } catch (err) {
        res.status(500).json({ error: 'Failed to load upazilas' });
    }
});

// Save user
app.post('/users', async (req, res) => {
    try {
        console.log('Received user data:', req.body);

        const { email, name, photoURL, bloodGroup, districtId, upazilaName } = req.body;

        if (!email || !name) {
            return res.status(400).json({ message: 'Email and name are required' });
        }

        const userData = {
            email,
            name,
            photoURL,
            bloodGroup,
            districtId,
            upazilaName,
            role: 'donor',
            status: 'active',
        };

        const result = await usersCollection.insertOne(userData);
        console.log('User inserted with ID:', result.insertedId);
        res.send(result);
    } catch (err) {
        console.error('Error inserting user:', err);
        res.status(500).json({ error: 'User registration failed' });
    }
});

app.get("/users", async (req, res) => {
    try {
        const users = await usersCollection.find().toArray();
        res.send(users);
    } catch (err) {
        console.error("Failed to fetch users:", err);
        res.status(500).send({ error: "Failed to fetch users" });
    }
});

app.get('/users/:email', async (req, res) => {
    try {
        const email = req.params.email;
        const user = await usersCollection.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


// Default route
app.get('/', (req, res) => {
    res.send('Blood Donation Server Running for Assignment 12');
});

// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
