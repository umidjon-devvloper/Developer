"use client";
import { useEffect, useRef, useState } from "react";
import { useTheme, THEMES, Theme } from "@/components/theme-provider";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, firestore } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  where,
} from "firebase/firestore";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ACCENTS: Record<Theme, string> = {
  dark: "#6366F1",
  light: "#6366F1",
  purple: "#8B5CF6",
  ocean: "#3B82F6",
  sunset: "#F97316",
};

function getColor(uid: string) {
  const C = [
    "#6366F1",
    "#8B5CF6",
    "#EC4899",
    "#10B981",
    "#F59E0B",
    "#3B82F6",
    "#EF4444",
    "#14B8A6",
  ];
  let h = 0;
  for (let i = 0; i < uid.length; i++) h = uid.charCodeAt(i) + ((h << 5) - h);
  return C[Math.abs(h) % C.length];
}

function Avatar({
  name,
  size = 32,
  color,
  photo,
}: {
  name: string;
  size?: number;
  color: string;
  photo?: string;
}) {
  if (photo)
    return (
      <img
        src={photo}
        alt={name}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    );
  const ini = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: `linear-gradient(135deg, ${color}, ${color}BB)`,
      }}
    >
      {ini}
    </div>
  );
}

function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const accent = ACCENTS[theme];
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105"
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
        }}
      >
        <span className="text-base">рџЋЁ</span>
      </button>
      {open && (
        <div
          className="absolute top-full mt-2 right-0 rounded-2xl p-2 shadow-2xl w-44 z-[9999]"
          style={{
            backgroundColor: THEMES[theme].bg,
            border: "1px solid var(--border)",
            boxShadow: `0 20px 60px ${accent}22`,
          }}
        >
          <p
            className="text-[10px] font-bold tracking-widest px-3 pt-1 pb-2 opacity-50"
            style={{ color: "var(--text)" }}
          >
            TEMA
          </p>
          {(Object.entries(THEMES) as [Theme, (typeof THEMES)[Theme]][]).map(
            ([key, val]) => (
              <button
                key={key}
                onClick={() => {
                  setTheme(key);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all text-left"
                style={{
                  backgroundColor:
                    theme === key ? ACCENTS[key] + "20" : "transparent",
                }}
              >
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: val.bg,
                    border: `2px solid ${ACCENTS[key]}`,
                    boxShadow:
                      theme === key ? `0 0 0 2px ${ACCENTS[key]}44` : "none",
                  }}
                />
                <span
                  className="text-xs font-semibold"
                  style={{
                    color: theme === key ? ACCENTS[key] : "var(--text)",
                  }}
                >
                  {val.label}
                </span>
                {theme === key && (
                  <span
                    className="ml-auto text-xs font-black"
                    style={{ color: ACCENTS[key] }}
                  >
                    вњ“
                  </span>
                )}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme } = useTheme();
  const pathname = usePathname();
  const accent = ACCENTS[theme];
  const [user, setUser] = useState<User | null>(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const [mobileSidebar, setMobileSidebar] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    const q = query(
      collection(firestore, "messages"),
      orderBy("createdAt", "desc"),
      limit(50),
    );
    return onSnapshot(q, (snap) => {
      const seen = new Set<string>();
      const users: any[] = [];
      snap.docs.forEach((d) => {
        const data = d.data();
        if (!seen.has(data.uid)) {
          seen.add(data.uid);
          users.push({
            uid: data.uid,
            displayName: data.displayName || "Dev",
            color: data.color || getColor(data.uid),
            photoURL: data.photoURL,
          });
        }
      });
      setRecentUsers(users.slice(0, 10));
      setOnlineCount(seen.size);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(firestore, "conversations"),
      where("participants", "array-contains", user.uid),
    );
    return onSnapshot(q, (snap) => {
      let total = 0;
      snap.docs.forEach((d) => {
        total += d.data().unread?.[user.uid] || 0;
      });
      setTotalUnread(total);
    });
  }, [user]);

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const navItems = [
    {
      href: "/chat",
      exact: true,
      icon: "рџЊђ",
      label: "Community Chat",
      desc: "Barcha developerlar",
      badge: onlineCount > 0 ? `${onlineCount} faol` : null,
      badgeColor: "#10B981",
    },
    {
      href: "/chat/dm",
      exact: false,
      icon: "рџ’¬",
      label: "Direct Messages",
      desc: "Shaxsiy suhbatlar",
      badge:
        totalUnread > 0 ? String(totalUnread > 99 ? "99+" : totalUnread) : null,
      badgeColor: accent,
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div
        className="px-4 py-4 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black text-white"
              style={{
                background: `linear-gradient(135deg, ${accent}, ${accent}BB)`,
              }}
            >
              рџ’¬
            </div>
            <span
              className="font-black text-sm"
              style={{ color: "var(--text)" }}
            >
              Chat
            </span>
          </div>
          <ThemeSwitcher />
        </div>
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{
            backgroundColor: "#10B98115",
            border: "1px solid #10B98130",
          }}
        >
          <span className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse flex-shrink-0" />
          <span className="text-xs font-semibold text-[#10B981]">
            {onlineCount} developer faol
          </span>
        </div>
      </div>

      <div className="px-3 py-3 space-y-1">
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileSidebar(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
              style={{
                background: active
                  ? `linear-gradient(135deg, ${accent}20, ${accent}0D)`
                  : "transparent",
                border: active
                  ? `1px solid ${accent}30`
                  : "1px solid transparent",
              }}
            >
              <span
                className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                style={{
                  backgroundColor: active ? accent + "22" : "var(--card)",
                  border: `1px solid ${active ? accent + "40" : "var(--border)"}`,
                }}
              >
                {item.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className="text-sm font-bold leading-none mb-0.5 truncate"
                  style={{ color: active ? accent : "var(--text)" }}
                >
                  {item.label}
                </p>
                <p className="text-xs truncate" style={{ color: "var(--sub)" }}>
                  {item.desc}
                </p>
              </div>
              {item.badge && (
                <span
                  className="flex-shrink-0 text-[10px] font-black text-white px-1.5 py-0.5 rounded-full min-w-[20px] text-center"
                  style={{ backgroundColor: item.badgeColor }}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <div
        className="mx-4 my-1 h-px"
        style={{ backgroundColor: "var(--border)" }}
      />

      <div className="flex-1 overflow-y-auto px-3 py-3">
        <p
          className="text-[10px] font-bold tracking-widest px-2 mb-3 opacity-40"
          style={{ color: "var(--text)" }}
        >
          COMMUNITY DA FAOLLAR
        </p>
        <div className="space-y-0.5">
          {recentUsers.map((u) => (
            <Link
              key={u.uid}
              href={`/profile/${u.uid}`}
              className="flex items-center gap-2.5 px-2 py-2 rounded-xl transition-all"
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "var(--card)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              <div className="relative flex-shrink-0">
                <Avatar
                  name={u.displayName}
                  size={28}
                  color={u.color}
                  photo={u.photoURL}
                />
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#10B981] rounded-full border-2"
                  style={{ borderColor: "var(--bg)" }}
                />
              </div>
              <span
                className="text-xs font-semibold truncate"
                style={{ color: "var(--text)" }}
              >
                {u.displayName}
              </span>
            </Link>
          ))}
          {recentUsers.length === 0 && (
            <p
              className="text-xs text-center py-4 opacity-30"
              style={{ color: "var(--sub)" }}
            >
              Hali xabar yo'q
            </p>
          )}
        </div>
      </div>

      {user && (
        <div
          className="px-3 pb-4 pt-2 border-t"
          style={{ borderColor: "var(--border)" }}
        >
          <Link
            href={`/profile/${user.uid}`}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all"
            style={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
            }}
          >
            <Avatar
              name={user.displayName || user.email || "U"}
              size={32}
              color={getColor(user.uid)}
              photo={user.photoURL || undefined}
            />
            <div className="min-w-0 flex-1">
              <p
                className="text-xs font-bold truncate"
                style={{ color: "var(--text)" }}
              >
                {user.displayName || user.email?.split("@")[0]}
              </p>
              <p className="text-[10px] text-[#10B981] font-semibold">
                в—Џ Online
              </p>
            </div>
          </Link>
        </div>
      )}
    </div>
  );

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: "var(--bg)" }}
    >
      <aside
        className="hidden md:flex flex-col w-64 flex-shrink-0 border-r overflow-visible"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}
      >
        {sidebarContent}
      </aside>

      {mobileSidebar && (
        <div className="md:hidden fixed inset-0 z-40 flex" style={{ top: 64 }}>
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileSidebar(false)}
          />
          <aside
            className="relative z-50 w-72 flex flex-col border-r overflow-hidden"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--bg)",
            }}
          >
            {sidebarContent}
          </aside>
        </div>
      )}

      <button
        className="md:hidden fixed bottom-6 left-4 z-30 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg text-white relative"
        style={{
          background: `linear-gradient(135deg, ${accent}, ${accent}BB)`,
        }}
        onClick={() => setMobileSidebar(!mobileSidebar)}
      >
        {mobileSidebar ? "вњ•" : "в°"}
        {!mobileSidebar && totalUnread > 0 && (
          <span
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center"
            style={{ backgroundColor: accent, border: "2px solid var(--bg)" }}
          >
            {totalUnread > 9 ? "9+" : totalUnread}
          </span>
        )}
      </button>

      <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
    </div>
  );
}
