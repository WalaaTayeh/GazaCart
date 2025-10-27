document.addEventListener("DOMContentLoaded", async () => {
  const productId = new URLSearchParams(window.location.search).get("id");

  const productTitle = document.querySelector(".product-details h2");
  const productDesc = document.querySelector(".product-details p");
  const productPrice = document.querySelector(".product-price");
  const productStars = document.querySelector(".product-details .stars");
  const productImage = document.querySelector(".product-image");
  const relatedGrid = document.querySelector(".products-grid");

  if (!productId) {
    console.error("❌ لا يوجد ID في الرابط");
    return;
  }

  try {
    // جلب بيانات المنتج الرئيسي
    const res = await fetch(`https://gazacart.onrender.com/api/products/${productId}`);
    if (!res.ok) throw new Error("تعذر جلب بيانات المنتج");

    const product = await res.json();

    // تعبئة بيانات المنتج الرئيسي
    productTitle.textContent = product.name;
    productDesc.textContent = product.description || "لا يوجد وصف بعد.";
    productStars.textContent =
      "★".repeat(product.rating || 0) +
      "☆".repeat(5 - (product.rating || 0));
    productPrice.textContent = `${product.price} شيكل`;

    productImage.innerHTML = `
      <img 
        src="${
          product.images && product.images.length > 0
            ? `https://gazacart.onrender.com${product.images[0]}`
            : "images/Component 1.png"
        }" 
        alt="${product.name}" 
        class="product-img"
      />
    `;

    // ✅ تحديث عنوان التاب واللوجو)
    const storeName = product.store?.name || "متجر غير معروف";
    const siteName = "GazaCart"; 
    document.title = `${product.name} – ${storeName} | ${siteName}`;

    const favicon = document.getElementById("favicon");
    if (favicon) favicon.href = "images/logocart.svg"; // 👈 شعار موقعك الدائم

    // ✅ تحديث meta description تلقائيًا من وصف المنتج
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.name = "description";
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute(
      "content",
      product.description
        ? product.description
        : `${product.name} – تسوق الآن من ${storeName} عبر ${siteName}`
    );

    // ✅ إضافة حدث زر "أضف للسلة" للمنتج الرئيسي
    const mainAddBtn = document.querySelector(".product-details .add-product");
    if (mainAddBtn) {
      mainAddBtn.addEventListener("click", () => {
        addToCart(
          product._id,
          product.name,
          storeName,
          product.price,
          product.images && product.images.length > 0
            ? `https://gazacart.onrender.com${product.images[0]}`
            : "images/Component 1.png"
        );
      });
    }

    // جلب المنتجات المتعلقة
const relatedRes = await fetch(
  `https://gazacart.onrender.com/api/products/${productId}/related`
);

    const relatedProducts = await relatedRes.json();

    relatedGrid.innerHTML = "";
    relatedProducts
      .filter((p) => p._id !== productId)
      .forEach((p) => {
        const card = document.createElement("a");
        card.className = "card";
        card.href = `product.html?id=${p._id}`;
        card.innerHTML = `
          <div class="card-img">
            <img src="${
              p.images && p.images.length > 0
                ? `https://gazacart.onrender.com${p.images[0]}`
                : "images/Component 1.png"
            }" alt="${p.name}">
          </div>
          <div class="card-header">
            <h4>${p.name}</h4>
            <div class="stars">${
              "★".repeat(p.rating || 0) + "☆".repeat(5 - (p.rating || 0))
            }</div>
          </div>
          <p class="price">${p.price} شيكل</p>
          <div class="actions">
            <button class="btn-add-product">أضف للسلة </button>
          </div>
        `;
        relatedGrid.appendChild(card);

        // إضافة الحدث على زر "أضف للسلة" في الكاردات
        const addBtn = card.querySelector(".btn-add-product");
        addBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          addToCart(
            p._id,
            p.name,
            p.store?.name || "متجر غير معروف",
            p.price,
            p.images && p.images.length > 0
              ? `https://gazacart.onrender.com${p.images[0]}`
              : "images/Component 1.png"
          );
        });
      });
  } catch (err) {
    console.error("❌ خطأ أثناء تحميل المنتج:", err);
  }
});
