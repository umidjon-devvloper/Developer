"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useTheme, THEMES, Theme } from "@/components/theme-provider";

const THEME_ACCENTS: Record<Theme, string> = {
  dark: "#6366F1",
  light: "#6366F1",
  purple: "#8B5CF6",
  ocean: "#3B82F6",
  sunset: "#F97316",
};

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const themeRef = useRef<HTMLDivElement>(null);

  const isLight = theme === "light";
  const accent = THEME_ACCENTS[theme];

  useEffect(() => {
    onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setThemeOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/developers", label: "Developers" },
    { href: "/cv", label: "📄 CV" },
    { href: "/chat", label: "Chat" },
  ];

  const navBg = isLight ? "rgba(240,244,255,0.88)" : "rgba(10,10,20,0.85)";

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl"
      style={{
        borderBottom: `1px solid var(--border)`,
        backgroundColor: navBg,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white"
              style={{
                background: `linear-gradient(135deg, ${accent}, ${accent}AA)`,
              }}
            >
              {"</>"}
            </div>
            <span
              className="text-xl font-black tracking-tight"
              style={{ color: "var(--text)" }}
            >
              DevHub
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background:
                    pathname === link.href
                      ? `linear-gradient(135deg, ${accent}, ${accent}BB)`
                      : "transparent",
                  color: pathname === link.href ? "#fff" : "var(--sub)",
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right */}
          <div className="hidden md:flex items-center gap-2">
            {/* Theme picker */}
            <div className="relative" ref={themeRef}>
              <button
                onClick={() => setThemeOpen(!themeOpen)}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105"
                style={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                }}
                title="Tema"
              >
                <span className="text-base leading-none">🎨</span>
              </button>

              {themeOpen && (
                <div
                  className="absolute right-0 top-12 rounded-2xl p-2 shadow-2xl w-48 z-50"
                  style={{
                    backgroundColor: isLight ? "#fff" : "#16162a",
                    border: "1px solid var(--border)",
                  }}
                >
                  <p
                    className="text-[10px] font-bold tracking-widest px-3 pt-1 pb-2"
                    style={{ color: "var(--sub)" }}
                  >
                    TEMANI TANLANG
                  </p>
                  {(
                    Object.entries(THEMES) as [Theme, (typeof THEMES)[Theme]][]
                  ).map(([key, val]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setTheme(key);
                        setThemeOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left group"
                      style={{
                        backgroundColor:
                          theme === key
                            ? THEME_ACCENTS[key] + "20"
                            : "transparent",
                      }}
                    >
                      {/* Color swatch */}
                      <div
                        className="w-5 h-5 rounded-full flex-shrink-0 transition-all"
                        style={{
                          backgroundColor: val.bg,
                          border: `2.5px solid ${THEME_ACCENTS[key]}`,
                          boxShadow:
                            theme === key
                              ? `0 0 0 2px ${THEME_ACCENTS[key]}55`
                              : "none",
                        }}
                      />
                      <span
                        className="text-sm font-semibold"
                        style={{
                          color:
                            theme === key ? THEME_ACCENTS[key] : "var(--text)",
                        }}
                      >
                        {val.label}
                      </span>
                      {theme === key && (
                        <span
                          className="ml-auto text-sm font-bold"
                          style={{ color: THEME_ACCENTS[key] }}
                        >
                          ✓
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Auth */}
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href={`/profile/${user.uid}`}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all"
                  style={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt=""
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{
                        background: `linear-gradient(135deg, ${accent}, ${accent}BB)`,
                      }}
                    >
                      {(user.displayName || user.email || "U")[0].toUpperCase()}
                    </div>
                  )}
                  <span
                    className="text-sm font-medium"
                    style={{ color: "var(--text)" }}
                  >
                    {user.displayName || user.email?.split("@")[0]}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-all"
                >
                  Chiqish
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                  style={{ color: "var(--sub)" }}
                >
                  Kirish
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-all"
                  style={{
                    background: `linear-gradient(135deg, ${accent}, ${accent}BB)`,
                  }}
                >
                  Ro'yxatdan o'tish
                </Link>
              </div>
            )}
          </div>

          {/* Mobile buttons */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setThemeOpen(!themeOpen)}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
              }}
            >
              🎨
            </button>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-9 h-9 rounded-xl flex flex-col items-center justify-center gap-1"
              style={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
              }}
            >
              <span
                className="w-4 h-0.5 rounded-full"
                style={{ backgroundColor: "var(--text)" }}
              />
              <span
                className="w-4 h-0.5 rounded-full"
                style={{ backgroundColor: "var(--text)" }}
              />
              <span
                className="w-4 h-0.5 rounded-full"
                style={{ backgroundColor: "var(--text)" }}
              />
            </button>
          </div>
        </div>

        {/* Mobile theme panel */}
        {themeOpen && (
          <div className="md:hidden pb-3">
            <div className="flex flex-wrap gap-2">
              {(
                Object.entries(THEMES) as [Theme, (typeof THEMES)[Theme]][]
              ).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => {
                    setTheme(key);
                    setThemeOpen(false);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                  style={{
                    backgroundColor:
                      theme === key ? THEME_ACCENTS[key] + "22" : "var(--card)",
                    border: `1px solid ${theme === key ? THEME_ACCENTS[key] : "var(--border)"}`,
                    color: theme === key ? THEME_ACCENTS[key] : "var(--text)",
                  }}
                >
                  <div
                    className="w-3.5 h-3.5 rounded-full"
                    style={{
                      backgroundColor: val.bg,
                      border: `2px solid ${THEME_ACCENTS[key]}`,
                    }}
                  />
                  {val.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mobile nav menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 flex flex-col gap-1.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="px-4 py-3 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background:
                    pathname === link.href
                      ? `linear-gradient(135deg, ${accent}, ${accent}BB)`
                      : "transparent",
                  color: pathname === link.href ? "#fff" : "var(--sub)",
                }}
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link
                  href={`/profile/${user.uid}`}
                  onClick={() => setMenuOpen(false)}
                  className="px-4 py-3 rounded-xl text-sm font-semibold"
                  style={{
                    backgroundColor: "var(--card)",
                    color: "var(--text)",
                  }}
                >
                  👤 Profil
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-3 rounded-xl text-sm font-semibold text-red-400 text-left hover:bg-red-500/10"
                >
                  Chiqish
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="px-4 py-3 rounded-xl text-sm font-semibold text-white text-center"
                style={{
                  background: `linear-gradient(135deg, ${accent}, ${accent}BB)`,
                }}
              >
                Kirish / Ro'yxatdan o'tish
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
