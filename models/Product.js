import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true },
  costPrice: { type: Number, required: true, default: 0 },
  stock: { type: Number, required: true, default: 0 },
  category: { type: String, required: true, trim: true }, 
  description: { type: String, required: true },
  image: { type: String, required: true }, 
}, { timestamps: true });

export const Product = mongoose.model('Product', productSchema);
export default Product; // Yeh line add karne se donon tarike ke import safe ho jayenge
