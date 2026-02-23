# راهنمای دیپلوی Pet Collar QR (همه روی Vercel)

## دیپلوی روی Vercel

1. پروژه را روی GitHub قرار دهید.
2. به [vercel.com](https://vercel.com) بروید و با GitHub وارد شوید.
3. **Add New Project** → مخزن پروژه را انتخاب کنید.
4. تنظیمات:
   - **Root Directory**: خالی بگذارید (ریشهٔ ریپو)
   - **Environment Variables**: در ابتدا نیازی نیست.
5. **Deploy** بزنید.

## دیتابیس (Postgres)

1. در داشبورد Vercel به پروژه بروید.
2. **Storage** (یا **Integrations** → Marketplace) → **Neon** یا هر Postgres provider را اضافه کنید.
3. بعد از اتصال، متغیرهای `POSTGRES_URL` خودکار به پروژه اضافه می‌شوند.
4. یک **Redeploy** انجام دهید.

## متغیرهای محیطی (اختیاری)

- `APP_BASE_URL`: آدرس فرانت (مثلاً `https://your-app.vercel.app`) برای QR ها؛ در صورت عدم تنظیم از `VERCEL_URL` استفاده می‌شود.
- `VITE_API_URL`: برای دیپلوی همه‌چیز روی Vercel لازم نیست (API همان origin است).

## نکات

- فرانت (React) و API (FastAPI) هر دو روی Vercel اجرا می‌شوند.
- دیتابیس Postgres از طریق Neon (یا provider دیگر در Marketplace) تأمین می‌شود.
- بدون Postgres، API خطا می‌دهد؛ حتماً Storage/Integrations را اضافه کنید.
