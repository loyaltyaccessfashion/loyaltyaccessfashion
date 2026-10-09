/* =========================================================
   LOYALTY ACCESS FASHION — COMPLETE MAIN.JS
   (Product Display, Cart, Sound, Coupon, 2-Step Payment)
   ========================================================= */

const CART_KEY = 'laf_cart_v1';
const ORDERS_KEY = 'laf_orders_v1';
let currentSelectedGateway = 'bkash';
let appliedCoupon = null;

// সচল কুপন কোড ডাটাবেজ
const VALID_COUPONS = {
  'LOYALTY500': 500,
  'GIFT1000': 1000,
  'VIP2000': 2000,
  'LAF100': 100
};

/* ---------------- 1. PRODUCT DISPLAY ENGINE ---------------- */
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
  const data = list || (typeof PRODUCTS !== 'undefined' ? PRODUCTS : []);
  el.innerHTML = data.map(productCardHTML).join('');
}

/* ---------------- 2. AUDIO & BUTTON ANIMATION ENGINE ---------------- */
let globalAudioCtx = null;

function getAudioContext() {
  if (!globalAudioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) globalAudioCtx = new AudioCtx();
  }
  if (globalAudioCtx && globalAudioCtx.state === 'suspended') {
    globalAudioCtx.resume();
  }
  return globalAudioCtx;
}

function playAudibleClick() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(850, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.06);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.06);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.06);
  } catch (e) {}
}

function playCelebrationSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.08 + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.08);
      osc.stop(ctx.currentTime + i * 0.08 + 0.3);
    });
  } catch(e) {}
}

// গ্লোবাল বাটন প্রেস লিসেনার
document.addEventListener('touchstart', function() { getAudioContext(); }, { once: true });
document.addEventListener('click', function() { getAudioContext(); }, { once: true });

document.addEventListener('pointerdown', function(e) {
  const btn = e.target.closest('button, .btn, a.btn, .cart-btn, .copy-btn, .filter-btn, .qty-btn, .menu-toggle, .gateway-tab, input[type="submit"]');
  if (btn) {
    playAudibleClick();
    btn.classList.remove('btn-clicked-effect');
    void btn.offsetWidth;
    btn.classList.add('btn-clicked-effect');
    setTimeout(() => { btn.classList.remove('btn-clicked-effect'); }, 280);
    if (navigator.vibrate) navigator.vibrate(20);
  }
});

/* ---------------- 3. CART MANAGEMENT ---------------- */
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
  else { cart.push({ id: product.id, name: product.name, price: product.price, image: product.image, qty: qty }); }
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

function cartCount() { return getCart().reduce((sum, i) => sum + i.qty, 0); }
function cartSubtotal() { return getCart().reduce((sum, i) => sum + i.qty * i.price, 0); }

function updateCartBadge() {
  const el = document.getElementById('cartCount');
  if (el) el.textContent = cartCount();
}

/* ---------------- 4. TOAST & MOBILE MENU ---------------- */
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

function toggleMenu() {
  const nav = document.getElementById('mainNav');
  const btn = document.querySelector('.menu-toggle');
  if (!nav) return;
  nav.classList.toggle('open');
  document.body.classList.toggle('menu-open');
  if (btn) {
    if (nav.classList.contains('open')) { btn.innerHTML = '✕'; btn.style.color = '#EAB308'; }
    else { btn.innerHTML = '☰'; btn.style.color = 'var(--gold)'; }
  }
}

/* ---------------- 5. COUPON ENGINE ---------------- */
function triggerConfetti() {
  let canvas = document.getElementById('canvas-confetti');
  if(!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'canvas-confetti';
    document.body.appendChild(canvas);
  }
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const particles = [];
  const colors = ['#EAB308', '#22c55e', '#3b82f6', '#ec4899', '#ffffff'];

  for(let i = 0; i < 60; i++) {
    particles.push({
      x: canvas.width / 2, y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 14, vy: (Math.random() - 0.5) * 14 - 3,
      size: Math.random() * 6 + 4, color: colors[Math.floor(Math.random() * colors.length)], life: 100
    });
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let active = false;
    particles.forEach(p => {
      if(p.life > 0) {
        active = true; p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.life -= 2;
        ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      }
    });
    if(active) requestAnimationFrame(animate);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  animate();
}

function applyCouponCode() {
  const input = document.getElementById('couponInput');
  const badgeWrap = document.getElementById('couponSuccessMsg');
  if(!input) return;
  const code = input.value.trim().toUpperCase();
  if(!code) { showToast('দয়া করে কুপন কোড লিখুন!'); return; }

  if(VALID_COUPONS[code]) {
    appliedCoupon = { code: code, discount: VALID_COUPONS[code] };
    playCelebrationSound();
    triggerConfetti();
    if(badgeWrap) badgeWrap.innerHTML = `<div class="applied-success-badge">🎉 '${code}' কুপন যুক্ত হয়েছে (৳${VALID_COUPONS[code]} ছাড়)!</div>`;
    showToast('🎉 কুপন যুক্ত হয়েছে!');
    if(typeof updateShipping === 'function') updateShipping();
  } else {
    showToast('❌ ভুল কুপন কোড!');
    if(badgeWrap) badgeWrap.innerHTML = '';
  }
}

/* ---------------- 6. CART PAGE RENDER ---------------- */
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

/* ---------------- 7. CHECKOUT PAGE (STEP 1) ---------------- */
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
  const subtotal = cartSubtotal();
  const discount = appliedCoupon ? appliedCoupon.discount : 0;
  let total = (subtotal + fee) - discount;
  if(total < 0) total = 0;

  const s = document.getElementById('coShipping');
  const t = document.getElementById('coTotal');
  if (s) s.textContent = '৳ ' + fee;
  if (t) t.textContent = '৳ ' + total + (discount > 0 ? ` (৳${discount} ছাড়)` : '');
}

// পেমেন্ট পেজে রিডাইরেক্ট ফাংশন (ধাপ ১)
function goToPaymentStep(e) {
  if (e) e.preventDefault();
  const cart = getCart();
  if (cart.length === 0) { showToast('আপনার কার্ট খালি!'); return; }

  const name = document.getElementById('custName').value.trim();
  const phone = document.getElementById('custPhone').value.trim();
  const address = document.getElementById('custAddress').value.trim();
  const area = document.getElementById('deliveryArea').value;
  const fee = area === 'inside' ? DELIVERY.inside : DELIVERY.outside;
  const subtotal = cartSubtotal();
  const discount = appliedCoupon ? appliedCoupon.discount : 0;
  const total = (subtotal + fee) - discount;

  const orderId = 'LA-' + Math.floor(10000 + Math.random() * 90000);

  const pendingData = {
    orderId: orderId, name: name, phone: phone, address: address,
    deliveryArea: area === 'inside' ? 'ঢাকার ভিতরে' : 'ঢাকার বাইরে',
    deliveryFee: fee, subtotal: subtotal, discount: discount, total: total, items: cart
  };

  localStorage.setItem('pending_order_data', JSON.stringify(pendingData));
  showToast('পেমেন্ট পেজে নিয়ে যাওয়া হচ্ছে...');

  setTimeout(() => {
    window.location.href = 'payment.html';
  }, 400);
}

/* ---------------- 8. MULTI-GATEWAY PAYMENT (STEP 2) ---------------- */
function initPaymentPage() {
  const dataRaw = localStorage.getItem('pending_order_data');
  if (!dataRaw) { window.location.href = 'cart.html'; return; }

  const data = JSON.parse(dataRaw);
  const idEl = document.getElementById('payBarOrderId');
  const totEl = document.getElementById('payBarTotal');
  if (idEl) idEl.textContent = data.orderId;
  if (totEl) totEl.textContent = '৳ ' + data.total;
  
  selectGateway('bkash', document.querySelector('.gateway-tab'));
}

function selectGateway(gw, element) {
  currentSelectedGateway = gw;

  document.querySelectorAll('.gateway-tab').forEach(t => t.classList.remove('active'));
  
  if(element) {
    element.classList.add('active');
  } else {
    const tabs = document.querySelectorAll('.gateway-tab');
    if(gw === 'bkash' && tabs[0]) tabs[0].classList.add('active');
    else if(gw === 'nagad' && tabs[1]) tabs[1].classList.add('active');
    else if(gw === 'rocket' && tabs[2]) tabs[2].classList.add('active');
    else if(gw === 'pathao' && tabs[3]) tabs[3].classList.add('active');
    else if(gw === 'uddoktapay' && tabs[4]) tabs[4].classList.add('active');
    else if(gw === 'cod' && tabs[5]) tabs[5].classList.add('active');
  }

  document.querySelectorAll('.gateway-panel').forEach(p => p.style.display = 'none');

  const targetPanel = document.getElementById('panel-' + gw);
  if (targetPanel) {
    targetPanel.style.display = 'block';
  }

  const trxFields = document.getElementById('trxFields');
  if (trxFields) {
    if (gw === 'cod' || gw === 'uddoktapay') {
      trxFields.style.display = 'none';
    } else {
      trxFields.style.display = 'block';
    }
  }
}

function copyText(text, successMsg) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('📋 ' + (successMsg || 'কপি হয়েছে!'));
  }).catch(() => { showToast('কপি করা যায়নি'); });
}

function completeOrderFinal(e) {
  if (e) e.preventDefault();
  const dataRaw = localStorage.getItem('pending_order_data');
  if (!dataRaw) return;

  const data = JSON.parse(dataRaw);
  const gw = currentSelectedGateway;
  let sender = '', trxId = '';

  if (gw !== 'cod' && gw !== 'uddoktapay') {
    sender = document.getElementById('paySenderNum').value.trim();
    trxId = document.getElementById('payTrxId').value.trim();
    if (!sender || !trxId) {
      showToast('দয়া করে সেন্ডার নম্বর ও TrxID লিখুন!');
      return;
    }
  }

  let methodTitle = 'ক্যাশ অন ডেলিভারি (COD)';
  if (gw === 'bkash') methodTitle = 'bKash (বিকাশ)';
  else if (gw === 'nagad') methodTitle = 'Nagad (নগদ)';
  else if (gw === 'rocket') methodTitle = 'Rocket (রকেট)';
  else if (gw === 'pathao') methodTitle = 'Pathao Pay';
  else if (gw === 'uddoktapay') methodTitle = 'UddoktaPay (অটো গেটওয়ে)';

  let msg = '🛒 *নতুন অর্ডার — Loyalty Access*\n';
  msg += '🧾 Order ID: *' + data.orderId + '*\n\n';
  msg += '👤 নাম: ' + data.name + '\n';
  msg += '📞 ফোন: ' + data.phone + '\n';
  msg += '📍 ঠিকানা: ' + data.address + '\n';
  msg += '🚚 ডেলিভারি: ' + data.deliveryArea + '\n\n';
  msg += '📦 *প্রোডাক্ট তালিকা:*\n';
  data.items.forEach(i => {
    msg += '• ' + i.name + ' × ' + i.qty + ' = ৳' + (i.price * i.qty) + '\n';
  });
  msg += '\n💰 সাবটোটাল: ৳' + data.subtotal + '\n';
  msg += '🚚 ডেলিভারি চার্জ: ৳' + data.deliveryFee + '\n';
  if (data.discount > 0) msg += '🎁 কুপন ছাড়: -৳' + data.discount + '\n';
  msg += '💵 *সর্বমোট বিল: ৳' + data.total + '*\n\n';

  msg += '💳 *পেমেন্ট ডিটেইলস:*\n';
  msg += 'পদ্ধতি: ' + methodTitle + '\n';
  if (sender) msg += 'সেন্ডার নম্বর: ' + sender + '\n';
  if (trxId) msg += 'Transaction ID: *' + trxId + '*\n';

  try {
    const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '{}');
    orders[data.orderId] = { code: 1, date: new Date().toLocaleString() };
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch (err) {}

  window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(msg), '_blank');
  localStorage.removeItem(CART_KEY);
  localStorage.removeItem('pending_order_data');

  showToast('✅ অর্ডার কনফার্ম হয়েছে!');
  setTimeout(() => { window.location.href = 'track-order.html?order=' + data.orderId; }, 1500);
}

updateCartBadge();

/* =========================================================
   UDDOKTAPAY DEDICATED AUTOMATED PAYMENT FLOW
   ========================================================= */

// চেকআউট থেকে উদ্যোক্তাপে পেজে রিডাইরেক্ট
function goToUddoktaPayStep(e) {
  if (e) e.preventDefault();
  
  // ফর্ম ভ্যালিডেশন চেক
  const nameEl = document.getElementById('custName');
  const phoneEl = document.getElementById('custPhone');
  const addressEl = document.getElementById('custAddress');

  if (!nameEl.value.trim() || !phoneEl.value.trim() || !addressEl.value.trim()) {
    showToast('দয়া করে আপনার নাম, ফোন নম্বর ও ঠিকানা পূরণ করুন!');
    return;
  }

  const cart = getCart();
  if (cart.length === 0) { showToast('আপনার কার্ট খালি!'); return; }

  const name = nameEl.value.trim();
  const phone = phoneEl.value.trim();
  const address = addressEl.value.trim();
  const area = document.getElementById('deliveryArea').value;
  const fee = area === 'inside' ? DELIVERY.inside : DELIVERY.outside;
  const subtotal = cartSubtotal();
  const discount = typeof appliedCoupon !== 'undefined' && appliedCoupon ? appliedCoupon.discount : 0;
  const total = (subtotal + fee) - discount;

  const orderId = 'LA-' + Math.floor(10000 + Math.random() * 90000);

  const pendingData = {
    orderId: orderId, name: name, phone: phone, address: address,
    deliveryArea: area === 'inside' ? 'ঢাকার ভিতরে' : 'ঢাকার বাইরে',
    deliveryFee: fee, subtotal: subtotal, discount: discount, total: total, items: cart
  };

  localStorage.setItem('pending_order_data', JSON.stringify(pendingData));
  showToast('উদ্যোক্তাপে পেজে নিয়ে যাওয়া হচ্ছে...');

  setTimeout(() => {
    window.location.href = 'uddoktapay.html';
  }, 400);
}

// uddoktapay.html ইনিশিয়ালাইজেশান
function initUddoktaPayPage() {
  const dataRaw = localStorage.getItem('pending_order_data');
  if (!dataRaw) { window.location.href = 'cart.html'; return; }

  const data = JSON.parse(dataRaw);
  const idEl = document.getElementById('upBarOrderId');
  const totEl = document.getElementById('upBarTotal');
  if (idEl) idEl.textContent = data.orderId;
  if (totEl) totEl.textContent = '৳ ' + data.total;
}

// UddoktaPay পেমেন্ট সাবমিট ও হোয়াটসঅ্যাপ মেসেজ
function completeUddoktaPayOrder() {
  const dataRaw = localStorage.getItem('pending_order_data');
  if (!dataRaw) return;

  const data = JSON.parse(dataRaw);

  let msg = '🛒 *নতুন অর্ডার (UddoktaPay Auto Payment) — Loyalty Access*\n';
  msg += '🧾 Order ID: *' + data.orderId + '*\n\n';
  msg += '👤 নাম: ' + data.name + '\n';
  msg += '📞 ফোন: ' + data.phone + '\n';
  msg += '📍 ঠিকানা: ' + data.address + '\n';
  msg += '🚚 ডেলিভারি: ' + data.deliveryArea + '\n\n';
  msg += '📦 *প্রোডাক্ট তালিকা:*\n';
  data.items.forEach(i => {
    msg += '• ' + i.name + ' × ' + i.qty + ' = ৳' + (i.price * i.qty) + '\n';
  });
  msg += '\n💰 সাবটোটাল: ৳' + data.subtotal + '\n';
  msg += '🚚 ডেলিভারি চার্জ: ৳' + data.deliveryFee + '\n';
  if (data.discount > 0) msg += '🎁 কুপন ছাড়: -৳' + data.discount + '\n';
  msg += '💵 *সর্বমোট বিল: ৳' + data.total + '*\n\n';
  msg += '💳 *পেমেন্ট স্ট্যাটাস:* UddoktaPay Gateway (পেন্ডিং/কমপ্লিট)\n';

  try {
    const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '{}');
    orders[data.orderId] = { code: 1, date: new Date().toLocaleString() };
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch (err) {}

  setTimeout(() => {
    window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(msg), '_blank');
    localStorage.removeItem(CART_KEY);
    localStorage.removeItem('pending_order_data');
  }, 1000);
}
