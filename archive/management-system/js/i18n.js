// ============================================
// i18n - Bilingual Support (Arabic / English)
// ============================================
const translations = {
  ar: {
    // عام
    site_name: "نظام الإدارة المتكامل",
    login: "تسجيل الدخول",
    logout: "تسجيل الخروج",
    register: "إنشاء حساب جديد",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    full_name: "الاسم الكامل",
    confirm_password: "تأكيد كلمة المرور",
    forgot_password: "نسيت كلمة المرور؟",
    or: "أو",
    no_account: "ليس لديك حساب؟",
    have_account: "لديك حساب بالفعل؟",
    language: "اللغة",

    // لوحة التحكم
    dashboard: "لوحة التحكم",
    projects: "المشاريع",
    tasks: "المهام",
    users: "المستخدمون",
    settings: "الإعدادات",
    activity_log: "سجل النشاط",
    documents: "المستندات",
    roles: "الأدوار",
    profile: "الملف الشخصي",

    // إحصائيات
    total_projects: "إجمالي المشاريع",
    total_tasks: "إجمالي المهام",
    total_users: "إجمالي المستخدمين",
    active_tasks: "المهام النشطة",
    completed_tasks: "المهام المكتملة",
    pending_tasks: "المهام المعلقة",

    // مشاريع
    new_project: "مشروع جديد",
    project_name: "اسم المشروع",
    project_description: "وصف المشروع",
    status: "الحالة",
    active: "نشط",
    paused: "متوقف",
    completed: "مكتمل",
    archived: "مؤرشف",
    create_project: "إنشاء مشروع",
    edit_project: "تعديل المشروع",
    delete_project: "حذف المشروع",
    no_projects: "لا توجد مشاريع بعد",

    // مهام
    new_task: "مهمة جديدة",
    task_title: "عنوان المهمة",
    task_description: "وصف المهمة",
    priority: "الأولوية",
    due_date: "تاريخ الاستحقاق",
    assigned_to: "مسند إلى",
    low: "منخفضة",
    medium: "متوسطة",
    high: "عالية",
    urgent: "عاجلة",
    pending: "معلقة",
    in_progress: "قيد التنفيذ",
    review: "قيد المراجعة",
    done: "مكتملة",
    cancelled: "ملغاة",
    create_task: "إنشاء مهمة",

    // مستخدمون
    add_user: "إضافة مستخدم",
    role: "الدور",
    admin: "مدير النظام",
    manager: "مدير مشروع",
    editor: "محرر",
    viewer: "مشاهد",
    active_user: "نشط",
    inactive_user: "غير نشط",
    last_login: "آخر دخول",
    no_users: "لا يوجد مستخدمون",

    // إعدادات
    site_settings: "إعدادات الموقع",
    general_settings: "إعدادات عامة",
    security: "الأمان",
    notifications: "الإشعارات",
    save_changes: "حفظ التغييرات",
    saved_successfully: "تم الحفظ بنجاح",

    // أزرار عامة
    save: "حفظ",
    cancel: "إلغاء",
    delete: "حذف",
    edit: "تعديل",
    add: "إضافة",
    search: "بحث...",
    confirm: "تأكيد",
    back: "رجوع",
    loading: "جارٍ التحميل...",
    no_data: "لا توجد بيانات",
    actions: "إجراءات",
    created_at: "تاريخ الإنشاء",
    updated_at: "تاريخ التحديث",

    // رسائل
    login_success: "تم تسجيل الدخول بنجاح",
    login_error: "خطأ في تسجيل الدخول",
    register_success: "تم إنشاء الحساب بنجاح",
    register_error: "خطأ في إنشاء الحساب",
    logout_success: "تم تسجيل الخروج",
    confirm_delete: "هل أنت متأكد من الحذف؟",
    error: "حدث خطأ ما",
    welcome: "مرحباً بك",
    today: "اليوم",

    // مستندات
    documents: "المستندات",
    upload_document: "رفع مستند",
    no_documents: "لا توجد مستندات",
    download: "تنزيل",
    category: "التصنيف",
    general: "عام",
    contracts: "عقود",
    reports_docs: "تقارير",
    invoices: "فواتير",
    other: "أخرى",
    select_file: "اختر ملفاً...",
    upload_success: "تم رفع المستند بنجاح",

    // تقارير
    reports: "التقارير",
    tasks_by_status: "المهام حسب الحالة",
    tasks_by_priority: "المهام حسب الأولوية",
    projects_by_status: "المشاريع حسب الحالة",
    completion_rate: "نسبة الإنجاز",
    of_total: "من الإجمالي",

    // موظفون
    employees: "الموارد البشرية",
    new_employee: "موظف جديد",
    employee_name: "اسم الموظف",
    job_title: "المسمى الوظيفي",
    department: "القسم",
    salary: "الراتب",
    hire_date: "تاريخ التعيين",
    phone: "الهاتف",
    no_employees: "لا يوجد موظفون",
    create_employee: "إضافة موظف",

    // إشعارات
    notifications: "الإشعارات",
    no_notifications: "لا توجد إشعارات",
    mark_all_read: "تعليم الكل كمقروء",
    unread: "غير مقروء",

    // استعادة كلمة المرور
    reset_password: "استعادة كلمة المرور",
    reset_password_sent: "تم إرسال رابط الاستعادة إلى بريدك",

    // التعليم
    edu_section: "التعليم",
    preview_site: "معاينة الموقع العام",
    back_to_site: "تصفّح الموقع العام",
    universities: "الجامعات",
    departments: "الأقسام",
    semesters: "السداسيات",
    subjects: "المواد",
    edu_exams: "الامتحانات",
    announcements: "الإعلانات",
    edu_questions: "الأسئلة",
    contact_messages: "الرسائل",
    add_university: "+ جامعة",
    add_department: "+ قسم",
    add_semester: "+ سداسي",
    add_subject: "+ مادة",
    add_eduexam: "+ رفع ملف",
    add_announcement: "+ إعلان",
    name_ar: "الاسم (عربي)",
    name_fr: "الاسم (فرنسي)",
    city: "المدينة",
    sort_order: "الترتيب",
    title: "العنوان",
    body: "النص",
    link: "رابط",
    publish_now: "نشر فوري",
    pending: "قيد المراجعة",
    approved: "منشور",
    rejected: "مرفوض",
    exam: "امتحان",
    assignment: "فرض",
    question: "السؤال",
    asker: "مقدم",
    answer: "الجواب",
    registration: "تسجيلات",
    contest: "مسابقات",
    scholarship: "منح",
    deadline: "آجال",
    general: "عام",
    no_data: "لا توجد بيانات",
    file: "الملف (PDF)",
    file_corr: "التصحيح (اختياري)",
    status: "الحالة",
    saved: "تم الحفظ",
  },
  en: {
    // General
    site_name: "Management System",
    login: "Sign In",
    logout: "Sign Out",
    register: "Create Account",
    email: "Email",
    password: "Password",
    full_name: "Full Name",
    confirm_password: "Confirm Password",
    forgot_password: "Forgot password?",
    or: "or",
    no_account: "Don't have an account?",
    have_account: "Already have an account?",
    language: "Language",

    // Dashboard
    dashboard: "Dashboard",
    projects: "Projects",
    tasks: "Tasks",
    users: "Users",
    settings: "Settings",
    activity_log: "Activity Log",
    documents: "Documents",
    roles: "Roles",
    profile: "Profile",

    // Stats
    total_projects: "Total Projects",
    total_tasks: "Total Tasks",
    total_users: "Total Users",
    active_tasks: "Active Tasks",
    completed_tasks: "Completed Tasks",
    pending_tasks: "Pending Tasks",

    // Projects
    new_project: "New Project",
    project_name: "Project Name",
    project_description: "Project Description",
    status: "Status",
    active: "Active",
    paused: "Paused",
    completed: "Completed",
    archived: "Archived",
    create_project: "Create Project",
    edit_project: "Edit Project",
    delete_project: "Delete Project",
    no_projects: "No projects yet",

    // Tasks
    new_task: "New Task",
    task_title: "Task Title",
    task_description: "Task Description",
    priority: "Priority",
    due_date: "Due Date",
    assigned_to: "Assigned To",
    low: "Low",
    medium: "Medium",
    high: "High",
    urgent: "Urgent",
    pending: "Pending",
    in_progress: "In Progress",
    review: "Review",
    done: "Done",
    cancelled: "Cancelled",
    create_task: "Create Task",

    // Users
    add_user: "Add User",
    role: "Role",
    admin: "Admin",
    manager: "Manager",
    editor: "Editor",
    viewer: "Viewer",
    active_user: "Active",
    inactive_user: "Inactive",
    last_login: "Last Login",
    no_users: "No users",

    // Settings
    site_settings: "Site Settings",
    general_settings: "General Settings",
    security: "Security",
    notifications: "Notifications",
    save_changes: "Save Changes",
    saved_successfully: "Saved successfully",

    // Buttons
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    search: "Search...",
    confirm: "Confirm",
    back: "Back",
    loading: "Loading...",
    no_data: "No data",
    actions: "Actions",
    created_at: "Created At",
    updated_at: "Updated At",

    // Messages
    login_success: "Signed in successfully",
    login_error: "Sign in error",
    register_success: "Account created successfully",
    register_error: "Account creation error",
    logout_success: "Signed out",
    confirm_delete: "Are you sure you want to delete?",
    error: "Something went wrong",
    welcome: "Welcome",
    today: "Today",

    // Documents
    documents: "Documents",
    upload_document: "Upload Document",
    no_documents: "No documents",
    download: "Download",
    category: "Category",
    general: "General",
    contracts: "Contracts",
    reports_docs: "Reports",
    invoices: "Invoices",
    other: "Other",
    select_file: "Select a file...",
    upload_success: "Document uploaded successfully",

    // Reports
    reports: "Reports",
    tasks_by_status: "Tasks by Status",
    tasks_by_priority: "Tasks by Priority",
    projects_by_status: "Projects by Status",
    completion_rate: "Completion Rate",
    of_total: "of total",

    // Employees
    employees: "HR / Employees",
    new_employee: "New Employee",
    employee_name: "Employee Name",
    job_title: "Job Title",
    department: "Department",
    salary: "Salary",
    hire_date: "Hire Date",
    phone: "Phone",
    no_employees: "No employees",
    create_employee: "Add Employee",

    // Notifications
    notifications: "Notifications",
    no_notifications: "No notifications",
    mark_all_read: "Mark all as read",
    unread: "Unread",

    // Password reset
    reset_password: "Reset Password",
    reset_password_sent: "Reset link sent to your email",

    // Education
    edu_section: "Education",
    preview_site: "Preview Public Site",
    back_to_site: "Browse Public Site",
    universities: "Universities",
    departments: "Departments",
    semesters: "Semesters",
    subjects: "Subjects",
    edu_exams: "Exams",
    announcements: "Announcements",
    edu_questions: "Questions",
    contact_messages: "Messages",
    add_university: "+ University",
    add_department: "+ Department",
    add_semester: "+ Semester",
    add_subject: "+ Subject",
    add_eduexam: "+ Upload file",
    add_announcement: "+ Announcement",
    name_ar: "Name (AR)",
    name_fr: "Name (FR)",
    city: "City",
    sort_order: "Order",
    title: "Title",
    body: "Body",
    link: "Link",
    publish_now: "Publish now",
    pending: "Pending",
    approved: "Published",
    rejected: "Rejected",
    exam: "Exam",
    assignment: "Assignment",
    question: "Question",
    asker: "Asked by",
    answer: "Answer",
    registration: "Registration",
    contest: "Contests",
    scholarship: "Scholarships",
    deadline: "Deadlines",
    general: "General",
    no_data: "No data",
    file: "File (PDF)",
    file_corr: "Correction (optional)",
    status: "Status",
    saved: "Saved",
  },
};

let currentLang = localStorage.getItem("lang") || "ar";

function t(key) {
  return translations[currentLang]?.[key] || translations.en[key] || key;
}

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem("lang", lang);
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.getAttribute("data-i18n"));
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.placeholder = t(el.getAttribute("data-i18n-placeholder"));
  });
  // Re-render dynamic content
  if (typeof renderAll === "function") renderAll();
}

function initI18n() {
  document.documentElement.dir = currentLang === "ar" ? "rtl" : "ltr";
  document.documentElement.lang = currentLang;
}
