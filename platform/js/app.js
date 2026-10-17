// ============================================
// Main Application Module - Dashboard
// ============================================

let currentProfile = null;
let currentPage = "dashboard";

// ---------- تهيئة التطبيق ----------
async function initApp() {
  const session = await checkAuth();
  if (!session) return;

  initI18n();
  try {
    currentProfile = await getProfile(session.user.id);
  } catch (e) {
    console.warn("profile error:", e);
  }

  // تحديث الواجهة
  document.getElementById("welcome-msg").textContent =
    t("welcome") + "، " + (currentProfile?.full_name_ar || currentProfile?.full_name || session.user.email);
  document.getElementById("user-email").textContent = session.user.email;

  // اللغة
  updateLangButtons();

  // تحميل البيانات
  await loadStats();
  await loadProjects();
  await loadTasks();
  await loadUsers();
  await loadActivity();
  await loadSettings();
  await loadDocuments();
  await loadEmployees();
  await loadNotifications();
  await loadReports();
  await loadUniversities();
  await loadDepartments();
  await loadSemesters();
  await loadSubjects();
  await loadEduExams();
  await loadAnnouncementsAdmin();
  await loadQuestionsAdmin();
  await loadMessages();

  // التنقل
  setupNavigation();

  // إخفاء شاشة التحميل
  document.getElementById("loading-screen").style.display = "none";
  document.getElementById("app").style.display = "flex";
}

// ---------- التنقل ----------
function setupNavigation() {
  document.querySelectorAll("[data-page]").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const page = link.getAttribute("data-page");
      navigateTo(page);
    });
  });
}

function navigateTo(page) {
  currentPage = page;
  // تحديث الروابط النشطة
  document.querySelectorAll("[data-page]").forEach((l) => l.classList.remove("active"));
  document.querySelector(`[data-page="${page}"]`)?.classList.add("active");
  // إظهار الصفحة
  document.querySelectorAll(".page").forEach((p) => (p.style.display = "none"));
  document.getElementById(`page-${page}`)?.style.setProperty("display", "block");
  // إعادة رسم التقارير عند فتحها (Chart.js لا يرسم في صفحة مخفية)
  if (page === "reports") loadReports();
}

// ---------- الإحصائيات ----------
async function loadStats() {
  const [projects, tasks, users] = await Promise.all([
    db.from("projects").select("id", { count: "exact", head: true }),
    db.from("tasks").select("id, status"),
    db.from("profiles").select("id", { count: "exact", head: true }),
  ]);

  const totalTasks = tasks.data?.length || 0;
  const doneTasks = tasks.data?.filter((t) => t.status === "done").length || 0;
  const pendingTasks = tasks.data?.filter((t) => t.status === "pending").length || 0;
  const activeTasks = tasks.data?.filter((t) => t.status === "in_progress").length || 0;

  setStat("stat-projects", projects.count || 0);
  setStat("stat-tasks", totalTasks);
  setStat("stat-users", users.count || 0);
  setStat("stat-active", activeTasks);
  setStat("stat-done", doneTasks);
  setStat("stat-pending", pendingTasks);
}

function setStat(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

// ---------- المشاريع ----------
async function loadProjects() {
  const { data, error } = await db
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  const tbody = document.getElementById("projects-table");
  if (!tbody) return;

  if (error || !data?.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="no-data">${t("no_projects")}</td></tr>`;
    return;
  }

  tbody.innerHTML = data
    .map(
      (p) => `
    <tr>
      <td>${esc(p.name_ar || p.name)}</td>
      <td>${esc(p.description || "-")}</td>
      <td><span class="badge badge-${p.status}">${t(p.status)}</span></td>
      <td>${new Date(p.created_at).toLocaleDateString(currentLang === "ar" ? "ar-EG" : "en-US")}</td>
      <td>
        <button class="btn-icon" onclick="editProject('${p.id}')" title="${t("edit")}">✏️</button>
        <button class="btn-icon btn-danger" onclick="deleteProject('${p.id}')" title="${t("delete")}">🗑️</button>
      </td>
    </tr>`
    )
    .join("");
}

async function createProject() {
  const name = document.getElementById("proj-name").value.trim();
  const nameAr = document.getElementById("proj-name-ar").value.trim();
  const desc = document.getElementById("proj-desc").value.trim();
  if (!name) return alert("اسم المشروع مطلوب");

  const { error } = await db.from("projects").insert({
    name,
    name_ar: nameAr || name,
    description: desc,
    owner_id: (await db.auth.getUser()).data.user.id,
  });

  if (error) return alert(t("error") + ": " + error.message);

  await logActivity("create", "project", null, { name });
  closeModal("project-modal");
  document.getElementById("proj-form").reset();
  await loadProjects();
  await loadStats();
}

async function deleteProject(id) {
  if (!confirm(t("confirm_delete"))) return;
  const { error } = await db.from("projects").delete().eq("id", id);
  if (error) return alert(t("error"));
  await logActivity("delete", "project", id, {});
  await loadProjects();
  await loadStats();
}

async function editProject(id) {
  const { data } = await db.from("projects").select("*").eq("id", id).single();
  if (!data) return;
  document.getElementById("proj-name").value = data.name;
  document.getElementById("proj-name-ar").value = data.name_ar || "";
  document.getElementById("proj-desc").value = data.description || "";
  openModal("project-modal");
}

// ---------- المهام ----------
async function loadTasks() {
  const { data, error } = await db
    .from("tasks")
    .select("*, profiles!tasks_assigned_to_fkey(full_name, full_name_ar)")
    .order("created_at", { ascending: false });

  const tbody = document.getElementById("tasks-table");
  if (!tbody) return;

  if (error || !data?.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="no-data">${t("no_data")}</td></tr>`;
    return;
  }

  tbody.innerHTML = data
    .map(
      (task) => `
    <tr>
      <td>${esc(task.title)}</td>
      <td><span class="badge badge-${task.status}">${t(task.status)}</span></td>
      <td><span class="badge badge-priority-${task.priority}">${t(task.priority)}</span></td>
      <td>${task.due_date ? new Date(task.due_date).toLocaleDateString(currentLang === "ar" ? "ar-EG" : "en-US") : "-"}</td>
      <td>${esc(task.profiles?.full_name_ar || task.profiles?.full_name || "-")}</td>
      <td>${new Date(task.created_at).toLocaleDateString(currentLang === "ar" ? "ar-EG" : "en-US")}</td>
      <td>
        <button class="btn-icon btn-danger" onclick="deleteTask('${task.id}')" title="${t("delete")}">🗑️</button>
      </td>
    </tr>`
    )
    .join("");
}

async function createTask() {
  const title = document.getElementById("task-title").value.trim();
  const desc = document.getElementById("task-desc").value.trim();
  const priority = document.getElementById("task-priority").value;
  const due = document.getElementById("task-due").value;
  const projectId = document.getElementById("task-project").value;
  if (!title) return alert("عنوان المهمة مطلوب");

  const { error } = await db.from("tasks").insert({
    title,
    description: desc,
    priority,
    due_date: due || null,
    project_id: projectId || null,
    created_by: (await db.auth.getUser()).data.user.id,
  });

  if (error) return alert(t("error") + ": " + error.message);

  await logActivity("create", "task", null, { title });
  closeModal("task-modal");
  document.getElementById("task-form").reset();
  await loadTasks();
  await loadStats();
}

async function deleteTask(id) {
  if (!confirm(t("confirm_delete"))) return;
  await db.from("tasks").delete().eq("id", id);
  await logActivity("delete", "task", id, {});
  await loadTasks();
  await loadStats();
}

// ---------- المستخدمون ----------
async function loadUsers() {
  const { data, error } = await db
    .from("profiles")
    .select("*, roles(name, name_ar)")
    .order("created_at", { ascending: false });

  const tbody = document.getElementById("users-table");
  if (!tbody) return;

  if (error || !data?.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="no-data">${t("no_users")}</td></tr>`;
    return;
  }

  tbody.innerHTML = data
    .map(
      (u) => `
    <tr>
      <td>${esc(u.full_name_ar || u.full_name || "-")}</td>
      <td>${esc(u.email || "-")}</td>
      <td><span class="badge badge-role">${esc(u.roles?.name_ar || u.roles?.name || "-")}</span></td>
      <td><span class="badge badge-${u.is_active ? "active" : "paused"}">${u.is_active ? t("active_user") : t("inactive_user")}</span></td>
      <td>${u.last_login ? new Date(u.last_login).toLocaleDateString(currentLang === "ar" ? "ar-EG" : "en-US") : "-"}</td>
      <td>${new Date(u.created_at).toLocaleDateString(currentLang === "ar" ? "ar-EG" : "en-US")}</td>
    </tr>`
    )
    .join("");
}

// ---------- سجل النشاط ----------
async function loadActivity() {
  const { data } = await db
    .from("activity_log")
    .select("*, profiles(full_name, full_name_ar)")
    .order("created_at", { ascending: false })
    .limit(20);

  const html = !data?.length
    ? `<div class="no-data">${t("no_data")}</div>`
    : data
    .map(
      (a) => `
    <div class="activity-item">
      <span class="activity-icon">${getActionIcon(a.action)}</span>
      <div class="activity-body">
        <strong>${esc(a.profiles?.full_name_ar || a.profiles?.full_name || "-")}</strong>
        <span>${esc(a.action)} ${esc(a.entity || "")}</span>
      </div>
      <time>${new Date(a.created_at).toLocaleString(currentLang === "ar" ? "ar-EG" : "en-US")}</time>
    </div>`
    )
    .join("");

  // ملء قوائم سجل النشاط (الرئيسية + صفحة السجل)
  ["activity-list", "activity-list-2"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  });
}

function getActionIcon(action) {
  const icons = { create: "➕", update: "✏️", delete: "🗑️", login: "🔐", logout: "🚪" };
  return icons[action] || "📋";
}

// ---------- النماذج المنبثقة ----------
function openModal(id) {
  document.getElementById(id)?.classList.add("show");
  // تحميل المشاريع في قائمة المهام
  if (id === "task-modal") loadProjectOptions();
}
function closeModal(id) {
  document.getElementById(id)?.classList.remove("show");
}

async function loadProjectOptions() {
  const { data } = await db.from("projects").select("id, name_ar, name");
  const select = document.getElementById("task-project");
  if (!select) return;
  select.innerHTML = `<option value="">—</option>` +
    (data || []).map((p) => `<option value="${p.id}">${esc(p.name_ar || p.name)}</option>`).join("");
}

// ---------- الإعدادات ----------
async function loadSettings() {
  const { data } = await db.from("settings").select("*");
  if (!data) return;
  const siteName = data.find((s) => s.key === "site_name");
  const siteLang = data.find((s) => s.key === "site_language");
  if (siteName) {
    const el = document.getElementById("setting-site-name");
    if (el) el.value = siteName.value?.ar || siteName.value || "";
  }
  if (siteLang) {
    const sel = document.getElementById("setting-lang");
    if (sel) sel.value = siteLang.value?.default || currentLang;
  }
}

async function saveSettings() {
  const siteName = document.getElementById("setting-site-name").value.trim();
  const lang = document.getElementById("setting-lang").value;
  const now = new Date().toISOString();

  const { error: e1 } = await db
    .from("settings")
    .upsert({ key: "site_name", value: { ar: siteName, en: siteName }, description: "اسم الموقع", updated_at: now }, { onConflict: "key" });
  const { error: e2 } = await db
    .from("settings")
    .upsert({ key: "site_language", value: { default: lang, available: ["ar", "en"] }, description: "اللغة الافتراضية", updated_at: now }, { onConflict: "key" });

  if (e1 || e2) return alert(t("error") + ": " + (e1?.message || e2?.message));
  await logActivity("update", "settings", null, { siteName, lang });
  alert(t("saved_successfully"));
}

// ---------- المستندات ----------
let docsCache = [];

async function loadDocuments() {
  const { data, error } = await db.from("documents").select("*").order("created_at", { ascending: false });
  const tbody = document.getElementById("documents-table");
  if (!tbody) return;
  if (error || !data?.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="no-data">${t("no_documents")}</td></tr>`;
    return;
  }
  docsCache = data;
  tbody.innerHTML = data
    .map(
      (d) => `
    <tr>
      <td>${esc(d.name)}</td>
      <td><span class="badge badge-role">${esc(d.category || "general")}</span></td>
      <td>${formatSize(d.size)}</td>
      <td>${new Date(d.created_at).toLocaleDateString(currentLang === "ar" ? "ar-EG" : "en-US")}</td>
      <td>
        <button class="btn-icon" onclick="downloadDocument('${d.id}')" title="${t("download")}">⬇️</button>
        <button class="btn-icon btn-danger" onclick="deleteDocument('${d.id}')" title="${t("delete")}">🗑️</button>
      </td>
    </tr>`
    )
    .join("");
}

function formatSize(bytes) {
  if (!bytes) return "-";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

async function uploadDocument() {
  const fileInput = document.getElementById("doc-file");
  const file = fileInput?.files[0];
  if (!file) return alert(t("select_file"));
  const category = document.getElementById("doc-category")?.value || "general";
  const path = `${Date.now()}_${file.name.replace(/[^\w.\-؀-ۿ]/g, "_")}`;

  const { error: upErr } = await db.storage.from("documents").upload(path, file);
  if (upErr) return alert(t("error") + ": " + upErr.message);

  const { data: { user } } = await db.auth.getUser();
  const { error } = await db.from("documents").insert({
    name: file.name, path, size: file.size, mime_type: file.type, category, uploaded_by: user.id,
  });
  if (error) return alert(t("error") + ": " + error.message);

  await logActivity("create", "document", null, { name: file.name });
  fileInput.value = "";
  await loadDocuments();
}

async function downloadDocument(id) {
  const doc = docsCache.find((d) => d.id === id);
  if (!doc) return;
  const { data, error } = await db.storage.from("documents").createSignedUrl(doc.path, 3600);
  if (error) return alert(t("error") + ": " + error.message);
  window.open(data.signedUrl, "_blank");
}

async function deleteDocument(id) {
  if (!confirm(t("confirm_delete"))) return;
  const doc = docsCache.find((d) => d.id === id);
  if (doc) await db.storage.from("documents").remove([doc.path]);
  await db.from("documents").delete().eq("id", id);
  await logActivity("delete", "document", id, {});
  await loadDocuments();
}

// ---------- الموارد البشرية ----------
async function loadEmployees() {
  const { data, error } = await db.from("employees").select("*").order("created_at", { ascending: false });
  const tbody = document.getElementById("employees-table");
  if (!tbody) return;
  if (error || !data?.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="no-data">${t("no_employees")}</td></tr>`;
    return;
  }
  tbody.innerHTML = data
    .map(
      (e) => `
    <tr>
      <td>${esc(e.full_name_ar || e.full_name)}</td>
      <td>${esc(e.job_title_ar || e.job_title || "-")}</td>
      <td>${esc(e.department_ar || e.department || "-")}</td>
      <td>${esc(e.phone || "-")}</td>
      <td>${e.salary ? Number(e.salary).toLocaleString(currentLang === "ar" ? "ar-EG" : "en-US") : "-"}</td>
      <td>${e.hire_date ? new Date(e.hire_date).toLocaleDateString(currentLang === "ar" ? "ar-EG" : "en-US") : "-"}</td>
      <td>
        <button class="btn-icon btn-danger" onclick="deleteEmployee('${e.id}')" title="${t("delete")}">🗑️</button>
      </td>
    </tr>`
    )
    .join("");
}

async function createEmployee() {
  const name = document.getElementById("emp-name").value.trim();
  if (!name) return alert(t("employee_name") + " ❗");
  const { error } = await db.from("employees").insert({
    full_name: name, full_name_ar: name,
    job_title: document.getElementById("emp-job").value.trim(),
    job_title_ar: document.getElementById("emp-job").value.trim(),
    department: document.getElementById("emp-dept").value.trim(),
    department_ar: document.getElementById("emp-dept").value.trim(),
    email: document.getElementById("emp-email").value.trim(),
    phone: document.getElementById("emp-phone").value.trim(),
    salary: document.getElementById("emp-salary").value || null,
    hire_date: document.getElementById("emp-hire").value || null,
  });
  if (error) return alert(t("error") + ": " + error.message);
  await logActivity("create", "employee", null, { name });
  closeModal("employee-modal");
  document.getElementById("emp-form").reset();
  await loadEmployees();
}

async function deleteEmployee(id) {
  if (!confirm(t("confirm_delete"))) return;
  await db.from("employees").delete().eq("id", id);
  await logActivity("delete", "employee", id, {});
  await loadEmployees();
}

// ---------- التقارير ----------
let charts = {};

async function loadReports() {
  if (typeof Chart === "undefined") return;
  const [tasksRes, projectsRes] = await Promise.all([
    db.from("tasks").select("status, priority"),
    db.from("projects").select("status"),
  ]);
  const tasks = tasksRes.data || [];
  const projects = projectsRes.data || [];

  const countBy = (arr, key) => arr.reduce((acc, x) => { acc[x[key]] = (acc[x[key]] || 0) + 1; return acc; }, {});

  const statusColors = { pending: "#f59e0b", in_progress: "#3b82f6", review: "#8b5cf6", done: "#10b981", cancelled: "#ef4444" };
  const priorityColors = { low: "#10b981", medium: "#f59e0b", high: "#f97316", urgent: "#ef4444" };
  const projColors = { active: "#3b82f6", paused: "#f59e0b", completed: "#10b981", archived: "#64748b" };

  const ts = countBy(tasks, "status");
  const tp = countBy(tasks, "priority");
  const ps = countBy(projects, "status");

  renderChart("chart-tasks-status", "doughnut", Object.keys(ts), Object.values(ts), (k) => statusColors[k] || "#94a3b8");
  renderChart("chart-tasks-priority", "bar", Object.keys(tp).map((k) => t(k)), Object.values(tp), (k) => priorityColors[Object.keys(tp)[Object.keys(tp).map((x) => t(x)).indexOf(k)]] || "#94a3b8");
  renderChart("chart-projects-status", "pie", Object.keys(ps), Object.values(ps), (k) => projColors[k] || "#94a3b8");
}

function renderChart(id, type, labels, data, colorFn) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  if (charts[id]) charts[id].destroy();
  charts[id] = new Chart(canvas, {
    type,
    data: {
      labels: labels.map((l) => t(l) === l ? l : t(l)),
      datasets: [{ data, backgroundColor: labels.map((l) => colorFn(l)), borderWidth: 2, borderColor: "#fff" }],
    },
    options: {
      responsive: true,
      plugins: { legend: { position: "bottom", labels: { font: { size: 13 } } } },
    },
  });
}

// ---------- الإشعارات ----------
let notifCache = [];

async function loadNotifications() {
  const { data: { user } } = await db.auth.getUser();
  const { data } = await db.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20);
  notifCache = data || [];
  const unread = notifCache.filter((n) => !n.is_read).length;
  const badge = document.getElementById("notif-count");
  if (badge) {
    badge.textContent = unread;
    badge.style.display = unread > 0 ? "inline-block" : "none";
  }
  const list = document.getElementById("notif-list");
  if (!list) return;
  if (!notifCache.length) {
    list.innerHTML = `<div class="no-data">${t("no_notifications")}</div>`;
    return;
  }
  list.innerHTML = notifCache
    .map(
      (n) => `
    <div class="notif-item ${n.is_read ? "" : "unread"}" onclick="markRead('${n.id}')">
      <strong>${esc(n.title)}</strong>
      <p>${esc(n.body || "")}</p>
      <time>${new Date(n.created_at).toLocaleString(currentLang === "ar" ? "ar-EG" : "en-US")}</time>
    </div>`
    )
    .join("");
}

function toggleNotifications() {
  document.getElementById("notif-dropdown")?.classList.toggle("show");
}

async function markRead(id) {
  await db.from("notifications").update({ is_read: true }).eq("id", id);
  await loadNotifications();
}

async function markAllRead() {
  const { data: { user } } = await db.auth.getUser();
  await db.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
  await loadNotifications();
}

async function notify(userId, title, body) {
  await db.from("notifications").insert({ user_id: userId, title, body });
}

// إغلاق قائمة الإشعارات عند النقر خارجها
document.addEventListener("click", (e) => {
  const dd = document.getElementById("notif-dropdown");
  if (dd && dd.classList.contains("show") && !e.target.closest(".notif-wrap")) dd.classList.remove("show");
});

// ---------- التعليم: الجامعات والأقسام ----------
async function loadUniversities() {
  const { data } = await db.from("universities").select("*").order("name_ar");
  const tbody = document.getElementById("universities-table");
  if (!tbody) return;
  tbody.innerHTML = (data || []).map(u => `
    <tr>
      <td>${esc(u.name_ar)}</td><td>${esc(u.name_fr || "-")}</td><td>${esc(u.city || "-")}</td>
      <td><button class="btn-icon btn-danger" onclick="deleteUniversity('${u.id}')" title="${t("delete")}">🗑️</button></td>
    </tr>`).join("") || `<tr><td colspan="4" class="no-data">${t("no_data")}</td></tr>`;
}

async function createUniversity() {
  const name_ar = document.getElementById("uni-ar").value.trim();
  if (!name_ar) return;
  const slug = "u" + Date.now().toString(36);
  const { error } = await db.from("universities").insert({
    slug, name_ar, name_fr: document.getElementById("uni-fr").value.trim(),
    city: document.getElementById("uni-city").value.trim(),
  });
  if (error) return alert(t("error") + ": " + error.message);
  await logActivity("create", "university", null, { name: name_ar });
  closeModal("university-modal");
  document.getElementById("uni-ar").value = ""; document.getElementById("uni-fr").value = ""; document.getElementById("uni-city").value = "";
  await loadUniversities();
}

async function deleteUniversity(id) {
  if (!confirm(t("confirm_delete"))) return;
  await db.from("universities").delete().eq("id", id);
  await logActivity("delete", "university", id, {});
  await loadUniversities();
}

let eduDepsCache = [];
async function loadDepartments() {
  const { data } = await db.from("departments").select("*, universities(name_ar)").order("name_ar");
  const tbody = document.getElementById("departments-table");
  if (!tbody) return;
  eduDepsCache = data || [];
  tbody.innerHTML = eduDepsCache.map(d => `
    <tr>
      <td>${esc(d.universities?.name_ar || "-")}</td><td>${esc(d.name_ar)}</td><td>${esc(d.name_fr || "-")}</td>
      <td><button class="btn-icon btn-danger" onclick="deleteDepartment('${d.id}')" title="${t("delete")}">🗑️</button></td>
    </tr>`).join("") || `<tr><td colspan="4" class="no-data">${t("no_data")}</td></tr>`;
  // قائمة الجامعات في النافذة
  const sel = document.getElementById("dep-uni");
  if (sel && !sel.dataset.loaded) {
    const { data: unis } = await db.from("universities").select("id, name_ar").order("name_ar");
    sel.innerHTML = (unis || []).map(u => `<option value="${u.id}">${esc(u.name_ar)}</option>`).join("");
    sel.dataset.loaded = "1";
  }
}

async function createDepartment() {
  const name_ar = document.getElementById("dep-ar").value.trim();
  const uniId = document.getElementById("dep-uni").value;
  if (!name_ar || !uniId) return;
  const { error } = await db.from("departments").insert({
    university_id: uniId, slug: "d" + Date.now().toString(36), name_ar,
    name_fr: document.getElementById("dep-fr").value.trim(),
  });
  if (error) return alert(t("error") + ": " + error.message);
  await logActivity("create", "department", null, { name: name_ar });
  closeModal("department-modal");
  document.getElementById("dep-ar").value = ""; document.getElementById("dep-fr").value = "";
  await loadDepartments();
}

async function deleteDepartment(id) {
  if (!confirm(t("confirm_delete"))) return;
  await db.from("departments").delete().eq("id", id);
  await loadDepartments();
}

// ---------- التعليم: السداسيات والمواد ----------
async function loadSemesters() {
  const { data } = await db.from("semesters").select("*").order("sort_order");
  const tbody = document.getElementById("semesters-table");
  if (!tbody) return;
  tbody.innerHTML = (data || []).map(s => `
    <tr>
      <td>${esc(s.name_ar)}</td><td>${esc(s.name_fr || "-")}</td>
      <td><button class="btn-icon btn-danger" onclick="deleteSemester('${s.id}')" title="${t("delete")}">🗑️</button></td>
    </tr>`).join("") || `<tr><td colspan="3" class="no-data">${t("no_data")}</td></tr>`;
}

async function createSemester() {
  const name_ar = document.getElementById("sem-ar").value.trim();
  if (!name_ar) return;
  const { error } = await db.from("semesters").insert({
    slug: "sem" + Date.now().toString(36), name_ar,
    name_fr: document.getElementById("sem-fr").value.trim(),
    sort_order: parseInt(document.getElementById("sem-order").value) || 0,
  });
  if (error) return alert(t("error") + ": " + error.message);
  closeModal("semester-modal");
  document.getElementById("sem-ar").value = ""; document.getElementById("sem-fr").value = "";
  await loadSemesters();
}

async function deleteSemester(id) {
  if (!confirm(t("confirm_delete"))) return;
  await db.from("semesters").delete().eq("id", id);
  await loadSemesters();
}

let eduSubjCache = [];
async function loadSubjects() {
  const { data } = await db.from("subjects").select("*, departments(name_ar)").order("name_ar");
  const tbody = document.getElementById("subjects-table");
  if (!tbody) return;
  eduSubjCache = data || [];
  tbody.innerHTML = eduSubjCache.map(s => `
    <tr>
      <td>${esc(s.name_ar)}</td><td>${esc(s.departments?.name_ar || "-")}</td>
      <td>${esc(s.code || "-")}</td><td>${esc(s.code || "-")}</td>
      <td><button class="btn-icon btn-danger" onclick="deleteSubject('${s.id}')" title="${t("delete")}">🗑️</button></td>
    </tr>`).join("") || `<tr><td colspan="5" class="no-data">${t("no_data")}</td></tr>`;
  // قوائم النوافذ
  const depSel = document.getElementById("subj-dep");
  const semSel = document.getElementById("subj-sem");
  if (depSel && !depSel.dataset.loaded) {
    const { data: deps } = await db.from("departments").select("id, name_ar").order("name_ar");
    depSel.innerHTML = (deps || []).map(d => `<option value="${d.id}">${esc(d.name_ar)}</option>`).join("");
    depSel.dataset.loaded = "1";
  }
  if (semSel && !semSel.dataset.loaded) {
    const { data: sems } = await db.from("semesters").select("id, name_ar").order("sort_order");
    semSel.innerHTML = (sems || []).map(s => `<option value="${s.id}">${esc(s.name_ar)}</option>`).join("");
    semSel.dataset.loaded = "1";
  }
}

async function createSubject() {
  const name_ar = document.getElementById("subj-ar").value.trim();
  const depId = document.getElementById("subj-dep").value;
  const semId = document.getElementById("subj-sem").value;
  if (!name_ar || !depId || !semId) return;
  const { error } = await db.from("subjects").insert({
    department_id: depId, semester_id: semId, slug: "s" + Date.now().toString(36),
    name_ar, name_fr: document.getElementById("subj-fr").value.trim(),
    code: document.getElementById("subj-code").value.trim(),
  });
  if (error) return alert(t("error") + ": " + error.message);
  await logActivity("create", "subject", null, { name: name_ar });
  closeModal("subject-modal");
  document.getElementById("subj-ar").value = ""; document.getElementById("subj-fr").value = ""; document.getElementById("subj-code").value = "";
  await loadSubjects();
}

async function deleteSubject(id) {
  if (!confirm(t("confirm_delete"))) return;
  await db.from("subjects").delete().eq("id", id);
  await loadSubjects();
}

// ---------- التعليم: الامتحانات ----------
let eduExamsCache = [];
let eduExamsFilter = "";
async function loadEduExams() {
  const { data } = await db.from("exams").select("*, subjects(name_ar, name_fr)").order("created_at", { ascending: false });
  const tbody = document.getElementById("eduexams-table");
  if (!tbody) return;
  eduExamsCache = data || [];
  renderEduExams();
  // قائمة المواد في نافذة الرفع
  const sel = document.getElementById("ee-subject");
  if (sel && !sel.dataset.loaded) {
    const { data: subs } = await db.from("subjects").select("id, name_ar").order("name_ar");
    sel.innerHTML = (subs || []).map(s => `<option value="${s.id}">${esc(s.name_ar)}</option>`).join("");
    sel.dataset.loaded = "1";
  }
}

function filterEduExams(status, btn) {
  eduExamsFilter = status;
  document.querySelectorAll("#page-eduexams .chip").forEach(c => c.classList.remove("active"));
  if (btn) btn.classList.add("active");
  renderEduExams();
}

function renderEduExams() {
  const tbody = document.getElementById("eduexams-table");
  if (!tbody) return;
  const filtered = eduExamsFilter ? eduExamsCache.filter(e => e.status === eduExamsFilter) : eduExamsCache;
  const statusBadge = { pending: "badge-pending", approved: "badge-done", rejected: "badge-cancelled" };
  tbody.innerHTML = filtered.map(e => `
    <tr>
      <td>${esc(e.subjects?.name_ar || "-")}</td>
      <td>${e.exam_type === "assignment" ? "📝 " + t("assignment") : "📋 " + t("exam")} ${e.year || ""}</td>
      <td>${e.year || "-"}</td>
      <td><span class="badge ${statusBadge[e.status] || ""}">${t(e.status)}</span>${e.status === "pending" && e.contributor_name ? `<br><small>${esc(e.contributor_name)}</small>` : ""}</td>
      <td>
        ${e.status === "pending" ? `
          <button class="btn-icon" onclick="reviewEduExam('${e.id}', 'approved')" title="${t("approved")}">✅</button>
          <button class="btn-icon btn-danger" onclick="reviewEduExam('${e.id}', 'rejected')" title="${t("rejected")}">❌</button>` : ""}
        <button class="btn-icon" onclick="downloadEduExam('${e.id}')" title="${t("download")}">⬇️</button>
        <button class="btn-icon btn-danger" onclick="deleteEduExam('${e.id}', '${e.file_path}')" title="${t("delete")}">🗑️</button>
      </td>
    </tr>`).join("") || `<tr><td colspan="5" class="no-data">${t("no_data")}</td></tr>`;
}

async function reviewEduExam(id, status) {
  await db.from("exams").update({ status }).eq("id", id);
  await logActivity("update", "exam", id, { status });
  await loadEduExams();
}

async function createEduExam() {
  const subjectId = document.getElementById("ee-subject").value;
  const file = document.getElementById("ee-file").files[0];
  const corr = document.getElementById("ee-corr").files[0];
  if (!subjectId || !file) return;
  const path = `admin/${Date.now()}_${file.name.replace(/[^\w.\-؀-ۿ]/g, "_")}`;
  const { error: upErr } = await db.storage.from("edu-files").upload(path, file);
  if (upErr) return alert(upErr.message);
  let corrPath = null;
  if (corr) {
    corrPath = `admin/${Date.now()}_corr_${corr.name.replace(/[^\w.\-؀-ۿ]/g, "_")}`;
    await db.storage.from("edu-files").upload(corrPath, corr);
  }
  const { error } = await db.from("exams").insert({
    subject_id: subjectId, exam_type: document.getElementById("ee-type").value,
    year: document.getElementById("ee-year").value || null,
    has_correction: !!corr, file_path: path, correction_path: corrPath, status: "approved",
  });
  if (error) return alert(t("error") + ": " + error.message);
  await logActivity("create", "exam", null, {});
  closeModal("eduexam-modal");
  await loadEduExams();
}

async function downloadEduExam(id) {
  const exam = eduExamsCache.find(e => e.id === id);
  if (!exam) return;
  const { data } = await db.storage.from("edu-files").createSignedUrl(exam.file_path, 3600);
  if (data) window.open(data.signedUrl, "_blank");
}

async function deleteEduExam(id, path) {
  if (!confirm(t("confirm_delete"))) return;
  if (path) await db.storage.from("edu-files").remove([path]);
  await db.from("exams").delete().eq("id", id);
  await logActivity("delete", "exam", id, {});
  await loadEduExams();
}

// ---------- التعليم: الإعلانات ----------
let annCache = [];
async function loadAnnouncementsAdmin() {
  const { data } = await db.from("announcements").select("*, universities(name_ar)").order("created_at", { ascending: false });
  const tbody = document.getElementById("announcements-table");
  if (!tbody) return;
  annCache = data || [];
  tbody.innerHTML = annCache.map(a => `
    <tr>
      <td>${esc(a.title_ar)}</td><td>${t(a.category)}</td>
      <td><span class="badge ${a.is_published ? "badge-done" : "badge-pending"}">${a.is_published ? t("approved") : t("pending")}</span></td>
      <td>
        <button class="btn-icon" onclick="toggleAnnouncement('${a.id}', ${!a.is_published})" title="${a.is_published ? t("pending") : t("approved")}">${a.is_published ? "⏸️" : "✅"}</button>
        <button class="btn-icon btn-danger" onclick="deleteAnnouncement('${a.id}')" title="${t("delete")}">🗑️</button>
      </td>
    </tr>`).join("") || `<tr><td colspan="4" class="no-data">${t("no_data")}</td></tr>`;
}

async function createAnnouncement() {
  const title_ar = document.getElementById("ann-title").value.trim();
  if (!title_ar) return;
  const published = document.getElementById("ann-published").checked;
  const { error } = await db.from("announcements").insert({
    title_ar, body: document.getElementById("ann-body").value.trim(),
    category: document.getElementById("ann-cat").value,
    link: document.getElementById("ann-link").value.trim() || null,
    is_published: published, published_at: published ? new Date().toISOString() : null,
  });
  if (error) return alert(t("error") + ": " + error.message);
  await logActivity("create", "announcement", null, { title: title_ar });
  closeModal("announcement-modal");
  document.getElementById("ann-title").value = ""; document.getElementById("ann-body").value = ""; document.getElementById("ann-link").value = "";
  await loadAnnouncementsAdmin();
}

async function toggleAnnouncement(id, publish) {
  await db.from("announcements").update({ is_published: publish, published_at: publish ? new Date().toISOString() : null }).eq("id", id);
  await loadAnnouncementsAdmin();
}

async function deleteAnnouncement(id) {
  if (!confirm(t("confirm_delete"))) return;
  await db.from("announcements").delete().eq("id", id);
  await loadAnnouncementsAdmin();
}

// ---------- التعليم: الأسئلة ----------
async function loadQuestionsAdmin() {
  const { data } = await db.from("edu_questions").select("*, subjects(name_ar)").order("created_at", { ascending: false });
  const tbody = document.getElementById("questions-table");
  if (!tbody) return;
  tbody.innerHTML = (data || []).map(q => `
    <tr>
      <td>${esc(q.question)}<br><small style="color:var(--text-muted)">${esc(q.subjects?.name_ar || "")}</small></td>
      <td>${esc(q.asker_name)}</td>
      <td><input type="text" id="qa-${q.id}" value="${esc(q.answer || "")}" placeholder="${t("answer")}" style="padding:6px;border:1px solid var(--border);border-radius:6px;width:160px"></td>
      <td><span class="badge ${q.is_published ? "badge-done" : "badge-pending"}">${q.is_published ? t("approved") : t("pending")}</span></td>
      <td>
        <button class="btn-icon" onclick="saveQuestion('${q.id}')" title="${t("save")}">💾</button>
        <button class="btn-icon" onclick="toggleQuestion('${q.id}', ${!q.is_published})" title="${q.is_published ? t("pending") : t("approved")}">${q.is_published ? "⏸️" : "✅"}</button>
        <button class="btn-icon btn-danger" onclick="deleteQuestion('${q.id}')" title="${t("delete")}">🗑️</button>
      </td>
    </tr>`).join("") || `<tr><td colspan="5" class="no-data">${t("no_data")}</td></tr>`;
}

async function saveQuestion(id) {
  const answer = document.getElementById("qa-" + id)?.value || "";
  await db.from("edu_questions").update({ answer }).eq("id", id);
  await toastMsg(t("saved"));
}

async function toggleQuestion(id, publish) {
  await db.from("edu_questions").update({ is_published: publish }).eq("id", id);
  await loadQuestionsAdmin();
}

async function deleteQuestion(id) {
  if (!confirm(t("confirm_delete"))) return;
  await db.from("edu_questions").delete().eq("id", id);
  await loadQuestionsAdmin();
}

// ---------- التعليم: رسائل التواصل ----------
async function loadMessages() {
  const { data } = await db.from("contact_messages").select("*").order("created_at", { ascending: false });
  const tbody = document.getElementById("messages-table");
  if (!tbody) return;
  tbody.innerHTML = (data || []).map(m => `
    <tr>
      <td>${esc(m.name)}</td><td>${esc(m.email || "-")}</td>
      <td>${esc(m.message)}</td><td>${new Date(m.created_at).toLocaleDateString(currentLang === "ar" ? "ar-EG" : "en-US")}</td>
    </tr>`).join("") || `<tr><td colspan="4" class="no-data">${t("no_data")}</td></tr>`;
}

async function toastMsg(msg) {
  alert(msg);
}

// ---------- اللغة ----------
function updateLangButtons() {
  document.querySelectorAll("[data-lang]").forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-lang") === currentLang);
  });
}

function switchLang(lang) {
  setLang(lang);
  updateLangButtons();
}

// ---------- أدوات مساعدة ----------
function esc(str) {
  if (!str) return "";
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

function renderAll() {
  document.getElementById("welcome-msg").textContent =
    t("welcome") + "، " + (currentProfile?.full_name_ar || currentProfile?.full_name || "");
  loadStats();
  loadProjects();
  loadTasks();
  loadUsers();
  loadActivity();
}

// إغلاق النافذة عند النقر خارجها
window.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal")) e.target.classList.remove("show");
});

// بدء التطبيق
document.addEventListener("DOMContentLoaded", initApp);
