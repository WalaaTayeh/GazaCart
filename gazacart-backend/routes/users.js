const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const router = express.Router();
const User = require("../models/User");
const { protect, authorizeRoles } = require("../middleware/auth");

//  إضافة مستخدم جديد (فقط الأدمن)
router.post("/", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const { fullname, email, password, role, phone } = req.body;

    // التحقق من الحقول المطلوبة
    if (!fullname || !email || !phone) {
      return res.status(400).json({ message: "الاسم، البريد الإلكتروني ورقم الهاتف مطلوبان" });
    }

    // الزبون لا يحتاج كلمة مرور
    const userData = {
      fullname,
      email,
      phone,
      role: role || "customer",
    };

    // كلمة المرور مطلوبة للتاجر أو الأدمن
    if ((role === "merchant" || role === "admin") && password) {
      userData.password = password;
    }

    const newUser = new User(userData);
    await newUser.save();

    res.status(201).json({
      message: "✅ تم إنشاء المستخدم بنجاح",
      user: newUser,
    });
  } catch (error) {
    console.error("❌ خطأ أثناء إنشاء المستخدم:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    if (error.code === 11000) {
      return res.status(400).json({ message: "📧 البريد الإلكتروني أو الهاتف مستخدم بالفعل" });
    }

    res.status(500).json({ message: error.message || "حدث خطأ أثناء إنشاء المستخدم" });
  }
});


//  جلب جميع المستخدمين (فقط الأدمن)
router.get("/", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (err) {
    console.error("❌ خطأ أثناء جلب المستخدمين:", err);
    res.status(500).json({ message: "حدث خطأ أثناء جلب المستخدمين" });
  }
});

//  حذف مستخدم (فقط الأدمن)
router.delete("/:id", protect, authorizeRoles("admin"), async (req, res) => {
  const { id } = req.params;
   if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(400).json({ message: "معرّف المستخدم غير صالح" });
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "المستخدم غير موجود" });

    res.status(200).json({ message: "🗑️ تم حذف المستخدم بنجاح" });
  } catch (err) {
    console.error("❌ خطأ أثناء حذف المستخدم:", err);
    res.status(500).json({ message: "حدث خطأ أثناء حذف المستخدم" });
  }
});
//تحديث حالة المستخدم 
router.put("/:id/status", protect, authorizeRoles("admin"), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  // تحقق من أن الحالة صحيحة
  if (!['active','inactive','blocked'].includes(status)) {
    return res.status(400).json({ message: "حالة غير صالحة" });
  }

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "المستخدم غير موجود" });

    user.status = status;
    await user.save();
   res.json({ message: "تم تحديث الحالة بنجاح", user: await User.findById(id).select("-password") });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "خطأ في السيرفر" });
  }
});
// تحديث مستخدم (فقط الأدمن)
router.put("/:id", protect, authorizeRoles("admin"), async (req, res) => {
  const { id } = req.params;
  const { fullname, email, phone, role, address, password, status } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "المستخدم غير موجود" });

    // تحديث الحقول العامة
    if (fullname) user.fullname = fullname;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (role) user.role = role;
    if (address) user.address = address;

    // تحديث كلمة المرور فقط للتاجر أو الأدمن
    if (password && (user.role === "merchant" || user.role === "admin")) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    // تحديث الحالة إذا تم إرسالها
    if (status) {
      if (!["active", "inactive", "blocked"].includes(status)) {
        return res.status(400).json({ message: "حالة غير صالحة" });
      }
      user.status = status;
    }

    await user.save();

    res.json({
      message: "تم تحديث المستخدم بنجاح ✅",
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        phone: user.phone,
        role: user.role,
        address: user.address,
        status: user.status
      }
    });
  } catch (err) {
    console.error("خطأ أثناء تحديث المستخدم:", err);
    res.status(500).json({ message: "خطأ في السيرفر" });
  }
});

module.exports = router;
