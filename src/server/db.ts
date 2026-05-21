/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from "fs";
import path from "path";
import { Pool } from "pg";
import {
  UserProfile,
  VolunteerTask,
  TaskApplication,
  NotificationLog,
  UserRole,
  FundStatus,
  TaskStatus,
  ApplicationStatus
} from "../types.js";

// Database storage file path (for local/fallback mode)
const DB_FILE = path.join(process.cwd(), "database.json");

interface DBStructure {
  users: UserProfile[];
  tasks: VolunteerTask[];
  applications: TaskApplication[];
  notifications: NotificationLog[];
}

const PRESET_USERS: UserProfile[] = [
  {
    id: "admin",
    email: "admin@stoloto.ru",
    role: UserRole.ADMIN,
    name: "Администратор Александр",
    city: "Москва",
    password: "demo",
    createdAt: new Date().toISOString()
  },
  {
    id: "vol1",
    email: "volunteer@stoloto.ru",
    role: UserRole.VOLUNTEER,
    name: "Иванов Иван Иванович",
    city: "Москва",
    department: "Департамент ИТ-архитектуры Столото",
    position: "Старший системный аналитик",
    hours: 12,
    volunteerStatus: "Активный",
    badges: ["Дети", "Экология"],
    isEmployee: true,
    password: "demo",
    createdAt: new Date().toISOString()
  },
  {
    id: "vol2",
    email: "petrov@stoloto.ru",
    role: UserRole.VOLUNTEER,
    name: "Петров Пётр Петрович",
    city: "Самара",
    department: "Региональный отдел продаж",
    position: "Ведущий менеджер",
    hours: 0,
    volunteerStatus: "Новичок",
    badges: [],
    isEmployee: true,
    password: "demo",
    createdAt: new Date().toISOString()
  },
  {
    id: "fund1",
    email: "fond_help@hope.ru",
    role: UserRole.FUND,
    name: "БФ «Подари Свет»",
    city: "Москва",
    description: "Благотворительный фонд помощи сиротам и детям в трудных жизненных ситуациях.",
    categories: ["Дети"],
    inn: "7701234567",
    ogrn: "1027700123456",
    website: "https://podari-svet.org",
    contactName: "Смирнова Анна Дмитриевна",
    contactPosition: "Директор по волонтёрству",
    phone: "+7 (999) 111-22-33",
    documentName: "charter_fund_podari_svet.pdf",
    fundStatus: FundStatus.APPROVED,
    password: "demo",
    createdAt: new Date().toISOString()
  },
  {
    id: "fund2",
    email: "fond@nature.ru",
    role: UserRole.FUND,
    name: "Экологический Союз «Зелёная Планета»",
    city: "Санкт-Петербург",
    description: "Развитие экологических инициатив, сохранение лесных массивов и популяризация раздельного сбора отходов.",
    categories: ["Экология"],
    inn: "7801234567",
    ogrn: "1027800123456",
    website: "https://greenplanet.org",
    contactName: "Васильев Пётр Николаевич",
    contactPosition: "Руководитель спецпроектов",
    phone: "+7 (999) 777-88-99",
    documentName: "charter_green_planet.pdf",
    fundStatus: FundStatus.APPROVED,
    password: "demo",
    createdAt: new Date().toISOString()
  }
];

const PRESET_TASKS: VolunteerTask[] = [
  {
    id: "task1",
    title: "Онлайн-урок программирования для детей в детском доме",
    description: "Ищем корпоративного IT-волонтёра, готового провести вдохновляющую презентацию и вводный урок по Scratch для воспитанников интерната. Опыт работы с детьми приветствуется. Мероприятие полностью дистанционное, все материалы предоставляются.",
    fundId: "fund1",
    fundName: "БФ «Подари Свет»",
    category: "Дети",
    format: "online",
    duration: "one-time",
    type: "pro-bono",
    city: "Москва",
    location: "Zoom встреча (ссылка будет выслана в чат)",
    deadline: "2026-06-15",
    eventDate: "2026-06-20",
    maxParticipants: 4,
    joinedParticipants: 2,
    requirements: "Знание базовых концепций программирования, гарнитура, веб-камера, умение общаться с подростками. Доступно сотрудникам Столото.",
    hoursEstimation: 4,
    materials: "https://scratch.mit.edu, методичка от Столото во вложении.",
    status: TaskStatus.PUBLISHED,
    conditions: ["Благодарности", "Верифицированные часы", "Персональное обучение"],
    tags: ["Можно приходить с детьми", "Пройденный инструктаж"],
    createdAt: new Date().toISOString(),
    imageUrl: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=500&auto=format&fit=crop&q=80",
    regStart: "2026-05-20",
    eventTime: "14:00 - 16:30",
    organizerName: "Смирнова Анна Дмитриевна",
    organizerPhone: "+7 (999) 111-22-33",
    organizerEmail: "fond_help@hope.ru",
    vacancies: [
      {
        id: "vac_t1_1",
        name: "Ведущий ИТ-наставник",
        address: "Zoom вебинар",
        duties: "Проведение презентации, знакомство детей с азами программирования на примере Scratch.",
        conditions: ["Верифицированные часы", "Персональное обучение"],
        requirements: ["Опыт в ИТ", "Коммуникабельность"]
      },
      {
        id: "vac_t1_2",
        name: "Помощник организатора (модератор чата)",
        address: "Zoom вебинар",
        duties: "Модерация вопросов детей в чате Zoom во время проведения урока, сбор обратной связи.",
        conditions: ["Верифицированные часы", "Благодарности"],
        requirements: ["Уверенный пользователь ПК"]
      }
    ]
  },
  {
    id: "task2",
    title: "Большой субботник в Сосновом Бору",
    description: "Масштабная весенняя уборка территории лесопарка. Соберём пластик, стекло и валежник. Столото организует совместный трансфер от офиса, обед на полевой кухне и сувениры для всех корпоративных участников.",
    fundId: "fund2",
    fundName: "Экологический Союз «Зелёная Планета»",
    category: "Экология",
    format: "offline",
    duration: "one-time",
    type: "standard",
    city: "Санкт-Петербург",
    location: "Ленинградская обл., г. Сосновый Бор, лесопарковая зона",
    deadline: "2026-05-28",
    eventDate: "2026-05-30",
    maxParticipants: 15,
    joinedParticipants: 1,
    requirements: "Удобная закрытая обувь, одежда по погоде, головной убор. Перчатки и мешки выдадим на месте сборов.",
    hoursEstimation: 6,
    materials: "Инструкция по технике безопасности при уборке лесопарковых зон.",
    status: TaskStatus.PUBLISHED,
    conditions: ["Бесплатное питание", "Экипировка", "Проезд", "Благодарности", "Верифицированные часы"],
    tags: ["Можно приходить с детьми", "Собственный автомобиль"],
    createdAt: new Date().toISOString(),
    imageUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=500&auto=format&fit=crop&q=80",
    regStart: "2026-05-18",
    eventTime: "10:00 - 15:00",
    organizerName: "Васильев Пётр Николаевич",
    organizerPhone: "+7 (999) 777-88-99",
    organizerEmail: "fond@nature.ru",
    vacancies: [
      {
        id: "vac_t2_1",
        name: "Активист раздельного сбора мусора",
        address: "Парк Сосновый Бор, сектор А",
        duties: "Сбор пластика, стекла и жестяных банок, сортировка по мешкам, транспортировка к мусоровозу.",
        conditions: ["Бесплатное питание", "Экипировка", "Проезд", "Верифицированные часы"],
        requirements: ["Одежда по погоде", "Готовность к физ. труду"]
      },
      {
        id: "vac_t2_2",
        name: "Помощник на полевой кухне (Эко-лагерь)",
        address: "Полевой лагерь в Сосновом Бору",
        duties: "Помощь повару фонда в приготовлении горячей каши и чая для корпоративных участников.",
        conditions: ["Бесплатное питание", "Экипировка", "Верифицированные часы"],
        requirements: ["Аккуратность", "Дисциплина"]
      }
    ]
  },
  {
    id: "task3",
    title: "Разработка дизайна благотворительного баннера",
    description: "Требуется помощь дизайнера для подготовки макетов уличных баннеров для фонда на тему поиска хозяев для бездомных животных. Работа выполняется дистанционно в Figma.",
    fundId: "fund1",
    fundName: "БФ «Подари Свет»",
    category: "Pro-bono",
    format: "online",
    duration: "regular",
    type: "pro-bono",
    city: "Москва",
    location: "Удаленно / Figma",
    deadline: "2026-06-10",
    eventDate: "2026-06-15",
    maxParticipants: 2,
    joinedParticipants: 0,
    requirements: "Опыт работы в Figma, базовые навыки верстки рекламных материалов, креативность и понимание корпоративных гайдов.",
    hoursEstimation: 8,
    materials: "Брендбук проекта, фотографии животных высокого разрешения.",
    status: TaskStatus.PENDING_MODERATION,
    conditions: ["Благодарности", "Верифицированные часы"],
    tags: ["Опыт работы"],
    createdAt: new Date().toISOString(),
    imageUrl: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=500&auto=format&fit=crop&q=80",
    regStart: "2026-05-22",
    eventTime: "Гибкий график",
    organizerName: "Смирнова Анна Дмитриевна",
    organizerPhone: "+7 (999) 111-22-33",
    organizerEmail: "fond_help@hope.ru",
    vacancies: [
      {
        id: "vac_t3_1",
        name: "Графический дизайнер",
        address: "Удалённо",
        duties: "Разработка 3 вариантов баннера 3x6 по брендбуку и предоставленным графическим материалам.",
        conditions: ["Верифицированные часы", "Благодарности"],
        requirements: ["Уверенное владение Figma", "Портфолио"]
      }
    ]
  }
];

const PRESET_APPLICATIONS: TaskApplication[] = [
  {
    id: "app1",
    taskId: "task1",
    taskTitle: "Онлайн-урок программирования для детей в детском доме",
    volunteerId: "vol1",
    volunteerName: "Иванов Иван Иванович",
    volunteerEmail: "volunteer@stoloto.ru",
    volunteerCity: "Москва",
    volunteerDepartment: "Департамент ИТ-архитектуры Столото",
    volunteerPosition: "Старший системный аналитик",
    status: ApplicationStatus.COMPLETED,
    hoursAwarded: 4,
    hoursAwardedBy: "Администратор Александр",
    fundComment: "Иван провел прекрасный интерактивный урок, все дети были в восторге, очень детально обсудили Scratch!",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "app2",
    taskId: "task1",
    taskTitle: "Онлайн-урок программирования для детей в детском доме",
    volunteerId: "vol2",
    volunteerName: "Петров Пётр Петрович",
    volunteerEmail: "petrov@stoloto.ru",
    volunteerCity: "Самара",
    volunteerDepartment: "Региональный отдел продаж",
    volunteerPosition: "Ведущий менеджер",
    status: ApplicationStatus.ACCEPTED,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "app3",
    taskId: "task2",
    taskTitle: "Большой субботник в Сосновом Бору",
    volunteerId: "vol1",
    volunteerName: "Иванов Иван Иванович",
    volunteerEmail: "volunteer@stoloto.ru",
    volunteerCity: "Москва",
    volunteerDepartment: "Департамент ИТ-архитектуры Столото",
    volunteerPosition: "Старший системный аналитик",
    status: ApplicationStatus.PENDING,
    createdAt: new Date().toISOString()
  }
];

const PRESET_NOTIFICATIONS: NotificationLog[] = [
  {
    id: "not1",
    userId: "vol1",
    userRole: UserRole.VOLUNTEER,
    text: "Поздравляем! Задание «Онлайн-урок программирования» успешно завершено. Начислено 4 волонтёрских часа.",
    isRead: false,
    createdAt: new Date().toISOString()
  },
  {
    id: "not2",
    userId: "vol2",
    userRole: UserRole.VOLUNTEER,
    text: "Ваш отклик на задание «Онлайн-урок программирования» был принят фондом. Пожалуйста, проверьте корпоративную почту.",
    isRead: false,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
  }
];

// Serialization Helper definitions
function parseUserRow(row: any): UserProfile {
  return {
    ...row,
    isEmployee: row.isEmployee === true,
    hours: typeof row.hours === "number" ? row.hours : Number(row.hours || 0),
    categories: typeof row.categories === "string" ? JSON.parse(row.categories) : (Array.isArray(row.categories) ? row.categories : []),
    badges: typeof row.badges === "string" ? JSON.parse(row.badges) : (Array.isArray(row.badges) ? row.badges : [])
  };
}

function parseTaskRow(row: any): VolunteerTask {
  return {
    ...row,
    maxParticipants: typeof row.maxParticipants === "number" ? row.maxParticipants : Number(row.maxParticipants || 0),
    joinedParticipants: typeof row.joinedParticipants === "number" ? row.joinedParticipants : Number(row.joinedParticipants || 0),
    hoursEstimation: typeof row.hoursEstimation === "number" ? row.hoursEstimation : Number(row.hoursEstimation || 0),
    conditions: typeof row.conditions === "string" ? JSON.parse(row.conditions) : (Array.isArray(row.conditions) ? row.conditions : []),
    tags: typeof row.tags === "string" ? JSON.parse(row.tags) : (Array.isArray(row.tags) ? row.tags : []),
    vacancies: typeof row.vacancies === "string" ? JSON.parse(row.vacancies) : (Array.isArray(row.vacancies) ? row.vacancies : [])
  };
}

function parseAppRow(row: any): TaskApplication {
  return {
    ...row,
    hoursAwarded: row.hoursAwarded !== null && row.hoursAwarded !== undefined ? Number(row.hoursAwarded) : undefined
  };
}

function parseNotificationRow(row: any): NotificationLog {
  return {
    ...row,
    isRead: row.isRead === true
  };
}

export class DBManager {
  private static data: DBStructure = {
    users: [],
    tasks: [],
    applications: [],
    notifications: []
  };

  private static pool: Pool | null = null;

  public static async init(): Promise<void> {
    const dbUrl = process.env.DATABASE_URL;

    if (dbUrl) {
      console.log("[PostgreSQL] DB Url detected. Initializing PostgreSQL pool...");
      try {
        // SSL rejectUnauthorized is false to perfectly support cloud db (Render / Heroku / Neon etc.)
        this.pool = new Pool({
          connectionString: dbUrl,
          ssl: dbUrl.includes("localhost") || dbUrl.includes("127.0.0.1")
            ? false
            : { rejectUnauthorized: false }
        });

        // 1. Provision schemas
        await this.pool.query(`
          CREATE TABLE IF NOT EXISTS users (
            "id" VARCHAR(50) PRIMARY KEY,
            "email" VARCHAR(255) UNIQUE NOT NULL,
            "role" VARCHAR(20) NOT NULL,
            "name" VARCHAR(255) NOT NULL,
            "city" VARCHAR(255) NOT NULL,
            "password" VARCHAR(255),
            "description" TEXT,
            "categories" JSONB,
            "inn" VARCHAR(50),
            "ogrn" VARCHAR(50),
            "website" VARCHAR(255),
            "contactName" VARCHAR(255),
            "contactPosition" VARCHAR(255),
            "phone" VARCHAR(100),
            "documentName" VARCHAR(255),
            "documentData" TEXT,
            "isEmployee" BOOLEAN DEFAULT FALSE,
            "hours" INTEGER DEFAULT 0,
            "volunteerStatus" VARCHAR(50),
            "badges" JSONB,
            "fundStatus" VARCHAR(50),
            "moderatorComment" TEXT,
            "createdAt" VARCHAR(50) NOT NULL
          );
        `);

        await this.pool.query(`
          CREATE TABLE IF NOT EXISTS tasks (
            "id" VARCHAR(50) PRIMARY KEY,
            "title" VARCHAR(255) NOT NULL,
            "description" TEXT NOT NULL,
            "fundId" VARCHAR(50) NOT NULL,
            "fundName" VARCHAR(255) NOT NULL,
            "category" VARCHAR(100) NOT NULL,
            "format" VARCHAR(20) NOT NULL,
            "duration" VARCHAR(50) NOT NULL,
            "type" VARCHAR(20) NOT NULL,
            "city" VARCHAR(255) NOT NULL,
            "location" VARCHAR(255) NOT NULL,
            "deadline" VARCHAR(50) NOT NULL,
            "eventDate" VARCHAR(50) NOT NULL,
            "maxParticipants" INTEGER NOT NULL DEFAULT 0,
            "joinedParticipants" INTEGER NOT NULL DEFAULT 0,
            "requirements" TEXT NOT NULL,
            "hoursEstimation" INTEGER NOT NULL DEFAULT 0,
            "materials" TEXT,
            "status" VARCHAR(50) NOT NULL,
            "conditions" JSONB,
            "tags" JSONB,
            "createdAt" VARCHAR(50) NOT NULL,
            "imageUrl" TEXT,
            "regStart" VARCHAR(50),
            "eventTime" VARCHAR(100),
            "organizerName" VARCHAR(255),
            "organizerPhone" VARCHAR(100),
            "organizerEmail" VARCHAR(255),
            "vacancies" JSONB,
            "moderatorComment" TEXT
          );
        `);

        await this.pool.query(`
          CREATE TABLE IF NOT EXISTS applications (
            "id" VARCHAR(50) PRIMARY KEY,
            "taskId" VARCHAR(50) NOT NULL,
            "taskTitle" VARCHAR(255) NOT NULL,
            "volunteerId" VARCHAR(50) NOT NULL,
            "volunteerName" VARCHAR(255) NOT NULL,
            "volunteerEmail" VARCHAR(255) NOT NULL,
            "volunteerCity" VARCHAR(255) NOT NULL,
            "volunteerDepartment" VARCHAR(255),
            "volunteerPosition" VARCHAR(255),
            "status" VARCHAR(50) NOT NULL,
            "hoursAwarded" INTEGER,
            "hoursAwardedBy" VARCHAR(255),
            "fundComment" TEXT,
            "createdAt" VARCHAR(50) NOT NULL
          );
        `);

        await this.pool.query(`
          CREATE TABLE IF NOT EXISTS notifications (
            "id" VARCHAR(50) PRIMARY KEY,
            "userId" VARCHAR(50) NOT NULL,
            "userRole" VARCHAR(20) NOT NULL,
            "text" TEXT NOT NULL,
            "isRead" BOOLEAN NOT NULL DEFAULT FALSE,
            "createdAt" VARCHAR(50) NOT NULL
          );
        `);

        // Check if database is empty - if so, seed presets
        const userCheck = await this.pool.query("SELECT COUNT(*) FROM users");
        if (Number(userCheck.rows[0].count) === 0) {
          console.log("[PostgreSQL] Db is clean. Seeding demo presets...");
          
          for (const u of PRESET_USERS) {
            await this.pgInsertUser(u);
          }
          for (const t of PRESET_TASKS) {
            await this.pgInsertTask(t);
          }
          for (const a of PRESET_APPLICATIONS) {
            await this.pgInsertApplication(a);
          }
          for (const n of PRESET_NOTIFICATIONS) {
            await this.pgInsertNotification(n);
          }
        }

        // Load db rows into local structure
        const uRes = await this.pool.query("SELECT * FROM users");
        const tRes = await this.pool.query("SELECT * FROM tasks");
        const aRes = await this.pool.query("SELECT * FROM applications");
        const nRes = await this.pool.query("SELECT * FROM notifications");

        this.data.users = uRes.rows.map(parseUserRow);
        this.data.tasks = tRes.rows.map(parseTaskRow);
        this.data.applications = aRes.rows.map(parseAppRow);
        this.data.notifications = nRes.rows.map(parseNotificationRow);

        console.log(`[PostgreSQL] Fully compiled. Loaded ${this.data.users.length} users, ${this.data.tasks.length} tasks.`);
        return;
      } catch (err) {
        console.error("[PostgreSQL] Failed to initialize connection. Falling back to local file system...", err);
      }
    }

    // Fallback: local json file
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        this.data = JSON.parse(raw);
        if (!this.data.users) this.data.users = [];
        if (!this.data.tasks) this.data.tasks = [];
        if (!this.data.applications) this.data.applications = [];
        if (!this.data.notifications) this.data.notifications = [];

        this.data.tasks = this.data.tasks.map((t, index) => {
          const preset = PRESET_TASKS[index] || PRESET_TASKS[0];
          return {
            ...t,
            eventDate: t.eventDate || t.deadline || new Date().toISOString().split("T")[0],
            imageUrl: t.imageUrl || preset.imageUrl || "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=500&auto=format&fit=crop&q=80",
            regStart: t.regStart || preset.regStart || "2026-05-20",
            eventTime: t.eventTime || preset.eventTime || "12:00 - 16:00",
            organizerName: t.organizerName || preset.organizerName || "Смирнова Анна Дмитриевна",
            organizerPhone: t.organizerPhone || preset.organizerPhone || "+7 (999) 111-22-33",
            organizerEmail: t.organizerEmail || preset.organizerEmail || "fond_help@hope.ru",
            vacancies: t.vacancies && t.vacancies.length > 0 ? t.vacancies : preset.vacancies
          };
        });

        this.save();
      } else {
        this.data = {
          users: PRESET_USERS,
          tasks: PRESET_TASKS,
          applications: PRESET_APPLICATIONS,
          notifications: PRESET_NOTIFICATIONS
        };
        this.save();
      }
      console.log(`[Local JSON File] Loaded successfully with ${this.data.users.length} users, ${this.data.tasks.length} tasks.`);
    } catch (e) {
      console.error("Failed to load/initialize local db file, fallback to memory storage", e);
      this.data = {
        users: PRESET_USERS,
        tasks: PRESET_TASKS,
        applications: PRESET_APPLICATIONS,
        notifications: PRESET_NOTIFICATIONS
      };
    }
  }

  private static save() {
    if (this.pool) return; // DB operations are written instantly to PostgreSQL in background
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (e) {
      console.error("Failed to persist local data", e);
    }
  }

  // --- Users ---
  public static getUsers(): UserProfile[] {
    return this.data.users;
  }

  public static getUserById(id: string): UserProfile | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public static getUserByEmail(email: string): UserProfile | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public static registerUser(profile: UserProfile): UserProfile {
    this.data.users.push(profile);
    this.save();

    // Persist async to db
    this.pgInsertUser(profile);

    return profile;
  }

  public static updateUser(id: string, updates: Partial<UserProfile>): UserProfile | undefined {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      this.data.users[idx] = { ...this.data.users[idx], ...updates };
      if (this.data.users[idx].role === UserRole.VOLUNTEER) {
        const hrs = this.data.users[idx].hours || 0;
        let vStat = "Новичок";
        if (hrs >= 20) {
          vStat = "Лидер";
        } else if (hrs >= 10) {
          vStat = "Активный";
        }
        this.data.users[idx].volunteerStatus = vStat;
      }
      this.save();

      // Persist async to db
      this.pgUpdateUser(id, {
        ...updates,
        volunteerStatus: this.data.users[idx].volunteerStatus
      });

      return this.data.users[idx];
    }
    return undefined;
  }

  // --- Tasks ---
  public static getTasks(): VolunteerTask[] {
    return this.data.tasks;
  }

  public static getTaskById(id: string): VolunteerTask | undefined {
    return this.data.tasks.find(t => t.id === id);
  }

  public static createTask(task: VolunteerTask): VolunteerTask {
    this.data.tasks.push(task);
    this.save();

    // Persist async to db
    this.pgInsertTask(task);

    return task;
  }

  public static updateTask(id: string, updates: Partial<VolunteerTask>): VolunteerTask | undefined {
    const idx = this.data.tasks.findIndex(t => t.id === id);
    if (idx !== -1) {
      this.data.tasks[idx] = { ...this.data.tasks[idx], ...updates };
      this.save();

      // Persist async to db
      this.pgUpdateTask(id, updates);

      return this.data.tasks[idx];
    }
    return undefined;
  }

  // --- Applications ---
  public static getApplications(): TaskApplication[] {
    return this.data.applications;
  }

  public static getApplicationById(id: string): TaskApplication | undefined {
    return this.data.applications.find(a => a.id === id);
  }

  public static createApplication(app: TaskApplication): TaskApplication {
    this.data.applications.push(app);
    const task = this.getTaskById(app.taskId);
    if (task) {
      this.updateTask(task.id, { joinedParticipants: task.joinedParticipants + 1 });
    }
    this.save();

    // Persist async to db
    this.pgInsertApplication(app);

    return app;
  }

  public static updateApplication(id: string, updates: Partial<TaskApplication>): TaskApplication | undefined {
    const idx = this.data.applications.findIndex(a => a.id === id);
    if (idx !== -1) {
      const oldApp = this.data.applications[idx];
      this.data.applications[idx] = { ...this.data.applications[idx], ...updates };

      if (
        updates.status === ApplicationStatus.REJECTED &&
        oldApp.status !== ApplicationStatus.REJECTED
      ) {
        const task = this.getTaskById(oldApp.taskId);
        if (task) {
          this.updateTask(task.id, { joinedParticipants: Math.max(0, task.joinedParticipants - 1) });
        }
      }
      this.save();

      // Persist async to db
      this.pgUpdateApplication(id, updates);

      return this.data.applications[idx];
    }
    return undefined;
  }

  // --- Notifications ---
  public static getNotifications(userId: string): NotificationLog[] {
    return this.data.notifications.filter(n => n.userId === userId);
  }

  public static createNotification(userId: string, userRole: UserRole, text: string): NotificationLog {
    const notification: NotificationLog = {
      id: "not_" + Math.random().toString(36).substring(2, 11),
      userId,
      userRole,
      text,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    this.data.notifications.push(notification);
    this.save();

    // Persist async to db
    this.pgInsertNotification(notification);

    return notification;
  }

  public static markNotificationsRead(userId: string) {
    this.data.notifications.forEach((n, idx) => {
      if (n.userId === userId) {
        this.data.notifications[idx].isRead = true;
      }
    });
    this.save();

    // Persist async to db
    this.pgMarkNotificationsRead(userId);
  }

  // ==========================================
  // PARALLEL ASYNC DB WRITE ADAPTERS
  // ==========================================
  private static async pgInsertUser(user: UserProfile) {
    if (!this.pool) return;
    try {
      const keys = Object.keys(user);
      const cols = keys.map(k => `"${k}"`).join(", ");
      const slots = keys.map((_, i) => `$${i + 1}`).join(", ");
      const values = keys.map(k => {
        const val = (user as any)[k];
        if (typeof val === "object" && val !== null) {
          return JSON.stringify(val);
        }
        return val;
      });
      const query = `INSERT INTO users (${cols}) VALUES (${slots}) ON CONFLICT ("id") DO NOTHING`;
      await this.pool.query(query, values);
    } catch (err) {
      console.error(`[PostgreSQL Error] Failed inserting user ${user.id}:`, err);
    }
  }

  private static async pgUpdateUser(id: string, updates: Partial<UserProfile>) {
    if (!this.pool) return;
    try {
      const keys = Object.keys(updates);
      if (keys.length === 0) return;
      const setClause = keys.map((key, i) => `"${key}" = $${i + 2}`).join(", ");
      const values = keys.map(key => {
        const val = (updates as any)[key];
        if (typeof val === "object" && val !== null) {
          return JSON.stringify(val);
        }
        return val;
      });
      const query = `UPDATE users SET ${setClause} WHERE "id" = $1`;
      await this.pool.query(query, [id, ...values]);
    } catch (err) {
      console.error(`[PostgreSQL Error] Failed updating user ${id}:`, err);
    }
  }

  private static async pgInsertTask(task: VolunteerTask) {
    if (!this.pool) return;
    try {
      const keys = Object.keys(task);
      const cols = keys.map(k => `"${k}"`).join(", ");
      const slots = keys.map((_, i) => `$${i + 1}`).join(", ");
      const values = keys.map(k => {
        const val = (task as any)[k];
        if (typeof val === "object" && val !== null) {
          return JSON.stringify(val);
        }
        return val;
      });
      const query = `INSERT INTO tasks (${cols}) VALUES (${slots}) ON CONFLICT ("id") DO NOTHING`;
      await this.pool.query(query, values);
    } catch (err) {
      console.error(`[PostgreSQL Error] Failed inserting task ${task.id}:`, err);
    }
  }

  private static async pgUpdateTask(id: string, updates: Partial<VolunteerTask>) {
    if (!this.pool) return;
    try {
      const keys = Object.keys(updates);
      if (keys.length === 0) return;
      const setClause = keys.map((key, i) => `"${key}" = $${i + 2}`).join(", ");
      const values = keys.map(key => {
        const val = (updates as any)[key];
        if (typeof val === "object" && val !== null) {
          return JSON.stringify(val);
        }
        return val;
      });
      const query = `UPDATE tasks SET ${setClause} WHERE "id" = $1`;
      await this.pool.query(query, [id, ...values]);
    } catch (err) {
      console.error(`[PostgreSQL Error] Failed updating task ${id}:`, err);
    }
  }

  private static async pgInsertApplication(app: TaskApplication) {
    if (!this.pool) return;
    try {
      const keys = Object.keys(app);
      const cols = keys.map(k => `"${k}"`).join(", ");
      const slots = keys.map((_, i) => `$${i + 1}`).join(", ");
      const values = keys.map(k => {
        const val = (app as any)[k];
        if (typeof val === "object" && val !== null) {
          return JSON.stringify(val);
        }
        return val;
      });
      const query = `INSERT INTO applications (${cols}) VALUES (${slots}) ON CONFLICT ("id") DO NOTHING`;
      await this.pool.query(query, values);
    } catch (err) {
      console.error(`[PostgreSQL Error] Failed inserting application ${app.id}:`, err);
    }
  }

  private static async pgUpdateApplication(id: string, updates: Partial<TaskApplication>) {
    if (!this.pool) return;
    try {
      const keys = Object.keys(updates);
      if (keys.length === 0) return;
      const setClause = keys.map((key, i) => `"${key}" = $${i + 2}`).join(", ");
      const values = keys.map(key => {
        const val = (updates as any)[key];
        if (typeof val === "object" && val !== null) {
          return JSON.stringify(val);
        }
        return val;
      });
      const query = `UPDATE applications SET ${setClause} WHERE "id" = $1`;
      await this.pool.query(query, [id, ...values]);
    } catch (err) {
      console.error(`[PostgreSQL Error] Failed updating application ${id}:`, err);
    }
  }

  private static async pgInsertNotification(n: NotificationLog) {
    if (!this.pool) return;
    try {
      const keys = Object.keys(n);
      const cols = keys.map(k => `"${k}"`).join(", ");
      const slots = keys.map((_, i) => `$${i + 1}`).join(", ");
      const values = keys.map(k => {
        const val = (n as any)[k];
        if (typeof val === "object" && val !== null) {
          return JSON.stringify(val);
        }
        return val;
      });
      const query = `INSERT INTO notifications (${cols}) VALUES (${slots}) ON CONFLICT ("id") DO NOTHING`;
      await this.pool.query(query, values);
    } catch (err) {
      console.error(`[PostgreSQL Error] Failed inserting notification ${n.id}:`, err);
    }
  }

  private static async pgMarkNotificationsRead(userId: string) {
    if (!this.pool) return;
    try {
      await this.pool.query(`UPDATE notifications SET "isRead" = true WHERE "userId" = $1`, [userId]);
    } catch (err) {
      console.error(`[PostgreSQL Error] Failed marking notifications read for user ${userId}:`, err);
    }
  }
}
