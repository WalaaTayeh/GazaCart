require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');


const authRoutes = require('./routes/auth');
const storeRoutes = require('./routes/stores');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');



const app = express();
app.use(cors({
  origin: ["http://127.0.0.1:5500", "http://localhost:5500"],
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
  credentials: true
}));


app.use(express.json());
app.use((req, res, next) => {
  console.log(`📩 Request to [${req.method}] ${req.originalUrl}`);
  next();
});

app.use(express.static(path.join(__dirname, '../gazacart-frontend')));


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use("/uploads", express.static("uploads"));


app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../gazacart-frontend/index.html'));
});

// Error handler
app.use((err, req, res, next) => {
console.error(err.stack);
res.status(500).json({ error: err.message });
});



// Connect to Mongo
mongoose.connect(process.env.MONGO_URI)
.then(() => {
console.log('✅ Connected to MongoDB');
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})
.catch(err => console.error('MongoDB connection error:', err));