const WA_NUMBER = "8801601866686"; // আপনার WhatsApp নম্বর (country code সহ)
const CART_KEY = "la_cart_v1";

let products = [];
let cart = loadCart();

// elements
const productGrid = document.getElementById("productGrid");
const cartCount = document.getElementById("cartCount");
const cartItemsEl = document.getElementById("cartItems");
const cartTotalEl = document.getElementById("cartTotal");
const openCartBtn = document.getElementById("openCart");
const closeCartBtn = document.getElementById("closeCart");
const cartDrawer = document.getElementById("cartDrawer");
const backdrop = document.getElementById("backdrop");
const checkoutBtn = document.getElementById("checkoutBtn");
const clearCartBtn = document.getElementById("clearCartBtn");

const searchInput = document.getElementById("searchInput");
const categorySelect = document.getElementById("categorySelect");

const navToggle = document.getElementById("navToggle");
const nav = document.getElementById("nav");

navToggle?.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

function openCart(){
  cartDrawer.classList.add("open");
  cartDrawer.setAttribute("aria-hidden", "false");
  backdrop.hidden = false;
}
function closeCart(){
  cartDrawer.classList.remove("open");
  cartDrawer.setAttribute("aria-hidden", "true");
  backdrop.hidden = true;
}

openCartBtn?.addEventListener("click", openCart);
closeCartBtn?.addEventListener("click", closeCart);
backdrop?.addEventListener("click", closeCart);

function loadCart(){
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch { return []; }
}
function saveCart(){
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function formatBDT(n){ return `৳${n.toLocaleString("en-US")}`; }

function cartTotals(){
  const count = cart.reduce((s,i)=>s+i.qty,0);
  const total = cart.reduce((s,i)=>s+(i.price*i.qty),0);
  return {count, total};
}

function addToCart(productId){
  const p = products.find(x => x.id === productId);
  if(!p) return;

  const item = cart.find(x => x.id === productId);
  if(item) item.qty += 1;
  else cart.push({id:p.id, name:p.name, price:p.price, image:p.image, qty:1});

  saveCart();
  renderCart();
  openCart();
}

function changeQty(id, delta){
  const item = cart.find(x=>x.id===id);
  if(!item) return;
  item.qty += delta;
  if(item.qty <= 0) cart = cart.filter(x=>x.id!==id);
  saveCart();
  renderCart();
}

function clearCart(){
  cart = [];
  saveCart();
  renderCart();
}

function renderCart(){
  const {count, total} = cartTotals();
  cartCount.textContent = count;
  cartTotalEl.textContent = formatBDT(total);

  if(cart.length === 0){
    cartItemsEl.innerHTML = `<p style="color:#a7aab4; margin:8px 0;">কার্ট খালি।</p>`;
    return;
  }

  cartItemsEl.innerHTML = cart.map(i => `
    <div class="cartItem">
      <img src="${i.image}" alt="${i.name}">
      <div>
        <h4>${i.name}</h4>
        <small>${formatBDT(i.price)}</small>
        <div class="qty" style="margin-top:8px;">
          <button onclick="window.__dec('${i.id}')">−</button>
          <strong>${i.qty}</strong>
          <button onclick="window.__inc('${i.id}')">+</button>
        </div>
      </div>
      <strong>${formatBDT(i.price * i.qty)}</strong>
    </div>
  `).join("");
}

window.__inc = (id)=>changeQty(id, +1);
window.__dec = (id)=>changeQty(id, -1);

function renderProducts(list){
  productGrid.innerHTML = list.map(p => `
    <div class="card" style="position:relative;">
      ${p.badge ? `<div class="badge">${p.badge}</div>` : ``}
      <img class="card__img" src="${p.image}" alt="${p.name}">
      <div class="card__body">
        <h3 class="card__title">${p.name}</h3>
        <div class="card__meta">
          <span class="price">${formatBDT(p.price)}</span>
          <span style="color:#a7aab4; font-size:12px;">${p.category || ""}</span>
        </div>
        <button class="addBtn" onclick="window.__add('${p.id}')">Add to cart</button>
      </div>
    </div>
  `).join("");
}

window.__add = (id)=>addToCart(id);

function populateCategories(){
  const cats = Array.from(new Set(products.map(p=>p.category).filter(Boolean)));
  categorySelect.innerHTML = `<option value="all">All</option>` + cats.map(c=>`<option value="${c}">${c}</option>`).join("");
}

function applyFilters(){
  const q = (searchInput.value || "").toLowerCase().trim();
  const cat = categorySelect.value;

  const filtered = products.filter(p => {
    const matchQ = !q || p.name.toLowerCase().includes(q);
    const matchC = (cat === "all") || (p.category === cat);
    return matchQ && matchC;
  });

  renderProducts(filtered);
}

async function init(){
  const res = await fetch("data/products.json");
  products = await res.json();

  populateCategories();
  renderProducts(products);
  renderCart();

  searchInput.addEventListener("input", applyFilters);
  categorySelect.addEventListener("change", applyFilters);

  checkoutBtn.addEventListener("click", checkoutWhatsApp);
  clearCartBtn.addEventListener("click", clearCart);
}

function checkoutWhatsApp(){
  if(cart.length === 0) return;

  const lines = cart.map(i => `• ${i.name} x${i.qty} = ${formatBDT(i.price*i.qty)}`).join("\n");
  const total = cartTotals().total;

  const msg =
`Assalamu Alaikum, আমি অর্ডার করতে চাই:
${lines}

মোট: ${formatBDT(total)}

নাম:
মোবাইল:
ঠিকানা:
ডেলিভারি লোকেশন:`;

  const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank");
}

init();
