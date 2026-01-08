const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth.routes');
const memeRoutes = require('./routes/meme.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Root route - Serve static HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use('/auth', authRoutes);
app.use('/memes', memeRoutes);
app.use('/admin', adminRoutes);

app.listen(3000, () => {
  console.log('AWS Meme Museum running on port 3000');
});
