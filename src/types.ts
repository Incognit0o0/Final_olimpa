/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum UserRole {
  VOLUNTEER = "volunteer",
  FUND = "fund",
  ADMIN = "admin"
}

export enum FundStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected"
}

export enum TaskStatus {
  DRAFT = "draft",
  PENDING_MODERATION = "pending_moderation",
  PUBLISHED = "published",
  REJECTED = "rejected",
  COMPLETED = "completed"
}

export enum ApplicationStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
  COMPLETED = "completed"
}

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  name: string; // ФИО for volunteers, Title for funds
  createdAt: string;
  city: string;

  // Volunteer fields
  department?: string; // Подразделение Столото
  position?: string; // Должность
  hours?: number; // Начисленные часы
  volunteerStatus?: string; // "Новичок" | "Активный" | "Лидер"
  badges?: string[]; // ["children", "ecology", "elderly", "pro-bono"]
  isEmployee?: boolean; // Либо сотрудник Столото, либо обычный волонтёр
  password?: string; // Пароль сохраненный при регистрации

  // Fund fields
  description?: string;
  categories?: string[]; // e.g. ["children", "ecology", "elderly", "pro-bono"]
  inn?: string;
  ogrn?: string;
  website?: string;
  contactName?: string;
  contactPosition?: string;
  phone?: string;
  documentName?: string;
  documentData?: string; // Base64 content of file
  fundStatus?: FundStatus;
  moderatorComment?: string;
}

export interface Vacancy {
  id: string;
  name: string; // Нозвание вакансии (e.g. "Волонтёр", "Волонтёр зала")
  address: string; // Адрес
  duties: string; // Обязанности
  conditions: string[]; // Список условий
  requirements: string[]; // Требования (например "Можно с детьми", "18+")
}

export interface VolunteerTask {
  id: string;
  title: string;
  description: string;
  fundId: string;
  fundName: string;
  category: string; // "Дети" | "Пожилые" | "ОВЗ" | "Экология" | "Животные" | "Донорство" | "Pro-bono"
  format: "online" | "offline";
  duration: "one-time" | "regular" | "long-term"; // разовые / регулярные / долгосрочные
  type: "standard" | "pro-bono";
  city: string;
  location: string; // Адрес или ссылка на онлайн
  deadline: string; // Дата завершения / дедлайн отклика
  eventDate: string; // Дата проведения / выполнения задачи
  maxParticipants: number;
  joinedParticipants: number;
  requirements: string; // Общие требования к кандидату
  hoursEstimation: number; // Предполагаемые часы
  materials: string; // Доп. материалы / ссылки
  status: TaskStatus;
  conditions?: string[];
  tags?: string[];
  moderatorComment?: string;
  createdAt: string;

  // New visual and organizational fields:
  imageUrl?: string; // мини-изображение рядом с названием
  regStart?: string; // возможная дата регистрации с...
  eventTime?: string; // время проведения мероприятия (e.g. "12:00 - 18:00")
  organizerName?: string; // ФИО организатора компании
  organizerPhone?: string; // Телефон
  organizerEmail?: string; // Электронная почта
  vacancies?: Vacancy[]; // список доступных вакансий
}

export interface TaskApplication {
  id: string;
  taskId: string;
  taskTitle: string;
  volunteerId: string;
  volunteerName: string;
  volunteerEmail: string;
  volunteerCity: string;
  volunteerDepartment?: string;
  volunteerPosition?: string;
  status: ApplicationStatus;
  hoursAwarded?: number;
  hoursAwardedBy?: string; // Имя админа
  fundComment?: string; // Комментарий фонда при подтверждении
  createdAt: string;
}

export interface NotificationLog {
  id: string;
  userId: string;
  userRole: UserRole;
  text: string;
  isRead: boolean;
  createdAt: string;
}
