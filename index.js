import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import multer from 'multer'; // 🟢 Multer import kiya file upload ke liye
import unzipper from 'unzipper'; // 🟢 Unzipper import kiya theme extract karne ke liye
import collectionRoutes from './routes/collectionRoutes.js'; 

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const __dirname = path.resolve();
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Folders verification
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}
if (!fs.existsSync('./uploads/themes')) {
  fs.mkdirSync('./uploads/themes', { recursive: true });
}

// 🌐 MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected Successfully! 🐝');
    initializeSettings();
  })
  .catch((err) => console.error('MongoDB Connection Error ❌:', err));


// 🗄️ Store Settings Schema & Model (Updated for Theme & Dynamic Navigation Settings)
const SettingsSchema = new mongoose.Schema({
  key: { type: String, default: 'global_settings', unique: true },
  currency: { type: String, default: 'Rs' },
  themeSettings: { 
    type: Object,
    default: {
      bannerText: "🚚 Free Shipping across UAE on orders above 200 AED!",
      heroTitle: "Next-Gen Tech & Premium Beauty",
      heroSubtitle: "Experience curated luxury products selected precisely for high-performance lifestyle and timeless aesthetics.",
      accentColor: "#008060"
    }
  },
  // 🟢 Dynamic Header Navigation Links Control for Admin
  navigationItems: {
    type: Array,
    default: [
      { title: "🔥 Best-Selling", targetCategory: "All", type: "category" },
      { title: "⭐ 5-Star", targetCategory: "All", type: "category" },
      { title: "New In", targetCategory: "All", type: "category" }
    ]
  }
});

const Settings = mongoose.model('Settings', SettingsSchema);

// 📦 DYNAMIC ORDERS SCHEMA & MODEL FOR TRENDVIBE
const OrderSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  address: { type: String, required: true },
  items: { type: Array, required: true },
  totalAmount: { type: Number, required: true },
  currency: { type: String, default: 'Rs' },
  fulfillmentStatus: { type: String, default: 'Processing' },
  datePlaced: { type: String, default: () => new Date().toISOString().split('T')[0] }
});

const Order = mongoose.model('Order', OrderSchema);

async function initializeSettings() {
  try {
    const existingSettings = await Settings.findOne({ key: 'global_settings' });
    if (!existingSettings) {
      await Settings.create({ 
        key: 'global_settings', 
        currency: 'Rs',
        themeSettings: {
          bannerText: "🚚 Free Shipping across UAE on orders above 200 AED!",
          heroTitle: "Next-Gen Tech & Premium Beauty",
          heroSubtitle: "Experience curated luxury products selected precisely for high-performance lifestyle and timeless aesthetics.",
          accentColor: "#008060"
        },
        navigationItems: [
          { title: "🔥 Best-Selling", targetCategory: "All", type: "category" },
          { title: "⭐ 5-Star", targetCategory: "All", type: "category" },
          { title: "New In", targetCategory: "All", type: "category" }
        ]
      });
      console.log('🛒 Default Store Settings Initialized (Currency + Theme + Dynamic Nav)');
    }
  } catch (err) {
    console.error('Error initializing settings:', err);
  }
}


// 🌐 1️⃣ GET API: Active settings read karne ke liye (Client & Admin dono use karenge)
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await Settings.findOne({ key: 'global_settings' });
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error fetching settings', error: err.message });
  }
});

// 🌐 2️⃣ POST API: Admin panel se currency update karne ke liye
app.post('/api/settings/update', async (req, res) => {
  const { currency } = req.body;
  if (!currency) {
    return res.status(400).json({ success: false, message: 'Currency token is required' });
  }

  try {
    const updatedSettings = await Settings.findOneAndUpdate(
      { key: 'global_settings' },
      { currency: currency },
      { new: true, upsert: true }
    );
    res.json({ success: true, message: 'Currency updated successfully! 🚀', settings: updatedSettings });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error updating settings', error: err.message });
  }
});

// 🌐 2.1️⃣ POST API: Admin panel se Header Navigation Links update karne ke liye
app.post('/api/settings/update-navigation', async (req, res) => {
  const { navigationItems } = req.body;
  if (!navigationItems || !Array.isArray(navigationItems)) {
    return res.status(400).json({ success: false, message: 'Valid navigation items array is required' });
  }

  try {
    const updatedSettings = await Settings.findOneAndUpdate(
      { key: 'global_settings' },
      { navigationItems: navigationItems },
      { new: true, upsert: true }
    );
    res.json({ success: true, message: 'Navigation links updated successfully! 🔗', settings: updatedSettings });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error updating navigation', error: err.message });
  }
});


// 📦 3️⃣ MULTER SETUP: Theme ZIP Upload config
const themeStorage = multer.diskStorage({
  destination: './uploads/themes/',
  filename: (req, file, cb) => {
    cb(null, 'theme_package.zip');
  }
});
const uploadTheme = multer({ storage: themeStorage });

// 🌐 4️⃣ POST API: Shopify-style ZIP Theme Uploader & Extractor
app.post('/api/settings/upload-theme', uploadTheme.single('theme_zip'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No ZIP theme bundle uploaded.' });
  }

  const zipPath = './uploads/themes/theme_package.zip';
  const extractPath = './uploads/themes/active_theme';

  try {
    if (fs.existsSync(extractPath)) {
      fs.rmSync(extractPath, { recursive: true, force: true });
    }

    fs.createReadStream(zipPath)
      .pipe(unzipper.Extract({ path: extractPath }))
      .on('close', async () => {
        const configPath = path.join(extractPath, 'theme_config.json');

        if (!fs.existsSync(configPath)) {
          return res.status(400).json({ success: false, message: 'Invalid Theme Template: theme_config.json is missing inside ZIP root.' });
        }

        const themeConfigRaw = fs.readFileSync(configPath, 'utf8');
        const themeConfig = JSON.parse(themeConfigRaw);

        const updatedSettings = await Settings.findOneAndUpdate(
          { key: 'global_settings' },
          { themeSettings: themeConfig },
          { new: true }
        );

        if (fs.existsSync(zipPath)) {
          fs.unlinkSync(zipPath);
        }

        return res.json({ 
          success: true, 
          message: 'Shopify-style theme unpacked and applied successfully! 🎨🚀', 
          settings: updatedSettings 
        });
      })
      .on('error', (err) => {
        return res.status(500).json({ success: false, message: 'Failed during zip pipeline extraction.', error: err.message });
      });

  } catch (err) {
    res.status(500).json({ success: false, message: 'Server compilation error during theme injection.', error: err.message });
  }
});


// 🌐 5️⃣ POST API: Theme Reset karne ke liye
app.post('/api/settings/reset-theme', async (req, res) => {
  const defaultTheme = {
    bannerText: "🚚 Free Shipping across UAE on orders above 200 AED!",
    heroTitle: "Next-Gen Tech & Premium Beauty",
    heroSubtitle: "Experience curated luxury products selected precisely for high-performance lifestyle and timeless aesthetics.",
    accentColor: "#008060"
  };

  try {
    const extractPath = './uploads/themes/active_theme';
    if (fs.existsSync(extractPath)) {
      fs.rmSync(extractPath, { recursive: true, force: true });
    }

    const updatedSettings = await Settings.findOneAndUpdate(
      { key: 'global_settings' },
      { themeSettings: defaultTheme },
      { new: true }
    );

    res.json({ 
      success: true, 
      message: 'Theme successfully reset to system default! 🔄', 
      settings: updatedSettings 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server failed to reset theme configurations.', error: err.message });
  }
});


// 🌐 6️⃣ GET API: Orders fetch karne ke liye
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ _id: -1 });
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server failed to load orders ledger.', error: err.message });
  }
});


// 🌐 6.1️⃣ GET API: Customer Orders Tracking (By Email)
app.get('/api/orders/customer', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email query parameter is required.' });
    }
    const orders = await Order.find({ email: email }).sort({ _id: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// 🌐 7️⃣ POST API: Client store checkout submission save karne ke liye
app.post('/api/orders/create', async (req, res) => {
  const { fullName, email, address, items, totalAmount, currency } = req.body;

  if (!fullName || !email || !address || !items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Required transactional parameters are missing.' });
  }

  try {
    const newOrder = await Order.create({
      fullName,
      email,
      address,
      items,
      totalAmount,
      currency
    });

    res.json({ success: true, message: 'Order submitted to ledger successfully! 🎉', order: newOrder });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Database failed to commit order payload.', error: err.message });
  }
});

// 🌐 PUT API: Order ka fulfillment status update karne ke liye
app.put('/api/orders/update-status/:id', async (req, res) => {
  const { status } = req.body;
  const orderId = req.params.id;

  if (!status) {
    return res.status(400).json({ success: false, message: 'Fulfillment status token is required.' });
  }

  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { fulfillmentStatus: status },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: 'Order token not found.' });
    }

    res.json({ success: true, message: `Order status successfully marked as ${status}! `, order: updatedOrder });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Database failed to update order status.', error: err.message });
  }
});

// 🚀 Connect professional routes
app.use(collectionRoutes);

app.listen(PORT, () => console.log(`Backend ka server run ho raha hai http://localhost:${PORT}`));