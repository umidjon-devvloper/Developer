"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { useTheme, THEMES, Theme } from "@/components/theme-provider";
import Footer from "@/ui/footer";

const THEME_ACCENTS: Record<Theme, string> = {
  dark: "#6366F1",
  light: "#6366F1",
  purple: "#8B5CF6",
  ocean: "#3B82F6",
  sunset: "#F97316",
};

interface Developer {
  uid: string;
  fullName: string;
  profession: string;
  skills: string[];
  followers: string[] | number;
  available?: boolean;
  photoURL?: string;
}

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

function Avatar({
  name,
  photoURL,
  color,
  size = 52,
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
        fontSize: size * 0.34,
        background: `linear-gradient(135deg, ${color}, ${color}AA)`,
      }}
    >
      {initials}
    </div>
  );
}

export default function HomePage() {
  const { theme } = useTheme();
  const accent = THEME_ACCENTS[theme];
  const [typed, setTyped] = useState("");
  const [devs, setDevs] = useState<Developer[]>([]);
  const [devCount, setDevCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fullText = "Developer Community";

  useEffect(() => {
    let i = 0;
    const iv = setInterval(() => {
      if (i <= fullText.length) {
        setTyped(fullText.slice(0, i));
        i++;
      } else clearInterval(iv);
    }, 75);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const fetch = async () => {
      try {
        const q = query(
          collection(firestore, "users"),
          orderBy("createdAt", "desc"),
          limit(6),
        );
        const snap = await getDocs(q);
        setDevs(
          snap.docs.map((d) => ({ uid: d.id, ...d.data() }) as Developer),
        );
        const all = await getDocs(collection(firestore, "users"));
        setDevCount(all.size);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const stats = [
    {
      label: "Developerlar",
      value: devCount > 0 ? `${devCount}+` : "...",
      icon: "👨‍💻",
    },
    { label: "Loyihalar", value: "3,800+", icon: "📃" },
    { label: "Mamlakatlar", value: "24+", icon: "🌍" },
    { label: "Hamkorliklar", value: "560+", icon: "🤝" },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      {/* — HERO — */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div
          className="absolute top-20 left-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-25"
          style={{ backgroundColor: accent }}
        />
        <div
          className="absolute top-40 right-1/4 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-15"
          style={{ backgroundColor: accent }}
        />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-8"
            style={{
              border: `1px solid ${accent}50`,
              backgroundColor: accent + "18",
              color: accent,
            }}
          >
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            O'zbekiston #1 Developer Platformasi
          </div>

          <h1
            className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-tight"
            style={{ color: "var(--text)" }}
          >
            O'zbek{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(135deg, ${accent}, ${accent}AA)`,
              }}
            >
              {typed}
              <span className="animate-pulse">|</span>
            </span>
          </h1>

          <p
            className="text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{ color: "var(--sub)" }}
          >
            Developerlar bir-birini topsin, portfolio ko'rsin, loyihalarda
            hamkorlik qilsin va o'ssin
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-4 rounded-2xl font-bold text-lg text-white hover:opacity-90 transition-all shadow-xl"
              style={{
                background: `linear-gradient(135deg, ${accent}, ${accent}BB)`,
                boxShadow: `0 16px 40px ${accent}30`,
              }}
            >
              🚀 Qo'shilish — Bepul
            </Link>
            <Link
              href="/developers"
              className="px-8 py-4 rounded-2xl font-bold text-lg transition-all hover:opacity-80"
              style={{
                border: "1px solid var(--border)",
                color: "var(--text)",
                backgroundColor: "var(--card)",
              }}
            >
              👨‍💻 Developerlarni ko'rish
            </Link>
          </div>
        </div>
      </section>

      {/* — STATS — */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl text-center transition-all hover:scale-105"
              style={{
                border: "1px solid var(--border)",
                backgroundColor: "var(--card)",
              }}
            >
              <div className="text-3xl mb-2">{s.icon}</div>
              <div
                className="text-3xl font-black bg-clip-text text-transparent"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${accent}, ${accent}BB)`,
                }}
              >
                {s.value}
              </div>
              <div
                className="text-sm mt-1 font-medium"
                style={{ color: "var(--sub)" }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* — DEVELOPERS — */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2
                className="text-3xl font-black"
                style={{ color: "var(--text)" }}
              >
                ⭐ So'nggi Developerlar
              </h2>
              <p className="mt-1 text-sm" style={{ color: "var(--sub)" }}>
                Yangi qo'shilgan community a'zolari
              </p>
            </div>
            <Link
              href="/developers"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-75"
              style={{ border: "1px solid var(--border)", color: "var(--sub)" }}
            >
              Barchasi →
            </Link>
          </div>

          {/* Loading skeleton */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="p-6 rounded-2xl h-40 animate-pulse"
                  style={{
                    border: "1px solid var(--border)",
                    backgroundColor: "var(--card)",
                  }}
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && devs.length === 0 && (
            <div
              className="text-center py-24 rounded-3xl"
              style={{
                border: "1px solid var(--border)",
                backgroundColor: "var(--card)",
              }}
            >
              <div className="text-6xl mb-4">👨‍💻</div>
              <p
                className="text-xl font-black mb-2"
                style={{ color: "var(--text)" }}
              >
                Hali developerlar yo'q
              </p>
              <p className="mb-6" style={{ color: "var(--sub)" }}>
                Birinchi bo'lib qo'shiling!
              </p>
              <Link
                href="/register"
                className="inline-block px-7 py-3.5 rounded-2xl font-bold text-white hover:opacity-90 transition-all"
                style={{
                  background: `linear-gradient(135deg, ${accent}, ${accent}BB)`,
                }}
              >
                🚀 Ro'yxatdan o'tish
              </Link>
            </div>
          )}

          {/* Dev cards */}
          {!loading && devs.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {devs.map((dev) => {
                const color = getColor(dev.uid);
                const followerCount = Array.isArray(dev.followers)
                  ? dev.followers.length
                  : dev.followers || 0;

                return (
                  <Link key={dev.uid} href={`/profile/${dev.uid}`}>
                    <div
                      className="p-6 rounded-2xl transition-all cursor-pointer group hover:scale-[1.02] hover:-translate-y-0.5"
                      style={{
                        border: "1px solid var(--border)",
                        backgroundColor: "var(--card)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = color + "55";
                        e.currentTarget.style.boxShadow = `0 8px 30px ${color}20`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "var(--border)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      {/* Accent bar */}
                      <div
                        className="h-1 rounded-full mb-5 opacity-70"
                        style={{
                          background: `linear-gradient(to right, ${color}, transparent)`,
                        }}
                      />

                      <div className="flex items-start gap-3">
                        <div className="relative flex-shrink-0">
                          <Avatar
                            name={dev.fullName || "?"}
                            photoURL={dev.photoURL}
                            color={color}
                            size={52}
                          />
                          {dev.available && (
                            <span
                              className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-[#10B981] border-2"
                              style={{ borderColor: "var(--bg)" }}
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3
                            className="font-bold truncate transition-colors"
                            style={{ color: "var(--text)" }}
                          >
                            {dev.fullName || "Nomsiz"}
                          </h3>
                          <p
                            className="text-sm font-semibold mt-0.5 truncate"
                            style={{ color }}
                          >
                            {dev.profession || "Developer"}
                          </p>
                          {followerCount > 0 && (
                            <p
                              className="text-xs mt-1"
                              style={{ color: "var(--sub)" }}
                            >
                              👥 {followerCount} follower
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-4">
                        {(dev.skills || []).slice(0, 3).map((s, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold"
                            style={{ backgroundColor: color + "18", color }}
                          >
                            {s}
                          </span>
                        ))}
                        {dev.available && (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#10B981]/15 text-[#10B981] ml-auto">
                            Open
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* — CTA — */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div
            className="p-10 rounded-3xl text-center relative overflow-hidden"
            style={{
              border: `1px solid ${accent}40`,
              background: `linear-gradient(135deg, ${accent}12, ${accent}06)`,
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse at 50% 0%, ${accent}15, transparent 70%)`,
              }}
            />
            <h2
              className="text-4xl font-black mb-4 relative z-10"
              style={{ color: "var(--text)" }}
            >
              Hoziroq qo'shiling! 🚀
            </h2>
            <p
              className="text-lg mb-8 relative z-10"
              style={{ color: "var(--sub)" }}
            >
              {devCount > 0 ? `${devCount}+` : "1000+"} developer bilan
              tanishing, portfolio yarating va karyerangizni o'stiring
            </p>
            <Link
              href="/register"
              className="inline-block px-10 py-4 rounded-2xl font-bold text-lg text-white hover:opacity-90 transition-all relative z-10"
              style={{
                background: `linear-gradient(135deg, ${accent}, ${accent}BB)`,
                boxShadow: `0 16px 40px ${accent}30`,
              }}
            >
              Bepul ro'yxatdan o'tish
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
