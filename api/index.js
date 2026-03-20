const express = require('express');
const app = express();
app.use(express.json());

// We use JSONBlob as a completely free, 0-setup database.
const BLOB_ID = '019d0d01-f20b-7e6b-a4d8-6b58fb7b2918';
const DB_URL = `https://jsonblob.com/api/jsonBlob/${BLOB_ID}`;

// Helper: Fetch current DB state from Cloud
async function getDB() {
    try {
        const response = await fetch(DB_URL, {
            headers: { 'Accept': 'application/json' }
        });
        if (!response.ok) throw new Error('Failed to fetch DB');
        return await response.json();
    } catch (err) {
        console.error("DB Fetch Error:", err);
        // Fallback exact fresh DB if it fails temporarily
        return [
            { name: "Amna Azeem", type: "bro", opened: false },
            { name: "Amna Ano", type: "bro", opened: false },
            { name: "Aliha G", type: "friend", opened: false }
        ];
    }
}

// Helper: Securely update DB state to Cloud
async function updateDB(data) {
    try {
        await fetch(DB_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        });
    } catch (err) {
        console.error("DB Update Error:", err);
    }
}

// Verify endpoint
app.post('/api/verify', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: "Name is required" });

        const db = await getDB();
        const user = db.find(u => u.name.toLowerCase().trim() === name.toLowerCase().trim());

        if (user) {
            res.json({ success: true, user });
        } else {
            res.status(404).json({ error: "Name not found in our records." });
        }
    } catch (err) {
        return res.status(500).json({ error: "Server error: " + err.message });
    }
});

// Update status endpoint upon opening envelope
app.post('/api/open', async (req, res) => {
    try {
        const { name } = req.body;
        const db = await getDB();
        const userIndex = db.findIndex(u => u.name.toLowerCase().trim() === name.toLowerCase().trim());

        if (userIndex > -1) {
            db[userIndex].opened = true;
            await updateDB(db); // Push instantly to cloud DB
            res.json({ success: true });
        } else {
            res.status(404).json({ error: "User not found" });
        }
    } catch (err) {
        res.status(500).json({ error: "Server error updating DB: " + err.message });
    }
});

// Admin Dashboard data endpoint
app.get('/api/admin/data', async (req, res) => {
    try {
        res.json(await getDB());
    } catch (err) {
        res.status(500).json({ error: "Server error endpoint" });
    }
});

// Required for cleanly exporting to Vercel instances
module.exports = app;
