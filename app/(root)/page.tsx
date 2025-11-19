"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Mode = "login" | "signup";

type StoredUser = {
  name: string;
  email: string;
  password: string;
  role: "Quest Giver" | "Guild Master" | "Adventurer";
  xp: number;
};

type Session = Pick<StoredUser, "name" | "email" | "role" | "xp">;

const STORAGE_KEYS = {
  USERS: "devquest_users",
  SESSION: "devquest_session",
};

const DEFAULT_USERS: StoredUser[] = [
  {
    name: "Lyra Solaris",
    email: "client@devquest.io",
    password: "summon2025",
    role: "Quest Giver",
    xp: 320,
  },
  {
    name: "Ava Storm",
    email: "pm@devquest.io",
    password: "guildmaster",
    role: "Guild Master",
    xp: 540,
  },
  {
    name: "Kai Ember",
    email: "dev@devquest.io",
    password: "adventure",
    role: "Adventurer",
    xp: 260,
  },
];

export default function Home() {
  const [mode, setMode] = useState<Mode>("login");
  const [users, setUsers] = useState<StoredUser[]>(DEFAULT_USERS);
  const [session, setSession] = useState<Session | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedUsers = window.localStorage.getItem(STORAGE_KEYS.USERS);
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    } else {
      window.localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
    }

    const storedSession = window.localStorage.getItem(STORAGE_KEYS.SESSION);
    if (storedSession) {
      setSession(JSON.parse(storedSession));
    }
  }, []);

  const leaderboard = useMemo(() => {
    return [...users].sort((a, b) => b.xp - a.xp).slice(0, 4);
  }, [users]);

  const handleFieldChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const persistUsers = (nextUsers: StoredUser[]) => {
    setUsers(nextUsers);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(nextUsers));
    }
  };

  const persistSession = (nextSession: Session | null) => {
    setSession(nextSession);
    if (typeof window !== "undefined") {
      if (nextSession) {
        window.localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(nextSession));
      } else {
        window.localStorage.removeItem(STORAGE_KEYS.SESSION);
      }
    }
  };

  const resetMessage = () => setMessage(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetMessage();

    const email = formData.email.trim().toLowerCase();
    const password = formData.password.trim();
    const name = formData.name.trim();

    if (!email || !password || (mode === "signup" && !name)) {
      setMessage({ type: "error", text: "Please fill out every field to continue." });
      return;
    }

    if (!email.includes("@")) {
      setMessage({ type: "error", text: "Please enter a valid email address." });
      return;
    }

    if (password.length < 6) {
      setMessage({ type: "error", text: "Passwords must be at least 6 characters long." });
      return;
    }

    if (mode === "signup") {
      if (users.some((user) => user.email === email)) {
        setMessage({ type: "error", text: "That email is already linked to an adventurer." });
        return;
      }

      const newUser: StoredUser = {
        name,
        email,
        password,
        role: "Adventurer",
        xp: 120,
      };

      const nextUsers = [...users, newUser];
      persistUsers(nextUsers);
      const nextSession: Session = {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        xp: newUser.xp,
      };
      persistSession(nextSession);

      setMessage({ type: "success", text: "Account ready! You have spawned inside the guild hall." });
      setFormData({ name: "", email: "", password: "" });
      return;
    }

    // login path
    const existingUser = users.find((user) => user.email === email);
    if (!existingUser || existingUser.password !== password) {
      setMessage({ type: "error", text: "No matching adventurer found. Check your credentials." });
      return;
    }

    persistSession({
      name: existingUser.name,
      email: existingUser.email,
      role: existingUser.role,
      xp: existingUser.xp,
    });
    setMessage({ type: "success", text: "Welcome back! Your quest log is synchronized." });
    setFormData({ name: "", email: "", password: "" });
  };

  const handleLogout = () => {
    persistSession(null);
    setMessage({ type: "success", text: "Session closed. Return when you are ready for more quests." });
  };

  const handleDailyQuest = () => {
    if (!session) return;
    const bonus = 40;
    const nextUsers = users.map((user) =>
      user.email === session.email ? { ...user, xp: user.xp + bonus } : user
    );
    persistUsers(nextUsers);
    const updatedUser = nextUsers.find((user) => user.email === session.email)!;
    persistSession({
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      xp: updatedUser.xp,
    });
    setMessage({ type: "success", text: `Daily quest cleared! +${bonus} XP awarded.` });
  };

  const level = session ? Math.floor(session.xp / 100) + 1 : 0;
  const xpIntoLevel = session ? session.xp % 100 : 0;

  return (
    <main className="auth-grid">
      <section className="hero-card">
        <p className="eyebrow">DevQuest • Web-A-Thon Build</p>
        <h1>
          Enter the guild <span>and turn sprints into epic quests.</span>
        </h1>
        <p className="supporting">
          Stay motivated with XP, badges, and real-time status visibility. Whether you are a Quest
          Giver, Guild Master, or Adventurer, DevQuest keeps everyone aligned and energized.
        </p>

        <div className="feature-grid">
          <div>
            <p className="feature-title">Role-based access</p>
            <p className="feature-copy">Invite clients, PMs, and devs with customized dashboards.</p>
          </div>
          <div>
            <p className="feature-title">Kanban + XP</p>
            <p className="feature-copy">To-Do → In-Progress → Review → Done, each move earns XP.</p>
          </div>
          <div>
            <p className="feature-title">Leaderboards</p>
            <p className="feature-copy">Friendly competition keeps the party productive.</p>
          </div>
        </div>

        <div className="stats-banner">
          <p>
            <span>3</span> roles · <span>4</span> core quests · <span>∞</span> motivation
          </p>
          <p>Optional boosts: AI tasks, chat, daily quests, and more.</p>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <button
            className={mode === "login" ? "tab active" : "tab"}
            onClick={() => {
              resetMessage();
              setMode("login");
            }}
          >
            Login
          </button>
          <button
            className={mode === "signup" ? "tab active" : "tab"}
            onClick={() => {
              resetMessage();
              setMode("signup");
            }}
          >
            Sign Up
          </button>
        </div>

        {!session && (
          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === "signup" && (
              <label className="input-field">
                <span>Display name</span>
                <input
                  name="name"
                  type="text"
                  placeholder="Aelin the Bold"
                  value={formData.name}
                  onChange={handleFieldChange}
                />
              </label>
            )}

            <label className="input-field">
              <span>Email</span>
              <input
                name="email"
                type="email"
                placeholder="you@devquest.io"
                autoComplete="email"
                value={formData.email}
                onChange={handleFieldChange}
              />
            </label>

            <label className="input-field">
              <span>Password</span>
              <input
                name="password"
                type="password"
                placeholder="••••••••"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={formData.password}
                onChange={handleFieldChange}
              />
            </label>

            {message && (
              <p className={`form-message ${message.type === "success" ? "success" : "error"}`}>
                {message.text}
              </p>
            )}

            <button className="primary-btn" type="submit">
              {mode === "login" ? "Enter the Guild" : "Forge Account"}
            </button>

            <p className="toggle-copy">
              {mode === "login" ? "Need an invite?" : "Already part of the guild?"}{" "}
              <button
                type="button"
                onClick={() => {
                  resetMessage();
                  setMode(mode === "login" ? "signup" : "login");
                }}
              >
                {mode === "login" ? "Sign up instead" : "Login instead"}
              </button>
            </p>
          </form>
        )}

        {session && (
          <div className="session-card">
            <p className="eyebrow">Authenticated as</p>
            <h2>{session.name}</h2>
            <p className="role-chip">{session.role}</p>
            <div className="xp-progress">
              <div className="xp-bar" style={{ width: `${xpIntoLevel}%` }} />
            </div>
            <p className="xp-meta">
              Level {level} · {session.xp} XP total · {100 - xpIntoLevel} XP to next level
            </p>

            {message && (
              <p className={`form-message ${message.type === "success" ? "success" : "error"}`}>
                {message.text}
              </p>
            )}

            <div className="session-actions">
              <button className="ghost-btn" onClick={handleDailyQuest}>
                Claim Daily Quest XP
              </button>
              <button className="danger-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        )}

        <div className="leaderboard">
          <p className="eyebrow">XP Leaderboard</p>
          <ul>
            {leaderboard.map((user, index) => (
              <li key={user.email}>
                <span>
                  #{index + 1} {user.name}
                </span>
                <span>{user.xp} XP</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
