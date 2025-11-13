const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { protect, authorizeRoles } = require('../middleware/auth');

// ===== Signup الزبون =====
router.post("/signup", async (req, res) => {
  try {
    const { fullname, phone, email } = req.body;
    if (!fullname || !phone || !email) {
      return res.status(400).json({ message: "الرجاء إدخال الاسم، الهاتف والإيميل" });
    }

    const exists = await User.findOne({ $or: [{ phone }, { email }] });
    if (exists) return res.status(400).json({ message: "المستخدم موجود بالفعل" });

    const newUser = new User({ fullname, phone, email, role: "customer" });
    await newUser.save();

    // ✅ إنشاء JWT للزبون
    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET || "YOUR_SECRET_KEY",
      { expiresIn: process.env.JWT_EXPIRE || "7d" }
    );

    const safeUser = {
      id: newUser._id,
      fullname: newUser.fullname,
      phone: newUser.phone,
      email: newUser.email,
      role: newUser.role
    };

    res.status(201).json({
      message: "تم التسجيل بنجاح ✅",
      user: safeUser,
      token
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "خطأ في السيرفر" });
  }
});

// ===== Signin الزبون =====
router.post("/signin", async (req, res) => {
  try {
    const { fullname, phone } = req.body;
    if (!fullname || !phone)
      return res.status(400).json({ message: "الرجاء إدخال الاسم ورقم الهاتف" });

    const user = await User.findOne({ fullname, phone });
    if (!user)
      return res.status(400).json({ message: "مستخدم غير موجود ❌" });

    // ✅ إنشاء JWT بعد تسجيل الدخول
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "YOUR_SECRET_KEY",
      { expiresIn: process.env.JWT_EXPIRE || "7d" }
    );

    const safeUser = {
      id: user._id,
      fullname: user.fullname,
      phone: user.phone,
      email: user.email,
      role: user.role
    };

    res.json({
      message: "تم تسجيل الدخول ✅",
      user: safeUser,
      token
    });
  } catch (error) {
    console.error("Signin error:", error);
    res.status(500).json({ message: "خطأ في السيرفر" });
  }
});

// ===== Signup التاجر =====
router.post("/merchant/signup", async (req, res) => {
  try {
    const { fullname, phone, email, password } = req.body;
    console.log("📥 Reached /merchant/signup route");
    console.log("📦 Received data:", req.body);

    if (!fullname || !phone || !email || !password) {
      return res.status(400).json({ message: "الرجاء إدخال الاسم، الهاتف، البريد وكلمة المرور" });
    }

    const exists = await User.findOne({ $or: [{ email }, { phone }] });
    if (exists) return res.status(400).json({ message: "المستخدم موجود بالفعل" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      fullname,
      phone,
      email,
      password: hashedPassword,
      role: "merchant",
    });

    await newUser.save();

    console.log("✅ Merchant created successfully:", newUser);
    res.status(201).json({ message: "تم تسجيل التاجر بنجاح!" });

  } catch (error) {
    console.error("❌ Merchant Signup error:", error);
    res.status(500).json({
      message: "خطأ في السيرفر",
      error: error.message,
      stack: error.stack
    });
  }
});



// ===== Signin التاجر =====
router.post("/merchant/signin", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "الرجاء إدخال البريد وكلمة المرور" });

    const user = await User.findOne({ email, role: "merchant" }).select("+password");
    if (!user) return res.status(400).json({ message: "التاجر غير موجود ❌" });

    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) return res.status(400).json({ message: "كلمة المرور غير صحيحة ❌" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "YOUR_SECRET_KEY",
      { expiresIn: process.env.JWT_EXPIRE || "1d" }
    );

    res.json({
      message: "تم تسجيل الدخول ✅",
      token,
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Merchant Signin error:", error);
    res.status(500).json({ message: "خطأ في السيرفر" });
  }
});
// ===== تسجيل دخول الأدمن =====
router.post("/admin/signin", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "الرجاء إدخال البريد وكلمة المرور" });

    const admin = await User.findOne({ email, role: "admin" }).select("+password");
    if (!admin) return res.status(400).json({ message: "أدمن غير موجود ❌" });

    // ✅ تحقق من حالة الأدمن
    if (admin.status === 'blocked') {
      return res.status(403).json({ message: "تم حظر هذا الأدمن" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ message: "كلمة المرور غير صحيحة ❌" });

    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET || "YOUR_SECRET_KEY",
      { expiresIn: "7d" }
    );

    res.json({
      message: "تم تسجيل الدخول كأدمن ✅",
      token,
      user: {
        id: admin._id,
        fullname: admin.fullname,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error("Admin Signin error:", error);
    res.status(500).json({ message: "خطأ في السيرفر" });
  }
});
// ===== Get All Users (For Admin Dashboard) =====
router.get("/all", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const users = await User.find({}, "-password");
    res.json(users);
  } catch (error) {
    console.error("Fetch users error:", error);
    res.status(500).json({ message: "خطأ في جلب المستخدمين" });
  }
});


module.exports = router;
