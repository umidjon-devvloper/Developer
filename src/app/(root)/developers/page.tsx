"use client";
import { useEffect, useState, useMemo, memo } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { useTheme, Theme } from "@/components/theme-provider";
import Link from "next/link";

const THEME_ACCENTS: Record<Theme, string> = {
  dark: "#6366F1",
  light: "#6366F1",
  purple: "#8B5CF6",
  ocean: "#3B82F6",
  sunset: "#F97316",
};

import { Developer } from "@/types";

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

// Common profession categories
const PROFESSION_FILTERS = [
  { label: "Barchasi", value: "" },
  { label: "Frontend", value: "frontend" },
  { label: "Backend", value: "backend" },
  { label: "Mobile", value: "mobile" },
  { label: "Full Stack", value: "full stack" },
  { label: "UI/UX", value: "ui/ux" },
  { label: "DevOps", value: "devops" },
  { label: "Data", value: "data" },
];

const Avatar = memo(function Avatar({
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
        fontSize: size * 0.32,
        background: `linear-gradient(135deg, ${color}, ${color}AA)`,
      }}
    >
      {initials}
    </div>
  );
});

function FilterChip({
  label,
  active,
  color,
  onClick,
}: {
  label: string;
  active: boolean;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 whitespace-nowrap flex-shrink-0"
      style={{
        backgroundColor: active ? color : "var(--card)",
        color: active ? "#fff" : "var(--sub)",
        border: active ? `1px solid ${color}` : "1px solid var(--border)",
        boxShadow: active ? `0 4px 14px ${color}44` : "none",
      }}
    >
      {label}
    </button>
  );
}

export default function DevelopersPage() {
  const { theme } = useTheme();
  const accent = THEME_ACCENTS[theme];

  const [devs, setDevs] = useState<Developer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAvailable, setShowAvailable] = useState(false);
  const [selectedProfession, setSelectedProfession] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchDevs = async () => {
      try {
        const q = query(
          collection(firestore, "users"),
          orderBy("createdAt", "desc"),
        );
        const snap = await getDocs(q);
        setDevs(
          snap.docs.map((d) => ({ uid: d.id, ...d.data() }) as Developer),
        );
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchDevs();
  }, []);

  // Extract unique cities from devs
  const cities = useMemo(() => {
    const set = new Set<string>();
    devs.forEach((d) => {
      if (d.location) set.add(d.location.trim());
    });
    return Array.from(set).sort();
  }, [devs]);

  // Extract top skills from devs
  const topSkills = useMemo(() => {
    const count: Record<string, number> = {};
    devs.forEach((d) =>
      (d.skills || []).forEach((s) => {
        count[s] = (count[s] || 0) + 1;
      }),
    );
    return Object.entries(count)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 14)
      .map(([s]) => s);
  }, [devs]);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill],
    );
  };

  const clearFilters = () => {
    setSearch("");
    setShowAvailable(false);
    setSelectedProfession("");
    setSelectedCity("");
    setSelectedSkills([]);
  };

  const activeFilterCount = [
    showAvailable,
    !!selectedProfession,
    !!selectedCity,
    selectedSkills.length > 0,
  ].filter(Boolean).length;

  const filtered = useMemo(
    () =>
      devs.filter((d) => {
        const q = search.toLowerCase();
        const matchSearch =
          !q ||
          d.fullName?.toLowerCase().includes(q) ||
          d.profession?.toLowerCase().includes(q) ||
          d.skills?.some((s) => s.toLowerCase().includes(q)) ||
          d.location?.toLowerCase().includes(q);
        const matchAvailable = !showAvailable || d.available;
        const matchProfession =
          !selectedProfession ||
          d.profession
            ?.toLowerCase()
            .includes(selectedProfession.toLowerCase());
        const matchCity =
          !selectedCity ||
          d.location?.trim().toLowerCase() === selectedCity.toLowerCase();
        const matchSkills =
          selectedSkills.length === 0 ||
          selectedSkills.every((sk) =>
            d.skills?.some((s) => s.toLowerCase() === sk.toLowerCase()),
          );
        return (
          matchSearch &&
          matchAvailable &&
          matchProfession &&
          matchCity &&
          matchSkills
        );
      }),
    [
      devs,
      search,
      showAvailable,
      selectedProfession,
      selectedCity,
      selectedSkills,
    ],
  );

  return (
    <div
      className="min-h-screen pt-24 pb-16 px-4"
      style={{ backgroundColor: "var(--bg)" }}
    >
      <div className="max-w-7xl mx-auto">
        {/* в”Ђв”Ђ Header в”Ђв”Ђ */}
        {/* ―― Header ―― */}
        <div className="mb-8">
          <h1
            className="text-4xl font-black mb-1"
            style={{ color: "var(--text)" }}
          >
            👨‍💻 Developerlar
          </h1>
          <p style={{ color: "var(--sub)" }}>
            {loading
              ? "Yuklanmoqda..."
              : `${filtered.length} / ${devs.length} ta developer`}
          </p>
        </div>

        {/* ―― Search bar ―― */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                cx="11"
                cy="11"
                r="8"
                stroke="currentColor"
                strokeWidth="2"
                style={{ color: "var(--text)" }}
              />
              <path
                d="M21 21l-4.35-4.35"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                style={{ color: "var(--text)" }}
              />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ism, kasb, texnologiya yoki shahar..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl text-sm outline-none transition-all"
              style={{
                backgroundColor: "var(--card)",
                border: `1.5px solid var(--border)`,
                color: "var(--text)",
              }}
              onFocus={(e) => (e.target.style.borderColor = accent + "60")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg flex items-center justify-center text-xs hover:opacity-70"
                style={{
                  backgroundColor: "var(--border)",
                  color: "var(--sub)",
                }}
              >
                ×
              </button>
            )}
          </div>

          {/* Filter toggle button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-sm transition-all hover:scale-105 active:scale-95 relative flex-shrink-0"
            style={{
              backgroundColor:
                showFilters || activeFilterCount > 0 ? accent : "var(--card)",
              color:
                showFilters || activeFilterCount > 0 ? "#fff" : "var(--text)",
              border: `1.5px solid ${showFilters || activeFilterCount > 0 ? accent : "var(--border)"}`,
              boxShadow:
                activeFilterCount > 0 ? `0 4px 16px ${accent}44` : "none",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 6h18M7 12h10M11 18h2"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            <span className="hidden sm:inline">Filter</span>
            {activeFilterCount > 0 && (
              <span
                className="w-5 h-5 rounded-full bg-white text-[10px] font-black flex items-center justify-center flex-shrink-0"
                style={{ color: accent }}
              >
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Available toggle */}
          <button
            onClick={() => setShowAvailable(!showAvailable)}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-sm transition-all hover:scale-105 active:scale-95 flex-shrink-0"
            style={{
              backgroundColor: showAvailable ? "#10B98118" : "var(--card)",
              color: showAvailable ? "#10B981" : "var(--sub)",
              border: `1.5px solid ${showAvailable ? "#10B98150" : "var(--border)"}`,
            }}
          >
            <span
              className={`w-2 h-2 rounded-full flex-shrink-0 ${showAvailable ? "bg-[#10B981] animate-pulse" : "bg-gray-400"}`}
            />
            <span className="hidden sm:inline">Open to work</span>
            <span className="sm:hidden">Open</span>
          </button>
        </div>

        {/* ―― Expandable Filters Panel ―― */}
        {showFilters && (
          <div
            className="mb-6 p-5 rounded-2xl transition-all"
            style={{
              backgroundColor: "var(--card)",
              border: `1.5px solid ${accent}30`,
              boxShadow: `0 8px 32px ${accent}12`,
            }}
          >
            {/* Profession type */}
            <div className="mb-5">
              <p
                className="text-[11px] font-black tracking-widest uppercase mb-3"
                style={{ color: accent }}
              >
                Developer turi
              </p>
              <div className="flex flex-wrap gap-2">
                {PROFESSION_FILTERS.map((p) => (
                  <FilterChip
                    key={p.value}
                    label={p.label}
                    active={selectedProfession === p.value}
                    color={accent}
                    onClick={() => setSelectedProfession(p.value)}
                  />
                ))}
              </div>
            </div>

            {/* City filter */}
            {cities.length > 0 && (
              <div className="mb-5">
                <p
                  className="text-[11px] font-black tracking-widest uppercase mb-3"
                  style={{ color: accent }}
                >
                  Shahar
                </p>
                <div className="flex flex-wrap gap-2">
                  <FilterChip
                    label="Barchasi"
                    active={selectedCity === ""}
                    color={accent}
                    onClick={() => setSelectedCity("")}
                  />
                  {cities.map((city) => (
                    <FilterChip
                      key={city}
                      label={`📍 ${city}`}
                      active={selectedCity === city}
                      color={accent}
                      onClick={() =>
                        setSelectedCity(city === selectedCity ? "" : city)
                      }
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Skills filter */}
            {topSkills.length > 0 && (
              <div className="mb-5">
                <p
                  className="text-[11px] font-black tracking-widest uppercase mb-3"
                  style={{ color: accent }}
                >
                  Texnologiyalar{" "}
                  <span className="normal-case font-semibold opacity-60">
                    (bir nechtasini tanlang)
                  </span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {topSkills.map((skill) => {
                    const active = selectedSkills.includes(skill);
                    const skillColor =
                      COLORS[Math.abs(skill.charCodeAt(0) * 3) % COLORS.length];
                    return (
                      <button
                        key={skill}
                        onClick={() => toggleSkill(skill)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
                        style={{
                          backgroundColor: active
                            ? skillColor + "25"
                            : "var(--bg)",
                          color: active ? skillColor : "var(--sub)",
                          border: active
                            ? `1.5px solid ${skillColor}60`
                            : "1.5px solid var(--border)",
                          boxShadow: active
                            ? `0 2px 10px ${skillColor}30`
                            : "none",
                        }}
                      >
                        {active && "✓ "}
                        {skill}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Clear button */}
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition-all hover:opacity-80"
                style={{
                  backgroundColor: "#EF444418",
                  color: "#EF4444",
                  border: "1px solid #EF444430",
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M18 6L6 18M6 6l12 12"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
                Barcha filterlarni tozalash
              </button>
            )}
          </div>
        )}

        {/* ―― Active filter chips (summary) ―― */}
        {!showFilters && activeFilterCount > 0 && (
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            <span
              className="text-xs font-semibold"
              style={{ color: "var(--sub)" }}
            >
              Faol:
            </span>
            {selectedProfession && (
              <span
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold text-white"
                style={{ backgroundColor: accent }}
              >
                {
                  PROFESSION_FILTERS.find((p) => p.value === selectedProfession)
                    ?.label
                }
                <button
                  onClick={() => setSelectedProfession("")}
                  className="hover:opacity-70"
                >
                  ×
                </button>
              </span>
            )}
            {selectedCity && (
              <span
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold text-white"
                style={{ backgroundColor: accent }}
              >
                📍 {selectedCity}
                <button
                  onClick={() => setSelectedCity("")}
                  className="hover:opacity-70"
                >
                  ×
                </button>
              </span>
            )}
            {selectedSkills.map((skill) => (
              <span
                key={skill}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold text-white"
                style={{
                  backgroundColor:
                    COLORS[Math.abs(skill.charCodeAt(0) * 3) % COLORS.length],
                }}
              >
                {skill}
                <button
                  onClick={() => toggleSkill(skill)}
                  className="hover:opacity-70"
                >
                  ×
                </button>
              </span>
            ))}
            <button
              onClick={clearFilters}
              className="text-xs font-bold px-3 py-1 rounded-xl hover:opacity-70"
              style={{
                color: "#EF4444",
                backgroundColor: "#EF444415",
                border: "1px solid #EF444425",
              }}
            >
              Tozalash
            </button>
          </div>
        )}

        {/* ―― Skeleton ―― */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl h-52 animate-pulse"
                style={{
                  border: "1px solid var(--border)",
                  backgroundColor: "var(--card)",
                }}
              />
            ))}
          </div>
        )}

        {/* ―― Grid ―― */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((dev) => {
              const color = getColor(dev.uid || "anon");
              const followerCount = Array.isArray(dev.followers)
                ? dev.followers.length
                : dev.followers || 0;

              return (
                <Link key={dev.uid} href={`/profile/${dev.uid}`}>
                  <div
                    className="p-5 rounded-2xl transition-all cursor-pointer h-full flex flex-col hover:scale-[1.02] hover:-translate-y-1"
                    style={{
                      border: "1px solid var(--border)",
                      backgroundColor: "var(--card)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = color + "55";
                      e.currentTarget.style.boxShadow = `0 12px 36px ${color}20`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    {/* accent bar */}
                    <div
                      className="h-0.5 rounded-full mb-4 opacity-80"
                      style={{
                        background: `linear-gradient(to right, ${color}, transparent)`,
                      }}
                    />

                    {/* Avatar */}
                    <div className="relative self-start mb-3">
                      <Avatar
                        name={dev.fullName || "?"}
                        photoURL={dev.photoURL}
                        color={color}
                        size={50}
                      />
                      {dev.available && (
                        <span
                          className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-[#10B981] border-2"
                          style={{ borderColor: "var(--card)" }}
                        />
                      )}
                    </div>

                    <h3
                      className="font-bold truncate mb-0.5"
                      style={{ color: "var(--text)" }}
                    >
                      {dev.fullName || "Nomsiz"}
                    </h3>
                    <p
                      className="text-sm font-semibold truncate"
                      style={{ color }}
                    >
                      {dev.profession || "Developer"}
                    </p>

                    {dev.location && (
                      <button
                        className="text-xs mt-1.5 mb-1 self-start px-2 py-0.5 rounded-lg transition-all hover:opacity-80"
                        style={{
                          backgroundColor: `${accent}12`,
                          color: "var(--sub)",
                          border: `1px solid ${accent}18`,
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedCity(dev.location!.trim());
                          setShowFilters(false);
                        }}
                        title={`${dev.location} bo'yicha filter`}
                      >
                        📍 {dev.location}
                      </button>
                    )}

                    {/* Skills */}
                    <div className="flex flex-wrap gap-1.5 flex-1 my-3">
                      {(dev.skills || []).slice(0, 3).map((s, i) => (
                        <button
                          key={i}
                          className="px-2 py-0.5 rounded-md text-xs font-bold transition-all hover:opacity-80"
                          style={{ backgroundColor: color + "18", color }}
                          onClick={(e) => {
                            e.preventDefault();
                            toggleSkill(s);
                          }}
                          title={`${s} bo'yicha filter`}
                        >
                          {s}
                        </button>
                      ))}
                      {(dev.skills || []).length > 3 && (
                        <span
                          className="px-2 py-0.5 rounded-md text-xs font-bold"
                          style={{
                            backgroundColor: "var(--border)",
                            color: "var(--sub)",
                          }}
                        >
                          +{(dev.skills?.length || 0) - 3}
                        </span>
                      )}
                    </div>

                    {/* Footer */}
                    <div
                      className="flex items-center justify-between pt-3 mt-auto"
                      style={{ borderTop: "1px solid var(--border)" }}
                    >
                      <span className="text-xs" style={{ color: "var(--sub)" }}>
                        👥 {followerCount}
                      </span>
                      {dev.available ? (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[#10B981]/15 text-[#10B981]">
                          Open
                        </span>
                      ) : (
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-md"
                          style={{
                            backgroundColor: "rgba(156,163,175,0.12)",
                            color: "var(--sub)",
                          }}
                        >
                          —
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* ―― Empty ―― */}
        {!loading && filtered.length === 0 && (
          <div
            className="text-center py-24 rounded-2xl"
            style={{
              border: "1px solid var(--border)",
              backgroundColor: "var(--card)",
            }}
          >
            <div className="text-5xl mb-4">🔍</div>
            <p
              className="text-lg font-black mb-2"
              style={{ color: "var(--text)" }}
            >
              Hech narsa topilmadi
            </p>
            <p className="text-sm mb-5" style={{ color: "var(--sub)" }}>
              Qidiruvni yoki filterni o'zgartiring
            </p>
            <button
              onClick={clearFilters}
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90"
              style={{
                background: `linear-gradient(135deg, ${accent}, ${accent}CC)`,
              }}
            >
              Filterlarni tozalash
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
