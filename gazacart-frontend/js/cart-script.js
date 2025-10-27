// cart-script.js (معدل مع دعم JWT) --------------------------------------
document.addEventListener("DOMContentLoaded", () => {

  // ==========================
  //  جلب المستخدم الحالي
  // ==========================
  function getCurrentUser() {
    return JSON.parse(localStorage.getItem("currentUser")) || null;
  }

  // ==========================
  //  إدارة السلة
  // ==========================
  function getCartKey() {
    const user = getCurrentUser();
    return user ? `cart_${user.phone}` : "cart_guest";
  }

  function getCart() {
    return JSON.parse(localStorage.getItem(getCartKey())) || [];
  }

  function saveCart(cart) {
    localStorage.setItem(getCartKey(), JSON.stringify(cart));
  }

  function clearCart() {
    localStorage.removeItem(getCartKey());
  }

  function updateCartCount() {
    const cartCount = document.querySelector(".cart span");
    if (!cartCount) return;
    const cart = getCart();
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = count > 0 ? count : "";
  }

  function renderCartItems() {
    const cartItems = document.querySelector(".cart-items");
    const cartSummary = document.querySelector(".cart-summary");
    if (!cartItems) return;

    const cart = getCart();
    cartItems.innerHTML = "";

    if (cart.length === 0) {
      cartItems.innerHTML = `
        <div class="empty-cart" style="text-align:center; padding:20px; font-family:Cairo, sans-serif;">
          <p>لا يوجد منتجات في سلة تسوقك</p>
          <a href="index.html" class="btn yellow" style="display:inline-block; margin-top:10px; padding:8px 16px; border-radius:6px; text-decoration:none; color:#fff;">ابدأ التسوق</a>
        </div>
      `;
      if (cartSummary) cartSummary.style.display = "none";
      return;
    }

    if (cartSummary) cartSummary.style.display = "block";

    let total = 0;
    cart.forEach(item => {
      const price = Number(item.price) || 0;
      total += price * item.quantity;
      const div = document.createElement("div");
      div.className = "cart-item";
      div.innerHTML = `
        <img src="${item.image || 'images/default.png'}" alt="${item.name || 'منتج'}">
        <div class="item-info">
          <h4>${item.name || 'منتج بدون اسم'}</h4>
          <p>${item.store || 'متجر غير معروف'}</p>
          <p><strong>السعر :</strong> ${price} شيكل</p>
          <p><strong>الكمية :</strong> ${item.quantity}</p>
        </div>
        <button class="delete-btn" data-id="${item.id}">
          <img src="images/Frame 7624.png" alt="حذف">
        </button>
      `;
      cartItems.appendChild(div);
    });

    cartItems.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        removeFromCart(id);
      });
    });

    const deliveryCost = total > 0 ? 10 : 0;
    const deliveryEl = document.querySelector(".cart-summary .summary-row:nth-child(1) span:last-child");
    const totalEl = document.querySelector(".cart-summary .summary-row.total span:last-child");
    if (deliveryEl) deliveryEl.textContent = deliveryCost + " شيكل";
    if (totalEl) totalEl.textContent = (total + deliveryCost) + " شيكل";
  }

  window.removeFromCart = function(productId) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== productId);
    saveCart(cart);
    updateCartCount();
    renderCartItems();
  }

  function addToCart(productId, productName, productStore, productPrice, productImage) {
    let cart = getCart();
    const existing = cart.find(item => item.id === productId);
    const item = {
      id: productId || 'unknown_id',
      name: productName || 'منتج بدون اسم',
      store: (typeof productStore === 'string') ? productStore : (productStore && productStore.name) || 'متجر غير معروف',
      price: Number(productPrice) || 0,
      image: productImage || 'images/default.png',
      quantity: 1
    };

    if (existing) existing.quantity += 1;
    else cart.push(item);

    saveCart(cart);
    updateCartCount();
    renderCartItems();
  }

  window.addToCart = addToCart;

  // ==========================
  // init modal listeners
  // ==========================
  window.cartJsInit = function() {

    // الدفع -> checkout
    const btnCash = document.querySelector(".btn-cash");
    if (btnCash) btnCash.addEventListener("click", () => {
      document.getElementById("paymentModal").style.display = "none";
      document.getElementById("checkoutModal").style.display = "flex";
    });

    document.body.addEventListener("click", e => {
      if (e.target.classList.contains("btn-next")) {
        const receiptInput = document.getElementById("receipt");
        if (!receiptInput || !receiptInput.files.length) {
          alert("الرجاء رفع إشعار الدفع قبل المتابعة!");
          return;
        }
        document.getElementById("paymentModal").style.display = "none";
        document.getElementById("checkoutModal").style.display = "flex";
      }
    });

    const checkoutForm = document.querySelector("#checkoutModal form");
    if (!checkoutForm) return;

    checkoutForm.removeEventListener('submit', window.__checkoutSubmitHandler__);
    const handler = async function(e) {
      e.preventDefault();

      const form = e.target;
      form.querySelectorAll(".error-msg").forEach(el => el.remove());

      const nameInput = form.querySelector('[name="name"]');
      const addressInput = form.querySelector('[name="address"]');
      const phoneInput = form.querySelector('[name="phone"]');
      const backupPhoneInput = form.querySelector('[name="backupPhone"]');
      let valid = true;

      const showError = (input, message) => {
        const error = document.createElement("div");
        error.className = "error-msg";
        error.textContent = message;
        Object.assign(error.style, {
          color: "red",
          fontSize: "13px",
          marginTop: "4px",
          fontFamily: "Cairo, sans-serif"
        });
        input.insertAdjacentElement("afterend", error);
        valid = false;
      };

      if (!nameInput.value.trim()) showError(nameInput, "الرجاء إدخال الاسم الكامل");
      if (!addressInput.value.trim()) showError(addressInput, "الرجاء إدخال عنوان التوصيل");
      if (!phoneInput.value.trim()) showError(phoneInput, "الرجاء إدخال رقم الهاتف");
      if (!valid) return;

      const currentUser = getCurrentUser();
      if (!currentUser || !currentUser.token) {
        alert("❌ يجب تسجيل الدخول لإتمام الطلب!");
        return;
      }

      const cartKey = `cart_${currentUser.phone}`;
      const cart = getCart();
      if (cart.length === 0) {
        alert("السلة فارغة!");
        return;
      }

      const receiptInput = document.getElementById("receipt");
      let receiptFile = receiptInput?.files?.[0] || null;

      const formData = new FormData();
    formData.append("items", JSON.stringify(cart)); //
    formData.append("totalPrice", cart.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0) + 10);
    formData.append("paymentMethod", receiptFile ? "bank" : "cash");
    formData.append("fullName", nameInput.value.trim());
    formData.append("address", addressInput.value.trim());
    formData.append("phone", phoneInput.value.trim());
    formData.append("altPhone", backupPhoneInput?.value.trim() || "");
   
    if (receiptFile) formData.append("paymentProof", receiptFile); 

try {
const response = await fetch("https://gazacart.onrender.com/api/orders", {
  method: "POST",
  body: formData,
  headers: {
    "Authorization": `Bearer ${currentUser.token}`
  }
  });

  let data;
  try { data = await response.json(); } catch(err) { data = {}; }

  if (!response.ok) {
    console.error("❌ خطأ من السيرفر:", data);
    alert(data.message || "حدث خطأ أثناء إرسال الطلب. حاول مرة أخرى.");
    return;
  }

  console.log("📦 تم إرسال الطلب بنجاح:", data);

  localStorage.removeItem(cartKey);
  updateCartCount();
  renderCartItems();

  document.getElementById("checkoutModal").style.display = "none";
 playSuccessSound();
 showToast("✅ تم إرسال الطلب بنجاح!");

} catch (err) {
  console.error("❌ خطأ أثناء الإرسال:", err);
  alert("حدث خطأ أثناء إرسال الطلب. حاول مرة أخرى.");
}
    };

    window.__checkoutSubmitHandler__ = handler;
    checkoutForm.addEventListener('submit', handler);
  };

  // ==========================
  // 📢 Toast
  // ==========================
  function showToast(message) {
    const oldToast = document.querySelector(".toast-message");
    if (oldToast) oldToast.remove();
    const toast = document.createElement("div");
    toast.className = "toast-message";
    toast.textContent = message;
    Object.assign(toast.style, {
      position: "fixed",
      top: "20px",
      right: "20px",
      zIndex: "9999",
      opacity: "0",
      transition: "opacity 0.5s ease",
      padding: "12px 20px",
      borderRadius: "8px",
      background: "#FFD700",
      color: "#000",
      fontFamily: "inherit",
      fontSize: "inherit",
      boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
    });
    document.body.appendChild(toast);
    setTimeout(() => toast.style.opacity = "1", 100);
    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 500);
    }, 3000);
  }

  // ==========================
  // 🔔 صوت النجاح
  // ==========================
  function playSuccessSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {
      console.warn("AudioContext unavailable:", e);
    }
  }

  // ==========================
  // إغلاق المودالات بالنقر خارجها
  // ==========================
  window.addEventListener("click", e => {
    const modals = ["authModal", "cartModal", "paymentModal", "checkoutModal", "doneModal"];
    modals.forEach(id => {
      const modal = document.getElementById(id);
      if (!modal) return;
      const modalContent = modal.querySelector(".modal-content, .checkout-popup");
      if (modalContent && modalContent.contains(e.target)) return;
      if (e.target === modal) modal.style.display = "none";
    });
  });

  // تشغيل render
  updateCartCount();
  renderCartItems();
  if (document.querySelector("#checkoutModal")) {
    if (typeof window.cartJsInit === "function") window.cartJsInit();
  }

});
