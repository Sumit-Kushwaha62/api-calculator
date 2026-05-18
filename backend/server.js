const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db'); // ← ye add karo

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));

app.get('/', (req, res) => {
  res.json({ message: 'API Calculator Backend running!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server on port ${PORT}`));