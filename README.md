# Lovica Analytics Dashboard

واجهة عربية RTL لداشبورد لوفيكا مبنية بـ React + Vite + Supabase.

## Security model

- لا يوجد `service_role` في الواجهة.
- الواجهة تستخدم فقط Supabase public/publishable key.
- الصلاحيات تعتمد على Supabase Auth + `public.profiles` + RLS.
- البحث عن الجوال يتم عبر RPC آمنة:
  `public.search_customer_by_phone(text)`
- الجداول داخل `private` لا يتم استدعاؤها مباشرة من المتصفح.

## Required environment variables

أضف:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
```

لا تضع `service_role` هنا.

## Browser-only deployment

يمكن رفع المشروع إلى GitHub من المتصفح ثم ربطه بـ Vercel أو Cloudflare Pages.

Build command:

```text
npm run build
```

Output directory:

```text
dist
```

## Current V1

- Login عبر Supabase Auth
- قراءة الدور من `public.profiles`
- منع الحسابات غير النشطة
- واجهة عربية RTL ومتجاوبة
- بحث عميل برقم الجوال باستخدام RPC الآمنة
- عرض:
  - الاسم
  - الجوال
  - البريد
  - المدينة
  - عدد الطلبات
  - إجمالي المشتريات
  - متوسط الطلب
  - أول وآخر طلب
  - عدد الطلبات التي بها استرجاع
  - إجمالي المسترجع

الخطوة التالية: إضافة طبقة Views/RPCs آمنة لمؤشرات المبيعات والمنتجات والمرتجعات.
