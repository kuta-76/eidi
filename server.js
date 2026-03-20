const express = require('express');

// Import the Vercel-ready Express app endpoints
const app = require('./api/index.js');

// Only locally serve static files. Vercel automatically serves static files from the root.
app.use(express.static(__dirname));

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Eidi Simulator properly running offline at http://localhost:${PORT}`);
});
