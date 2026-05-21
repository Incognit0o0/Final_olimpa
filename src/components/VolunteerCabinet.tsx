/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { api } from "../api.js";
import { UserProfile, VolunteerTask, TaskApplication, ApplicationStatus } from "../types.js";
import { Search, MapPin, Calendar, Clock, Sparkles, Filter, Award, ChevronRight, HelpCircle, X, ShieldAlert, Check, Phone, Mail, User, Building, ChevronDown, List, Globe, Heart } from "lucide-react";

interface VolunteerCabinetProps {
  user: UserProfile;
  tasks: VolunteerTask[];
  applications: TaskApplication[];
  onRefreshAll: () => void;
  activeTab: "feed" | "profile";
  setActiveTab: (tab: "feed" | "profile") => void;
}

const battlePassRewards = [
  { id: "notebook", name: "Блокнот Столото", hours: 10, icon: "📖", desc: "Удобный корпоративный блокнот с ручкой для записи важных добрых дел." },
  { id: "socks", name: "Фирменные Носки", hours: 25, icon: "🧦", desc: "Теплые яркие носки Столото ESG - согреют вас на любом субботнике." },
  { id: "tshirt", name: "Стильная Футболка", hours: 50, icon: "👕", desc: "Эксклюзивная дышащая футболка серии 'ESG Лидер Добрых Дел'." },
  { id: "backpack", name: "Вместительный Рюкзак", hours: 100, icon: "🎒", desc: "Влагозащитный рюкзак для поездок на выездные волонтерские мероприятия." },
  { id: "hoodie", name: "Фирменное Худи Столото", hours: 150, icon: "🧥", desc: "Плотное оверсайз худи премиум-качества с теплой вышивкой." }
];

export default function VolunteerCabinet({
  user,
  tasks,
  applications,
  onRefreshAll,
  activeTab,
  setActiveTab,
}: VolunteerCabinetProps) {
  const [searchQuery, setSearchQuery] = useState("");
  // Battle pass claimed rewards state
  const [claimedRewards, setClaimedRewards] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`claimed_rewards_${user.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [bpCongratsReward, setBpCongratsReward] = useState<any | null>(null);

  const handleClaimReward = (rewardId: string) => {
    const reward = battlePassRewards.find(r => r.id === rewardId);
    if (!reward) return;
    
    // Safety check check if they have enough hours
    if ((user.hours || 0) < reward.hours) return;
    
    // Safety check check if they already claimed it
    if (claimedRewards.includes(rewardId)) return;
    
    const updated = [...claimedRewards, rewardId];
    setClaimedRewards(updated);
    localStorage.setItem(`claimed_rewards_${user.id}`, JSON.stringify(updated));
    setBpCongratsReward(reward);
  };
  const [formatFilter, setFormatFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [fundFilter, setFundFilter] = useState("");
  const [deadlineFilter, setDeadlineFilter] = useState("");
  const [seatsFilter, setSeatsFilter] = useState("");
  const [recruitmentStatusFilter, setRecruitmentStatusFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [skillsFilter, setSkillsFilter] = useState("");

  const [selectedTask, setSelectedTask] = useState<VolunteerTask | null>(null);
  const [selectedVacancyId, setSelectedVacancyId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editVoltName, setEditVoltName] = useState(user.name || "");
  const [editVoltCity, setEditVoltCity] = useState(user.city || "");
  const [editVoltDepartment, setEditVoltDepartment] = useState(user.department || "");
  const [editVoltPosition, setEditVoltPosition] = useState(user.position || "");
  const [editVoltPhone, setEditVoltPhone] = useState(user.phone || "");

  // Fund details modal state
  const [selectedFundData, setSelectedFundData] = useState<any>(null);
  const [isFundModalOpen, setIsFundModalOpen] = useState(false);
  const [isFundLoading, setIsFundLoading] = useState(false);
  const [fundError, setFundError] = useState<string | null>(null);

  const openFundModal = async (fundIdOrName: string) => {
    setIsFundModalOpen(true);
    setIsFundLoading(true);
    setFundError(null);
    setSelectedFundData(null);
    if (!fundIdOrName) {
      setFundError("Информация об организаторе временно недоступна");
      setIsFundLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/funds/${encodeURIComponent(fundIdOrName)}`, {
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": localStorage.getItem("stoloto_v_user_id") || user.id,
        },
      });
      if (!res.ok) {
        throw new Error("Не удалось загрузить информацию о благотворительной организации");
      }
      const data = await res.json();
      setSelectedFundData(data);
    } catch (err: any) {
      setFundError(err.message || "Ошибка загрузки данных фонда");
    } finally {
      setIsFundLoading(false);
    }
  };

  React.useEffect(() => {
    if (user) {
      setEditVoltName(user.name || "");
      setEditVoltCity(user.city || "");
      setEditVoltDepartment(user.department || "");
      setEditVoltPosition(user.position || "");
      setEditVoltPhone(user.phone || "");
    }
  }, [user]);

  const handleSaveVolunteerProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const res = await api.updateProfile({
        name: editVoltName,
        city: editVoltCity,
        department: editVoltDepartment,
        position: editVoltPosition,
        phone: editVoltPhone,
      });
      setSuccessMessage(res.message || "Профиль успешно обновлен.");
      setIsEditingProfile(false);
      onRefreshAll();
    } catch (err: any) {
      setErrorMessage(err.message || "Ошибка обновления профиля");
    }
  };

  const uniqueFunds = Array.from(new Set(tasks.map(t => t.fundName).filter(Boolean)));

  // Filter tasks locally (since we also provide interactive UI filtering in real-time)
  const filteredTasks = tasks.filter((task) => {
    // Only show published tasks
    if (task.status !== "published") return false;

    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase()) && !task.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (formatFilter && task.format !== formatFilter) return false;
    if (categoryFilter && task.category.toLowerCase() !== categoryFilter.toLowerCase()) return false;
    if (fundFilter && task.fundName !== fundFilter) return false;
    if (deadlineFilter && task.deadline > deadlineFilter) return false;
    if (seatsFilter) {
      const freeSeats = task.maxParticipants - task.joinedParticipants;
      if (freeSeats < Number(seatsFilter)) return false;
    }
    if (recruitmentStatusFilter) {
      const isFull = task.joinedParticipants >= task.maxParticipants;
      if (recruitmentStatusFilter === "open" && isFull) return false;
      if (recruitmentStatusFilter === "full" && !isFull) return false;
    }
    if (cityFilter && !task.city.toLowerCase().includes(cityFilter.toLowerCase())) {
      return false;
    }
    if (skillsFilter) {
      const lowerSkills = skillsFilter.toLowerCase();
      const searchInReqs = (task.requirements || "").toLowerCase().includes(lowerSkills);
      const searchInVacancies = (task.vacancies || []).some(v => 
        (v.requirements || []).some(req => req.toLowerCase().includes(lowerSkills))
      );
      if (!searchInReqs && !searchInVacancies) {
        return false;
      }
    }

    return true;
  });

  // Calculate stats for level progress
  const hours = user.hours || 0;
  let nextLevelName = "Активный";
  let hoursNeededForNext = 10;
  let percent = (hours / 10) * 100;

  if (hours >= 20) {
    nextLevelName = "Максимальный уровень";
    hoursNeededForNext = 20;
    percent = 100;
  } else if (hours >= 10) {
    nextLevelName = "Лидер";
    hoursNeededForNext = 20;
    percent = ((hours - 10) / 10) * 100;
  }

  // Vivid Lotto colors mapped properly
  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case "Дети":
        return "bg-[#00A8CC]/10 text-[#00A8CC] border border-[#00A8CC]/20 font-bold px-2 py-0.5 rounded text-[10px] tracking-wide";
      case "Пожилые":
        return "bg-[#D70066]/10 text-[#D70066] border border-[#D70066]/20 font-bold px-2 py-0.5 rounded text-[10px] tracking-wide";
      case "ОВЗ":
        return "bg-[#E42020]/10 text-[#E42020] border border-[#E42020]/20 font-bold px-2 py-0.5 rounded text-[10px] tracking-wide";
      case "Экология":
        return "bg-[#00A8CC]/15 text-[#00A8CC] border border-[#00A8CC]/30 font-bold px-2 py-0.5 rounded text-[10px] tracking-wide";
      case "Животные":
        return "bg-[#D70066]/15 text-[#D70066] border border-[#D70066]/30 font-bold px-2 py-0.5 rounded text-[10px] tracking-wide";
      case "Донорство":
        return "bg-[#E42020]/15 text-[#E42020] border border-[#E42020]/30 font-bold px-2 py-0.5 rounded text-[10px] tracking-wide";
      case "Pro-bono":
        return "bg-indigo-50 text-indigo-700 border border-indigo-150 font-bold px-2 py-0.5 rounded text-[10px] tracking-wide";
      default:
        return "bg-neutral-100 text-neutral-800 border border-neutral-200 font-bold px-2 py-0.5 rounded text-[10px] tracking-wide";
    }
  };

  const BADGE_LIST = [
    { key: "Дети", title: "Защитник детей", desc: "Участие в проектах детских домов", color: "bg-[#00A8CC] text-white" },
    { key: "Экология", title: "Эко-Рейнджер", desc: "Уборка парков и субботники", color: "bg-[#00A8CC] text-white" },
    { key: "Пожилые", title: "Связующая нить", desc: "Помощь домам престарелых", color: "bg-[#D70066] text-white" },
    { key: "ОВЗ", title: "Равные права", desc: "Помощь людям с ограничениями", color: "bg-[#E42020] text-white" },
    { key: "Pro-bono", title: "IT-PRO специалист", desc: "Интеллектуальная помощь Столото", color: "bg-indigo-600 text-white" },
  ];

  const handleApply = async (taskId: string) => {
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const result = await api.applyForTask(taskId);
      setSuccessMessage(result.message);
      // Update selected task in detail view to reflect new joined counter
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask({
          ...selectedTask,
          joinedParticipants: selectedTask.joinedParticipants + 1
        });
      }
      onRefreshAll();
    } catch (err: any) {
      setErrorMessage(err.message || "Ошибка при подаче заявки");
    }
  };

  const handleCancelApp = async (appId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Отозвать отклик",
      message: "Вы действительно хотите отозвать свой отклик на это волонтёрское задание?",
      onConfirm: async () => {
        try {
          await api.cancelApplication(appId);
          onRefreshAll();
        } catch (err: any) {
          alert(err.message);
        }
      }
    });
  };

  const getAppStatusStyle = (status: ApplicationStatus) => {
    switch (status) {
      case "pending":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "accepted":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "rejected":
        return "bg-neutral-100 text-neutral-600 border-neutral-200";
      case "completed":
        return "bg-yellow-50 text-neutral-900 border-yellow-250 font-bold";
    }
  };

  const getAppStatusLabel = (status: ApplicationStatus) => {
    switch (status) {
      case "pending": return "На рассмотрении фонда";
      case "accepted": return "Одобрено (Участвует)";
      case "rejected": return "Отклонено / Отозвано";
      case "completed": return "Выполнено успешно 🎉";
    }
  };

  if (activeTab === "profile") {
    return (
      <div id="volunteer-personal-cabinet-page" className="w-full space-y-6">
        {/* Top Header Card */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs text-left font-sans animate-fade-in">
          <div>
            <h2 className="text-xl font-extrabold text-neutral-950 flex items-center gap-2">
              <User className="h-6 w-6 text-[#D70066]" />
              <span>Личный кабинет волонтёра</span>
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              Просмотр и редактирование личной информации, отслеживание ESG часов, достижений и истории откликов на добрые дела.
            </p>
          </div>
          <button
            onClick={() => setActiveTab("feed")}
            className="inline-flex items-center gap-1.5 bg-[#FFE300] hover:bg-amber-400 text-black font-extrabold text-xs px-4.5 py-3 rounded-2xl transition-all shadow-sm cursor-pointer hover:scale-[1.03]"
          >
            <List className="h-4 w-4" />
            <span>Вернуться к ленте заданий</span>
          </button>
        </div>

        {/* Top Row: Info Details & Gamified Progress */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Profile Card & Editing */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm flex flex-col justify-between text-left">
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-neutral-100 mb-4">
                <h3 className="font-extrabold text-[#000000] text-sm flex items-center gap-2">
                  <User className="h-5 w-5 text-[#D70066]" />
                  <span>Общая информация</span>
                </h3>
                {!isEditingProfile && (
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="text-xs bg-neutral-150 hover:bg-[#FFE300] hover:text-black hover:font-bold text-neutral-800 px-3 py-1.5 rounded-lg transition font-bold cursor-pointer"
                  >
                    ✏️ ИСПРАВИТЬ
                  </button>
                )}
              </div>

              {errorMessage && (
                <div className="bg-red-50 border border-red-100 text-red-650 text-xs p-3 rounded-lg mb-3">
                  {errorMessage}
                </div>
              )}
              {successMessage && (
                <div className="bg-green-50 border border-green-150 text-green-700 text-xs p-3 rounded-lg mb-3 font-semibold">
                  {successMessage}
                </div>
              )}

              {!isEditingProfile ? (
                <div className="space-y-3.5 text-xs text-neutral-800">
                  <div>
                    <span className="text-neutral-400 block text-[9px] uppercase font-bold tracking-wider">ФИО волонтёра</span>
                    <strong className="text-sm font-black text-neutral-950">{user.name}</strong>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-neutral-400 block text-[9px] uppercase font-bold tracking-wider">
                        {user.isEmployee !== false ? "Город подразделения" : "Город"}
                      </span>
                      <strong className="font-semibold text-neutral-900">{user.city}</strong>
                    </div>
                    <div>
                      <span className="text-neutral-400 block text-[9px] uppercase font-bold tracking-wider">Электронная почта</span>
                      <strong className="font-mono text-neutral-900 font-medium">{user.email}</strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-neutral-400 block text-[9px] uppercase font-bold tracking-wider">
                        {user.isEmployee !== false ? "Подразделение Столото" : "Организация"}
                      </span>
                      <strong className="font-semibold text-neutral-900">{user.department || "Не указано"}</strong>
                    </div>
                    <div>
                      <span className="text-neutral-400 block text-[9px] uppercase font-bold tracking-wider">
                        {user.isEmployee !== false ? "Должность" : "Род занятий / должность"}
                      </span>
                      <strong className="font-semibold text-neutral-900">{user.position || "Не указано"}</strong>
                    </div>
                  </div>

                  <div>
                    <span className="text-neutral-400 block text-[9px] uppercase font-bold tracking-wider">Телефон для связи</span>
                    <span className="font-mono text-neutral-800 font-semibold">{user.phone || "Не указан (нажмите Исправить)"}</span>
                  </div>

                  <div className="pt-2 flex items-center gap-3">
                    <div className="bg-[#FFE300]/10 text-neutral-905 border border-[#FFE300]/25 rounded-xl py-2 px-3 flex-1 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-amber-700 shrink-0" />
                      <div>
                        <span className="text-[9px] text-neutral-500 uppercase block font-bold leading-none">Отработано ESG</span>
                        <span className="text-sm font-black text-amber-855 leading-none">{hours} ч.</span>
                      </div>
                    </div>

                    <div className="bg-[#00A8CC]/10 text-[#00A8CC] border border-[#00A8CC]/20 rounded-xl py-2 px-3 flex-1 font-sans">
                      <span className="text-[9px] text-neutral-500 uppercase block font-bold leading-none">Личный статус</span>
                      <span className="text-sm font-black leading-none">{user.volunteerStatus || "Новичок"}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSaveVolunteerProfile} className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-neutral-600">ФИО *</label>
                    <input
                      type="text"
                      required
                      value={editVoltName}
                      onChange={(e) => setEditVoltName(e.target.value)}
                      className="w-full text-xs bg-neutral-50 p-2 rounded-lg border border-neutral-200 focus:outline-none focus:border-[#FFE300]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-neutral-600">Город *</label>
                      <input
                        type="text"
                        required
                        value={editVoltCity}
                        onChange={(e) => setEditVoltCity(e.target.value)}
                        className="w-full text-xs bg-neutral-50 p-2 rounded-lg border border-neutral-200 focus:outline-none focus:border-[#FFE300]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-neutral-600">Телефон</label>
                      <input
                        type="text"
                        value={editVoltPhone}
                        onChange={(e) => setEditVoltPhone(e.target.value)}
                        placeholder="+7 (999) 000-00-00"
                        className="w-full text-xs bg-neutral-50 p-2 rounded-lg border border-neutral-200 focus:outline-none focus:border-[#FFE300]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-neutral-600">
                        {user.isEmployee !== false ? "Подразделение Столото" : "Организация"}
                      </label>
                      <input
                        type="text"
                        value={editVoltDepartment}
                        onChange={(e) => setEditVoltDepartment(e.target.value)}
                        className="w-full text-xs bg-neutral-50 p-2 rounded-lg border border-neutral-200 focus:outline-none focus:border-[#FFE300]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-neutral-600">
                        {user.isEmployee !== false ? "Должность" : "Род занятий / должность"}
                      </label>
                      <input
                        type="text"
                        value={editVoltPosition}
                        onChange={(e) => setEditVoltPosition(e.target.value)}
                        className="w-full text-xs bg-[#F5F5F5] p-2 rounded-lg border border-neutral-200 focus:outline-none focus:border-[#FFE300]"
                      />
                    </div>
                  </div>

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
                      Сохранить профиль
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Achievements & Milestones */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm space-y-4 flex flex-col justify-between text-left">
            <div>
              <h3 className="font-extrabold text-base text-neutral-900 pb-4 border-b border-neutral-100 flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-600" />
                <span>Уровень и Достижения</span>
              </h3>

              {/* Level progress meter with real numbers */}
              <div className="pt-3 space-y-1.5 font-sans">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-neutral-800">
                    Звание: <strong className="text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded text-[10px]">{user.volunteerStatus || "Новичок"}</strong>
                  </span>
                  <span className="text-[10px] font-bold text-neutral-400">
                    Опыт по ESG часам: {hours} ч. из {hours >= 20 ? 20 : (hours >= 10 ? 20 : 10)} ч.
                  </span>
                </div>

                <div className="w-full bg-neutral-100 h-2.5 rounded-full overflow-hidden border border-neutral-200">
                  <div
                    className="bg-gradient-to-r from-yellow-500 to-amber-600 h-full rounded-full transition-all"
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <p className="text-[9.5px] text-neutral-400 font-medium">
                  {hours >= 20 
                    ? "🎉 Вы достигли наивысшего статуса Лидера Столото!" 
                    : `До звания "${nextLevelName}" осталось накопить еще ${hoursNeededForNext - hours} ч.`}
                </p>
              </div>

              {/* Badges Grid */}
              <div className="pt-4 font-sans">
                <span className="text-[9px] text-neutral-400 font-extrabold uppercase tracking-wider block mb-2.5">Заслуженные ESG ордена</span>
                
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-2">
                  {BADGE_LIST.map((badge) => {
                    const isUnlocked = (user.badges && user.badges.includes(badge.key)) || applications.some(a => a.status === "completed" && tasks.find(t => t.id === a.taskId)?.category === badge.key);
                    return (
                      <div
                        key={badge.key}
                        className={`p-2.5 rounded-xl border flex flex-col justify-between transition-all relative overflow-hidden ${
                          isUnlocked
                            ? "bg-white border-neutral-200 shadow-xs"
                            : "bg-neutral-50/70 border-neutral-200/50 opacity-60"
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className={`text-[9.5px] leading-tight font-extrabold uppercase p-1 rounded ${isUnlocked ? badge.color : "bg-neutral-200 text-neutral-450"}`}>
                              {badge.title.split(" ")[0]}
                            </span>
                            {isUnlocked ? (
                              <span className="text-emerald-600 font-bold text-[9px]">✓</span>
                            ) : (
                              <span className="text-neutral-400 font-bold text-[9px]">🔒</span>
                            )}
                          </div>
                          <h4 className="font-extrabold text-[10px] text-neutral-900 leading-tight">
                            {badge.title}
                          </h4>
                          <p className="text-[8.5px] text-neutral-450 leading-tight mt-0.5">
                            {badge.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* === SEASONAL ESG BATTLE PASS PANEL === */}
        <div id="esg-battle-pass-panel" className="bg-white border-2 border-neutral-950 rounded-3xl p-6 md:p-8 text-left shadow-[4px_4px_20px_rgba(0,0,0,0.06)] text-neutral-900 relative overflow-hidden font-sans animate-fade-in my-6">
          {/* Ambient gaming overlay backgrounds */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#FFE300]/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-neutral-200/20 rounded-full blur-[80px] pointer-events-none" />

          {/* Header Layout */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b-2 border-neutral-950 relative z-10">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-100 text-amber-950 border border-amber-300 text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-md font-mono">
                  Сезон 2026 • Годовой пропуск
                </span>
                <span className="bg-neutral-950 text-[#FFE300] border border-neutral-950 text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-md font-mono">
                  BATTLE PASS
                </span>
              </div>
              <h3 className="text-xl md:text-3xl font-black text-neutral-950 mt-2 flex items-center gap-2">
                <Sparkles className="h-7 w-7 text-amber-500 fill-amber-500" />
                <span className="tracking-tight uppercase">ESG-Пропуск Волонтёра Столото</span>
              </h3>
              <p className="text-sm text-neutral-700 mt-1 leading-relaxed max-w-2xl font-bold">
                Накапливайте подтверждённые часы за добрые дела и открывайте эксклюзивный мерч Столото. Каждый рубеж открывает ценные подарки!
              </p>
            </div>

            <div className="bg-white border-2 border-neutral-950 px-6 py-4 rounded-2xl text-center shrink-0 min-w-[225px] shadow-[3px_3px_0px_#FFE300]">
              <span className="text-[11px] text-neutral-500 uppercase font-black block mb-0.5 tracking-wider font-mono">Мой баланс часов</span>
              <span className="text-4xl font-black text-neutral-950 tracking-tight">{hours} <span className="text-lg text-neutral-500 font-bold">ч.</span></span>
              <span className="text-[10px] text-neutral-905 font-black block mt-1 bg-amber-200 px-2 py-0.5 rounded-md border border-neutral-950">
                Получено мерча: {claimedRewards.length} из 5
              </span>
            </div>
          </div>

          {/* Gamified Slider Bar Container */}
          <div className="py-8 relative z-10">
            <h4 className="text-[11px] uppercase font-extrabold tracking-widest text-neutral-900 mb-6 flex items-center gap-2 font-mono">
              <span>Карта пути достижений</span>
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping"></span>
              <span className="text-amber-600 normal-case font-black">Ваш прогресс на шкале года</span>
            </h4>

            {/* Linear Connected Progress Line with explicit height to prevent margin collapsing or container squeeze */}
            <div className="relative h-16 my-16 px-4">
              {/* Backbar */}
              <div className="absolute top-1/2 left-0 right-0 h-3 bg-neutral-200 rounded-full transform -translate-y-1/2 border border-neutral-300" />
              {/* Filled Active Line with gradient in yellow shades */}
              <div 
                className="absolute top-1/2 left-0 h-3 bg-gradient-to-r from-yellow-300 via-[#FFE300] to-amber-500 rounded-full transform -translate-y-1/2 transition-all duration-700 border border-neutral-950 animate-pulse-slow"
                style={{ width: `${Math.min((hours / 150) * 100, 100)}%` }}
              />

              {/* Individual nodes positioned proportionally */}
              <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2 flex justify-between pointer-events-none px-2 font-sans">
                {battlePassRewards.map((reward) => {
                  const percentPos = (reward.hours / 150) * 100;
                  const isUnlocked = hours >= reward.hours;
                  const isClaimed = claimedRewards.includes(reward.id);

                  return (
                    <div 
                      key={reward.id} 
                      className="flex flex-col items-center relative font-sans"
                      style={{ left: `calc(${percentPos}% - 14px)`, position: 'absolute' }}
                    >
                      {/* Hour badge positioned safely ABOVE the node to eliminate card overlap */}
                      <span className="absolute -top-10 whitespace-nowrap text-[10.5px] font-black text-neutral-950 bg-white border-2 border-neutral-950 px-2 py-0.5 rounded-md font-mono shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                        {reward.hours} ч
                      </span>

                      <div 
                        className={`h-7 w-7 rounded-full border-2 flex items-center justify-center text-[11px] font-black tracking-tight transition-all duration-300 shadow-md ${
                          isClaimed 
                            ? "bg-neutral-100 border-neutral-400 text-neutral-450" 
                            : isUnlocked 
                            ? "bg-neutral-950 border-neutral-950 text-[#FFE300] scale-125 ring-4 ring-amber-400/30 font-black" 
                            : "bg-white border-neutral-400 text-neutral-700"
                        }`}
                      >
                        {isClaimed ? "✓" : isUnlocked ? "★" : reward.hours}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Grid of 5 Milestones with interactive hover states and claiming actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mt-16">
              {battlePassRewards.map((reward) => {
                const isUnlocked = hours >= reward.hours;
                const isClaimed = claimedRewards.includes(reward.id);

                return (
                  <div 
                    key={reward.id}
                    className={`rounded-2xl p-5 flex flex-col justify-between transition-all relative overflow-hidden text-left border-2 ${
                      isClaimed
                        ? "bg-neutral-50/75 border-neutral-300 text-neutral-500 opacity-80"
                        : isUnlocked
                        ? "bg-white border-neutral-950 text-neutral-950 shadow-[4px_4px_0px_#FFE300] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#FFE300]"
                        : "bg-neutral-50/50 border-neutral-250 text-neutral-400 opacity-70 filter grayscale"
                    }`}
                  >
                    {/* Level Label in corners */}
                    <div className="flex justify-between items-center mb-3.5">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-md font-mono font-black border ${
                        isClaimed 
                          ? "bg-neutral-100 text-neutral-500 border-neutral-300" 
                          : isUnlocked 
                          ? "bg-neutral-950 text-[#FFE300] border-neutral-950" 
                          : "bg-neutral-100/80 text-neutral-550 border-neutral-200"
                      }`}>
                        {reward.hours} ЧАСОВ
                      </span>

                      {isClaimed ? (
                        <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 inline-flex items-center gap-1 font-mono">✓ Получено</span>
                      ) : isUnlocked ? (
                        <span className="text-[10px] font-black text-amber-950 animate-pulse bg-[#FFE300] px-2 py-0.5 rounded border border-neutral-950 inline-flex items-center gap-1 font-mono">✦ Готово</span>
                      ) : (
                        <span className="text-[10px] font-bold text-neutral-500 font-mono">🔒 Закрыто</span>
                      )}
                    </div>

                    {/* Reward Image Asset simulation with huge emoji */}
                    <div className={`h-18 w-full rounded-xl flex items-center justify-center text-3xl mb-4 border-2 relative ${
                      isClaimed 
                        ? "bg-neutral-200/30 border-neutral-300" 
                        : isUnlocked 
                        ? "bg-neutral-100 border-neutral-950 shadow-inner" 
                        : "bg-neutral-100/50 border-neutral-200"
                    }`}>
                      <span className={isClaimed ? "opacity-65" : ""}>{reward.icon}</span>
                      {isUnlocked && !isClaimed && (
                        <div className="absolute inset-0 bg-[#FFE300]/15 rounded-xl border-2 border-dashed border-amber-400 animate-pulse pointer-events-none" />
                      )}
                    </div>

                    <div className="space-y-1.5 flex-grow">
                      <h5 className="font-extrabold text-[14.5px] text-neutral-950 leading-snug">
                        {reward.name}
                      </h5>
                      <p className="text-[11.5px] text-neutral-700 font-bold leading-relaxed line-clamp-3">
                        {reward.desc}
                      </p>
                    </div>

                    {/* Action Button inside node */}
                    <div className="mt-5 pt-3 border-t-2 border-neutral-100">
                      {isClaimed ? (
                        <button 
                          disabled 
                          className="w-full text-[10px] bg-neutral-100 text-neutral-400 p-2 rounded-xl font-bold cursor-not-allowed text-center uppercase tracking-wide font-mono border border-neutral-200"
                        >
                          Награда выдана
                        </button>
                      ) : isUnlocked ? (
                        <button 
                          onClick={() => handleClaimReward(reward.id)}
                          className="w-full text-[11px] bg-[#FFE300] hover:bg-neutral-950 hover:text-[#FFE300] text-neutral-950 border-2 border-neutral-950 font-black p-2.5 rounded-xl transition-all hover:scale-[1.03] text-center uppercase tracking-wide cursor-pointer font-mono shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:shadow-none"
                        >
                          🎁 Забрать мерч
                        </button>
                      ) : (
                        <button 
                          disabled 
                          className="w-full text-[10px] bg-neutral-50 text-neutral-400 p-2 rounded-xl font-semibold cursor-not-allowed text-center font-mono border border-neutral-150"
                        >
                          Нужно еще {reward.hours - hours} ч.
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Battle Pass Confetti Claim Modal */}
        {bpCongratsReward && (
          <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border-4 border-neutral-950 rounded-3xl p-6 md:p-8 max-w-sm w-full relative overflow-hidden text-center text-neutral-950 shadow-[8px_8px_0px_#FFE300] font-sans animate-fade-in animate-scale-up">
              {/* Radial gradient glow decor */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-500/10 rounded-full blur-[70px] pointer-events-none" />

              <div className="h-18 w-18 bg-[#FFE300]/20 text-neutral-900 rounded-full mx-auto flex items-center justify-center text-4xl mb-4 border-2 border-neutral-950 shadow-sm relative">
                <span>{bpCongratsReward.icon}</span>
                <span className="absolute -bottom-1 -right-1 text-base">🎉</span>
              </div>

              <span className="bg-neutral-950 text-[#FFE300] border border-neutral-950 text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full font-mono">
                Разблокирована награда
              </span>

              <h4 className="text-lg font-black text-neutral-950 mt-3">{bpCongratsReward.name}</h4>
              <p className="text-[12.5px] text-neutral-850 mt-2 leading-relaxed font-bold">
                Вы успешно обменяли ваши накопленные ESG-часы волонтёра на корпоративный подарок: <strong>{bpCongratsReward.name}</strong>!
              </p>

              <div className="mt-4 p-3 bg-neutral-50 border-2 border-neutral-950 text-[11.5px] text-neutral-800 text-left rounded-xl leading-relaxed space-y-1.5 font-sans">
                <span className="text-[10px] font-black text-amber-700 uppercase block tracking-wider font-mono">Как забрать мерч?</span>
                <p className="font-bold">1. Наша система автоматически зафиксировала успешную активацию награды.</p>
                <p className="font-bold">2. Координатор волонтерского движения Столото свяжется с вами по почте или телефону для согласования пункта выдачи или отправки промокода.</p>
                <p className="font-bold">3. Выдача физических призов проходит в главном офисе Столото или рассылается почтой.</p>
              </div>

              <div className="mt-5">
                <button
                  onClick={() => setBpCongratsReward(null)}
                  className="w-full bg-[#FFE300] hover:bg-neutral-950 hover:text-[#FFE300] text-neutral-900 border-2 border-neutral-950 font-black text-xs py-3 rounded-xl transition-all hover:scale-[1.02] cursor-pointer shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:shadow-none"
                >
                  ОТЛИЧНО, ЖДУ!
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Applications list ("мои отклики и история") */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 text-left shadow-sm space-y-4 pt-5 font-sans">
          <div className="border-b border-neutral-100 pb-3 flex items-center gap-2">
            <List className="h-4.5 w-4.5 text-[#D70066]" />
            <h3 className="font-extrabold text-base text-[#000000]">История вашего участия (мои отклики)</h3>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">Здесь выводятся все ваши отклики, статусы одобрения и начисленные часы.</p>

          {applications.length === 0 ? (
            <div className="py-8 text-center text-neutral-400 text-xs">
              У вас пока нет поданных заявок на волонтёрство. Откройте ленту и выберите доброе дело на выбор!
            </div>
          ) : (
            <div className="divide-y divide-neutral-200">
              {applications.map((app) => (
                <div key={app.id} className="py-4 first:pt-0 last:pb-0 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="font-bold text-neutral-950 text-sm">{app.taskTitle}</h4>
                    <span className={`px-2.5 py-1 rounded text-[10px] font-bold border uppercase tracking-wide ${getAppStatusStyle(app.status)}`}>
                      {getAppStatusLabel(app.status)}
                    </span>
                  </div>

                  <p className="text-[10.5px] text-neutral-400">
                    Отклик отправлен: {new Date(app.createdAt).toLocaleDateString("ru-RU")}
                  </p>

                  {app.fundComment && (
                    <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200 text-[11px] text-neutral-600 mt-1">
                      <span className="font-bold text-neutral-805 block mb-0.5 text-[10px] uppercase">Комментарий фонда организатора:</span>
                      «{app.fundComment}»
                    </div>
                  )}

                  {app.status === "completed" && (
                    <div className="bg-green-50/50 p-2.5 rounded-lg border border-green-200 text-[11px] text-neutral-900 mt-1 flex items-center justify-between">
                      <div>
                        <span className="font-bold block text-[10px] text-emerald-850 uppercase tracking-wide font-sans">Подтверждено администрацией Столото</span>
                        Зачислено: <strong className="text-xs">{app.hoursAwarded || 0} ч.</strong> в ваш профиль активности.
                      </div>
                      <span className="bg-green-600 text-white font-bold text-[9px] px-2 py-0.5 rounded uppercase tracking-wider inline-flex items-center gap-0.5">
                        <Check className="h-3 w-3" /> Начислено
                      </span>
                    </div>
                  )}

                  {app.status === "pending" && (
                    <button
                      onClick={() => handleCancelApp(app.id)}
                      className="text-[11px] text-neutral-450 hover:text-red-650 font-bold hover:underline cursor-pointer bg-transparent border-0 p-0"
                    >
                      Отозвать отклик
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {confirmModal && confirmModal.isOpen && (
          <div className="fixed inset-0 z-[999] bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl p-6 max-w-sm w-full space-y-4 text-left font-sans">
              <h4 className="font-extrabold text-sm text-neutral-900 uppercase tracking-wider">
                {confirmModal.title}
              </h4>
              <p className="text-xs text-neutral-600 leading-relaxed">
                {confirmModal.message}
              </p>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  onClick={() => setConfirmModal(null)}
                  className="bg-neutral-100 hover:bg-neutral-200 text-neutral-850 font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  onClick={() => {
                    confirmModal.onConfirm();
                    setConfirmModal(null);
                  }}
                  className="bg-red-600 hover:bg-red-750 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
                >
                  Отозвать
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (isFundModalOpen) {
    return (
      <div id="volunteer-fund-details-page" className="w-full space-y-6">
        {/* Top Header Card */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs text-left font-sans animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-emerald-600 text-white rounded-full flex items-center justify-center font-black text-lg shrink-0">
              🏢
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-neutral-400 block font-mono">Карточка организации</span>
              <h2 className="text-xl font-extrabold text-neutral-950 flex items-center gap-2">
                <span>{isFundLoading ? "Загрузка..." : selectedFundData?.fund?.name || "Информация о благотворительном фонде"}</span>
              </h2>
            </div>
          </div>
          <button
            onClick={() => setIsFundModalOpen(false)}
            className="inline-flex items-center gap-1.5 bg-[#FFE300] hover:bg-amber-400 text-black font-extrabold text-xs px-4.5 py-3 rounded-2xl transition-all shadow-sm cursor-pointer hover:scale-[1.03]"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
            <span>Вернуться назад</span>
          </button>
        </div>

        {/* Content body inside a beautiful white container card */}
        <div className="bg-white rounded-3xl border border-neutral-200 p-6 md:p-8 text-left shadow-sm font-sans animate-fade-in">
          {isFundLoading && (
            <div className="py-24 flex flex-col items-center justify-center space-y-3">
              <div className="h-10 w-10 border-4 border-[#FFE300] border-t-emerald-600 rounded-full animate-spin"></div>
              <span className="text-xs text-neutral-500 font-bold">Получение данных от куратора...</span>
            </div>
          )}

          {fundError && (
            <div className="p-5 bg-red-50 text-red-900 text-sm rounded-2xl border border-red-200 flex flex-col gap-2">
              <strong className="font-bold">⚠️ Произошла ошибка при загрузке:</strong>
              <p>{fundError}</p>
              <button
                onClick={() => setIsFundModalOpen(false)}
                className="w-fit bg-red-650 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
              >
                Вернуться
              </button>
            </div>
          )}

          {selectedFundData && (
            <div className="space-y-8">
              {/* Description box */}
              <div className="bg-neutral-50 p-6 rounded-2xl border border-neutral-150 relative text-sm">
                <h3 className="text-xs text-[#D70066] font-bold uppercase tracking-wider mb-2 font-sans">О деятельности организации</h3>
                <p className="text-neutral-700 leading-relaxed font-sans font-medium text-sm md:text-base">
                  {selectedFundData.fund.description || "Официальное описание деятельности благотворительной организации временно находится на сверке у юридической службы."}
                </p>
              </div>

              {/* Location, Web, and Contacts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm font-sans">
                <div className="space-y-4">
                  <h3 className="text-xs text-neutral-400 font-bold uppercase tracking-wider font-sans">📍 Сфера присутствия</h3>
                  <div className="flex items-center gap-3 text-neutral-700 font-medium text-sm">
                    <MapPin className="h-5 w-5 text-emerald-600 shrink-0" />
                    <span>Город проведения: <strong>{selectedFundData.fund.city || "Москва"}</strong></span>
                  </div>
                  {selectedFundData.fund.website && (
                    <div className="flex items-center gap-3 text-neutral-700 font-medium text-sm">
                      <Globe className="h-5 w-5 text-emerald-600 shrink-0" />
                      <span>Сайт фонда: 
                        <a 
                          href={selectedFundData.fund.website.startsWith("http") ? selectedFundData.fund.website : `https://${selectedFundData.fund.website}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-[#D70066] hover:underline font-bold ml-1.5 cursor-pointer"
                        >
                          {selectedFundData.fund.website}
                        </a>
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-4 border-t sm:border-t-0 sm:border-l border-neutral-150 pt-4 sm:pt-0 sm:pl-6">
                  <h3 className="text-xs text-neutral-400 font-bold uppercase tracking-wider font-sans">📞 Контакты куратора</h3>
                  <div className="flex items-center gap-3 text-neutral-700 font-medium text-sm">
                    <User className="h-5 w-5 text-emerald-600 shrink-0" />
                    <span>{selectedFundData.fund.contactName || "Куратор ответственного отдела"} 
                      {selectedFundData.fund.contactPosition && <span className="text-neutral-450 block text-xs">({selectedFundData.fund.contactPosition})</span>}
                    </span>
                  </div>
                  {(selectedFundData.fund.phone || selectedFundData.fund.email) && (
                    <div className="flex flex-col gap-2 pt-2 border-t border-neutral-100 mt-2">
                      {selectedFundData.fund.phone && (
                        <span className="font-mono text-neutral-600 text-xs flex items-center gap-2">
                          <Phone className="h-4 w-4 text-neutral-400 shrink-0" />
                          {selectedFundData.fund.phone}
                        </span>
                      )}
                      {selectedFundData.fund.email && (
                        <span className="font-mono text-neutral-600 text-xs flex items-center gap-2">
                          <Mail className="h-4 w-4 text-neutral-400 shrink-0" />
                          {selectedFundData.fund.email}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Categories tags line */}
              {selectedFundData.fund.categories && selectedFundData.fund.categories.length > 0 && (
                <div className="space-y-3 text-sm border-t border-neutral-100 pt-6">
                  <h3 className="text-xs text-neutral-400 font-bold uppercase tracking-wider font-sans">🎯 Основные категории помощи</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedFundData.fund.categories.map((cat: string) => {
                      const isChildren = cat.includes("Дет");
                      const isEco = cat.includes("Экол");
                      const isPro = cat.includes("Pro") || cat.includes("интел");
                      const isElderly = cat.includes("Пож") || cat.includes("Соци");
                      const bgClass = isChildren 
                        ? "bg-rose-50 text-rose-800 border-rose-200" 
                        : isEco 
                        ? "bg-green-50 text-green-850 border-green-200" 
                        : isPro 
                        ? "bg-yellow-50 text-yellow-900 border-yellow-250"
                        : isElderly
                        ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                        : "bg-neutral-50 text-neutral-700 border-neutral-205";
                      return (
                        <span key={cat} className={`text-xs uppercase font-bold border px-3 py-1.5 rounded-full ${bgClass}`}>
                          ✦ {cat}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Dynamic directions guidelines */}
              <div className="space-y-3 border-t border-neutral-100 pt-6">
                <h3 className="text-xs text-[#D70066] font-bold uppercase tracking-wider font-sans">📋 Направления волонтёрства на платформе Столото</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {getDirectionsForCategories(selectedFundData.fund.categories || []).map((dir, idx) => (
                    <div key={idx} className="bg-amber-50/25 border border-amber-200/50 rounded-2xl p-4 text-sm text-left">
                      <h4 className="font-bold text-neutral-900 flex items-center gap-2 mb-1.5 text-xs uppercase tracking-wide font-sans">
                        <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
                        <span>{dir.title}</span>
                      </h4>
                      <p className="text-neutral-650 leading-relaxed text-xs font-sans">{dir.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Platform performance statistics (Bento stats grid) */}
              <div className="space-y-4 pt-6 border-t border-neutral-100">
                <h3 className="text-xs text-neutral-850 font-black uppercase tracking-wider font-sans">📊 Статистика фонда на платформе Столото</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-150">
                    <span className="text-xs text-neutral-400 block font-bold">Опубликовано</span>
                    <span className="text-xl font-black text-neutral-900 tracking-tight font-mono">{selectedFundData.stats.totalTasks}</span>
                    <span className="text-[10px] text-neutral-400 block mt-0.5">заданий всего</span>
                  </div>
                  <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-150">
                    <span className="text-xs text-neutral-400 block font-bold">Активные</span>
                    <span className="text-xl font-black text-emerald-700 tracking-tight font-mono">{selectedFundData.stats.publishedTasksCount}</span>
                    <span className="text-[10px] text-neutral-400 block mt-0.5">наборов сейчас</span>
                  </div>
                  <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-150">
                    <span className="text-xs text-neutral-400 block font-bold">Волонтёры</span>
                    <span className="text-xl font-black text-indigo-700 tracking-tight font-mono">{selectedFundData.stats.volunteersCount}</span>
                    <span className="text-[10px] text-neutral-400 block mt-0.5">участников</span>
                  </div>
                  <div className="bg-[#FFE300]/10 p-4 rounded-2xl border border-[#FFE300]/30">
                    <span className="text-xs text-rose-800 block font-bold">Общие часы</span>
                    <span className="text-xl font-black text-rose-700 tracking-tight font-mono">~{selectedFundData.stats.totalHoursDistributed} ч.</span>
                    <span className="text-[10px] text-neutral-400 block mt-0.5">добрых дел</span>
                  </div>
                </div>
              </div>

              {/* Active and Completed Tasks list timeline */}
              <div className="space-y-4 pt-6 border-t border-neutral-100">
                <h3 className="text-xs text-neutral-850 font-black uppercase tracking-wider font-sans">🗺️ Хронология добрых дел фонда</h3>
                
                <div className="space-y-3">
                  {selectedFundData.tasks.length === 0 ? (
                    <p className="text-xs text-neutral-400 italic">Задания фонда проходят обязательную проверку модераторами Столото.</p>
                  ) : (
                    <div className="divide-y divide-neutral-200 border border-neutral-200 rounded-2xl overflow-hidden bg-white text-xs">
                      {selectedFundData.tasks.map((t: any) => {
                        const isOpen = t.status === 'published';
                        const isCompleted = t.status === 'completed';
                        return (
                          <div key={t.id} className="p-4 hover:bg-neutral-50/50 transition flex items-center justify-between gap-4">
                            <div className="min-w-0 flex-1 text-left">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8.5px] font-bold uppercase tracking-wide mr-2 ${
                                isOpen 
                                  ? "bg-green-100 text-emerald-800 border border-green-200" 
                                  : "bg-neutral-100 text-neutral-500"
                              }`}>
                                {isOpen ? 'Набор' : isCompleted ? 'Проект закрыт' : 'На модерации'}
                              </span>
                              <span className="text-[10px] text-neutral-400 font-bold font-sans uppercase tracking-wider">{t.category}</span>
                              <h4 className="font-extrabold text-neutral-900 text-sm mt-1 truncate" title={t.title}>{t.title}</h4>
                              <p className="text-[11px] text-neutral-500 mt-0.5 leading-normal">
                                ⏰ Дата: <strong className="text-neutral-850">{t.eventDate || "Гибкий"}</strong> • Награда: <strong className="text-amber-800 font-mono">~{t.hoursEstimation} волонтёрских часа</strong>
                              </p>
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => {
                                const fullTask = tasks.find(item => item.id === t.id);
                                if (fullTask) {
                                  setSelectedTask(fullTask);
                                  setIsFundModalOpen(false);
                                } else {
                                  alert("Задание временно недоступно для просмотра");
                                }
                              }}
                              className="p-1 px-4 bg-neutral-100 hover:bg-[#FFE300] hover:text-neutral-950 text-neutral-800 text-xs font-bold rounded-xl transition shrink-0 cursor-pointer font-sans"
                            >
                              Перейти
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div id="volunteer-cabinet-root" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* LEFT COLUMN: User Profile details & Filters */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-5 text-left shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-neutral-900 text-white rounded-full flex items-center justify-center font-bold shrink-0">
              {user.name.split(" ").map(n => n[0]).join("")}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-sm text-[#000000] truncate">{user.name}</h3>
              <p className="text-[10.5px] text-neutral-500 font-mono truncate">{user.position || "Волонтёр"} | {user.department || "Столото"}</p>
              <p className="text-[10px] text-neutral-400 font-mono truncate mt-0.5" title={user.email}>{user.email}</p>
            </div>
          </div>

          <div className="pt-3.5 border-t border-neutral-100 space-y-3">
            <p className="text-xs text-neutral-550 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-[#D70066] shrink-0" />
              <span>{user.isEmployee !== false ? "Город подразделения" : "Город"}: <strong>{user.city}</strong></span>
            </p>

            <button
              id="sidebar-lk-btn"
              onClick={() => setActiveTab("profile")}
              className="w-full bg-[#FFE300] hover:bg-amber-400 text-black py-2.5 px-4 rounded-xl font-extrabold text-xs transition duration-200 ease-in-out transform hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-xs border border-amber-300"
            >
              <User className="h-3.5 w-3.5 shrink-0" />
              <span>Личный кабинет</span>
            </button>
          </div>
        </div>

        {/* Filters sidebar shown here if activeTab is "feed" */}
        {activeTab === "feed" && (
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 space-y-4 shadow-sm text-left">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-150">
              <span className="text-xs font-extrabold uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
                <Filter className="h-4 w-4 text-[#D70066]" />
                Фильтры заданий
              </span>
              
              <button
                onClick={() => {
                  setFormatFilter("");
                  setCategoryFilter("");
                  setFundFilter("");
                  setDeadlineFilter("");
                  setSeatsFilter("");
                  setRecruitmentStatusFilter("");
                  setSearchQuery("");
                  setCityFilter("");
                  setSkillsFilter("");
                }}
                className="text-[10px] bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold px-2.5 py-1 rounded-lg transition"
              >
                Очистить все
              </button>
            </div>

            {/* 1. Направление помощи */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                📁 Направление помощи
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full text-xs bg-neutral-50 p-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:border-[#FFE300] font-medium"
              >
                <option value="">Все направления</option>
                <option value="Дети">Дети</option>
                <option value="Пожилые">Пожилые</option>
                <option value="ОВЗ">ОВЗ</option>
                <option value="Экология">Экология</option>
                <option value="Животные">Животные</option>
                <option value="Донорство">Донорство</option>
                <option value="Pro-bono">Pro-bono</option>
              </select>
            </div>

            {/* 2. Фонд */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                🏢 Благотворительный фонд
              </label>
              <select
                value={fundFilter}
                onChange={(e) => setFundFilter(e.target.value)}
                className="w-full text-xs bg-neutral-50 p-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:border-[#FFE300] font-medium"
              >
                <option value="">Все фонды</option>
                {uniqueFunds.map(fund => (
                  <option key={fund} value={fund}>{fund}</option>
                ))}
              </select>
            </div>

            {/* 3. Дедлайн */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                📅 Дедлайн набора (не позднее)
              </label>
              <input
                type="date"
                value={deadlineFilter}
                onChange={(e) => setDeadlineFilter(e.target.value)}
                className="w-full text-xs bg-neutral-50 p-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:border-[#FFE300] font-sans"
              />
            </div>

            {/* 4. Формат участия */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                📍 Формат проведения
              </label>
              <div className="grid grid-cols-3 lg:grid-cols-1 gap-1.5 pt-0.5 font-sans">
                {[
                  { value: "", label: "Все форматы" },
                  { value: "online", label: "💻 Онлайн" },
                  { value: "offline", label: "📍 Офлайн" }
                ].map(fmt => {
                  const active = formatFilter === fmt.value;
                  return (
                    <button
                      key={fmt.value}
                      type="button"
                      onClick={() => setFormatFilter(fmt.value)}
                      className={`text-[11px] py-1.5 px-2 text-center lg:text-left font-bold rounded-lg transition-all border ${
                        active
                          ? "bg-[#FFE300] text-black border-[#FFE300] shadow-xs font-extrabold"
                          : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
                      }`}
                    >
                      {fmt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. Количество свободных мест */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                👥 Свободных мест (не менее)
              </label>
              <input
                type="number"
                min="0"
                placeholder="Например, 2"
                value={seatsFilter}
                onChange={(e) => setSeatsFilter(e.target.value)}
                className="w-full text-xs bg-neutral-50 p-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:border-[#FFE300] font-sans"
              />
            </div>

            {/* 6. Текущий статус набора */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                ⚡ Текущий статус набора
              </label>
              <select
                value={recruitmentStatusFilter}
                onChange={(e) => setRecruitmentStatusFilter(e.target.value)}
                className="w-full text-xs bg-neutral-50 p-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:border-[#FFE300] font-medium"
              >
                <option value="">Любой</option>
                <option value="open">🟢 Идет набор (есть места)</option>
                <option value="full">🔴 Мест нет</option>
              </select>
            </div>

            {/* 7. Город проведения */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                📍 Город проведения
              </label>
              <input
                type="text"
                placeholder="Свободный ввод города..."
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-full text-xs bg-neutral-50 p-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:border-[#FFE300] font-sans font-medium"
              />
            </div>

            {/* 8. Профессиональные навыки */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                💼 Требования / Проф. навыки
              </label>
              <input
                type="text"
                placeholder="Навыки кандидата..."
                value={skillsFilter}
                onChange={(e) => setSkillsFilter(e.target.value)}
                className="w-full text-xs bg-neutral-50 p-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:border-[#FFE300] font-sans font-medium"
              />
            </div>

          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Interactive Tabs & Core Action lists */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* ==================================== */}
        {/* VIEW 1: TASK FEED directly (width is expanded now) */}
        {/* ==================================== */}
        {activeTab === "feed" && (
          <div className="space-y-4 w-full text-left">
            
            {/* Simple Search bar */}
            <div className="bg-white p-3 rounded-2xl border border-neutral-200 flex gap-2 items-center shadow-sm">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 text-neutral-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Быстрый поиск по названию или описанию..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs md:text-sm bg-[#F5F5F5] pl-9 pr-4 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:border-[#FFE300]"
                />
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-xs font-bold text-neutral-500 hover:text-black hover:underline"
                >
                  Очистить поиск
                </button>
              )}
            </div>

            {/* Task count tracker */}
            <div className="text-left py-0.5 px-1 flex justify-between items-center">
              <span className="text-xs text-neutral-500 font-medium font-sans">
                Найдено проектов: <strong>{filteredTasks.length}</strong>
              </span>
              {(formatFilter || categoryFilter || fundFilter || deadlineFilter || seatsFilter || recruitmentStatusFilter || searchQuery || cityFilter || skillsFilter) && (
                <span className="text-[10px] bg-[#FFE300]/20 text-black border border-[#FFE300]/40 px-2 py-0.5 rounded font-bold font-sans">
                  Фильтры активны
                </span>
              )}
            </div>

            {/* Tasks Grid */}
            {filteredTasks.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-neutral-200 shadow-sm">
                <HelpCircle className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
                <h4 className="font-bold text-sm text-neutral-750">Нет подходящих заданий</h4>
                <p className="text-xs text-neutral-400 mt-1 font-sans">Ослабьте или очистите фильтры слева.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTasks.map((task) => {
                  const alreadyApplied = applications.some(a => a.taskId === task.id);
                  const isFull = task.joinedParticipants >= task.maxParticipants;
                  
                  return (
                    <div
                      key={task.id}
                      onClick={() => {
                        setSelectedTask(task);
                        setSelectedVacancyId(task.vacancies?.[0]?.id || "default");
                      }}
                      className="bg-white rounded-2xl border border-neutral-200 p-5 text-left hover:border-[#FFE300] hover:shadow-lg transition-all flex flex-col justify-between cursor-pointer font-sans"
                    >
                      <div>
                        {/* Upper category tags using vivid colors */}
                        <div className="flex justify-between items-start gap-2 mb-3">
                          <span className={getCategoryBadgeClass(task.category)}>
                            {task.category}
                          </span>
                          
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-mono font-bold bg-yellow-50 text-neutral-900 border border-yellow-250 px-2 py-0.5 rounded">
                              ~{task.hoursEstimation} волонтёрских часа
                            </span>
                          </div>
                        </div>

                        {/* Title block with mini-image alongside */}
                        <div className="flex items-start gap-3.5 mb-3">
                          {task.imageUrl && (
                            <img
                              src={task.imageUrl}
                              alt={task.title}
                              referrerPolicy="no-referrer"
                              className="w-14 h-14 object-cover rounded-xl shrink-0 border border-neutral-150 shadow-xs"
                            />
                          )}
                          <div>
                            <h3 className="font-extrabold text-[#000000] text-sm leading-tight hover:text-neutral-700 transition-colors">
                              {task.title}
                            </h3>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openFundModal(task.fundId || task.fundName);
                              }}
                              className="text-[10.5px] text-emerald-600 hover:text-emerald-850 font-extrabold uppercase tracking-wider mt-1 block hover:underline transition text-left cursor-pointer"
                              title="Посмотреть подробную информацию о фонде"
                            >
                              🏢 {task.fundName}
                            </button>
                          </div>
                        </div>

                      </div>

                      <div className="space-y-3 pt-3 border-t border-neutral-100 text-[11px] text-[#333333]">
                        {/* Event parameters block */}
                        <div className="flex flex-col gap-1.5 text-neutral-600">
                          <span className="flex items-center gap-1.5 text-[11px]">
                            <Calendar className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                            <span>Период регистрации: <strong className="text-neutral-900">с {task.regStart || "2026-05-20"} по {task.deadline}</strong></span>
                          </span>
                          <span className="flex items-center gap-1.5 text-[11px]">
                            <Clock className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                            <span>Время проведения: <strong className="text-neutral-900">{task.eventTime || "12:00 - 16:00"} {task.eventDate ? `(${task.eventDate})` : ""}</strong></span>
                          </span>
                          <span className="flex items-center gap-1.5 text-[11px]">
                            <MapPin className="h-3.5 w-3.5 text-[#D70066] shrink-0" />
                            <span className="truncate">Адрес: <strong className="text-neutral-900" title={task.location}>{task.location} ({task.city})</strong></span>
                          </span>
                        </div>

                        {/* Joined status indicator */}
                        <div className="flex justify-between items-center pt-1.5 border-t border-dotted border-neutral-100">
                          <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                              Места: {task.joinedParticipants} из {task.maxParticipants}
                            </span>
                          </div>
                          
                          {alreadyApplied ? (
                            <span className="text-[10px] bg-yellow-105 text-neutral-950 px-2 py-0.5 rounded font-black uppercase tracking-wider border border-yellow-250">
                              Вы откликнулись
                            </span>
                          ) : isFull ? (
                            <span className="text-[10px] bg-neutral-100 text-neutral-400 px-2 py-0.5 rounded font-bold">
                              Мест нет
                            </span>
                          ) : (
                            <span className="text-[10px] text-neutral-900 font-black flex items-center gap-0.5 hover:underline">
                              Подробнее <ChevronRight className="h-3.5 w-3.5 animate-pulse" />
                            </span>
                          )}
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* ==================================== */}
        {/* VIEW 2: VOLUNTEER'S PERSONAL CABINET & ACHIEVEMENTS */}
        {/* ==================================== */}
        {false && activeTab === "profile" && (
          <div className="space-y-6 text-left">
            
            {/* Top Row: Info Details & Gamified Progress */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
              
              {/* Profile Card & Editing */}
              <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center pb-4 border-b border-neutral-100 mb-4">
                    <h3 className="font-extrabold text-base text-neutral-900 flex items-center gap-2">
                      <User className="h-5 w-5 text-[#D70066]" />
                      <span>Общая информация</span>
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

                  {errorMessage && (
                    <div className="bg-red-50 border border-red-100 text-red-650 text-xs p-3 rounded-lg mb-3">
                      {errorMessage}
                    </div>
                  )}
                  {successMessage && (
                    <div className="bg-green-50 border border-green-150 text-green-700 text-xs p-3 rounded-lg mb-3 font-semibold">
                      {successMessage}
                    </div>
                  )}

                  {!isEditingProfile ? (
                    <div className="space-y-3.5 text-xs text-neutral-800">
                      <div>
                        <span className="text-neutral-400 block text-[9px] uppercase font-bold tracking-wider">ФИО волонтёра</span>
                        <strong className="text-sm font-black text-neutral-950">{user.name}</strong>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-neutral-400 block text-[9px] uppercase font-bold tracking-wider">
                            {user.isEmployee !== false ? "Город подразделения" : "Город"}
                          </span>
                          <strong className="font-semibold text-neutral-900">{user.city}</strong>
                        </div>
                        <div>
                          <span className="text-neutral-400 block text-[9px] uppercase font-bold tracking-wider">Электронная почта</span>
                          <strong className="font-mono text-neutral-900 font-medium">{user.email}</strong>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-neutral-400 block text-[9px] uppercase font-bold tracking-wider">
                            {user.isEmployee !== false ? "Подразделение Столото" : "Организация"}
                          </span>
                          <strong className="font-semibold text-neutral-900">{user.department || "Не указано"}</strong>
                        </div>
                        <div>
                          <span className="text-neutral-400 block text-[9px] uppercase font-bold tracking-wider">
                            {user.isEmployee !== false ? "Должность" : "Род занятий / должность"}
                          </span>
                          <strong className="font-semibold text-neutral-900">{user.position || "Не указано"}</strong>
                        </div>
                      </div>

                      <div>
                        <span className="text-neutral-400 block text-[9px] uppercase font-bold tracking-wider">Телефон для связи</span>
                        <span className="font-mono text-neutral-800 font-semibold">{user.phone || "Не указан (нажмите Исправить)"}</span>
                      </div>

                      <div className="pt-2 flex items-center gap-3">
                        <div className="bg-yellow-50 text-neutral-900 border border-yellow-250 rounded-xl py-2 px-3 flex-1 flex items-center gap-2">
                          <Clock className="h-5 w-5 text-amber-700 shrink-0" />
                          <div>
                            <span className="text-[9px] text-neutral-500 uppercase block font-bold leading-none">Отработано ESG</span>
                            <span className="text-sm font-black text-amber-855 leading-none">{hours} ч.</span>
                          </div>
                        </div>

                        <div className="bg-[#00A8CC]/10 text-[#00A8CC] border border-[#00A8CC]/20 rounded-xl py-2 px-3 flex-1">
                          <span className="text-[9px] text-neutral-500 uppercase block font-bold leading-none">Личный статус</span>
                          <span className="text-sm font-black leading-none">{user.volunteerStatus || "Новичок"}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSaveVolunteerProfile} className="space-y-3 text-xs">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-neutral-600">ФИО *</label>
                        <input
                          type="text"
                          required
                          value={editVoltName}
                          onChange={(e) => setEditVoltName(e.target.value)}
                          className="w-full text-xs bg-neutral-50 p-2 rounded-lg border border-neutral-200 focus:outline-none focus:border-[#FFE300]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-neutral-600">Город *</label>
                          <input
                            type="text"
                            required
                            value={editVoltCity}
                            onChange={(e) => setEditVoltCity(e.target.value)}
                            className="w-full text-xs bg-neutral-50 p-2 rounded-lg border border-neutral-200 focus:outline-none focus:border-[#FFE300]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-neutral-600">Телефон</label>
                          <input
                            type="text"
                            value={editVoltPhone}
                            onChange={(e) => setEditVoltPhone(e.target.value)}
                            placeholder="+7 (999) 000-00-00"
                            className="w-full text-xs bg-neutral-50 p-2 rounded-lg border border-neutral-200 focus:outline-none focus:border-[#FFE300]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-neutral-600">
                            {user.isEmployee !== false ? "Подразделение Столото" : "Организация"}
                          </label>
                          <input
                            type="text"
                            value={editVoltDepartment}
                            onChange={(e) => setEditVoltDepartment(e.target.value)}
                            className="w-full text-xs bg-neutral-50 p-2 rounded-lg border border-neutral-200 focus:outline-none focus:border-[#FFE300]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-neutral-600">
                            {user.isEmployee !== false ? "Должность" : "Род занятий / должность"}
                          </label>
                          <input
                            type="text"
                            value={editVoltPosition}
                            onChange={(e) => setEditVoltPosition(e.target.value)}
                            className="w-full text-xs bg-neutral-50 p-2 rounded-lg border border-neutral-200 focus:outline-none focus:border-[#FFE300]"
                          />
                        </div>
                      </div>

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
                          Сохранить профиль
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>

              {/* Achievements & Milestones */}
              <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm space-y-4 flex flex-col justify-between">
                <div>
                  <h3 className="font-extrabold text-base text-neutral-900 flex items-center gap-2 pb-4 border-b border-neutral-100">
                    <Award className="h-5 w-5 text-yellow-600" />
                    <span>Уровень и Достижения</span>
                  </h3>

                  {/* Level progress meter with real numbers */}
                  <div className="pt-3 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-extrabold text-neutral-805">
                        Звание: <strong className="text-neutral-900 bg-neutral-900 text-white px-2 py-0.5 rounded text-[10px]">{user.volunteerStatus || "Новичок"}</strong>
                      </span>
                      <span className="text-[10px] font-bold text-neutral-405">
                        Опыт по ESG часам: {hours} ч. из {hours >= 20 ? 20 : (hours >= 10 ? 20 : 10)} ч.
                      </span>
                    </div>

                    <div className="w-full bg-neutral-100 h-2.5 rounded-full overflow-hidden border border-neutral-200">
                      <div
                        className="bg-gradient-to-r from-yellow-500 to-amber-600 h-full rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <p className="text-[9.5px] text-neutral-400 font-medium">
                      {hours >= 20 
                        ? "🎉 Вы достигли наивысшего статуса Лидера Столото!" 
                        : `До звания "${nextLevelName}" осталось накопить еще ${hoursNeededForNext - hours} ч.`}
                    </p>
                  </div>

                  {/* Badges Grid */}
                  <div className="pt-4">
                    <span className="text-[9px] text-neutral-400 font-extrabold uppercase tracking-wider block mb-2.5">Заслуженные ESG ордена</span>
                    
                    <div className="grid grid-cols-2 xl:grid-cols-3 gap-2">
                      {BADGE_LIST.map((badge) => {
                        const isUnlocked = (user.badges && user.badges.includes(badge.key)) || applications.some(a => a.status === "completed" && tasks.find(t => t.id === a.taskId)?.category === badge.key);
                        return (
                          <div
                            key={badge.key}
                            className={`p-2.5 rounded-xl border flex flex-col justify-between transition-all relative overflow-hidden ${
                              isUnlocked
                                ? "bg-white border-neutral-200 shadow-xs"
                                : "bg-neutral-50/70 border-neutral-200/50 opacity-60"
                            }`}
                          >
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span className={`text-[9.5px] leading-tight font-extrabold uppercase p-1 rounded ${isUnlocked ? badge.color : "bg-neutral-200 text-neutral-400"}`}>
                                  {badge.title.split(" ")[0]}
                                </span>
                                {isUnlocked ? (
                                  <span className="text-emerald-600 font-bold text-[9px]">✓</span>
                                ) : (
                                  <span className="text-neutral-400 font-bold text-[9px]">🔒</span>
                                )}
                              </div>
                              <h4 className="font-extrabold text-[10px] text-neutral-900 leading-tight">
                                {badge.title}
                              </h4>
                              <p className="text-[8.5px] text-neutral-400 leading-tight mt-0.5">
                                {badge.desc}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              </div>

            </div>

            {/* Applications list ("мои отклики и история") */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6 text-left shadow-sm space-y-4 pt-5">
              <div className="border-b border-neutral-100 pb-3 flex items-center gap-2">
                <List className="h-4.5 w-4.5 text-[#D70066]" />
                <h3 className="font-extrabold text-base text-[#000000]">История вашего участия</h3>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">Здесь выводятся все ваши отклики, статусы одобрения и начисленные часы.</p>

              {applications.length === 0 ? (
                <div className="py-8 text-center text-neutral-400 text-xs">
                  У вас пока нет поданных заявок на волонтёрство. Откройте ленту и выберите доброе дело на выбор!
                </div>
              ) : (
                <div className="divide-y divide-neutral-200">
                  {applications.map((app) => (
                    <div key={app.id} className="py-4 first:pt-0 last:pb-0 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="font-bold text-neutral-950 text-sm">{app.taskTitle}</h4>
                        <span className={`px-2.5 py-1 rounded text-[10px] font-bold border uppercase tracking-wide ${getAppStatusStyle(app.status)}`}>
                          {getAppStatusLabel(app.status)}
                        </span>
                      </div>

                      <p className="text-[10.5px] text-neutral-400">
                        Отклик отправлен: {new Date(app.createdAt).toLocaleDateString("ru-RU")}
                      </p>

                      {app.fundComment && (
                        <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200 text-[11px] text-neutral-600 mt-1">
                          <span className="font-bold text-neutral-805 block mb-0.5 text-[10px] uppercase">Комментарий фонда организатора:</span>
                          «{app.fundComment}»
                        </div>
                      )}

                      {app.status === "completed" && (
                        <div className="bg-green-50/50 p-2.5 rounded-lg border border-green-200 text-[11px] text-neutral-900 mt-1 flex items-center justify-between">
                          <div>
                            <span className="font-bold block text-[10px] text-emerald-850 uppercase tracking-wide font-sans">Подтверждено администрацией Столото</span>
                            Зачислено: <strong className="text-xs">{app.hoursAwarded || 0} ч.</strong> в ваш профиль активности.
                          </div>
                          <span className="bg-green-600 text-white font-bold text-[9px] px-2 py-0.5 rounded uppercase tracking-wider inline-flex items-center gap-0.5">
                            <Check className="h-3 w-3" /> Начислено
                          </span>
                        </div>
                      )}

                      {app.status === "pending" && (
                        <button
                          onClick={() => handleCancelApp(app.id)}
                          className="text-[10px] text-neutral-405 hover:text-red-650 font-bold hover:underline cursor-pointer bg-transparent border-0 p-0"
                        >
                          Отозвать отклик
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {selectedTask && (() => {
        const taskVacancies = selectedTask.vacancies && selectedTask.vacancies.length > 0
          ? selectedTask.vacancies
          : [
              {
                id: "default",
                name: "Волонтёр мероприятия",
                address: selectedTask.location || "Указано в описании",
                duties: selectedTask.description || "Помощь в организационных процессах благотворительного мероприятия.",
                conditions: selectedTask.conditions && selectedTask.conditions.length > 0 ? selectedTask.conditions : ["Верифицированные часы"],
                requirements: selectedTask.requirements ? [selectedTask.requirements] : ["Возраст 18+"]
              }
            ];

        const activeVacancyId = selectedVacancyId && taskVacancies.some(v => v.id === selectedVacancyId)
          ? selectedVacancyId
          : taskVacancies[0]?.id;

        const activeVacancy = taskVacancies.find(v => v.id === activeVacancyId) || taskVacancies[0];
        const hasOrganizerInfo = selectedTask.organizerName || selectedTask.organizerPhone || selectedTask.organizerEmail;

        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-4">
            <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl overflow-hidden max-w-4xl w-full text-left flex flex-col max-h-[92vh] font-sans relative">
              
              {/* Absolute Close Action Button */}
              <button
                onClick={() => { setSelectedTask(null); setErrorMessage(""); setSuccessMessage(""); }}
                className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-950 p-2 rounded-full hover:bg-neutral-100 transition cursor-pointer z-10"
                title="Закрыть подробности"
              >
                <X className="h-5 w-5 stroke-[2.5]" />
              </button>

              {/* Scrollable Container with multi-column responsive sections */}
              <div className="overflow-y-auto p-6 space-y-5 flex-1 leading-normal text-xs md:text-sm text-neutral-800">
                
                {errorMessage && (
                  <div className="bg-red-50 border border-red-100 text-red-650 text-xs p-3.5 rounded-xl font-semibold">
                    {errorMessage}
                  </div>
                )}
                {successMessage && (
                  <div className="bg-green-50 border border-green-150 text-green-700 text-xs p-3.5 rounded-xl font-bold">
                    {successMessage}
                  </div>
                )}

                {/* Title and Category Badges inside Scrollable Container */}
                <div className="space-y-2.5 pb-4 border-b border-neutral-100 pr-10">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-neutral-100 text-neutral-800 border border-neutral-200 font-bold px-2.5 py-1 rounded text-xs tracking-wide">
                      {selectedTask.category}
                    </span>
                    <span className="text-xs uppercase font-mono bg-[#FFE300]/20 text-neutral-900 px-2.5 py-1 rounded font-black border border-[#FFE300]/40">
                       ~{selectedTask.hoursEstimation} волонтёрских часа
                    </span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-black text-neutral-950 leading-tight">
                    {selectedTask.title}
                  </h2>
                </div>

                {/* Top Section Layout: Image, Main Info Core, and Organizer Block */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
                  
                  {/* Left Column: Slightly larger Image & key metadata */}
                  <div className={`${hasOrganizerInfo ? "md:col-span-8" : "md:col-span-12"} space-y-4`}>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-neutral-50/50 p-4 rounded-2xl border border-neutral-150">
                      
                      {/* Image section */}
                      {selectedTask.imageUrl && (
                        <div className="sm:col-span-4 self-stretch min-h-[110px] relative rounded-xl overflow-hidden border border-neutral-200 shadow-sm shrink-0">
                          <img
                            src={selectedTask.imageUrl}
                            alt={selectedTask.title}
                            referrerPolicy="no-referrer"
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        </div>
                      )}

                      {/* Info section */}
                      <div className={`${selectedTask.imageUrl ? "sm:col-span-8" : "sm:col-span-12"} space-y-2.5`}>
                        <div>
                          <span className="text-neutral-400 block text-[9px] uppercase font-bold tracking-wider">Благотворительная организация</span>
                          <button
                            type="button"
                            onClick={() => openFundModal(selectedTask.fundId || selectedTask.fundName)}
                            className="text-emerald-600 hover:text-emerald-850 text-sm font-black flex items-center gap-1 hover:underline cursor-pointer transition text-left mt-0.5"
                          >
                            <Building className="h-4 w-4 text-[#D70066]" />
                            <span>{selectedTask.fundName}</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3.5 font-sans pt-1">
                          <div>
                            <span className="text-neutral-400 block text-[9px] uppercase font-bold tracking-wider">📅 Регистрация</span>
                            <span className="text-amber-800 font-bold font-mono text-[10.5px]">
                              с {selectedTask.regStart || "2026-05-20"} по {selectedTask.deadline}
                            </span>
                          </div>
                          <div>
                            <span className="text-neutral-400 block text-[9px] uppercase font-bold tracking-wider">⏰ Время выполнения</span>
                            <span className="text-emerald-800 font-bold font-mono text-[10.5px]">
                              {selectedTask.eventTime || "12:00 - 16:00"} {selectedTask.eventDate ? `(${selectedTask.eventDate})` : ""}
                            </span>
                          </div>
                        </div>

                        <div className="pt-0.5">
                          <span className="text-neutral-400 block text-[9px] uppercase font-bold tracking-wider">📍 Место проведения</span>
                          <span className="text-neutral-900 font-semibold text-xs flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-neutral-600" />
                            {selectedTask.location} ({selectedTask.city})
                          </span>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Right Column: Organizer Contact info, disappears entirely if fields are missing */}
                  {hasOrganizerInfo && (
                    <div className="md:col-span-4 bg-[#FFE300]/10 text-neutral-900 p-4.5 rounded-2xl border-2 border-dashed border-[#FFE300]/40 flex flex-col justify-between shadow-xs relative">
                      <div className="space-y-3">
                        <span className="text-amber-700 block text-[9.5px] uppercase font-black tracking-widest">Контакты организатора</span>
                        
                        {selectedTask.organizerName && (
                          <div className="space-y-0.5">
                            <span className="text-neutral-500 text-[8.5px] uppercase font-bold block">ФИО представителя</span>
                            <strong className="text-neutral-950 text-xs block font-bold flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5 text-neutral-600 shrink-0" />
                              {selectedTask.organizerName}
                            </strong>
                          </div>
                        )}

                        {selectedTask.organizerPhone && (
                          <div className="space-y-0.5">
                            <span className="text-neutral-500 text-[8.5px] uppercase font-bold block">Телефон для связи</span>
                            <a href={`tel:${selectedTask.organizerPhone}`} className="text-xs text-neutral-800 hover:text-amber-800 transition block font-mono font-medium flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5 text-neutral-600 shrink-0" />
                              {selectedTask.organizerPhone}
                            </a>
                          </div>
                        )}

                        {selectedTask.organizerEmail && (
                          <div className="space-y-0.5">
                            <span className="text-neutral-500 text-[8.5px] uppercase font-bold block">Почта фонда</span>
                            <a href={`mailto:${selectedTask.organizerEmail}`} className="text-xs text-indigo-700 hover:underline transition block font-mono font-medium truncate flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5 text-neutral-600 shrink-0" />
                              {selectedTask.organizerEmail}
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="text-[9.5px] text-neutral-500 mt-4.5 pt-2.5 border-t border-dotted border-neutral-300 leading-relaxed font-semibold">
                        Свяжитесь с фондом для согласования пропусков и других организационных нюансов.
                      </div>
                    </div>
                  )}

                </div>

                {/* Part 2: Task Description Banner */}
                <div className="space-y-1.5 pt-1.5">
                  <h4 className="font-extrabold text-xs text-neutral-900 uppercase tracking-widest border-l-2 border-[#D70066] pl-2">
                    Описание волонтёрского дела
                  </h4>
                  <p className="text-xs text-neutral-600 leading-relaxed whitespace-pre-wrap font-sans pl-2.5">
                    {selectedTask.description}
                  </p>
                </div>

                {/* Part 3: Candidate requirements & apply action workspace block */}
                <div className="bg-neutral-50/75 p-5 border border-neutral-200 rounded-2xl space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-extrabold text-xs text-neutral-950 uppercase tracking-widest flex items-center gap-1.5 font-sans">
                      <ShieldAlert className="h-4.5 w-4.5 text-[#D70066] shrink-0" />
                      Требования к кандидату
                    </h4>
                    
                    {activeVacancy.requirements && activeVacancy.requirements.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 pt-1.5">
                        {activeVacancy.requirements.map((req, i) => (
                          <span key={i} className="text-xs bg-white text-neutral-800 border border-neutral-200 px-3 py-1 rounded-lg font-bold font-sans">
                            ✦ {req}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-neutral-500 font-sans pl-0.5">Специфические требования отсутствуют.</p>
                    )}
                  </div>

                  <div className="border-t border-neutral-200/60 my-2" />

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                    <div className="space-y-1">
                      <span className="text-xs text-neutral-500 block font-sans">
                        Мест всего: <strong className="text-neutral-900 font-bold">{selectedTask.maxParticipants}</strong>
                      </span>
                      <span className="text-xs text-neutral-500 block font-sans">
                        Уже участвуют: <strong className="text-neutral-900 font-bold">{selectedTask.joinedParticipants || 0}</strong>
                      </span>
                    </div>

                    {applications.some(a => a.taskId === selectedTask.id) ? (
                      <button
                        disabled
                        className="bg-yellow-50 text-neutral-700 border border-yellow-200 py-2 px-4.5 rounded-xl text-xs font-bold shrink-0 opacity-80"
                      >
                        Вы откликнулись
                      </button>
                    ) : selectedTask.joinedParticipants >= selectedTask.maxParticipants ? (
                      <button
                        disabled
                        className="bg-neutral-100 text-neutral-400 py-2.5 px-4.5 rounded-xl text-xs font-bold shrink-0"
                      >
                        Мест нет
                      </button>
                    ) : (
                      <button
                        id={`apply-task-btn-${selectedTask.id}`}
                        onClick={() => handleApply(selectedTask.id)}
                        className="bg-[#FFE300] hover:bg-neutral-950 hover:text-[#FFE300] text-neutral-950 border-2 border-neutral-950 font-black px-6 py-2.5 rounded-xl text-xs tracking-wide transition-all hover:scale-[1.02] shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:shadow-none cursor-pointer font-sans uppercase"
                      >
                        Откликнуться на задание
                      </button>
                    )}
                  </div>
                </div>

                {selectedTask.materials && (
                  <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 font-sans">
                    <h5 className="font-extrabold text-[9px] text-neutral-500 uppercase tracking-widest mb-1 font-sans">Полезные материалы и инструкции</h5>
                    <a
                      href={selectedTask.materials}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[#D70066] hover:underline font-bold font-mono tracking-tight block truncate"
                    >
                      {selectedTask.materials}
                    </a>
                  </div>
                )}

                 <div className="bg-neutral-55 p-3.5 rounded-xl border border-neutral-200 flex items-start gap-2.5 font-sans">
                  <ShieldAlert className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-neutral-800 font-semibold leading-relaxed">
                    Отправляя отклик, вы соглашаетесь уделить заявленное количество часов в случае одобрения фондом. Выполнение задания строго контролируется.
                  </p>
                </div>

              </div>

              {/* Bottom Footer block containing persistent closing actions */}
              <div className="bg-neutral-50 p-4 border-t border-neutral-150 flex justify-end shrink-0 font-sans">
                <button
                  type="button"
                  onClick={() => { setSelectedTask(null); setErrorMessage(""); setSuccessMessage(""); }}
                  className="text-neutral-950 hover:text-neutral-700 font-bold text-xs uppercase tracking-wider cursor-pointer transition-colors"
                >
                  Закрыть подробности
                </button>
              </div>

            </div>
          </div>
        );
      })()}

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
                Отмена
              </button>
              <button
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(null);
                }}
                className="bg-[#D70066] hover:bg-rose-750 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
              >
                Отозвать
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Map helper directory explanations dynamic inside or outside
const getDirectionsForCategories = (categories: string[]) => {
  const list: { title: string; desc: string }[] = [];
  const joinedStr = categories.join(", ").toLowerCase();
  
  if (joinedStr.includes("дет") || joinedStr.includes("сирот") || joinedStr.includes("young") || joinedStr.includes("children")) {
    list.push({
      title: "Детское наставничество и образование",
      desc: "Проведение мастер-классов, интерактивных уроков, развивающих игр и праздников для воспитанников интернатов и детей в трудных жизненных ситуациях."
    });
  }
  if (joinedStr.includes("экол") || joinedStr.includes("природ") || joinedStr.includes("eco") || joinedStr.includes("nature")) {
    list.push({
      title: "Экологические инициативы и субботники",
      desc: "Уборка природных территорий, посадка деревьев, раздельный сбор отходов, помощь эко-центрам и организация зеленого просвещения сотрудников."
    });
  }
  if (joinedStr.includes("пожил") || joinedStr.includes("соци") || joinedStr.includes("ветеран") || joinedStr.includes("elderly")) {
    list.push({
      title: "Социальный патронаж и поддержка",
      desc: "Помощь в быту пожилым гражданам, ветеранам и людям с инвалидностью. Организация душевного общения, экскурсий и обучения компьютерной грамотности."
    });
  }
  if (joinedStr.includes("живот") || joinedStr.includes("приют") || joinedStr.includes("dog") || joinedStr.includes("animal")) {
    list.push({
      title: "Помощь приютам для бездомных животных",
      desc: "Выгул, социализация собак и кошек, благоустройство вольеров в приютах, помощь в доставке кормов и фотосессии для поиска хозяев."
    });
  }
  if (joinedStr.includes("pro") || joinedStr.includes("интел") || joinedStr.includes("умн") || joinedStr.includes("разраб") || joinedStr.includes("дизайн")) {
    list.push({
      title: "Интеллектуальное волонтёрство (Pro-bono)",
      desc: "Профессиональная помощь силами экспертов Столото: дизайн баннеров, доработка веб-страниц, ИТ-архитектура, переводы, юридические и маркетинговые консультации."
    });
  }
  if (joinedStr.includes("дон") || joinedStr.includes("кров") || joinedStr.includes("blood") || joinedStr.includes("здор")) {
    list.push({
      title: "Донорские акции и поддержка здоровья",
      desc: "Популяризация регулярного безвозмездного донорства крови, координация участников в дни сдачи крови и волонтёрская помощь в центрах крови."
    });
  }
  
  if (list.length === 0) {
    list.push({
      title: "Общественные и благотворительные проекты",
      desc: "Широкий спектр созидательных задач: от помощи в организации фестивалей до логистической поддержки благотворительных сборов платформы."
    });
  }
  return list;
};

