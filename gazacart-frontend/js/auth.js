// =======================
// تسجيل جديد
// =======================
document.getElementById("signupBtn").addEventListener("click", async () => {
  const fullName = document.getElementById("signupName").value.trim();
  const phone = document.getElementById("signupPhone").value.trim();
  const email = document.getElementById("signupEmail").value.trim();

  if (!fullName || !phone || !email) {
    alert("الرجاء إدخال الاسم، رقم الهاتف والإيميل");
    return;
  }

  try {
const res = await fetch("https://gazacart.onrender.com/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullname: fullName, phone, email }),
    });

    const data = await res.json();

    if (res.ok) {
      // ✅ حفظ بيانات المستخدم + التوكن
      localStorage.setItem("currentUser", JSON.stringify({
        fullname: data.user?.fullname || fullName,
        phone: data.user?.phone || phone,
        email: data.user?.email || email,
        token: data.token || null, // 🔥 حفظ الـ JWT هنا
      }));

      // 🔁 نقل السلة من ضيف إلى المستخدم الجديد
      const guestCart = localStorage.getItem("cart_guest");
      if (guestCart) {
        localStorage.setItem(`cart_${phone}`, guestCart);
        localStorage.removeItem("cart_guest");
      }

      if (typeof initCart === "function") initCart();

      alert(data.message || "تم التسجيل بنجاح ✅");
      window.location.href = "index.html";
    } else {
      alert(data.message || "حدث خطأ أثناء التسجيل ❌");
    }
  } catch (err) {
    alert("خطأ في الاتصال بالسيرفر ❌");
    console.error(err);
  }
});

// =======================
// تسجيل دخول
// =======================
document.getElementById("signinBtn").addEventListener("click", async () => {
  const fullName = document.getElementById("signinName").value.trim();
  const phone = document.getElementById("signinPhone").value.trim();

  if (!fullName || !phone) {
    alert("الرجاء إدخال الاسم ورقم الهاتف");
    return;
  }

  try {
const res = await fetch("https://gazacart.onrender.com/api/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullname: fullName, phone }),
    });

    const data = await res.json();

    if (res.ok) {
      // ✅ حفظ المستخدم الحالي + التوكن
      localStorage.setItem("currentUser", JSON.stringify({
        fullname: data.user?.fullname || fullName,
        phone: data.user?.phone || phone,
        email: data.user?.email || "",
        token: data.token || null, // 🔥 حفظ JWT
      }));

      //  نقل السلة من ضيف إلى المستخدم المسجل
      const guestCart = localStorage.getItem("cart_guest");
      if (guestCart) {
        localStorage.setItem(`cart_${phone}`, guestCart);
        localStorage.removeItem("cart_guest");
      }

      if (typeof initCart === "function") initCart();

      alert(data.message || "تم تسجيل الدخول بنجاح ✅");
      window.location.href = "index.html";
    } else {
      alert(data.message || "حدث خطأ أثناء تسجيل الدخول ❌");
    }
  } catch (err) {
    alert("خطأ في الاتصال بالسيرفر ❌");
    console.error(err);
  }
});
// دالة عرض البوب
function showMerchantPopup(message, type, onClose) {
  const popup = document.getElementById('merchant-popup');
  const popupTitle = popup.querySelector('.popup-title');
  const popupMessage = popup.querySelector('.popup-message');
  const popupIcon = popup.querySelector('.popup-icon');

  popupTitle.textContent = type === "success" ?"سيتم التواصل معك قريبًا لاكمال إعداد متجرك " : "حدث خطأ!";
  popupIcon.textContent = type === "success" ? "✅" : "❌";
 popupMessage.innerHTML = message;


  popup.style.display = 'flex';

  const closeBtn = document.getElementById('close-popup');
  closeBtn.replaceWith(closeBtn.cloneNode(true));
  const newCloseBtn = document.getElementById('close-popup');

  newCloseBtn.addEventListener('click', () => {
    popup.style.display = 'none';
    if (onClose) onClose();
  });
}

// تسجيل دخول التاجر 
const form = document.querySelector(".merchant-login form");
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const fullname = document.getElementById("merchantName").value.trim();
  const phone = document.getElementById("merchantPhone").value.trim();
  const email = document.getElementById("merchantEmail").value.trim();
  const password = document.getElementById("merchantPassword").value;

  if (!fullname || !phone || !email || !password) return showMerchantPopup("الرجاء تعبئة جميع الحقول", "error");

  try {
    const response = await fetch("https://gazacart.onrender.com/api/auth/merchant/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullname, phone, email, password , role: 'merchant'}),
    });

    const data = await response.json();

 if (response.ok) {
  const fullMessage = `${data.message}`;
  showMerchantPopup(fullMessage, "success");
  form.reset();
} else {
  showMerchantPopup(data.message, "error");
}

  } catch (err) {
    console.error("Signup error:", err);
    showMerchantPopup("حدث خطأ ما. حاول لاحقًا.", "error");
  }
});