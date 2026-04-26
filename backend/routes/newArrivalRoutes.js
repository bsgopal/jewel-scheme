const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const NewArrival = require('../models/NewArrivals');

const normalizeArrival = (item) => ({
  id: item._id,
  title: item.title,
  price: item.price,
  offer: item.offer,
  imageUrl: item.imageUrl,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

// ── Multer config ────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename:    (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// ── GET all ──────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const items = await NewArrival.find().sort({ _id: -1 });
    res.json(items.map(normalizeArrival));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST add new ─────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { title, price, offer, image_url } = req.body;
  try {
    const item = await NewArrival.create({ title, price, offer, imageUrl: image_url });
    res.json({ success: true, data: normalizeArrival(item) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST upload image ────────────────────────────────────────────────────────
router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

// ── DELETE ───────────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await NewArrival.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Item not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT update ───────────────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  const { title, price, offer, image_url } = req.body;
  try {
    const updated = await NewArrival.findByIdAndUpdate(
      req.params.id,
      { title, price, offer, imageUrl: image_url },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ error: 'Item not found' });
    res.json({ success: true, data: normalizeArrival(updated) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; // ← this line was missing!
