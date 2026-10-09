/* =========================================================
   LOYALTY ACCESS FASHION — CORE MASTER JAVASCRIPT
   ========================================================= */

const CART_KEY = 'laf_cart_v1';
const ORDERS_KEY = 'laf_orders_v1';
let currentSelectedGateway = 'bkash';
let appliedCoupon = null;

const VALID_COUPONS = {
  'LOYALTY500': 500,
  'GIFT1000': 1000,
  'VIP2000': 2000,
  'LAF100': 100
};

/* ---------------- 1. AUDIO ENGINE (CLICK & CART SOUND) ---------------- */
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

// সাধারণ বাটন ক্লিক পপ সাউন্ড
function playAudibleClick() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(850, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  } catch (e) {}
}

// কার্টে প্রোডাক্ট যোগ করলে বাই/সেল "Ka-Ching" সাউন্ড
function playCartAddSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(987.77, ctx.currentTime);
    gain1.gain.setValueAtTime(0.2, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.08);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.06);
    gain2.gain.setValueAtTime(0.22, ctx.currentTime + 0.06);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.06);
    osc2.stop(ctx.currentTime + 0.22);
  } catch(e) {}
}

// সাকসেস টিউন সাউন্ড
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
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.08 + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.08);
      osc.stop(ctx.currentTime + i * 0.08 + 0.28);
    });
  } catch(e) {}
}

// গ্লোবাল সাউন্ড ও বাটন ভাইব্রেশন লিসেনার
document.addEventListener('touchstart', function() { getAudioContext(); }, { once: true });
document.addEventListener('click', function() { getAudioContext(); }, { once: true });

document.addEventListener('pointerdown', function(e) {
  const btn = e.target.closest('button, .btn, a.btn, .cart-btn, .copy-btn, .filter-btn, .qty-btn, .menu-toggle, .gateway-tab, input[type="submit"]');
  if (btn) {
    playAudibleClick();
    btn.classList.remove('btn-clicked-effect');
    void btn.offsetWidth;
    btn.classList.add('btn-clicked-effect');
    setTimeout(() => { btn.classList.remove('btn-clicked-effect'); }, 250);
    if (navigator.vibrate) navigator.vibrate(15);
  }
});

/* ---------------- 2. PRODUCT DISPLAY ENGINE ---------------- */
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
  playCartAddSound(); // কার্ট সাউন্ড চলবে
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
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

function toggleMenu() {
  const nav = document.getElementById('mainNav');
  const btn = document.querySelector('.menu-toggle');
  if (!nav) return;
  nav.classList.toggle('open');
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

  for(let i = 0; i < 50; i++) {
    particles.push({
      x: canvas.width / 2, y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 12, vy: (Math.random() - 0.5) * 12 - 2,
      size: Math.random() * 5 + 3, color: colors[Math.floor(Math.random() * colors.length)], life: 100
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
      <div style="text-align:center; padding:50px 20px; background:var(--card); border:1px solid var(--border); border-radius:var(--radius);">
        <div style="font-size:2.8rem; margin-bottom:10px;">🛍️</div>
        <h3 style="color:#fff;">আপনার কার্ট খালি</h3>
        <p style="color:var(--muted); font-size:0.85rem; margin-bottom:16px;">পছন্দের প্রোডাক্ট যোগ করতে কালেকশন পেজে যান।</p>
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
          <button class="remove-btn" onclick="removeFromCart(${item.id})" style="color:#6b7280; margin-bottom:6px;">✕</button>
          <strong style="color:var(--gold); display:block;">৳ ${item.price * item.qty}</strong>
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
  
  // কার্ট খালি থাকলে দোকান পেজে রিডাইরেক্ট করবে
  if (cart.length === 0) { 
    showToast('আপনার কার্ট খালি!');
    window.location.href = 'shop.html'; 
    return; 
  }

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

// চেকআউট থেকে পেমেন্ট পেজে যাওয়া (ম্যানুয়াল পেমেন্ট বাটন)
function goToPaymentStep(e) {
  if (e) e.preventDefault();
  
  const nameEl = document.getElementById('custName');
  const phoneEl = document.getElementById('custPhone');
  const addressEl = document.getElementById('custAddress');

  if (!nameEl.value.trim() || !phoneEl.value.trim() || !addressEl.value.trim()) {
    showToast('দয়া করে আপনার নাম, ফোন নম্বর ও ঠিকানা সঠিকভা‌বে পূরণ করুন!');
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

  setTimeout(() => { window.location.href = 'payment.html'; }, 300);
}

// চেকআউট থেকে উদ্যোক্তাপে পেজে যাওয়া (অটো পেমেন্ট বাটন)
function goToUddoktaPayStep(e) {
  if (e) e.preventDefault();
  
  const nameEl = document.getElementById('custName');
  const phoneEl = document.getElementById('custPhone');
  const addressEl = document.getElementById('custAddress');

  if (!nameEl.value.trim() || !phoneEl.value.trim() || !addressEl.value.trim()) {
    showToast('দয়া করে আপনার নাম, ফোন নম্বর ও ঠিকানা সঠিকভা‌বে পূরণ করুন!');
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
  const discount = appliedCoupon ? appliedCoupon.discount : 0;
  const total = (subtotal + fee) - discount;

  const orderId = 'LA-' + Math.floor(10000 + Math.random() * 90000);

  const pendingData = {
    orderId: orderId, name: name, phone: phone, address: address,
    deliveryArea: area === 'inside' ? 'ঢাকার ভিতরে' : 'ঢাকার বাইরে',
    deliveryFee: fee, subtotal: subtotal, discount: discount, total: total, items: cart
  };

  localStorage.setItem('pending_order_data', JSON.stringify(pendingData));
  showToast('উদ্যোক্তাপে পেজে নিয়ে যাওয়া হচ্ছে...');

  setTimeout(() => { window.location.href = 'uddoktapay.html'; }, 300);
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

  const completedOrderData = {
    orderId: data.orderId,
    total: data.total,
    waMsg: msg
  };

  localStorage.setItem('last_completed_order', JSON.stringify(completedOrderData));

  try {
    const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '{}');
    orders[data.orderId] = { code: 1, date: new Date().toLocaleString() };
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch (err) {}

  localStorage.removeItem(CART_KEY);
  localStorage.removeItem('pending_order_data');

  window.location.href = 'order-success.html';
}

function initUddoktaPayPage() {
  const dataRaw = localStorage.getItem('pending_order_data');
  if (!dataRaw) { window.location.href = 'cart.html'; return; }

  const data = JSON.parse(dataRaw);
  const idEl = document.getElementById('upBarOrderId');
  const totEl = document.getElementById('upBarTotal');
  if (idEl) idEl.textContent = data.orderId;
  if (totEl) totEl.textContent = '৳ ' + data.total;
}

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

  const completedOrderData = {
    orderId: data.orderId,
    total: data.total,
    waMsg: msg
  };

  localStorage.setItem('last_completed_order', JSON.stringify(completedOrderData));

  try {
    const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '{}');
    orders[data.orderId] = { code: 1, date: new Date().toLocaleString() };
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch (err) {}

  localStorage.removeItem(CART_KEY);
  localStorage.removeItem('pending_order_data');

  window.location.href = 'order-success.html';
}

updateCartBadge();
