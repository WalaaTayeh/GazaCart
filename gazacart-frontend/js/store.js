document.addEventListener("DOMContentLoaded", async () => {
  const storeId = new URLSearchParams(window.location.search).get("id");

  if (!storeId) {
    alert("❌ لم يتم تحديد المتجر.");
    return;
  }

  const storeNameEl = document.querySelector(".profile-info h2");
  const storeDescEl = document.querySelector(".about p");
  const storeImgEl = document.querySelector(".profile-img");
  const starsEl = document.querySelector(".stars");
  const productsGrid = document.querySelector(".products-grid");

  try {
    const res = await fetch(`https://gazacart.onrender.com/api/stores/${storeId}`);
    if (!res.ok) throw new Error("فشل في جلب بيانات المتجر");
    const store = await res.json();

    storeNameEl.textContent = store.name || "اسم المتجر غير متوفر";
    storeDescEl.textContent = store.description || "لا يوجد وصف متاح.";
  // لتطبيق عرض الصورة في الصفحة الرئيسية أو أي مكان
const imageUrl =
  store.images && store.images.length > 0
    ? `https://gazacart.onrender.com${store.images[0]}`   // أول صورة إذا موجودة
    : store.logo
      ? `https://gazacart.onrender.com${store.logo.replace(/\\/g, "/")}` // اللوجو إذا لم توجد صور
      : "images/profile.jpg"; // صورة افتراضية

storeImgEl.src = imageUrl;


    const rating = store.rating || 0;
    starsEl.textContent = "★".repeat(rating) + "☆".repeat(5 - rating);

    // ✅ تحديث عنوان التاب والأيقونة
    document.title = store.name || "متجر";
    const favicon = document.getElementById("favicon");
    if (favicon) {
      favicon.href =
        store.images && store.images.length > 0
          ? `https://gazacart.onrender.com${store.images[0]}`
          : "images/logocart.svg";
    }

    productsGrid.innerHTML = "";
    if (store.productsList && store.productsList.length > 0) {
      store.productsList.forEach((prod) => {
        const card = document.createElement("div");
        card.className = "card";

        const imageUrl =
          prod.images && prod.images.length > 0
            ? `https://gazacart.onrender.com${prod.images[0]}`
            : "images/Component 1.png";

        const prodRating = prod.rating || 0;

        card.innerHTML = `
          <a href="product.html?id=${prod._id}" class="product-link">
            <div class="card-img">
              <img src="${imageUrl}" alt="${prod.name || 'منتج'}">
            </div>
            <div class="card-header">
              <h4>${prod.name || 'منتج بدون اسم'}</h4>
              <div class="stars">${"★".repeat(prodRating)}${"☆".repeat(5 - prodRating)}</div>
            </div>
            <p class="price">${prod.price ? prod.price + " شيكل" : "-"}</p>
          </a>
          <div class="actions">
            <button class="btn-add-product">أضف للسلة</button>
          </div>
        `;
        productsGrid.appendChild(card);

        // ✅ زر "أضف للسلة"
        const addBtn = card.querySelector(".btn-add-product");
        addBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          addToCart(
            prod._id || "unknown_id",
            prod.name || "منتج بدون اسم",
            store.name || "متجر غير معروف",
            prod.price || 0,
            imageUrl
          );
        });
      });
    } else {
      productsGrid.innerHTML = `<p>لا توجد منتجات حالياً في هذا المتجر.</p>`;
    }
  } catch (err) {
    console.error("❌ خطأ في جلب بيانات المتجر:", err);
    productsGrid.innerHTML = `<p style="color:red;">حدث خطأ أثناء تحميل بيانات المتجر.</p>`;
  }
});
