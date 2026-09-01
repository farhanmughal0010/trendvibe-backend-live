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
<<<<<<< HEAD
export default Product; // Yeh line add karne se donon tarike ke import safe ho jayenge
=======
export default Product; // Yeh line add karne se donon tarike ke import safe ho jayenge
>>>>>>> 36a5fee7ab8195b4a1e1f9d144814ae5f6530a1e
