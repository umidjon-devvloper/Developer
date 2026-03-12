"use client";
import { useState } from "react";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, firestore, googleProvider } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme, THEMES, Theme } from "@/components/theme-provider";

const THEME_ACCENTS: Record<Theme, string> = {
  dark: "#6366F1",
  light: "#6366F1",
  purple: "#8B5CF6",
  ocean: "#3B82F6",
  sunset: "#F97316",
};

function ThemeDots() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="flex items-center gap-2 justify-center mb-6">
      {(Object.entries(THEMES) as [Theme, (typeof THEMES)[Theme]][]).map(
        ([key, val]) => (
          <button
            key={key}
            onClick={() => setTheme(key)}
            title={val.label}
            className="transition-all hover:scale-110"
            style={{
              width: theme === key ? 24 : 14,
              height: 14,
              borderRadius: 99,
              backgroundColor: THEME_ACCENTS[key],
              opacity: theme === key ? 1 : 0.35,
              border:
                theme === key ? `2px solid ${THEME_ACCENTS[key]}` : "none",
              boxShadow:
                theme === key ? `0 0 8px ${THEME_ACCENTS[key]}88` : "none",
            }}
          />
        ),
      )}
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const accent = THEME_ACCENTS[theme];
  const isLight = theme === "light";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const inputStyle = {
    backgroundColor: isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.07)",
    border: `1px solid var(--border)`,
    color: "var(--text)",
  };
  const focusBorderColor = accent + "80";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Email va parolni kiriting");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/");
    } catch {
      setError("Email yoki parol noto'g'ri");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const userRef = doc(firestore, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          fullName: user.displayName || "",
          email: user.email || "",
          profession: "",
          bio: "",
          location: "",
          github: "",
          linkedin: "",
          skills: [],
          projects: [],
          photoURL: user.photoURL || "",
          createdAt: serverTimestamp(),
          followers: [],
          following: [],
          available: false,
        });
      }
      router.push("/");
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user")
        setError("Google bilan kirishda xatolik yuz berdi");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 transition-colors duration-300"
      style={{ backgroundColor: "var(--bg)" }}
    >
      {/* Ambient blobs */}
      <div
        className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-all duration-500"
        style={{ backgroundColor: accent + "18" }}
      />
      <div
        className="absolute bottom-1/4 right-1/3 w-80 h-80 rounded-full blur-3xl pointer-events-none transition-all duration-500"
        style={{ backgroundColor: accent + "10" }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Theme switcher dots */}
        <ThemeDots />

        {/* Logo */}
        <div className="text-center mb-7">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black mx-auto mb-3 shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${accent}, ${accent}BB)`,
              boxShadow: `0 8px 24px ${accent}44`,
            }}
          >
            {"</>"}
          </div>
          <h1
            className="text-2xl font-black tracking-tight"
            style={{ color: "var(--text)" }}
          >
            DevHub
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--sub)" }}>
            Developer Community
          </p>
        </div>

        {/* Card */}
        <div
          className="p-7 rounded-3xl backdrop-blur transition-all duration-300"
          style={{
            backgroundColor: isLight
              ? "rgba(255,255,255,0.85)"
              : "rgba(255,255,255,0.04)",
            border: "1px solid var(--border)",
            boxShadow: isLight
              ? "0 8px 40px rgba(0,0,0,0.08)"
              : `0 8px 40px ${accent}12`,
          }}
        >
          <h2
            className="text-xl font-black mb-0.5"
            style={{ color: "var(--text)" }}
          >
            Kirish
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--sub)" }}>
            Akkauntingizga kiring
          </p>

          {error && (
            <div
              className="mb-4 px-4 py-3 rounded-xl text-sm"
              style={{
                backgroundColor: "#EF444415",
                border: "1px solid #EF444430",
                color: "#EF4444",
              }}
            >
              {error}
            </div>
          )}

          {/* Google */}
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl font-semibold text-sm mb-5 transition-all hover:opacity-90 disabled:opacity-50"
            style={{
              backgroundColor: isLight
                ? "rgba(0,0,0,0.04)"
                : "rgba(255,255,255,0.06)",
              border: "1px solid var(--border)",
              color: "var(--text)",
            }}
          >
            {googleLoading ? (
              <span
                className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: accent, borderTopColor: "transparent" }}
              />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            Google bilan kirish
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div
              className="flex-1 h-px"
              style={{ backgroundColor: "var(--border)" }}
            />
            <span
              className="text-xs font-medium"
              style={{ color: "var(--sub)" }}
            >
              yoki email bilan
            </span>
            <div
              className="flex-1 h-px"
              style={{ backgroundColor: "var(--border)" }}
            />
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                className="text-sm font-semibold mb-1.5 block"
                style={{ color: "var(--sub)" }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full px-4 py-3 rounded-xl outline-none transition-all text-sm"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = focusBorderColor)}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>
            <div>
              <label
                className="text-sm font-semibold mb-1.5 block"
                style={{ color: "var(--sub)" }}
              >
                Parol
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl outline-none transition-all text-sm pr-11"
                  style={inputStyle}
                  onFocus={(e) =>
                    (e.target.style.borderColor = focusBorderColor)
                  }
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-80"
                  style={{ color: "var(--sub)" }}
                >
                  {showPw ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-white hover:opacity-90 transition-all disabled:opacity-50 mt-1"
              style={{
                background: `linear-gradient(135deg, ${accent}, ${accent}BB)`,
                boxShadow: `0 6px 20px ${accent}44`,
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Kirish...
                </span>
              ) : (
                "Kirish"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-5" style={{ color: "var(--sub)" }}>
          Akkaunt yo'qmi?{" "}
          <Link
            href="/register"
            className="font-bold hover:underline transition-colors"
            style={{ color: accent }}
          >
            Ro'yxatdan o'tish
          </Link>
        </p>
      </div>
    </div>
  );
}
