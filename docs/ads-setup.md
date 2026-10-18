# إعداد Google Ads / GA4 لـ CHRAIM

## الحسابات المطلوبة
- [ ] Google Analytics 4 (https://analytics.google.com)
- [ ] Google Ads (https://ads.google.com)
- [ ] Google AdSense (https://www.google.com/adsense)

## المعرفات (placeholders)
- `G-XXXXXXXXXX` → GA4 Measurement ID (assets/config.js)
- `AW-XXXXXXXXX` → Google Ads Conversion ID (assets/config.js)
- `ca-pub-XXXXXXXXXXXXXXXX` → AdSense Publisher ID (assets/config.js, ads.txt)
- `GOOGLE_VERIFICATION_CODE` → Search Console (index.html, assets/config.js)

## التحويلات المقترحة
- portal_click
- platform_click

## نشر
`powershell -ExecutionPolicy Bypass -File tools\deploy-cloudflare.ps1`

## ملاحظات
Consent Mode v2 مفعّل افتراضياً (denied) حتى قبول المستخدم.
