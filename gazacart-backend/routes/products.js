const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const fs = require("fs");
const Product = require("../models/Product");
const Store = require("../models/Store");
const { protect, authorizeRoles } = require("../middleware/auth");
const multer = require("multer");
const path = require("path");

// ===== إعداد رفع الصور للمنتجات =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/products";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// ===== جلب المنتجات مع فلترة =====
router.get("/", async (req, res) => {
  try {
    const { storeId, category, limit } = req.query;
    const filter = {};

    if (storeId) {
      if (!mongoose.Types.ObjectId.isValid(storeId))
        return res.status(400).json({ message: "Store ID غير صالح" });
      filter.store = new mongoose.Types.ObjectId(storeId);
    }

    if (category) filter.category = category;

    const products = await Product.find(filter)
      .limit(Number(limit) || 0)
      .populate("store", "name category");

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== جلب منتج محدد حسب ID =====
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("store", "_id name category");
    if (!product) return res.status(404).json({ message: "المنتج غير موجود" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== جلب المنتجات ذات صلة من نفس المتجر =====
router.get("/:id/related", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "المنتج غير موجود" });

    const relatedProducts = await Product.find({
      _id: { $ne: product._id },
      store: product.store
    })
      .limit(8)
      .populate("store", "name category");

    res.json(relatedProducts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== إضافة منتج (للتاجر فقط) =====
router.post("/", protect, authorizeRoles("merchant"), upload.single("image"), async (req, res) => {
  try {
    const { name, description, price } = req.body;

    // تحقق من الحقول الأساسية
    if (!name) return res.status(400).json({ message: "اسم المنتج مطلوب" });
    if (!price) return res.status(400).json({ message: "السعر مطلوب" });

    // تحديد متجر التاجر تلقائيًا
    const store = await Store.findOne({ owner: req.user._id });
    if (!store) return res.status(404).json({ message: "المتجر غير موجود" });

    const imagePath = req.file ? `/uploads/products/${req.file.filename}` : null;

    const product = new Product({
      store: store._id,
      name,
      description: description || "",
      price: Number(price),
      stock: req.body.stock ? Number(req.body.stock) : 0,
        category: req.body.category || "عام",   
      images: imagePath ? [imagePath] : []
    });

    await product.save();
    res.status(201).json(product);
  } catch (err) {
    console.error("Error creating product:", err);
    res.status(500).json({ error: err.message });
  }
});

// ===== تعديل منتج =====
router.put("/:id", protect, upload.single("image"), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("store");
    if (!product)
      return res.status(404).json({ message: "المنتج غير موجود" });

    // التحقق من ملكية المتجر أو أن المستخدم أدمن
    if (
      product.store.owner.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "غير مسموح بالتعديل" });
    }

    // تحديث البيانات النصية
    if (req.body.name) product.name = req.body.name;
    if (req.body.description) product.description = req.body.description;
    if (req.body.price) product.price = req.body.price;
    if (req.body.stock !== undefined) product.stock = Number(req.body.stock);
    // تحديث الصورة الجديدة إذا تم رفعها
    if (req.file) {
      const imagePath = `/uploads/products/${req.file.filename}`;
      product.images = [imagePath];
    }

    await product.save();
    res.json(product);
  } catch (err) {
    console.error("Error updating product:", err);
    res.status(500).json({ error: err.message });
  }
});


// ===== حذف منتج =====
router.delete("/:id", protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("store");
    if (!product) return res.status(404).json({ message: "المنتج غير موجود" });

    if (product.store.owner.toString() !== req.user._id.toString() && req.user.role !== "admin")
      return res.status(403).json({ message: "غير مسموح بالحذف" });

    await product.deleteOne();
    res.json({ message: "تم حذف المنتج بنجاح" });
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
