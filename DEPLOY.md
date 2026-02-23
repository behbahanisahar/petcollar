# راهنمای دیپلوی Pet Collar QR

## ۱. دیپلوی فرانت‌اند روی Vercel

1. پروژه را روی GitHub قرار دهید.
2. به [vercel.com](https://vercel.com) بروید و با GitHub وارد شوید.
3. **Add New Project** → مخزن پروژه را انتخاب کنید.
4. تنظیمات:
   - **Root Directory**: `frontend` انتخاب کنید (یا در `vercel.json` تنظیم شده)
   - **Environment Variables**:
     - `NEXT_PUBLIC_API_URL` = آدرس بک‌اند (بعد از دیپلوی بک‌اند)
5. **Deploy** بزنید.

## ۲. دیپلوی بک‌اند روی Railway

1. به [railway.app](https://railway.app) بروید و با GitHub وارد شوید.
2. **New Project** → **Deploy from GitHub** → مخزن را انتخاب کنید.
3. تنظیمات سرویس:
   - **Root Directory**: `backend`
   - **Build Command**: (خالی بگذارید یا `pip install -r requirements.txt`)
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. **Variables**:
   - `APP_BASE_URL` = آدرس فرانت‌اند روی Vercel (مثلاً `https://your-app.vercel.app`)
5. **Settings** → **Generate Domain** تا دامنه عمومی بگیرید.
6. آدرس تولیدشده را کپی کنید (مثل `https://xxx.railway.app`).

## ۳. تنظیم متغیر فرانت

1. در Vercel به پروژه بروید.
2. **Settings** → **Environment Variables**
3. متغیر `NEXT_PUBLIC_API_URL` را اضافه کنید با مقدار آدرس بک‌اند Railway (مثل `https://xxx.railway.app`)
4. یک **Redeploy** انجام دهید.

## ۴. نکات

- **دیتابیس**: Railway از SQLite استفاده می‌کند. داده‌ها ممکن است بعد از ری‌دیپلوی پاک شوند. برای دادهٔ پایدار می‌توانید از PostgreSQL استفاده کنید.
- **QR کدها**: هنگام تولید QR در پنل ادمین، آدرس پایه را آدرس فرانت روی Vercel بگذارید (مثلاً `https://your-app.vercel.app`).
