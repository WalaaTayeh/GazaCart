document.addEventListener("DOMContentLoaded", async () => {
  const ordersBody = document.getElementById("ordersBody");

  try {
    const user = JSON.parse(localStorage.getItem("currentUser"));
    if (!user) {
      ordersBody.innerHTML = `<tr><td colspan="5">الرجاء تسجيل الدخول لعرض الطلبات</td></tr>`;
      return;
    }

    const res = await fetch(`/api/orders/my-orders?customer=${user._id}`);
    const orders = await res.json();

    if (!orders.length) {
      ordersBody.innerHTML = `<tr><td colspan="5">لا توجد طلبات بعد</td></tr>`;
      return;
    }

    ordersBody.innerHTML = orders.map(order => `
      <tr>
        <td>${order._id.slice(-6)}</td>
        <td>
          ${order.items.map(i => `${i.name} × ${i.quantity}`).join("<br>")}
        </td>
        <td>${order.totalPrice} شيكل</td>
        <td>${translateStatus(order.status)}</td>
        <td>${order.paymentMethod === "bank" ? "تحويل بنكي" : "عند الاستلام"}</td>
      </tr>
    `).join("");
  } catch (err) {
    console.error(err);
    ordersBody.innerHTML = `<tr><td colspan="5">حدث خطأ أثناء جلب الطلبات</td></tr>`;
  }
});

function translateStatus(status) {
  const map = {
    pending: "قيد المعالجة",
    paid: "تم الدفع",
    shipped: "قيد التجهيز",
    completed: "تم التسليم",
    cancelled: "مرفوض"
  };
  return map[status] || status;
}
