import React, { useState } from "react";
import { Heart, ShieldCheck, Mail, MapPin, ExternalLink, HelpCircle, X } from "lucide-react";
import LogoIcon from "./LogoIcon.tsx";

interface FooterProps {
  onShowPolicy?: () => void;
}

export default function Footer({ onShowPolicy }: FooterProps) {
  const [showDirectPolicy, setShowDirectPolicy] = useState(false);

  const handlePolicyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onShowPolicy) {
      onShowPolicy();
    } else {
      setShowDirectPolicy(true);
    }
  };

  return (
    <footer id="global-application-footer" className="bg-neutral-50 text-neutral-600 border-t border-neutral-200 font-sans mt-auto">
      {/* Main content grid */}
      <div className="container mx-auto px-6 py-12 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
          
          {/* Brand Info Column */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-[#FFE300] rounded-lg flex items-center justify-center text-neutral-950 shrink-0 p-1 shadow-sm">
                <LogoIcon className="h-6 w-6" color="#000000" heartColor="#FFE300" />
              </div>
              <span className="font-extrabold text-neutral-900 text-base tracking-tight font-sans">
                Помогать <span className="text-neutral-950 bg-[#FFE300] px-1.5 py-0.5 rounded">проСТО</span>
              </span>
            </div>
            
            <p className="text-xs text-neutral-500 leading-relaxed max-w-sm">
              Единая корпоративная волонтёрская платформа группы компаний «Столото». 
              Мы объединяем усилия сотрудников, волонтёров и благотворительных фондов для решения социально значимых задач.
            </p>
            
            <div className="pt-1"></div>
          </div>

          {/* Navigation/Links Column */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="font-black text-xs text-neutral-900 uppercase tracking-wider border-l-2 border-[#FFE300] pl-2">
              Полезные разделы
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button 
                  onClick={handlePolicyClick}
                  className="text-neutral-500 hover:text-neutral-900 hover:underline transition-colors font-medium text-left cursor-pointer"
                >
                  Политика обработки ПД (ФЗ-152)
                </button>
              </li>
              <li>
                <a 
                  href="#scenarios" 
                  onClick={(e) => {
                    const el = document.getElementById("jury-test-scenarios-tab");
                    if (el) {
                      e.preventDefault();
                      el.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  className="text-neutral-500 hover:text-neutral-900 hover:underline transition-colors font-medium"
                >
                  Демонстрационные сценарии
                </a>
              </li>
              <li>
                <span className="text-neutral-400 cursor-not-allowed">
                  Регламент волонтёра (PDF) <span className="text-[9px] uppercase font-bold text-neutral-400 ml-1 bg-neutral-100 px-1 rounded">Скоро</span>
                </span>
              </li>
              <li>
                <span className="text-neutral-400 cursor-not-allowed">
                  Годовой отчёт КСО (2025) <span className="text-[9px] uppercase font-bold text-neutral-400 ml-1 bg-neutral-100 px-1 rounded">Скоро</span>
                </span>
              </li>
            </ul>
          </div>

          {/* Contacts/Support Column */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="font-black text-xs text-neutral-900 uppercase tracking-wider border-l-2 border-[#D70066] pl-2">
              Контакты и поддержка
            </h4>
            <div className="space-y-2.5 text-xs text-neutral-505">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-neutral-400 shrink-0" />
                <span>Эл. почта: <a href="mailto:volunteers@stoloto.ru" className="text-neutral-800 hover:text-[#D70066] font-bold hover:underline">volunteers@stoloto.ru</a></span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-neutral-400 shrink-0" />
                <span className="leading-tight text-neutral-500">г. Москва, Волгоградский проспект, д. 43, корп. 3</span>
              </div>
              <div className="pt-2 bg-neutral-100/60 p-3 rounded-xl border border-neutral-200/80 space-y-1">
                <div className="flex items-center gap-1.5 text-neutral-800 font-bold text-[11px]">
                  <HelpCircle className="h-3.5 w-3.5 text-[#D70066] shrink-0" />
                  <span>Возникли трудности?</span>
                </div>
                <p className="text-[10px] text-neutral-400 leading-normal">
                  По любым вопросам координации мероприятий или верификации вашего фонда пишите на официальный ящик координатора КСО.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="border-t border-neutral-200 mt-10 pt-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-neutral-400">
          <div>
            © {new Date().getFullYear()} Платформа «Помогать проСТО». Все права защищены.
          </div>
          <div className="flex items-center gap-4">
            <span className="font-medium text-neutral-400">АО «ТК «Центр» • Группа компаний «Столото»</span>
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
            <span className="hover:text-neutral-500 transition-colors">Сделано с заботой о людях <Heart className="h-3 w-3 inline text-[#D70066] fill-[#D70066]" /></span>
          </div>
        </div>
      </div>

      {/* Embedded Policy Modal for cases where called from dashboards without onShowPolicy */}
      {showDirectPolicy && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-4 font-sans">
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl overflow-hidden max-w-2xl w-full text-left flex flex-col max-h-[85vh] relative text-neutral-800">
            
            {/* Modal Header */}
            <div className="bg-[#FFE300] py-4 px-6 text-neutral-900 border-b border-neutral-200 flex items-center justify-between shrink-0">
              <span className="text-[11px] font-black uppercase tracking-widest text-neutral-900 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 shrink-0 text-neutral-900" />
                Политика обработки персональных данных (ФЗ-152)
              </span>
              <button
                onClick={() => setShowDirectPolicy(false)}
                className="text-neutral-700 hover:text-neutral-950 p-1 rounded-full hover:bg-black/5 transition cursor-pointer"
                title="Закрыть окно"
              >
                <X className="h-4.5 w-4.5 stroke-[2.5]" />
              </button>
            </div>

            {/* Modal Body */}
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
                onClick={() => setShowDirectPolicy(false)}
                className="px-6 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                Понятно, закрыть
              </button>
            </div>

          </div>
        </div>
      )}
    </footer>
  );
}
