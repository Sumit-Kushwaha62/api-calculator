const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/calculate', require('./routes/calculate'));

app.get('/', (req, res) => {
  res.json({ message: 'API Calculator Backend running!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server on port ${PORT}`));


/* 

eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoxfSwiaWF0IjoxNzc5MDk1NTU5LCJleHAiOjE3Nzk3MDAzNTl9.zn4HlISZbU39erdi-q3ahkSi07C2IXXCkFFrZ2mGOds

*/
