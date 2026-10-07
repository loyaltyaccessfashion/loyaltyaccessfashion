/* =========================================================
   PRODUKTS.JS — সব প্রোডাক্ট এখানে যোগ/এডিট করুন
   =========================================================
   নতুন প্রোডাক্ট যোগ করার নিয়ম:
   {
     id: 9,                          ← ইউনিক নাম্বার (আগেরটার সাথে +১ করে)
     name: "প্রোডাক্টের নাম",
     category: "Watch",              ← Watch / Anime T-Shirt / Home Decor
     price: 1500,                    ← বর্তমান দাম
     oldPrice: 2000,                 ← আগের দাম (না থাকলে 0)
     badge: "NEW",                   ← NEW / HOT / SALE (না থাকলে "")
     image: "ছবির লিংক"              ← আপনার নিজের ছবিও দিতে পারেন
   },
   ========================================================= */

const PRODUCTS = [
  {
    id: 1,
    name: "Premium Chronograph Style Watch",
    category: "Watch",
    price: 1850,
    oldPrice: 2450,
    badge: "NEW",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80"
  },
  {
    id: 2,
    name: "Anime Oversized Heavy Cotton T-Shirt",
    category: "Anime T-Shirt",
    price: 790,
    oldPrice: 1100,
    badge: "HOT",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80"
  },
  {
    id: 3,
    name: "Classic Silver Analog Watch",
    category: "Watch",
    price: 1450,
    oldPrice: 1900,
    badge: "",
    image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&q=80"
  },
  {
    id: 4,
    name: "Aesthetic LED Table Lamp",
    category: "Home Decor",
    price: 950,
    oldPrice: 1350,
    badge: "",
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&q=80"
  },
  {
    id: 5,
    name: "Anime Showpiece Figure",
    category: "Home Decor",
    price: 1250,
    oldPrice: 0,
    badge: "NEW",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80"
  },
  {
    id: 6,
    name: "Minimal Wall Art Frame Set",
    category: "Home Decor",
    price: 1180,
    oldPrice: 1500,
    badge: "",
    image: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&q=80"
  },
  {
    id: 7,
    name: "Naruto Printed Unisex T-Shirt",
    category: "Anime T-Shirt",
    price: 850,
    oldPrice: 1200,
    badge: "HOT",
    image: "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=600&q=80"
  },
  {
    id: 8,
    name: "Luxury Leather Strap Watch",
    category: "Watch",
    price: 2200,
    oldPrice: 2900,
    badge: "",
    image: "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=600&q=80"
  }
];

/* ---------- আপনার WhatsApp নাম্বার (দেশের কোডসহ, + ছাড়া) ---------- */
const WHATSAPP_NUMBER = "8801601866686";

/* ---------- ডেলিভারি চার্জ ---------- */
const DELIVERY = {
  inside: 80,   // ঢাকার ভিতরে
  outside: 130  // ঢাকার বাইরে
};
