// ============================================
// Authentication Module
// ============================================

// التحقق من حالة تسجيل الدخول
async function checkAuth() {
  const { data: { session } } = await db.auth.getSession();
  if (!session) {
    window.location.href = "login.html";
    return null;
  }
  return session;
}

// تسجيل الدخول
async function signIn(email, password) {
  const { data, error } = await db.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;

  // تحديث آخر دخول
  await db
    .from("profiles")
    .update({ last_login: new Date().toISOString() })
    .eq("id", data.user.id);

  // تسجيل النشاط
  // لم نسجل عنوان البريد في سجل الأنشطة (PII) — نكتفي بالمعرف فقط
  await logActivity("login", "auth", data.user.id, {});
  return data;
}

// تسجيل حساب جديد
async function signUp(email, password, fullName, fullNameAr) {
  const { data, error } = await db.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        full_name_ar: fullNameAr,
      },
    },
  });
  if (error) throw error;
  return data;
}

// تسجيل الخروج
async function signOut() {
  await logActivity("logout", "auth", null, {});
  await db.auth.signOut();
  window.location.href = "login.html";
}

// تسجيل النشاط
async function logActivity(action, entity, entityId, details) {
  try {
    const { data: { user } } = await db.auth.getUser();
    await db.from("activity_log").insert({
      user_id: user?.id || null,
      action,
      entity,
      entity_id: entityId ? String(entityId) : null,
      details,
    });
  } catch (e) {
    console.warn("logActivity failed:", e);
  }
}

// هل يملك المستخدم صلاحية إدارة المنصة؟
// ملاحظة: هذا فحص للواجهة فقط. خط الدفاع الأساسي هو RLS في قاعدة البيانات.
function hasPlatformAdminAccess(profile) {
  if (!profile || !profile.roles) return false;

  const role = profile.roles;
  let perms = role.permissions || {};
  if (typeof perms === "string") {
    try {
      perms = JSON.parse(perms);
    } catch (e) {
      perms = {};
    }
  }

  const name = String(role.name || "").toLowerCase();
  return (
    name === "admin" ||
    name === "administrator" ||
    name === "owner" ||
    perms.admin === true ||
    perms.is_admin === true
  );
}

// رسائل أخطاء المصادقة المعروضة للمستخدم.
// لا نعرض err.message الخام: قد يكشف تفاصيل قاعدة البيانات أو أسماء القيود.
function safeAuthErrorMessage(err, fallbackKey) {
  console.warn("auth error:", err);
  const code = String((err && err.code) || "");
  const byCode = {
    invalid_credentials: "err_invalid_credentials",
    invalid_grant: "err_invalid_credentials",
    email_not_confirmed: "err_email_not_confirmed",
    email_exists: "err_email_exists",
    user_already_exists: "err_email_exists",
    weak_password: "err_weak_password",
    over_email_send_rate_limit: "err_rate_limit",
    over_request_rate_limit: "err_rate_limit",
    over_sms_send_rate_limit: "err_rate_limit",
  };
  return t(byCode[code] || fallbackKey || "err_generic");
}

// الحصول على الملف الشخصي
async function getProfile(userId) {
  const { data, error } = await db
    .from("profiles")
    .select("*, roles(name, name_ar, permissions)")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data;
}

