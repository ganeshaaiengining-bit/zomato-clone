# =============================================================================
#  🌐 LIVE WEBSITE LINKS
# =============================================================================

## 1) Live website (already deployed — kuch karne ki zarurat nahi)

   👉  https://zomato-clone-88cd1.web.app

   Admin login:
      Email:     jion@doe.com
      Password:  john@doe

   Login karne ke baad nav me **"Admin"** tab aa jayega (restaurants / menu / orders).

---

## 2) Apne computer par chalaana hai

### Sabse aasan tarika
   `E:\web side design\foodiezone\start-website.bat`  →  **double-click**

   Phir browser me khul jayega: **http://localhost:5173**

### Terminal se
```bat
cd "E:\web side design\foodiezone"
npm install      <<< sirf pehli baar
npm run dev      <<< har baar
```

Band karne ke liye: terminal me `Ctrl + C`

> Note: agar `npm` na chale to `npm.cmd` likhein — Node ka folder PATH me nahi hota.
> `start-website.bat` ye khud handle kar leta hai.

---

## 3) Production build + deploy (jab code change karein)

```bat
npm run build        :: dist/ me production files
npm run deploy       :: Firebase me live push
```

Deploy ke baad wahi link update ho jata hai: https://zomato-clone-88cd1.web.app

---

## 4) Firebase project

| Kya | Detail |
| --- | --- |
| Console | https://console.firebase.google.com/project/zomato-clone-88cd1 |
| Firestore data | https://console.firebase.google.com/project/zomato-clone-88cd1/firestore |
| Auth users | https://console.firebase.google.com/project/zomato-clone-88cd1/authentication/users |
| Hosting | https://zomato-clone-88cd1.web.app |

---

## 5) ❌ Agar website na chale — troubleshooting

| Problem | Solution |
| --- | --- |
| Chrome me *"This site can't be reached"* | Server abhi start nahi hua. **10-15 second wait karein**, phir Chrome me type karein: `http://localhost:5173` |
| `.bat` click karne par kuch nahi hua | Node.js install hona chahiye — https://nodejs.org → install → dobara double-click |
| Blank page (sirf safed) | `index.html` ko **directly double-click mat karein**. Hamesha `.bat` ya `npm run dev` se chalayein (`file://` par modules block hote hain) |
| Website par *"Firebase se data nahi aa raha"* | Network/firewall `googleapis.com` block kar raha hai. Us screen par **"Demo data se dekhein"** button dabayein — poora app demo data ke saath chalega |
| Restaurant nahi dikh rahe | Upar **"Demo data se dekhein"** click karein, ya `npm run seed` chala kar dobara check karein |
| Port 5173 busy | `npm run dev -- --port 5180` chalayein aur `http://localhost:5180` kholein |
| Data/orders gayab | Admin panel → **Reset demo data** / Firestore console dekhein |
