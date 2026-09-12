# ResearchMind - AI Research Agent

ResearchMind is a modern, AI-powered research platform that conducts deep web searches and synthesizes information into professional reports.

ResearchMind یک پلتفرم تحقیقاتی مدرن و مبتنی بر هوش مصنوعی است که جستجوهای عمیق وب را انجام داده و اطلاعات را در قالب گزارش‌های حرفه‌ای ترکیب می‌کند.

---

## 🚀 Connection & Integration Details / جزئیات اتصال و یکپارچه‌سازی

### 🛠️ Backend: Firebase (Native Integration) / بک‌اِند: فایربیس (یکپارچه‌سازی بومی)

This application uses **Firebase** as its primary backend for Authentication, Database (Firestore), and Storage.
این اپلیکیشن از **Firebase** به عنوان بک‌اِند اصلی برای احراز هویت، پایگاه داده (Firestore) و ذخیره‌سازی استفاده می‌کند.

- **Authentication**: Handles user sign-ups, logins (Email/Password), and Google OAuth.
  **احراز هویت**: مدیریت ثبت‌نام، ورود (ایمیل/رمز عبور) و ورود با گوگل (Google OAuth).
- **Firestore**: Stores research history, user profiles, and chat messages.
  **پایگاه داده**: ذخیره تاریخچه تحقیقات، پروفایل‌های کاربری و پیام‌های چت.
- **Firebase Admin**: Used on the server to securely update research status and save AI-generated reports.
  **مدیریت فایربیس**: استفاده در سمت سرور برای به‌روزرسانی امن وضعیت تحقیقات و ذخیره گزارش‌های تولید شده توسط هوش مصنوعی.

#### How to manage connection / نحوه مدیریت اتصال:
The connection is automatically managed via `firebase-applet-config.json`.
اتصال به طور خودکار از طریق فایل `firebase-applet-config.json` مدیریت می‌شود.

- **Environment Variables / متغیرهای محیطی**:
  - `GEMINI_API_KEY`: Required for the AI research engine.
    (برای موتور جستجوی هوش مصنوعی الزامی است)
  - `FIREBASE_PROJECT_ID`: Automatically detected from your workspace settings.
    (به طور خودکار از تنظیمات فضای کاری شما شناسایی می‌شود)

---

### 🔐 Authentication Requirement / ضرورت احراز هویت

**Note**: To conduct any research, a user **must be authenticated**.
**نکته**: برای انجام هرگونه تحقیق، کاربر **حتماً باید وارد حساب کاربری خود شده باشد**.

- Guests can see the landing page but will be redirected to the `/auth` page if they attempt to perform a search.
  مهمان‌ها می‌توانند صفحه اصلی را ببینند، اما اگر بخواهند جستجویی انجام دهند، به صفحه `/auth` هدایت می‌شوند.
- All research data is private and only accessible by the user who created it, enforced by **Firestore Security Rules**.
  تمام داده‌های تحقیقاتی خصوصی هستند و فقط برای کاربری که آن‌ها را ایجاد کرده قابل دسترسی می‌باشند (این مورد توسط قوانین امنیتی Firestore کنترل می‌شود).

---

## 🧬 Tech Stack / تکنولوژی‌های مورد استفاده

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS 4.
- **Backend**: Node.js (Express), Gemini 3.1 Pro (AI Engine).
- **Persistence**: Firebase Firestore.
- **Animations**: Framer Motion.

---

## 🏃 How to Run / نحوه اجرا

1. Ensure `GEMINI_API_KEY` is set in your AI Studio secrets.
   اطمینان حاصل کنید که کلید `GEMINI_API_KEY` در بخش رازهای (Secrets) AI Studio تنظیم شده باشد.
2. Run `npm run dev` to start the full-stack development server.
   دستور `npm run dev` را برای شروع سرور توسعه اجرا کنید.
3. Access the app on port `3000`.
   برنامه در پورت `3000` در دسترس است.

---
*Built with ❤️ using Google AI Studio Build.*
