 //const API_BASE = "https://gazacart.onrender.com/api";
 const API_BASE = "http://127.0.0.1:5000/api"


// ==== lucide icons
window.addEventListener("DOMContentLoaded", ()=>lucide.createIcons());

// ==== LOGIN
const loginPage = document.getElementById("login-page");
const appEl = document.querySelector(".app");
const loginBtn = document.getElementById("loginBtn");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginError = document.getElementById("loginError");

loginBtn.addEventListener("click", async ()=>{
  const email = loginEmail.value.trim();
  const password = loginPassword.value.trim();
  if(!email || !password){
    loginError.textContent = "يرجى إدخال البريد وكلمة المرور";
    loginError.style.display = "block";
    return;
  }
  try {
  const res = await fetch(`${API_BASE}/auth/admin/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

 
  const text = await res.text();

  let data;
  try {
    data = text ? JSON.parse(text) : {}; 
  } catch (err) {
    console.warn("⚠️ الرد ليس JSON:", text);
    data = {};
  }

  if (!res.ok) {
    throw new Error(data.message || `خطأ في الخادم (${res.status})`);
  }

  // ✅ نجاح الدخول
  localStorage.setItem("adminToken", data.token);
  alert(data.message || "تم تسجيل الدخول بنجاح ✅");
  window.location.href = "admin.html";



    // حفظ التوكن واسم الأدمن
    localStorage.setItem("adminToken", data.token);
    localStorage.setItem("adminName", data.user.fullname || "Admin");

    // عرض التطبيق والهيدر
    loginPage.style.display = "none";
    appEl.style.display = "flex";
    document.querySelector("header").style.display = "flex";

    // ضع الاسم مباشرة
    document.getElementById("adminName").textContent = data.user.fullname;

    loadDashboardData();
} catch (err) {
  console.error("❌ فشل تسجيل الدخول:", err);
  loginError.style.display = "block";
  alert(err.message);
}
}); 

// ==== LOGOUT
document.getElementById("logoutTop").addEventListener("click", ()=>{
  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminName");
  
  appEl.style.display = "none";
  document.querySelector("header").style.display = "none";
  loginPage.style.display = "flex";
});

// ==== Sidebar navigation
document.querySelectorAll(".sidebar a").forEach(link=>{
  link.addEventListener("click", e=>{
    e.preventDefault();
    document.querySelectorAll(".sidebar a").forEach(l=>l.classList.remove("active"));
    link.classList.add("active");
    const target = link.dataset.page;
    document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
    document.getElementById(target).classList.add("active");
    lucide.createIcons();
  });
});

// ==== Admin dropdown
const adminBtn = document.getElementById("adminDropdownBtn");
const adminMenu = document.getElementById("adminDropdownMenu");
adminBtn.addEventListener("click", ()=> adminMenu.classList.toggle("active"));
// ==== POPUPS/

function openPopup(type){ document.getElementById(`popup-${type}`).classList.add("active"); }
function closePopup(type){ document.getElementById(`popup-${type}`).classList.remove("active"); }
// تعبئة قائمة المتاجر داخل popup المنتج عند الفتح
function openPopup(type) {
  document.getElementById(`popup-${type}`).classList.add("active");
  if (type === "addProduct") {
    const select = document.getElementById("productStore");
    select.innerHTML = '<option value="">اختر المتجر</option>';
    for (const [id, name] of Object.entries(storesMap)) {
      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = name;
      select.appendChild(opt);
    }
  }
}
// ====== إضافة مستخدم جديد ======
document.getElementById("saveUserBtn").addEventListener("click", async () => {
  const name = document.getElementById("userName").value.trim();
  const email = document.getElementById("userEmail").value.trim();
  const phone = document.getElementById("userPhone").value.trim();
  const password = document.getElementById("userPassword").value.trim();
  const role = document.getElementById("userRole").value;

  if (!name || !email || !phone) {
    return alert("⚠️ يرجى إدخال الاسم والبريد الإلكتروني! ورقم الهاتف ");
  }

  
  if ((role === "merchant" || role === "admin") && !password) {
    return alert("⚠️ كلمة المرور مطلوبة لهذا الدور!");
  }

 const bodyData = { fullname: name,email ,phone, role };
if (role === "merchant" || role === "admin") bodyData.password = password;
console.log("📤 البيانات المرسلة:", { fullname: name, email, phone, role });

  try {
   const res = await fetch(`${API_BASE}/users`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer " + localStorage.getItem("adminToken"), 
  },
  body: JSON.stringify(bodyData),
});


   if (!res.ok) {
  const errText = await res.text();
  throw new Error(errText || "فشل في إنشاء المستخدم");
}

    alert("✅ تم إضافة المستخدم بنجاح!");
    closePopup("addUser");
    location.reload();
  } catch (err) {
    console.error(err);
    alert("❌ خطأ أثناء إضافة المستخدم!");
  }
});
//تعبئة فورم تعديل مستخدم 
function openEditUserPopup(user) {
  currentEditUserId = user._id;

  const editUserNameInput = document.getElementById("editUserName");
  const editUserEmailInput = document.getElementById("editUserEmail");
  const editUserPhoneInput = document.getElementById("editUserPhone");
  const editUserRoleSelect = document.getElementById("editUserRole");
  const editUserPasswordInput = document.getElementById("editUserPassword");

  editUserNameInput.value = user.fullname || "";
  editUserEmailInput.value = user.email || "";
  editUserPhoneInput.value = user.phone || "";
  editUserRoleSelect.value = user.role || "customer";

  // إظهار/إخفاء كلمة المرور حسب الدور
  if (user.role === "merchant" || user.role === "admin") {
  editUserPasswordInput.style.display = "block";
  editUserPasswordInput.placeholder = "اتركه فارغًا إذا لم ترغب بتغيير كلمة المرور";
  editUserPasswordInput.value = ""; // لا نملأه أبد
} else {
  editUserPasswordInput.style.display = "none";
  editUserPasswordInput.value = "";
}

  openPopup("editUser");
}


//دالة لتحديث المستخدم 
document.getElementById("updateUserBtn").addEventListener("click", async () => {
  if (!currentEditUserId) return;

  const name = document.getElementById("editUserName").value.trim();
  const email = document.getElementById("editUserEmail").value.trim();
  const phone = document.getElementById("editUserPhone").value.trim();
  const role = document.getElementById("editUserRole").value;
  const password = document.getElementById("editUserPassword").value.trim();

  if (!name || !email || !phone) {
    return alert("⚠️ يرجى إدخال الاسم والبريد الإلكتروني ورقم الهاتف!");
  }

  const bodyData = { fullname: name, email, phone, role };
  if ((role === "merchant" || role === "admin") && password) {
    bodyData.password = password;
  }

  try {
    const res = await fetch(`${API_BASE}/users/${currentEditUserId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + localStorage.getItem("adminToken")
      },
      body: JSON.stringify(bodyData)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || "فشل في تحديث المستخدم");
    }

    alert("✅ تم تحديث بيانات المستخدم بنجاح!");
    closePopup("editUser");
    loadUsersData(); 
  } catch (err) {
    console.error(err);
    alert("❌ خطأ أثناء تحديث بيانات المستخدم!");
  }
});

// ==== UTILITY
function authHeaders(){
  const token = localStorage.getItem("adminToken");
  if(!token) console.warn("⚠️ adminToken not found in localStorage");
  return token ? { "Authorization": `Bearer ${token}`, "Content-Type": "application/json"} : {"Content-Type":"application/json"};
}
 
// MAIN: load dashboard data (orders, users, stores, products)
async function loadDashboardData() {
  const token = localStorage.getItem("adminToken");
  if (!token) {
    console.warn("⚠️ No admin token, cannot load dashboard");
    return;
  }

  try {
    // تحميل جميع البيانات بالتوازي
    await Promise.all([
      loadUsersData(),
      loadProductsData(),
      loadStoresData(),
      loadOrdersData(),
     loadPendingMerchants()
    ]);

    // بعد تحميل البيانات، نحدث الإحصائيات والمخطط
    updateStatsAndChart();
  } catch (err) {
    console.error("Dashboard load error:", err);
  }
}

 // LOAD USERS
async function loadUsersData() {
  const res = await fetch(`${API_BASE}/auth/all`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to load users");
  const users = await res.json();
  const usersBody = document.getElementById("users-body");
  usersBody.innerHTML = "";
  users.forEach(u => {
    const tr = document.createElement("tr");
   tr.innerHTML = `
  <td>${u.fullname || "-"}</td>
  <td>${u.email || "-"}</td>
  <td>${u.phone || "-"}</td>
  <td>${u.role || "-"}</td>
<td>
  <select onchange="updateUserStatus('${u._id}', this.value)">
    <option value="active" ${u.status === 'active' ? 'selected' : ''}>نشط</option>
    <option value="inactive" ${u.status === 'inactive' ? 'selected' : ''}>غير نشط</option>
    <option value="blocked" ${u.status === 'blocked' ? 'selected' : ''}>محظور</option>
  </select>
</td>


  <td class="actions">
   <button class="btn-edit" onclick='openEditUserPopup(${JSON.stringify(u)})'><i data-lucide="edit-2"></i></button>
    <button class="btn-delete" data-id="${u._id}"><i data-lucide="trash-2"></i></button>
  </td>
    `;
    usersBody.appendChild(tr);
  });
  lucide.createIcons();
}
// حذف مستخدم باستخدام Event Delegation
document.getElementById("users-body").addEventListener("click", async (e) => {
  if (e.target.closest(".btn-delete")) {
    const btn = e.target.closest(".btn-delete");
    const userId = btn.getAttribute("data-id");
    if (!userId) return;
    if (!confirm("⚠️ هل أنت متأكد من حذف هذا المستخدم؟")) return;

    try {
      const res = await fetch(`${API_BASE}/users/${userId}`, {
        method: "DELETE",
        headers: authHeaders()
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "فشل في حذف المستخدم");
      }

      alert(" تم حذف المستخدم بنجاح!");
      loadUsersData();
    } catch (err) {
      console.error("❌ خطأ أثناء حذف المستخدم:", err);
      alert("❌ حدث خطأ أثناء الحذف!");
    }
  }
});
async function updateUserStatus(userId, newStatus) {
  try {
    const res = await fetch(`${API_BASE}/users/${userId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + localStorage.getItem("adminToken")
      },
      body: JSON.stringify({ status: newStatus })
    });
    if (!res.ok) throw new Error("فشل في تحديث الحالة");
    alert("✅ تم تحديث الحالة");
    loadUsersData(); 
  } catch (err) {
    console.error(err);
    alert("❌ خطأ أثناء تحديث الحالة");
  }
}

// عرض التجار 
let currentMerchantId = null;
async function loadMerchants() {
  try {
    const res = await fetch(`${API_BASE}/users?role=merchant`, {
      headers: { "Authorization": "Bearer " + localStorage.getItem("adminToken") }
    });

    if (!res.ok) throw new Error("فشل في تحميل التجار");
    const merchants = await res.json();

    const tbody = document.getElementById("merchants-body");
    tbody.innerHTML = "";

    merchants.forEach(m => {
      const tr = document.createElement("tr");

      // الحالة حسب حالة التاجر
      let actions = "";
      if (m.status === "inactive") {
        actions = `
          <button class="primary-btn" onclick='approveMerchant("${m._id}")'>قبول</button>
          <button class="danger-btn" onclick='rejectMerchant("${m._id}")'>رفض</button>
        `;
      } else if (m.status === "active") {
        actions = `
          <button class="primary-btn" onclick='openAddStorePopup("${m._id}")'>إضافة متجر</button>
        `;
      } else {
        actions = `<span class="text-gray-500">محظور</span>`;
      }

      tr.innerHTML = `
        <td>${m.fullname}</td>
        <td>${m.email}</td>
        <td>${m.phone}</td>
        <td>${m.status}</td>
        <td class="actions">${actions}</td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error(err);
    alert("❌ خطأ أثناء تحميل التجار");
  }
}

// قبول أو رفض التاجر الجديد 
function openMerchantStorePopup(merchantId) {
  currentMerchantId = merchantId;
  openPopup("addStoreForMerchant");
}
async function approveMerchant(merchantId) {
  if (!confirm("هل أنت متأكد من قبول هذا التاجر؟")) return;

  try {
    const res = await fetch(`${API_BASE}/users/${merchantId}/status`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ status: "active" })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "فشل في قبول التاجر");

    alert("✅ تم قبول التاجر بنجاح");

    // مباشرة بعد القبول، افتح popup إضافة المتجر
    currentMerchantId = merchantId;
    document.getElementById("merchantNameDisplay").value = data.user.fullname || "";
    openPopup("addStoreForMerchant");

    loadPendingMerchants(); // تحديث جدول التجار غير النشطين

  } catch (err) {
    console.error(err);
    alert("❌ " + err.message);
  }
}
//رفض 
async function rejectMerchant(merchantId) {
  if (!confirm("هل أنت متأكد من رفض هذا التاجر؟")) return;

  try {
    const res = await fetch(`${API_BASE}/users/${merchantId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + localStorage.getItem("adminToken")
      },
      body: JSON.stringify({ status: "blocked" })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "فشل في رفض التاجر");

    alert(" تم رفض التاجر");
    loadPendingMerchants(); // تحديث الجدول
  } catch (err) {
    console.error(err);
    alert("❌ " + err.message);
  }
}

// حفظ المتجر وربطه بالتاجر
document.getElementById("saveMerchantStoreBtn").addEventListener("click", async () => {
  if (!currentMerchantId) return alert("⚠️ لم يتم تحديد التاجر");

  const name = document.getElementById("merchantStoreName").value.trim();
  const description = document.getElementById("merchantStoreDescription").value.trim();
  const category = document.getElementById("merchantStoreCategory").value;
  const logoInput = document.getElementById("merchantStoreLogo");

  if (!name) return alert("⚠️ يرجى إدخال اسم المتجر");
  if (!category) return alert("⚠️ يرجى اختيار فئة المتجر");

  const formData = new FormData();
  formData.append("name", name);
  formData.append("description", description);
  formData.append("category", category);
  formData.append("ownerId", currentMerchantId);
  // رقم الهاتف يُجلب تلقائيًا من التاجر في السيرفر
  if (logoInput.files[0]) formData.append("image", logoInput.files[0]);

  try {
    const res = await fetch(`${API_BASE}/stores`, {
      method: "POST",
      headers: { "Authorization": "Bearer " + localStorage.getItem("adminToken") },
      body: formData
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "فشل في إنشاء المتجر");

    // بعد الإنشاء، نفعّل التاجر
    await fetch(`${API_BASE}/users/${currentMerchantId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + localStorage.getItem("adminToken")
      },
      body: JSON.stringify({ status: "active" })
    });

    alert("✅ تم إنشاء المتجر ومنح التاجر صلاحية الوصول للداشبورد");
    closePopup("addStoreForMerchant");
    loadPendingMerchants();
    loadStoresData();
  } catch (err) {
    console.error(err);
    alert("❌ خطأ أثناء إنشاء المتجر: " + err.message);
  }
});

// تحميل التجار الجدد
async function loadPendingMerchants() {
  try {
    const res = await fetch(`${API_BASE}/users?role=merchant`, {
      headers: authHeaders()
    });
    if (!res.ok) throw new Error("فشل في تحميل التجار");

    const merchants = await res.json();

    // فلترة التجار غير النشطين فقط
    const pendingMerchants = merchants.filter(m => m.status === "inactive");

    const tbody = document.getElementById("pending-merchants-body");
    tbody.innerHTML = "";

    pendingMerchants.forEach(m => {
      const tr = document.createElement("tr");
      const actions = `
        <button class="primary-btn" onclick='approveMerchant("${m._id}")'>قبول</button>
        <button class="danger-btn" onclick='rejectMerchant("${m._id}")'>رفض</button>
      `;

      tr.innerHTML = `
        <td>${m.fullname}</td>
        <td>${m.email}</td>
        <td>${m.phone}</td>
        <td>${actions}</td>
      `;

      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error(err);
    alert("❌ خطأ أثناء تحميل التجار غير النشطين");
  }
}

// LOAD products
async function loadProductsData() {
  const res = await fetch(`${API_BASE}/products`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to load products");
  const products = await res.json();
  const productsBody = document.getElementById("products-body");
  productsBody.innerHTML = "";
  products.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.name}</td>
      <td>${p.price}</td>
      <td>${p.stock}</td>
      <td>${p.store ? p.store.name : "-"}</td>
      <td>${p.store ? p.store.category : "-"}</td>
      <td class="actions">
        <button class="btn-edit"><i data-lucide="edit-2"></i></button>
        <button class="btn-delete"><i data-lucide="trash-2"></i></button>
      </td>
    `;
    productsBody.appendChild(tr);
    
  });
  lucide.createIcons();
  productsBody.querySelectorAll(".btn-edit").forEach((btn, i) => {
  btn.addEventListener("click", () => openEditProductPopup(products[i]));
});

productsBody.querySelectorAll(".btn-delete").forEach((btn, i) => {
  btn.addEventListener("click", () => deleteProduct(products[i]._id));
});

}

 // خريطة لتخزين أسماء المتاجر حسب الـ ID
let storesMap = {};
// LOAD STORES
async function loadStoresData() {
  try {
    const res = await fetch(`${API_BASE}/stores`, { headers: authHeaders() });
    if (!res.ok) throw new Error("Failed to load stores");
    const stores = await res.json();

    const storesBody = document.getElementById("stores-body");
    storesBody.innerHTML = "";

    storesMap = {};
    stores.forEach((s) => {
      storesMap[s._id] = s.name;

      const createdDate = new Date(s.createdAt).toLocaleDateString("ar-EG");

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td style="display:flex; align-items:center; gap:10px;">
        <span>${s.name}</span>
        </td>
        <td>${s.owner?.fullname || s.owner || "غير معروف"}</td>
        <td>${createdDate}</td>
        <td class="actions">
          <button class="btn-edit" onclick='openEditStorePopup(${JSON.stringify(s)})'><i data-lucide="edit-2"></i></button>
          <button class="btn-delete" onclick='deleteStore("${s._id}")'><i data-lucide="trash-2"></i></button>
        </td>
      `;

      storesBody.appendChild(tr);
    });

    lucide.createIcons();
  } catch (err) {
    console.error("❌ خطأ أثناء تحميل المتاجر:", err);
    alert("تعذر تحميل المتاجر");
  }
}

// 🖼️ معاينة الشعار فورًا بعد الاختيار
const logoInput = document.getElementById("storeLogoInput");
const logoPreview = document.getElementById("logoPreview");

if (logoInput) {
  logoInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) logoPreview.src = URL.createObjectURL(file);
  });
}


//  فتح نافذة إضافة متجر
function openAddStorePopup() {
  openPopup("addStore");

  document.querySelector("#popup-addStore h3").textContent = "إضافة متجر";
  document.getElementById("storeName").value = "";
  document.getElementById("storeOwner").value = "";
  document.getElementById("storeDescription").value = "";
  document.getElementById("storeLogoInput").value = "";
  document.getElementById("logoPreview").src = "images/profile.jpg";

  // إزالة أي onclick سابق للزر وإعادة تعيينه
  const saveBtnOld = document.getElementById("saveStoreBtn");
  const saveBtnNew = saveBtnOld.cloneNode(true);
  saveBtnOld.replaceWith(saveBtnNew);

  saveBtnNew.textContent = "حفظ";
  saveBtnNew.onclick = async () => {
    const name = document.getElementById("storeName").value.trim();
    const owner = document.getElementById("storeOwner").value.trim();
    const description = document.getElementById("storeDescription").value.trim();
    const logoFile = document.getElementById("storeLogoInput").files[0];

    if (!name || !owner) return alert("⚠️ يرجى إدخال اسم المتجر واسم المالك");

    const formData = new FormData();
    formData.append("name", name);
    formData.append("owner", owner);
    formData.append("description", description);
    if (logoFile) formData.append("image", logoFile);

    try {
      const res = await fetch(`${API_BASE}/stores`, {
        method: "POST",
        headers: { Authorization: authHeaders().Authorization },
        body: formData,
      });

      if (!res.ok) throw new Error("فشل في إضافة المتجر");

      alert("✅ تم إضافة المتجر بنجاح");
      closePopup("addStore");
      loadStoresData();
    } catch (err) {
      console.error(err);
      alert("❌ خطأ أثناء إضافة المتجر");
    }
  };
}

// فتح نافذة تعديل متجر
function openEditStorePopup(store) {
  openPopup("addStore");
  document.querySelector("#popup-addStore h3").textContent = "تعديل متجر";

  document.getElementById("storeName").value = store.name || "";
  document.getElementById("storeOwner").value = store.owner?.fullname || store.owner || "";
  document.getElementById("storeDescription").value = store.description || "";

  document.getElementById("logoPreview").src =
    (store.images && store.images.length > 0)
      ? `${API_BASE}${store.images[0]}`
      : (store.logo ? `${API_BASE}${store.logo}` : "images/profile.jpg");

  document.getElementById("storeLogoInput").value = "";

  const saveBtnOld = document.getElementById("saveStoreBtn");
  const saveBtnNew = saveBtnOld.cloneNode(true);
  saveBtnOld.replaceWith(saveBtnNew);

  saveBtnNew.textContent = "تحديث";

  saveBtnNew.onclick = async () => {
    const name = document.getElementById("storeName").value.trim();
    const description = document.getElementById("storeDescription").value.trim();
    const logoFile = document.getElementById("storeLogoInput").files[0];

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    if (logoFile) formData.append("image", logoFile);

    try {
      const res = await fetch(`${API_BASE}/stores/${store._id}`, {
        method: "PUT",
        headers: { Authorization: authHeaders().Authorization },
        body: formData,
      });

      if (!res.ok) throw new Error("فشل في تعديل المتجر");

      alert("✅ تم تعديل المتجر بنجاح");
      closePopup("addStore");
      loadStoresData();
    } catch (err) {
      console.error(err);
      alert("❌ خطأ أثناء تعديل المتجر");
    }
  };
}


//  حذف متجر
async function deleteStore(storeId) {
  if (!confirm("⚠️ هل أنت متأكد من حذف هذا المتجر؟")) return;

  try {
    const res = await fetch(`${API_BASE}/stores/${storeId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });

    if (!res.ok) throw new Error("فشل في حذف المتجر");

    alert(" تم حذف المتجر بنجاح");
    loadStoresData();
  } catch (err) {
    console.error(err);
    alert("❌ حدث خطأ أثناء حذف المتجر");
  }
}
// فتح نافذة الإضافة من الزر الرئيسي
function openAddStorePopup() {
  openPopup("addStore");
  document.querySelector("#popup-addStore h3").textContent = "إضافة متجر";
  document.getElementById("storeName").value = "";
  document.getElementById("storeOwner").value = "";
  document.getElementById("storeDescription").value = "";
  document.getElementById("storeLogoInput").value = "";
  document.getElementById("logoPreview").src = "images/profile.jpg";
  document.getElementById("saveStoreBtn").textContent = "حفظ";
  document.getElementById("saveStoreBtn").onclick = addStore;
}




// ===============================
// 🚀 تحميل الطلبات وعرضها في لوحة الأدمن
async function loadOrdersData() {
  try {
    const res = await fetch(`${API_BASE}/orders`, { headers: authHeaders() });
    if (!res.ok) throw new Error("Failed to load orders");

    const orders = await res.json();
    console.log("📦 الطلبات المستلمة:", orders);

    const ordersBody = document.getElementById("orders-body");
    const dashOrders = document.getElementById("dashboard-orders-body");

    ordersBody.innerHTML = "";
    dashOrders.innerHTML = "";

    const validStatuses = ["pending","processing","shipped","delivered","cancelled","paid","completed"];

    // دالة لإنشاء صف الطلب
    const makeRow = (order) => {
      const productsList = order.items.map(i => `${i.name} (${i.price} شيكل × ${i.quantity})`).join("<br>");
      const storeNames = [...new Set(order.items.map(i => i.product?.store?.name || i.store?.name || "-"))].join(", ");

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${order._id}</td>
        <td>${order.customer?.fullname || "-"}</td>
        <td>${order.totalPrice ?? 0}</td>
        <td>${storeNames}</td>
        <td>${productsList}</td>
        <td>
          <select class="status-select" data-id="${order._id}">
            ${validStatuses.map(s => `<option value="${s}" ${order.status === s ? "selected" : ""}>${s}</option>`).join("")}
          </select>
        </td>
        <td class="actions">
          <button class="btn-edit"><i data-lucide="edit-2"></i></button>
          <button class="btn-delete"><i data-lucide="trash-2"></i></button>
        </td>
      `;
      return tr;
    };

    // عرض كل الطلبات
    orders.forEach(order => {
      const tr = makeRow(order);
      ordersBody.appendChild(tr);
      if (dashOrders.children.length < 5) dashOrders.appendChild(tr.cloneNode(true));
    });

  
    // تحديث حالة الطلب عند تغيير select
    document.querySelectorAll('.status-select').forEach(select => {
      select.addEventListener('change', async (e) => {
        const orderId = e.target.dataset.id;
        const status = e.target.value;

        if (!orderId || !validStatuses.includes(status)) {
          alert('❌ بيانات غير صالحة لتحديث الحالة');
          return;
        }

        try {
          const token = localStorage.getItem('adminToken');
          if (!token) {
            alert('❌ لم يتم تسجيل الدخول أو التوكن غير صالح');
            return;
          }

          const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ status })
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.message || 'فشل في تحديث الحالة');

          alert('✅ تم تحديث حالة الطلب');
          loadOrdersData(); 
        } catch(err) {
          console.error(err);
          alert('❌ خطأ أثناء تحديث الحالة: ' + err.message);
        }
      });
    });

    lucide.createIcons();

  } catch(err) {
    console.error("❌ خطأ أثناء تحميل الطلبات:", err);
    alert('حدث خطأ أثناء تحميل الطلبات: ' + err.message);
  }
}

document.addEventListener('click', async (e) => {
  if (e.target.closest('.btn-delete')) {
    const btn = e.target.closest('.btn-delete');
    const orderId = btn.dataset.id;

    if (!confirm('❌ هل أنت متأكد من حذف هذا الطلب؟')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE}/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer ' + token
        }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'فشل الحذف');

      alert('✅ تم حذف الطلب بنجاح');
      loadOrdersData(); 
    } catch(err) {
      console.error(err);
      alert('❌ خطأ أثناء الحذف: ' + err.message);
    }
  }
});


//  تحديث الإحصائيات والمخطط
let pieChartInstance;
function updateStatsAndChart() {
  const statStores = document.getElementById("stores-body").children.length;
  const statProducts = document.getElementById("products-body").children.length;
  const statOrders = document.getElementById("orders-body").children.length;
  const statUsers = document.getElementById("users-body").children.length;

  document.getElementById("stat-stores").textContent = statStores;
  document.getElementById("stat-products").textContent = statProducts;
  document.getElementById("stat-orders").textContent = statOrders;
  document.getElementById("stat-users").textContent = statUsers;

  const ctx = document.getElementById("pieChart").getContext("2d");
  if (pieChartInstance) {
  pieChartInstance.destroy();
}

pieChartInstance = new Chart(ctx, {
  type: "pie",
  data: {
    labels: ["المتاجر", "المنتجات", "الطلبات", "المستخدمين"],
    datasets: [{
      data: [statStores, statProducts, statOrders, statUsers],
    backgroundColor: ["#4CAF50", "#2196F3", "#FFC107", "#E91E63"], // ألوان اختيارية
    }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: { position: "bottom" },
    }
  }
});

}


// ==== CHECK AUTH ON PAGE LOAD
document.addEventListener("DOMContentLoaded", ()=>{
  const token = localStorage.getItem("adminToken");
  if(token){
    loginPage.style.display = "none";
    appEl.style.display = "flex";
    document.querySelector("header").style.display = "flex";
    document.getElementById("adminName").textContent = localStorage.getItem("adminName") || "Admin";
    loadDashboardData();
  }
});
//  تحديث تلقائي كل دقيقة
setInterval(() => {
  console.log("🔁 Auto-refreshing dashboard data...");
  loadDashboardData();
}, 60000);