// ============================================
// استعادة كلمة المرور — تعيين كلمة مرور جديدة
// ============================================

const RESET_MIN_LENGTH = 6;

function updateLangBtns() {
  document.querySelectorAll("[data-lang]").forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-lang") === currentLang);
  });
}

function switchLang(lang) {
  setLang(lang);
  updateLangBtns();
}

function showMessage(el, text, isError) {
  el.textContent = text;
  el.style.color = isError ? "" : "var(--success)";
  el.style.display = "block";
}

async function initResetPage() {
  setLang(currentLang);
  updateLangBtns();

  const form = document.getElementById("reset-form");
  const errEl = document.getElementById("reset-error");
  const okEl = document.getElementById("reset-success");
  const submitBtn = document.getElementById("reset-submit");
  if (!form || !errEl || !okEl || !submitBtn) return;

  // supabase-js يقرأ رمز الاستعادة من الرابط تلقائياً وينشئ جلسة مؤقتة.
  // بدون جلسة، الرابط غير صالح أو انتهت صلاحيته.
  const {
    data: { session },
  } = await db.auth.getSession();
  if (!session) {
    showMessage(errEl, t("reset_invalid_link"), true);
    form.style.display = "none";
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errEl.style.display = "none";
    okEl.style.display = "none";

    const pass = document.getElementById("reset-password").value;
    const confirm = document.getElementById("reset-confirm").value;

    if (pass !== confirm) {
      showMessage(errEl, t("passwords_mismatch"), true);
      return;
    }
    if (pass.length < RESET_MIN_LENGTH) {
      showMessage(errEl, t("err_weak_password"), true);
      return;
    }

    submitBtn.disabled = true;
    try {
      const { error } = await db.auth.updateUser({ password: pass });
      if (error) throw error;

      form.style.display = "none";
      showMessage(okEl, t("reset_success"), false);

      // إنهاء الجلسة المؤقتة ثم توجيه المستخدم لتسجيل الدخول بكلمة المرور الجديدة.
      await db.auth.signOut();
      setTimeout(() => {
        window.location.replace("login.html");
      }, 2500);
    } catch (err) {
      submitBtn.disabled = false;
      showMessage(errEl, safeAuthErrorMessage(err, "err_generic"), true);
    }
  });
}

document.addEventListener("DOMContentLoaded", initResetPage);
