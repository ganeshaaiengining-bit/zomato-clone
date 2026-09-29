# 🍔 FoodieZone

Zomato-style food delivery web app — **React 19 + Vite 8 + Firebase**.
Clean code structure, Firebase ke liye poori tarah taiyaar, aur bina Firebase ke bhi
chalti hai (demo mode).

**Live URL:** https://zomato-clone-88cd1.web.app
**Firebase project:** `zomato-clone-88cd1`

---

## ✨ Features

| Area | Kya hai |
| --- | --- |
| **Home** | Hero, cuisine circles, filters (rating / delivery / price / pure veg / sort), restaurant grid |
| **Restaurant page** | Banner, ratings, offer, menu categories, dish search, veg-only, sticky cart bar, reviews + rating |
| **Search** | URL-driven search (`/search?query=biryani&sort=delivery&veg=1`) |
| **Cart** | Per-user cart (localStorage), qty stepper, bill details (subtotal, delivery, tax, discount) |
| **Checkout** | Saved addresses, address validation, UPI/Card/COD, order place |
| **My orders** | Order history + live status tracker (placed → preparing → out for delivery → delivered) + cancel |
| **Auth** | Email/password, Google sign-in (Firebase Auth) |
| **Admin** | Restaurant CRUD, dish CRUD, image upload (Cloud Storage), order status, seed import |
| **Infra** | Firestore rules, Storage rules, composite indexes, Hosting rewrites + cache headers, ESLint flat config, env validation |

---

## 🚀 Chalane ke liye (local)

```bash
npm install
npm run dev        # http://localhost:5173
```

**Demo mode (default):** `.env` na ho ya usme keys na hon to app **localStorage + seed
data** par chalti hai — login/cart/orders/admin sab kaam karte hain, koi Firebase
zaroorat nahi.

**Firebase mode:** `.env` me valid keys hone par app Firestore/Auth/Storage use karti hai.

---

## 🔥 Firebase setup — jo ho chuka hai ✅

Project `zomato-clone-88cd1` par already:
- ✅ Web app **`foodiezone`** banaya gaya (config `.env` me hai)
- ✅ **Firestore API** enabled + database banayi (`asia-south1`)
- ✅ **Email/Password** sign-in provider enabled
- ✅ **Firestore rules + indexes** deployed (admin email allow-list ke saath)
- ✅ **Hosting** deployed → https://zomato-clone-88cd1.web.app
- ✅ **Seed data** (8 restaurants, 48 dishes, 3 reviews) Firestore me
- ✅ Admin user: `ganesha.aiengining@gmail.com`

### 🔐 Admin login (email + password)
| Field | Value |
| --- | --- |
| **Email** | `jion@doe.com` |
| **Password** | `john@doe` |
| Panel URL | https://zomato-clone-88cd1.web.app → nav ka **Admin** tab (login ke baad dikhta hai) |

Extra admins / naya admin banana ho to:
```bash
npm run create-admin -- naya@email.com password123
```
> Email `.env` (VITE_ADMIN_EMAILS) **aur** `firestore.rules`/`storage.rules` me dono jagah
> honi chahiye — tabhi Firestore permissions milenge. Rules deploy ke baad turant live.

### Order flow — live tested ✅
`Sign up → restaurant → Add dishes → Cart → Checkout (address + UPI/Card/COD) → Place order`
→ order Firestore me save → **My Orders** me tracker (placed → preparing → out for delivery →
delivered) → admin panel se status update.

### Do cheezein abhi baki hain

**1. Google sign-in — billing chahiye (aapke browser me 2 click)**
Google OAuth client Cloud Console se banata hai, aur abhi Cloud console
**billing/free-trial accept** maang raha hai (yahi wahi step Storage bhi unlock karta hai):

1. [Google Cloud console](https://console.cloud.google.com/apis/credentials?project=zomato-clone-88cd1)
   me upar **"Start free"** / billing add karein ($300 free credit, card mat lagana
   agar nahi karna — Blaze plan activate ho jata hai)
2. Fir wahi page → **Create credentials → OAuth client ID**
   - Consent screen: app name **FoodieZone**, apna email
   - Type **Web application**
   - Authorized JS origin: `https://zomato-clone-88cd1.web.app`
   - Authorized redirect URI: `https://zomato-clone-88cd1.firebaseapp.com/__/auth/handler`
3. Firebase console → [Authentication → Google](https://console.firebase.google.com/project/zomato-clone-88cd1/authentication/providers)
   → Client ID paste → Save

> Abhi tak **Email/Password** login poori tarah kaam kar raha hai (users account bana kar
> order place kar sakte hain) — Google sirf "one-tap" login ka extra option hai.

**2. Cloud Storage images (Blaze plan chahiye)** — billing add karte hi ye bhi unlock ho
jayega. Tab tak admin form me image upload **data URL** me save hoti hai (app kahin nahi
tooti) — Blaze ke baad `src/api/storageApi.js` **khud-ba-khud** Cloud Storage par switch
ho jayega, koi code change nahi.

### Data dubara bharna ho to
```bash
npm run seed        # REST API se 64 records likhta hai (browser ki zarurat nahi)
```

---

## 🚀 Deploy

```bash
npm run deploy            # build + hosting + rules + indexes
npm run deploy:hosting    # sirf frontend
npm run deploy:rules      # sirf Firestore/Storage rules
```

Live URL: **https://zomato-clone-88cd1.web.app**

Deploy se pehle `npm run build` zaroor chalaayein — Vite `VITE_*` values build time par
bundle me daalta hai. `.env` change kiya to dobara build + deploy karein.

---

## 🗂️ Structure

```
foodiezone/
├── index.html
├── firebase.json              # hosting rewrites + cache headers + rules wiring
├── .firebaserc                # default project: zomato-clone-88cd1
├── firestore.rules            # data security
├── storage.rules              # image upload rules (admin only, size/type limit)
├── firestore.indexes.json     # composite indexes (orders by user + date)
├── .env.example               # config template
├── vite.config.js             # manualChunks: firebase alag chunk me
├── eslint.config.js
└── src/
    ├── main.jsx
    ├── App.jsx                # providers + routes (heavy pages lazy-loaded)
    ├── config/firebase.js     # env validation + lazy init (SDK tabhi load ho jab zarurat ho)
    ├── api/
    │   ├── index.js           # backend switch (Firebase ya local demo)
    │   ├── firebaseApi.js     # Firestore + Auth adapter
    │   ├── localApi.js        # localStorage adapter (same interface)
    │   └── storageApi.js      # image upload (Storage ya data URL)
    ├── context/               # Data, Auth, Cart, Toast providers
    ├── hooks/                 # useAsync, useDebounce
    ├── utils/                 # format (currency/date), filters, id
    ├── data/seed.js           # demo/seed content
    ├── components/            # Header, Footer, cards, filters, modals, ui kit
    ├── pages/                 # Home, Search, Restaurant, Cart, Checkout, Orders, Login, Admin
    └── styles/                # tokens.css (design system) + base.css
```

### Architecture notes
- **Adapter pattern:** UI hamesha `useApi()` se baat karta hai — useko pata hi nahi chalta
  Firestore chal raha hai ya localStorage. Isi liye app bina Firebase ke bhi poori tarah
  chalti hai, aur backend switch karna ek line ka kaam hai.
- **Design tokens:** saare colors/spacing/radius `styles/tokens.css` me hain — component CSS
  me koi hard-coded hex nahi.
- **Loading / error states:** har data fetch `useAsync` se hota hai, isliye har page par
  skeleton, spinner aur error message consistent hai.
- **Security:** client keys public hoti hain — asli protection rules me hai. Admin actions
  rules me email allow-list se protected hain, UI check sirf UX ke liye hai.

---

## 🧪 Scripts

| Command | Kaam |
| --- | --- |
| `npm run dev` | Dev server (hot reload) |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Built app locally preview |
| `npm run lint` | ESLint check |
| `npm run emulators` | Firebase emulators (local testing) |
| `npm run seed` | Seed data Firestore me (REST API, browser ki zarurat nahi) |
| `npm run create-admin -- <email> <pass>` | Naya admin user banao (ya password update) |
| `npm run report -- <email> <pass>` | Firestore ka live report (restaurants, dishes, orders) |
| `npm run deploy:hosting` | Build + hosting deploy |
| `npm run deploy:rules` | Firestore + Storage rules deploy |
| `npm run deploy` | Sab kuch deploy |

---

## 🗂️ Firestore data model

```
restaurants/{restaurantId}
    name, tagline, cuisines[], rating, ratingCount, priceLevel,
    deliveryTime, deliveryFee, image, banner,
    address { line1, locality, city }, isOpen, isVegOnly,
    offer { label, code }, menuCategories [{ id, name }]

    restaurants/{id}/items/{itemId}      name, description, price, mrp,
                                         categoryId, image, veg, spicy, bestseller
    restaurants/{id}/reviews/{userId}    rating, comment, userName, createdAt

users/{uid}          name, email, addresses[]
orders/{orderId}     userId, restaurantId, restaurantName, items[], totals{},
                     address, note, paymentMode, status, placedAt
```

---

## 🖼️ Images (Cloud Storage)

Admin → dish/restaurant form → **Upload image**. File `firebase/storage` me jaati hai aur
generated download URL Firestore me save hota hai. Path pattern:
`restaurants/{id}/{timestamp}-file.jpg` aur `dishes/{timestamp}-file.jpg`.

Rules: sirf admin upload kar sakta hai, max 3 MB, sirf image types. Seed data me abhi
Unsplash links hain (browser demo ke liye) — apni images upload karke replace kar lein.
