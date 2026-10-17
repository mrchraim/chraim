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
  await logActivity("login", "auth", data.user.id, { email });
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

