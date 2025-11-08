const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const StoreSchema = new Schema({
  owner: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  name: { 
    type: String, 
    required: true,
    trim: true 
  },
  description: { 
    type: String, 
    default: "لا يوجد وصف بعد." 
  },
  category: { 
    type: String, 
    required: true,
    enum: ["clothes", "accessories", "sweets", "electronics", "other"]
  },
  images: [String],
  logo: { 
    type: String, 
    default: "uploads/stores/default-logo.jpg" 
  },
  address: String, 
  phone: { 
    type: String, 
    required: true, 
    trim: true 
  },
  social: {
    facebook: String,
    instagram: String,
    whatsapp: String,
  },
  rating: { 
    type: Number, 
    default: 0, 
    min: 0, 
    max: 5 
  },
  numReviews: { 
    type: Number, 
    default: 0 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// ✅ Virtual populate للمنتجات التابعة للمتجر
StoreSchema.virtual('productsList', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'store',
});

// ✅ لتضمين الـ virtuals في JSON وObject عند الإرجاع
StoreSchema.set('toJSON', { virtuals: true });
StoreSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Store', StoreSchema);
