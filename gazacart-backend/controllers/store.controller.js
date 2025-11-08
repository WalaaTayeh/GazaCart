
const mongoose = require("mongoose");
const Store = require("../models/Store");
const Product = require("../models/Product");

// =========================
// 📦 إنشاء متجر جديد
// =========================
exports.createStore = async (req, res) => {
  try {
    const { name, description, category, images, logo, address, phone, social } = req.body;

    const store = new Store({
      owner: req.user._id,
      name,
      description,
      category,
      images,
      logo,
      address,
      phone,
      social
    });

    await store.save();
    res.status(201).json(store);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =========================
// 🔍 جلب جميع المتاجر (مع فلترة)
// =========================
exports.getStores = async (req, res) => {
  try {
    const { category, limit } = req.query;
    const filter = {};
    if (category) filter.category = category;

    const stores = await Store.find(filter).limit(Number(limit) || 0);
    res.json(stores);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =========================
// 🏆 أفضل المتاجر
// =========================
exports.getTopStores = async (req, res) => {
  try {
    const top = await Store.find().sort({ rating: -1 }).limit(6);
    res.json(top);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =========================
// 🔍 البحث في المتاجر والمنتجات
// =========================
exports.searchStoresAndProducts = async (req, res) => {
  try {
    const q = req.query.q ? req.query.q.trim() : "";
    if (!q) return res.json({ stores: [], products: [] });

    const storeResults = await Store.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } },
      ],
    }).select("name description images category").limit(10);

    const productResults = await Product.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ],
    }).select("name description images price").limit(10);

    res.json({ stores: storeResults, products: productResults });
  } catch (err) {
    console.error("❌ Error in unified search:", err);
    res.status(500).json({ message: "حدث خطأ أثناء البحث" });
  }
};

// =========================
// 🏬 جلب متجر محدد بالـ ID
// =========================
exports.getStoreById = async (req, res) => {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "ID المتجر غير صالح" });
  }

  try {
    const store = await Store.findById(id)
      .populate("productsList", "name price images rating description");

    if (!store) return res.status(404).json({ message: "المتجر غير موجود" });

    res.json(store);
  } catch (err) {
    console.error("❌ خطأ في جلب بيانات المتجر:", err);
    res.status(500).json({ message: "حدث خطأ أثناء جلب بيانات المتجر" });
  }
};

// =========================
// 🧑‍💼 جلب متجر التاجر الحالي
// =========================
exports.getMyStore = async (req, res) => {
  try {
    const store = await Store.findOne({ owner: req.user._id })
      .populate("productsList", "name price images rating description");

    if (!store) {
      return res.status(404).json({ message: "لم يتم إنشاء متجر بعد" });
    }

    res.json(store);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =========================
//  تعديل المتجر
exports.updateStore = async (req, res) => {
  try {
    const updatedStore = await Store.findByIdAndUpdate(
      req.params.id,
      { description: req.body.description }, // تعديلات جزئية فقط
      { new: true, runValidators: true }      // لتطبيق validators على الحقل المعدّل
    );

    if (!updatedStore) return res.status(404).json({ message: "المتجر غير موجود" });

    res.json({ message: "تم تعديل الوصف بنجاح", store: updatedStore });
  } catch (err) {
    console.error("❌ خطأ أثناء تعديل المتجر:", err);
    res.status(500).json({ message: "حدث خطأ أثناء تعديل المتجر", error: err.message });
  }
};

// =========================
// 🗑️ حذف المتجر
// =========================
exports.deleteStore = async (req, res) => {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "ID المتجر غير صالح" });
  }

  try {
    const store = await Store.findById(id);
    if (!store) return res.status(404).json({ message: "المتجر غير موجود" });

    if (store.owner.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "غير مسموح" });
    }

    await store.deleteOne();
    res.json({ message: "تم حذف المتجر بنجاح" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
