# Loyalty Access Fashion — ওয়েবসাইট

## 📁 ফাইলগুলোর কাজ

| ফাইল | কাজ |
|---|---|
| `products.js` | **সব প্রোডাক্ট** এখানে যোগ/এডিট করবেন |
| `orders.js` | **অর্ডার ট্র্যাকিং স্ট্যাটাস** আপডেট করবেন |
| `style.css` | **পুরো ডিজাইন** — রঙ, ফন্ট, বাটন |
| `main.js` | কার্ট, চেকআউট, ট্র্যাকিং লজিক |
| `*.html` | প্রতিটি পেজের কনটেন্ট |

## 🔧 নিয়মিত যা যা এডিট করবেন

### নতুন প্রোডাক্ট যোগ করতে
`products.js` ফাইলে শেষ প্রোডাক্টের পরে কমা দিয়ে নতুন প্রোডাক্ট যোগ করুন।

### অর্ডার ট্র্যাকিং আপডেট করতে
কাস্টমার WhatsApp-এ অর্ডার দিলে Order ID পাবেন (যেমন LA-45678)।
`orders.js` ফাইলে যোগ করুন: `"LA-45678": 1,`
(1=Received, 2=Packed, 3=Shipped, 4=Delivered)

### WhatsApp নাম্বার বদলাতে
`products.js` ফাইলের `WHATSAPP_NUMBER` পরিবর্তন করুন।

### ডেলিভারি চার্জ বদলাতে
`products.js` ফাইলের `DELIVERY` অংশে পরিবর্তন করুন।

## 🚀 GitHub Pages-এ ফ্রি হোস্টিং

1. GitHub.com-এ ফ্রি অ্যাকাউন্ট খুলুন
2. **New repository** তৈরি করুন (`loyalty-access` নামে)
3. এই ১৪টি ফাইল একসাথে আপলোড করুন
4. Repository → **Settings** → **Pages**
5. Branch: `main` সিলেক্ট করে **Save**
6. ২ মিনিট পর লিংক পাবেন: `https://username.github.io/loyalty-access`
