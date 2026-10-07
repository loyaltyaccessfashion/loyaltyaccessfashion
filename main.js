/* =========================================================
   MAIN.JS — পুরো সাইটের JavaScript লজিক
   ========================================================= */

const CART_KEY = 'laf_cart_v1';
const ORDERS_KEY = 'laf_orders_v1';

/* ---------------- কার্ট ম্যানেজমেন্ট ---------------- */
function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch (e) { return []; }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(id, qty) {
  qty = qty || 1;
  const product = PRODUCTS.find(p => p.id === id);
  if (!product) return;

  const cart = getCart();
  const existing = cart.find(i => i.id === id);
  if (existing) { existing.qty += qty; }
  else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      qty: qty
    });
  }
  saveCart(cart);
  showToast('✅ কার্টে যুক্ত হয়েছে!');
}

function removeFromCart(id) {
  saveCart(getCart().filter(i => i.id !== id));
  if (typeof renderCartPage === 'function') renderCartPage();
}

function setQty(id, qty) {
  let cart = getCart();
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty = qty;
  if (item.qty < 1) cart = cart.filter(i => i.id !== id);
  saveCart(cart);
  if (typeof renderCartPage === 'function') renderCartPage();
}

function cartCount() {
  return getCart().reduce((sum, i) => sum + i.qty, 0);
}

function cartSubtotal() {
  return getCart().reduce((sum, i) => sum + i.qty * i.price, 0);
}

function updateCartBadge() {
  const el = document.getElementById('cartCount');
  if (el) el.textContent = cartCount();
}

/* ---------------- টোস্ট নোটিফিকেশন ---------------- */
let toastTimer = null;
function showToast(msg) {
  let toast = document.getElementById('globalToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'globalToast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2300);
}

/* ---------------- মোবাইল মেনু ---------------- */
function toggleMenu() {
  const nav = document.getElementById('mainNav');
  if (nav) nav.classList.toggle('open');
}

/* ---------------- প্রোডাক্ট কার্ড / গ্রিড ---------------- */
function productCardHTML(p) {
  const oldPrice = p.oldPrice ? `<span class="price-old">৳ ${p.oldPrice}</span>` : '';
  const badge = p.badge ? `<span class="product-badge">${p.badge}</span>` : '';
  const priceHtml = `<span class="price">৳ ${p.price}</span>${oldPrice}`;

  return `
    <article class="product-card">
      <div class="product-thumb">
        <img src="${p.image}" alt="${p.name}" loading="lazy">
        ${badge}
      </div>
      <div class="product-body">
        <p class="product-cat">${p.category}</p>
        <h3 class="product-title">${p.name}</h3>
        <div class="price-row">${priceHtml}</div>
        <button class="btn btn-outline btn-block btn-sm" onclick="addToCart(${p.id})">🛒 অর্ডার করুন</button>
      </div>
    </article>`;
}

function renderProductGrid(selector, list) {
  const el = document.querySelector(selector);
  if (!el) return;
  const data = list || PRODUCTS;
  el.innerHTML = data.map(productCardHTML).join('');
}

/* ---------------- কার্ট পেজ ---------------- */
function renderCartPage() {
  const wrap = document.getElementById('cartItems');
  if (!wrap) return;
  const cart = getCart();

  if (cart.length === 0) {
    wrap.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🛍️</div>
        <h3>আপনার কার্ট খালি</h3>
        <p>পছন্দের প্রোডাক্ট যোগ করতে কালেকশন পেজে যান।</p>
        <a href="shop.html" class="btn btn-gold">কালেকশন দেখুন</a>
      </div>`;
  } else {
    wrap.innerHTML = cart.map(item => `
      <div class="cart-row">
        <img src="${item.image}" alt="${item.name}">
        <div class="cart-info">
          <h4>${item.name}</h4>
          <p class="price">৳ ${item.price}</p>
          <div class="qty-box">
            <button class="qty-btn" onclick="setQty(${item.id}, ${item.qty - 1})">−</button>
            <span>${item.qty}</span>
            <button class="qty-btn" onclick="setQty(${item.id}, ${item.qty + 1})">+</button>
          </div>
        </div>
        <div class="cart-right">
          <button class="remove-btn" onclick="removeFromCart(${item.id})" title="Remove">✕</button>
          <strong>৳ ${item.price * item.qty}</strong>
        </div>
      </div>
    `).join('');
  }

  const sub = document.getElementById('cartSubtotal');
  if (sub) sub.textContent = '৳ ' + cartSubtotal();

  const btn = document.getElementById('checkoutBtn');
  if (btn) {
    if (cart.length === 0) btn.setAttribute('disabled', '');
    else btn.removeAttribute('disabled');
  }
}

/* ---------------- চেকআউট পেজ ---------------- */
function renderCheckoutPage() {
  const wrap = document.getElementById('checkoutItems');
  if (!wrap) return;
  const cart = getCart();

  if (cart.length === 0) { window.location.href = 'cart.html'; return; }

  wrap.innerHTML = cart.map(i => `
    <div class="summary-item">
      <span>${i.name} × ${i.qty}</span>
      <span>৳ ${i.price * i.qty}</span>
    </div>
  `).join('');

  const sub = document.getElementById('coSubtotal');
  if (sub) sub.textContent = '৳ ' + cartSubtotal();

  updateShipping();
}

function updateShipping() {
  const sel = document.getElementById('deliveryArea');
  if (!sel) return;
  const fee = sel.value === 'inside' ? DELIVERY.inside : DELIVERY.outside;
  const s = document.getElementById('coShipping');
  const t = document.getElementById('coTotal');
  if (s) s.textContent = '৳ ' + fee;
  if (t) t.textContent = '৳ ' + (cartSubtotal() + fee);
}

/* ---------------- অর্ডার সাবমিট (WhatsApp-এ যাবে) ---------------- */
function processOrder(e) {
  e.preventDefault();
  const cart = getCart();
  if (cart.length === 0) { showToast('আপনার কার্ট খালি!'); return; }

  const name = document.getElementById('custName').value.trim();
  const phone = document.getElementById('custPhone').value.trim();
  const address = document.getElementById('custAddress').value.trim();
  const area = document.getElementById('deliveryArea').value;
  const fee = area === 'inside' ? DELIVERY.inside : DELIVERY.outside;
  const subtotal = cartSubtotal();
  const total = subtotal + fee;

  const orderId = 'LA-' + Math.floor(10000 + Math.random() * 90000);

  let msg = '🛒 *নতুন অর্ডার — Loyalty Access*\n';
  msg += '🧾 Order ID: *' + orderId + '*\n\n';
  msg += '👤 নাম: ' + name + '\n';
  msg += '📞 ফোন: ' + phone + '\n';
  msg += '📍 ঠিকানা: ' + address + '\n';
  msg += '🚚 ডেলিভারি: ' + (area === 'inside' ? 'ঢাকার ভিতরে' : 'ঢাকার বাইরে') + '\n\n';
  msg += '📦 *প্রোডাক্ট তালিকা:*\n';
  cart.forEach(i => {
    msg += '• ' + i.name + ' × ' + i.qty + ' = ৳' + (i.price * i.qty) + '\n';
  });
  msg += '\n💰 সাবটোটাল: ৳' + subtotal + '\n';
  msg += '🚚 ডেলিভারি চার্জ: ৳' + fee + '\n';
  msg += '💵 *সর্বমোট: ৳' + total + '*\n';
  msg += '\nপেমেন্ট: ক্যাশ অন ডেলিভারি';

  /* ট্র্যাকিংয়ের জন্য এই ব্রাউজারে সেভ */
  try {
    const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '{}');
    orders[orderId] = { code: 1, date: new Date().toLocaleString() };
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch (err) {}

  window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(msg), '_blank');

  localStorage.removeItem(CART_KEY);
  showToast('✅ WhatsApp-এ অর্ডার পাঠানো হয়েছে!');

  setTimeout(() => { window.location.href = 'track-order.html?order=' + orderId; }, 1600);
}

/* ---------------- অর্ডার ট্র্যাকিং ---------------- */
const TRACK_STEPS = [
  { code: 1, label: 'অর্ডার গৃহীত', icon: '🟡', percent: 15 },
  { code: 2, label: 'প্যাকিং সম্পন্ন', icon: '📦', percent: 40 },
  { code: 3, label: 'কুরিয়ারে পাঠানো', icon: '🚚', percent: 75 },
  { code: 4, label: 'ডেলিভারি Completed', icon: '✅', percent: 100 }
];

function trackOrder() {
  const input = document.getElementById('trackInput');
  const found = document.getElementById('trackResult');
  const notFound = document.getElementById('trackNotFound');
  if (!input || !found) return;

  const id = (input.value || '').trim().toUpperCase();
  found.style.display = 'none';
  if (notFound) notFound.style.display = 'none';
  if (!id) { showToast('অর্ডার আইডি লিখুন'); return; }

  let code = (typeof ORDER_STATUS !== 'undefined') ? ORDER_STATUS[id] : null;

  if (!code) {
    try {
      const local = JSON.parse(localStorage.getItem(ORDERS_KEY) || '{}');
      if (local[id]) code = local[id].code || 1;
    } catch (e) {}
  }

  if (!code) {
    if (notFound) notFound.style.display = 'block';
    return;
  }

  const step = TRACK_STEPS.find(s => s.code === code) || TRACK_STEPS[0];

  document.getElementById('trackOrderId').textContent = id;
  document.getElementById('trackStatusText').textContent = step.icon + ' ' + step.label;
  document.getElementById('trackFill').style.width = step.percent + '%';

  const stepsWrap = document.getElementById('trackSteps');
  if (stepsWrap) {
    stepsWrap.innerHTML = TRACK_STEPS.map(s => {
      const done = s.code <= code ? ' done' : '';
      return '<div class="track-step' + done + '"><span>' + s.icon + '</span><p>' + s.label + '</p></div>';
    }).join('');
  }

  found.style.display = 'block';
}

/* ---------------- হেডার ব্যাজ সব পেজে আপডেট ---------------- */
updateCartBadge();
