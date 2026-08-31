import express from 'express';
import multer from 'multer';
import path from 'path';
import { Product } from '../models/Product.js'; 
import {Category} from '../models/Category.js'; // ✅ FIXED: Removed curly braces to match default export and prevent crash

const router = express.Router();

// 📁 Multer Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, 'uploads/'); },
  filename: (req, file, cb) => { cb(null, `${Date.now()}${path.extname(file.originalname)}`); }
});
const upload = multer({ storage: storage });

/* ==========================================
   📦 PRODUCTS APIS
   ========================================== */

// 1. Get All Products
router.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
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

    const newProduct = new Product({
      name,
      price: Number(price),
      costPrice: Number(costPrice || 0),
      stock: Number(stock || 0),
      category: category.trim(),
      description,
      image: `/uploads/${req.file.filename}`
    });

    await newProduct.save();
    res.status(201).json({ success: true, message: 'Product added successfully!', data: newProduct });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. Update Existing Product Info
// ✅ FIXED: Added missing '/api' prefix to match frontend fetch requests correctly
router.put('/api/products/update/:id', upload.single('image'), async (req, res) => {
  try {
    const productId = req.params.id;
    const { name, price, costPrice, stock, category, description } = req.body;
    
    // Pehle existing product fetch karein taake agar image change na ho toh purani secure rahe
    const existingProduct = await Product.findById(productId);
    if (!existingProduct) {
      return res.status(404).json({ success: false, message: "Product not found!" });
    }

    let imagePath = existingProduct.image;
    if (req.file) {
      imagePath = `/uploads/${req.file.filename}`;
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
