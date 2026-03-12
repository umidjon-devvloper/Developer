"use client";
import Link from "next/link";
import { useTheme, Theme } from "@/components/theme-provider";
import { useState, useEffect } from "react";

const ACCENTS: Record<Theme, string> = {
  dark: "#6366F1",
  light: "#6366F1",
  purple: "#8B5CF6",
  ocean: "#3B82F6",
  sunset: "#F97316",
};

const TECH_STACK = [
  "Next.js",
  "Firebase",
  "TypeScript",
  "Tailwind CSS",
  "Vercel",
];

const FOOTER_LINKS = {
  Platform: [
    { label: "Developerlar", href: "/developers" },
    { label: "Portfolio", href: "/portfolio" },
    { label: "Community Chat", href: "/chat" },
    { label: "Direct Messages", href: "/chat/dm" },
  ],
  Kompaniya: [
    { label: "Biz haqimizda", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Hamkorlik", href: "/partnership" },
    { label: "Ish o'rinlari", href: "/careers" },
  ],
  Yordam: [
    { label: "FAQ", href: "/faq" },
    { label: "Aloqa", href: "/contact" },
    { label: "Maxfiylik", href: "/privacy" },
    { label: "Shartlar", href: "/terms" },
  ],
};

const SOCIALS = [
  {
    label: "Telegram",
    href: "https://t.me/",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z" />
      </svg>
    ),
    color: "#2AABEE",
  },
  {
    label: "GitHub",
    href: "https://github.com/",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
      </svg>
    ),
    color: "#fff",
  },
  {
    label: "Instagram",
    href: "https://instagram.com/",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
    color: "#E1306C",
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com/",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
    color: "#0077B5",
  },
];

// Animated counter
function Counter({ end, suffix = "" }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStarted(true);
      },
      { threshold: 0.5 },
    );
    const el = document.getElementById(`counter-${end}`);
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [end]);

  useEffect(() => {
    if (!started) return;
    let current = 0;
    const step = end / 60;
    const timer = setInterval(() => {
      current += step;
      if (current >= end) {
        setCount(end);
        clearInterval(timer);
      } else setCount(Math.floor(current));
    }, 16);
    return () => clearInterval(timer);
  }, [started, end]);

  return (
    <span id={`counter-${end}`}>
      {count}
      {suffix}
    </span>
  );
}

export default function Footer() {
  const { theme } = useTheme();
  const accent = ACCENTS[theme];
  const isLight = theme === "light";
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.includes("@")) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <footer
      className="relative overflow-hidden"
      style={{
        backgroundColor: "var(--bg)",
        borderTop: "1px solid var(--border)",
      }}
    >
      {/* Background glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-[100px] pointer-events-none opacity-10"
        style={{ backgroundColor: accent }}
      />

      {/* в”Ђв”Ђ Newsletter + App CTA section в”Ђв”Ђ */}
      <div className="relative max-w-6xl mx-auto px-4 pt-16 pb-10">
        <div
          className="rounded-3xl p-8 sm:p-10 mb-14 relative overflow-hidden"
          style={{
            background: isLight
              ? `linear-gradient(135deg, ${accent}12, ${accent}06)`
              : `linear-gradient(135deg, ${accent}18, ${accent}08)`,
            border: `1px solid ${accent}25`,
          }}
        >
          {/* Decorative circles */}
          <div
            className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-10 pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${accent}, transparent)`,
            }}
          />
          <div
            className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full opacity-10 pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${accent}, transparent)`,
            }}
          />

          <div className="flex flex-col lg:flex-row gap-10 items-center relative z-10">
            {/* Newsletter */}
            <div className="flex-1 w-full">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">📬</span>
                <span
                  className="text-xs font-black tracking-widest uppercase"
                  style={{ color: accent }}
                >
                  Newsletter
                </span>
              </div>
              <h3
                className="text-2xl font-black mb-2"
                style={{ color: "var(--text)" }}
              >
                Yangiliklardan xabardor bo'ling
              </h3>
              <p className="text-sm mb-5" style={{ color: "var(--sub)" }}>
                Haftalik developer yangiliklari, foydali maqolalar va community
                hisobotlari
              </p>
              {subscribed ? (
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                  style={{
                    backgroundColor: "#10B98120",
                    border: "1px solid #10B98130",
                  }}
                >
                  <span className="text-xl">рџЋ‰</span>
                  <p className="font-bold text-sm text-[#10B981]">
                    Obuna bo'ldingiz! Rahmat.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="flex-1 px-4 py-3 rounded-2xl text-sm outline-none transition-all"
                    style={{
                      backgroundColor: "var(--card)",
                      border: `1.5px solid var(--border)`,
                      color: "var(--text)",
                    }}
                    onFocus={(e) =>
                      (e.target.style.borderColor = accent + "60")
                    }
                    onBlur={(e) =>
                      (e.target.style.borderColor = "var(--border)")
                    }
                  />
                  <button
                    type="submit"
                    className="px-5 py-3 rounded-2xl font-bold text-sm text-white transition-all hover:opacity-90 hover:scale-105 active:scale-95 flex-shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${accent}, ${accent}CC)`,
                      boxShadow: `0 4px 16px ${accent}44`,
                    }}
                  >
                    Obuna
                  </button>
                </form>
              )}
            </div>

            {/* Divider */}
            <div
              className="hidden lg:block w-px h-36 self-center"
              style={{ backgroundColor: `${accent}25` }}
            />

            {/* App Download */}
            <div className="flex-1 w-full">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">📱</span>
                <span
                  className="text-xs font-black tracking-widest uppercase"
                  style={{ color: accent }}
                >
                  Mobile App
                </span>
              </div>
              <h3
                className="text-2xl font-black mb-2"
                style={{ color: "var(--text)" }}
              >
                Ilovamiz tez kunda!
              </h3>
              <p className="text-sm mb-5" style={{ color: "var(--sub)" }}>
                iOS va Android ilovalarimiz ishlab chiqilmoqda. Birinchilar
                orasida bo'ling!
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                {/* App Store */}
                <div
                  className="relative flex items-center gap-3 px-4 py-3 rounded-2xl cursor-not-allowed group transition-all"
                  style={{
                    backgroundColor: "var(--card)",
                    border: "1.5px solid var(--border)",
                    opacity: 0.75,
                  }}
                  title="Tez kunda"
                >
                  {/* Soon badge */}
                  <span
                    className="absolute -top-2 -right-2 text-[9px] font-black px-2 py-0.5 rounded-full text-white"
                    style={{
                      backgroundColor: accent,
                      boxShadow: `0 2px 8px ${accent}66`,
                    }}
                  >
                    BREVE
                  </span>
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    style={{ color: "var(--text)", flexShrink: 0 }}
                  >
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                  <div className="min-w-0">
                    <p
                      className="text-[10px] font-semibold"
                      style={{ color: "var(--sub)" }}
                    >
                      Yuklab olish
                    </p>
                    <p
                      className="font-black text-sm"
                      style={{ color: "var(--text)" }}
                    >
                      App Store
                    </p>
                  </div>
                </div>

                {/* Play Market */}
                <div
                  className="relative flex items-center gap-3 px-4 py-3 rounded-2xl cursor-not-allowed group transition-all"
                  style={{
                    backgroundColor: "var(--card)",
                    border: "1.5px solid var(--border)",
                    opacity: 0.75,
                  }}
                  title="Tez kunda"
                >
                  <span
                    className="absolute -top-2 -right-2 text-[9px] font-black px-2 py-0.5 rounded-full text-white"
                    style={{
                      backgroundColor: "#10B981",
                      boxShadow: "0 2px 8px #10B98166",
                    }}
                  >
                    BREVE
                  </span>
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    style={{ flexShrink: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="play-grad"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#00C6FF" />
                        <stop offset="50%" stopColor="#34A853" />
                        <stop offset="100%" stopColor="#FBBC05" />
                      </linearGradient>
                    </defs>
                    <path
                      fill="url(#play-grad)"
                      d="M3 20.5v-17c0-.83.94-1.3 1.6-.8l14 8.5c.6.36.6 1.24 0 1.6l-14 8.5c-.66.5-1.6.03-1.6-.8z"
                    />
                  </svg>
                  <div className="min-w-0">
                    <p
                      className="text-[10px] font-semibold"
                      style={{ color: "var(--sub)" }}
                    >
                      Yuklab olish
                    </p>
                    <p
                      className="font-black text-sm"
                      style={{ color: "var(--text)" }}
                    >
                      Google Play
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress indicator */}
              <div className="mt-4 flex items-center gap-3">
                <div
                  className="flex-1 h-1.5 rounded-full overflow-hidden"
                  style={{ backgroundColor: "var(--card)" }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: "65%",
                      background: `linear-gradient(to right, ${accent}, ${accent}88)`,
                    }}
                  />
                </div>
                <span
                  className="text-xs font-bold flex-shrink-0"
                  style={{ color: accent }}
                >
                  65% tayyor
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* в”Ђв”Ђ Links grid в”Ђв”Ђ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-black text-white flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${accent}, ${accent}BB)`,
                }}
              >
                &lt;/&gt;
              </div>
              <span
                className="font-black text-base"
                style={{ color: "var(--text)" }}
              >
                DevHub UZ
              </span>
            </div>
            <p
              className="text-xs leading-relaxed mb-5"
              style={{ color: "var(--sub)" }}
            >
              O'zbekistonning eng yirik developer hamjamiyati. Birga o'sib,
              birga yashaymiz.
            </p>

            {/* Socials */}
            <div className="flex items-center gap-2">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={s.label}
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110 hover:-translate-y-0.5"
                  style={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    color: "var(--sub)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = s.color;
                    e.currentTarget.style.borderColor = s.color + "50";
                    e.currentTarget.style.backgroundColor = s.color + "15";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--sub)";
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.backgroundColor = "var(--card)";
                  }}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h4
                className="font-black text-xs tracking-widest mb-4 uppercase"
                style={{ color: accent }}
              >
                {title}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm transition-all hover:translate-x-1 inline-block"
                      style={{ color: "var(--sub)" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = "var(--text)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = "var(--sub)")
                      }
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* в”Ђв”Ђ Tech stack ticker в”Ђв”Ђ */}
        <div
          className="flex items-center gap-3 py-3 px-4 rounded-2xl mb-8 overflow-hidden relative"
          style={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          <span
            className="text-[10px] font-black tracking-widest uppercase flex-shrink-0"
            style={{ color: "var(--sub)" }}
          >
            TEXNOLOGIYALAR
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            {TECH_STACK.map((tech, i) => (
              <span
                key={tech}
                className="text-xs font-bold px-3 py-1 rounded-lg"
                style={{
                  backgroundColor: `${accent}18`,
                  color: accent,
                  border: `1px solid ${accent}25`,
                }}
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* в”Ђв”Ђ Bottom bar в”Ђв”Ђ */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <p
            className="text-xs text-center sm:text-left"
            style={{ color: "var(--sub)" }}
          >
            В© 2025 DevHub UZ. Barcha huquqlar himoyalangan.
          </p>

          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: "var(--sub)" }}>
              O'zbekiston bilan
            </span>
            <span className="text-base">рџ‡єрџ‡ї</span>
            <span className="text-xs" style={{ color: "var(--sub)" }}>
              ishlab chiqilgan
            </span>
            <span className="text-base animate-pulse">вќ¤пёЏ</span>
          </div>

          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
            style={{
              backgroundColor: "#10B98115",
              border: "1px solid #10B98130",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse flex-shrink-0" />
            <span className="text-xs font-bold text-[#10B981]">
              Barcha tizimlar ishlayapti
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
