"use client";
import { useEffect, useState, memo } from "react";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  serverTimestamp,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { firestore, auth } from "@/lib/firebase";
import { useTheme, THEMES, Theme } from "@/components/theme-provider";
import { useParams } from "next/navigation";
import Link from "next/link";

const THEME_ACCENTS: Record<Theme, string> = {
  dark: "#6366F1",
  light: "#6366F1",
  purple: "#8B5CF6",
  ocean: "#3B82F6",
  sunset: "#F97316",
};

import { UserData, SimpleUser, PortfolioItem as Portfolio } from "@/types";

const COLORS = [
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
  let h = 0;
  for (let i = 0; i < uid.length; i++) h = uid.charCodeAt(i) + ((h << 5) - h);
  return COLORS[Math.abs(h) % COLORS.length];
}

const Avatar = memo(function Avatar({
  name,
  photoURL,
  color,
  size = 80,
}: {
  name: string;
  photoURL?: string;
  color: string;
  size?: number;
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
        fontSize: size * 0.32,
        background: `linear-gradient(135deg, ${color}, ${color}99)`,
      }}
    >
      {initials}
    </div>
  );
});

const TYPE_ICONS: Record<string, string> = {
  github: "🐙",
  website: "🌐",
  figma: "🎨",
  pdf: "📄",
  other: "🔗",
};

// ── Users list modal (followers / following) ──
function UsersListModal({
  title,
  uids,
  accent,
  onClose,
}: {
  title: string;
  uids: string[];
  accent: string;
  onClose: () => void;
}) {
  const [users, setUsers] = useState<SimpleUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!uids.length) {
        setLoading(false);
        return;
      }
      try {
        const results = await Promise.all(
          uids.map(async (uid) => {
            const snap = await getDoc(doc(firestore, "users", uid));
            return snap.exists()
              ? ({ uid, ...snap.data() } as SimpleUser)
              : null;
          }),
        );
        setUsers(results.filter(Boolean) as SimpleUser[]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [uids]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-sm rounded-3xl overflow-hidden z-10"
        style={{
          backgroundColor: "var(--bg)",
          border: "1px solid var(--border)",
        }}
      >
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <h3 className="font-black text-lg" style={{ color: "var(--text)" }}>
            {title} ({uids.length})
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all"
            style={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              color: "var(--text)",
            }}
          >
            ✕
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div
                className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: accent }}
              />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12" style={{ color: "var(--sub)" }}>
              <div className="text-3xl mb-2">👤</div>
              <p className="text-sm">Hali hech kim yo'q</p>
            </div>
          ) : (
            <div className="p-3 space-y-1">
              {users.map((u) => {
                const c = getColor(u.uid || "anon");
                return (
                  <Link
                    key={u.uid || "anon"}
                    href={`/profile/${u.uid}`}
                    onClick={onClose}
                  >
                    <div
                      className="flex items-center gap-3 p-3 rounded-xl transition-all"
                      style={{ color: "var(--text)" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "var(--card)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                    >
                      <Avatar
                        name={u.fullName || "?"}
                        photoURL={u.photoURL}
                        color={c}
                        size={44}
                      />
                      <div>
                        <p className="font-bold text-sm">{u.fullName}</p>
                        <p
                          className="text-xs font-semibold"
                          style={{ color: c }}
                        >
                          {u.profession || "Developer"}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main ──
export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { theme } = useTheme();
  const accent = THEME_ACCENTS[theme];

  const [userData, setUserData] = useState<UserData | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<"portfolio" | "skills">(
    "portfolio",
  );
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  // Portfolio form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    url: "",
    type: "github",
    tags: "",
  });
  const [saving, setSaving] = useState(false);

  // Edit modal
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: "",
    profession: "",
    bio: "",
    location: "",
    github: "",
    linkedin: "",
    skills: "",
    available: false,
  });
  const [editSaving, setEditSaving] = useState(false);

  const isOwner = currentUser?.uid === id;
  const color = id ? getColor(id) : accent;
  const followers: string[] = userData?.followers || [];
  const following: string[] = userData?.following || [];
  const isFollowing = currentUser ? followers.includes(currentUser.uid) : false;

  useEffect(() => {
    onAuthStateChanged(auth, setCurrentUser);
  }, []);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const userSnap = await getDoc(doc(firestore, "users", id));
        if (userSnap.exists()) {
          const data = { uid: userSnap.id, ...userSnap.data() } as UserData;
          if (!Array.isArray(data.followers)) data.followers = [];
          if (!Array.isArray(data.following)) data.following = [];
          setUserData(data);
          setEditForm({
            fullName: data.fullName || "",
            profession: data.profession || "",
            bio: data.bio || "",
            location: data.location || "",
            github: data.github || "",
            linkedin: data.linkedin || "",
            skills: (data.skills || []).join(", "),
            available: data.available || false,
          });
        }
        const q = query(
          collection(firestore, "portfolio"),
          where("userId", "==", id),
        );
        const portSnap = await getDocs(q);
        setPortfolio(
          portSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Portfolio),
        );
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleFollow = async () => {
    if (!currentUser || !id) return;
    setFollowLoading(true);
    try {
      const targetRef = doc(firestore, "users", id);
      const meRef = doc(firestore, "users", currentUser.uid);
      if (isFollowing) {
        await updateDoc(targetRef, { followers: arrayRemove(currentUser.uid) });
        await updateDoc(meRef, { following: arrayRemove(id) });
        setUserData((prev) =>
          prev
            ? {
                ...prev,
                followers: (prev.followers || []).filter((u: string) => u !== currentUser.uid),
              }
            : prev,
        );
      } else {
        await updateDoc(targetRef, { followers: arrayUnion(currentUser.uid) });
        await updateDoc(meRef, { following: arrayUnion(id) });
        setUserData((prev) =>
          prev
            ? { ...prev, followers: [...(prev.followers || []), currentUser.uid] }
            : prev,
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setEditSaving(true);
    try {
      const updated = {
        fullName: editForm.fullName,
        profession: editForm.profession,
        bio: editForm.bio,
        location: editForm.location,
        github: editForm.github,
        linkedin: editForm.linkedin,
        skills: editForm.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        available: editForm.available,
      };
      await updateDoc(doc(firestore, "users", id), updated);
      setUserData((prev) => (prev ? { ...prev, ...updated } : prev));
      setShowEdit(false);
    } catch (e) {
      console.error(e);
    } finally {
      setEditSaving(false);
    }
  };

  const handleAddPortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.url) return;
    setSaving(true);
    try {
      const newItem = {
        title: form.title,
        description: form.description,
        url: form.url,
        type: form.type,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        userId: id,
        createdAt: serverTimestamp(),
      };
      const ref = await addDoc(collection(firestore, "portfolio"), newItem);
      setPortfolio((p) => [
        ...p,
        { id: ref.id, ...newItem, createdAt: new Date() },
      ]);
      setForm({
        title: "",
        description: "",
        url: "",
        type: "github",
        tags: "",
      });
      setShowForm(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (pid: string) => {
    if (!confirm("O'chirishni tasdiqlaysizmi?")) return;
    await deleteDoc(doc(firestore, "portfolio", pid));
    setPortfolio((p) => p.filter((x) => x.id !== pid));
  };

  // ── input style helper ──
  const inputCls =
    "w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all" +
    " placeholder:opacity-40";
  const inputStyle = {
    backgroundColor: "var(--card)",
    border: "1px solid var(--border)",
    color: "var(--text)",
  };

  if (loading)
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--bg)" }}
      >
        <div
          className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: accent }}
        />
      </div>
    );

  if (!userData)
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--bg)", color: "var(--sub)" }}
      >
        <div className="text-center">
          <div className="text-5xl mb-4">😕</div>
          <p className="text-lg font-semibold" style={{ color: "var(--text)" }}>
            Foydalanuvchi topilmadi
          </p>
          <Link
            href="/developers"
            className="text-sm mt-2 inline-block hover:underline"
            style={{ color: accent }}
          >
            ← Developerlar ga qaytish
          </Link>
        </div>
      </div>
    );

  return (
    <div
      className="min-h-screen pb-16"
      style={{ backgroundColor: "var(--bg)" }}
    >
      {/* ── HERO ── */}
      <div
        className="relative overflow-hidden pt-20"
        style={{
          background: `linear-gradient(135deg, ${color}15, var(--bg) 65%)`,
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 15% 60%, ${color}18, transparent 55%)`,
          }}
        />

        <div className="max-w-4xl mx-auto px-4 py-10 relative z-10">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end mb-8">
            <Avatar
              name={userData.fullName || "?"}
              photoURL={userData.photoURL}
              color={color}
              size={100}
            />

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1
                  className="text-3xl font-black"
                  style={{ color: "var(--text)" }}
                >
                  {userData.fullName}
                </h1>
                {userData.available && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30">
                    ✅ Open to work
                  </span>
                )}
              </div>
              <p className="font-semibold text-lg mb-2" style={{ color }}>
                {userData.profession || "Developer"}
              </p>
              {userData.bio && (
                <p
                  className="mb-3 max-w-xl text-sm leading-relaxed"
                  style={{ color: "var(--sub)" }}
                >
                  {userData.bio}
                </p>
              )}
              <div
                className="flex flex-wrap gap-4 text-sm"
                style={{ color: "var(--sub)" }}
              >
                {userData.location && <span>📍 {userData.location}</span>}
                {userData.github && (
                  <a
                    href={
                      userData.github.startsWith("http")
                        ? userData.github
                        : `https://${userData.github}`
                    }
                    target="_blank"
                    className="transition-colors hover:opacity-80"
                    style={{ color: accent }}
                  >
                    🐙 GitHub
                  </a>
                )}
                {userData.linkedin && (
                  <a
                    href={
                      userData.linkedin.startsWith("http")
                        ? userData.linkedin
                        : `https://${userData.linkedin}`
                    }
                    target="_blank"
                    className="transition-colors hover:opacity-80"
                    style={{ color: accent }}
                  >
                    💼 LinkedIn
                  </a>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 sm:self-start sm:mt-2">
              {isOwner ? (
                <button
                  onClick={() => setShowEdit(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all"
                  style={{
                    border: "1px solid var(--border)",
                    color: "var(--text)",
                    backgroundColor: "var(--card)",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.borderColor = accent + "60")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor = "var(--border)")
                  }
                >
                  ✏️ Tahrirlash
                </button>
              ) : currentUser ? (
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                  style={
                    isFollowing
                      ? {
                          border: "1px solid var(--border)",
                          color: "var(--text)",
                          backgroundColor: "var(--card)",
                        }
                      : {
                          background: `linear-gradient(135deg, ${accent}, ${accent}BB)`,
                          color: "#fff",
                          boxShadow: `0 8px 20px ${accent}30`,
                        }
                  }
                  onMouseEnter={(e) => {
                    if (isFollowing)
                      e.currentTarget.style.borderColor = "#ef444460";
                  }}
                  onMouseLeave={(e) => {
                    if (isFollowing)
                      e.currentTarget.style.borderColor = "var(--border)";
                  }}
                >
                  {followLoading ? (
                    <span
                      className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                      style={{ borderColor: "currentColor" }}
                    />
                  ) : isFollowing ? (
                    "✓ Following"
                  ) : (
                    "+ Follow"
                  )}
                </button>
              ) : (
                <Link
                  href="/login"
                  className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90"
                  style={{
                    background: `linear-gradient(135deg, ${accent}, ${accent}BB)`,
                  }}
                >
                  + Follow
                </Link>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-8">
            <div>
              <div
                className="text-2xl font-black"
                style={{ color: "var(--text)" }}
              >
                {portfolio.length}
              </div>
              <div className="text-xs mt-0.5" style={{ color: "var(--sub)" }}>
                Loyihalar
              </div>
            </div>
            {[
              {
                label: "Followers",
                list: followers,
                handler: () => followers.length > 0 && setShowFollowers(true),
              },
              {
                label: "Following",
                list: following,
                handler: () => following.length > 0 && setShowFollowing(true),
              },
            ].map((s) => (
              <button
                key={s.label}
                onClick={s.handler}
                className="text-left transition-all"
                style={{
                  cursor: s.list.length > 0 ? "pointer" : "default",
                  opacity: 1,
                }}
                onMouseEnter={(e) => {
                  if (s.list.length > 0) e.currentTarget.style.opacity = "0.7";
                }}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                <div
                  className="text-2xl font-black"
                  style={{ color: "var(--text)" }}
                >
                  {s.list.length}
                </div>
                <div
                  className="text-xs mt-0.5 flex items-center gap-1"
                  style={{ color: "var(--sub)" }}
                >
                  {s.label}{" "}
                  {s.list.length > 0 && (
                    <span style={{ color: accent }}>→</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div
        className="sticky top-16 z-30 backdrop-blur-xl"
        style={{
          borderBottom: "1px solid var(--border)",
          backgroundColor: "var(--bg)",
          opacity: 0.95,
        }}
      >
        <div className="max-w-4xl mx-auto px-4 flex gap-1">
          {[
            { key: "portfolio", label: "📁 Portfolio" },
            { key: "skills", label: "🛠️ Ko'nikmalar" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className="px-5 py-3.5 text-sm font-bold border-b-2 transition-all"
              style={{
                borderColor: activeTab === tab.key ? accent : "transparent",
                color: activeTab === tab.key ? accent : "var(--sub)",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* ── SKILLS ── */}
        {activeTab === "skills" && (
          <div>
            {!(userData.skills || []).length ? (
              <div
                className="text-center py-16 rounded-2xl"
                style={{
                  border: "1px solid var(--border)",
                  backgroundColor: "var(--card)",
                }}
              >
                <div className="text-4xl mb-3">🛠️</div>
                <p className="font-semibold" style={{ color: "var(--sub)" }}>
                  Ko'nikmalar qo'shilmagan
                </p>
                {isOwner && (
                  <button
                    onClick={() => setShowEdit(true)}
                    className="mt-4 px-5 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-all"
                    style={{
                      background: `linear-gradient(135deg, ${accent}, ${accent}BB)`,
                    }}
                  >
                    + Ko'nikmalarni qo'shish
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {userData.skills.map((s, i) => (
                  <span
                    key={i}
                    className="px-4 py-2 rounded-xl text-sm font-bold"
                    style={{ backgroundColor: color + "18", color }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PORTFOLIO ── */}
        {activeTab === "portfolio" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2
                className="text-xl font-black"
                style={{ color: "var(--text)" }}
              >
                Portfolio ({portfolio.length})
              </h2>
              {isOwner && (
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm text-white hover:opacity-90 transition-all"
                  style={{
                    background: `linear-gradient(135deg, ${accent}, ${accent}BB)`,
                  }}
                >
                  {showForm ? "✕ Yopish" : "+ Qo'shish"}
                </button>
              )}
            </div>

            {/* Add form */}
            {showForm && isOwner && (
              <form
                onSubmit={handleAddPortfolio}
                className="mb-8 p-6 rounded-2xl"
                style={{
                  border: `1px solid ${accent}40`,
                  backgroundColor: accent + "08",
                }}
              >
                <h3
                  className="font-bold text-lg mb-5"
                  style={{ color: "var(--text)" }}
                >
                  Yangi portfolio qo'shish
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label
                      className="text-sm font-semibold mb-1.5 block"
                      style={{ color: "var(--sub)" }}
                    >
                      Sarlavha *
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) =>
                        setForm({ ...form, title: e.target.value })
                      }
                      placeholder="DevHub App"
                      required
                      className={inputCls}
                      style={inputStyle}
                      onFocus={(e) =>
                        (e.target.style.borderColor = accent + "80")
                      }
                      onBlur={(e) =>
                        (e.target.style.borderColor = "var(--border)")
                      }
                    />
                  </div>
                  <div>
                    <label
                      className="text-sm font-semibold mb-1.5 block"
                      style={{ color: "var(--sub)" }}
                    >
                      Turi
                    </label>
                    <select
                      value={form.type}
                      onChange={(e) =>
                        setForm({ ...form, type: e.target.value })
                      }
                      className={inputCls}
                      style={{ ...inputStyle, backgroundColor: "var(--card)" }}
                    >
                      <option value="github">🐙 GitHub</option>
                      <option value="website">🌐 Website</option>
                      <option value="figma">🎨 Figma</option>
                      <option value="pdf">📄 PDF</option>
                      <option value="other">🔗 Boshqa</option>
                    </select>
                  </div>
                </div>
                {[
                  {
                    key: "url",
                    label: "URL *",
                    placeholder: "https://github.com/...",
                    type: "url",
                    required: true,
                  },
                  {
                    key: "description",
                    label: "Tavsif",
                    placeholder: "Qisqacha tavsif...",
                    type: "text",
                    required: false,
                  },
                  {
                    key: "tags",
                    label: "Teglar (vergul bilan)",
                    placeholder: "React, Next.js, Firebase",
                    type: "text",
                    required: false,
                  },
                ].map((f) => (
                  <div key={f.key} className="mb-4">
                    <label
                      className="text-sm font-semibold mb-1.5 block"
                      style={{ color: "var(--sub)" }}
                    >
                      {f.label}
                    </label>
                    <input
                      type={f.type}
                      value={(form as any)[f.key]}
                      onChange={(e) =>
                        setForm({ ...form, [f.key]: e.target.value })
                      }
                      placeholder={f.placeholder}
                      required={f.required}
                      className={inputCls}
                      style={inputStyle}
                      onFocus={(e) =>
                        (e.target.style.borderColor = accent + "80")
                      }
                      onBlur={(e) =>
                        (e.target.style.borderColor = "var(--border)")
                      }
                    />
                  </div>
                ))}
                <div className="flex gap-3 mt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl font-bold text-sm text-white hover:opacity-90 transition-all disabled:opacity-50"
                    style={{
                      background: `linear-gradient(135deg, ${accent}, ${accent}BB)`,
                    }}
                  >
                    {saving ? "Saqlanmoqda..." : "💾 Saqlash"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-6 py-2.5 rounded-xl font-bold text-sm transition-all"
                    style={{
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                    }}
                  >
                    Bekor
                  </button>
                </div>
              </form>
            )}

            {portfolio.length === 0 ? (
              <div
                className="text-center py-16 rounded-2xl"
                style={{
                  border: "1px solid var(--border)",
                  backgroundColor: "var(--card)",
                }}
              >
                <div className="text-4xl mb-3">📭</div>
                <p className="font-semibold" style={{ color: "var(--sub)" }}>
                  Hali portfolio qo'shilmagan
                </p>
                {isOwner && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="mt-4 px-5 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-all"
                    style={{
                      background: `linear-gradient(135deg, ${accent}, ${accent}BB)`,
                    }}
                  >
                    + Birinchi loyihani qo'shish
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {portfolio.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 rounded-2xl transition-all group"
                    style={{
                      border: "1px solid var(--border)",
                      backgroundColor: "var(--card)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = color + "55";
                      e.currentTarget.style.boxShadow = `0 4px 20px ${color}15`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">
                          {TYPE_ICONS[item.type] || "🔗"}
                        </span>
                        <div>
                          <h3
                            className="font-bold transition-colors"
                            style={{ color: "var(--text)" }}
                          >
                            {item.title}
                          </h3>
                          <span
                            className="text-xs capitalize"
                            style={{ color: "var(--sub)" }}
                          >
                            {item.type}
                          </span>
                        </div>
                      </div>
                      {isOwner && (
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="transition-colors text-lg hover:text-red-400"
                          style={{ color: "var(--sub)" }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    {item.description && (
                      <p
                        className="text-sm mb-3 line-clamp-2"
                        style={{ color: "var(--sub)" }}
                      >
                        {item.description}
                      </p>
                    )}
                    {(item.tags || []).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {item.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md text-xs font-bold"
                            style={{ backgroundColor: color + "18", color }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors hover:opacity-80"
                      style={{ color: accent }}
                    >
                      Ko'rish →
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── EDIT MODAL ── */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowEdit(false)}
          />
          <div
            className="relative w-full max-w-lg rounded-3xl p-6 max-h-[90vh] overflow-y-auto z-10"
            style={{
              backgroundColor: "var(--bg)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2
                className="text-xl font-black"
                style={{ color: "var(--text)" }}
              >
                ✏️ Profilni tahrirlash
              </h2>
              <button
                onClick={() => setShowEdit(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all"
                style={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              {[
                {
                  key: "fullName",
                  label: "To'liq ism",
                  placeholder: "Umidjon Gafforov",
                },
                {
                  key: "profession",
                  label: "Kasb",
                  placeholder: "Full Stack Developer",
                },
                {
                  key: "location",
                  label: "Joylashuv",
                  placeholder: "Toshkent, O'zbekiston",
                },
                {
                  key: "github",
                  label: "🐙 GitHub URL",
                  placeholder: "https://github.com/username",
                },
                {
                  key: "linkedin",
                  label: "💼 LinkedIn URL",
                  placeholder: "https://linkedin.com/in/username",
                },
                {
                  key: "skills",
                  label: "🛠️ Ko'nikmalar (vergul bilan)",
                  placeholder: "React, TypeScript, Firebase",
                },
              ].map((f) => (
                <div key={f.key}>
                  <label
                    className="text-sm font-semibold mb-1.5 block"
                    style={{ color: "var(--sub)" }}
                  >
                    {f.label}
                  </label>
                  <input
                    type="text"
                    value={(editForm as any)[f.key]}
                    onChange={(e) =>
                      setEditForm({ ...editForm, [f.key]: e.target.value })
                    }
                    placeholder={f.placeholder}
                    className={inputCls}
                    style={inputStyle}
                    onFocus={(e) =>
                      (e.target.style.borderColor = accent + "80")
                    }
                    onBlur={(e) =>
                      (e.target.style.borderColor = "var(--border)")
                    }
                  />
                </div>
              ))}

              <div>
                <label
                  className="text-sm font-semibold mb-1.5 block"
                  style={{ color: "var(--sub)" }}
                >
                  Bio
                </label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) =>
                    setEditForm({ ...editForm, bio: e.target.value })
                  }
                  placeholder="O'zingiz haqingizda..."
                  rows={3}
                  className={inputCls + " resize-none"}
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = accent + "80")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                />
              </div>

              {/* Available toggle */}
              <label
                className="flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all"
                style={{
                  border: "1px solid var(--border)",
                  backgroundColor: "var(--card)",
                }}
              >
                <div
                  onClick={() =>
                    setEditForm({ ...editForm, available: !editForm.available })
                  }
                  className="w-11 h-6 rounded-full transition-all relative cursor-pointer flex-shrink-0"
                  style={{
                    backgroundColor: editForm.available
                      ? "#10B981"
                      : "rgba(156,163,175,0.3)",
                  }}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${editForm.available ? "left-6" : "left-1"}`}
                  />
                </div>
                <div>
                  <div
                    className="font-semibold text-sm"
                    style={{ color: "var(--text)" }}
                  >
                    Open to work
                  </div>
                  <div className="text-xs" style={{ color: "var(--sub)" }}>
                    Ish qidirayotganingizni ko'rsating
                  </div>
                </div>
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={editSaving}
                  className="flex-1 py-3 rounded-xl font-bold text-sm text-white hover:opacity-90 transition-all disabled:opacity-50"
                  style={{
                    background: `linear-gradient(135deg, ${accent}, ${accent}BB)`,
                  }}
                >
                  {editSaving ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saqlanmoqda...
                    </span>
                  ) : (
                    "💾 Saqlash"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEdit(false)}
                  className="px-5 py-3 rounded-xl font-bold text-sm transition-all"
                  style={{
                    border: "1px solid var(--border)",
                    color: "var(--text)",
                  }}
                >
                  Bekor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modals */}
      {showFollowers && (
        <UsersListModal
          title="Followers"
          uids={followers}
          accent={accent}
          onClose={() => setShowFollowers(false)}
        />
      )}
      {showFollowing && (
        <UsersListModal
          title="Following"
          uids={following}
          accent={accent}
          onClose={() => setShowFollowing(false)}
        />
      )}
    </div>
  );
}
