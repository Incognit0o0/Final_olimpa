/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { api } from "../api.js";
import { UserProfile, VolunteerTask, TaskApplication, FundStatus, TaskStatus, ApplicationStatus } from "../types.js";
import { PlusCircle, List, UserCheck, BarChart3, Download, ShieldAlert, Sparkles, AlertCircle, CheckCircle, User, Building, MapPin, Image, Upload, X, Mail, Phone } from "lucide-react";

export const AVAILABLE_CONDITIONS = [
  "Бесплатное питание",
  "Билеты в театр",
  "Благодарности",
  "Верифицированные часы",
  "Оплата проживания",
  "Персональное обучение",
  "Проезд",
  "Экипировка"
];

export const AVAILABLE_TAGS = [
  "Идёт набор в резерв",
  "Можно как посетитель",
  "Организация работает по стандарту организатора волонтёрской деятельности",
  "Победители конкурса Фонда президентских грантов",
  "Организации из реестра СО НКО",
  "Адресная помощь",
  "Доступно для людей с инвалидностью",
  "Медицинское добровольчество",
  "Можно приходить с детьми",
  "Собственный транспорт"
];

export const CANDIDATE_REQUIREMENTS_PRESETS = [
  "Возраст от 18 лет",
  "Своя спортивная/удобная одежда",
  "Опыт работы с детьми",
  "Наличие медицинской книжки",
  "Умение работать в команде",
  "Стрессоустойчивость и эмпатия",
  "Гражданство РФ",
  "Базовое владение ПК/смартфоном",
  "Желание помогать людям",
  "Прохождение вебинара-инструктажа перед началом"
];

export const IMAGE_PRESETS = [
  {
    name: "Дети",
    url: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&auto=format&fit=crop&q=80",
    emoji: "🧸"
  },
  {
    name: "Экология",
    url: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop&q=80",
    emoji: "🌱"
  },
  {
    name: "Пожилые",
    url: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=600&auto=format&fit=crop&q=80",
    emoji: "👵"
  },
  {
    name: "Животные",
    url: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=600&auto=format&fit=crop&q=80",
    emoji: "🐾"
  },
  {
    name: "Спорт",
    url: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=600&auto=format&fit=crop&q=80",
    emoji: "🏆"
  },
  {
    name: "Интеллектуальная",
    url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&auto=format&fit=crop&q=80",
    emoji: "🧠"
  }
];

interface FundCabinetProps {
  user: UserProfile;
  tasks: VolunteerTask[];
  applications: TaskApplication[];
  onRefreshAll: () => void;
  activeTab: "tasks" | "create" | "candidates" | "profile";
  setActiveTab: (tab: "tasks" | "create" | "candidates" | "profile") => void;
}

export default function FundCabinet({
  user,
  tasks,
  applications,
  onRefreshAll,
  activeTab,
  setActiveTab,
}: FundCabinetProps) {
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
  } | null>(null);

  // Edit registration profile hooks
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(user.name || "");
  const [editDescription, setEditDescription] = useState(user.description || "");
  const [editInn, setEditInn] = useState(user.inn || "");
  const [editOgrn, setEditOgrn] = useState(user.ogrn || "");
  const [editCity, setEditCity] = useState(user.city || "");
  const [editWebsite, setEditWebsite] = useState(user.website || "");
  const [editContactName, setEditContactName] = useState(user.contactName || "");
  const [editContactPosition, setEditContactPosition] = useState(user.contactPosition || "");
  const [editPhone, setEditPhone] = useState(user.phone || "");
  const [editDocName, setEditDocName] = useState(user.documentName || "");
  const [editDocData, setEditDocData] = useState(user.documentData || "");

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditDocName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setEditDocData(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleResubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await api.resubmitFund({
        name: editName,
        description: editDescription,
        categories: user.categories || ["Общее"],
        inn: editInn,
        ogrn: editOgrn,
        city: editCity,
        website: editWebsite,
        contactName: editContactName,
        contactPosition: editContactPosition,
        phone: editPhone,
        documentName: editDocName,
        documentData: editDocData
      });
      setSuccessMsg(res.message);
      setIsEditingProfile(false);
      onRefreshAll();
    } catch (err: any) {
      setErrorMsg(err.message || "Ошибка при повторной отправке данных");
    }
  };

  const handleSaveFundProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await api.updateProfile({
        name: editName,
        city: editCity,
        description: editDescription,
        website: editWebsite,
        phone: editPhone
      });
      setSuccessMsg(res.message);
      setIsEditingProfile(false);
      onRefreshAll();
    } catch (err: any) {
      setErrorMsg(err.message || "Ошибка при обновлении профиля фонда");
    }
  };

  useEffect(() => {
    if (user) {
      setEditName(user.name || "");
      setEditDescription(user.description || "");
      setEditInn(user.inn || "");
      setEditOgrn(user.ogrn || "");
      setEditCity(user.city || "");
      setEditWebsite(user.website || "");
      setEditContactName(user.contactName || "");
      setEditContactPosition(user.contactPosition || "");
      setEditPhone(user.phone || "");
      setEditDocName(user.documentName || "");
      setEditDocData(user.documentData || "");

      // Pre-fill task coordinator fields from user's contact person info
      setOrganizerName(prev => prev || user.contactName || "");
      setOrganizerPhone(prev => prev || user.phone || "");
      setOrganizerEmail(prev => prev || user.email || "");
    }
  }, [user]);

  // Create task state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Дети");
  const [format, setFormat] = useState<"online" | "offline">("online");
  const [duration, setDuration] = useState<"one-time" | "regular" | "long-term">("one-time");
  const [type, setType] = useState<"standard" | "pro-bono">("standard");
  const [city, setCity] = useState("Москва");
  const [location, setLocation] = useState("");
  const [deadline, setDeadline] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(1);
  const [requirements, setRequirements] = useState("");
  const [hoursEstimation, setHoursEstimation] = useState(4);
  const [materials, setMaterials] = useState("");

  // Event Coordinator Contacts & Image URL
  const [organizerName, setOrganizerName] = useState("");
  const [organizerPhone, setOrganizerPhone] = useState("");
  const [organizerEmail, setOrganizerEmail] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  
  // Tag and Conditions selections
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedReqs, setSelectedReqs] = useState<string[]>([]);

  // Applicant status adjustment comments
  const [fundComment, setFundComment] = useState("");
  const [activeAppIdComment, setActiveAppIdComment] = useState<string | null>(null);

  const isApproved = user.fundStatus === FundStatus.APPROVED;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Размер изображения не должен превышать 2 МБ");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Размер изображения не должен превышать 2 МБ");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateTask = async (e: React.FormEvent, isDraft: boolean) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!isApproved) {
      setErrorMsg("Запрещено публиковать задания. Ваша организация должна быть одобрена администратором Столото.");
      return;
    }

    try {
      const response = await api.createTask({
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
        maxParticipants: Number(maxParticipants),
        requirements: [
          ...selectedReqs,
          requirements.trim()
        ].filter(Boolean).join(", "),
        hoursEstimation: Number(hoursEstimation),
        materials,
        isDraft,
        conditions: selectedConditions,
        tags: selectedTags,
        organizerName: organizerName.trim(),
        organizerPhone: organizerPhone.trim(),
        organizerEmail: organizerEmail.trim(),
        imageUrl: imageUrl.trim() || undefined,
      });

      setSuccessMsg(response.message);
      // Reset form
      setTitle("");
      setDescription("");
      setLocation("");
      setDeadline("");
      setEventDate("");
      setMaxParticipants(1);
      setRequirements("");
      setSelectedReqs([]);
      setHoursEstimation(4);
      setMaterials("");
      setSelectedConditions([]);
      setSelectedTags([]);

      // Reset coordinator fields and image state
      setOrganizerName(user.contactName || "");
      setOrganizerPhone(user.phone || "");
      setOrganizerEmail(user.email || "");
      setImageUrl("");

      setActiveTab("tasks");
      onRefreshAll();
    } catch (err: any) {
      setErrorMsg(err.message || "Ошибка при создании задания");
    }
  };

  const handleCloseTask = async (taskId: string) => {
    // Find active accepted volunteers whose participation is confirmed/active but hours are not yet credited
    const uncreditedVolunteers = applications.filter(
      a => a.taskId === taskId && a.status === ApplicationStatus.ACCEPTED
    );

    if (uncreditedVolunteers.length > 0) {
      const names = uncreditedVolunteers.map(a => a.volunteerName).join(", ");
      setConfirmModal({
        isOpen: true,
        title: "⚠️ Незачисленные часы волонтёров",
        message: `В этом проекте остались назначенные участники без зачисления часов: ${names}. Возможно, волонтёр не выполнил задание, либо вы по ошибке завершаете проект без подведения итогов. Вы действительно хотите закрыть проект? Внесенные изменения нельзя будет отменить, а начислить часы после закрытия будет невозможно.`,
        confirmText: "Закрыть проект",
        cancelText: "Отменить закрытие",
        onConfirm: async () => {
          try {
            await api.updateTaskStatus(taskId, TaskStatus.COMPLETED);
            onRefreshAll();
          } catch (err: any) {
            alert(err.message);
          }
        }
      });
    } else {
      setConfirmModal({
        isOpen: true,
        title: "Завершить проект",
        message: "Проект успешно выполнен? Это сделает его недоступным для набора волонтёров.",
        confirmText: "Завершить проект",
        cancelText: "Отмена",
        onConfirm: async () => {
          try {
            await api.updateTaskStatus(taskId, TaskStatus.COMPLETED);
            onRefreshAll();
          } catch (err: any) {
            alert(err.message);
          }
        }
      });
    }
  };

  const handleApplicantStatus = async (appId: string, status: ApplicationStatus) => {
    try {
      const comment = activeAppIdComment === appId ? fundComment : "";
      await api.updateApplicationStatus(appId, status, comment);
      setFundComment("");
      setActiveAppIdComment(null);
      onRefreshAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getCategoryBadgeClass = (cat: string) => {
    switch (cat) {
      case "Дети":
        return "bg-[#00A8CC]/10 text-[#00A8CC] border border-[#00A8CC]/20 font-bold px-2 py-0.5 rounded text-[10px]";
      case "Пожилые":
        return "bg-[#D70066]/10 text-[#D70066] border border-[#D70066]/20 font-bold px-2 py-0.5 rounded text-[10px]";
      case "ОВЗ":
        return "bg-[#E42020]/10 text-[#E42020] border border-[#E42020]/20 font-bold px-2 py-0.5 rounded text-[10px]";
      case "Экология":
        return "bg-[#00A8CC]/15 text-[#00A8CC] border border-[#00A8CC]/30 font-bold px-2 py-0.5 rounded text-[10px]";
      case "Животные":
        return "bg-[#D70066]/15 text-[#D70066] border border-[#D70066]/30 font-bold px-2 py-0.5 rounded text-[10px]";
      case "Донорство":
        return "bg-[#E42020]/15 text-[#E42020] border border-[#E42020]/30 font-bold px-2 py-0.5 rounded text-[10px]";
      case "Pro-bono":
        return "bg-indigo-50 text-indigo-700 border border-indigo-150 font-bold px-2 py-0.5 rounded text-[10px]";
      default:
        return "bg-neutral-100 text-neutral-800 border border-neutral-200 font-bold px-2 py-0.5 rounded text-[10px]";
    }
  };

  const myTasks = tasks.filter(t => t.fundId === user.id);
  // Get all applications to current fund's tasks
  const myTaskIds = myTasks.map(t => t.id);
  const myApplications = applications.filter(a => myTaskIds.includes(a.taskId));

  const totalClosedCount = myTasks.filter(t => t.status === "completed").length;
  const totalAcceptedVolunteersCount = myApplications.filter(a => a.status === "accepted" || a.status === "completed").length;

  return (
    <div id="fund-cabinet-root" className="space-y-6 text-left">
      
      {/* 1. Status Check Alerts */}
      {user.fundStatus === FundStatus.PENDING && (
        <div className="bg-yellow-50 text-neutral-950 p-5 rounded-3xl border border-yellow-200 flex gap-4 items-start">
          <AlertCircle className="h-6 w-6 text-neutral-800 shrink-0 mt-0.5" />
          <div className="space-y-1.5 text-xs md:text-sm">
            <h4 className="font-bold text-neutral-900">Профиль фонда зарегистрирован и отправлен юристам Столото</h4>
            <p className="text-neutral-600 leading-relaxed">
              Спасибо за отправку ИНН ({user.inn}) и лицензионного пакета ({user.documentName}). Сейчас наши кураторы сверяют реквизиты. Пока статус не изменится на <strong>«Одобрен»</strong>, вы не можете отправлять свои задания на модерацию в ленту сотрудников.
            </p>
          </div>
        </div>
      )}

      {user.fundStatus === FundStatus.REJECTED && (
        <div className="bg-red-50 text-red-800 p-5 rounded-3xl border border-red-200 flex gap-4 items-start">
          <ShieldAlert className="h-6 w-6 text-red-700 shrink-0 mt-0.5" />
          <div className="space-y-1.5 text-xs md:text-sm">
            <h4 className="font-extrabold text-neutral-955">Вам отказано в верификации партнёрского соглашения</h4>
            <p className="text-neutral-700">
              Ваша учётная запись фонда была отклонена администратором. Вы можете скорректировать данные и отправить заявку на повторную проверку.
            </p>
            {user.moderatorComment && (
              <div className="bg-white/60 p-3 rounded-lg border text-xs text-neutral-800">
                <span className="font-bold block text-neutral-400 text-[10px] uppercase">Комментарий юристов:</span>
                «{user.moderatorComment}»
              </div>
            )}
            {!isEditingProfile && (
              <div className="pt-2">
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="bg-neutral-900 text-white hover:bg-black font-extrabold text-xs px-4.5 py-2 rounded-xl shadow-xs transition cursor-pointer"
                >
                  ✏️ Редактировать заявку и отправить заново
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {user.fundStatus === FundStatus.APPROVED && (
        <div className="bg-green-50 text-green-800 p-4.5 rounded-2xl border border-green-200 flex gap-3.5 items-center">
          <CheckCircle className="h-5.5 w-5.5 text-green-600" />
          <div className="text-xs">
            <p className="font-bold text-neutral-900">Запись верифицирована</p>
            <p className="text-neutral-600 font-sans">Благотворительный фонд официально одобрен. Всё готово к публикациям и набору корпоративных помощников.</p>
          </div>
        </div>
      )}

      {/* Profile resubmission form */}
      {isEditingProfile && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm text-left">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-extrabold text-base text-neutral-900">Редактирование заявки фонда</h3>
              <p className="text-xs text-neutral-500 mt-1">Отредактируйте сведения для повторной отправки кураторам.</p>
            </div>
            <button
              onClick={() => setIsEditingProfile(false)}
              className="text-xs bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer"
            >
              Отменить
            </button>
          </div>

          <form onSubmit={handleResubmitProfile} className="space-y-5 max-w-4xl font-sans">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-neutral-700">Полное юридическое название фонда *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full text-xs bg-neutral-50 p-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:border-[#FFE300]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-neutral-700">Город расположения офиса *</label>
                <input
                  type="text"
                  required
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  className="w-full text-xs bg-neutral-50 p-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:border-[#FFE300]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-neutral-700">Официальное описание миссии *</label>
              <textarea
                required
                rows={3}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full text-xs bg-neutral-50 p-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:border-[#FFE300]"
                placeholder="Расскажите о направлениях вашей помощи..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-neutral-700">ИНН организации *</label>
                <input
                  type="text"
                  required
                  pattern="[0-9]{10,12}"
                  title="ИНН содержит от 10 до 12 цифр"
                  value={editInn}
                  onChange={(e) => setEditInn(e.target.value)}
                  className="w-full text-xs bg-neutral-50 p-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:border-[#FFE300]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-neutral-700">ОГРН организации *</label>
                <input
                  type="text"
                  required
                  pattern="[0-9]{13,15}"
                  title="ОГРН содержит 13 или 15 цифр"
                  value={editOgrn}
                  onChange={(e) => setEditOgrn(e.target.value)}
                  className="w-full text-xs bg-neutral-50 p-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:border-[#FFE300]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-neutral-700">Адрес веб-сайта / Ссылка на группу VK</label>
              <input
                type="url"
                value={editWebsite}
                onChange={(e) => setEditWebsite(e.target.value)}
                placeholder="https://example.org"
                className="w-full text-xs bg-neutral-50 p-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:border-[#FFE300]"
              />
            </div>

            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-4">
              <h4 className="text-[10.5px] font-black text-[#000000] uppercase tracking-wide">👤 Контакт уполномоченного представителя</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-neutral-600">ФИО представителя *</label>
                  <input
                    type="text"
                    required
                    value={editContactName}
                    onChange={(e) => setEditContactName(e.target.value)}
                    className="w-full text-xs bg-white p-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:border-[#FFE300]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-neutral-600">Должность представителя</label>
                  <input
                    type="text"
                    value={editContactPosition}
                    onChange={(e) => setEditContactPosition(e.target.value)}
                    className="w-full text-xs bg-white p-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:border-[#FFE300]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-neutral-600">Номер телефона *</label>
                  <input
                    type="tel"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full text-xs bg-white p-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:border-[#FFE300]"
                    placeholder="+7 (999) 000-00-00"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-neutral-700">Лицензии, уставные документы (PDF, PNG, JPG)</label>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer inline-flex items-center gap-2 bg-neutral-250 hover:bg-neutral-300 text-black border border-neutral-300 font-bold text-xs px-3.5 py-2.5 rounded-lg shadow-xs transition">
                  <span>📁 Выбрать новый файл...</span>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleEditFileChange}
                    className="hidden"
                  />
                </label>
                <span className="text-xs text-neutral-600 font-mono">
                  {editDocName ? `📄 ${editDocName}` : "Предыдущий файл сохранён"}
                </span>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-3">
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs px-4.5 py-2.5 rounded-lg transition"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="bg-green-600 text-white hover:bg-green-700 font-bold text-xs px-5 py-2.5 rounded-lg transition shadow-sm cursor-pointer"
              >
                Отправить на повторную модерацию
              </button>
            </div>
          </form>
        </div>
      )}      {/* Render based on activeTab: Profile vs Other Tabs */}
      {activeTab === "profile" ? null : (
        <div className="space-y-6 animate-fade-in w-full">
          
          {/* Top Horizontal Mini-Profile Banner (Option 2) */}
          <div className="bg-white rounded-3xl border border-neutral-200 p-5 text-left shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              
              {/* Left Group: Avatar & Info */}
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-emerald-600 text-white rounded-full flex items-center justify-center font-extrabold text-base shrink-0 uppercase shadow-xs">
                  {user.name.slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[9px] font-bold bg-neutral-100 text-neutral-600 uppercase mb-1">
                    Партнёр Столото
                  </span>
                  <h3 className="font-extrabold text-base text-[#000000] leading-tight" title={user.name}>{user.name}</h3>
                  <p className="text-xs text-neutral-500 font-medium truncate mt-0.5" title={user.contactName}>
                    Куратор: <strong className="text-neutral-700">{user.contactName || "Не указан"}</strong>
                  </p>
                </div>
              </div>

              {/* Middle Group: Contact Details & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-8 flex-1 max-w-2xl text-left border-t lg:border-t-0 lg:border-l border-neutral-105 pt-4 lg:pt-0 lg:pl-8">
                <div>
                  <span className="text-neutral-400 block text-[9px] uppercase font-bold tracking-wider mb-0.5 font-sans">Город проведения</span>
                  <p className="text-xs text-neutral-800 flex items-center gap-1.5 font-bold">
                    <MapPin className="h-3.5 w-3.5 text-[#D70066] shrink-0" />
                    <span>{user.city || "Москва"}</span>
                  </p>
                </div>

                <div>
                  <span className="text-neutral-400 block text-[9px] uppercase font-bold tracking-wider mb-0.5 font-sans">Телефон связи</span>
                  <p className="text-xs text-neutral-800 font-bold font-mono">
                    {user.phone || "—"}
                  </p>
                </div>

                <div>
                  <span className="text-neutral-400 block text-[9px] uppercase font-bold tracking-wider mb-0.5 font-sans">Электронная почта</span>
                  <p className="text-xs text-neutral-800 font-semibold truncate font-mono" title={user.email}>
                    {user.email || "—"}
                  </p>
                </div>
              </div>

              {/* Right Group: Action Button */}
              <div className="shrink-0 flex items-center border-t lg:border-t-0 border-neutral-100 pt-4 lg:pt-0">
                <button
                  id="fund-sidebar-lk-btn"
                  onClick={() => setActiveTab("profile")}
                  className="w-full lg:w-auto bg-[#FFE300] hover:bg-amber-400 text-black py-2.5 px-5 rounded-xl font-extrabold text-xs transition duration-200 ease-in-out transform hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-xs border border-amber-300 font-sans"
                >
                  <User className="h-3.5 w-3.5 shrink-0" />
                  <span>Личный кабинет и отчёты</span>
                </button>
              </div>

            </div>
          </div>

          {/* Main Full-Width Content Workspace */}
          <div className="space-y-6">
            
            {/* 2. Top Navigation Links */}
            {!isEditingProfile && (
              <div className="bg-white p-1 rounded-xl border border-neutral-200 flex flex-wrap max-w-lg shadow-sm font-sans">
                <button
                  onClick={() => setActiveTab("tasks")}
                  className={`flex-1 min-w-[100px] py-2 text-center text-xs font-bold rounded-lg transition cursor-pointer ${
                    activeTab === "tasks" ? "bg-[#FFE300] text-black shadow-sm font-black" : "text-neutral-500 hover:text-neutral-950"
                  }`}
                >
                  <List className="h-3.5 w-3.5 inline mr-1" />
                  Наши задания ({myTasks.length})
                </button>

                <button
                  onClick={() => {
                    if (!isApproved) {
                      alert("Только одобренные благотворительные фонды могут составлять задания!");
                      return;
                    }
                    setActiveTab("create");
                  }}
                  className={`flex-1 min-w-[100px] py-2 text-center text-xs font-bold rounded-lg transition cursor-pointer ${
                    !isApproved ? "opacity-35 cursor-not-allowed" : ""
                  } ${activeTab === "create" ? "bg-[#FFE300] text-black shadow-sm font-black" : "text-neutral-500 hover:text-neutral-950"}`}
                >
                  <PlusCircle className="h-3.5 w-3.5 inline mr-1" />
                  Добавить дело
                </button>

                <button
                  onClick={() => setActiveTab("candidates")}
                  className={`flex-1 min-w-[100px] py-2 text-center text-xs font-bold rounded-lg transition cursor-pointer ${
                    activeTab === "candidates" ? "bg-[#FFE300] text-black shadow-sm font-black" : "text-neutral-500 hover:text-neutral-950"
                  }`}
                >
                  <UserCheck className="h-3.5 w-3.5 inline mr-1" />
                  Заявки ({myApplications.length})
                </button>
              </div>
            )}

            {/* Tab content feedbacks */}
            {errorMsg && (
              <div className="bg-red-50 text-red-650 text-xs p-3.5 rounded-xl border border-red-150">
                <strong>Ошибка:</strong> {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="bg-green-50 text-green-750 text-xs p-3.5 rounded-xl border border-green-150">
                <strong>Выполнено:</strong> {successMsg}
              </div>
            )}

            {/* ======================================= */}
            {/* TAB: CREATED TASKS */}
            {/* ======================================= */}
            {activeTab === "tasks" && !isEditingProfile && (
              <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
                <h3 className="font-extrabold text-[#000000] text-base mb-4">Предложенные проекты фонда</h3>

                {myTasks.length === 0 ? (
                  <div className="py-8 text-center text-neutral-400 text-xs">
                    Вы еще не создали ни одной волонтёрской задачи. Нажмите «Добавить дело» выше!
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left" id="fund-tasks-table">
                      <thead>
                        <tr className="bg-neutral-50 hover:bg-neutral-100 text-neutral-500 font-bold border-b border-neutral-200">
                          <th className="p-3">Занятие / Копия</th>
                          <th className="p-3">Категория</th>
                          <th className="p-3">Формат</th>
                          <th className="p-3">Мест</th>
                          <th className="p-3">Предполаг. ч</th>
                          <th className="p-3">Статус набора</th>
                          <th className="p-3">Управление</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {myTasks.map((t) => (
                          <tr key={t.id} className="hover:bg-neutral-50/70 transition">
                            <td className="p-3 pr-4 font-bold">
                              <p className="text-neutral-900 leading-tight">{t.title}</p>
                              <div className="flex flex-col gap-0.5 mt-1 font-mono text-[9px]">
                                <span className="text-amber-800 block">📥 Набор до: {t.deadline}</span>
                                <span className="text-emerald-800 block">📅 Выполнение: {t.eventDate || t.deadline}</span>
                              </div>
                            </td>
                            <td className="p-3">
                              <span className={getCategoryBadgeClass(t.category)}>
                                {t.category}
                              </span>
                            </td>
                            <td className="p-3 uppercase font-mono text-[10px]">
                              {t.format === "online" ? "💻 Онлайн" : `📍 Офлайн (${t.city})`}
                            </td>
                            <td className="p-3 font-semibold font-mono text-[11px] text-neutral-850">
                              {t.maxParticipants - t.joinedParticipants} из {t.maxParticipants} (свободно)
                            </td>
                            <td className="p-3 font-mono font-bold text-neutral-950 text-xs">
                              {t.hoursEstimation} ч.
                            </td>
                            <td className="p-3">
                              {t.status === "draft" && (
                                <span className="bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded uppercase font-bold text-[9px]">
                                  Черновик
                                </span>
                              )}
                              {t.status === "pending_moderation" && (
                                <span className="bg-orange-50 text-orange-600 border border-orange-200 px-1.5 py-0.5 rounded uppercase font-bold text-[9px]">
                                  Модерация Столото
                                </span>
                              )}
                              {t.status === "published" && (
                                <span className="bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded uppercase font-bold text-[9px] animate-pulse">
                                  Опубликован в ленте
                                </span>
                              )}
                              {t.status === "rejected" && (
                                <span className="bg-neutral-900 text-white border border-neutral-805 px-1.5 py-0.5 rounded uppercase font-bold text-[9px]">
                                  Отклонен кураторами
                                </span>
                              )}
                              {t.status === "completed" && (
                                <span className="bg-neutral-154 text-neutral-600 px-2 py-0.5 rounded uppercase font-bold text-[9px]">
                                  Выполнен
                                </span>
                              )}
                            </td>
                            <td className="p-3 flex items-center gap-1.5">
                              {t.status === "published" && (
                                <button
                                  onClick={() => handleCloseTask(t.id)}
                                  className="bg-neutral-900 hover:bg-black text-white text-[10px] uppercase font-black px-2 py-1.5 rounded shadow-sm transition cursor-pointer"
                                >
                                  Завершить и закрыть
                                </button>
                              )}
                              {t.status === "draft" && (
                                <button
                                  onClick={async () => {
                                    await api.updateTaskStatus(t.id, TaskStatus.PENDING_MODERATION);
                                    onRefreshAll();
                                  }}
                                  className="bg-[#FFE300] text-black text-[10px] font-bold px-2.5 py-1.5 rounded hover:bg-[#E5C500] transition cursor-pointer"
                                >
                                  На модерацию
                                </button>
                              )}
                              {t.status === "rejected" && t.moderatorComment && (
                                <span className="text-[10px] text-neutral-405 italic block max-w-xs" title={t.moderatorComment}>
                                  Комм: {t.moderatorComment}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}


            {/* ======================================= */}
            {/* TAB: CREATE TASK FORM */}
            {/* ======================================= */}
            {activeTab === "create" && isApproved && !isEditingProfile && (
              <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
                <h3 className="font-extrabold text-base mb-4 flex items-center gap-2 text-[#000000] font-sans">
                  <Sparkles className="h-5 w-5 text-[#FFE300]" />
                  <span>Новое волонтёрское задание компании Столото</span>
                </h3>

                <form onSubmit={(e) => handleCreateTask(e, false)} className="space-y-6 w-full text-left">
                  {/* РАЗДЕЛ 1: Основные параметры задания */}
                  <div className="bg-neutral-50/55 p-5 rounded-2xl border border-neutral-200 space-y-4 font-sans text-left">
                    <h4 className="text-xs font-black uppercase tracking-wider text-neutral-850 flex items-center gap-1.5 border-b border-neutral-200 pb-2">
                      <Sparkles className="h-4 w-4 text-[#D70066]" />
                      <span>1. Основные параметры и описание задания</span>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 mb-1">
                          Название задания *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Зимняя чистка парка Лосиный Остров"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          className="w-full text-xs md:text-sm bg-white px-3 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:border-[#FFE300]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-700 mb-1">
                          Направление (Категория)
                        </label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full text-xs md:text-sm bg-white p-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:border-[#FFE300]"
                        >
                          <option>Дети</option>
                          <option>Пожилые</option>
                          <option>ОВЗ</option>
                          <option>Экология</option>
                          <option>Животные</option>
                          <option>Донорство</option>
                          <option>Pro-bono</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1">
                        Подробное описание задачи для сотрудников *
                      </label>
                      <textarea
                        required
                        rows={4}
                        placeholder="Опишите детальный характер помощи. Чем предстоит заниматься, во сколько сбор, что взять с собой..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full text-xs bg-white px-3 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:border-[#FFE300] leading-relaxed"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 mb-1">
                          Формат участия
                        </label>
                        <select
                          value={format}
                          onChange={(e) => setFormat(e.target.value as any)}
                          className="w-full text-xs bg-white p-2.5 rounded-lg border border-neutral-300 focus:outline-[#FFE300]"
                        >
                          <option value="online">💻 Онлайн / Удалённо</option>
                          <option value="offline">📍 Офлайн на месте</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-700 mb-1">
                          Конкретная локация / адрес сбора
                        </label>
                        <input
                          type="text"
                          placeholder="Москва, парк Измайловский..."
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className="w-full text-xs bg-white p-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:border-[#FFE300]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-700 mb-1">
                          Дедлайн набора участников *
                        </label>
                        <input
                          type="date"
                          required
                          value={deadline}
                          onChange={(e) => setDeadline(e.target.value)}
                          className="w-full text-xs bg-white p-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:border-[#FFE300]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-700 mb-1">
                          Дата проведения / выполнения *
                        </label>
                        <input
                          type="date"
                          required
                          value={eventDate}
                          onChange={(e) => setEventDate(e.target.value)}
                          className="w-full text-xs bg-white p-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:border-[#FFE300]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans">
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 mb-1">
                          Количество нужных волонтёров *
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={250}
                          required
                          value={maxParticipants}
                          onChange={(e) => setMaxParticipants(Number(e.target.value))}
                          className="w-full text-xs bg-white p-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:border-[#FFE300]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-700 mb-1">
                          Волонтерские часы (оценка на человека) *
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={24}
                          required
                          value={hoursEstimation}
                          onChange={(e) => setHoursEstimation(Number(e.target.value))}
                          className="w-full text-xs bg-white p-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:border-[#FFE300]"
                        />
                        <p className="text-[9.5px] text-neutral-400 mt-1">Ориентир для последующего начисления.</p>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-700 mb-1">
                          Ссылка на инструкции / методичку (опционально)
                        </label>
                        <input
                          type="url"
                          placeholder="https://drive.google.com/file/instructions"
                          value={materials}
                          onChange={(e) => setMaterials(e.target.value)}
                          className="w-full text-xs bg-white p-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:border-[#FFE300]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* РАЗДЕЛ 2: Добавление картинок к заданию */}
                  <div className="bg-neutral-55/40 p-5 rounded-2xl border border-neutral-200 space-y-4 font-sans text-left">
                    <h4 className="text-xs font-black uppercase tracking-wider text-neutral-850 flex items-center gap-1.5 border-b border-neutral-200 pb-2">
                      <Image className="h-4 w-4 text-[#D70066]" />
                      <span>2. Оформление задания (Добавление картинок)</span>
                    </h4>
                    
                    <p className="text-[11px] text-neutral-500 leading-normal">
                      Загрузите собственную картинку к проекту или выберите один из наших готовых тематических пресетов Столото. Красивое изображение повышает отклики сотрудников в несколько раз.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
                      {/* Drag & Drop Zone */}
                      <div className="md:col-span-7 flex flex-col justify-between space-y-3">
                        <div
                          onDragOver={handleDragOver}
                          onDrop={handleDrop}
                          className="border-2 border-dashed border-neutral-300 hover:border-[#FFE300] bg-neutral-50/70 p-5 rounded-xl text-center transition cursor-pointer flex flex-col items-center justify-center min-h-[110px]"
                          onClick={() => document.getElementById("task-img-upload")?.click()}
                        >
                          <Upload className="h-6 w-6 text-neutral-400 mb-1.5" />
                          <span className="text-xs font-bold text-neutral-700 block">Перетащите сюда картинку или нажмите для выбора</span>
                          <span className="text-[10px] text-neutral-400 block mt-0.5">PNG, JPG, или WEBP (макс. 2МБ)</span>
                          <input
                            id="task-img-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                          />
                        </div>

                        <div>
                          <label className="block text-[10.5px] font-bold text-neutral-700 mb-1">
                            Или укажите прямую ссылку на изображение в сети:
                          </label>
                          <input
                            type="url"
                            placeholder="https://example.com/image.jpg"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            className="w-full text-xs bg-white p-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:border-[#FFE300]"
                          />
                        </div>
                      </div>

                      {/* Display Image / Preview Box */}
                      <div className="md:col-span-5 flex flex-col justify-center items-center bg-neutral-100/50 border border-neutral-200 p-4 rounded-xl min-h-[150px] relative">
                        {imageUrl ? (
                          <div className="w-full h-full flex flex-col justify-between items-center space-y-3">
                            <div className="w-full h-28 relative rounded-lg overflow-hidden border border-neutral-300 shadow-xs">
                              <img
                                src={imageUrl}
                                alt="Превью"
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => setImageUrl("")}
                              className="text-[10px] font-bold text-rose-600 hover:text-rose-850 flex items-center gap-1 hover:underline cursor-pointer"
                            >
                              <X className="h-3 w-3" /> Удалить изображение
                            </button>
                          </div>
                        ) : (
                          <div className="text-center p-3">
                            <span className="text-2xl block mb-1">🖼️</span>
                            <span className="text-xs text-neutral-400 font-bold block">Превью отсутствует</span>
                            <span className="text-[9.5px] text-neutral-400 block leading-tight mt-1">
                              Будет использовано стандартное изображение по умолчанию
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pre-made presets gallery */}
                    <div className="space-y-1.5 pt-1">
                      <span className="block text-[10.5px] font-extrabold text-neutral-600">Готовые тематические пресеты Столото:</span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                        {IMAGE_PRESETS.map((p) => {
                          const isSelected = imageUrl === p.url;
                          return (
                            <button
                              key={p.name}
                              type="button"
                              onClick={() => setImageUrl(p.url)}
                              className={`flex items-center gap-1.5 p-2 rounded-xl text-left border text-[11px] font-bold transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-[#FFE300]/25 text-neutral-950 border-[#FFE300] ring-1 ring-[#FFE300]"
                                  : "bg-white hover:bg-neutral-50 text-neutral-700 border-neutral-200"
                              }`}
                            >
                              <span className="text-sm">{p.emoji}</span>
                              <span className="truncate">{p.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* РАЗДЕЛ 3: Сведения об ответственном за мероприятие */}
                  <div className="bg-neutral-50/55 p-5 rounded-2xl border border-neutral-200 space-y-4 font-sans text-left">
                    <h4 className="text-xs font-black uppercase tracking-wider text-neutral-850 flex items-center gap-1.5 border-b border-neutral-200 pb-2">
                      <UserCheck className="h-4 w-4 text-[#D70066]" />
                      <span>3. Сведения об ответственном за мероприятие (координаторе)</span>
                    </h4>
                    
                    <p className="text-[11px] text-neutral-500 leading-normal">
                      Укажите ФИО и прямые контактные данные ответственного сотрудника от фонда, к которому волонтёры компании Столото смогут обратиться по возникающим организационным вопросам.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 mb-1">
                          ФИО координатора мероприятия *
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
                            <User className="h-3.5 w-3.5" />
                          </span>
                          <input
                            type="text"
                            required
                            placeholder="Иванов Александр Сергеевич"
                            value={organizerName}
                            onChange={(e) => setOrganizerName(e.target.value)}
                            className="w-full text-xs bg-white pl-9 p-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:border-[#FFE300]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-700 mb-1">
                          Телефон для оперативной связи *
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
                            <Phone className="h-3.5 w-3.5" />
                          </span>
                          <input
                            type="tel"
                            required
                            placeholder="+7 (999) 000-00-00"
                            value={organizerPhone}
                            onChange={(e) => setOrganizerPhone(e.target.value)}
                            className="w-full text-xs bg-white pl-9 p-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:border-[#FFE300]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-700 mb-1">
                          Электронная почта для связи *
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
                            <Mail className="h-3.5 w-3.5" />
                          </span>
                          <input
                            type="email"
                            required
                            placeholder="coordinator@naturefond.ru"
                            value={organizerEmail}
                            onChange={(e) => setOrganizerEmail(e.target.value)}
                            className="w-full text-xs bg-white pl-9 p-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:border-[#FFE300]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* РАЗДЕЛ 4: Требования и критерии отбора */}
                  <div className="bg-neutral-50/55 p-5 rounded-2xl border border-neutral-200 space-y-4 font-sans text-left">
                    <h4 className="text-xs font-black uppercase tracking-wider text-neutral-850 flex items-center gap-1.5 border-b border-neutral-200 pb-2">
                      <ShieldAlert className="h-4 w-4 text-[#D70066]" />
                      <span>4. Требования и критерии отбора участников</span>
                    </h4>

                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-neutral-700 mb-1">
                        Выбор критериев требований к кандидату (выберите нужные)
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {CANDIDATE_REQUIREMENTS_PRESETS.map((preset) => {
                          const isSelected = selectedReqs.includes(preset);
                          return (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedReqs(selectedReqs.filter(r => r !== preset));
                                } else {
                                  setSelectedReqs([...selectedReqs, preset]);
                                }
                              }}
                              className={`text-xs px-3 py-1.5 rounded-full border transition cursor-pointer font-medium ${
                                isSelected
                                  ? "bg-[#FFE300] text-black border-[#FFE300] font-bold shadow-sm"
                                  : "bg-white hover:bg-neutral-50 text-neutral-700 border-neutral-200"
                              }`}
                            >
                              {isSelected ? "✓ " : "+ "} {preset}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1">
                        Дополнительные специфические требования к волонтёру (опционально)
                      </label>
                      <input
                        type="text"
                        placeholder="Например: медицинское образование, знание английского..."
                        value={requirements}
                        onChange={(e) => setRequirements(e.target.value)}
                        className="w-full text-xs bg-white p-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:border-[#FFE300]"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end pt-2">
                    <button
                      type="button"
                      onClick={(e) => handleCreateTask(e, true)}
                      className="bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer"
                    >
                      Сохранить в черновики
                    </button>
                    <button
                      type="submit"
                      className="bg-[#FFE300] text-black hover:bg-[#E5C500] text-xs font-black px-5 py-2.5 rounded-xl shadow transition cursor-pointer font-sans"
                    >
                      Отправить в Столото на публикацию
                    </button>
                  </div>
                </form>
              </div>
            )}


            {/* ======================================= */}
            {/* TAB: CANDIDATES APPLICATIONS MODERATION */}
            {/* ======================================= */}
            {activeTab === "candidates" && !isEditingProfile && (
              <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
                <h3 className="font-extrabold text-base mb-1 text-[#000000]">Отклики лидеров Столото на проекты вашего фонда</h3>
                <p className="text-xs text-neutral-500 mb-5 leading-relaxed">
                  Просмотрите анкеты подавших заявки сотрудников. Одобрите их участие в проекте, а по завершении акции — введите рапорт о часах и нажмите <strong>«Подтвердить успешное прохождение»</strong> для отправки администраторам Столото.
                </p>

                {myApplications.length === 0 ? (
                  <div className="py-8 text-center text-neutral-400 text-xs">
                    Заявок от волонтёров пока нет. Опубликуйте задания и ожидайте оповещений в корпоративной сети Столото!
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left" id="fund-applicants-table">
                      <thead>
                        <tr className="bg-neutral-50 hover:bg-neutral-100 text-neutral-500 font-bold border-b border-neutral-100">
                          <th className="p-3">Проект / Отклик</th>
                          <th className="p-3">ФИО Волонтёра</th>
                          <th className="p-3">Должность / Департамент</th>
                          <th className="p-3">Статус отклика</th>
                          <th className="p-3 text-right">Управление кандидатом</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {myApplications.map((app) => (
                          <tr key={app.id} className="align-top hover:bg-neutral-50 transition">
                            <td className="p-3">
                              <strong className="text-neutral-900 font-bold block">«{app.taskTitle}»</strong>
                              <span className="text-[10px] text-neutral-400 block font-mono">
                                от {new Date(app.createdAt).toLocaleDateString("ru-RU")}
                              </span>
                            </td>
                            <td className="p-3 pr-4 font-bold text-neutral-950">
                              {app.volunteerName}
                            </td>
                            <td className="p-3 leading-tight">
                              <p>{app.volunteerPosition}</p>
                              <p className="text-[10px] text-neutral-450 mt-0.5">{app.volunteerDepartment} ({app.volunteerCity})</p>
                            </td>
                            <td className="p-3 text-[10px] uppercase font-bold">
                              {app.status === "pending" && <span className="text-orange-700 bg-orange-50 px-2.5 py-1 rounded">Рассматривается</span>}
                              {app.status === "accepted" && <span className="text-green-700 bg-green-50 px-2.5 py-1 rounded">Участвует</span>}
                              {app.status === "rejected" && <span className="text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded">Отказано</span>}
                              {app.status === "completed" && <span className="text-green-800 bg-green-50 px-2.5 py-1 rounded font-bold">Выполнено</span>}
                            </td>
                            <td className="p-3 text-right space-y-2">
                              {app.status === "pending" && (
                                <div className="flex gap-1 justify-end">
                                  <button
                                    id={`accept-applicant-btn-${app.id}`}
                                    onClick={() => handleApplicantStatus(app.id, ApplicationStatus.ACCEPTED)}
                                    className="bg-[#FFE300] text-black font-bold text-[10.5px] px-3 py-1.5 rounded-lg hover:bg-[#E5C500] transition cursor-pointer"
                                  >
                                    Одобрить кандидата
                                  </button>
                                  <button
                                    id={`reject-applicant-btn-${app.id}`}
                                    onClick={() => handleApplicantStatus(app.id, ApplicationStatus.REJECTED)}
                                    className="bg-neutral-900 text-white font-bold text-[10.5px] px-3 py-1.5 rounded-lg hover:bg-neutral-800 transition cursor-pointer"
                                  >
                                    Отклонить
                                  </button>
                                </div>
                              )}

                              {app.status === "accepted" && (
                                <div className="space-y-2">
                                  <textarea
                                    rows={2}
                                    required
                                    placeholder="Краткий отзыв о вкладе (для зачёта ESG часов)..."
                                    value={activeAppIdComment === app.id ? fundComment : ""}
                                    onChange={(e) => {
                                      setActiveAppIdComment(app.id);
                                      setFundComment(e.target.value);
                                    }}
                                    className="w-full text-[10px] p-2 rounded border bg-neutral-50 focus:outline-none focus:bg-white resize-none"
                                  />
                                  
                                  <button
                                    id={`complete-applicant-btn-${app.id}`}
                                    onClick={() => handleApplicantStatus(app.id, ApplicationStatus.COMPLETED)}
                                    className="bg-green-600 text-white font-bold text-[10px] px-3 py-1.5 rounded hover:bg-green-700 transition cursor-pointer"
                                  >
                                    ✓ Подтвердить успешность прохождения
                                  </button>
                                </div>
                              )}

                              {app.status === "completed" && (
                                <span className="text-[10.5px] text-neutral-400 italic block leading-normal">
                                  {app.fundComment ? `Вклад зачтён: «${app.fundComment}»` : "Вклад успешно подтверждён фондом"}
                                </span>
                              )}

                              {app.status === "rejected" && (
                                <span className="text-[10px] text-neutral-400 italic">
                                  Заявка отклонена
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}


      {/* ======================================= */}
      {/* TAB: FUND'S PERSONAL CABINET & REPORTS */}
      {/* ======================================= */}
      {activeTab === "profile" && (
        <div className="space-y-6 text-left animate-fade-in w-full">
          
          {/* Top Header Card */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs text-left font-sans">
            <div>
              <h2 className="text-xl font-extrabold text-neutral-950 flex items-center gap-2">
                <Building className="h-6 w-6 text-emerald-600" />
                <span>Личный кабинет благотворительного фонда</span>
              </h2>
              <p className="text-xs text-neutral-500 mt-1 font-medium">
                Просмотр и редактирование реквизитов организации, отчетность по часам и скачивание официальных выгрузок.
              </p>
            </div>
            <button
              onClick={() => setActiveTab("tasks")}
              className="inline-flex items-center gap-1.5 bg-[#FFE300] hover:bg-amber-400 text-black font-extrabold text-xs px-4.5 py-3 rounded-2xl transition-all shadow-sm cursor-pointer hover:scale-[1.03] active:scale-95 shrink-0"
            >
              <List className="h-4 w-4" />
              <span>Вернуться к заданиям</span>
            </button>
          </div>

          {/* Top Row: Information & Reports Side-by-Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Fund Profile Card & Edit Form */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center pb-4 border-b border-neutral-100 mb-4">
                  <h3 className="font-extrabold text-base text-neutral-900 flex items-center gap-2">
                    <Building className="h-5 w-5 text-[#D70066]" />
                    <span>Общая информация о фонде</span>
                  </h3>
                  {!isEditingProfile && (
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="text-xs bg-neutral-100 hover:bg-[#FFE300] hover:text-black hover:font-bold text-neutral-700 px-3 py-1.5 rounded-lg transition font-bold cursor-pointer"
                    >
                      ✏️ ИСПРАВИТЬ
                    </button>
                  )}
                </div>

                {!isEditingProfile ? (
                  <div className="space-y-4 text-xs text-neutral-800">
                    <div>
                      <span className="text-neutral-400 block text-[9px] uppercase font-bold tracking-wider">Название фонда</span>
                      <strong className="text-sm font-black text-neutral-950">{user.name}</strong>
                    </div>

                    <div>
                      <span className="text-neutral-400 block text-[9px] uppercase font-bold tracking-wider">Описание миссии</span>
                      <p className="text-neutral-600 leading-normal font-sans">{user.description || "Описание не добавлено."}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-neutral-400 block text-[9px] uppercase font-bold tracking-wider">Город проведения</span>
                        <strong className="font-semibold text-neutral-900">{user.city || "Любой"}</strong>
                      </div>
                      <div>
                        <span className="text-neutral-400 block text-[9px] uppercase font-bold tracking-wider">Официальный сайт</span>
                        {user.website ? (
                          <a href={user.website} target="_blank" rel="noreferrer" className="text-neutral-900 hover:underline font-bold">
                            {user.website}
                          </a>
                        ) : (
                          <span className="text-neutral-400">Не указан</span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-neutral-400 block text-[9px] uppercase font-bold tracking-wider">ИНН партнёра</span>
                        <strong className="font-mono text-neutral-900">{user.inn || "Не указан"}</strong>
                      </div>
                      <div>
                        <span className="text-neutral-400 block text-[9px] uppercase font-bold tracking-wider">ОГРН партнёра</span>
                        <strong className="font-mono text-neutral-900">{user.ogrn || "Не указан"}</strong>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-neutral-400 block text-[9px] uppercase font-bold tracking-wider">Контактное лицо</span>
                        <strong className="font-semibold text-neutral-900">{user.contactName || "Не указано"}</strong>
                      </div>
                      <div>
                        <span className="text-neutral-400 block text-[9px] uppercase font-bold tracking-wider">Должность куратора</span>
                        <strong className="font-semibold text-neutral-900">{user.contactPosition || "Не указана"}</strong>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-neutral-400 block text-[9px] uppercase font-bold tracking-wider">Телефон для связи</span>
                        <strong className="font-mono text-neutral-900">{user.phone || "Не указан"}</strong>
                      </div>
                      <div>
                        <span className="text-neutral-400 block text-[9px] uppercase font-bold tracking-wider">Лицензия Столото</span>
                        <span className="font-semibold text-emerald-800">📄 {user.documentName || "Документ не прикреплен"}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                      <span className="text-[10px] text-neutral-400 uppercase font-black">Статус верификации:</span>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide inline-block ${
                        user.fundStatus === "approved" 
                          ? "bg-green-100/50 text-green-700 border-green-200" 
                          : user.fundStatus === "rejected" 
                          ? "bg-red-100/50 text-red-750 border-red-200" 
                          : "bg-yellow-105 text-neutral-800 border-yellow-200"
                      }`}>
                        {user.fundStatus === "approved" ? "Одобрен юристами" : user.fundStatus === "rejected" ? "Не одобрен" : "На проверке"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={user.fundStatus === "rejected" ? handleResubmitProfile : handleSaveFundProfile} className="space-y-3 text-xs">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-neutral-600">Название фонда *</label>
                      <input
                        type="text"
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full text-xs bg-neutral-50 p-2 rounded-lg border border-neutral-200 focus:outline-none focus:border-[#FFE300]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-neutral-600">Описание миссии *</label>
                      <textarea
                        required
                        rows={3}
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="w-full text-xs bg-neutral-50 p-2 rounded-lg border border-neutral-200 focus:outline-none focus:border-[#FFE300]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-neutral-600">Город фонда *</label>
                        <input
                          type="text"
                          required
                          value={editCity}
                          onChange={(e) => setEditCity(e.target.value)}
                          className="w-full text-xs bg-neutral-50 p-2 rounded-lg border border-neutral-200 focus:outline-none focus:border-[#FFE300]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-neutral-600">Сайт</label>
                        <input
                          type="text"
                          value={editWebsite}
                          onChange={(e) => setEditWebsite(e.target.value)}
                          placeholder="https://myfund.ru"
                          className="w-full text-xs bg-neutral-50 p-2 rounded-lg border border-neutral-200 focus:outline-none focus:border-[#FFE300]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-neutral-600">Телефон связи</label>
                        <input
                          type="text"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          placeholder="+7 (999) 000-0000"
                          className="w-full text-xs bg-neutral-50 p-2 rounded-lg border border-neutral-200 focus:outline-none focus:border-[#FFE300]"
                        />
                      </div>
                      
                      {user.fundStatus === "rejected" && (
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-neutral-600">ИНН партнёра *</label>
                          <input
                            type="text"
                            required
                            value={editInn}
                            onChange={(e) => setEditInn(e.target.value)}
                            className="w-full text-xs bg-neutral-50 p-2 rounded-lg border border-neutral-200 focus:outline-none focus:border-[#FFE300]"
                          />
                        </div>
                      )}
                    </div>

                    {user.fundStatus === "rejected" && (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-neutral-600">ОГРН партнёра *</label>
                          <input
                            type="text"
                            required
                            value={editOgrn}
                            onChange={(e) => setEditOgrn(e.target.value)}
                            className="w-full text-xs bg-neutral-50 p-2 rounded-lg border border-neutral-200 focus:outline-none focus:border-[#FFE300]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-neutral-600">Лицензия Столото (PDF/Изображение) *</label>
                          <input
                            id="fund-license-input"
                            type="file"
                            accept=".pdf,image/*"
                            onChange={handleEditFileChange}
                            className="w-full text-[10px] bg-neutral-50 p-1.5 rounded-lg border border-neutral-200"
                          />
                        </div>
                      </div>
                    )}

                    <div className="pt-3 flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(false)}
                        className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-3.5 py-1.5 rounded-lg transition font-bold"
                      >
                        Отмена
                      </button>
                      <button
                        type="submit"
                        className="bg-[#FFE300] hover:bg-[#E5C500] text-black px-4 py-1.5 rounded-lg transition font-black"
                      >
                        {user.fundStatus === "rejected" ? "Отправить на проверку" : "Сохранить изменения"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Fund Local Reports Section */}
            <div className="space-y-6 flex flex-col justify-between">
              
              <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm space-y-4">
                <h3 className="font-extrabold text-base text-neutral-900 pb-3 border-b border-neutral-100 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-emerald-600" />
                  <span>Отчёты и показатели фонда</span>
                </h3>

                <div className="grid grid-cols-3 gap-3 pt-1">
                  <div className="bg-[#FFE300]/10 p-3 rounded-xl border border-[#FFE300]/25 text-center">
                    <span className="text-[9px] text-neutral-400 uppercase font-black block">Создано заданий</span>
                    <p className="text-xl font-black text-neutral-900 mt-0.5">{myTasks.length}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-xl border border-green-150 text-center">
                    <span className="text-[9px] text-neutral-400 uppercase font-black block">Решено</span>
                    <p className="text-xl font-black text-green-700 mt-0.5">{totalClosedCount}</p>
                  </div>
                  <div className="bg-neutral-100 p-3 rounded-xl border border-neutral-250 text-center">
                    <span className="text-[9px] text-[#00A8CC] uppercase font-black block">Привлечено лидеров</span>
                    <p className="text-xl font-black text-neutral-950 mt-0.5">{totalAcceptedVolunteersCount}</p>
                  </div>
                </div>

                <div className="bg-neutral-50/70 rounded-xl p-4 border border-neutral-200 space-y-3">
                  <h4 className="font-extrabold text-xs text-neutral-900 uppercase tracking-wide">Бланк верифицированных часов фонда</h4>
                  <p className="text-xs text-neutral-600 leading-normal">
                    По правилам корпоративной ESG-программы холдинга Столото, благотворительный фонд-партнёр запрашивает и загружает верифицированные выписки об отработанных часах активистов. Вы можете сгенерировать данный отчет в реальном времени.
                  </p>
                  
                  <div className="pt-2">
                    <a
                      href={`/api/reports/fund?fundId=${user.id}`}
                      id="download-fund-report-btn"
                      className="inline-flex items-center gap-2 bg-neutral-900 text-white hover:bg-black font-extrabold py-2.5 px-4 rounded-xl text-[10px] uppercase shadow-xs transition-all cursor-pointer font-sans"
                    >
                      <Download className="h-4 w-4 text-[#FFE300]" />
                      <span>Скачать выписку часов (.CSV)</span>
                    </a>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* Beautiful High Contrast Custom React Confirmation Modal */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-[999] bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl p-6 max-w-sm w-full space-y-4 text-left">
            <h4 className="font-extrabold text-sm text-neutral-900 uppercase tracking-wider font-sans">
              {confirmModal.title}
            </h4>
            <p className="text-xs text-neutral-600 leading-relaxed font-sans">
              {confirmModal.message}
            </p>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setConfirmModal(null)}
                className="bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
              >
                {confirmModal.cancelText || "Отмена"}
              </button>
              <button
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(null);
                }}
                className="bg-[#FFE300] hover:bg-amber-400 text-black font-extrabold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
              >
                {confirmModal.confirmText || "Подтвердить"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
