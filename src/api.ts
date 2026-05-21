/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  UserProfile,
  VolunteerTask,
  TaskApplication,
  NotificationLog,
  FundStatus,
  TaskStatus,
  ApplicationStatus
} from "./types.js";

// We use relative paths for API endpoints, which resolves beautifully relative to current origin.
const BASE_URL = "";

// Simple in-memory storage for local preview tracking if backend is starting,
// but we will primarily use fetch with X-User-Id headers.
let activeUser: UserProfile | null = null;

export function setActiveUser(user: UserProfile | null) {
  activeUser = user;
  if (user) {
    localStorage.setItem("stoloto_v_user_id", user.id);
  } else {
    localStorage.removeItem("stoloto_v_user_id");
  }
}

export function getActiveUserSync(): UserProfile | null {
  return activeUser;
}

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  const storedUserId = localStorage.getItem("stoloto_v_user_id");
  if (storedUserId) {
    headers["X-User-Id"] = storedUserId;
  }
  return headers;
}

export async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Ошибка запроса s (${res.status})`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  // --- Auth ---
  async me(): Promise<{ user: UserProfile }> {
    return request<{ user: UserProfile }>("/api/auth/me");
  },

  async login(email: string, password?: string): Promise<{ user: UserProfile; message: string }> {
    const result = await request<{ user: UserProfile; message: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password: password || "demo" }),
    });
    setActiveUser(result.user);
    return result;
  },

  async registerVolunteer(data: {
    email: string;
    name: string;
    city: string;
    department: string;
    position: string;
    isEmployee: boolean;
    password?: string;
  }): Promise<{ user: UserProfile; message: string }> {
    const result = await request<{ user: UserProfile; message: string }>("/api/auth/register-volunteer", {
      method: "POST",
      body: JSON.stringify(data),
    });
    setActiveUser(result.user);
    return result;
  },

  async registerFund(data: {
    email: string;
    name: string;
    description: string;
    categories: string[];
    inn: string;
    ogrn: string;
    city: string;
    website: string;
    contactName: string;
    contactPosition: string;
    phone: string;
    documentName: string;
    documentData?: string;
    password?: string;
  }): Promise<{ user: UserProfile; message: string }> {
    const result = await request<{ user: UserProfile; message: string }>("/api/auth/register-fund", {
      method: "POST",
      body: JSON.stringify(data),
    });
    setActiveUser(result.user);
    return result;
  },

  async resubmitFund(data: {
    name: string;
    description: string;
    categories: string[];
    inn: string;
    ogrn: string;
    city: string;
    website: string;
    contactName: string;
    contactPosition: string;
    phone: string;
    documentName: string;
    documentData?: string;
  }): Promise<{ user: UserProfile; message: string }> {
    const result = await request<{ user: UserProfile; message: string }>("/api/fund/resubmit", {
      method: "POST",
      body: JSON.stringify(data),
    });
    setActiveUser(result.user);
    return result;
  },

  async updateProfile(data: {
    name: string;
    city: string;
    department?: string;
    position?: string;
    phone?: string;
    description?: string;
    website?: string;
  }): Promise<{ user: UserProfile; message: string }> {
    const result = await request<{ user: UserProfile; message: string }>("/api/user/update-profile", {
      method: "POST",
      body: JSON.stringify(data),
    });
    setActiveUser(result.user);
    return result;
  },

  // --- Admin Fund Moderation ---
  async getFunds(): Promise<{ funds: UserProfile[] }> {
    return request<{ funds: UserProfile[] }>("/api/admin/funds");
  },

  async updateFundStatus(fundId: string, status: FundStatus, comment?: string): Promise<{ fund: UserProfile; message: string }> {
    return request<{ fund: UserProfile; message: string }>(`/api/admin/funds/${fundId}/status`, {
      method: "POST",
      body: JSON.stringify({ status, comment }),
    });
  },

  // --- Tasks ---
  async getTasks(filters: {
    format?: string;
    duration?: string;
    type?: string;
    category?: string;
    city?: string;
    fundId?: string;
    status?: string;
  } = {}): Promise<{ tasks: VolunteerTask[] }> {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val) query.append(key, val);
    });
    const url = `/api/tasks?${query.toString()}`;
    return request<{ tasks: VolunteerTask[] }>(url);
  },

  async createTask(data: {
    title: string;
    description: string;
    category: string;
    format: "online" | "offline";
    duration: "one-time" | "regular" | "long-term";
    type: "standard" | "pro-bono";
    city: string;
    location: string;
    deadline: string;
    eventDate: string;
    maxParticipants: number;
    requirements: string;
    hoursEstimation: number;
    materials: string;
    isDraft?: boolean;
    conditions?: string[];
    tags?: string[];
    imageUrl?: string;
    regStart?: string;
    eventTime?: string;
    organizerName?: string;
    organizerPhone?: string;
    organizerEmail?: string;
    vacancies?: any[];
  }): Promise<{ task: VolunteerTask; message: string }> {
    return request<{ task: VolunteerTask; message: string }>("/api/tasks", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateTask(taskId: string, data: {
    title: string;
    description: string;
    category: string;
    format: "online" | "offline";
    duration: "one-time" | "regular" | "long-term";
    type: "standard" | "pro-bono";
    city: string;
    location: string;
    deadline: string;
    eventDate: string;
    maxParticipants: number;
    requirements: string;
    hoursEstimation: number;
    materials: string;
    isDraft?: boolean;
    conditions?: string[];
    tags?: string[];
    imageUrl?: string;
    regStart?: string;
    eventTime?: string;
    organizerName?: string;
    organizerPhone?: string;
    organizerEmail?: string;
    vacancies?: any[];
  }): Promise<{ task: VolunteerTask; message: string }> {
    return request<{ task: VolunteerTask; message: string }>(`/api/tasks/${taskId}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateTaskStatus(taskId: string, status: TaskStatus, comment?: string): Promise<{ task: VolunteerTask; message: string }> {
    return request<{ task: VolunteerTask; message: string }>(`/api/tasks/${taskId}/status`, {
      method: "POST",
      body: JSON.stringify({ status, comment }),
    });
  },

  // --- Applications ---
  async getApplications(): Promise<{ applications: TaskApplication[] }> {
    return request<{ applications: TaskApplication[] }>("/api/applications");
  },

  async applyForTask(taskId: string): Promise<{ application: TaskApplication; message: string }> {
    return request<{ application: TaskApplication; message: string }>(`/api/tasks/${taskId}/apply`, {
      method: "POST",
    });
  },

  async cancelApplication(appId: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/api/applications/${appId}/cancel`, {
      method: "POST",
    });
  },

  async updateApplicationStatus(appId: string, status: ApplicationStatus, comment?: string): Promise<{ application: TaskApplication; message: string }> {
    return request<{ application: TaskApplication; message: string }>(`/api/applications/${appId}/status`, {
      method: "POST",
      body: JSON.stringify({ status, comment }),
    });
  },

  // --- Admin Hours Accrual ---
  async awardHours(appId: string, hours: number): Promise<{ application: TaskApplication; message: string }> {
    return request<{ application: TaskApplication; message: string }>(`/api/admin/applications/${appId}/award-hours`, {
      method: "POST",
      body: JSON.stringify({ hours }),
    });
  },

  // --- Notifications ---
  async getNotifications(): Promise<{ notifications: NotificationLog[] }> {
    return request<{ notifications: NotificationLog[] }>("/api/notifications");
  },

  async markNotificationsRead(): Promise<{ message: string }> {
    return request<{ message: string }>("/api/notifications/read", {
      method: "POST",
    });
  },

  // --- Analytics ---
  async getAnalytics(): Promise<{
    metrics: {
      totalVolunteers: number;
      activeVolunteersCount: number;
      totalFundsCount: number;
      approvedFundsCount: number;
      pendingFundsCount: number;
      totalTasksCount: number;
      publishedTasksCount: number;
      completedTasksCount: number;
      totalHoursDistributed: number;
    };
    byDepartment: { name: string; hours: number }[];
    byCategory: { name: string; value: number }[];
  }> {
    return request<any>("/api/analytics");
  }
};
