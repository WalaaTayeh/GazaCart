const express = require('express');
const router = express.Router();
router.use((req, res, next) => {
  console.log('🧭 وصل إلى orders.js:', req.method, req.originalUrl);
  next();
});
const Order = require('../models/Order');
const Store = require('../models/Store');
const Product = require('../models/Product');
const { protect, authorizeRoles } = require('../middleware/auth');
const upload = require('../middleware/upload');




// ===============================
// 🚀 إنشاء طلب جديد (checkout)
router.post(
  '/',
  protect,
  upload('payment', 'paymentProof', false),
  async (req, res) => {
    try {
      console.log("📥 الطلب المستلم قبل التحويل:", req.body);

      if (typeof req.body.items === 'string') {
        try {
          req.body.items = JSON.parse(req.body.items);
        } catch (parseErr) {
          console.error("⚠️ فشل في تحويل items:", parseErr);
          return res.status(400).json({ message: 'تنسيق العناصر غير صحيح (items JSON)' });
        }
      }

      const { items, totalPrice, paymentMethod, fullName, address, phone, altPhone } = req.body;
      console.log("✅ الطلب بعد التحويل:", req.body);

      if (!items || !Array.isArray(items) || !items.length) {
        return res.status(400).json({ message: '❌ لا يوجد منتجات في الطلب' });
      }

      if (!fullName || !address || !phone) {
        return res.status(400).json({ message: '❌ يرجى إدخال بيانات التوصيل' });
      }

      let paymentProof = null;
      if (paymentMethod === "bank") {
        if (!req.file) {
          return res.status(400).json({ message: "❌ يلزم رفع إثبات الدفع" });
        }
        paymentProof = `/uploads/paymentProofs/${req.file.filename}`;
      }

      const isPaid = paymentMethod === "bank" && paymentProof ? true : false;

      // =========================
      // ✅ إضافة store لكل عنصر
      const OrderItems = await Promise.all(items.map(async item => {
        const productData = await Product.findById(item.product);
        if (!productData) throw new Error(`المنتج غير موجود: ${item.product}`);

        return {
          product: item.product,
          name: productData.name,
          price: productData.price,
          quantity: item.quantity,
          store: productData.store // <- هذا المرجع للمتجر
        };
      }));

      const order = await Order.create({
        customer: req.user._id,
        items: OrderItems,
        totalPrice,
        paymentMethod,
        fullName,
        address,
        phone,
        altPhone,
        paymentProof,
        isPaid,
        status: "pending"
      });

      return res.status(201).json({ message: "✅ تم إنشاء الطلب بنجاح", order });

    } catch (err) {
      console.error("❌ خطأ في إنشاء الطلب:", err);
      return res.status(500).json({ error: err.message });
    }
  }
);


// ===============================
// 📄 عرض جميع طلبات المستخدم الحالي
router.get('/my', protect, async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user._id }).sort('-createdAt');
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ===============================
// 🛠️ للأدمن: جلب كل الطلبات
router.get('/', protect, authorizeRoles('admin'), async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('customer', 'fullname email phone')
      .sort('-createdAt');
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
// جلب الطلبات حسب المتجر
// ===============================
router.get("/store/:storeId", protect, authorizeRoles("merchant"), async (req, res) => {
  try {
    const { storeId } = req.params;

    const orders = await Order.find({ "items.store": storeId })
      .populate("customer", "fullname email phone")  // ✅ هنا نضيف populate لاسم العميل
      .populate({
        path: "items.product",
        select: "name price store",
        populate: {
          path: "store",
          select: "name"
        }
      })
      .sort("-createdAt");

    res.json(orders); // نرسل كل شيء للـ frontend
  } catch (err) {
    console.error("❌ خطأ أثناء جلب الطلبات:", err);
    res.status(500).json({ message: "Server error: " + err.message });
  }
});
// تحديث حالة الطلب
router.put('/:id/status', protect, authorizeRoles('merchant', 'admin'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'الطلب غير موجود' });

    order.status = req.body.status || order.status;
    await order.save();
    res.json({ message: 'تم تحديث حالة الطلب', order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'حدث خطأ' });
  }
});


module.exports = router;
