const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// عناصر الطلب
const OrderItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product' },
  name: String,
  price: Number,
  quantity: Number,
  store: { type: Schema.Types.ObjectId , ref: 'Store' }
});

// الطلب
const OrderSchema = new Schema({
  customer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  items: [OrderItemSchema],
  totalPrice: Number,

  // بيانات الزبون
  fullName: { type: String, required: true },  
  address: { type: String, required: true },   
  phone: { type: String, required: true },      
  altPhone: { type: String },  

// الدفع
  paymentMethod: { type: String, enum: ['cash', 'bank'], default: 'cash' }, 
  paymentProof: { type: String }, // مسار صورة الإشعار (اختياري)
  isPaid: { type: Boolean, default: false },

// حالة الطلب
  status: { 
    type: String, 
    enum: ["pending","processing","shipped","delivered","cancelled","paid","completed"], 
    default: 'pending' 
  },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);
