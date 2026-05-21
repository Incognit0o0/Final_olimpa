/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { UserProfile, VolunteerTask, TaskApplication, NotificationLog, UserRole } from "./types.js";
import { api, setActiveUser, getActiveUserSync } from "./api.js";
import Header from "./components/Header.tsx";
import LandingPage from "./components/LandingPage.tsx";
import VolunteerCabinet from "./components/VolunteerCabinet.tsx";
import FundCabinet from "./components/FundCabinet.tsx";
import AdminCabinet from "./components/AdminCabinet.tsx";
import Footer from "./components/Footer.tsx";
import { Heart } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [tasks, setTasks] = useState<VolunteerTask[]>([]);
  const [applications, setApplications] = useState<TaskApplication[]>([]);
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [isInitialised, setIsInitialised] = useState(false);

  // Lifted cabinet tab states to enable cross-navigation from the header
  const [volunteerTab, setVolunteerTab] = useState<"feed" | "profile">("feed");
  const [fundTab, setFundTab] = useState<"tasks" | "create" | "candidates" | "profile">("tasks");

  const handleGoToProfile = () => {
    if (user) {
      if (user.role === UserRole.VOLUNTEER) {
        setVolunteerTab("profile");
      } else if (user.role === UserRole.FUND) {
        setFundTab("profile");
      }
    }
  };

  // Load everything on start
  useEffect(() => {
    const initSession = async () => {
      const storedUserId = localStorage.getItem("stoloto_v_user_id");
      if (storedUserId) {
        try {
          const res = await api.me();
          setUser(res.user);
          setActiveUser(res.user);
        } catch (err) {
          console.warn("Session restore failed, returning to guest view", err);
          localStorage.removeItem("stoloto_v_user_id");
        }
      }
      setIsInitialised(true);
    };

    initSession();
  }, []);

  // Poll databases and feed elements periodically
  useEffect(() => {
    if (isInitialised) {
      loadAllData();
    }
  }, [user?.id, isInitialised]);

  const loadAllData = async () => {
    const storedUserId = localStorage.getItem("stoloto_v_user_id");
    if (!storedUserId) {
      // Still fetch tasks for public unauthenticated view
      try {
        const tResult = await api.getTasks();
        setTasks(tResult.tasks);
      } catch (err) {
        console.error(err);
      }
      return;
    }

    try {
      const [tResult, aResult, nResult, meResult] = await Promise.all([
        api.getTasks({ status: "" }), // get all matching filterable states
        api.getApplications(),
        api.getNotifications(),
        api.me()
      ]);

      setTasks(tResult.tasks);
      setApplications(aResult.applications);
      setNotifications(nResult.notifications);
      
      // Update our user stats dynamically (e.g. if hours changed)
      setUser(meResult.user);
      setActiveUser(meResult.user);
    } catch (err: any) {
      console.error("Failed to load platform databases", err);
      // Clean up session if backend rejected auth (e.g. user deleted or database reset)
      const errStr = (err?.message || "").toLowerCase();
      if (errStr.includes("авторизац") || errStr.includes("401") || errStr.includes("403")) {
        localStorage.removeItem("stoloto_v_user_id");
        setUser(null);
        setActiveUser(null);
        setApplications([]);
        setNotifications([]);
      }
    }
  };

  const handleLoginSuccess = (profile: UserProfile) => {
    setUser(profile);
    setActiveUser(profile);
    setVolunteerTab("feed");
    setFundTab("tasks");
  };

  const handleLogout = () => {
    setUser(null);
    setActiveUser(null);
    setApplications([]);
    setNotifications([]);
    setVolunteerTab("feed");
    setFundTab("tasks");
  };

  if (!isInitialised) {
    return (
      <div id="fallback-bootstrap-loader" className="min-h-screen bg-[#F5F5F5] flex flex-col justify-center items-center font-sans">
        <div className="animate-spin h-10 w-10 border-4 border-[#FFE300] border-t-transparent rounded-full shadow-sm mb-4" />
        <h3 className="font-extrabold text-[#000000] text-sm tracking-tight">Загрузка платформы Столото «Помогать проСТО»...</h3>
        <p className="text-xs text-neutral-500 mt-1">Инициализация локальной базы PostgreSQL...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col" id="applet-viewport-frame">
      {/* 1. Global top-app header if signed in */}
      {user ? (
        <>
          <Header
            user={user}
            notifications={notifications}
            onLogout={handleLogout}
            onRefreshNotifications={loadAllData}
            onGoToProfile={handleGoToProfile}
          />

          <main className="container mx-auto px-4 py-8 max-w-7xl flex-1">
            {/* View dispatching based on user actor role */}
            {user.role === UserRole.VOLUNTEER && (
              <VolunteerCabinet
                user={user}
                tasks={tasks}
                applications={applications}
                onRefreshAll={loadAllData}
                activeTab={volunteerTab}
                setActiveTab={setVolunteerTab}
              />
            )}

            {user.role === UserRole.FUND && (
              <FundCabinet
                user={user}
                tasks={tasks}
                applications={applications}
                onRefreshAll={loadAllData}
                activeTab={fundTab}
                setActiveTab={setFundTab}
              />
            )}

            {user.role === UserRole.ADMIN && (
              <AdminCabinet
                user={user}
                tasks={tasks}
                applications={applications}
                onRefreshAll={loadAllData}
              />
            )}
          </main>
          <Footer />
        </>
      ) : (
        <LandingPage onLoginSuccess={handleLoginSuccess} onRefreshAll={loadAllData} />
      )}
    </div>
  );
}
