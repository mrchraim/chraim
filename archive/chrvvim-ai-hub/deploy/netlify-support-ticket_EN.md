# Netlify support ticket — one-time usage reset (ready to paste)

Open: https://www.netlify.com/support/  → "Contact support" → paste the text below.

Fill in the three `<...>` placeholders first, then send.

---

**Subject:** Please help — free educational project offline (usage_exceeded), request a one-time quota reset

Hello Netlify Support,

I am requesting a **one-time usage/quota reset** for my team's account.

**Account / team:** `<TEAM NAME OR SLUG — see Team settings>`
**Login email:** `<YOUR NETLIFY LOGIN EMAIL>`

**Sites affected** (currently returning `503` with body `{"error":"usage_exceeded"}`):

- https://mrchraimfsjpachrvvim.netlify.app/
- https://chrvvim0k0l0a0k0.netlify.app/

**Context**

- These are free, **non-commercial educational/student** projects: a faculty
  portal for law students (Cadi Ayyad / Ibn Zohr University).
- The bandwidth limit was consumed quickly, most likely by a short traffic
  spike plus automated crawlers, not by any commercial activity.
- The sites are now completely offline, which blocks students during the
  academic term.

**Request**

- Please perform a **one-time reset of the current billing cycle usage** so the
  sites come back online, and/or advise the most cost-effective plan for a
  low-traffic educational site.

**What I will do on my side (already prepared)**

- I will publish a permanent `_redirects` rule that **301-redirects every legacy
  URL to a single consolidated primary site**
  (https://mr1mohamed1chraim.netlify.app/). This reduces the number of active
  sites and the total traffic, so this spike should not recur.

Thank you very much for your help.

Best regards,
`<YOUR NAME>`
`<PHONE (optional)>`

---

## After Netlify replies

1. If they reset the quota → run `deploy-legacy-redirects.ps1` to publish the
   301 redirects.
2. If they ask you to upgrade → choose **Personal ($9/mo)**, then run the same
   script.
3. Then run `verify-redirects.ps1` to confirm `301 -> primary`.
