import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true },
  costPrice: { type: Number, required: true, default: 0 },
  stock: { type: Number, required: true, default: 0 },
  category: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  // 🟢 Multiple images ke liye array define kar diya hai
  images: [{ 
    type: String, 
    get: function(v) {
      if (!v) return v;
      if (v.startsWith('http')) return v;
      return `https://trendvibe-backend-live.onrender.com${v}`;
    }
  }],
}, { 
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true } 
});

export const Product = mongoose.model('Product', productSchema);

export default Product;