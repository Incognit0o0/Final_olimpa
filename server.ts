/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { DBManager } from "./src/server/db.ts";
import {
  UserRole,
  FundStatus,
  TaskStatus,
  ApplicationStatus,
  UserProfile,
  VolunteerTask,
  TaskApplication
} from "./src/types.ts";

// Initialize local database JSON file (deferred to asynchronous server startup)
// DBManager.init();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

// --- Helper: Simulate authentication (simple bearer / custom headers) ---
// Since it's an MVP hackathon project, we pass custom header 'X-User-Id' for mock authentication.
// This is extremely robust, easy to simulate in the frontend React app, and requires no cookies or session bugs in the preview container sandboxes!
function getActor(req: Request): UserProfile | undefined {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) return undefined;
  return DBManager.getUserById(userId);
}

// ==========================================
// 1. AUTH & USER PROFILE ENDPOINTS
// ==========================================

// Login endpoint
app.post("/api/auth/login", (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Поля Email и Пароль обязательны" });
    return;
  }

  const user = DBManager.getUserByEmail(email);
  if (!user) {
    res.status(401).json({ error: "Пользователь с такой почтой не найден" });
    return;
  }

  // Require matching password. If user has no password set (e.g. from prior runs), fallback to "demo"
  const expectedPassword = user.password || "demo";
  if (password !== expectedPassword) {
    res.status(401).json({ error: "Неверный пароль" });
    return;
  }

  res.json({ user, message: "Вход успешно выполнен" });
});

// Corporate Directory of mock employees (pre-seeded database entries)
const CORPORATE_DIRECTORY = [
  {
    email: "sidorov@stoloto.ru",
    name: "Сидоров Илья Петрович",
    city: "Москва",
    department: "Департамент маркетинга",
    position: "Ведущий специалист"
  },
  {
    email: "kozlov@stoloto.ru",
    name: "Козлов Дмитрий Сергеевич",
    city: "Москва",
    department: "Департамент информационной безопасности",
    position: "Руководитель направления"
  },
  {
    email: "semenova@stoloto.ru",
    name: "Семенова Елена Викторовна",
    city: "Нижний Новгород",
    department: "Служба клиентской поддержки",
    position: "Главный оператор"
  },
  {
    email: "morozov@stoloto.ru",
    name: "Морозов Артур Игоревич",
    city: "Екатеринбург",
    department: "Региональный офис продаж",
    position: "Менеджер"
  },
  {
    email: "fedorov@stoloto.ru",
    name: "Фёдоров Фёдор Сергеевич",
    city: "Москва",
    department: "Департамент связей с общественностью",
    position: "Пресс-секретарь"
  },
  {
    email: "smirnov@stoloto.ru",
    name: "Смирнов Михаил Юрьевич",
    city: "Казань",
    department: "Отдел регионального развития",
    position: "Ведущий специалист"
  },
  {
    email: "kuznetsova@stoloto.ru",
    name: "Кузнецова Наталья Александровна",
    city: "Москва",
    department: "Управление по работе с персоналом",
    position: "HR-менеджер"
  },
  {
    email: "popov@stoloto.ru",
    name: "Попов Андрей Евгеньевич",
    city: "Новосибирск",
    department: "Департамент розничной сети",
    position: "Территориальный менеджер"
  },
  {
    email: "vasiliev@stoloto.ru",
    name: "Васильев Алексей Игоревич",
    city: "Москва",
    department: "Департамент аналитики и больших данных",
    position: "Senior Data Scientist"
  },
  {
    email: "sokolov@stoloto.ru",
    name: "Соколов Сергей Владимирович",
    city: "Санкт-Петербург",
    department: "Служба логистики и снабжения",
    position: "Ведущий инженер"
  },
  {
    email: "novikova@stoloto.ru",
    name: "Новикова Ольга Ивановна",
    city: "Краснодар",
    department: "Отдел маркетинга Южного региона",
    position: "Главный бренд-менеджер"
  }
];

// Volunteer registration
app.post("/api/auth/register-volunteer", (req: Request, res: Response) => {
  const { email, name, city, department, position, isEmployee, password } = req.body;

  if (!email) {
    res.status(400).json({ error: "Электронная почта обязательна" });
    return;
  }

  // Check if already registered
  const exists = DBManager.getUserByEmail(email);
  if (exists) {
    res.status(400).json({ error: "Пользователь с таким email уже зарегистрирован" });
    return;
  }

  let finalName = name;
  let finalCity = city;
  let finalDept = department;
  let finalPos = position;

  if (isEmployee) {
    const employee = CORPORATE_DIRECTORY.find(emp => emp.email.toLowerCase() === email.toLowerCase());
    if (!employee) {
      res.status(400).json({
        error: "Сотрудник со встроенным корпоративным адресом не найден в базе кадров Столото. Пожалуйста, зарегистрируйтесь как обычный пользователь (внешний волонтёр), выбрав опцию 'Я не сотрудник Столото'."
      });
      return;
    }
    // Pull full info from corporate directory
    finalName = employee.name;
    finalCity = employee.city;
    finalDept = employee.department;
    finalPos = employee.position;
  } else {
    // For normal user, validate mandatory inputs
    if (!name || !city || !department || !position) {
      res.status(400).json({ error: "Все поля ФИО, город, организация и деятельность обязательны для заполнения" });
      return;
    }
  }

  // Auto-fill and persist
  const newVolunteer: UserProfile = {
    id: "vol_" + Math.random().toString(36).substring(2, 11),
    email,
    role: UserRole.VOLUNTEER,
    name: finalName,
    city: finalCity,
    department: finalDept,
    position: finalPos,
    isEmployee: !!isEmployee,
    password: password || "demo",
    hours: 0,
    volunteerStatus: "Новичок",
    badges: [],
    createdAt: new Date().toISOString()
  };

  DBManager.registerUser(newVolunteer);
  DBManager.createNotification(
    newVolunteer.id,
    UserRole.VOLUNTEER,
    "Добро пожаловать в команду волонтёров Столото! Теперь вы можете откликаться на добрые дела в ленте."
  );

  res.status(201).json({ user: newVolunteer, message: "Вы успешно зарегистрированы в волонтёрской базе Столото" });
});

// Fund registration
app.post("/api/auth/register-fund", (req: Request, res: Response) => {
  const {
    email,
    name,
    description,
    categories,
    inn,
    ogrn,
    city,
    website,
    contactName,
    contactPosition,
    phone,
    documentName,
    documentData,
    password
  } = req.body;

  if (!email || !name || !description || !inn || !ogrn || !city || !contactName || !phone) {
    res.status(400).json({ error: "Поля Название, описание, ИНН, ОГРН, город, ответственный контакты и email обязательны" });
    return;
  }

  // Check if exists
  const exists = DBManager.getUserByEmail(email);
  if (exists) {
    res.status(400).json({ error: "Аккаунт с таким email уже существует" });
    return;
  }

  const newFund: UserProfile = {
    id: "fund_" + Math.random().toString(36).substring(2, 11),
    email,
    role: UserRole.FUND,
    name,
    city,
    description,
    categories: categories || ["Общее"],
    inn,
    ogrn,
    website: website || "",
    contactName,
    contactPosition: contactPosition || "Представитель",
    phone,
    documentName: documentName || "scanned_doc_verification.pdf",
    documentData: documentData || "",
    fundStatus: FundStatus.PENDING,
    password: password || "demo",
    createdAt: new Date().toISOString()
  };

  DBManager.registerUser(newFund);

  // Notify active administrators of a new pending fund
  DBManager.createNotification(
    "admin",
    UserRole.ADMIN,
    `Новый благотворительный фонд «${newFund.name}» зарегистрировался в системе и ожидает вашей модерации.`
  );

  res.status(201).json({ user: newFund, message: "Фонд отправлен на обязательную государственную модерацию. Ожидайте одобрения администратором Столото." });
});

// Get current acting user details
app.get("/api/auth/me", (req: Request, res: Response) => {
  const user = getActor(req);
  if (!user) {
    res.status(401).json({ error: "Необходима авторизация" });
    return;
  }
  res.json({ user });
});

// Update user profile (volunteer or fund)
app.post("/api/user/update-profile", (req: Request, res: Response) => {
  const actor = getActor(req);
  if (!actor) {
    res.status(401).json({ error: "Необходима авторизация" });
    return;
  }

  const { name, city, department, position, phone, description, website } = req.body;

  if (!name || !city) {
    res.status(400).json({ error: "Имя (или название) и город обязательны для заполнения" });
    return;
  }

  const updates: Partial<UserProfile> = {
    name,
    city
  };

  if (actor.role === UserRole.VOLUNTEER) {
    updates.department = department || "";
    updates.position = position || "";
    updates.phone = phone || "";
  } else if (actor.role === UserRole.FUND) {
    updates.description = description || "";
    updates.website = website || "";
    updates.phone = phone || "";
  }

  DBManager.updateUser(actor.id, updates);
  const updatedUser = DBManager.getUserById(actor.id);

  res.json({
    user: updatedUser,
    message: "Ваш профиль был успешно обновлён"
  });
});

// Resubmit rejected fund registration details
app.post("/api/fund/resubmit", (req: Request, res: Response) => {
  const actor = getActor(req);
  if (!actor || actor.role !== UserRole.FUND) {
    res.status(403).json({ error: "Только зарегистрированный фонд может отправлять повторные данные" });
    return;
  }

  const {
    name,
    description,
    categories,
    inn,
    ogrn,
    city,
    website,
    contactName,
    contactPosition,
    phone,
    documentName,
    documentData
  } = req.body;

  if (!name || !description || !inn || !ogrn || !city || !contactName || !phone) {
    res.status(400).json({ error: "Поля Название, описание, ИНН, ОГРН, город, ответственный контакты обязательны" });
    return;
  }

  // Update fund details and transition status back to PENDING
  DBManager.updateUser(actor.id, {
    name,
    description,
    categories: categories || ["Общее"],
    inn,
    ogrn,
    city,
    website: website || "",
    contactName,
    contactPosition: contactPosition || "Представитель",
    phone,
    documentName: documentName || actor.documentName,
    documentData: documentData || actor.documentData,
    fundStatus: FundStatus.PENDING,
    moderatorComment: "" // Clear comment on resubmit
  });

  // Notify administrators
  DBManager.createNotification(
    "admin",
    UserRole.ADMIN,
    `Фонд «${name}» отредактировал заявку и повторно отправил её на модерацию Столото.`
  );

  res.json({ user: DBManager.getUserById(actor.id), message: "Ваша исправленная заявка успешно обновлена и повторно отправлена на модерацию. Ожидайте одобрения кураторами." });
});


// ==========================================
// 1.5. PUBLIC & VOLUNTEER FUND RETRIEVAL ENDPOINTS
// ==========================================

// Get single fund public/volunteer details with stats and tasks
app.get("/api/funds/:idOrName", (req: Request, res: Response) => {
  const actor = getActor(req);
  if (!actor) {
    res.status(401).json({ error: "Необходима авторизация" });
    return;
  }

  const { idOrName } = req.params;
  let fund = DBManager.getUserById(idOrName);
  
  if (!fund || fund.role !== UserRole.FUND) {
    // try to find by name
    fund = DBManager.getUsers().find(u => u.role === UserRole.FUND && (u.name.toLowerCase() === idOrName.toLowerCase() || u.id === idOrName));
  }

  if (!fund || fund.role !== UserRole.FUND) {
    res.status(404).json({ error: "Благотворительный фонд не найден" });
    return;
  }

  const fundId = fund.id;
  const allTasks = DBManager.getTasks().filter(t => t.fundId === fundId || t.fundName === fund.name);
  // Filter for tasks that passed moderation (either published or completed)
  const moderatedTasks = allTasks.filter(t => t.status === TaskStatus.PUBLISHED || t.status === TaskStatus.COMPLETED);
  const activeTasks = moderatedTasks.filter(t => t.status === TaskStatus.PUBLISHED);
  const completedTasks = moderatedTasks.filter(t => t.status === TaskStatus.COMPLETED);

  const applications = DBManager.getApplications().filter(a => moderatedTasks.some(t => t.id === a.taskId));
  const uniqueVolunteersCount = new Set(applications.map(a => a.volunteerId)).size;
  const totalAwardedHours = applications
    .filter(a => a.status === ApplicationStatus.COMPLETED)
    .reduce((sum, a) => sum + (a.hoursAwarded || 0), 0);

  res.json({
    fund: {
      id: fund.id,
      name: fund.name,
      description: fund.description,
      categories: fund.categories || [],
      city: fund.city,
      website: fund.website || "",
      phone: fund.phone || "",
      email: fund.email,
      createdAt: fund.createdAt,
      contactName: fund.contactName || "",
      contactPosition: fund.contactPosition || "",
    },
    stats: {
      totalTasks: moderatedTasks.length,
      publishedTasksCount: activeTasks.length,
      completedTasksCount: completedTasks.length,
      volunteersCount: uniqueVolunteersCount,
      totalHoursDistributed: totalAwardedHours || 0,
    },
    tasks: moderatedTasks.map(t => ({
      id: t.id,
      title: t.title,
      category: t.category,
      format: t.format,
      city: t.city,
      eventDate: t.eventDate,
      deadline: t.deadline,
      status: t.status,
      hoursEstimation: t.hoursEstimation,
    }))
  });
});


// ==========================================
// 2. FUND MODERATION ENDPOINTS (ADMIN-ONLY)
// ==========================================

// Get all funds for administration panel
app.get("/api/admin/funds", (req: Request, res: Response) => {
  const user = getActor(req);
  if (!user || user.role !== UserRole.ADMIN) {
    res.status(403).json({ error: "У вас нет прав для этого действия" });
    return;
  }

  const funds = DBManager.getUsers().filter(u => u.role === UserRole.FUND);
  res.json({ funds });
});

// Download fund registration document
app.get("/api/admin/funds/:fundId/document", (req: Request, res: Response) => {
  const { fundId } = req.params;
  const fund = DBManager.getUserById(fundId);

  if (!fund || fund.role !== UserRole.FUND) {
    res.status(404).send("Благотворительный фонд не найден");
    return;
  }

  const documentName = fund.documentName || "scanned_doc_verification.pdf";
  const documentData = fund.documentData;

  if (!documentData) {
    // Elegant fallback: if no uploaded data exists (e.g. for preloaded mock funds), compile an official plain text receipt
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(documentName)}"`);
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.send(`ДОКУМЕНТ ВЕРИФИКАЦИИ СТОЛОТО\n============================\nОрганизация: ${fund.name}\nГород: ${fund.city}\nИНН: ${fund.inn || "Не указан"}\nОГРН: ${fund.ogrn || "Не указан"}\n\nФайл: ${documentName}\n\nСтатус заявки в системе: ${fund.fundStatus}\nДата отправления: ${fund.createdAt}\nОтветственный: ${fund.contactName} (${fund.contactPosition})\n\nДанный документ сгенерирован автоматически, так как фонд был предустановлен в демонстрационной базе данных.`);
    return;
  }

  try {
    let base64Content = documentData;
    let contentType = "application/octet-stream";

    if (documentData.startsWith("data:")) {
      const match = documentData.match(/^data:([^;]+);base64,(.*)$/);
      if (match) {
        contentType = match[1];
        base64Content = match[2];
      }
    }

    const buffer = Buffer.from(base64Content, "base64");
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(documentName)}"`);
    res.setHeader("Content-Type", contentType);
    res.send(buffer);
  } catch (error) {
    res.status(500).send("Ошибка чтения файла документа во временной памяти");
  }
});

// Update fund status (APPROVE / REJECT / NEED_REVISION)
app.post("/api/admin/funds/:id/status", (req: Request, res: Response) => {
  const user = getActor(req);
  if (!user || user.role !== UserRole.ADMIN) {
    res.status(403).json({ error: "Только администратор Столото может модерировать организации" });
    return;
  }

  const { id } = req.params;
  const { status, comment } = req.body; // status: "approved" | "rejected" | "pending"

  if (!status || !Object.values(FundStatus).includes(status as FundStatus)) {
    res.status(400).json({ error: "Некорректный статус модерации" });
    return;
  }

  const fund = DBManager.getUserById(id);
  if (!fund || fund.role !== UserRole.FUND) {
    res.status(404).json({ error: "Фонд не найден" });
    return;
  }

  DBManager.updateUser(id, {
    fundStatus: status as FundStatus,
    moderatorComment: comment || ""
  });

  // Create notifications depending on result
  let notificationText = "";
  if (status === FundStatus.APPROVED) {
    notificationText = `Поздравляем! Ваш благотворительный фонд одобрен администратором Столото. Теперь вы можете отправлять свои волонтёрские задания на публикацию.`;
  } else {
    notificationText = `Внимание! Ваша заявка фонда на модерации была отклонена/отправлена на доработку. Причина/Комментарий: ${comment || "Данные требуют проверки"}`;
  }

  DBManager.createNotification(id, UserRole.FUND, notificationText);

  res.json({ message: "Статус фонда успешно изменен на " + status, fund: DBManager.getUserById(id) });
});


// ==========================================
// 3. TASK MANAGEMENT ENDPOINTS
// ==========================================

// Get tasks listing with query filters
app.get("/api/tasks", (req: Request, res: Response) => {
  let list = DBManager.getTasks();

  // Apply filters
  const format = req.query.format as string; // online, offline
  const duration = req.query.duration as string; // one-time, regular, long-term
  const type = req.query.type as string; // standard, pro-bono
  const category = req.query.category as string; // "Дети", "Экология" etc.
  const city = req.query.city as string;
  const fundId = req.query.fundId as string;
  const status = req.query.status as string; // draft, pending_moderation, published, completed

  if (format) {
    list = list.filter(t => t.format === format);
  }
  if (duration) {
    list = list.filter(t => t.duration === duration);
  }
  if (type) {
    list = list.filter(t => t.type === type);
  }
  if (category) {
    list = list.filter(t => t.category.toLowerCase() === category.toLowerCase());
  }
  if (city) {
    list = list.filter(t => t.city.toLowerCase().includes(city.toLowerCase()) || t.city === "Все города");
  }
  if (fundId) {
    list = list.filter(t => t.fundId === fundId);
  }
  if (status) {
    list = list.filter(t => t.status === status);
  } else {
    // By default, if request comes from general volunteer, show only PUBLISHED
    const actor = getActor(req);
    if (!actor || actor.role === UserRole.VOLUNTEER) {
      list = list.filter(t => t.status === TaskStatus.PUBLISHED);
    }
  }

  res.json({ tasks: list });
});

// Create volunteer task (Fund scope)
app.post("/api/tasks", (req: Request, res: Response) => {
  const actor = getActor(req);
  if (!actor || actor.role !== UserRole.FUND) {
    res.status(403).json({ error: "Только зарегистрированный фонд может создавать задания" });
    return;
  }

  // Block creation if fund is not approved yet
  if (actor.fundStatus !== FundStatus.APPROVED) {
    res.status(403).json({ error: "Ваша организация еще проходит модерацию и не имеет прав публиковать задания" });
    return;
  }

  const {
    title,
    description,
    category,
    format,
    duration,
    type,
    city,
    location,
    deadline,
    eventDate,
    maxParticipants,
    requirements,
    hoursEstimation,
    materials,
    isDraft,
    conditions,
    tags,
    imageUrl,
    regStart,
    eventTime,
    organizerName,
    organizerPhone,
    organizerEmail,
    vacancies
  } = req.body;

  if (!title || !description || !category || !format || !duration || !type || !city || !deadline || !eventDate || !maxParticipants || !hoursEstimation) {
    res.status(400).json({ error: "Пожалуйста, заполните все обязательные поля задания, включая дедлайн и дату выполнения" });
    return;
  }

  const newTask: VolunteerTask = {
    id: "task_" + Math.random().toString(36).substring(2, 11),
    title,
    description,
    fundId: actor.id,
    fundName: actor.name,
    category,
    format,
    duration,
    type,
    city,
    location: location || "Онлайн / Дистанционно",
    deadline,
    eventDate,
    maxParticipants: Number(maxParticipants),
    joinedParticipants: 0,
    requirements: requirements || "Особых требований нет",
    hoursEstimation: Number(hoursEstimation),
    materials: materials || "",
    status: isDraft ? TaskStatus.DRAFT : TaskStatus.PENDING_MODERATION,
    conditions: Array.isArray(conditions) ? conditions : [],
    tags: Array.isArray(tags) ? tags : [],
    createdAt: new Date().toISOString(),
    imageUrl: imageUrl || "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=500&auto=format&fit=crop&q=80",
    regStart: regStart || new Date().toISOString().split("T")[0],
    eventTime: eventTime || "12:00 - 16:00",
    organizerName: organizerName || actor.contactName || "",
    organizerPhone: organizerPhone || actor.phone || "",
    organizerEmail: organizerEmail || actor.email || "",
    vacancies: Array.isArray(vacancies) && vacancies.length > 0 ? vacancies : [
      {
        id: "vac_" + Math.random().toString(36).substring(2, 11),
        name: "Основная помощь",
        address: location || "Онлайн / Дистанционно",
        duties: description,
        conditions: Array.isArray(conditions) ? conditions : [],
        requirements: (requirements || "Особых требований нет").split(/,\s*/).map(r => r.trim()).filter(Boolean)
      }
    ]
  };

  DBManager.createTask(newTask);

  if (!isDraft) {
    // Notify administrator
    DBManager.createNotification(
      "admin",
      UserRole.ADMIN,
      `Новое задание «${title}» от фонда «${actor.name}» отправлено на пре-модерацию Столото.`
    );
  }

  res.status(201).json({ task: newTask, message: isDraft ? "Задание успешно сохранено в черновиках" : "Задание успешно отправлено на модерацию Столото" });
});

// Update task details (status update or detail corrections)
app.post("/api/tasks/:id/status", (req: Request, res: Response) => {
  const actor = getActor(req);
  if (!actor) {
    res.status(401).json({ error: "Вы должны войти в систему" });
    return;
  }

  const { id } = req.params;
  const { status, comment } = req.body; // status: published, rejected, completed, etc.

  const task = DBManager.getTaskById(id);
  if (!task) {
    res.status(404).json({ error: "Задание не найдено" });
    return;
  }

  // Permission Check
  // Admin can moderate PENDING_MODERATION -> PUBLISHED or REJECTED
  if (actor.role === UserRole.ADMIN) {
    if (!status || !Object.values(TaskStatus).includes(status as TaskStatus)) {
      res.status(400).json({ error: "Некорректный статус" });
      return;
    }

    DBManager.updateTask(id, {
      status: status as TaskStatus,
      moderatorComment: comment || ""
    });

    // Notify the fund
    let notif = "";
    if (status === TaskStatus.PUBLISHED) {
      notif = `Ура! Ваше задание «${task.title}» прошло модерацию и опубликовано в ленте волонтёров Столото.`;
    } else if (status === TaskStatus.REJECTED) {
      notif = `Ваше задание «${task.title}» отклонено или возвращено на доработку. Комментарий: ${comment || "Уточните условия"}`;
    }
    DBManager.createNotification(task.fundId, UserRole.FUND, notif);

    res.json({ message: "Статус задания изменен на " + status, task: DBManager.getTaskById(id) });
    return;
  }

  // Fund can transition draft -> pending_moderation or mark completed
  if (actor.role === UserRole.FUND && task.fundId === actor.id) {
    if (status === TaskStatus.PENDING_MODERATION) {
      DBManager.updateTask(id, { status: TaskStatus.PENDING_MODERATION });
      DBManager.createNotification("admin", UserRole.ADMIN, `Фонд отправил задание «${task.title}» на повторную модерацию.`);
    } else if (status === TaskStatus.COMPLETED) {
      // Complete task
      DBManager.updateTask(id, { status: TaskStatus.COMPLETED });

      // Automatically notify the administrator to verify and grant hours
      DBManager.createNotification(
        "admin",
        UserRole.ADMIN,
        `Задание «${task.title}» закрыто фондом и готово к начислению волонтёрских часов.`
      );
    } else if (status === TaskStatus.DRAFT) {
      DBManager.updateTask(id, { status: TaskStatus.DRAFT });
    } else {
      res.status(400).json({ error: "У фонда нет полномочий ставить этот статус задания самостоятельно" });
      return;
    }

    res.json({ message: "Статус задания изменен", task: DBManager.getTaskById(id) });
    return;
  }

  res.status(403).json({ error: "У вас нет прав изменять статус этого задания" });
});

// Update task details (Fund scope)
app.post("/api/tasks/:id", (req: Request, res: Response) => {
  const actor = getActor(req);
  if (!actor || actor.role !== UserRole.FUND) {
    res.status(403).json({ error: "Только зарегистрированный фонд может редактировать задания" });
    return;
  }

  const { id } = req.params;
  const task = DBManager.getTaskById(id);
  if (!task) {
    res.status(404).json({ error: "Задание не найдено" });
    return;
  }

  if (task.fundId !== actor.id) {
    res.status(403).json({ error: "Вы можете редактировать только задания вашего фонда" });
    return;
  }

  // Block editing if the task is already published or completed
  if (task.status === TaskStatus.PUBLISHED || task.status === TaskStatus.COMPLETED) {
    res.status(400).json({ error: "Нельзя редактировать опубликованное или завершенное задание" });
    return;
  }

  const {
    title,
    description,
    category,
    format,
    duration,
    type,
    city,
    location,
    deadline,
    eventDate,
    maxParticipants,
    requirements,
    hoursEstimation,
    materials,
    isDraft,
    conditions,
    tags,
    imageUrl,
    regStart,
    eventTime,
    organizerName,
    organizerPhone,
    organizerEmail,
    vacancies
  } = req.body;

  if (!title || !description || !category || !format || !duration || !type || !city || !deadline || !eventDate || !maxParticipants || !hoursEstimation) {
    res.status(400).json({ error: "Пожалуйста, заполните все обязательные поля задания, включая дедлайн и дату выполнения" });
    return;
  }

  // Update logic: set appropriate status
  const updatedStatus = isDraft ? TaskStatus.DRAFT : TaskStatus.PENDING_MODERATION;

  const updatedTaskFields: Partial<VolunteerTask> = {
    title,
    description,
    category,
    format,
    duration,
    type,
    city,
    location: location || "Онлайн / Дистанционно",
    deadline,
    eventDate,
    maxParticipants: Number(maxParticipants),
    requirements: requirements || "Особых требований нет",
    hoursEstimation: Number(hoursEstimation),
    materials: materials || "",
    status: updatedStatus,
    conditions: Array.isArray(conditions) ? conditions : [],
    tags: Array.isArray(tags) ? tags : [],
    imageUrl: imageUrl || "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=500&auto=format&fit=crop&q=80",
    regStart: regStart || new Date().toISOString().split("T")[0],
    eventTime: eventTime || "12:00 - 16:00",
    organizerName: organizerName || actor.contactName || "",
    organizerPhone: organizerPhone || actor.phone || "",
    organizerEmail: organizerEmail || actor.email || "",
    // Reset moderator comment on edit/resubmission
    moderatorComment: "",
    vacancies: Array.isArray(vacancies) && vacancies.length > 0 ? vacancies : [
      {
        id: "vac_" + Math.random().toString(36).substring(2, 11),
        name: "Основная помощь",
        address: location || "Онлайн / Дистанционно",
        duties: description,
        conditions: Array.isArray(conditions) ? conditions : [],
        requirements: (requirements || "Особых требований нет").split(/,\s*/).map(r => r.trim()).filter(Boolean)
      }
    ]
  };

  DBManager.updateTask(id, updatedTaskFields);

  if (!isDraft) {
    // Notify administrator
    DBManager.createNotification(
      "admin",
      UserRole.ADMIN,
      `Фонд «${actor.name}» обновил задание «${title}» и повторно отправил его на пре-модерацию.`
    );
  }

  res.json({ task: DBManager.getTaskById(id), message: isDraft ? "Изменения успешно сохранены в черновиках" : "Задание успешно обновлено и отправлено на пре-модерацию" });
});


// ==========================================
// 4. APPLICATIONS (ОТКЛИКИ) ENDPOINTS
// ==========================================

// Get all applications
app.get("/api/applications", (req: Request, res: Response) => {
  const actor = getActor(req);
  if (!actor) {
    res.status(401).json({ error: "Авторизация обязательна" });
    return;
  }

  let list = DBManager.getApplications();

  if (actor.role === UserRole.VOLUNTEER) {
    list = list.filter(a => a.volunteerId === actor.id);
  } else if (actor.role === UserRole.FUND) {
    // Find tasks owned by this fund
    const myTasks = DBManager.getTasks().filter(t => t.fundId === actor.id).map(t => t.id);
    list = list.filter(a => myTasks.includes(a.taskId));
  }
  // Admins see everything

  res.json({ applications: list });
});

// Volunteer applies for a task
app.post("/api/tasks/:id/apply", (req: Request, res: Response) => {
  const actor = getActor(req);
  if (!actor || actor.role !== UserRole.VOLUNTEER) {
    res.status(403).json({ error: "Только зарегистрированные волонтёры Столото могут откликаться на проекты" });
    return;
  }

  const { id } = req.params;
  const task = DBManager.getTaskById(id);

  if (!task) {
    res.status(404).json({ error: "Задание не найдено" });
    return;
  }

  if (task.status !== TaskStatus.PUBLISHED) {
    res.status(400).json({ error: "Задание недоступно для откликов" });
    return;
  }

  // Check if already applied
  const alreadyJoined = DBManager.getApplications().some(a => a.taskId === id && a.volunteerId === actor.id);
  if (alreadyJoined) {
    res.status(400).json({ error: "Вы уже откликнулись на это задание" });
    return;
  }

  // Check if limit is reached
  if (task.joinedParticipants >= task.maxParticipants) {
    res.status(400).json({ error: "Лимит участников на это волонтёрское дело уже исчерпан" });
    return;
  }

  const newApp: TaskApplication = {
    id: "app_" + Math.random().toString(36).substring(2, 11),
    taskId: task.id,
    taskTitle: task.title,
    volunteerId: actor.id,
    volunteerName: actor.name,
    volunteerEmail: actor.email,
    volunteerCity: actor.city,
    volunteerDepartment: actor.department,
    volunteerPosition: actor.position,
    status: ApplicationStatus.PENDING,
    createdAt: new Date().toISOString()
  };

  DBManager.createApplication(newApp);

  // Notify the Fund organizer
  DBManager.createNotification(
    task.fundId,
    UserRole.FUND,
    `Сотрудник Столото ${actor.name} откликнулся на вашу задачу «${task.title}».`
  );

  res.status(201).json({ message: "Вы успешно откликнулись! Заявка направлена на подтверждение фонду.", application: newApp });
});

// Cancel a volunteer application
app.post("/api/applications/:id/cancel", (req: Request, res: Response) => {
  const actor = getActor(req);
  if (!actor || actor.role !== UserRole.VOLUNTEER) {
    res.status(403).json({ error: "Отменить отклик может только автор отклика" });
    return;
  }

  const { id } = req.params;
  const appRecord = DBManager.getApplicationById(id);

  if (!appRecord || appRecord.volunteerId !== actor.id) {
    res.status(404).json({ error: "Отклик не найден" });
    return;
  }

  DBManager.updateApplication(id, { status: ApplicationStatus.REJECTED });
  res.json({ message: "Вы успешно отменили свой отклик" });
});

// Fund moderates or completes volunteer application (ACCEPTED / REJECTED / COMPLETED)
app.post("/api/applications/:id/status", (req: Request, res: Response) => {
  const actor = getActor(req);
  if (!actor || actor.role !== UserRole.FUND) {
    res.status(403).json({ error: "Право подтверждения откликов принадлежит фонду" });
    return;
  }

  const { id } = req.params;
  const { status, comment } = req.body; // status: accepted, rejected, completed

  const appRecord = DBManager.getApplicationById(id);
  if (!appRecord) {
    res.status(404).json({ error: "Заявка волонтёра не найдена" });
    return;
  }

  const task = DBManager.getTaskById(appRecord.taskId);
  if (!task || task.fundId !== actor.id) {
    res.status(403).json({ error: "Это задание принадлежит другому фонду" });
    return;
  }

  if (!status || !Object.values(ApplicationStatus).includes(status as ApplicationStatus)) {
    res.status(400).json({ error: "Некорректный статус отклика" });
    return;
  }

  DBManager.updateApplication(id, {
    status: status as ApplicationStatus,
    fundComment: comment || ""
  });

  // Notify volunteer
  let notificationText = "";
  if (status === ApplicationStatus.ACCEPTED) {
    notificationText = `Ваш отклик на благотворительный проект «${task.title}» ОДОБРЕН фондом! Условия будут высланы на корпоративную почту.`;
  } else if (status === ApplicationStatus.REJECTED) {
    notificationText = `К сожалению, ваш отклик на проект «${task.title}» отклонён организаторами.`;
  } else if (status === ApplicationStatus.COMPLETED) {
    notificationText = `Фонд «${task.fundName}» подтвердил выполнение вами задания «${task.title}»! Напишите администратору для финальной верификации начисленных часов.`;
    // If fund completes it, make sure admin gets notified to manually grant hours
    DBManager.createNotification(
      "admin",
      UserRole.ADMIN,
      `Волонтёр ${appRecord.volunteerName} успешно завершил участие в «${task.title}», требуется ручное начисление часов.`
    );
  }

  DBManager.createNotification(appRecord.volunteerId, UserRole.VOLUNTEER, notificationText);

  res.json({ message: "Статус заявки изменен на " + status, application: DBManager.getApplicationById(id) });
});


// ==========================================
// 5. ACCRUING VOLUNTEER HOURS (ADMIN-ONLY)
// ==========================================

// Manually award volunteer hours based on completed status
app.post("/api/admin/applications/:id/award-hours", (req: Request, res: Response) => {
  const actor = getActor(req);
  if (!actor || actor.role !== UserRole.ADMIN) {
    res.status(403).json({ error: "Только администратор Столото имеет право начислять волонтёрские часы" });
    return;
  }

  const { id } = req.params;
  const { hours } = req.body;

  const appRecord = DBManager.getApplicationById(id);
  if (!appRecord) {
    res.status(404).json({ error: "Запись отклика не найдена" });
    return;
  }

  const task = DBManager.getTaskById(appRecord.taskId);
  if (!task) {
    res.status(404).json({ error: "Кампания заданий не найдена" });
    return;
  }

  const hoursToAward = Number(hours) || task.hoursEstimation;

  // Transition status of application to COMPLETED
  DBManager.updateApplication(id, {
    status: ApplicationStatus.COMPLETED,
    hoursAwarded: hoursToAward,
    hoursAwardedBy: actor.name
  });

  // Update overall tasks status in volunteer profile
  const volunteer = DBManager.getUserById(appRecord.volunteerId);
  if (volunteer) {
    const newHours = (volunteer.hours || 0) + hoursToAward;
    // Add badge corresponding to task category if not already present
    const updatedBadges = [...(volunteer.badges || [])];
    if (task.category && !updatedBadges.includes(task.category)) {
      updatedBadges.push(task.category);
    }

    DBManager.updateUser(volunteer.id, {
      hours: newHours,
      badges: updatedBadges
    });

    // Create congratulations notifications
    DBManager.createNotification(
      volunteer.id,
      UserRole.VOLUNTEER,
      `Благодарим за помощь! Администратор начислил вам ${hoursToAward} ч. за участие во встрече «${task.title}». Накоплено всего часов: ${newHours}.`
    );
  }

  res.json({
    message: `Успешно начислено ${hoursToAward} часов волонтёру ${appRecord.volunteerName}`,
    application: DBManager.getApplicationById(id)
  });
});


// ==========================================
// 6. NOTIFICATION SYSTEM ENDPOINTS
// ==========================================

app.get("/api/notifications", (req: Request, res: Response) => {
  const actor = getActor(req);
  if (!actor) {
    res.status(401).json({ error: "Неавторизован" });
    return;
  }

  const list = DBManager.getNotifications(actor.id);
  res.json({ notifications: list });
});

app.post("/api/notifications/read", (req: Request, res: Response) => {
  const actor = getActor(req);
  if (!actor) {
    res.status(401).json({ error: "Неавторизован" });
    return;
  }

  DBManager.markNotificationsRead(actor.id);
  res.json({ message: "Уведомления прочитаны" });
});


// ==========================================
// 7. EXPORT CSV REPORTS & SPREADSHEETS
// ==========================================

// Global Administrator CSV Export
app.get("/api/reports/admin", (req: Request, res: Response) => {
  const volunteers = DBManager.getUsers().filter(u => u.role === UserRole.VOLUNTEER);
  const apps = DBManager.getApplications();

  // Create UTF-8 CSV with BOM for correct Russian text in Excel
  let csv = "\uFEFF";
  // CSV Headers
  csv += "ФИО;Email;Город;Подразделение;Должность;Дата регистрации;Кол-во откликов;Выполненных заданий;Начисленные часы;Статус;Бейджи\r\n";

  volunteers.forEach(v => {
    const totalApplicationsCount = apps.filter(a => a.volunteerId === v.id).length;
    const completedApplicationsCount = apps.filter(a => a.volunteerId === v.id && a.status === ApplicationStatus.COMPLETED).length;
    const badgeNames = (v.badges || []).join(", ");

    csv += `"${v.name}";"${v.email}";"${v.city}";"${v.department || ""}";"${v.position || ""}";"${v.createdAt.slice(0, 10)}";${totalApplicationsCount};${completedApplicationsCount};${v.hours || 0};"${v.volunteerStatus || "Новичок"}";"${badgeNames}"\r\n`;
  });

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=stoloto_volunteers_report.csv");
  res.status(200).send(csv);
});

// Single Charity Fund CSV Export
app.get(["/api/reports/fund", "/api/reports/fund/:fundId"], (req: Request, res: Response) => {
  const fundId = (req.params.fundId || req.query.fundId) as string;
  if (!fundId) {
    res.status(400).send("Не указан идентификатор фонда (fundId)");
    return;
  }
  const fund = DBManager.getUserById(fundId);

  if (!fund || fund.role !== UserRole.FUND) {
    res.status(404).send("Благотворительный фонд не найден");
    return;
  }

  const tasks = DBManager.getTasks().filter(t => t.fundId === fundId);
  const apps = DBManager.getApplications();

  let csv = "\uFEFF";
  csv += "Название задания;Категория;Формат;Город;Дата проведения;Макс. участников;Заявок получено;Из них одобрено;Выполнено участников\r\n";

  tasks.forEach(t => {
    const taskApps = apps.filter(a => a.taskId === t.id);
    const pendingCount = taskApps.filter(a => a.status === ApplicationStatus.PENDING).length;
    const acceptedCount = taskApps.filter(a => a.status === ApplicationStatus.ACCEPTED).length;
    const completedCount = taskApps.filter(a => a.status === ApplicationStatus.COMPLETED).length;

    csv += `"${t.title}";"${t.category}";"${t.format === "online" ? "Онлайн" : "Офлайн"}";"${t.city}";"${t.deadline}";${t.maxParticipants};${taskApps.length};${acceptedCount};${completedCount}\r\n`;
  });

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename=fund_${fundId}_report.csv`);
  res.status(200).send(csv);
});


// ==========================================
// 8. METRICS & ANALYTICS DATA
// ==========================================
app.get("/api/analytics", (req: Request, res: Response) => {
  const user = getActor(req);
  if (!user || user.role !== UserRole.ADMIN) {
    res.status(403).json({ error: "Доступ разрешен только администраторам" });
    return;
  }

  const volunteers = DBManager.getUsers().filter(u => u.role === UserRole.VOLUNTEER);
  const funds = DBManager.getUsers().filter(u => u.role === UserRole.FUND);
  const tasks = DBManager.getTasks();
  const apps = DBManager.getApplications();

  // Metrics calculation
  const totalVolunteers = volunteers.length;
  const activeVolunteersCount = volunteers.filter(v => (v.hours || 0) > 0).length;
  const totalFundsCount = funds.length;
  const approvedFundsCount = funds.filter(f => f.fundStatus === FundStatus.APPROVED).length;
  const pendingFundsCount = funds.filter(f => f.fundStatus === FundStatus.PENDING).length;

  const totalTasksCount = tasks.length;
  const publishedTasksCount = tasks.filter(t => t.status === TaskStatus.PUBLISHED).length;
  const completedTasksCount = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
  const totalHoursDistributed = volunteers.reduce((acc, current) => acc + (current.hours || 0), 0);

  // Grouping hours count by Stoloto departments
  const departmentStats: Record<string, number> = {};
  volunteers.forEach(v => {
    const dept = v.department || "Другое подразделение";
    departmentStats[dept] = (departmentStats[dept] || 0) + (v.hours || 0);
  });

  // Grouping tasks by Category
  const categoryStats: Record<string, number> = {};
  tasks.forEach(t => {
    categoryStats[t.category] = (categoryStats[t.category] || 0) + 1;
  });

  res.json({
    metrics: {
      totalVolunteers,
      activeVolunteersCount,
      totalFundsCount,
      approvedFundsCount,
      pendingFundsCount,
      totalTasksCount,
      publishedTasksCount,
      completedTasksCount,
      totalHoursDistributed
    },
    byDepartment: Object.entries(departmentStats).map(([name, hours]) => ({ name, hours })),
    byCategory: Object.entries(categoryStats).map(([name, value]) => ({ name, value }))
  });
});


// ==========================================
// 9. VITE AND STATIC RESOURCES MIDDLEWARE
// ==========================================

async function startServer() {
  // Ensure the database (PostgreSQL with fallback to local JSON file) is fully initialized
  await DBManager.init();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Помогать проСТО] Server successfully booted under port ${PORT}`);
  });
}

startServer();
