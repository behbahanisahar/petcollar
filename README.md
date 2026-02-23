# Pet Collar QR - قلاده هوشمند حیوان خانگی

سیستم مدیریت قلاده حیوانات با QR کد یکتا. صاحب حیوان می‌تواند اطلاعات را ثبت و قفل کند؛ در صورت گم شدن، دیگران فقط می‌توانند اطلاعات را مشاهده کنند.

## معماری

- **Frontend**: Next.js + shadcn/ui + Persian/RTL + Vazirmatn
- **Backend**: FastAPI (Python) - سریع و امن
- **Database**: SQLite (قابل ارتقا به PostgreSQL)
- **QR Codes**: اسکریپت تولید انبوه برای چاپ روی قلاده‌ها

## اجرا

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```
(درگاه پیش‌فرض: 8000)

### Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local   # و در صورت نیاز NEXT_PUBLIC_API_URL را تنظیم کنید
npm run dev
```
(درگاه پیش‌فرض: 5040)

### تست (بدون QR)
1. Backend و Frontend را اجرا کنید
2. به http://localhost:5040 بروید
3. از «صفحهٔ تست / دمو» یک شناسه وارد کنید، یا به **پنل مدیریت** (/admin) بروید و قلاده تولید کنید
4. فرم راه‌اندازی را پر کنید و قلاده را ثبت کنید
5. با شناسهٔ همان قلاده دوباره وارد شوید؛ صفحهٔ فقط‑مشاهده را می‌بینید
6. «ورود صاحب» → رمز را بزنید → دکمهٔ «ویرایش» ظاهر می‌شود

## تولید QR Code برای تولید انبوه

```bash
cd backend
python scripts/generate_qr_codes.py --count 100 --output ./qr_codes
```

برای ثبت شناسه‌ها در دیتابیس قبل از چاپ:
```bash
python scripts/generate_qr_codes.py --count 100 --output ./qr_codes --seed-db --base-url https://petcollar.ir
```

خروجی:
- تصاویر PNG هر QR در `./qr_codes/`
- لیست شناسه‌ها در `./qr_codes/ids.txt`

## جریان کار

1. **تولید**: هر قلاده یک ID یکتا دارد. QR کد حاوی لینک `https://yourapp.com/p/{ID}` است
2. **راه‌اندازی**: صاحب اسکن می‌کند، فرم را پر می‌کند، PIN تعیین می‌کند و قفل می‌کند
3. **مشاهده**: هر کس اسکن کند فقط اطلاعات حیوان را می‌بیند (مثلاً در صورت گم شدن)
4. **ویرایش**: فقط صاحب با وارد کردن PIN می‌تواند اطلاعات را تغییر دهد

## پنل مدیریت (/admin)

برای ادمین شرکت:
- **تولید QR**: تعداد دلخواه قلادهٔ جدید (۱ تا ۵۰۰)، با امکان تنظیم آدرس پایه برای تست موبایل
- **لیست قلاده‌ها**: جستجو، فیلتر، صفحه‌بندی
- **دانلود ZIP**: QRهای PNG برای چاپ

