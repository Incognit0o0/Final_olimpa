/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { api } from "../api.js";
import { UserProfile, NotificationLog, UserRole } from "../types.js";
import { Bell, LogOut, Heart, User, Sparkles, CheckSquare, Shield } from "lucide-react";
import LogoIcon from "./LogoIcon.tsx";

interface HeaderProps {
  user: UserProfile;
  notifications: NotificationLog[];
  onLogout: () => void;
  onRefreshNotifications: () => void;
  onGoToProfile?: () => void;
}

export default function Header({ user, notifications, onLogout, onRefreshNotifications, onGoToProfile }: HeaderProps) {
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    // Refresh notifications every 10 seconds silently
    const interval = setInterval(() => {
      onRefreshNotifications();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.markNotificationsRead();
      onRefreshNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return { label: "Администратор Столото", bg: "bg-neutral-950 text-[#FFE300]" };
      case UserRole.FUND:
        return { label: "Благотворительный Фонд", bg: "bg-neutral-50 text-neutral-800 border border-neutral-200" };
      case UserRole.VOLUNTEER:
        return { label: `Корп. Волонтёр [${user.volunteerStatus || "Новичок"}]`, bg: "bg-yellow-50 text-neutral-900 border border-yellow-250 font-bold" };
    }
  };

  const roleMeta = getRoleLabel(user.role);

  return (
    <header id="global-header-component" className="bg-white border-b border-neutral-200 sticky top-0 z-45 shadow-sm">
      <div className="container mx-auto px-4 max-w-7xl h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 bg-[#FFE300] rounded-xl flex items-center justify-center text-black shadow shadow-yellow-250 p-1">
            <LogoIcon className="h-7 w-7" color="#000000" heartColor="#FFE300" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg text-neutral-950 tracking-tight">Помогать</span>
              <span className="bg-[#FFE300] text-black font-black text-xs px-1.5 py-0.5 rounded tracking-wide uppercase">проСТО</span>
            </div>
            <p className="text-[9.5px] text-neutral-400 font-bold uppercase tracking-widest leading-none mt-0.5">Волонтёры Столото</p>
          </div>
        </div>

        {/* Quick details */}
        <div className="flex items-center gap-4">
          
          <span className={`hidden sm:inline-block text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded ${roleMeta.bg}`}>
            {roleMeta.label}
          </span>

          {/* User Details */}
          <div className="flex items-center gap-2.5">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-black text-neutral-950 leading-tight">{user.name}</span>
            </div>

            {user.role === UserRole.VOLUNTEER && (
              <div className="hidden lg:block bg-neutral-50 border border-neutral-150 px-2 py-0.5 rounded-md text-right">
                <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Накоплено</p>
                <p className="text-xs font-black text-neutral-950">{user.hours || 0} ч.</p>
              </div>
            )}
          </div>

          {/* Notifications Trigger Bell */}
          <div className="relative">
            <button
              id="notifications-bell"
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className="p-2 text-neutral-500 hover:text-neutral-950 border border-neutral-200 hover:border-neutral-300 bg-neutral-50 rounded-xl transition relative"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-neutral-950 text-[#FFE300] font-bold text-[9px] h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center border-2 border-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Box */}
            {showNotifDropdown && (
              <div
                id="notifications-box"
                className="absolute right-0 mt-2.5 w-80 bg-white border border-neutral-200 rounded-2xl shadow-xl z-50 py-3 text-left"
              >
                <div className="px-4 pb-2 border-b border-neutral-100 flex items-center justify-between">
                  <span className="font-bold text-xs text-neutral-800">Уведомления</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[10px] text-neutral-850 font-bold hover:underline"
                    >
                      Прочитать все
                    </button>
                  )}
                </div>

                <div className="max-h-60 overflow-y-auto divide-y divide-neutral-50">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-neutral-400">
                      Новых уведомлений нет
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-3 text-[11px] leading-relaxed transition ${
                          !notif.isRead ? "bg-yellow-50/40" : ""
                        }`}
                      >
                        <p className="text-neutral-700">{notif.text}</p>
                        <span className="text-[9.5px] text-neutral-400 mt-1 block font-mono">
                          {new Date(notif.createdAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Logout Actions */}
          <button
            id="logout-button"
            onClick={onLogout}
            title="Выйти из аккаунта"
            className="p-2 border border-neutral-200 hover:border-red-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-500 hover:text-red-650 rounded-xl transition flex items-center justify-center cursor-pointer hover:scale-105"
          >
            <LogOut className="h-4 w-4 shrink-0 transition" />
          </button>

        </div>

      </div>
    </header>
  );
}
