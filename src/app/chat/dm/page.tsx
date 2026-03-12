"use client";
import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  Timestamp,
  getDocs,
} from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, firestore } from "@/lib/firebase";
import Link from "next/link";
import { useTheme, Theme } from "@/components/theme-provider";
import { formatDistanceToNow } from "date-fns";

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
  size = 44,
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
        fontSize: size * 0.34,
        background: `linear-gradient(135deg, ${color}, ${color}BB)`,
      }}
    >
      {ini}
    </div>
  );
}

import { Conversation } from "@/types";

export default function DMListPage() {
  const { theme } = useTheme();
  const accent = ACCENTS[theme];
  const isLight = theme === "light";
  const [user, setUser] = useState<User | null>(null);
  const [convos, setConvos] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [allDevs, setAllDevs] = useState<any[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const q = query(
      collection(firestore, "conversations"),
      where("participants", "array-contains", user.uid),
    );
    return onSnapshot(q, async (snap) => {
      const raw = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as Conversation)
        .sort(
          (a, b) =>
            (b.updatedAt?.toMillis() || 0) - (a.updatedAt?.toMillis() || 0),
        );
      const enriched = await Promise.all(
        raw.map(async (c) => {
          const otherId = c.participants.find((p) => p !== user.uid);
          if (!otherId) return c;
          try {
            const uSnap = await getDoc(doc(firestore, "users", otherId));
            if (uSnap.exists())
              c.otherUser = { uid: otherId, ...(uSnap.data() as any) };
          } catch {}
          return c;
        }),
      );
      setConvos(enriched);
      setLoading(false);
    });
  }, [user]);

  useEffect(() => {
    if (!user || !showNewChat) return;
    (async () => {
      try {
        const snap = await getDocs(collection(firestore, "users"));
        setAllDevs(
          snap.docs
            .map((d) => ({ uid: d.id, ...d.data() }))
            .filter((d: any) => d.uid !== user.uid),
        );
      } catch {}
    })();
  }, [showNewChat, user]);

  const startChat = (otherUid: string) => {
    setShowNewChat(false);
    window.location.href = `/chat/dm/${otherUid}`;
  };

  const filteredDevs = allDevs.filter(
    (d: any) =>
      d.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      d.profession?.toLowerCase().includes(search.toLowerCase()),
  );

  const totalUnread = convos.reduce(
    (sum, c) => sum + (c.unread?.[user?.uid || ""] || 0),
    0,
  );

  if (!user) {
    return (
      <div
        className="flex-1 flex items-center justify-center"
        style={{ backgroundColor: "var(--bg)" }}
      >
        <div className="text-center space-y-3">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto"
            style={{
              background: `linear-gradient(135deg, ${accent}22, ${accent}11)`,
              border: `1px solid ${accent}30`,
            }}
          >
            рџ”’
          </div>
          <p className="font-bold" style={{ color: "var(--text)" }}>
            Kirish talab qilinadi
          </p>
          <Link
            href="/login"
            className="text-sm font-semibold block px-4 py-2 rounded-xl text-white"
            style={{
              background: `linear-gradient(135deg, ${accent}, ${accent}BB)`,
            }}
          >
            Kirish в†’
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 flex flex-col overflow-hidden"
      style={{ backgroundColor: "var(--bg)" }}
    >
      {/* в”Ђв”Ђ Header в”Ђв”Ђ */}
      <div
        className="px-5 py-4 border-b flex-shrink-0"
        style={{
          borderColor: "var(--border)",
          background: isLight
            ? "rgba(248,250,255,0.95)"
            : "rgba(10,10,20,0.95)",
          backdropFilter: "blur(16px)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1
              className="font-black text-xl tracking-tight"
              style={{ color: "var(--text)" }}
            >
              Messages
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--sub)" }}>
              {convos.length} ta suhbat
              {totalUnread > 0 && (
                <span
                  className="ml-2 px-1.5 py-0.5 rounded-full text-white text-[10px] font-black"
                  style={{ backgroundColor: accent }}
                >
                  {totalUnread} yangi
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => setShowNewChat(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm text-white transition-all hover:scale-105 active:scale-95"
            style={{
              background: `linear-gradient(135deg, ${accent}, ${accent}CC)`,
              boxShadow: `0 4px 16px ${accent}44`,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 5v14M5 12h14"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            <span className="hidden sm:inline">Yangi</span>
          </button>
        </div>

        {/* Search bar */}
        <div
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl"
          style={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            style={{ color: "var(--sub)", flexShrink: 0 }}
          >
            <circle
              cx="11"
              cy="11"
              r="8"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M21 21l-4.35-4.35"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Suhbatlarni qidirish..."
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: "var(--text)" }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{ color: "var(--sub)" }}
              className="hover:opacity-70"
            >
              вњ•
            </button>
          )}
        </div>
      </div>

      {/* в”Ђв”Ђ Conversations list в”Ђв”Ђ */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="space-y-3 w-full px-5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div
                    className="w-12 h-12 rounded-full flex-shrink-0"
                    style={{ backgroundColor: "var(--card)" }}
                  />
                  <div className="flex-1 space-y-2">
                    <div
                      className="h-3 rounded-lg w-1/3"
                      style={{ backgroundColor: "var(--card)" }}
                    />
                    <div
                      className="h-2.5 rounded-lg w-2/3"
                      style={{ backgroundColor: "var(--card)" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : convos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center gap-4">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl"
              style={{
                background: `linear-gradient(135deg, ${accent}18, ${accent}08)`,
                border: `1px solid ${accent}20`,
              }}
            >
              рџ’¬
            </div>
            <div>
              <p
                className="font-black text-lg mb-1.5"
                style={{ color: "var(--text)" }}
              >
                Hali suhbat yo'q
              </p>
              <p className="text-sm" style={{ color: "var(--sub)" }}>
                Boshqa developer bilan chat boshlang
              </p>
            </div>
            <button
              onClick={() => setShowNewChat(true)}
              className="mt-1 px-6 py-3 rounded-2xl font-bold text-sm text-white transition-all hover:scale-105 active:scale-95"
              style={{
                background: `linear-gradient(135deg, ${accent}, ${accent}CC)`,
                boxShadow: `0 6px 20px ${accent}44`,
              }}
            >
              + Yangi xabar boshlash
            </button>
          </div>
        ) : (
          <div className="py-2">
            {convos
              .filter((c) => {
                if (!search) return true;
                const name = c.otherUser?.fullName?.toLowerCase() || "";
                return name.includes(search.toLowerCase());
              })
              .map((c, idx) => {
                const other = c.otherUser;
                if (!other) return null;
                const unreadCount = c.unread?.[user.uid] || 0;
                const color = getColor(other.uid);
                const time = c.updatedAt
                  ? formatDistanceToNow(c.updatedAt.toDate(), {
                      addSuffix: true,
                    })
                  : "";
                const isLastMine = c.lastSenderUid === user.uid;
                const hasUnread = unreadCount > 0;

                return (
                  <Link
                    key={c.id}
                    href={`/chat/dm/${other.uid}`}
                    className="group flex items-center gap-3.5 px-4 py-3.5 mx-2 rounded-2xl transition-all"
                    style={{
                      backgroundColor: hasUnread
                        ? `${accent}08`
                        : "transparent",
                      border: hasUnread
                        ? `1px solid ${accent}18`
                        : "1px solid transparent",
                      marginBottom: 4,
                    }}
                    onMouseEnter={(e) => {
                      if (!hasUnread)
                        e.currentTarget.style.backgroundColor = "var(--card)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = hasUnread
                        ? `${accent}08`
                        : "transparent";
                    }}
                  >
                    {/* Avatar with online dot */}
                    <div className="relative flex-shrink-0">
                      <Avatar
                        name={other.fullName || "Dev"}
                        size={48}
                        color={color}
                        photo={other.photoURL}
                      />
                      <span
                        className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#10B981] rounded-full border-2"
                        style={{ borderColor: "var(--bg)" }}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <span
                          className="font-bold text-sm truncate"
                          style={{
                            color: hasUnread ? "var(--text)" : "var(--text)",
                            fontWeight: hasUnread ? 800 : 600,
                          }}
                        >
                          {other.fullName || "Developer"}
                        </span>
                        <span
                          className="text-[10px] flex-shrink-0 mt-0.5"
                          style={{ color: "var(--sub)" }}
                        >
                          {time}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className="text-xs truncate flex-1"
                          style={{
                            color: hasUnread ? "var(--text)" : "var(--sub)",
                            fontWeight: hasUnread ? 600 : 400,
                          }}
                        >
                          {isLastMine && (
                            <span style={{ color: accent }}>Siz: </span>
                          )}
                          {c.lastMessage || "Suhbat boshlandi"}
                        </p>
                        {hasUnread ? (
                          <span
                            className="flex-shrink-0 min-w-[20px] h-5 rounded-full text-[10px] font-black text-white flex items-center justify-center px-1.5"
                            style={{
                              backgroundColor: accent,
                              boxShadow: `0 2px 8px ${accent}66`,
                            }}
                          >
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </span>
                        ) : (
                          <div
                            className="w-6 h-6 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                            style={{ backgroundColor: `${accent}18` }}
                          >
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <path
                                d="M5 12h14M12 5l7 7-7 7"
                                stroke={accent}
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                      {other.profession && (
                        <p
                          className="text-[10px] mt-0.5 truncate"
                          style={{ color }}
                        >
                          {other.profession}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
          </div>
        )}
      </div>

      {/* в”Ђв”Ђ New Chat Modal в”Ђв”Ђ */}
      {showNewChat && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{
            backgroundColor: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(12px)",
          }}
          onClick={(e) => e.target === e.currentTarget && setShowNewChat(false)}
        >
          <div
            className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
            style={{
              backgroundColor: "var(--bg)",
              border: "1px solid var(--border)",
              boxShadow: `0 32px 80px ${accent}28`,
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Modal header */}
            <div
              className="px-5 pt-5 pb-4 border-b flex items-center justify-between flex-shrink-0"
              style={{ borderColor: "var(--border)" }}
            >
              <div>
                <h3
                  className="font-black text-lg"
                  style={{ color: "var(--text)" }}
                >
                  Yangi xabar
                </h3>
                <p className="text-xs mt-0.5" style={{ color: "var(--sub)" }}>
                  {allDevs.length} ta developer
                </p>
              </div>
              <button
                onClick={() => setShowNewChat(false)}
                className="w-9 h-9 rounded-xl flex items-center justify-center hover:opacity-70 transition-all font-bold"
                style={{
                  backgroundColor: "var(--card)",
                  color: "var(--sub)",
                  border: "1px solid var(--border)",
                }}
              >
                вњ•
              </button>
            </div>

            {/* Search */}
            <div className="px-4 py-3 flex-shrink-0">
              <div
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl"
                style={{
                  backgroundColor: "var(--card)",
                  border: `1.5px solid ${accent}30`,
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{ color: accent, flexShrink: 0 }}
                >
                  <circle
                    cx="11"
                    cy="11"
                    r="8"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M21 21l-4.35-4.35"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                <input
                  autoFocus
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Ism yoki kasb bo'yicha..."
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: "var(--text)" }}
                />
              </div>
            </div>

            {/* Devs list */}
            <div className="overflow-y-auto flex-1 pb-4">
              {filteredDevs.length === 0 ? (
                <div
                  className="text-center py-12"
                  style={{ color: "var(--sub)" }}
                >
                  <div className="text-4xl mb-3">рџ‘Ґ</div>
                  <p className="text-sm font-semibold">Developer topilmadi</p>
                </div>
              ) : (
                <div className="px-3 space-y-0.5">
                  {filteredDevs.map((dev: any) => {
                    const color = getColor(dev.uid);
                    return (
                      <button
                        key={dev.uid}
                        onClick={() => startChat(dev.uid)}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all text-left group"
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            "var(--card)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            "transparent")
                        }
                      >
                        <div className="relative flex-shrink-0">
                          <Avatar
                            name={dev.fullName || "Dev"}
                            size={44}
                            color={color}
                            photo={dev.photoURL}
                          />
                          <span
                            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#10B981] rounded-full border-2"
                            style={{ borderColor: "var(--bg)" }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className="font-bold text-sm truncate"
                            style={{ color: "var(--text)" }}
                          >
                            {dev.fullName || "Developer"}
                          </p>
                          <p
                            className="text-xs truncate font-medium"
                            style={{ color }}
                          >
                            {dev.profession || "Developer"}
                          </p>
                        </div>
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all group-hover:scale-110 flex-shrink-0"
                          style={{
                            background: `linear-gradient(135deg, ${accent}22, ${accent}11)`,
                            border: `1px solid ${accent}30`,
                          }}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              d="M5 12h14M12 5l7 7-7 7"
                              stroke={accent}
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
