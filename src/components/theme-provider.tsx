"use client";
import { createContext, useContext, useEffect, useState } from "react";

export type Theme = "dark" | "light" | "purple" | "ocean" | "sunset";

interface ThemeCtx {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeCtx>({
  theme: "dark",
  setTheme: () => {},
});
export const useTheme = () => useContext(ThemeContext);

export const THEMES: Record<
  Theme,
  {
    bg: string;
    card: string;
    border: string;
    text: string;
    sub: string;
    label: string;
    dot: string;
  }
> = {
  dark: {
    bg: "#0F0F1A",
    card: "rgba(255,255,255,0.05)",
    border: "rgba(255,255,255,0.1)",
    text: "#FFFFFF",
    sub: "#9CA3AF",
    label: "🌑 Dark",
    dot: "#1E1E2E",
  },
  light: {
    bg: "#F0F4FF",
    card: "rgba(255,255,255,0.9)",
    border: "rgba(0,0,0,0.08)",
    text: "#0F172A",
    sub: "#64748B",
    label: "☀️ Light",
    dot: "#F0F4FF",
  },
  purple: {
    bg: "#100820",
    card: "rgba(139,92,246,0.08)",
    border: "rgba(139,92,246,0.22)",
    text: "#F3E8FF",
    sub: "#C4B5FD",
    label: "💜 Purple",
    dot: "#100820",
  },
  ocean: {
    bg: "#050F1F",
    card: "rgba(59,130,246,0.08)",
    border: "rgba(59,130,246,0.22)",
    text: "#E0F2FE",
    sub: "#7DD3FC",
    label: "🌊 Ocean",
    dot: "#050F1F",
  },
  sunset: {
    bg: "#120A08",
    card: "rgba(251,146,60,0.08)",
    border: "rgba(251,146,60,0.22)",
    text: "#FFF1F0",
    sub: "#FCA5A5",
    label: "🌅 Sunset",
    dot: "#120A08",
  },
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  const applyTheme = (t: Theme) => {
    const v = THEMES[t];
    const r = document.documentElement;
    r.style.setProperty("--bg", v.bg);
    r.style.setProperty("--card", v.card);
    r.style.setProperty("--border", v.border);
    r.style.setProperty("--text", v.text);
    r.style.setProperty("--sub", v.sub);
    r.style.setProperty("--dot", v.dot);
    document.body.style.backgroundColor = v.bg;
    document.body.style.color = v.text;
  };

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("devhub-theme") as Theme | null;
    const initial = saved && THEMES[saved] ? saved : "dark";
    setThemeState(initial);
    applyTheme(initial);
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem("devhub-theme", t);
    applyTheme(t);
  };

  if (!mounted) return <>{children}</>;

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
