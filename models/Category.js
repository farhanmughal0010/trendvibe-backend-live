import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true, 
    trim: true
  }
}, { timestamps: true });

// Yahan hum named export use kar rahe hain taake { Category } kaam kare
export const Category = mongoose.model('Category', categorySchema);

export default Category; 
