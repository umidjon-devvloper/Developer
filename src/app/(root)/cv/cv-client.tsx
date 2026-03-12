"use client";
// src/app/cv/CVClient.tsx
// вњ… CLIENT COMPONENT вЂ” auth, Firebase reads, form state, PDF

import { useEffect, useState, useCallback, memo } from "react";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { firestore, auth } from "@/lib/firebase";
import { useTheme, Theme } from "@/components/theme-provider";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { Sparkles, GripVertical, CheckCircle2, ChevronDown, Download, Sparkle } from "lucide-react";
import {
  buildCV,
  CV_PALETTES,
  CV_TEMPLATES,
  DEFAULT_CV,
} from "./pdfGenerator";
import { UserData, PortfolioItem, CVData, CVPalette } from "@/types";
import { div } from "framer-motion/client";

// в”Ђв”Ђв”Ђ Accent map в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
const ACCENTS: Record<Theme, string> = {
  dark: "#6366F1",
  light: "#6366F1",
  purple: "#8B5CF6",
  ocean: "#3B82F6",
  sunset: "#F97316",
};

// в”Ђв”Ђв”Ђ Sub-components (memoized to avoid re-renders) в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ

const FormInput = memo(
  ({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
  }: {
    label: string;
    value: string;
    placeholder: string;
    onChange: (v: string) => void;
    type?: string;
  }) => {
    const { theme } = useTheme();
    const accent = ACCENTS[theme];
    return (
      <div>
        <label
          className="text-xs font-bold mb-1.5 block"
          style={{ color: "var(--sub)" }}
        >
          {label}
        </label>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2.5 rounded-xl text-sm transition-all outline-none"
          style={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            color: "var(--text)",
          }}
          onFocus={(e) => (e.target.style.borderColor = accent + "80")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />
      </div>
    );
  },
);
FormInput.displayName = "FormInput";

const FormTextarea = memo(
  ({
    label,
    value,
    onChange,
    placeholder,
    rows = 4,
  }: {
    label: string;
    value: string;
    placeholder: string;
    onChange: (v: string) => void;
    rows?: number;
  }) => {
    const { theme } = useTheme();
    const accent = ACCENTS[theme];
    return (
      <div>
        <label
          className="text-xs font-bold mb-1.5 block"
          style={{ color: "var(--sub)" }}
        >
          {label}
        </label>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="w-full px-3 py-2.5 rounded-xl text-sm transition-all outline-none resize-none"
          style={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            color: "var(--text)",
          }}
          onFocus={(e) => (e.target.style.borderColor = accent + "80")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />
      </div>
    );
  },
);
FormTextarea.displayName = "FormTextarea";

// в”Ђв”Ђв”Ђ Sortable Item Component в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
const SortableSectionItem = ({ id, label, accent }: { id: string; label: string; accent: string }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 0,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-2 rounded-xl mb-2 transition-colors ${
        isDragging ? "shadow-lg bg-white dark:bg-gray-800" : ""
      }`}
      {...attributes}
      {...listeners}
    >
      <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 transition-colors">
        <GripVertical size={16} />
      </div>
      <div
        className="flex-1 text-xs font-bold px-3 py-2 rounded-lg"
        style={{
          backgroundColor: "var(--card)",
          border: `1px solid var(--border)`,
          color: "var(--text)",
        }}
      >
        {label}
      </div>
    </div>
  );
};

// в”Ђв”Ђв”Ђ Live Preview Component в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
const CVPreview = memo(
  ({
    userData,
    portfolio,
    cvData,
    palette,
  }: {
    userData: UserData | null;
    portfolio: PortfolioItem[];
    cvData: CVData;
    palette: CVPalette;
  }) => {
    const isMinimal = (cvData.templateId || "modern") === "minimal";
    const isDeveloper = (cvData.templateId || "modern") === "developer";
    const isCorporate = (cvData.templateId || "modern") === "corporate";
    const isCreative = (cvData.templateId || "modern") === "creative";
    
    const fontBase = isDeveloper ? "'Courier New', Courier, monospace" : isCorporate ? "'Times New Roman', Times, serif" : "'Inter', 'Arial', sans-serif";
    const avatarShape = isDeveloper ? "8px" : "50%";
    const sidebarWidth = isCorporate ? "25%" : isCreative ? "34%" : isMinimal ? "26%" : "29%";

    const initials = (userData?.fullName || "?")
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

    const sectionStyle: React.CSSProperties = {
      fontSize: "7.5px",
      fontWeight: 800,
      textTransform: "uppercase" as const,
      letterSpacing: "0.08em",
      color: isMinimal ? "#333" : palette.sidebar,
      borderBottom: isMinimal ? "none" : `1.5px solid ${palette.accent}`,
      paddingBottom: "2px",
      marginBottom: "5px",
    };

    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
    const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

    // Rotate bounds: max 8 degrees
    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["8deg", "-8deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-8deg", "8deg"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const xPct = mouseX / rect.width - 0.5;
      const yPct = mouseY / rect.height - 0.5;
      x.set(xPct);
      y.set(yPct);
    };

    const handleMouseLeave = () => {
      x.set(0);
      y.set(0);
    };

    return (
      <div 
        className="relative w-full aspect-[210/297] cursor-pointer"
        style={{ perspective: "1000px" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <motion.div
          style={{
            width: "100%",
            height: "100%",
            rotateX,
            rotateY,
            transformStyle: "preserve-3d",
          }}
          className="relative w-full h-full"
        >
          {/* Background decorative page (Stack effect) */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "#f5f5f7",
              border: `1px solid ${palette.accent}33`,
              borderRadius: "12px",
              transform: "translateZ(-30px) translateY(15px) translateX(15px)",
              boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
              zIndex: 0,
              opacity: 0.8,
            }}
          />

          {/* Main front page */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              display: "flex",
              backgroundColor: "#fff",
              fontSize: "7.5px",
              lineHeight: "1.4",
              fontFamily: fontBase,
              border: `2px solid ${palette.accent}55`,
              borderRadius: "12px",
              overflow: "hidden",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
              transform: "translateZ(0px)",
              zIndex: 1,
            }}
          >
            {/* Sidebar */}
        <div
          style={{
            width: sidebarWidth,
            backgroundColor: isMinimal ? "#fafafa" : palette.sidebar,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "0 8px 12px",
            position: "relative",
          }}
        >
          {/* Top accent */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "3px",
              backgroundColor: palette.accent,
            }}
          />

          {/* Avatar */}
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: avatarShape,
              marginTop: 14,
              backgroundColor: palette.accent + "35",
              border: `2.5px solid ${palette.accent}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 900,
              color: palette.accent,
              marginBottom: 6,
              boxShadow: `0 0 0 3px ${palette.accent}22`,
            }}
          >
            {userData?.photoURL ? (
              <img
                src={userData.photoURL}
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: avatarShape,
                  objectFit: "cover",
                }}
                alt=""
              />
            ) : (
              initials
            )}
          </div>

          <p
            style={{
              fontWeight: 900,
              color: isMinimal ? palette.sidebar : "#fff",
              textAlign: "center",
              fontSize: "9px",
              lineHeight: "1.3",
              marginBottom: "3px",
            }}
          >
            {userData?.fullName || "Ism Familya"}
          </p>
          <p
            style={{
              color: palette.accent,
              textAlign: "center",
              fontSize: "7.5px",
              marginBottom: "10px",
              opacity: 0.9,
            }}
          >
            {userData?.profession || "Kasb"}
          </p>

          {/* Contact */}
          <div style={{ width: "100%", marginBottom: "8px" }}>
            <div
              style={{
                fontSize: "6.5px",
                fontWeight: 700,
                color: palette.accent,
                borderBottom: `0.5px solid ${palette.accent}45`,
                paddingBottom: "2px",
                marginBottom: "4px",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Aloqa
            </div>
            {[userData?.email, cvData.phone, userData?.location]
              .filter(Boolean)
              .slice(0, 3)
              .map((v, i) => (
                <p
                  key={i}
                  style={{
                    fontSize: "6.5px",
                    color: isMinimal ? "#555" : "rgba(220,220,240,0.9)",
                    marginBottom: "2.5px",
                    wordBreak: "break-all",
                  }}
                >
                  {v}
                </p>
              ))}
          </div>

          {/* Skills */}
          {(userData?.skills || []).length > 0 && (
            <div style={{ width: "100%", marginBottom: "8px" }}>
              <div
                style={{
                  fontSize: "6.5px",
                  fontWeight: 700,
                  color: palette.accent,
                  borderBottom: `0.5px solid ${palette.accent}45`,
                  paddingBottom: "2px",
                  marginBottom: "4px",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Ko'nikmalar
              </div>
              {(userData!.skills || []).slice(0, 8).map((s, i) => (
                <p
                  key={i}
                  style={{
                    fontSize: "6.5px",
                    color: isMinimal ? "#555" : "rgba(220,220,240,0.9)",
                    marginBottom: "2.5px",
                    display: "flex",
                    alignItems: "center",
                    gap: "3px",
                  }}
                >
                  <span
                    style={{
                      width: "4px",
                      height: "4px",
                      borderRadius: "50%",
                      backgroundColor: palette.accent,
                      flexShrink: 0,
                      display: "inline-block",
                    }}
                  />
                  {s}
                </p>
              ))}
            </div>
          )}

          {/* Languages */}
          {cvData.languages && (
            <div style={{ width: "100%" }}>
              <div
                style={{
                  fontSize: "6.5px",
                  fontWeight: 700,
                  color: palette.accent,
                  borderBottom: `0.5px solid ${palette.accent}45`,
                  paddingBottom: "2px",
                  marginBottom: "4px",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Tillar
              </div>
              {cvData.languages
                .split(",")
                .slice(0, 4)
                .map((l, i) => (
                  <p
                    key={i}
                    style={{
                      fontSize: "6.5px",
                      color: isMinimal ? "#555" : "rgba(220,220,240,0.9)",
                      marginBottom: "2.5px",
                      display: "flex",
                      alignItems: "center",
                      gap: "3px",
                    }}
                  >
                    <span
                      style={{
                        width: "4px",
                        height: "4px",
                        borderRadius: "50%",
                        backgroundColor: palette.accent,
                        flexShrink: 0,
                        display: "inline-block",
                      }}
                    />
                    {l.trim()}
                  </p>
                ))}
            </div>
          )}
        </div>

        {/* Main */}
        <div
          style={{
            flex: 1,
            padding: "14px 12px 8px 10px",
            backgroundColor: "#fff",
            overflow: "hidden",
          }}
        >
          {/* Summary */}
          {cvData.summary && (
            <div style={{ marginBottom: "12px" }}>
              <div style={sectionStyle}>Qisqacha</div>
              <p
                style={{
                  fontSize: "7px",
                  color: "#4a4a60",
                  lineHeight: "1.5",
                  display: "-webkit-box",
                  overflow: "hidden",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {cvData.summary}
              </p>
            </div>
          )}

          {/* Experience */}
          {cvData.experience.filter((e) => e.role || e.company).length > 0 && (
            <div style={{ marginBottom: "12px" }}>
              <div style={sectionStyle}>Ish Tajribasi</div>
              {cvData.experience
                .filter((e) => e.role || e.company)
                .slice(0, 2)
                .map((exp, i, arr) => (
                  <div
                    key={i}
                    style={{
                      marginBottom: i < arr.length - 1 ? "8px" : "0",
                      paddingBottom: i < arr.length - 1 ? "8px" : "0",
                      borderBottom:
                        i < arr.length - 1 ? "0.5px solid #eee" : "none",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "8px",
                          fontWeight: 700,
                          color: "#111",
                          margin: 0,
                        }}
                      >
                        {exp.role || "вЂ”"}
                      </p>
                      <p
                        style={{
                          fontSize: "6.5px",
                          color: "#999",
                          fontStyle: "italic",
                          margin: 0,
                        }}
                      >
                        {exp.period}
                      </p>
                    </div>
                    <p
                      style={{
                        fontSize: "7px",
                        fontWeight: 600,
                        color: palette.accent,
                        margin: "2px 0 3px",
                      }}
                    >
                      {exp.company}
                    </p>
                    {exp.desc && (
                      <p
                        style={{
                          fontSize: "6.5px",
                          color: "#555",
                          display: "-webkit-box",
                          overflow: "hidden",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {exp.desc}
                      </p>
                    )}
                  </div>
                ))}
            </div>
          )}

          {/* Portfolio */}
          {portfolio.length > 0 && (
            <div style={{ marginBottom: "12px" }}>
              <div style={sectionStyle}>Loyihalar</div>
              {portfolio.slice(0, 3).map((p, i) => (
                <div key={i} style={{ marginBottom: "6px" }}>
                  <p
                    style={{
                      fontSize: "8px",
                      fontWeight: 700,
                      color: "#111",
                      margin: 0,
                    }}
                  >
                    {p.title}
                  </p>
                  {p.tags?.length > 0 && (
                    <p
                      style={{
                        fontSize: "6.5px",
                        color: palette.accent,
                        margin: "1px 0",
                      }}
                    >
                      {p.tags.slice(0, 3).join(" | ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Education */}
          {cvData.education.filter((e) => e.school || e.degree).length > 0 && (
            <div>
              <div style={sectionStyle}>Ta'lim</div>
              {cvData.education
                .filter((e) => e.school || e.degree)
                .map((edu, i) => (
                  <div key={i} style={{ marginBottom: "6px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "8px",
                          fontWeight: 700,
                          color: "#111",
                          margin: 0,
                        }}
                      >
                        {edu.degree || "вЂ”"}
                      </p>
                      <p
                        style={{
                          fontSize: "6.5px",
                          color: "#999",
                          fontStyle: "italic",
                          margin: 0,
                        }}
                      >
                        {edu.year}
                      </p>
                    </div>
                    <p
                      style={{
                        fontSize: "7px",
                        color: palette.accent,
                        margin: "1px 0",
                      }}
                    >
                      {edu.school}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  </div>
);
},
);
CVPreview.displayName = "CVPreview";

// в”Ђв”Ђв”Ђ Main Client Component в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
export default function CVClient() {
  const { theme } = useTheme();
  const accent = ACCENTS[theme];
  const isLight = theme === "light";

  const [authUser, setAuthUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle",
  );
  const [palette, setPalette] = useState<CVPalette>(CV_PALETTES[0]);
  const [cvData, setCvData] = useState<CVData>(DEFAULT_CV);
  const [activeSection, setActiveSection] = useState("personal");
  const [atsMode, setAtsMode] = useState(false);
  const [isImprovingAI, setIsImprovingAI] = useState<{ [key: string]: boolean }>({});
  
  // DND Sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setCvData((prev) => {
        const order = prev.sectionOrder || ["summary", "experience", "portfolio", "education"];
        const oldIndex = order.indexOf(active.id as string);
        const newIndex = order.indexOf(over.id as string);
        return {
          ...prev,
          sectionOrder: arrayMove(order, oldIndex, newIndex),
        };
      });
    }
  };

  const handleAIEnhance = async (field: string, index?: number) => {
    const key = index !== undefined ? `${field}-${index}` : field;
    setIsImprovingAI((prev) => ({ ...prev, [key]: true }));
    
    // Simulate AI processing
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setCvData((prev) => {
      if (field === "summary") {
        return { ...prev, summary: prev.summary + " (AI so'zlarni moslashtirdi va optimallashtirdi.)" };
      } else if (field === "experience" && index !== undefined) {
        const newExp = [...prev.experience];
        newExp[index] = { ...newExp[index], desc: newExp[index].desc + " (AI ATS uchun optimallashtirdi, kuchli fe'llar ishlatildi.)" };
        return { ...prev, experience: newExp };
      }
      return prev;
    });
    
    setIsImprovingAI((prev) => ({ ...prev, [key]: false }));
  };

  // Auth listener
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setAuthUser(u);
      if (!u) setLoading(false);
    });
  }, []);

  // Fetch data вЂ” parallel requests
  useEffect(() => {
    if (!authUser) return;
    (async () => {
      try {
        // All 3 fetches in parallel
        const [uSnap, pSnap, cvSnap] = await Promise.all([
          getDoc(doc(firestore, "users", authUser.uid)),
          getDocs(
            query(
              collection(firestore, "portfolio"),
              where("userId", "==", authUser.uid),
            ),
          ),
          getDoc(doc(firestore, "cvs", authUser.uid)),
        ]);

        if (uSnap.exists()) {
          const d = {
            uid: uSnap.id,
            email: authUser.email || "",
            ...uSnap.data(),
          } as UserData;
          setUserData(d);
          // Only set summary if no saved CV
          if (!cvSnap.exists()) {
            setCvData((p) => ({ ...p, summary: d.bio || "" }));
          }
        }

        setPortfolio(
          pSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as PortfolioItem),
        );

        if (cvSnap.exists()) {
          const s = cvSnap.data();
          if (s.cvData) setCvData(s.cvData);
          if (s.paletteId) {
            const p = CV_PALETTES.find((x) => x.id === s.paletteId);
            if (p) setPalette(p);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [authUser]);

  // в”Ђв”Ђ Autosave effect (debounced)
  useEffect(() => {
    if (loading || !authUser || !cvData) return;
    const t = setTimeout(() => {
      // Don't auto-save if we just loaded or are already saving
      if (saveStatus !== "saving") {
        handleSave(true);
      }
    }, 2500);
    return () => clearTimeout(t);
  }, [cvData, palette, authUser, loading]);

  const handleSave = useCallback(async (isAutosave = false) => {
    if (!authUser) return;
    setSaveStatus("saving");
    try {
      await setDoc(
        doc(firestore, "cvs", authUser.uid),
        {
          userId: authUser.uid,
          cvData,
          paletteId: palette.id,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2500);
    } catch (e) {
      console.error(e);
      setSaveStatus("idle");
    }
  }, [authUser, cvData, palette.id]);

  const handleDownload = useCallback(async (mode: "standard" | "ats" = "standard") => {
    if (!authUser || !userData) return;
    setGenerating(true);
    try {
      await buildCV(userData, portfolio, cvData, palette, mode === "ats");
      await setDoc(
        doc(firestore, "cvs", authUser.uid),
        { lastDownloaded: serverTimestamp() },
        { merge: true },
      );
    } catch (e) {
      console.error(e);
      alert("Xatolik yuz berdi. Qayta urinib ko'ring.");
    } finally {
      setGenerating(false);
    }
  }, [authUser, userData, portfolio, cvData, palette]);

  const addExperience = useCallback(() => {
    setCvData((p) => ({
      ...p,
      experience: [
        ...p.experience,
        { role: "", company: "", period: "", desc: "" },
      ],
    }));
  }, []);

  const removeExperience = useCallback((idx: number) => {
    setCvData((p) => ({
      ...p,
      experience: p.experience.filter((_, i) => i !== idx),
    }));
  }, []);

  const handleExperienceChange = useCallback((idx: number, field: string, val: string) => {
    setCvData((p) => ({
      ...p,
      experience: p.experience.map((e, i) =>
        i === idx ? { ...e, [field]: val } : e,
      ),
    }));
  }, []);

  const addEducation = useCallback(() => {
    setCvData((p) => ({
      ...p,
      education: [
        ...p.education,
        { school: "", degree: "", year: "" },
      ],
    }));
  }, []);

  const removeEducation = useCallback((idx: number) => {
    setCvData((p) => ({
      ...p,
      education: p.education.filter((_, i) => i !== idx),
    }));
  }, []);

  const handleEducationChange = useCallback((idx: number, field: string, val: string) => {
    setCvData((p) => ({
      ...p,
      education: p.education.map((e, i) =>
        i === idx ? { ...e, [field]: val } : e,
      ),
    }));
  }, []);

  // в”Ђв”Ђ Loading
  if (loading)
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--bg)" }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 border-3 border-t-transparent rounded-full animate-spin"
            style={{
              borderColor: accent,
              borderTopColor: "transparent",
              borderWidth: 3,
            }}
          />
          <p className="font-semibold text-sm" style={{ color: "var(--sub)" }}>
            Yuklanmoqda...
          </p>
        </div>
      </div>
    );

  // в”Ђв”Ђ Not logged in
  if (!authUser)
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: "var(--bg)" }}
      >
        <div className="text-center max-w-sm">
          <div
            className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl mx-auto mb-8"
            style={{
              background: `linear-gradient(135deg,${accent}25,${accent}08)`,
              border: `1px solid ${accent}30`,
            }}
          >
            рџ“„
          </div>
          <h2
            className="text-3xl font-black mb-3"
            style={{ color: "var(--text)" }}
          >
            CV Yaratish
          </h2>
          <p className="mb-8 leading-relaxed" style={{ color: "var(--sub)" }}>
            Professional CV yaratish uchun avval tizimga kiring.
            Ma'lumotlaringiz avtomatik to'ldiriladi.
          </p>
          <Link
            href="/login"
            className="inline-block px-10 py-4 rounded-2xl font-black text-lg text-white hover:opacity-90 transition-all"
            style={{
              background: `linear-gradient(135deg,${accent},${accent}BB)`,
              boxShadow: `0 10px 35px ${accent}35`,
            }}
          >
            Kirish
          </Link>
        </div>
      </div>
    );

  const sections = [
    { id: "personal", label: "рџ‘¤ Shaxsiy" },
    { id: "summary", label: "рџ“ќ Tavsif" },
    { id: "experience", label: "рџ’ј Tajriba" },
    { id: "education", label: "рџЋ“ Ta'lim" },
    { id: "extra", label: "рџЊђ Qo'shimcha" },
  ];

  return (
    <div
      className="min-h-screen pt-16"
      style={{ backgroundColor: "var(--bg)" }}
    >
      {/* в”Ђв”Ђ Sticky top bar в”Ђв”Ђ */}
      <div
        className="sticky top-16 z-40 backdrop-blur-xl"
        style={{
          borderBottom: "1px solid var(--border)",
          backgroundColor: isLight
            ? "rgba(248,250,255,0.93)"
            : "rgba(8,8,18,0.93)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-base"
              style={{
                background: `linear-gradient(135deg,${accent},${accent}BB)`,
              }}
            >
              рџ“„
            </div>
            <div className="hidden sm:block">
              <h1
                className="font-black text-sm leading-none"
                style={{ color: "var(--text)" }}
              >
                CV Yaratish
              </h1>
              <p className="text-xs mt-0.5" style={{ color: "var(--sub)" }}>
                Firebase bilan sinxronlangan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSave(false)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-all"
              style={{
                backgroundColor:
                  saveStatus === "saved" ? "#10B98118" : "var(--card)",
                border: `1px solid ${saveStatus === "saved" ? "#10B981" : "var(--border)"}`,
                color: saveStatus === "saved" ? "#10B981" : "var(--text)",
              }}
            >
              {saveStatus === "saving" ? (
                <span
                  className="w-3.5 h-3.5 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: "currentColor" }}
                />
              ) : saveStatus === "saved" ? (
                "вњ“ Saqlandi"
              ) : (
                "рџ’ѕ Saqlash"
              )}
            </button>
            <button
              onClick={() => handleDownload("standard")}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black text-white hover:opacity-90 disabled:opacity-50 transition-all"
              style={{
                background: `linear-gradient(135deg,${accent},${accent}BB)`,
                boxShadow: `0 4px 18px ${accent}35`,
              }}
            >
              {generating ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Yaratilmoqda...
                </>
              ) : (
                "в¬‡пёЏ PDF Yuklab olish"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* в”Ђв”Ђ Main layout в”Ђв”Ђ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex gap-5">
        {/* Left: nav + form */}
        <div className="flex gap-4 flex-1 min-w-0">
          {/* Vertical section nav */}
          <aside className="hidden md:flex flex-col gap-1 w-40 flex-shrink-0 pt-1">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className="px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-all"
                style={{
                  backgroundColor:
                    activeSection === s.id ? accent + "18" : "transparent",
                  color: activeSection === s.id ? accent : "var(--sub)",
                  border: `1px solid ${activeSection === s.id ? accent + "40" : "transparent"}`,
                }}
              >
                {s.label}
              </button>
            ))}

            {/* Template grid */}
            <div
              className="mt-5 pt-4"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <p
                className="text-xs font-black mb-3 px-1"
                style={{ color: "var(--sub)" }}
              >
                рџ“„ SHABLON
              </p>
              <div className="flex flex-col gap-2">
                {CV_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setCvData({ ...cvData, templateId: t.id })}
                    className="px-3 py-2 rounded-xl text-left text-xs font-bold transition-all hover:scale-[1.02]"
                    style={{
                      backgroundColor:
                        (cvData.templateId || "modern") === t.id
                          ? accent + "18"
                          : "transparent",
                      color:
                        (cvData.templateId || "modern") === t.id
                          ? accent
                          : "var(--sub)",
                      border: `1px solid ${
                        (cvData.templateId || "modern") === t.id
                          ? accent
                          : "var(--border)"
                      }`,
                    }}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Palette grid */}
            <div
              className="mt-5 pt-4"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <p
                className="text-xs font-black mb-3 px-1"
                style={{ color: "var(--sub)" }}
              >
                рџЋЁ CV RANGI
              </p>
              <div className="grid grid-cols-3 gap-2">
                {CV_PALETTES.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPalette(p)}
                    title={p.name}
                    className="rounded-xl overflow-hidden transition-all hover:scale-105"
                    style={{
                      height: 34,
                      backgroundColor: p.sidebar,
                      border:
                        palette.id === p.id
                          ? `2.5px solid ${p.accent}`
                          : `2px solid ${p.sidebar}55`,
                      boxShadow:
                        palette.id === p.id
                          ? `0 0 0 2.5px ${p.accent}44`
                          : "none",
                    }}
                  >
                    <div style={{ height: 9, backgroundColor: p.accent }} />
                  </button>
                ))}
              </div>
              <p
                className="text-xs font-bold mt-2 px-1"
                style={{ color: palette.accent }}
              >
                в—Џ {palette.name}
              </p>
            </div>

            {/* DND Section Order */}
            <div
              className="mt-5 pt-4 hidden md:block" // Hide on mobile for now to keep it clean, or could add an accordion
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <p
                className="text-xs font-black mb-3 px-1"
                style={{ color: "var(--sub)" }}
              >
                рџ—‚пёЏ BO'LIMLAR TARTIBI
              </p>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={cvData.sectionOrder || ["summary", "experience", "portfolio", "education"]}
                  strategy={verticalListSortingStrategy}
                >
                  {(cvData.sectionOrder || ["summary", "experience", "portfolio", "education"]).map((id) => (
                    <SortableSectionItem
                      key={id}
                      id={id}
                      label={
                        id === "summary" ? "рџ“ќ Tavsif" :
                        id === "experience" ? "рџ’ј Tajriba" :
                        id === "portfolio" ? "рџ“Ѓ Loyihalar" : "рџЋ“ Ta'lim"
                      }
                      accent={accent}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </div>
          </aside>

          {/* Form panels */}
          <div className="flex-1 space-y-5 min-w-0">
            {/* Mobile tabs */}
            <div className="md:hidden flex gap-2 overflow-x-auto pb-1">
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className="flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap"
                  style={{
                    backgroundColor:
                      activeSection === s.id ? accent + "20" : "var(--card)",
                    color: activeSection === s.id ? accent : "var(--sub)",
                    border: `1px solid ${activeSection === s.id ? accent + "50" : "var(--border)"}`,
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Mobile template and palette */}
            <div
              className="md:hidden p-4 rounded-2xl flex flex-col gap-4"
              style={{
                border: "1px solid var(--border)",
                backgroundColor: "var(--card)",
              }}
            >
              <div>
                <p
                  className="text-xs font-black mb-3"
                  style={{ color: "var(--sub)" }}
                >
                  рџ“„ SHABLON
                </p>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {CV_TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setCvData({ ...cvData, templateId: t.id })}
                      className="flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                      style={{
                        backgroundColor:
                          (cvData.templateId || "modern") === t.id
                            ? accent + "18"
                            : "transparent",
                        color:
                          (cvData.templateId || "modern") === t.id
                            ? accent
                            : "var(--sub)",
                        border: `1px solid ${
                          (cvData.templateId || "modern") === t.id
                            ? accent
                            : "var(--border)"
                        }`,
                      }}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p
                  className="text-xs font-black mb-3"
                  style={{ color: "var(--sub)" }}
                >
                  рџЋЁ CV RANGI
                </p>
              <div className="flex gap-2 flex-wrap">
                {CV_PALETTES.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPalette(p)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold"
                    style={{
                      backgroundColor:
                        palette.id === p.id ? p.accent + "18" : "transparent",
                      border: `1px solid ${palette.id === p.id ? p.accent : "var(--border)"}`,
                      color: palette.id === p.id ? p.accent : "var(--sub)",
                    }}
                  >
                    <div
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: p.accent }}
                    />
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
            </div>

            <AnimatePresence mode="wait">
              {/* в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
                  PERSONAL
              в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ */}
              {activeSection === "personal" && (
                <motion.section
                  key="personal"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="p-6 rounded-2xl space-y-5"
                  style={{
                    border: "1px solid var(--border)",
                    backgroundColor: "var(--card)",
                  }}
                >
                  <div className="flex items-center justify-between">
                  <h3
                    className="font-black text-base"
                    style={{ color: "var(--text)" }}
                  >
                    рџ‘¤ Shaxsiy ma'lumotlar
                  </h3>
                  <Link
                    href={`/profile/${authUser.uid}`}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg hover:opacity-80 transition-all"
                    style={{ color: accent, backgroundColor: accent + "15" }}
                  >
                    Profilni tahrirlash в†’
                  </Link>
                </div>

                {/* Firebase read-only badges */}
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { label: "Ism Familya", val: userData?.fullName },
                    { label: "Kasb / Lavozim", val: userData?.profession },
                    { label: "Joylashuv", val: userData?.location },
                    { label: "Email", val: userData?.email },
                  ].map((f) => (
                    <div
                      key={f.label}
                      className="p-3.5 rounded-xl"
                      style={{
                        backgroundColor: accent + "09",
                        border: `1px solid ${accent}22`,
                      }}
                    >
                      <p
                        className="text-xs font-bold mb-1"
                        style={{ color: accent }}
                      >
                        {f.label}
                      </p>
                      <p
                        className="text-sm font-semibold truncate"
                        style={{ color: "var(--text)" }}
                      >
                        {f.val || "вЂ”"}
                      </p>
                    </div>
                  ))}
                </div>

                <div
                  className="flex items-center gap-2 p-3 rounded-xl text-xs"
                  style={{
                    backgroundColor: accent + "07",
                    border: `1px solid ${accent}18`,
                    color: "var(--sub)",
                  }}
                >
                  <span>в„№пёЏ</span>
                  <span>
                    Bu ma'lumotlar Firebase profilingizdan olinadi. O'zgartirish
                    uchun profil sahifasiga o'ting.
                  </span>
                </div>

                <FormInput
                  label="рџ“ћ Telefon raqam"
                  value={cvData.phone}
                  onChange={(v) => setCvData({ ...cvData, phone: v })}
                  placeholder="+998 90 123 45 67"
                />

                {/* Skills */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <p
                      className="text-xs font-bold"
                      style={{ color: "var(--sub)" }}
                    >
                      рџ› пёЏ Ko'nikmalar (profildan)
                    </p>
                    <Link
                      href={`/profile/${authUser.uid}`}
                      className="text-xs font-semibold hover:opacity-80"
                      style={{ color: accent }}
                    >
                      + Qo'shish
                    </Link>
                  </div>
                  {(userData?.skills || []).length === 0 ? (
                    <p className="text-sm py-2" style={{ color: "var(--sub)" }}>
                      Profil sahifasida ko'nikmalar qo'shing
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {userData!.skills.map((s, i) => (
                        <span
                          key={i}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold"
                          style={{
                            backgroundColor: palette.accent + "18",
                            color: palette.accent,
                          }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Portfolio preview */}
                <div>
                  <p
                    className="text-xs font-bold mb-2.5"
                    style={{ color: "var(--sub)" }}
                  >
                    рџ“Ѓ Portfolio ({portfolio.length} ta) вЂ” CVga avtomatik
                    qo'shiladi
                  </p>
                  {portfolio.length === 0 ? (
                    <p className="text-sm" style={{ color: "var(--sub)" }}>
                      Hali portfolio qo'shilmagan
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {portfolio.slice(0, 3).map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center gap-3 p-3 rounded-xl"
                          style={{
                            backgroundColor: "var(--bg)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          <span className="text-lg flex-shrink-0">
                            {p.type === "github"
                              ? "рџђ™"
                              : p.type === "website"
                                ? "рџЊђ"
                                : p.type === "figma"
                                  ? "рџЋЁ"
                                  : "рџ”—"}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-sm font-bold truncate"
                              style={{ color: "var(--text)" }}
                            >
                              {p.title}
                            </p>
                            {p.tags?.length > 0 && (
                              <p
                                className="text-xs truncate"
                                style={{ color: accent }}
                              >
                                {p.tags.slice(0, 3).join(", ")}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                      {portfolio.length > 3 && (
                        <p
                          className="text-xs pl-1"
                          style={{ color: "var(--sub)" }}
                        >
                          +{portfolio.length - 3} ta loyiha yana
                        </p>
                      )}
                    </div>
                  )}
                </div>
                </motion.section>
              )}

              {/* в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
                  SUMMARY
              в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ */}
              {activeSection === "summary" && (
                <motion.section
                  key="summary"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="p-6 rounded-2xl"
                  style={{
                    border: "1px solid var(--border)",
                    backgroundColor: "var(--card)",
                  }}
                >
                  <h3
                  className="font-black text-base mb-5"
                  style={{ color: "var(--text)" }}
                >
                  рџ“ќ Qisqacha tavsif
                </h3>
                  <div className="relative">
                    <FormTextarea
                      label="O'zingiz haqingizda"
                      value={cvData.summary}
                      onChange={(v) => setCvData({ ...cvData, summary: v })}
                      placeholder="Men [kasb] bo'lib, [N] yillik tajribaga egaman. [Asosiy ko'nikmalar] bo'yicha ixtisoslashganman va [qo'shimcha] bilimlarim bor."
                      rows={8}
                    />
                    <div className="absolute top-14 right-2 pointer-events-none">
                      <button
                        onClick={() => handleAIEnhance("summary")}
                        disabled={isImprovingAI["summary"]}
                        className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:scale-105 disabled:opacity-50"
                        style={{
                          background: `linear-gradient(135deg, ${accent}, #A855F7)`,
                          boxShadow: `0 4px 12px ${accent}40`,
                        }}
                      >
                        {isImprovingAI["summary"] ? (
                          <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Sparkles size={14} />
                        )}
                        AI yordamida yaxshilash
                      </button>
                    </div>
                  </div>
                <div className="flex justify-between mt-2.5">
                  <p className="text-xs" style={{ color: "var(--sub)" }}>
                    3-5 jumla tavsiya etiladi
                  </p>
                  <p
                    className="text-xs font-bold"
                    style={{
                      color:
                        cvData.summary.length > 450 ? "#EF4444" : "var(--sub)",
                    }}
                  >
                    {cvData.summary.length}/500
                  </p>
                </div>
                </motion.section>
              )}

              {/* в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
                  EXPERIENCE
              в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ */}
              {activeSection === "experience" && (
                <motion.section
                  key="experience"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="p-6 rounded-2xl"
                  style={{
                    border: "1px solid var(--border)",
                    backgroundColor: "var(--card)",
                  }}
                >
                  <div className="flex items-center justify-between mb-5">
                  <h3
                    className="font-black text-base"
                    style={{ color: "var(--text)" }}
                  >
                    рџ’ј Ish tajribasi
                  </h3>
                  <button
                    onClick={addExperience}
                    className="px-4 py-2 rounded-xl text-xs font-black text-white hover:opacity-90 transition-all"
                    style={{
                      background: `linear-gradient(135deg,${accent},${accent}BB)`,
                    }}
                  >
                    + Tajriba qo'shish
                  </button>
                </div>
                <div className="space-y-4">
                  {cvData.experience.map((exp, i) => (
                    <div
                      key={i}
                      className="p-5 rounded-2xl"
                      style={{
                        border: `1px solid ${accent}22`,
                        backgroundColor: accent + "06",
                      }}
                    >
                      <div className="flex justify-between items-center mb-4">
                        <span
                          className="text-xs font-black px-2.5 py-1.5 rounded-lg"
                          style={{
                            backgroundColor: accent + "18",
                            color: accent,
                          }}
                        >
                          #{i + 1} Tajriba
                        </span>
                        {cvData.experience.length > 1 && (
                          <button
                            onClick={() => removeExperience(i)}
                            className="text-xs px-2.5 py-1.5 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-all"
                            style={{ color: "var(--sub)" }}
                          >
                            вњ• O'chirish
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <FormInput
                          label="Lavozim *"
                          value={exp.role}
                          onChange={(v) => handleExperienceChange(i, "role", v)}
                          placeholder="Frontend Developer"
                        />
                        <FormInput
                          label="Kompaniya *"
                          value={exp.company}
                          onChange={(v) => handleExperienceChange(i, "company", v)}
                          placeholder="TechCorp LLC"
                        />
                      </div>
                      <div className="mb-3">
                        <FormInput
                          label="Davr"
                          value={exp.period}
                          onChange={(v) => handleExperienceChange(i, "period", v)}
                          placeholder="2022 вЂ” Hozir"
                        />
                      </div>
                      <div className="relative">
                        <FormTextarea
                          label="Tavsif"
                          value={exp.desc}
                          onChange={(v) => handleExperienceChange(i, "desc", v)}
                          placeholder="Qilgan ishlaringiz, erishgan natijalaringiz..."
                          rows={3}
                        />
                        <div className="absolute top-0 right-0">
                          <button
                            onClick={() => handleAIEnhance("experience", i)}
                            disabled={isImprovingAI[`experience-${i}`]}
                            title="AI yordamida yaxshilash"
                            className="flex items-center gap-1 p-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105 disabled:opacity-50"
                            style={{ color: accent, backgroundColor: accent + "15" }}
                          >
                            {isImprovingAI[`experience-${i}`] ? (
                              <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Sparkles size={14} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                </motion.section>
              )}

              {/* в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
                  EDUCATION
              в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ */}
              {activeSection === "education" && (
                <motion.section
                  key="education"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="p-6 rounded-2xl"
                  style={{
                    border: "1px solid var(--border)",
                    backgroundColor: "var(--card)",
                  }}
                >
                  <div className="flex items-center justify-between mb-5">
                  <h3
                    className="font-black text-base"
                    style={{ color: "var(--text)" }}
                  >
                    рџЋ“ Ta'lim
                  </h3>
                  <button
                    onClick={addEducation}
                    className="px-4 py-2 rounded-xl text-xs font-black text-white hover:opacity-90 transition-all"
                    style={{
                      background: `linear-gradient(135deg,${accent},${accent}BB)`,
                    }}
                  >
                    + Ta'lim qo'shish
                  </button>
                </div>
                <div className="space-y-4">
                  {cvData.education.map((edu, i) => (
                    <div
                      key={i}
                      className="p-5 rounded-2xl"
                      style={{
                        border: `1px solid ${accent}22`,
                        backgroundColor: accent + "06",
                      }}
                    >
                      <div className="flex justify-between items-center mb-4">
                        <span
                          className="text-xs font-black px-2.5 py-1.5 rounded-lg"
                          style={{
                            backgroundColor: accent + "18",
                            color: accent,
                          }}
                        >
                          #{i + 1} Ta'lim
                        </span>
                        {cvData.education.length > 1 && (
                          <button
                            onClick={() => removeEducation(i)}
                            className="text-xs px-2.5 py-1.5 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-all"
                            style={{ color: "var(--sub)" }}
                          >
                            вњ• O'chirish
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <FormInput
                          label="Muassasa *"
                          value={edu.school}
                          onChange={(v) => handleEducationChange(i, "school", v)}
                          placeholder="TUIT, NUUz..."
                        />
                        <FormInput
                          label="Yo'nalish *"
                          value={edu.degree}
                          onChange={(v) => handleEducationChange(i, "degree", v)}
                          placeholder="Kompyuter ilmlari"
                        />
                      </div>
                      <FormInput
                        label="Yil"
                        value={edu.year}
                        onChange={(v) => handleEducationChange(i, "year", v)}
                        placeholder="2019 вЂ” 2023"
                      />
                    </div>
                  ))}
                </div>
                </motion.section>
              )}

              {/* в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
                  EXTRA
              в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ */}
              {activeSection === "extra" && (
                <motion.section
                  key="extra"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="p-6 rounded-2xl space-y-5"
                  style={{
                    border: "1px solid var(--border)",
                    backgroundColor: "var(--card)",
                  }}
                >
                  <h3
                  className="font-black text-base"
                  style={{ color: "var(--text)" }}
                >
                  рџЊђ Qo'shimcha
                </h3>
                <FormInput
                  label="Tillar (vergul bilan)"
                  value={cvData.languages}
                  onChange={(v) => setCvData({ ...cvData, languages: v })}
                  placeholder="O'zbek (ona tili), Ingliz (B2), Rus (B1)"
                />
                <div
                  className="p-4 rounded-xl"
                  style={{
                    backgroundColor: accent + "08",
                    border: `1px solid ${accent}1E`,
                  }}
                >
                  <p
                    className="text-xs font-black mb-3"
                    style={{ color: accent }}
                  >
                    вњ… CVga avtomatik qo'shiladigan ma'lumotlar
                  </p>
                  <div
                    className="grid grid-cols-2 gap-1.5 text-xs"
                    style={{ color: "var(--sub)" }}
                  >
                    {[
                      "Ism, kasb, joylashuv",
                      "Email (Firebase Auth)",
                      "GitHub havolasi",
                      "LinkedIn havolasi",
                      "Ko'nikmalar ro'yxati",
                      "Portfolio loyihalari",
                    ].map((t, i) => (
                      <p key={i}>вњ“ {t}</p>
                    ))}
                  </div>
                </div>
              </motion.section>
            )}
            </AnimatePresence>

            {/* Bottom actions */}
            <div className="flex gap-3 pb-6">
              <button
                onClick={() => handleSave(false)}
                className="flex-1 py-3.5 rounded-xl font-bold text-sm transition-all"
                style={{
                  border: "1px solid var(--border)",
                  backgroundColor: "var(--card)",
                  color: "var(--text)",
                }}
              >
                рџ’ѕ Saqlash
              </button>
              <button
                onClick={() => handleDownload("standard")}
                disabled={generating}
                className="flex-1 py-3.5 rounded-xl font-black text-sm text-white hover:opacity-90 disabled:opacity-50 transition-all"
                style={{
                  background: `linear-gradient(135deg,${accent},${accent}BB)`,
                  boxShadow: `0 4px 20px ${accent}28`,
                }}
              >
                {generating ? "вЏі Yaratilmoqda..." : "в¬‡пёЏ PDF Yuklab olish"}
              </button>
            </div>
          </div>
        </div>

        {/* в”Ђв”Ђ Right: Live Preview в”Ђв”Ђ */}
        <div className="hidden lg:block w-72 flex-shrink-0">
          <div className="sticky top-28 space-y-3">
            <div className="flex items-center justify-between">
              <p
                className="text-sm font-black"
                style={{ color: "var(--text)" }}
              >
                рџ‘ЃпёЏ Live Preview
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAtsMode(!atsMode)}
                  className="text-xs px-2.5 py-1 rounded-lg font-bold transition-colors"
                  style={{
                    backgroundColor: atsMode ? "#10B98120" : "var(--card)",
                    color: atsMode ? "#10B981" : "var(--sub)",
                    border: `1px solid ${atsMode ? "#10B981" : "var(--border)"}`
                  }}
                  title="ATS tizimlari uchun soddalashtirilgan rejim"
                >
                  {atsMode ? "ATS: Yoqilgan" : "ATS: O'chiq"}
                </button>
                {!atsMode && (
                  <>
                    <span
                      className="text-xs px-2.5 py-1 rounded-lg font-bold"
                      style={{ backgroundColor: accent + "15", color: accent }}
                    >
                      A4
                    </span>
                    <span
                      className="text-xs px-2.5 py-1 rounded-lg font-bold"
                      style={{
                        backgroundColor: palette.accent + "20",
                        color: palette.accent,
                      }}
                    >
                      в—Џ {palette.name}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div 
              className={`transition-all duration-300 ${atsMode ? "grayscale opacity-80 scale-95" : ""}`}
              style={{
                boxShadow: atsMode ? "none" : "0 20px 40px -10px rgba(0,0,0,0.1)",
                transformOrigin: "top center"
              }}
            >
              <CVPreview
                userData={userData}
                portfolio={portfolio}
                cvData={cvData}
                palette={palette}
              />
            </div>

            <p className="text-xs text-center mt-2" style={{ color: "var(--sub)" }}>
              {atsMode ? "ATS-do'stona rejimda dizayn elementlari o'chiriladi." : "Taxminiy ko'rinish вЂ” PDF biroz farq qilishi mumkin"}
            </p>

            <button
              onClick={() => handleDownload(atsMode ? "ats" : "standard")}
              disabled={generating}
              className="w-full py-4 rounded-2xl font-black text-sm text-white hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              style={{
                background: `linear-gradient(135deg,${accent},${accent}BB)`,
                boxShadow: `0 8px 28px ${accent}32`,
              }}
            >
              {generating ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Yaratilmoqda...
                </>
              ) : (
                "в¬‡пёЏ PDF Yuklab olish"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
