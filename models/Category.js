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

<<<<<<< HEAD
export default Category; 
=======
export default Category; 
>>>>>>> 36a5fee7ab8195b4a1e1f9d144814ae5f6530a1e
