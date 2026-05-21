/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { api } from "../api.js";
import { UserProfile, VolunteerTask, TaskApplication, FundStatus, TaskStatus, ApplicationStatus } from "../types.js";
import { ShieldCheck, CheckCircle2, XCircle, FileSpreadsheet, Hourglass, Award, Download, Check, Sparkles, AlertTriangle } from "lucide-react";

interface AdminCabinetProps {
  user: UserProfile;
  tasks: VolunteerTask[];
  applications: TaskApplication[];
  onRefreshAll: () => void;
}

export default function AdminCabinet({ user, tasks, applications, onRefreshAll }: AdminCabinetProps) {
  const [activeTab, setActiveTab] = useState<"funds" | "tasks" | "hours" | "analytics">("funds");
  
  // Moderate funds states
  const [funds, setFunds] = useState<UserProfile[]>([]);
  const [fundComment, setFundComment] = useState("");
  const [activeFundCommentId, setActiveFundCommentId] = useState<string | null>(null);

  // Moderate tasks states
  const [taskComment, setTaskComment] = useState("");
  const [activeTaskCommentId, setActiveTaskCommentId] = useState<string | null>(null);

  // Hour tracking manual value overrides
  const [manualHours, setManualHours] = useState<Record<string, number>>({});

  // Analytics states
  const [analytics, setAnalytics] = useState<any>(null);

  // Profile and task detail modals representing all submitted data
  const [selectedFundForDetail, setSelectedFundForDetail] = useState<UserProfile | null>(null);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<VolunteerTask | null>(null);
  const [selectedAppForDetail, setSelectedAppForDetail] = useState<TaskApplication | null>(null);

  // Custom confirmation dialog state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    confirmColor?: "green" | "red";
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    loadFunds();
    loadAnalytics();
  }, [tasks, applications]);

  const loadFunds = async () => {
    try {
      const data = await api.getFunds();
      setFunds(data.funds);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAnalytics = async () => {
    try {
      const data = await api.getAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFundStatus = async (fundId: string, status: FundStatus) => {
    const actionText = status === FundStatus.APPROVED ? "одобрить" : "отклонить";
    const fName = funds.find(f => f.id === fundId)?.name || "";
    
    setConfirmModal({
      isOpen: true,
      title: "Подтверждение модерации фонда",
      message: `Вы действительно хотите ${actionText} заявку на регистрацию фонда «${fName}»?`,
      confirmText: status === FundStatus.APPROVED ? "Подтвердить" : "Отклонить",
      confirmColor: status === FundStatus.APPROVED ? "green" : "red",
      onConfirm: async () => {
        try {
          const comment = activeFundCommentId === fundId ? fundComment : "";
          await api.updateFundStatus(fundId, status, comment);
          setFundComment("");
          setActiveFundCommentId(null);
          loadFunds();
          onRefreshAll();
        } catch (err: any) {
          alert(err.message);
        }
      }
    });
  };

  const handleTaskStatus = async (taskId: string, status: TaskStatus) => {
    const actionText = status === TaskStatus.PUBLISHED ? "одобрить и опубликовать" : "отклонить";
    const tTitle = tasks.find(t => t.id === taskId)?.title || "";
    
    setConfirmModal({
      isOpen: true,
      title: "Подтверждение модерации задания",
      message: `Вы действительно хотите ${actionText} волонтёрское задание «${tTitle}»?`,
      confirmText: status === TaskStatus.PUBLISHED ? "Подтвердить" : "Отклонить",
      confirmColor: status === TaskStatus.PUBLISHED ? "green" : "red",
      onConfirm: async () => {
        try {
          const comment = activeTaskCommentId === taskId ? taskComment : "";
          await api.updateTaskStatus(taskId, status, comment);
          setTaskComment("");
          setActiveTaskCommentId(null);
          onRefreshAll();
        } catch (err: any) {
          alert(err.message);
        }
      }
    });
  };

  const handleAwardHours = async (appId: string, estimatedHours: number) => {
    try {
      const hoursToAward = manualHours[appId] || estimatedHours;
      await api.awardHours(appId, hoursToAward);
      onRefreshAll();
      loadAnalytics();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
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

  // Applications that are ready for manual hours accrual
  const pendingHourApps = applications.filter((app) => {
    const task = tasks.find(t => t.id === app.taskId);
    return app.status === "completed" && !app.hoursAwarded;
  });

  // Pre-moderation tasks
  const pendingTasks = tasks.filter(t => t.status === "pending_moderation");
  // Pending funds
  const pendingFunds = funds.filter(f => f.fundStatus === "pending");

  return (
    <div id="admin-cabinet-root" className="space-y-6 text-left">
      
      {/* 1. Header Admin Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-neutral-200 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[9.5px] text-neutral-450 uppercase font-bold block">Фонды на модерации</span>
            <span className="text-xl font-black text-neutral-900">{pendingFunds.length}</span>
          </div>
          <Hourglass className="h-5 w-5 text-neutral-900" />
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[9.5px] text-neutral-450 uppercase font-bold block">Задания на модерации</span>
            <span className="text-xl font-black text-neutral-950">{pendingTasks.length}</span>
          </div>
          <Sparkles className="h-5 w-5 text-[#D70066] animate-pulse" />
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[9.5px] text-neutral-450 uppercase font-bold block">Ожидают начисления</span>
            <span className="text-xl font-black text-neutral-950">{pendingHourApps.length}</span>
          </div>
          <Award className="h-5 w-5 text-neutral-900" />
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[9.5px] text-neutral-450 uppercase font-bold block">Просмотрено KPI часов</span>
            <span className="text-xl font-black text-green-700">
              {analytics ? analytics.metrics.totalHoursDistributed : "..."} ч.
            </span>
          </div>
          <ShieldCheck className="h-5 w-5 text-green-700" />
        </div>
      </div>

      {/* 2. Admin Workspace Tabs Selector */}
      <div className="bg-white p-1 rounded-xl border border-neutral-200 flex flex-wrap max-w-2xl font-sans">
        <button
          onClick={() => setActiveTab("funds")}
          className={`flex-1 min-w-[120px] py-2 text-center text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === "funds" 
              ? "bg-[#FFE300] text-black shadow-sm" 
              : "text-neutral-500 hover:text-neutral-900"
          }`}
        >
          <span>Модерация фондов</span>
          {pendingFunds.length > 0 && (
            <span className={`text-[10px] h-4.5 w-4.5 rounded-full flex items-center justify-center font-bold ${activeTab === "funds" ? "bg-black text-[#FFE300]" : "bg-neutral-100 text-neutral-900"}`}>
              {pendingFunds.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("tasks")}
          className={`flex-1 min-w-[120px] py-2 text-center text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === "tasks" 
              ? "bg-[#FFE300] text-black shadow-sm" 
              : "text-neutral-500 hover:text-neutral-900"
          }`}
        >
          <span>Модерация заданий</span>
          {pendingTasks.length > 0 && (
            <span className={`text-[10px] h-4.5 w-4.5 rounded-full flex items-center justify-center font-bold ${activeTab === "tasks" ? "bg-black text-[#FFE300]" : "bg-neutral-100 text-neutral-900"}`}>
              {pendingTasks.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("hours")}
          className={`flex-1 min-w-[120px] py-2 text-center text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === "hours" 
              ? "bg-[#FFE300] text-black shadow-sm" 
              : "text-neutral-500 hover:text-neutral-900"
          }`}
        >
          <span>Начисление часов</span>
          {pendingHourApps.length > 0 && (
            <span className={`text-[10px] h-4.5 w-4.5 rounded-full flex items-center justify-center font-bold ${activeTab === "hours" ? "bg-black text-[#FFE300]" : "bg-neutral-100 text-neutral-900"}`}>
              {pendingHourApps.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("analytics")}
          className={`flex-1 min-w-[120px] py-2 text-center text-xs font-bold rounded-lg transition cursor-pointer ${
            activeTab === "analytics" 
              ? "bg-[#FFE300] text-black shadow-sm" 
              : "text-neutral-500 hover:text-neutral-900"
          }`}
        >
          Аналитика и Отчёты
        </button>
      </div>

      {/* ======================================= */}
      {/* SECTION 1: MODERATE FUNDS */}
      {/* ======================================= */}
      {activeTab === "funds" && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
          <h3 className="font-extrabold text-[#000000] text-base mb-1">Заявки благотворительных фондов на верификацию</h3>
          <p className="text-xs text-neutral-500 mb-4 leading-relaxed">
            Юридический отдел Столото координирует данные получателей ИНН и ОГРН с реестром Минюста РФ во избежание несанкционированных сборов.
          </p>

          {funds.length === 0 ? (
            <div className="py-8 text-center text-neutral-400 text-xs">
              Заявок фондов в системе нет.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left" id="admin-funds-table">
                <thead>
                  <tr className="bg-neutral-50 hover:bg-neutral-100 text-neutral-500 font-bold border-b border-neutral-200">
                    <th className="p-3">Название фонда</th>
                    <th className="p-3">ИНН / ОГРН / Город</th>
                    <th className="p-3">Документ (Пакет)</th>
                    <th className="p-3">Уполномоченное лицо</th>
                    <th className="p-3">Текущий Статус</th>
                    <th className="p-3 text-right">Модерация</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {funds.map((f) => (
                    <tr key={f.id} className="align-top hover:bg-neutral-50 transition">
                      <td className="p-3 pr-4">
                        <p className="font-bold text-neutral-900">{f.name}</p>
                        <p className="text-[10.5px] text-neutral-500 mt-0.5 line-clamp-2 max-w-xs">{f.description}</p>
                        <button
                          onClick={() => setSelectedFundForDetail(f)}
                          className="mt-2 text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2 py-0.5 rounded text-[9.5px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          🔍 Посмотреть все данные
                        </button>
                      </td>
                      <td className="p-3 font-mono text-[10.5px]">
                        <p>ИНН: <strong>{f.inn}</strong></p>
                        <p>ОГРН: <strong>{f.ogrn}</strong></p>
                        <p className="text-neutral-400 mt-1">Офис: {f.city}</p>
                      </td>
                      <td className="p-3 font-mono text-neutral-800 font-semibold text-[10.5px]">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="truncate max-w-[150px] block" title={f.documentName}>📄 {f.documentName || "charter.pdf"}</span>
                          <a
                            href={`/api/admin/funds/${f.id}/document`}
                            download={f.documentName || "charter.pdf"}
                            className="inline-flex items-center gap-1 text-[9.5px] uppercase font-bold text-[#D70066] hover:text-[#B00052] cursor-pointer hover:underline"
                          >
                            📥 Скачать файл
                          </a>
                        </div>
                      </td>
                      <td className="p-3">
                        <p className="font-semibold text-neutral-950">{f.contactName}</p>
                        <p className="text-neutral-500 text-[10px]">{f.phone}</p>
                      </td>
                      <td className="p-3 text-[10px] font-bold">
                        {f.fundStatus === "pending" && <span className="text-orange-700 bg-orange-50 px-2 py-0.5 rounded">Ожидает</span>}
                        {f.fundStatus === "approved" && <span className="text-green-700 bg-green-50 px-2 py-0.5 rounded">Одобрен</span>}
                        {f.fundStatus === "rejected" && <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded">Отклонен</span>}
                      </td>
                      <td className="p-3 text-right space-y-2">
                        {f.fundStatus === "pending" && (
                          <div className="space-y-2">
                            <textarea
                              rows={2}
                              placeholder="Комментарий к решению..."
                              value={activeFundCommentId === f.id ? fundComment : ""}
                              onChange={(e) => {
                                setActiveFundCommentId(f.id);
                                setFundComment(e.target.value);
                              }}
                              className="w-full text-[10px] p-2 rounded border bg-neutral-50 focus:outline-none focus:bg-white resize-none focus:border-[#FFE300]"
                            />
                            
                            <div className="flex gap-1.5 justify-end">
                              <button
                                id={`approve-fund-${f.id}`}
                                onClick={() => handleFundStatus(f.id, FundStatus.APPROVED)}
                                className="bg-green-600 text-white font-bold text-[10px] px-2.5 py-1.5 rounded hover:bg-green-700 transition cursor-pointer"
                              >
                                Одобрить
                              </button>
                              
                              <button
                                id={`reject-fund-${f.id}`}
                                onClick={() => handleFundStatus(f.id, FundStatus.REJECTED)}
                                className="bg-red-600 text-white font-extrabold text-[10px] px-2.5 py-1.5 rounded hover:bg-red-700 transition cursor-pointer"
                              >
                                Отклонить
                              </button>
                            </div>
                          </div>
                        )}

                        {f.fundStatus !== "pending" && (
                          <span className="text-[10px] text-neutral-400 leading-normal italic">
                            {f.moderatorComment ? `Примечание: ${f.moderatorComment}` : "Модерация пройдена"}
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
      {/* SECTION 2: MODERATE TASKS */}
      {/* ======================================= */}
      {activeTab === "tasks" && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
          <h3 className="font-extrabold text-[#000000] text-base mb-1">Пре-модерация волонтёрских заданий фондов</h3>
          <p className="text-xs text-neutral-500 mb-4">Администратор публикует поступающие задания, либо отклоняет в случае несоответствия кодексу Столото.</p>

          {tasks.filter(t => t.status === "pending_moderation").length === 0 ? (
            <div className="py-8 text-center text-neutral-400 text-xs">
              Заданий, ожидающих проверку, пока нет.
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.filter(t => t.status === "pending_moderation").map((task) => (
                <div key={task.id} className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/40 text-left space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className={getCategoryBadgeClass(task.category)}>
                        {task.category}
                      </span>
                      <h4 className="font-bold text-neutral-900 text-sm mt-1">{task.title}</h4>
                      <p className="text-[10px] text-neutral-500 uppercase font-bold">Организатор: {task.fundName}</p>
                      <button
                        onClick={() => setSelectedTaskForDetail(task)}
                        className="mt-2 text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded text-[9.5px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        🔍 Полный просмотр всех полей задания
                      </button>
                    </div>
                    
                    <span className="font-mono font-bold text-neutral-900 text-xs bg-yellow-50 p-1.5 rounded border border-yellow-250">
                      ~ {task.hoursEstimation} волонтёрских часа
                    </span>
                  </div>

                  <p className="text-xs text-neutral-700 leading-relaxed whitespace-pre-wrap">
                    {task.description}
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10.5px] bg-white p-3 rounded-lg border border-neutral-200">
                    <div>
                      <span className="text-neutral-400 block text-[9.5px] uppercase">Формат</span>
                      <strong>{task.format === "online" ? "💻 Онлайн" : `📍 Офлайн (${task.city})`}</strong>
                    </div>
                    <div>
                      <span className="text-neutral-400 block text-[9.5px] uppercase">Локация</span>
                      <strong className="truncate block" title={task.location}>{task.location}</strong>
                    </div>
                    <div>
                      <span className="text-neutral-400 block text-[9.5px] uppercase">Сроки</span>
                      <div className="flex flex-col gap-0.5">
                        <strong className="text-amber-805 font-mono block text-[10px]">📥 Набор: {task.deadline}</strong>
                        <strong className="text-emerald-805 font-mono block text-[10px]">📅 Задача: {task.eventDate || task.deadline}</strong>
                      </div>
                    </div>
                    <div>
                      <span className="text-neutral-400 block text-[9.5px] uppercase">Требования</span>
                      <strong className="truncate block" title={task.requirements}>{task.requirements}</strong>
                    </div>
                  </div>

                  {/* Decision Controls */}
                  <div className="border-t border-dashed border-neutral-200 pt-3 space-y-2">
                    <p className="text-[10px] font-bold text-neutral-500 uppercase">Заключение куратора Столото:</p>
                    <textarea
                      rows={2}
                      placeholder="Внесите предложение или комментарий..."
                      value={activeTaskCommentId === task.id ? taskComment : ""}
                      onChange={(e) => {
                        setActiveTaskCommentId(task.id);
                        setTaskComment(e.target.value);
                      }}
                      className="w-full text-xs p-2.5 rounded border bg-white focus:outline-none focus:border-[#FFE300]"
                    />

                    <div className="flex gap-2 justify-end">
                      <button
                        id={`publish-task-${task.id}`}
                        onClick={() => handleTaskStatus(task.id, TaskStatus.PUBLISHED)}
                        className="bg-[#FFE300] text-black font-bold text-xs px-4 py-2 rounded-lg hover:bg-[#E5C500] transition shadow-sm cursor-pointer"
                      >
                        Опубликовать в ленте
                      </button>
                      <button
                        id={`reject-task-${task.id}`}
                        onClick={() => handleTaskStatus(task.id, TaskStatus.REJECTED)}
                        className="bg-red-600 text-white font-extrabold text-xs px-4 py-2 rounded-lg hover:bg-red-700 transition shadow-sm cursor-pointer"
                      >
                        Забраковать / Отклонить
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}


      {/* ======================================= */}
      {/* SECTION 3: HOURS VERIFICATION ACCRUAL */}
      {/* ======================================= */}
      {activeTab === "hours" && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
          <h3 className="font-extrabold text-[#000000] text-base mb-1">Ручное зачисление верифицированных часов сотрудникам</h3>
          <p className="text-xs text-neutral-500 mb-4 leading-relaxed">
            Здесь выводятся только те отклики волонтёров, прохождение которых <strong>подтверждено принимающим благотворительным фондом</strong>. Отредактируйте количество часов при необходимости и нажмите зачислить.
          </p>

          {pendingHourApps.length === 0 ? (
            <div className="py-8 text-center text-neutral-405 text-xs flex flex-col justify-center items-center gap-1.5 bg-neutral-50 rounded-xl border border-dashed border-neutral-300">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <p>Все отработанные часы успешно обработаны и внесены в базу сотрудников Столото!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingHourApps.map((app) => {
                const task = tasks.find(t => t.id === app.taskId);
                const estHours = task ? task.hoursEstimation : 4;
                const hoursVal = manualHours[app.id] !== undefined ? manualHours[app.id] : estHours;

                return (
                  <div key={app.id} className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 text-left flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={getCategoryBadgeClass(task ? task.category : "Общее")}>
                          {task ? task.category : "Общее"}
                        </span>
                        <strong className="text-sm font-extrabold text-neutral-900">{app.volunteerName}</strong>
                        <button
                          onClick={() => setSelectedAppForDetail(app)}
                          className="text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-1.5 py-0.5 rounded text-[8.5px] font-bold cursor-pointer inline-flex items-center gap-0.5"
                        >
                          🔍 Карточка волонтёра
                        </button>
                      </div>
                      <p className="text-xs text-neutral-600 font-medium leading-snug">
                        Участвовал в проекте: <strong className="text-neutral-950">«{app.taskTitle}»</strong>
                      </p>
                      <p className="text-[10px] text-neutral-400">
                        Офис/Должность: {app.volunteerCity} | {app.volunteerPosition} ({app.volunteerDepartment})
                      </p>
                      {app.fundComment && (
                        <p className="text-[11px] text-neutral-600 italic bg-white p-2 mt-2 rounded border border-neutral-200 border-dashed">
                          <strong className="text-[10px] text-neutral-400 block uppercase font-bold">Рапорт благотворительного фонда:</strong>
                          «{app.fundComment}»
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div>
                        <label className="block text-[9px] text-neutral-400 font-bold uppercase tracking-wide mb-1">
                          Часы к зачислению
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={hoursVal}
                          onChange={(e) => setManualHours({ ...manualHours, [app.id]: Number(e.target.value) })}
                          className="w-16 text-center text-xs font-bold p-1 rounded border bg-white focus:outline-none focus:border-[#FFE300]"
                        />
                      </div>

                      <button
                        id={`award-hours-btn-${app.id}`}
                        onClick={() => handleAwardHours(app.id, estHours)}
                        className="bg-[#FFE300] text-black hover:bg-[#E5C500] font-bold text-xs px-3.5 py-2.5 rounded-lg shadow-sm transition-all uppercase tracking-wider cursor-pointer"
                      >
                        Зачислить {hoursVal} ч.
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}


      {/* ======================================= */}
      {/* SECTION 4: GLOBAL ANALYTICS & CSV REPORTS */}
      {/* ======================================= */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          
          {/* General ESG metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-neutral-200">
              <span className="text-[10px] text-neutral-400 uppercase font-black">Всего волонтёров</span>
              <p className="text-3xl font-black text-neutral-900 mt-0.5">
                {analytics ? analytics.metrics.totalVolunteers : "..."}
              </p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-neutral-200">
              <span className="text-[10px] text-neutral-400 uppercase font-black">Из них активных</span>
              <p className="text-3xl font-black text-neutral-950 mt-0.5">
                {analytics ? analytics.metrics.activeVolunteersCount : "..."}
              </p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-neutral-200">
              <span className="text-[10px] text-neutral-400 uppercase font-black">Партнёрских Фондов</span>
              <p className="text-3xl font-black text-neutral-900 mt-0.5">
                {analytics ? analytics.metrics.totalFundsCount : "..."}
              </p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-neutral-200">
              <span className="text-[10px] text-neutral-400 uppercase font-black">Часов Зачтено в ESG</span>
              <p className="text-3xl font-black text-green-700 mt-0.5">
                {analytics ? analytics.metrics.totalHoursDistributed : "..."} ч.
              </p>
            </div>
          </div>

          {/* Department Distribution (High Quality CSS Visual Bars) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-neutral-200 p-5 text-left shadow-sm">
              <h4 className="font-extrabold text-sm text-[#000000] mb-3.5">Волонтёрский вклад по подразделениям Столото</h4>
              
              {analytics && analytics.byDepartment.length === 0 ? (
                <p className="text-xs text-neutral-400 py-6">Вклад пока не зарегистрирован</p>
              ) : (
                <div className="space-y-3">
                  {analytics && analytics.byDepartment.map((dept: any, index: any) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-neutral-700 truncate max-w-[250px]">{dept.name}</span>
                        <span className="font-mono text-neutral-905">{dept.hours} ч. зачёта</span>
                      </div>
                      <div className="w-full bg-neutral-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-neutral-900 h-2.5 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, (dept.hours / (analytics.metrics.totalHoursDistributed || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Category Statistics */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-5 text-left shadow-sm">
              <h4 className="font-extrabold text-sm text-[#000000] mb-3.5">Популярность направлений (Задания)</h4>
              
              {analytics && analytics.byCategory.length === 0 ? (
                <p className="text-xs text-neutral-400 py-6">Задания не созданы</p>
              ) : (
                <div className="space-y-3">
                  {analytics && analytics.byCategory.map((cat: any, index: any) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-neutral-700">{cat.name}</span>
                        <span className="font-mono text-neutral-700">{cat.value} шт.</span>
                      </div>
                      <div className="w-full bg-neutral-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#FFE300] h-2.5 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, (cat.value / (analytics.metrics.publishedTasksCount || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Consolidated CSV Export Card */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 text-left shadow-sm space-y-4">
            <h3 className="font-extrabold text-base text-[#000000]">Генератор консолидированного ESG отчёта жюри</h3>
            <p className="text-xs text-neutral-500 leading-normal">
              Согласно требованиям хакатона, администрация может выгрузить сквозную отчётную Excel-таблицу. Этот CSV содержит: ФИО сотрудника, город его работы, подразделение, должность, количество поданных откликов, число выполненных заданий и суммарные одобренные часы.
            </p>

            <a
              href="/api/reports/admin"
              id="download-global-admin-report-btn"
              className="inline-flex items-center gap-2 bg-[#FFE300] text-black hover:bg-[#E5C500] font-bold py-2.5 px-5 rounded-xl text-xs uppercase shadow transition-all cursor-pointer font-sans"
            >
              <FileSpreadsheet className="h-4.5 w-4.5 text-black" />
              <span>Скачать сквозной отчёт волонтёров (.CSV)</span>
            </a>
          </div>

        </div>
      )}

      {/* ======================================= */}
      {/* MODAL 1: FULL FUND DETAILS VIEW */}
      {/* ======================================= */}
      {selectedFundForDetail && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl max-w-2xl w-full overflow-hidden max-h-[90vh] flex flex-col my-8">
            <div className="bg-[#FFE300] text-black px-6 py-4 flex items-center justify-between shrink-0 font-sans">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏢</span>
                <span className="font-extrabold text-sm uppercase tracking-wide font-sans">Полная анкета фонда</span>
              </div>
              <button
                onClick={() => setSelectedFundForDetail(null)}
                className="text-black hover:bg-black/10 rounded-full h-8 w-8 flex items-center justify-center font-bold text-lg cursor-pointer transition-colors"
                title="Закрыть"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-[#333333] font-sans">
              <div>
                <span className="text-neutral-400 block text-[9.5px] uppercase font-bold tracking-wider mb-1">Название организации</span>
                <h3 className="text-lg font-black text-neutral-950">{selectedFundForDetail.name}</h3>
                <p className="text-[10px] text-neutral-400 font-mono mt-0.5">ID: {selectedFundForDetail.id} | Регистрация: {new Date(selectedFundForDetail.createdAt).toLocaleDateString("ru-RU")}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-neutral-50 p-4 rounded-xl border border-neutral-150 font-mono">
                <div>
                  <span className="text-neutral-400 block text-[9px] uppercase font-bold font-sans">ИНН</span>
                  <strong className="text-neutral-900 text-xs">{selectedFundForDetail.inn}</strong>
                </div>
                <div>
                  <span className="text-neutral-400 block text-[9px] uppercase font-bold font-sans">ОГРН</span>
                  <strong className="text-neutral-900 text-xs">{selectedFundForDetail.ogrn}</strong>
                </div>
                <div>
                  <span className="text-neutral-400 block text-[9px] uppercase font-bold font-sans">Основной город</span>
                  <strong className="text-neutral-900 text-xs">{selectedFundForDetail.city}</strong>
                </div>
              </div>

              <div>
                <span className="text-neutral-400 block text-[9.5px] uppercase font-bold tracking-wider mb-1.5">Сфера / Описание фонда</span>
                <p className="bg-neutral-50 p-3 rounded-xl border border-neutral-155 leading-relaxed text-xs">
                  {selectedFundForDetail.description || "Описание отсутствует"}
                </p>
              </div>

              <div>
                <span className="text-neutral-400 block text-[9.5px] uppercase font-bold tracking-wider mb-1.5">Категории получателей помощи</span>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedFundForDetail.categories || []).length === 0 ? (
                    <span className="text-neutral-400 italic">Не указаны</span>
                  ) : (
                    (selectedFundForDetail.categories || []).map((cat, i) => (
                      <span key={i} className="bg-yellow-100 text-neutral-900 border border-yellow-200 px-2.5 py-1 rounded-md font-bold text-[10px]">
                        {cat}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {selectedFundForDetail.website && (
                <div>
                  <span className="text-neutral-400 block text-[9.5px] uppercase font-bold tracking-wider mb-1">Сайт фонда</span>
                  <a
                    href={selectedFundForDetail.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#D70066] hover:underline font-bold font-mono text-xs inline-flex items-center gap-1"
                  >
                    🔗 {selectedFundForDetail.website}
                  </a>
                </div>
              )}

              <div className="border-t border-dashed border-neutral-200 pt-4 space-y-3">
                <h4 className="font-bold text-[10px] text-neutral-900 uppercase tracking-widest">Контактное ответственное лицо</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-yellow-50/40 p-4 rounded-xl border border-yellow-100">
                  <div>
                    <span className="text-neutral-400 block text-[9px] uppercase font-bold">ФИО представителя</span>
                    <strong className="text-neutral-900 text-[11px] block mt-0.5">{selectedFundForDetail.contactName || "—"}</strong>
                  </div>
                  <div>
                    <span className="text-neutral-400 block text-[9px] uppercase font-bold">Должность в фонде</span>
                    <strong className="text-neutral-900 text-[11px] block mt-0.5">{selectedFundForDetail.contactPosition || "—"}</strong>
                  </div>
                  <div>
                    <span className="text-neutral-400 block text-[9px] uppercase font-bold">Рабочий Email</span>
                    <strong className="text-neutral-900 font-mono text-[11px] block mt-0.5">{selectedFundForDetail.email}</strong>
                  </div>
                  <div>
                    <span className="text-neutral-400 block text-[9px] uppercase font-bold">Телефон связи</span>
                    <strong className="text-neutral-900 font-mono text-[11px] block mt-0.5">{selectedFundForDetail.phone || "—"}</strong>
                  </div>
                </div>
              </div>

              <div className="border-t border-dashed border-neutral-200 pt-4">
                <span className="text-neutral-400 block text-[9.5px] uppercase font-bold tracking-wider mb-2">Пакет уставных документов</span>
                <div className="flex items-center justify-between bg-neutral-100 p-3.5 rounded-xl border border-neutral-250">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📁</span>
                    <div>
                      <strong className="block text-neutral-800 font-mono text-[11px]">{selectedFundForDetail.documentName || "charter.pdf"}</strong>
                      <span className="text-[9.5px] text-neutral-400 italic">Загружено в систему при регистрации</span>
                    </div>
                  </div>
                  <a
                    href={`/api/admin/funds/${selectedFundForDetail.id}/document`}
                    download={selectedFundForDetail.documentName || "charter.pdf"}
                    className="bg-neutral-900 hover:bg-neutral-950 text-[#FFE300] font-bold text-[11px] px-3.5 py-2 rounded-lg transition-all"
                  >
                    Скачать файл
                  </a>
                </div>
              </div>

              {selectedFundForDetail.moderatorComment && (
                <div className="bg-red-50 p-3.5 rounded-xl border border-red-150 text-red-800">
                  <strong className="block text-[10px] uppercase font-bold mb-1">Предыдущий комментарий модератора:</strong>
                  «{selectedFundForDetail.moderatorComment}»
                </div>
              )}
            </div>

            <div className="border-t border-neutral-100 p-4 bg-neutral-50 flex justify-end gap-2 shrink-0">
              <button
                onClick={() => setSelectedFundForDetail(null)}
                className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* MODAL 2: FULL TASK DETAILS VIEW */}
      {/* ======================================= */}
      {selectedTaskForDetail && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl max-w-2xl w-full overflow-hidden max-h-[90vh] flex flex-col my-8">
            <div className="bg-[#FFE300] text-black px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">📋</span>
                <span className="font-extrabold text-sm uppercase tracking-wide font-sans">Полный аудит полей задания</span>
              </div>
              <button
                onClick={() => setSelectedTaskForDetail(null)}
                className="text-black hover:bg-black/10 rounded-full h-8 w-8 flex items-center justify-center font-bold text-lg cursor-pointer transition-colors"
                title="Закрыть"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs text-[#333333] font-sans">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={getCategoryBadgeClass(selectedTaskForDetail.category)}>
                    {selectedTaskForDetail.category}
                  </span>
                  <span className="bg-yellow-50 text-neutral-900 font-bold border border-yellow-250 px-2 py-0.5 rounded font-mono">
                    ~ {selectedTaskForDetail.hoursEstimation} волонтёрских часа
                  </span>
                </div>
                <h3 className="text-lg font-black text-neutral-950 leading-tight">{selectedTaskForDetail.title}</h3>
                <p className="text-[10px] text-neutral-400 uppercase font-bold mt-1">Организатор дела: {selectedTaskForDetail.fundName}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-neutral-50 p-4 rounded-xl border border-neutral-150">
                <div>
                  <span className="text-neutral-400 block text-[9px] uppercase font-bold mb-0.5">Формат проекта</span>
                  <strong className="text-neutral-900 block mt-0.5">{selectedTaskForDetail.format === "online" ? "💻 Онлайн" : "📍 Офлайн"}</strong>
                </div>
                <div>
                  <span className="text-neutral-400 block text-[9px] uppercase font-bold mb-0.5">Основной город</span>
                  <strong className="text-neutral-900 block mt-0.5">{selectedTaskForDetail.city}</strong>
                </div>
                <div>
                  <span className="text-neutral-400 block text-[9px] uppercase font-bold mb-0.5">Длительность</span>
                  <strong className="text-neutral-900 block mt-0.5">
                    {selectedTaskForDetail.duration === "one-time" ? "Разовое" : selectedTaskForDetail.duration === "regular" ? "Регулярно" : "Долгосрочно"}
                  </strong>
                </div>
                <div>
                  <span className="text-neutral-400 block text-[9px] uppercase font-bold mb-0.5">Тип зачёта</span>
                  <strong className="text-neutral-900 block mt-0.5">
                    {selectedTaskForDetail.type === "pro-bono" ? "Pro-bono (IT)" : "Стандартный"}
                  </strong>
                </div>
              </div>

              <div>
                <span className="text-neutral-400 block text-[9.5px] uppercase font-bold tracking-wider mb-1.5">Полное описание выполняемой задачи</span>
                <p className="bg-neutral-50 p-4 rounded-xl border border-neutral-150 leading-relaxed text-xs whitespace-pre-wrap">
                  {selectedTaskForDetail.description}
                </p>
              </div>

              <div>
                <span className="text-neutral-400 block text-[9.5px] uppercase font-bold tracking-wider mb-1.5">Требования к участникам волонтёрам</span>
                <p className="bg-cyan-50/30 p-4 rounded-xl border border-cyan-100 leading-relaxed text-xs text-neutral-800">
                  {selectedTaskForDetail.requirements || "Особых требований нет"}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-amber-50/40 p-3 rounded-xl border border-amber-100">
                  <span className="text-neutral-400 block text-[9px] uppercase font-bold mb-1">Сроки набора & начисления</span>
                  <div className="space-y-1 font-mono text-[11px] text-neutral-800 mt-1">
                    <p>📥 Дедлайн набора: <strong className="text-amber-800">{selectedTaskForDetail.deadline}</strong></p>
                    <p>📅 Выполнение: <strong className="text-emerald-800">{selectedTaskForDetail.eventDate || selectedTaskForDetail.deadline}</strong></p>
                  </div>
                </div>

                <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-150">
                  <span className="text-neutral-400 block text-[9px] uppercase font-bold mb-1">Свободные места в группе</span>
                  <div className="text-xs mt-1">
                    Лимит мест: <strong className="text-neutral-900">{selectedTaskForDetail.maxParticipants} человек</strong>
                    <p className="text-[10px] text-neutral-400 mt-1">Текущий набор: {selectedTaskForDetail.joinedParticipants} участников</p>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-neutral-400 block text-[9.5px] uppercase font-bold tracking-wider mb-1">Локация / Адрес сбора на мероприятие</span>
                <p className="bg-neutral-50 p-3 rounded-xl border border-neutral-150 font-mono text-xs text-neutral-900">
                  {selectedTaskForDetail.location || "Онлайн / Дистанционно"}
                </p>
              </div>

              {selectedTaskForDetail.materials && (
                <div>
                  <span className="text-neutral-400 block text-[9.5px] uppercase font-bold tracking-wider mb-1">Инструкции & Дополнительные материалы</span>
                  <a
                    href={selectedTaskForDetail.materials}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#D70066] hover:underline font-bold font-mono text-xs inline-flex items-center gap-1 mt-1"
                  >
                    🔗 {selectedTaskForDetail.materials}
                  </a>
                </div>
              )}
            </div>

            <div className="border-t border-neutral-100 p-4 bg-neutral-50 flex justify-end gap-2 shrink-0">
              <button
                onClick={() => setSelectedTaskForDetail(null)}
                className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* MODAL 3: FULL VOLUNTEER DETAILS VIEW */}
      {/* ======================================= */}
      {selectedAppForDetail && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl max-w-md w-full overflow-hidden max-h-[90vh] flex flex-col my-8">
            <div className="bg-neutral-955 text-[#FFE300] px-6 py-4 flex items-center justify-between shrink-0 font-sans">
              <div className="flex items-center gap-2">
                <span className="text-xl">🙋‍♂️</span>
                <span className="font-extrabold text-sm uppercase tracking-wide font-sans">Карточка волонтёра Столото</span>
              </div>
              <button
                onClick={() => setSelectedAppForDetail(null)}
                className="text-white hover:bg-[#FFE300]/20 rounded-full h-8 w-8 flex items-center justify-center font-bold text-lg cursor-pointer transition-colors"
                title="Закрыть"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs text-[#333333] text-left font-sans">
              <div className="text-center pb-4 border-b border-neutral-100">
                <div className="h-16 w-16 bg-[#FFE300] text-black rounded-full flex items-center justify-center font-black text-xl mx-auto mb-3 shadow">
                  {selectedAppForDetail.volunteerName.split(" ").map(n => n[0]).join("")}
                </div>
                <h3 className="text-base font-black text-neutral-900">{selectedAppForDetail.volunteerName}</h3>
                <span className="text-[10px] bg-yellow-50 text-neutral-900 border border-yellow-200 px-2.5 py-1 rounded-full font-bold mt-1 inline-block uppercase tracking-wider">
                  Корпоративный волонтёр Столото
                </span>
              </div>

              <div className="space-y-3.5">
                <div>
                  <span className="text-neutral-400 block text-[9px] uppercase font-bold mb-0.5">Контактный корпоративный Email</span>
                  <strong className="text-neutral-950 font-mono text-xs">{selectedAppForDetail.volunteerEmail}</strong>
                </div>

                <div>
                  <span className="text-neutral-400 block text-[9px] uppercase font-bold mb-0.5">Город локации</span>
                  <strong className="text-neutral-950 text-xs">{selectedAppForDetail.volunteerCity}</strong>
                </div>

                <div>
                  <span className="text-neutral-400 block text-[9px] uppercase font-bold mb-0.5">Подразделение компании</span>
                  <strong className="text-neutral-950 text-xs">{selectedAppForDetail.volunteerDepartment || "Департамент Столото"}</strong>
                </div>

                <div>
                  <span className="text-neutral-400 block text-[9px] uppercase font-bold mb-0.5">Должность</span>
                  <strong className="text-neutral-950 text-xs">{selectedAppForDetail.volunteerPosition || "Сотрудник"}</strong>
                </div>
              </div>

              <div className="border-t border-dashed border-neutral-200 pt-4 bg-neutral-50 p-3 rounded-xl border border-neutral-150 space-y-1.5">
                <h4 className="font-bold text-[9px] text-neutral-400 uppercase tracking-wide">Параметры текущей заявки</h4>
                <p className="text-[11px] leading-tight text-neutral-800">
                  Зарегистрировал отклик на задание: <strong className="text-neutral-950">«{selectedAppForDetail.taskTitle}»</strong>
                </p>
                <div className="flex justify-between items-center text-[10px] text-neutral-500 font-mono mt-2 pt-2 border-t border-neutral-100">
                  <span>Статус решения: <strong>{selectedAppForDetail.status}</strong></span>
                  <span>Дата отклика: {new Date(selectedAppForDetail.createdAt).toLocaleDateString("ru-RU")}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-neutral-100 p-4 bg-neutral-50 flex justify-end gap-2 shrink-0">
              <button
                onClick={() => setSelectedAppForDetail(null)}
                className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Beautiful High Contrast Custom React Confirmation Modal */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-[999] bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl p-6 max-w-md w-full space-y-4 text-left animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 text-amber-500 font-bold">
              <span className="text-xl">⚠️</span>
              <h4 className="font-extrabold text-sm text-neutral-900 uppercase tracking-wider font-sans">
                {confirmModal.title}
              </h4>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed font-sans">
              {confirmModal.message}
            </p>
            <div className="flex gap-2 justify-end pt-3">
              <button
                onClick={() => setConfirmModal(null)}
                className="bg-neutral-900 hover:bg-neutral-950 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer"
              >
                Отмена
              </button>
              <button
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(null);
                }}
                className={`${
                  confirmModal.confirmColor === "red"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-green-600 hover:bg-green-700"
                } text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer shadow-sm`}
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
