"use client";
import { useEffect, useRef, useState } from "react";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  limit,
} from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, firestore } from "@/lib/firebase";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useTheme, THEMES, Theme } from "@/components/theme-provider";

const THEME_ACCENTS: Record<Theme, string> = {
  dark: "#6366F1",
  light: "#6366F1",
  purple: "#8B5CF6",
  ocean: "#3B82F6",
  sunset: "#F97316",
};

import { Message } from "@/types";

const USER_COLORS = [
  "#6366F1",
  "#8B5CF6",
  "#EC4899",
  "#10B981",
  "#F59E0B",
  "#3B82F6",
  "#EF4444",
  "#14B8A6",
];

function getColor(uid: string) {
  let hash = 0;
  for (let i = 0; i < uid.length; i++)
    hash = uid.charCodeAt(i) + ((hash << 5) - hash);
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}

function Avatar({
  name,
  color,
  size = 36,
  photoURL,
}: {
  name: string;
  color: string;
  size?: number;
  photoURL?: string;
}) {
  if (photoURL)
    return (
      <img
        src={photoURL}
        alt={name}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    );
  const initials = name
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
        background: `linear-gradient(135deg, ${color}, ${color}99)`,
      }}
    >
      {initials}
    </div>
  );
}

export default function CommunityChat() {
  const { theme } = useTheme();
  const accent = THEME_ACCENTS[theme];
  const isLight = theme === "light";

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const q = query(
      collection(firestore, "messages"),
      orderBy("createdAt", "asc"),
      limit(200),
    );
    return onSnapshot(q, (snap) => {
      const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Message);
      setMessages(msgs);
      // Count unique users as "online" heuristic
      const unique = new Set(msgs.slice(-50).map((m) => m.uid || "anon"));
      setOnlineCount(unique.size);
    });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!text.trim() || !user) return;
    setSending(true);
    try {
      await addDoc(collection(firestore, "messages"), {
        text: text.trim(),
        uid: user.uid,
        displayName: user.displayName || user.email?.split("@")[0] || "Dev",
        email: user.email || "",
        color: getColor(user.uid),
        photoURL: user.photoURL || "",
        createdAt: serverTimestamp(),
      });
      setText("");
      inputRef.current?.focus();
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div
        className="flex-1 flex items-center justify-center"
        style={{ backgroundColor: "var(--bg)" }}
      >
        <div
          className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: accent, borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div
        className="flex-1 flex items-center justify-center px-4"
        style={{ backgroundColor: "var(--bg)" }}
      >
        <div className="text-center max-w-sm">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-6"
            style={{
              background: `linear-gradient(135deg, ${accent}, ${accent}BB)`,
            }}
          >
            💬
          </div>
          <h2
            className="text-2xl font-black mb-3"
            style={{ color: "var(--text)" }}
          >
            Chat ga kirish
          </h2>
          <p className="mb-8" style={{ color: "var(--sub)" }}>
            Developer community bilan chat qilish uchun avval kiring
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/login"
              className="px-6 py-3 rounded-xl font-bold transition-all hover:opacity-80"
              style={{
                border: "1px solid var(--border)",
                color: "var(--text)",
              }}
            >
              Kirish
            </Link>
            <Link
              href="/register"
              className="px-6 py-3 rounded-xl font-bold text-white hover:opacity-90 transition-all"
              style={{
                background: `linear-gradient(135deg, ${accent}, ${accent}BB)`,
              }}
            >
              Ro'yxatdan o'tish
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 flex flex-col overflow-hidden"
      style={{ backgroundColor: "var(--bg)" }}
    >
      {/* Chat header */}
      <div
        className="px-4 py-3 border-b flex items-center gap-3 flex-shrink-0"
        style={{
          borderColor: "var(--border)",
          backgroundColor: isLight
            ? "rgba(240,244,255,0.9)"
            : "rgba(15,15,26,0.9)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${accent}, ${accent}BB)`,
          }}
        >
          🌐
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-black text-sm" style={{ color: "var(--text)" }}>
            Community Chat
          </h1>
          <p className="text-xs" style={{ color: "var(--sub)" }}>
            {messages.length} ta xabar
          </p>
        </div>
        {/* Online badge */}
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
          style={{
            backgroundColor: "#10B98115",
            border: "1px solid #10B98130",
          }}
        >
          <span className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse" />
          <span className="text-xs font-bold text-[#10B981]">
            {onlineCount} faol
          </span>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="max-w-3xl mx-auto space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">👋</div>
              <p className="font-semibold" style={{ color: "var(--sub)" }}>
                Birinchi xabarni yuboring!
              </p>
            </div>
          )}

          {messages.map((msg, i) => {
            const isOwn = msg.uid === user.uid;
            const showMeta = i === 0 || messages[i - 1].uid !== msg.uid;
            const time = msg.createdAt
              ? formatDistanceToNow(msg.createdAt.toDate(), { addSuffix: true })
              : "hozirgina";

            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar column */}
                <div className="w-8 flex-shrink-0 mt-0.5">
                  {showMeta && (
                    <Avatar
                      name={msg.displayName || "User"}
                      color={msg.color || getColor(msg.uid || "anon")}
                      size={32}
                      photoURL={msg.photoURL}
                    />
                  )}
                </div>

                <div
                  className={`flex flex-col max-w-[72%] ${isOwn ? "items-end" : "items-start"}`}
                >
                  {showMeta && (
                    <div
                      className={`flex items-baseline gap-2 mb-1 ${isOwn ? "flex-row-reverse" : ""}`}
                    >
                      <Link
                        href={`/profile/${msg.uid}`}
                        className="text-xs font-bold hover:underline"
                        style={{ color: msg.color || getColor(msg.uid || "anon") }}
                      >
                        {isOwn ? "Siz" : (msg.displayName || "User")}
                      </Link>
                      <span
                        className="text-[10px]"
                        style={{ color: "var(--sub)" }}
                      >
                        {time}
                      </span>
                    </div>
                  )}
                  <div
                    className={`px-3.5 py-2.5 text-sm leading-relaxed break-words ${
                      isOwn
                        ? "rounded-2xl rounded-tr-sm"
                        : "rounded-2xl rounded-tl-sm"
                    }`}
                    style={{
                      background: isOwn
                        ? `linear-gradient(135deg, ${accent}, ${accent}DD)`
                        : "var(--card)",
                      color: isOwn ? "#fff" : "var(--text)",
                      border: isOwn ? "none" : "1px solid var(--border)",
                      boxShadow: isOwn ? `0 4px 16px ${accent}33` : "none",
                    }}
                  >
                    {msg.text}
                  </div>
                  {!showMeta && (
                    <span
                      className="text-[10px] mt-0.5 px-1"
                      style={{ color: "var(--sub)" }}
                    >
                      {time}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input bar */}
      <div
        className="px-4 py-3 border-t flex-shrink-0"
        style={{
          borderColor: "var(--border)",
          backgroundColor: isLight
            ? "rgba(240,244,255,0.95)"
            : "rgba(15,15,26,0.95)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="max-w-3xl mx-auto flex items-center gap-2.5">
          <Avatar
            name={user.displayName || user.email || "U"}
            color={getColor(user.uid)}
            size={36}
            photoURL={user.photoURL || undefined}
          />
          <div
            className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{
              backgroundColor: "var(--card)",
              border: `1px solid var(--border)`,
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Xabar yozing... (Enter = yuborish)"
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: "var(--text)" }}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={sending || !text.trim()}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:opacity-90 disabled:opacity-40 flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, ${accent}, ${accent}BB)`,
            }}
          >
            {sending ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9L22 2"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
