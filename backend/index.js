const { app } = require('./server');
const express = require('express');
const employerStats = require('./employerStats');
const candidateStats = require('./candidateStats');
// const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(employerStats);
app.use(candidateStats);

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });
// Port listening is handled in server.js
