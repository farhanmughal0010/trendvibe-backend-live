import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { Product } from '../models/Product.js'; 
import { Category } from '../models/Category.js';

const router = express.Router();

// ☁️ Cloudinary Configuration (Render Environment Variables uthayega)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// 📁 Multer Storage Configuration for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'trendvibe_products', // Cloudinary par yeh folder ban jayega
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
  },
});

const upload = multer({ storage: storage });

/* ==========================================
   📦 PRODUCTS APIS
   ========================================== */

// 1. Get All Products
router.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    // Cloudinary URLs pehle se complete hote hain, mazeed kuch lagane ki zaroorat nahi
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch products.' });
  }
});

// 2. Add New Product
router.post('/api/products/add', upload.single('image'), async (req, res) => {
  try {
    const { name, price, costPrice, stock, category, description } = req.body;
    if (!req.file) return res.status(400).json({ success: false, message: 'Please upload an image!' });

    // req.file.path mein Cloudinary ka direct secure URL aa jata hai
    const imageUrl = req.file.path;

    const newProduct = new Product({
      name,
      price: Number(price),
      costPrice: Number(costPrice || 0),
      stock: Number(stock || 0),
      category: category.trim(),
      description,
      image: imageUrl
    });

    await newProduct.save();
    res.status(201).json({ success: true, message: 'Product added successfully!', data: newProduct });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. Update Existing Product Info
router.put('/api/products/update/:id', upload.single('image'), async (req, res) => {
  try {
    const productId = req.params.id;
    const { name, price, costPrice, stock, category, description } = req.body;
    
    const existingProduct = await Product.findById(productId);
    if (!existingProduct) {
      return res.status(404).json({ success: false, message: "Product not found!" });
    }

    let imagePath = existingProduct.image;
    // Agar nayi file upload ki gai hai toh Cloudinary ka naya URL assign hoga
    if (req.file) {
      imagePath = req.file.path;
    }

    let updateData = { 
      name: name || existingProduct.name, 
      price: price ? Number(price) : existingProduct.price, 
      costPrice: costPrice !== undefined ? Number(costPrice) : existingProduct.costPrice, 
      stock: stock !== undefined ? Number(stock) : existingProduct.stock, 
      category: category ? category.trim() : existingProduct.category, 
      description: description || existingProduct.description,
      image: imagePath
    };

    const updatedProduct = await Product.findByIdAndUpdate(
      productId, 
      updateData, 
      { new: true, runValidators: true }
    );

    return res.status(200).json({ success: true, message: 'Product updated successfully!', data: updatedProduct });

  } catch (error) {
    console.error("Backend Update Error Detail:", error); 
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 4. Delete Product
router.delete('/api/products/delete/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Product deleted from catalog!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete product.' });
  }
});

/* ==========================================
   🏷️ CUSTOM COLLECTIONS / CATEGORIES APIS
   ========================================== */

// 1. Save New Custom Collection Category
router.post('/api/collections', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: "Category name is required" });
    }

    const existingCategory = await Category.findOne({ name: name.trim() });
    if (existingCategory) {
      return res.status(400).json({ success: false, message: "This collection already exists!" });
    }

    const newCategory = new Category({ name: name.trim() });
    await newCategory.save();

    res.status(201).json({ success: true, message: `Collection "${name}" added successfully!`, data: newCategory });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error occurred while adding collection" });
  }
});

// 2. Fetch All Custom Collections
router.get('/api/collections', async (req, res) => {
  try {
    const categories = await Category.find();
    const categoryNames = categories.map(cat => cat.name);
    res.status(200).json({ success: true, data: categoryNames });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching collections" });
  }
});

export default router;