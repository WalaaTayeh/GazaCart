document.addEventListener("DOMContentLoaded", () => {

  // دالة عرض المتاجر في الصفحة
  function renderStores(trackId, stores) {
    const track = document.getElementById(trackId);
    if (!track) return;
    track.innerHTML = ""; // تفريغ القديم

    stores.forEach(store => {
      const card = document.createElement("div");
      card.className = "store-card";

    const imageUrl =
  store.images && store.images.length > 0
    ? `https://gazacart.onrender.com${store.images[0]}`
    : store.logo
      ? `https://gazacart.onrender.com/${store.logo.replace(/\\/g, "/")}`
      : "images/Component 1.png";


          

      // أصبح كل متجر رابط قابل للنقر يفتح صفحة home.html مع الـ ID
      card.innerHTML = `
        <a href="home.html?id=${store._id}">
          <img src="${imageUrl}" alt="${store.name}">
          <div class="overlay">
            <p>${store.name}</p>
            <span>${"★".repeat(store.rating || 0)}${"☆".repeat(5 - (store.rating || 0))}</span>
          </div>
        </a>
      `;

      track.appendChild(card);
    });
  }

  // جلب المتاجر من السيرفر
  async function fetchStores(endpoint, trackId) {
    try {
      const res = await fetch(`https://gazacart.onrender.com/api/stores${endpoint}`);
      const stores = await res.json();
      renderStores(trackId, stores);
    } catch (err) {
      console.error(`Error fetching ${trackId}:`, err);
    }
  }

  // جلب الأقسام
  fetchStores("/top", "best-track");
  fetchStores("?category=clothes&limit=6", "clothes-track");
  fetchStores("?category=accessories&limit=6", "accessories-track");
  fetchStores("?category=sweets&limit=6", "sweets-track");

  // نظام البحث الموحد
  const searchInput = document.getElementById("searchInput");
  const searchResults = document.getElementById("searchResults");
  let timeout;

  if (searchInput && searchResults) {
    searchInput.addEventListener("input", () => {
      const query = searchInput.value.trim();
      clearTimeout(timeout);

      if (query.length < 2) {
        searchResults.style.display = "none";
        return;
      }

      timeout = setTimeout(async () => {
        try {
          const url = `https://gazacart.onrender.com/api/stores/search?q=${encodeURIComponent(query)}`;
          const res = await fetch(url);
          if (!res.ok) throw new Error(`HTTP error ${res.status}`);
          const data = await res.json();

          searchResults.innerHTML = "";

          // عرض المتاجر
          if (data.stores && data.stores.length > 0) {
            const storesHeader = document.createElement("div");
            storesHeader.className = "search-header";
            storesHeader.textContent = "🏪 المتاجر:";
            searchResults.appendChild(storesHeader);

            data.stores.forEach(store => {
              const a = document.createElement("a");
              a.className = "search-item";
              a.href = `home.html?id=${store._id}`; // توجه مباشرة للمتجر
              a.innerHTML = `<strong>${store.name}</strong><br><small>${store.category || ''}</small>`;
              searchResults.appendChild(a);
            });
          }

          // عرض المنتجات
          if (data.products && data.products.length > 0) {
            const productsHeader = document.createElement("div");
            productsHeader.className = "search-header";
            productsHeader.textContent = "📦 المنتجات:";
            searchResults.appendChild(productsHeader);

            data.products.forEach(product => {
              const a = document.createElement("a");
              a.className = "search-item";
              a.href = `product.html?id=${product._id}`; // توجه مباشرة للمنتج
              a.innerHTML = `<strong>${product.name}</strong><br><small>${product.price ? product.price + ' شيكل' : '-'}</small>`;
              searchResults.appendChild(a);
            });
          }

          if (
            (!data.stores || data.stores.length === 0) &&
            (!data.products || data.products.length === 0)
          ) {
            searchResults.innerHTML = "<div>لا توجد نتائج مطابقة.</div>";
          }

          searchResults.style.display = "block";
        } catch (err) {
          console.error("❌ Search error:", err);
          searchResults.innerHTML = "<div>حدث خطأ أثناء البحث.</div>";
          searchResults.style.display = "block";
        }
      }, 500);
    });
  }

  // إخفاء نتائج البحث عند الضغط خارجها
  document.addEventListener("click", (e) => {
    const searchBox = document.getElementById("searchInput");
    const resultsBox = document.getElementById("searchResults");

    if (resultsBox && !resultsBox.contains(e.target) && e.target !== searchBox) {
      resultsBox.style.display = "none";
    }
  });

});
