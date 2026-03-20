const express = require('express');
const { kv } = require('@vercel/kv');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const LOCAL_DB = path.join(__dirname, '../db.json');

// Get Data natively from Cloud (Vercel) OR Fallback Local Storage
async function getDB() {
    if (process.env.KV_REST_API_URL) {
        let db = await kv.get('eidi_users');
        if (!db) {
            // Seed cloud DB if empty
            db = [
                { name: "Amna Azeem", type: "bro", opened: false },
                { name: "Amna Ano", type: "bro", opened: false },
                { name: "Aliha G", type: "friend", opened: false }
            ];
            await kv.set('eidi_users', db);
        }
        return db;
    } else {
        return JSON.parse(fs.readFileSync(LOCAL_DB, 'utf8'));
    }
}

// Write changes securely
async function updateDB(data) {
    if (process.env.KV_REST_API_URL) {
        await kv.set('eidi_users', data);
    } else {
        fs.writeFileSync(LOCAL_DB, JSON.stringify(data, null, 2), 'utf8');
    }
}

// Verify endpoint
app.post('/verify', async (req, res) => {
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
        res.status(500).json({ error: "Server error: " + err.message });
    }
});

// Update status endpoint
app.post('/open', async (req, res) => {
    try {
        const { name } = req.body;
        const db = await getDB();
        const userIndex = db.findIndex(u => u.name.toLowerCase().trim() === name.toLowerCase().trim());

        if (userIndex > -1) {
            db[userIndex].opened = true;
            await updateDB(db);
            res.json({ success: true });
        } else {
            res.status(404).json({ error: "User not found" });
        }
    } catch (err) {
        res.status(500).json({ error: "Server error updating DB: " + err.message });
    }
});

// Admin data endpoint
app.get('/admin/data', async (req, res) => {
    try {
        res.json(await getDB());
    } catch (err) {
        res.status(500).json({ error: "Server error: " + err.message });
    }
});

// Important: export the app for Vercel
module.exports = app;
