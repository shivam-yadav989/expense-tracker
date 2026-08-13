const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Transaction = require('./models/Transaction');
const User = require('./models/User');

const app = express();
app.use(express.json());
app.use(cors());

const JWT_SECRET = "shivam_secret_key_123"; 

mongoose.connect('mongodb://127.0.0.1:27017/expense-tracker')
  .then(() => console.log('✅ MongoDB Connected!'))
  .catch(err => console.log('❌ DB Error:', err));

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: "No token, login required" });
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) { res.status(401).json({ message: "Invalid token" }); }
};

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ name, email, password: hashedPassword });
    res.status(201).json({ message: "Registration Successful" });
  } catch (err) { res.status(400).json({ message: "Email already exists" }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { name: user.name } });
  } catch (err) { res.status(500).json({ message: "Login Error" }); }
});

app.get('/api/transactions', auth, async (req, res) => {
  const transactions = await Transaction.find({ user: req.userId });
  res.json(transactions);
});

app.post('/api/transactions', auth, async (req, res) => {
  const newTransaction = await Transaction.create({ ...req.body, user: req.userId });
  res.status(201).json(newTransaction);
});

app.delete('/api/transactions/:id', auth, async (req, res) => {
  await Transaction.findOneAndDelete({ _id: req.params.id, user: req.userId });
  res.json({ message: "Deleted" });
});

app.listen(5000, () => console.log(`🚀 Server on 5000`));