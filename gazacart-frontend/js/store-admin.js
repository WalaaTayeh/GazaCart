document.addEventListener("DOMContentLoaded", async () => {
  const storeId = new URLSearchParams(window.location.search).get("id");
  if (!storeId) return alert("❌ لم يتم تحديد المتجر.");

  // عناصر الصفحة
  const storeNameEl = document.querySelector(".profile-info h2");
  const storeDescEl = document.querySelector(".about p");
  const storeImgEl = document.querySelector(".profile-img");
  const starsEl = document.querySelector(".profile-info .stars");
  const productsGrid = document.querySelector(".products-grid");
  const editDescBtn = document.querySelector(".about button");
  const logoutBtn = document.querySelector(".logout-btn");

  // ===== تسجيل خروج =====
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "index.html";
  });

  // ===== فتح/إغلاق البوب أب =====
  window.openPopup = (id) => {
    const popup = document.getElementById(id);
    if (!popup) return console.error(`❌ العنصر بالـ ID "${id}" غير موجود`);
    popup.classList.add("active");
  };

  window.closePopup = (id) => {
    const popup = document.getElementById(id);
    if (!popup) return console.error(`❌ العنصر بالـ ID "${id}" غير موجود`);
    popup.classList.remove("active");
  };

  let store = null;

  // ===== جلب بيانات المتجر =====
  async function fetchStore() {
    try {
      const res = await fetch(`https://gazacart.onrender.com/api/stores/${storeId}`);
      if (!res.ok) throw new Error("فشل في جلب بيانات المتجر");
      store = await res.json();

      storeNameEl.textContent = store.name || "اسم المتجر غير متوفر";
      storeDescEl.textContent = store.description || "لا يوجد وصف متاح.";
      storeImgEl.src = store.images?.[0]
      ? `https://gazacart.onrender.com${store.images[0]}`
      : "images/profile.jpg";
      const rating = store.rating || 0;
      starsEl.textContent = "★".repeat(rating) + "☆".repeat(5 - rating);

      renderProducts();
    } catch (err) {
      console.error(err);
      productsGrid.innerHTML = `<p style="color:red;">حدث خطأ أثناء تحميل بيانات المتجر.</p>`;
    }
  }

  // ===== عرض المنتجات =====
  function renderProducts() {
    productsGrid.innerHTML = "";
    if (!store.productsList || store.productsList.length === 0) {
      productsGrid.innerHTML = `<p>لا توجد منتجات حالياً في هذا المتجر.</p>`;
      return;
    }

    store.productsList.forEach(prod => {
      const card = document.createElement("div");
      card.className = "card";
      const imageUrl = prod.images?.[0]
      ? `https://gazacart.onrender.com${prod.images[0]}`
      : "images/Component 1.png";

      const prodRating = prod.rating || 0;

      card.innerHTML = `
        <div class="card-img">
          <img src="${imageUrl}" alt="${prod.name}">
        </div>
        <div class="card-header">
          <h4>${prod.name}</h4>
          <div class="stars">${"★".repeat(prodRating)}${"☆".repeat(5 - prodRating)}</div>
        </div>
        <p class="price">${prod.price ? prod.price + " شيكل" : "-"}</p>
        <div class="actions">
          <button class="btn-delete"><img src="images/Frame 7624.png" alt="حذف"></button>
          <button class="btn-edit"><img src="images/Frame 7651.png" alt="تعديل"></button>
        </div>
      `;
      productsGrid.appendChild(card);

      // ===== حذف المنتج =====
      card.querySelector(".btn-delete").addEventListener("click", async () => {
        if (!confirm("هل أنت متأكد من حذف هذا المنتج؟")) return;
        try {
          const res = await fetch(`https://gazacart.onrender.com/api/products/${prod._id}`, {
            method: "DELETE",
            headers: { "Authorization": "Bearer " + localStorage.getItem("token") }
          });
          if (!res.ok) throw new Error("فشل في حذف المنتج");
          alert("✅ تم حذف المنتج بنجاح");
          fetchStore();
        } catch (err) {
          console.error(err);
          alert("❌ خطأ أثناء حذف المنتج");
        }
      });

      // ===== تعديل المنتج =====
      card.querySelector(".btn-edit").addEventListener("click", () => openEditPopup(prod));
    });
  }

  // ===== تعديل وصف المتجر =====
  editDescBtn.addEventListener("click", async () => {
    const newDesc = prompt("أدخل وصف المتجر الجديد:", store.description || "");
    if (newDesc === null) return;

    try {
      const res = await fetch(`https://gazacart.onrender.com/api/stores/${storeId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + localStorage.getItem("token"),
        },
        body: JSON.stringify({ description: newDesc }),
      });
      if (!res.ok) throw new Error("فشل في تعديل الوصف");
      store.description = newDesc;
      storeDescEl.textContent = newDesc;
      alert("✅ تم تعديل وصف المتجر بنجاح");
    } catch (err) {
      console.error(err);
      alert("❌ خطأ أثناء تعديل وصف المتجر");
    }
  });

  // ===== تعديل منتج =====
  const editPopup = document.getElementById("editItemPopup");
  const editName = editPopup?.querySelector("#edit-name");
  const editDesc = editPopup?.querySelector("#edit-desc");
  const submitEditBtn = editPopup?.querySelector(".submit-btn");
  let currentEditingProduct = null;

  function openEditPopup(prod) {
    if (!editPopup) return console.error('❌ عنصر البوب أب "editItemPopup" غير موجود');
    currentEditingProduct = prod;
    editName.value = prod.name;
    editDesc.value = prod.description || "";
    openPopup("editItemPopup");
  }

  submitEditBtn?.addEventListener("click", async () => {
    if (!currentEditingProduct) return;
    try {
      const res = await fetch(`https://gazacart.onrender.com/api/products/${currentEditingProduct._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + localStorage.getItem("token"),
        },
        body: JSON.stringify({
          name: editName.value,
          description: editDesc.value,
        }),
      });
      if (!res.ok) throw new Error("فشل في تعديل المنتج");
      alert("✅ تم تعديل المنتج بنجاح");
      closePopup("editItemPopup");
      fetchStore();
    } catch (err) {
      console.error(err);
      alert("❌ خطأ أثناء تعديل المنتج");
    }
  });

  // ===== إضافة منتج =====
  const addPopup = document.getElementById("addItemPopup");
  const addName = addPopup?.querySelector("input[type='text']");
  const addDesc = addPopup?.querySelector("textarea");
  const addImages = addPopup?.querySelector("input[type='file']");
  const submitAddBtn = addPopup?.querySelector(".submit-btn");

  submitAddBtn?.addEventListener("click", async () => {
    const name = addName.value.trim();
    const description = addDesc.value.trim();
    if (!name) return alert("⚠️ الرجاء إدخال اسم المنتج");

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("storeId", storeId);
    for (let img of addImages.files) formData.append("image", img);

    try {
      const res = await fetch(`https://gazacart.onrender.com/api/products`, {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + localStorage.getItem("token"),
        },
        body: formData,
      });
      if (!res.ok) throw new Error("فشل في إضافة المنتج");
      alert("✅ تم إضافة المنتج بنجاح");
      closePopup("addItemPopup");
      addName.value = "";
      addDesc.value = "";
      addImages.value = "";
      fetchStore();
    } catch (err) {
      console.error(err);
      alert("❌ خطأ أثناء إضافة المنتج");
    }
  });

  // ===== ربط زر إضافة المنتج الثابت =====
  const addBtn = document.querySelector(".add-product");
  if (addBtn) addBtn.addEventListener("click", () => openPopup("addItemPopup"));

  fetchStore();
});
