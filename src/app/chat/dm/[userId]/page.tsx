"use client";
import { useEffect, useRef, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  Timestamp,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
} from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, firestore } from "@/lib/firebase";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format, isToday, isYesterday } from "date-fns";
import { useTheme, Theme } from "@/components/theme-provider";

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

function getConvoId(uid1: string, uid2: string) {
  return [uid1, uid2].sort().join("_");
}

function Avatar({
  name,
  size = 36,
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

import { Message } from "@/types";

function formatMsgTime(ts: Timestamp | null): string {
  if (!ts) return "";
  const d = ts.toDate();
  if (isToday(d)) return format(d, "HH:mm");
  if (isYesterday(d)) return `Kecha ${format(d, "HH:mm")}`;
  return format(d, "d MMM, HH:mm");
}

function DateDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-5">
      <div
        className="flex-1 h-px"
        style={{ backgroundColor: "var(--border)" }}
      />
      <span
        className="text-[10px] font-bold px-3 py-1 rounded-full"
        style={{
          color: "var(--sub)",
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
        }}
      >
        {label}
      </span>
      <div
        className="flex-1 h-px"
        style={{ backgroundColor: "var(--border)" }}
      />
    </div>
  );
}

// ─── Browser Push Notification helper ───────────────────────────────────
async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const permission = await Notification.requestPermission();
  return permission === "granted";
}

function showBrowserNotification(title: string, body: string, icon?: string) {
  if (Notification.permission !== "granted") return;
  const n = new Notification(title, {
    body,
    icon: icon || "/favicon.ico",
    badge: "/favicon.ico",
    tag: "dm-message",
  });
  n.onclick = () => {
    window.focus();
    n.close();
  };
  setTimeout(() => n.close(), 5000);
}

// ─── In-app toast notification ───────────────────────────────────────────
function Toast({
  msg,
  onClose,
}: {
  msg: { title: string; body: string; color: string; photo?: string } | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(onClose, 4500);
    return () => clearTimeout(t);
  }, [msg, onClose]);

  if (!msg) return null;
  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl transition-all"
      style={{
        backgroundColor: "var(--bg)",
        border: `1px solid ${msg.color}40`,
        boxShadow: `0 8px 32px ${msg.color}28`,
        backdropFilter: "blur(16px)",
        minWidth: 280,
        maxWidth: "calc(100vw - 32px)",
        animation: "slideDown 0.3s cubic-bezier(0.34,1.56,0.64,1)",
      }}
    >
      <style>{`@keyframes slideDown { from { opacity:0; transform: translate(-50%,-16px); } to { opacity:1; transform: translate(-50%,0); } }`}</style>
      <div
        className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${msg.color}, ${msg.color}BB)`,
        }}
      >
        {msg.photo ? (
          <img src={msg.photo} alt="" className="w-full h-full object-cover" />
        ) : (
          msg.title[0]
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p
          className="text-xs font-black truncate"
          style={{ color: "var(--text)" }}
        >
          {msg.title}
        </p>
        <p className="text-xs truncate mt-0.5" style={{ color: "var(--sub)" }}>
          {msg.body}
        </p>
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0 opacity-40 hover:opacity-100 transition-opacity text-xs"
        style={{ color: "var(--text)" }}
      >
        ✕
      </button>
    </div>
  );
}

export default function DMChatPage() {
  const { theme } = useTheme();
  const accent = ACCENTS[theme];
  const isLight = theme === "light";
  const params = useParams();
  const router = useRouter();
  const otherUserId = params.userId as string;

  const [me, setMe] = useState<User | null>(null);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [convoId, setConvoId] = useState("");
  const [toast, setToast] = useState<{
    title: string;
    body: string;
    color: string;
    photo?: string;
  } | null>(null);
  const [notifGranted, setNotifGranted] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isFirstLoad = useRef(true);
  const lastMsgCount = useRef(0);

  useEffect(() => {
    return onAuthStateChanged(auth, setMe);
  }, []);

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission().then(setNotifGranted);
  }, []);

  useEffect(() => {
    if (!otherUserId) return;
    (async () => {
      try {
        const snap = await getDoc(doc(firestore, "users", otherUserId));
        if (snap.exists()) setOtherUser({ uid: snap.id, ...snap.data() });
      } catch {}
    })();
  }, [otherUserId]);

  useEffect(() => {
    if (!me || !otherUserId) return;
    const cId = getConvoId(me.uid, otherUserId);
    setConvoId(cId);

    const convoRef = doc(firestore, "conversations", cId);
    setDoc(
      convoRef,
      {
        participants: [me.uid, otherUserId],
        lastMessage: "",
        lastSenderUid: "",
        updatedAt: serverTimestamp(),
        unread: { [me.uid]: 0, [otherUserId]: 0 },
      },
      { merge: true },
    ).catch(() => {});

    updateDoc(convoRef, { [`unread.${me.uid}`]: 0 }).catch(() => {});

    const msgsRef = collection(firestore, "conversations", cId, "messages");
    const q = query(msgsRef, orderBy("createdAt", "asc"));

    const unsub = onSnapshot(q, (snap) => {
      const newMsgs = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as Message,
      );

      // ── Notification logic ──
      if (!isFirstLoad.current && newMsgs.length > lastMsgCount.current) {
        const latest = newMsgs[newMsgs.length - 1];
        // Only notify for other person's messages
        if (latest && latest.senderId !== me.uid) {
          const senderName = otherUser?.fullName || "Developer";
          const msgText =
            latest.text.length > 60
              ? latest.text.slice(0, 60) + "…"
              : latest.text;

          // Browser notification (when tab is not focused)
          if (document.hidden) {
            showBrowserNotification(senderName, msgText, otherUser?.photoURL);
          }

          // In-app toast notification
          setToast({
            title: senderName,
            body: msgText,
            color: getColor(latest.senderId || "anon"),
            photo: otherUser?.photoURL,
          });
        }
      }

      if (isFirstLoad.current) isFirstLoad.current = false;
      lastMsgCount.current = newMsgs.length;

      setMessages(newMsgs);
      setLoading(false);
      updateDoc(convoRef, { [`unread.${me.uid}`]: 0 }).catch(() => {});
    });
    return unsub;
  }, [me, otherUserId, otherUser]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const trimmed = text.trim();
    if (!trimmed || !me || !convoId) return;
    setSending(true);
    setText("");
    try {
      const msgsRef = collection(
        firestore,
        "conversations",
        convoId,
        "messages",
      );
      await addDoc(msgsRef, {
        text: trimmed,
        senderId: me.uid,
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(firestore, "conversations", convoId), {
        lastMessage: trimmed,
        lastSenderUid: me.uid,
        updatedAt: serverTimestamp(),
        [`unread.${otherUserId}`]: increment(1),
      });
      inputRef.current?.focus();
    } catch (e) {
      console.error(e);
      setText(trimmed);
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

  // Group messages by date
  const groupedMessages = messages.reduce<{ date: string; msgs: Message[] }[]>(
    (acc, msg) => {
      if (!msg.createdAt) return acc;
      const d = msg.createdAt.toDate();
      const label = isToday(d)
        ? "Bugun"
        : isYesterday(d)
          ? "Kecha"
          : format(d, "d MMMM yyyy");
      const last = acc[acc.length - 1];
      if (last && last.date === label) {
        last.msgs.push(msg);
      } else {
        acc.push({ date: label, msgs: [msg] });
      }
      return acc;
    },
    [],
  );

  const otherColor = otherUser ? getColor(otherUser.uid) : "#6366F1";

  if (!me) {
    return (
      <div
        className="flex-1 flex items-center justify-center"
        style={{ backgroundColor: "var(--bg)" }}
      >
        <div className="text-center space-y-3">
          <div className="text-4xl">🔒</div>
          <Link
            href="/login"
            className="font-semibold px-4 py-2 rounded-xl text-white block"
            style={{
              background: `linear-gradient(135deg, ${accent}, ${accent}BB)`,
            }}
          >
            Kirish →
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
      {/* In-app Toast */}
      <Toast msg={toast} onClose={() => setToast(null)} />

      {/* ── Header ── */}
      <div
        className="px-3 sm:px-4 py-3 border-b flex items-center gap-3 flex-shrink-0"
        style={{
          borderColor: "var(--border)",
          background: isLight
            ? "rgba(248,250,255,0.95)"
            : "rgba(10,10,20,0.95)",
          backdropFilter: "blur(16px)",
        }}
      >
        <button
          onClick={() => router.push("/chat/dm")}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:opacity-70 flex-shrink-0"
          style={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M19 12H5M12 19l-7-7 7-7"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: "var(--text)" }}
            />
          </svg>
        </button>

        {otherUser ? (
          <Link
            href={`/profile/${otherUser.uid}`}
            className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
          >
            <div className="relative flex-shrink-0">
              <Avatar
                name={otherUser.fullName || "Dev"}
                size={38}
                color={otherColor}
                photo={otherUser.photoURL}
              />
              <span
                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#10B981] rounded-full border-2"
                style={{ borderColor: "var(--bg)" }}
              />
            </div>
            <div className="min-w-0">
              <p
                className="font-black text-sm truncate"
                style={{ color: "var(--text)" }}
              >
                {otherUser.fullName || "Developer"}
              </p>
              <p
                className="text-[10px] font-semibold truncate"
                style={{ color: "#10B981" }}
              >
                ● Online
              </p>
            </div>
          </Link>
        ) : (
          <div className="flex-1 flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full animate-pulse flex-shrink-0"
              style={{ backgroundColor: "var(--card)" }}
            />
            <div className="space-y-1.5">
              <div
                className="h-3 w-28 rounded-lg animate-pulse"
                style={{ backgroundColor: "var(--card)" }}
              />
              <div
                className="h-2 w-16 rounded-lg animate-pulse"
                style={{ backgroundColor: "var(--card)" }}
              />
            </div>
          </div>
        )}

        {/* Notification permission button */}
        {!notifGranted && (
          <button
            onClick={() =>
              requestNotificationPermission().then(setNotifGranted)
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:opacity-90 flex-shrink-0"
            style={{
              backgroundColor: `${accent}18`,
              border: `1px solid ${accent}30`,
              color: accent,
            }}
            title="Bildirishnomalarni yoqish"
          >
            <span>🔔</span>
            <span className="hidden sm:inline">Yoqish</span>
          </button>
        )}

        <Link
          href={otherUser ? `/profile/${otherUser.uid}` : "#"}
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all hover:opacity-70"
          style={{
            backgroundColor: `${accent}15`,
            border: `1px solid ${accent}30`,
          }}
          title="Profilni ko'rish"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" stroke={accent} strokeWidth="2" />
            <path
              d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
              stroke={accent}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </Link>
      </div>

      {/* ── Messages area ── */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div
              className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: accent, borderTopColor: "transparent" }}
            />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-5 text-center px-6">
            {otherUser && (
              <div className="relative">
                <Avatar
                  name={otherUser.fullName || "Dev"}
                  size={72}
                  color={otherColor}
                  photo={otherUser.photoURL}
                />
                <span
                  className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#10B981] rounded-full border-3 flex items-center justify-center text-[10px]"
                  style={{ border: "3px solid var(--bg)" }}
                >
                  ✓
                </span>
              </div>
            )}
            <div>
              <p
                className="font-black text-lg mb-2"
                style={{ color: "var(--text)" }}
              >
                {otherUser?.fullName || "Developer"} bilan suhbat
              </p>
              <p className="text-sm" style={{ color: "var(--sub)" }}>
                Birinchi xabarni yuboring! 👋
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            {groupedMessages.map(({ date, msgs }) => (
              <div key={date}>
                <DateDivider label={date} />
                {msgs.map((msg, i) => {
                  const isOwn = msg.senderId === me.uid;
                  const showAvatar =
                    !isOwn &&
                    (i === 0 || msgs[i - 1].senderId !== msg.senderId);
                  const isLast =
                    i === msgs.length - 1 ||
                    msgs[i + 1].senderId !== msg.senderId;

                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"} ${i === 0 || msgs[i - 1].senderId !== msg.senderId ? "mt-3" : "mt-1"}`}
                    >
                      {/* Avatar slot */}
                      <div className="w-7 flex-shrink-0 flex items-end pb-1">
                        {showAvatar && (
                          <Avatar
                            name={otherUser?.fullName || "Dev"}
                            size={28}
                            color={otherColor}
                            photo={otherUser?.photoURL}
                          />
                        )}
                      </div>

                      {/* Bubble */}
                      <div
                        className={`flex flex-col max-w-[78%] sm:max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}
                      >
                        <div
                          className="px-4 py-2.5 text-sm leading-relaxed break-words"
                          style={{
                            background: isOwn
                              ? `linear-gradient(135deg, ${accent}, ${accent}DD)`
                              : "var(--card)",
                            color: isOwn ? "#fff" : "var(--text)",
                            border: isOwn ? "none" : "1px solid var(--border)",
                            borderRadius: isOwn
                              ? `18px 4px 18px 18px`
                              : `4px 18px 18px 18px`,
                            boxShadow: isOwn
                              ? `0 3px 16px ${accent}33`
                              : "none",
                          }}
                        >
                          {msg.text}
                        </div>
                        {isLast && (
                          <span
                            className="text-[10px] mt-1.5 px-1"
                            style={{ color: "var(--sub)" }}
                          >
                            {formatMsgTime(msg.createdAt)}
                            {isOwn && (
                              <span className="ml-1" style={{ color: accent }}>
                                ✓✓
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ── Input bar ── */}
      <div
        className="px-3 sm:px-4 py-3 border-t flex-shrink-0"
        style={{
          borderColor: "var(--border)",
          background: isLight
            ? "rgba(248,250,255,0.98)"
            : "rgba(10,10,20,0.98)",
          backdropFilter: "blur(16px)",
        }}
      >
        <div className="max-w-2xl mx-auto flex items-center gap-2 sm:gap-2.5">
          <div
            className="flex-1 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl transition-all focus-within:ring-2"
            style={{
              backgroundColor: "var(--card)",
              border: `1.5px solid var(--border)`,
              // @ts-ignore
              "--tw-ring-color": `${accent}44`,
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKey}
              placeholder={`${otherUser?.fullName?.split(" ")[0] || "Developer"} ga xabar...`}
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: "var(--text)" }}
            />
            {text && (
              <span
                className="text-[10px] flex-shrink-0 font-semibold"
                style={{ color: "var(--sub)" }}
              >
                Enter ↵
              </span>
            )}
          </div>

          <button
            onClick={sendMessage}
            disabled={sending || !text.trim()}
            className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:scale-100 flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, ${accent}, ${accent}CC)`,
              boxShadow: text.trim() ? `0 4px 16px ${accent}55` : "none",
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
