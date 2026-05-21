/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { api } from "../api.js";
import { UserProfile } from "../types.js";
import { Heart, Landmark, ShieldCheck, Star, Sparkles, Building2, Info, Check, ArrowRight, UserCheck, Play, HelpCircle, X } from "lucide-react";
import Footer from "./Footer.tsx";

interface LandingPageProps {
  onLoginSuccess: (user: UserProfile) => void;
  onRefreshAll: () => void;
}

export default function LandingPage({ onLoginSuccess, onRefreshAll }: LandingPageProps) {
  const [activeForm, setActiveForm] = useState<"login" | "reg-volunteer" | "reg-fund">("login");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Volunteer reg state
  const [vEmail, setVEmail] = useState("");
  const [vName, setVName] = useState("");
  const [vCity, setVCity] = useState("Москва");
  const [vDept, setVDept] = useState("");
  const [vPos, setVPos] = useState("");
  const [isNotEmployee, setIsNotEmployee] = useState(false);
  const [vPassword, setVPassword] = useState("");
  const [vConsent, setVConsent] = useState(false);

  // Fund reg state
  const [fEmail, setFEmail] = useState("");
  const [fName, setFName] = useState("");
  const [fDesc, setFDesc] = useState("");
  const [fCategories, setFCategories] = useState<string[]>(["Дети"]);
  const [fInn, setFInn] = useState("");
  const [fOgrn, setFOgrn] = useState("");
  const [fCity, setFCity] = useState("Москва");
  const [fWeb, setFWeb] = useState("");
  const [fContactName, setFContactName] = useState("");
  const [fContactPos, setFContactPos] = useState("");
  const [fPhone, setFPhone] = useState("");
  const [fFilename, setFFilename] = useState("");
  const [fFileBase64, setFFileBase64] = useState<string>("");
  const [fPassword, setFPassword] = useState("");
  const [fConsent, setFConsent] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedExtensions = ["pdf", "txt", "docx"];
    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    
    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      setErrorMsg("Формат файла не поддерживается. Разрешены только: .pdf, .txt, .docx");
      setFFilename("");
      setFFileBase64("");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Размер файла слишком велик. Лимит: 5 МБ");
      setFFilename("");
      setFFileBase64("");
      e.target.value = "";
      return;
    }

    setErrorMsg("");
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setFFilename(file.name);
        setFFileBase64(reader.result);
      }
    };
    reader.onerror = () => {
      setErrorMsg("Не удалось прочитать выбранный файл");
    };
    reader.readAsDataURL(file);
  };



  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    if (!loginEmail || !loginPassword) {
      setErrorMsg("Укажите адрес электронной почты и пароль");
      return;
    }
    try {
      const data = await api.login(loginEmail, loginPassword);
      setSuccessMsg(data.message);
      onLoginSuccess(data.user);
      onRefreshAll();
    } catch (err: any) {
      setErrorMsg(err.message || "Неверный логин или пароль.");
    }
  };



  const handleRegisterVolunteer = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!vConsent) {
      setErrorMsg("Необходимо дать согласие на обработку персональных данных");
      return;
    }

    const email = vEmail.trim();

    if (!isNotEmployee) {
      if (!email.endsWith("@stoloto.ru") && !email.endsWith("@tech.stoloto.ru") && !email.toLowerCase().includes("stoloto")) {
        setErrorMsg("Для регистрации сотрудника требуется корпоративная почта в домене stoloto.ru");
        return;
      }
    }

    try {
      const emailPrefix = email.split("@")[0] || "сотрудник";
      const formattedPrefix = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);

      const finalName = isNotEmployee ? vName.trim() : `Сотрудник Столото (${formattedPrefix})`;
      const finalCity = isNotEmployee ? vCity : "Москва";
      const finalDept = isNotEmployee ? vDept.trim() : "Главный офис Столото";
      const finalPos = isNotEmployee ? vPos.trim() : "Сотрудник";

      if (!email) {
        setErrorMsg("Укажите адрес электронной почты.");
        return;
      }

      if (isNotEmployee && (!vName.trim() || !vDept.trim() || !vPos.trim() || !vPassword.trim())) {
        setErrorMsg("Пожалуйста, заполните все обязательные поля формы регистрации.");
        return;
      }

      if (!isNotEmployee && !vPassword.trim()) {
        setErrorMsg("Пожалуйста, укажите пароль.");
        return;
      }

      const data = await api.registerVolunteer({
        email,
        name: finalName,
        city: finalCity,
        department: finalDept,
        position: finalPos,
        isEmployee: !isNotEmployee,
        password: vPassword,
      });

      setSuccessMsg(data.message);
      setTimeout(() => {
        onLoginSuccess(data.user);
        onRefreshAll();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleRegisterFund = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    if (!fConsent) {
      setErrorMsg("Необходимо дать согласие на обработку персональных данных");
      return;
    }
    if (!fFilename || !fFileBase64) {
      setErrorMsg("Пожалуйста, загрузите устав или выписку (поддерживаются форматы PDF, TXT, DOCX)");
      return;
    }
    try {
      const data = await api.registerFund({
        email: fEmail,
        name: fName,
        description: fDesc,
        categories: fCategories,
        inn: fInn,
        ogrn: fOgrn,
        city: fCity,
        website: fWeb,
        contactName: fContactName,
        contactPosition: fContactPos,
        phone: fPhone,
        documentName: fFilename,
        documentData: fFileBase64,
        password: fPassword,
      });
      setSuccessMsg(data.message);
      setTimeout(() => {
        onLoginSuccess(data.user);
        onRefreshAll();
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const categoriesOptions = ["Дети", "Пожилые", "ОВЗ", "Экология", "Животные", "Донорство", "Pro-bono"];

  const toggleCategory = (cat: string) => {
    if (fCategories.includes(cat)) {
      setFCategories(fCategories.filter(c => c !== cat));
    } else {
      setFCategories([...fCategories, cat]);
    }
  };



  return (
    <div id="landing-page-root" className="min-h-screen bg-[#F5F5F5] text-[#333333] flex flex-col font-sans transition-colors duration-200">
      
      {/* Upper Brand Promo Banner */}
      <div className="bg-neutral-900 text-white text-[13px] text-center py-2.5 px-4 flex justify-center items-center gap-2 font-medium tracking-wide">
        <span className="bg-[#FFE300] text-black text-[9.5px] uppercase px-1.5 py-0.5 rounded font-bold">Корпоративная сеть</span>
        <span>Мы объединяем усилия сотрудников Столото для добрых дел по всей России. Присоединяйтесь!</span>
      </div>

      <div className="container mx-auto px-4 py-8 lg:py-12 max-w-7xl flex-1 flex flex-col justify-center">
        
        {/* Main Content Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Brand & Stats Pitching */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div>
              <div className="inline-flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-full border border-neutral-200 shadow-sm text-[13px] font-semibold text-neutral-900 mb-4">
                <Heart className="h-4 w-4 fill-[#FFE300] text-[#FFE300]" />
                <span>Официальный волонтёрский штаб Столото</span>
              </div>
              
              {/* Bold black headings */}
              <h1 className="text-4xl md:text-5xl lg:text-[52px] font-extrabold text-[#000000] tracking-tight leading-tight">
                Помогать <span className="inline-block bg-[#FFE300] text-black px-3.5 py-1 rounded-2xl shadow-sm rotate-1 transform">проСТО</span>
              </h1>
              
              <p className="text-[17px] md:text-lg text-[#333333] mt-4 leading-relaxed max-w-2xl">
                Прозрачная, удобная экосистема добрых дел. Объединяем энергию волонтёров Столото с благотворительными организациями, ведём реестр отработанных верифицированных часов и награждаем за успехи.
              </p>
            </div>

            {/* Core Directions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4.5 rounded-2xl border border-neutral-200/80 shadow-sm">
                <div className="h-9 w-9 bg-yellow-50 rounded-xl flex items-center justify-center text-neutral-900 mb-3 border border-yellow-200">
                  <Star className="h-5 w-5 fill-[#FFE300] text-[#FFE300]" />
                </div>
                <h4 className="font-bold text-[15px] text-[#000000]">Для Волонтёров</h4>
                <p className="text-[13px] text-neutral-500 mt-1 leading-normal">
                  Личный профиль, учёт подтверждённого времени, достижения и личные волонтёрские статусы.
                </p>
              </div>

              <div className="bg-white p-4.5 rounded-2xl border border-neutral-200/80 shadow-sm">
                <div className="h-9 w-9 bg-cyan-50 rounded-xl flex items-center justify-center text-cyan-700 mb-3 border border-cyan-100">
                  <Building2 className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-[15px] text-[#000000]">Для Фондов</h4>
                <p className="text-[13px] text-neutral-500 mt-1 leading-normal">
                  Партнёрство после проверки ИНН, публикация задач и доступ к надёжным волонтёрам.
                </p>
              </div>

              <div className="bg-white p-4.5 rounded-2xl border border-neutral-200/80 shadow-sm">
                <div className="h-9 w-9 bg-purple-50 rounded-xl flex items-center justify-center text-purple-700 mb-3 border border-purple-100">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-[15px] text-[#000000]">Для Компании</h4>
                <p className="text-[13px] text-neutral-500 mt-1 leading-normal">
                  Прозрачная ESG-отчётность, геймификация, автоматический экспорт в CSV/Excel для наград.
                </p>
              </div>
            </div>

            {/* Platform rules notice */}
            <div className="bg-neutral-900 text-neutral-100 p-5 rounded-2xl border border-neutral-800 flex gap-4">
              <Info className="h-6 w-6 text-[#FFE300] shrink-0 mt-0.5" />
              <div className="text-[13px] space-y-2">
                <h4 className="font-bold text-[15.5px] text-white">Правила корпоративной этики Столото</h4>
                <ul className="space-y-1 text-neutral-300 list-disc list-inside">
                  <li>Все участвующие фонды проходят строгую модерацию юридическим отделом.</li>
                  <li>Волонтёрские часы начисляются администратором после официального фидбека фонда.</li>
                </ul>
              </div>
            </div>



          </div>

          {/* Interactive Login & Reg Container Card */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white rounded-3xl border border-neutral-200 shadow-lg overflow-hidden p-6 md:p-8">
              
              {/* Form Tab Selector */}
              <div className="flex border-b border-neutral-150 mb-6 font-sans">
                <button
                  id="tab-login"
                  onClick={() => { setActiveForm("login"); setErrorMsg(""); setSuccessMsg(""); }}
                  className={`flex-1 pb-3 text-center text-xs md:text-sm font-bold tracking-tight border-b-2 transition ${
                    activeForm === "login"
                      ? "border-[#FFE300] text-neutral-950"
                      : "border-transparent text-neutral-400 hover:text-neutral-600"
                  }`}
                >
                  Войти в профиль
                </button>
                <button
                  id="tab-reg-vol"
                  onClick={() => { setActiveForm("reg-volunteer"); setErrorMsg(""); setSuccessMsg(""); }}
                  className={`flex-1 pb-3 text-center text-xs md:text-sm font-bold tracking-tight border-b-2 transition ${
                    activeForm === "reg-volunteer"
                      ? "border-[#FFE300] text-neutral-950"
                      : "border-transparent text-neutral-400 hover:text-neutral-600"
                  }`}
                >
                  Стать Волонтёром
                </button>
                <button
                  id="tab-reg-fund"
                  onClick={() => { setActiveForm("reg-fund"); setErrorMsg(""); setSuccessMsg(""); }}
                  className={`flex-1 pb-3 text-center text-xs md:text-sm font-bold tracking-tight border-b-2 transition ${
                    activeForm === "reg-fund"
                      ? "border-[#FFE300] text-neutral-950"
                      : "border-transparent text-neutral-400 hover:text-neutral-600"
                  }`}
                >
                  Регистрация фонда
                </button>
              </div>

              {/* Status Feedbacks */}
              {errorMsg && (
                <div className="mb-4 bg-red-50 text-red-600 text-xs p-3 rounded-xl border border-red-100 flex items-start gap-2">
                  <span className="font-bold">⚠️ Ошибка:</span>
                  <span>{errorMsg}</span>
                </div>
              )}
              {successMsg && (
                <div className="mb-4 bg-green-50 text-green-700 text-xs p-3 rounded-xl border border-green-100 flex items-start gap-2">
                  <Check className="h-4 w-4 shrink-0 text-green-600" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* 1. LOGIN FORM */}
              {activeForm === "login" && (
                <form onSubmit={handleLogin} className="space-y-4 text-left">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                      Электронная почта
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="volunteer@stoloto.ru"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full text-sm bg-[#F5F5F5] px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:border-[#FFE300] focus:ring-1 focus:ring-[#FFE300] transition-all"
                    />
                    <p className="text-[10.5px] text-neutral-400 mt-1.5 leading-relaxed">
                      Введите ваш зарегистрированный email (например, <code className="font-mono bg-neutral-100 px-1 py-0.2 rounded text-black">volunteer@stoloto.ru</code> для волонтёра или <code className="font-mono bg-neutral-100 px-1 py-0.2 rounded text-black">admin@stoloto.ru</code> для администратора).
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                      Пароль
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full text-sm bg-[#F5F5F5] px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:border-[#FFE300] focus:ring-1 focus:ring-[#FFE300] transition-all"
                    />
                    <p className="text-[10.5px] text-neutral-400 mt-1.5 leading-relaxed">
                      Для предустановленных аккаунтов пароль <code className="font-mono bg-neutral-100 px-1 py-0.2 rounded text-black">demo</code>.
                    </p>
                  </div>

                  {/* ACTION Button: bright yellow with black text */}
                  <button
                    type="submit"
                    id="submit-login"
                    className="w-full mt-2 bg-[#FFE300] text-[#000000] hover:bg-[#E5C500] py-3 rounded-xl text-sm font-bold shadow-md hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Войти в систему</span>
                    <ArrowRight className="h-4 w-4 text-[#000000]" />
                  </button>
                </form>
              )}

              {/* 2. VOLUNTEER REGISTER FORM */}
              {activeForm === "reg-volunteer" && (
                <form onSubmit={handleRegisterVolunteer} className="space-y-4 text-left">
                  {/* Select user type checkbox */}
                  <div className="flex items-center gap-2.5 bg-neutral-100 p-3 rounded-xl border border-neutral-200">
                    <input
                      type="checkbox"
                      id="isNotEmployee"
                      checked={isNotEmployee}
                      onChange={(e) => setIsNotEmployee(e.target.checked)}
                      className="h-4.5 w-4.5 rounded border-neutral-300 text-black focus:ring-0 accent-neutral-950 cursor-pointer"
                    />
                    <label htmlFor="isNotEmployee" className="text-xs md:text-[13px] font-semibold text-neutral-800 cursor-pointer select-none">
                      Я не сотрудник Столото (Внешний волонтёр)
                    </label>
                  </div>

                  {isNotEmployee ? (
                    // Detailed form for regular volunteers
                    <div className="space-y-4 animated fadeIn">
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 mb-1">
                          ФИО (Полностью)
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Иванов Иван Иванович"
                          value={vName}
                          onChange={(e) => setVName(e.target.value)}
                          className="w-full text-xs md:text-sm bg-neutral-50 px-3 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:border-[#FFE300] transition-all"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-neutral-700 mb-1">
                            Город
                          </label>
                          <select
                            value={vCity}
                            onChange={(e) => setVCity(e.target.value)}
                            className="w-full text-xs md:text-sm bg-neutral-50 p-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:border-[#FFE300]"
                          >
                            <option>Москва</option>
                            <option>Санкт-Петербург</option>
                            <option>Самара</option>
                            <option>Новосибирск</option>
                            <option>Екатеринбург</option>
                            <option>Нижний Новгород</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-neutral-700 mb-1">
                            Личный email (Почта)
                          </label>
                          <input
                            type="email"
                            required
                            placeholder="ivanov@mail.ru"
                            value={vEmail}
                            onChange={(e) => setVEmail(e.target.value)}
                            className="w-full text-xs md:text-sm bg-neutral-50 px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:border-[#FFE300]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-700 mb-1">
                          Пароль
                        </label>
                        <input
                          type="password"
                          required
                          placeholder="Укажите ваш пароль"
                          value={vPassword}
                          onChange={(e) => setVPassword(e.target.value)}
                          className="w-full text-xs md:text-sm bg-neutral-50 px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:border-[#FFE300]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-700 mb-1">
                          Организация / ВУЗ / Школа
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Например, МГУ или Частное лицо"
                          value={vDept}
                          onChange={(e) => setVDept(e.target.value)}
                          className="w-full text-xs md:text-sm bg-neutral-50 px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:border-[#FFE300]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-700 mb-1">
                          Должность / Род занятий
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Например, Студент или Программист"
                          value={vPos}
                          onChange={(e) => setVPos(e.target.value)}
                          className="w-full text-xs md:text-sm bg-neutral-50 px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:border-[#FFE300]"
                        />
                      </div>
                    </div>
                  ) : (
                    // Simple form for Stoloto employee
                    <div className="space-y-4 animated fadeIn">
                      <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 text-xs text-amber-800 leading-normal">
                        <strong>Тестовые сотрудники Столото:</strong> Вся информация о сотруднике автоматически подтягивается из базы данных по его email. Вы можете протестировать регистрацию, используя один из следующих ящиков:
                        <ul className="list-disc list-inside mt-1 font-mono font-semibold">
                          <li>sidorov@stoloto.ru</li>
                          <li>kozlov@stoloto.ru</li>
                          <li>semenova@stoloto.ru</li>
                          <li>morozov@stoloto.ru</li>
                        </ul>
                        <div className="mt-1 text-[10px]">При вводе любого другого email система вежливо предложит зарегистрироваться как обычный внешний пользователь.</div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-700 mb-1">
                          Корпоративная почта (@stoloto.ru)
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="ivanov@stoloto.ru"
                          value={vEmail}
                          onChange={(e) => setVEmail(e.target.value)}
                          className="w-full text-xs md:text-sm bg-neutral-50 px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:border-[#FFE300]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-700 mb-1">
                          Пароль
                        </label>
                        <input
                          type="password"
                          required
                          placeholder="Введите ваш пароль"
                          value={vPassword}
                          onChange={(e) => setVPassword(e.target.value)}
                          className="w-full text-xs md:text-sm bg-neutral-50 px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:border-[#FFE300]"
                        />
                      </div>
                    </div>
                  )}

                  {/* Required Consent Checkbox for Volunteer */}
                  <div className="flex items-start gap-2 pt-2.5 pb-1">
                    <input
                      id="vol-consent-checkbox"
                      type="checkbox"
                      required
                      checked={vConsent}
                      onChange={(e) => setVConsent(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-[#FFE300] cursor-pointer"
                    />
                    <label htmlFor="vol-consent-checkbox" className="text-[11px] text-neutral-600 leading-tight cursor-pointer font-medium select-none">
                      Даю своё обязательное <button type="button" onClick={() => setShowPolicyModal(true)} className="text-neutral-900 border-b border-dashed border-neutral-400 font-bold hover:text-indigo-600 hover:border-indigo-600 transition-colors cursor-pointer inline">согласие на обработку персональных данных</button> в соответствии с требованиями Федерального закона РФ № 152-ФЗ.
                    </label>
                  </div>

                  <button
                    type="submit"
                    id="submit-reg-vol"
                    className="w-full bg-[#FFE300] text-black hover:bg-[#E5C500] py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all mt-2 cursor-pointer"
                  >
                    Зарегистрироваться и войти
                  </button>
                </form>
              )}

              {/* 3. FUND REGISTER FORM */}
              {activeForm === "reg-fund" && (
                <form onSubmit={handleRegisterFund} className="space-y-3.5 text-left max-h-[500px] overflow-y-auto pr-1">
                  <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 text-xs text-amber-800 leading-normal mb-1">
                    <strong>Основные данные для входа:</strong> Пожалуйста, сохраните этот Email и пароль. Они понадобятся вам для авторизации на платформе после успешной модерации.
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pb-2 border-b border-dashed border-neutral-200">
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                        Электронная почта фонда (Email) *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="fond_help@hope.ru"
                        value={fEmail}
                        onChange={(e) => setFEmail(e.target.value)}
                        className="w-full text-xs bg-white p-2 rounded-lg border border-neutral-300 focus:outline-none focus:border-[#FFE300]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                        Пароль для входа *
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="Установите пароль"
                        value={fPassword}
                        onChange={(e) => setFPassword(e.target.value)}
                        className="w-full text-xs bg-white p-2 rounded-lg border border-neutral-300 focus:outline-none focus:border-[#FFE300]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                      Наименование организации (Фонда)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="БФ Содействие и Надежда"
                      value={fName}
                      onChange={(e) => setFName(e.target.value)}
                      className="w-full text-xs bg-neutral-50 p-2 rounded-lg border border-neutral-300 focus:outline-none focus:border-[#FFE300]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                      Сфера / Краткое описание фонда
                    </label>
                    <textarea
                      required
                      rows={2}
                      placeholder="Помощь тяжелобольным сиротам и реабилитационная поддержка..."
                      value={fDesc}
                      onChange={(e) => setFDesc(e.target.value)}
                      className="w-full text-xs bg-neutral-50 p-2 rounded-lg border border-neutral-300 focus:outline-none focus:border-[#FFE300]"
                    />
                  </div>

                  {/* Categories picker with secondary colors */}
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                      Категории получателей помощи
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {categoriesOptions.map(cat => {
                        const has = fCategories.includes(cat);
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => toggleCategory(cat)}
                            className={`px-2 py-1 rounded text-[10px] font-medium border transition ${
                              has
                                ? "bg-yellow-50 text-neutral-900 border-[#FFE300] font-bold"
                                : "bg-neutral-50 text-neutral-600 border-neutral-200"
                            }`}
                          >
                            {cat}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                        ИНН фонда *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={10}
                        placeholder="7700123456"
                        value={fInn}
                        onChange={(e) => setFInn(e.target.value)}
                        className="w-full text-xs bg-neutral-50 p-2 rounded-lg border border-neutral-300 focus:outline-none focus:border-[#FFE300]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                        ОГРН фонда *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={13}
                        placeholder="1027700123456"
                        value={fOgrn}
                        onChange={(e) => setFOgrn(e.target.value)}
                        className="w-full text-xs bg-neutral-50 p-2 rounded-lg border border-neutral-300 focus:outline-none focus:border-[#FFE300]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                        Основной город
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Москва"
                        value={fCity}
                        onChange={(e) => setFCity(e.target.value)}
                        className="w-full text-xs bg-neutral-50 p-2 rounded-lg border border-neutral-300 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                        Сайт фонда
                      </label>
                      <input
                        type="url"
                        placeholder="https://myfund.ru"
                        value={fWeb}
                        onChange={(e) => setFWeb(e.target.value)}
                        className="w-full text-xs bg-neutral-50 p-2 rounded-lg border border-neutral-300 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="border-t border-dashed border-neutral-200 my-2 pt-2">
                    <p className="text-[10px] uppercase font-bold text-neutral-900 mb-1">Контактное лицо</p>
                    <div className="grid grid-cols-1 gap-2">
                      <input
                        type="text"
                        required
                        placeholder="ФИО ответственного"
                        value={fContactName}
                        onChange={(e) => setFContactName(e.target.value)}
                        className="w-full text-xs bg-neutral-50 p-2 rounded-lg border focus:border-[#FFE300]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-1.5">
                      <input
                        type="text"
                        placeholder="Должность"
                        value={fContactPos}
                        onChange={(e) => setFContactPos(e.target.value)}
                        className="w-full text-xs bg-neutral-50 p-2 rounded-lg border focus:border-[#FFE300]"
                      />
                      <input
                        type="tel"
                        required
                        placeholder="Номер телефона"
                        value={fPhone}
                        onChange={(e) => setFPhone(e.target.value)}
                        className="w-full text-xs bg-neutral-50 p-2 rounded-lg border focus:border-[#FFE300]"
                      />
                    </div>
                  </div>

                  {/* Document upload block */}
                  <div className="bg-neutral-50 p-3.5 rounded-lg border border-neutral-200 space-y-2.5">
                    <label className="block text-[11px] font-bold text-neutral-600 uppercase tracking-wide">
                      Учредительные документы фонда *
                    </label>
                    <div className="relative border-2 border-dashed border-neutral-300 rounded-lg p-4 text-center hover:border-[#FFE300] transition-colors cursor-pointer bg-white group">
                      <input
                        type="file"
                        accept=".pdf,.txt,.docx"
                        onChange={handleDocumentChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        id="fund-document-input"
                      />
                      <div className="space-y-1">
                        <div className="text-xl">📁</div>
                        <p className="text-xs font-bold text-neutral-800">
                          {fFilename ? `Файл выбран: ${fFilename}` : "Выберите или перетащите файл"}
                        </p>
                        <p className="text-[10px] text-neutral-500">
                          Поддерживаются только форматы .pdf, .txt, .docx до 5 МБ
                        </p>
                      </div>
                    </div>
                    {fFileBase64 && (
                      <div className="flex items-center justify-between bg-green-50 p-2 rounded border border-green-200 text-xs text-green-800 font-medium">
                        <span className="truncate max-w-[190px]">✓ {fFilename} ({Math.round(fFileBase64.length * 0.75 / 1024)} КБ)</span>
                        <button
                          type="button"
                          onClick={() => {
                            setFFilename("");
                            setFFileBase64("");
                          }}
                          className="text-red-600 hover:text-red-800 font-bold hover:underline cursor-pointer transition-colors shrink-0"
                        >
                          Сбросить
                        </button>
                      </div>
                    )}
                    <p className="text-[9px] text-neutral-400 leading-normal">
                      Файлы Устава и выписки ОГРН требуются юр. отделом Столото для вынесения одобрения деятельности.
                    </p>
                  </div>

                  {/* Required Consent Checkbox for Fund */}
                  <div className="flex items-start gap-2 pt-2.5 pb-1">
                    <input
                      id="fund-consent-checkbox"
                      type="checkbox"
                      required
                      checked={fConsent}
                      onChange={(e) => setFConsent(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-[#FFE300] cursor-pointer"
                    />
                    <label htmlFor="fund-consent-checkbox" className="text-[11px] text-neutral-600 leading-tight cursor-pointer font-medium select-none">
                      Подтверждаю и даю обязательное <button type="button" onClick={() => setShowPolicyModal(true)} className="text-neutral-900 border-b border-dashed border-neutral-400 font-bold hover:text-indigo-600 hover:border-indigo-600 transition-colors cursor-pointer inline">согласие на обработку персональных данных</button> представителя и участников организации в соответствии с ФЗ № 152-ФЗ.
                    </label>
                  </div>

                  <button
                    type="submit"
                    id="submit-reg-fund"
                    className="w-full bg-[#FFE300] text-black hover:bg-[#E5C500] py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all mt-2.5 cursor-pointer"
                  >
                    Подать заявку на модерацию
                  </button>
                </form>
              )}

            </div>
          </div>

        </div>



      </div>

      {/* Modern, Accessible Policy Consent Modal */}
      {showPolicyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-4 font-sans animate-fade-in animate-duration-150">
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl overflow-hidden max-w-2xl w-full text-left flex flex-col max-h-[85vh] relative animate-scale-up animate-duration-150">
            
            {/* Modal Header */}
            <div className="bg-[#FFE300] py-4 px-6 text-neutral-900 border-b border-neutral-200 flex items-center justify-between shrink-0">
              <span className="text-[11px] font-black uppercase tracking-widest text-neutral-900 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 shrink-0 text-neutral-900" />
                Политика обработки персональных данных (ФЗ-152)
              </span>
              <button
                onClick={() => setShowPolicyModal(false)}
                className="text-neutral-700 hover:text-neutral-950 p-1 rounded-full hover:bg-black/5 transition cursor-pointer"
                title="Закрыть окно"
              >
                <X className="h-4.5 w-4.5 stroke-[2.5]" />
              </button>
            </div>

            {/* Modal Body (Scrollable document template) */}
            <div className="overflow-y-auto p-6 space-y-4 text-xs md:text-sm text-neutral-700 leading-normal flex-1">
              <h3 className="font-extrabold text-neutral-950 text-sm md:text-base border-b border-neutral-100 pb-2">
                Согласие на обработку персональных данных (Тестовый шаблон)
              </h3>
              
              <p>
                В соответствии с требованиями Федерального закона от 27.07.2006 г. № 152-ФЗ «О персональных данных», 
                регистрируясь на платформе корпоративного волонтёрства группы компаний «Столото», Вы подтверждаете своё 
                согласие на обработку Ваших персональных данных со стороны АО «Технологическая Компания «Центр».
              </p>

              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3.5 space-y-2">
                <strong className="text-neutral-900 block font-bold text-xs uppercase tracking-wide">
                  1. Категории обрабатываемых персональных данных:
                </strong>
                <ul className="list-disc list-inside space-y-1 text-xs text-neutral-600 pl-1">
                  <li>Фамилия, Имя, Отчество зарегистрированного лица;</li>
                  <li>Адрес электронной почты (корпоративный или личный);</li>
                  <li>Контактный номер телефона;</li>
                  <li>Город проживания или ведения деятельности фонда;</li>
                  <li>Наименование организации работодателя, ВУЗа или НКО;</li>
                  <li>Занимаемая должность / спецификация волонтёрских навыков;</li>
                  <li>Копии учредительных документов (только для представителей фондов).</li>
                </ul>
              </div>

              <div className="space-y-2">
                <strong className="text-neutral-900 block font-bold text-xs uppercase tracking-wide">
                  2. Цели сбора и обработки персональных данных:
                </strong>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Ваши данные собираются исключительно в целях функционирования экосистемы взаимопомощи «Столото», включая: 
                  верификацию статуса сотрудника компании, одобрение благотворительных фондов юр. отделом, 
                  публикацию заданий добрых дел, формирование откликов на вакансии, учёт затраченного волонтёрского времени, 
                  рассмотрение отчётов по проведённым акциям и начисление бонусов.
                </p>
              </div>

              <div className="space-y-2">
                <strong className="text-neutral-900 block font-bold text-xs uppercase tracking-wide">
                  3. Условия хранения и передачи третьим лицам:
                </strong>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Все данные хранятся на защищённых серверах на территории Российской Федерации. Данные волонтёров (ФИО и контакты) 
                  передаются конкретному благотворительному фонду только при прямом отклике волонтёра на конкретное задание фонда 
                  для оперативной координации. Платформа обязуется не использовать Ваши контакты в спам-рассылках или рекламных интеграциях.
                </p>
              </div>

              <p className="text-[11px] text-neutral-400 italic">
                * Настоящее согласие действует бессрочно с момента прохождения онлайн-регистрации на сайте. 
                Отозвать согласие можно в любой момент путём направления письменного обращения администратору платформы.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="bg-neutral-50 px-6 py-4 border-t border-neutral-200 flex flex-wrap items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowPolicyModal(false)}
                className="px-5 py-2 rounded-xl text-neutral-700 hover:text-neutral-950 font-bold text-xs transition-colors cursor-pointer border border-neutral-300 bg-white"
              >
                Закрыть
              </button>
              <button
                type="button"
                onClick={() => {
                  setVConsent(true);
                  setFConsent(true);
                  setShowPolicyModal(false);
                }}
                className="bg-[#FFE300] hover:bg-neutral-950 hover:text-[#FFE300] text-neutral-900 font-extrabold px-6 py-2.5 rounded-xl text-xs transition-all uppercase shadow-xs border border-transparent hover:border-neutral-950 cursor-pointer"
              >
                Согласен(-на), принять всё
              </button>
            </div>

          </div>
        </div>
      )}

      <Footer onShowPolicy={() => setShowPolicyModal(true)} />
    </div>
  );
}
