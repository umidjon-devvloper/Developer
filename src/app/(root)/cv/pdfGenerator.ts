// src/app/cv/pdfGenerator.ts
// ✅ Pure function — no React, no Firebase, just jsPDF logic

import { UserData, PortfolioItem, CVData, CVPalette, CVTemplate } from "@/types";

export const CV_TEMPLATES: CVTemplate[] = [
  { id: "modern", name: "Modern Tech" },
  { id: "minimal", name: "Minimal Clean" },
  { id: "developer", name: "Developer Focused" },
  { id: "corporate", name: "Corporate Professional" },
  { id: "creative", name: "Creative Portfolio" },
];

export const CV_PALETTES: CVPalette[] = [
  { id: "midnight", name: "Midnight Developer", sidebar: "#1E1B4B", accent: "#818CF8" },
  { id: "emerald",  name: "Emerald Professional", sidebar: "#064E3B", accent: "#34D399" },
  { id: "indigo",   name: "Indigo Modern",        sidebar: "#312E81", accent: "#A5B4FC" },
  { id: "minimal",  name: "Minimal Black",        sidebar: "#171717", accent: "#A3A3A3" },
  { id: "ocean",    name: "Ocean Blue",           sidebar: "#0C1A2E", accent: "#38BDF8" },
];

export const DEFAULT_CV: CVData = {
  phone: "",
  summary: "",
  languages: "O'zbek, Ingliz",
  templateId: "modern",
  sectionOrder: ["summary", "experience", "portfolio", "education"],
  experience: [{ role: "", company: "", period: "", desc: "" }],
  education: [{ school: "", degree: "", year: "" }],
};

// ─── Helpers ──────────────────────────────────────────────────
function h2r(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/** Lighten an rgb color by mixing with white */
function lighten([r, g, b]: [number, number, number], pct: number): [number, number, number] {
  return [
    Math.round(r + (255 - r) * pct),
    Math.round(g + (255 - g) * pct),
    Math.round(b + (255 - b) * pct),
  ];
}

async function fetchImageBase64(url: string, shape: "circle" | "square"): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const size = Math.min(img.width, img.height);
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(null); return; }
      if (shape === "circle") {
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
      }
      const sx = (img.width - size) / 2;
      const sy = (img.height - size) / 2;
      ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);
      resolve(canvas.toDataURL("image/jpeg", 0.92));
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

// ─── Main PDF function ────────────────────────────────────────
export async function buildCV(
  user: UserData,
  portfolio: PortfolioItem[],
  cv: CVData,
  palette: CVPalette,
  isAtsMode: boolean = false,
): Promise<void> {
  const { jsPDF } = await import("jspdf");

  // ── Page constants
  const PW = 210, PH = 297;
  const SB = 68;           // slightly wider sidebar for better balance
  const MX = SB + 10;      // main content left edge
  const MW = PW - MX - 12; // main content width
  const MARGIN_TOP_MAIN = 14;
  const FOOTER_H = 12;

  // ── Colors
  const [sr, sg, sb_] = h2r(palette.sidebar);
  const [ar, ag, ab]  = h2r(palette.accent);
  const accentLight   = lighten([ar, ag, ab], 0.88);
  const sideTextLight: [number,number,number] = [230, 230, 245];
  const sideTextMid:   [number,number,number] = [170, 175, 210];

  // ── ATS overrides
  if (isAtsMode) {
    generateAts(user, portfolio, cv, palette);
    return;
  }

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const font = "helvetica";

  // Fetch avatar
  let avatarB64: string | null = null;
  if (user.photoURL) {
    avatarB64 = await fetchImageBase64(user.photoURL, "circle");
  }

  // ── Track current y in main column
  let y = MARGIN_TOP_MAIN;
  let page = 1;

  // ─────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────

  /** Render the sidebar background for the current page */
  const renderSidebarBg = () => {
    // Main dark background
    pdf.setFillColor(sr, sg, sb_);
    pdf.rect(0, 0, SB, PH, "F");
    // Thin accent stripe on right edge of sidebar
    pdf.setFillColor(ar, ag, ab);
    pdf.rect(SB - 1.2, 0, 1.2, PH, "F");
    // Top header accent band behind photo
    const [ll, rr, bb] = lighten([sr, sg, sb_], 0.08) as [number,number,number];
    pdf.setFillColor(ll, rr, bb);
    pdf.rect(0, 0, SB, 72, "F");
  };

  /** Render a background for the entire page each time we add a page */
  const renderPageFrame = () => {
    renderSidebarBg();
    // Subtle right-column background (off-white)
    pdf.setFillColor(251, 251, 253);
    pdf.rect(SB, 0, PW - SB, PH, "F");
    // Footer gradient strip
    pdf.setFillColor(ar, ag, ab);
    pdf.setGState(pdf.GState({ opacity: 0.06 }));
    pdf.rect(SB, PH - FOOTER_H, PW - SB, FOOTER_H, "F");
    pdf.setGState(pdf.GState({ opacity: 1 }));
  };

  // Render first page frame
  renderPageFrame();

  /** Ensure there's room for 'space' mm in main column. If not, new page. */
  const ensureSpace = (space: number) => {
    if (y + space > PH - FOOTER_H - 4) {
      pdf.addPage();
      page++;
      renderPageFrame();
      y = MARGIN_TOP_MAIN;
    }
  };

  /** Draw footer on current page */
  const drawFooter = (pageNum: number) => {
    const fy = PH - 6;
    pdf.setFont(font, "normal");
    pdf.setFontSize(6.5);
    pdf.setTextColor(180, 180, 195);
    pdf.text(
      `${user.fullName || "CV"}  ·  ${user.email || ""}  ·  DevHub.uz`,
      MX,
      fy,
    );
    pdf.text(`${pageNum}`, PW - 10, fy, { align: "right" });
    // thin line above footer
    pdf.setDrawColor(220, 220, 230);
    pdf.setLineWidth(0.25);
    pdf.line(MX, PH - FOOTER_H + 1, PW - 8, PH - FOOTER_H + 1);
  };

  // ─────────────────────────────────────────────────────────────
  // SIDEBAR
  // ─────────────────────────────────────────────────────────────
  let sy = 8;

  // ── Profile photo
  const PHOTO_R = 20; // radius mm
  const CX = SB / 2;
  const CY = sy + PHOTO_R + 4;

  // Outer glow ring
  pdf.setFillColor(ar, ag, ab);
  pdf.setGState(pdf.GState({ opacity: 0.30 }));
  pdf.circle(CX, CY, PHOTO_R + 3.5, "F");
  pdf.setGState(pdf.GState({ opacity: 1 }));

  // Accent border ring
  pdf.setFillColor(ar, ag, ab);
  pdf.circle(CX, CY, PHOTO_R + 1.5, "F");

  if (avatarB64) {
    // Draw photo using clipping path
    pdf.saveGraphicsState();
    // We use ellipse as clip — approximate circle via rect trick
    pdf.addImage(avatarB64, "JPEG", CX - PHOTO_R, CY - PHOTO_R, PHOTO_R * 2, PHOTO_R * 2);
    pdf.restoreGraphicsState();
  } else {
    // Initials fallback
    const [bfr, bfg, bfb] = lighten([sr, sg, sb_], 0.15) as [number,number,number];
    pdf.setFillColor(bfr, bfg, bfb);
    pdf.circle(CX, CY, PHOTO_R, "F");
    const ini = (user.fullName || "")
      .split(" ").filter(Boolean)
      .map(n => n[0].toUpperCase()).slice(0, 2).join("");
    pdf.setFont(font, "bold");
    pdf.setFontSize(ini.length > 1 ? 16 : 20);
    pdf.setTextColor(255, 255, 255);
    pdf.text(ini || "?", CX, CY + 5.5, { align: "center" });
  }

  sy = CY + PHOTO_R + 7;

  // ── Name
  pdf.setFont(font, "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(...sideTextLight);
  const nameLines = pdf.splitTextToSize(user.fullName || "", SB - 10);
  nameLines.forEach((l: string, i: number) => {
    pdf.text(l, CX, sy + i * 5.8, { align: "center" });
  });
  sy += nameLines.length * 5.8 + 2;

  // ── Profession
  pdf.setFont(font, "normal");
  pdf.setFontSize(8.5);
  pdf.setTextColor(ar, ag, ab);
  const profLines = pdf.splitTextToSize(user.profession || "Developer", SB - 10);
  profLines.forEach((l: string, i: number) => {
    pdf.text(l, CX, sy + i * 4.5, { align: "center" });
  });
  sy += profLines.length * 4.5 + 5;

  // ── Thin divider under name block
  pdf.setDrawColor(ar, ag, ab);
  pdf.setGState(pdf.GState({ opacity: 0.35 }));
  pdf.setLineWidth(0.4);
  pdf.line(12, sy, SB - 12, sy);
  pdf.setGState(pdf.GState({ opacity: 1 }));
  sy += 6;

  // ── Sidebar section helper
  const sideSection = (title: string) => {
    pdf.setFont(font, "bold");
    pdf.setFontSize(6.8);
    pdf.setTextColor(ar, ag, ab);
    pdf.text(title, 8, sy);
    sy += 2;
    pdf.setFillColor(ar, ag, ab);
    pdf.setGState(pdf.GState({ opacity: 0.5 }));
    pdf.rect(8, sy, SB - 16, 0.5, "F");
    pdf.setGState(pdf.GState({ opacity: 1 }));
    sy += 5;
    pdf.setFont(font, "normal");
    pdf.setFontSize(7.5);
    pdf.setTextColor(...sideTextLight);
  };

  // mini icon-like bullet dot
  const sideDot = (yy: number) => {
    pdf.setFillColor(ar, ag, ab);
    pdf.circle(10, yy - 1.2, 1, "F");
  };

  const sideText = (text: string, maxW = SB - 22) => {
    if (!text?.trim()) return;
    sideDot(sy);
    const ls = pdf.splitTextToSize(text, maxW);
    pdf.setFont(font, "normal");
    pdf.setFontSize(7.5);
    pdf.setTextColor(...sideTextLight);
    ls.forEach((l: string, i: number) => {
      pdf.text(l, 14, sy + i * 4);
    });
    sy += ls.length * 4 + 2.5;
  };

  // ── CONTACT
  sideSection("CONTACT");
  const cleanUrl = (u: string) => u.replace(/^https?:\/\/(www\.)?/, "").split("/")[0];
  if (user.email)     sideText(user.email);
  if (cv.phone)       sideText(cv.phone);
  if (user.location)  sideText(user.location);
  if (user.github)    sideText(cleanUrl(user.github));
  if (user.linkedin)  sideText(cleanUrl(user.linkedin));
  sy += 4;

  // ── SKILLS
  if ((user.skills || []).length > 0) {
    sideSection("SKILLS");
    const displaySkills = user.skills.slice(0, 16);
    displaySkills.forEach((sk, i) => {
      if (sy > PH - 55) return;
      // Skill name
      pdf.setFont(font, "normal");
      pdf.setFontSize(7.5);
      pdf.setTextColor(...sideTextLight);
      pdf.text(sk, 8, sy);
      // Progress bar background
      const barY = sy + 1.2;
      const barW = SB - 18;
      pdf.setFillColor(...sideTextMid);
      pdf.setGState(pdf.GState({ opacity: 0.3 }));
      pdf.roundedRect(8, barY, barW, 2, 1, 1, "F");
      pdf.setGState(pdf.GState({ opacity: 1 }));
      // Fill (deterministic but varied based on index)
      const fillPct = 0.65 + ((i * 7 + 13) % 30) / 100;
      pdf.setFillColor(ar, ag, ab);
      pdf.roundedRect(8, barY, barW * fillPct, 2, 1, 1, "F");
      sy += 7;
    });
    sy += 3;
  }

  // ── LANGUAGES
  if (cv.languages?.trim() && sy < PH - 35) {
    sideSection("LANGUAGES");
    cv.languages.split(",").map(l => l.trim()).filter(Boolean).slice(0, 6).forEach(lang => {
      if (sy > PH - 20) return;
      sideText(lang);
    });
  }

  // ─────────────────────────────────────────────────────────────
  // MAIN CONTENT HEADER (Name band at top of main area)
  // ─────────────────────────────────────────────────────────────
  // Accent header bar at very top of main column
  pdf.setFillColor(ar, ag, ab);
  pdf.setGState(pdf.GState({ opacity: 0.08 }));
  pdf.rect(SB, 0, PW - SB, 3, "F");
  pdf.setGState(pdf.GState({ opacity: 1 }));

  // Name + profession in header area of main column
  const headerY = 12;
  pdf.setFont(font, "bold");
  pdf.setFontSize(20);
  pdf.setTextColor(22, 22, 35);
  pdf.text(user.fullName || "Your Name", MX, headerY);

  pdf.setFont(font, "bold");
  pdf.setFontSize(10.5);
  pdf.setTextColor(ar, ag, ab);
  pdf.text(user.profession || "Developer", MX, headerY + 6);

  // Thin accent underline below name
  pdf.setFillColor(ar, ag, ab);
  pdf.rect(MX, headerY + 9.5, MW, 0.6, "F");

  y = headerY + 14;

  // ─────────────────────────────────────────────────────────────
  // MAIN SECTION RENDERER
  // ─────────────────────────────────────────────────────────────
  const LINE_H        = 5.0; // tighter line height
  const SECTION_GAP   = 8.5;  // significantly tighter space between sections
  const ITEM_GAP      = 5.5;  // tighter space between items
  const INNER_GAP     = 2.2;  // tighter internal item gap

  const renderSectionTitle = (title: string) => {
    pdf.setFont(font, "bold");
    pdf.setFontSize(8.5);
    pdf.setTextColor(ar, ag, ab);
    pdf.text(title, MX, y);
    y += 2.2;
    // Accent full-width line
    pdf.setFillColor(ar, ag, ab);
    pdf.rect(MX, y, MW, 0.6, "F");
    // Light accent background strip behind title
    pdf.setFillColor(...accentLight);
    pdf.setGState(pdf.GState({ opacity: 0.4 }));
    pdf.rect(MX, y - 4.5, MW, 5.5, "F");
    pdf.setGState(pdf.GState({ opacity: 1 }));
    y += 5.5;
  };

  const renderDivider = () => {
    pdf.setDrawColor(225, 225, 235);
    pdf.setLineWidth(0.2);
    pdf.line(MX, y, MX + MW, y);
  };

  // ── SUMMARY
  if (cv.summary.trim()) {
    const lines = pdf.splitTextToSize(cv.summary, MW);
    ensureSpace(15 + lines.length * LINE_H);
    renderSectionTitle("SUMMARY");
    pdf.setFont(font, "normal");
    pdf.setFontSize(8.8);
    pdf.setTextColor(60, 60, 78);
    pdf.text(lines, MX, y);
    y += lines.length * LINE_H + SECTION_GAP;
  }

  // ── WORK EXPERIENCE
  const exps = cv.experience.filter(e => e.role || e.company);
  if (exps.length > 0) {
    ensureSpace(20);
    renderSectionTitle("WORK EXPERIENCE");

    exps.forEach((exp, idx) => {
      // Estimate entry height
      let entryH = 18;
      let descLines: string[] = [];
      if (exp.desc) {
        descLines = pdf.splitTextToSize(exp.desc, MW - 2);
        entryH += descLines.length * LINE_H;
      }
      ensureSpace(entryH);

      // Role title
      pdf.setFont(font, "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(18, 18, 32);
      pdf.text(exp.role || "—", MX, y);

      // Period (right-aligned)
      if (exp.period) {
        pdf.setFont(font, "italic");
        pdf.setFontSize(7.8);
        pdf.setTextColor(140, 140, 160);
        pdf.text(exp.period, MX + MW, y, { align: "right" });
      }
      y += INNER_GAP + 1;

      // Company — small badge-like label
      if (exp.company) {
        pdf.setFont(font, "bold");
        pdf.setFontSize(8.5);
        pdf.setTextColor(ar, ag, ab);
        pdf.text(exp.company, MX, y);
        y += INNER_GAP;
      }

      // Description with bullet dots
      if (descLines.length > 0) {
        pdf.setFont(font, "normal");
        pdf.setFontSize(8.2);
        pdf.setTextColor(65, 65, 82);
        descLines.forEach((l: string) => {
          if (l.startsWith("•") || l.startsWith("-")) {
            pdf.text(l, MX + 2, y);
          } else {
            pdf.text(l, MX + 2, y);
          }
          y += LINE_H;
        });
      }

      if (idx < exps.length - 1) {
        y += 4;
        renderDivider();
        y += ITEM_GAP - 2;
      }
    });
    y += SECTION_GAP;
  }

  // ── PROJECTS
  const projs = portfolio.slice(0, 6);
  if (projs.length > 0) {
    ensureSpace(20);
    renderSectionTitle("PROJECTS");

    projs.forEach((item, idx) => {
      let entryH = 14;
      let descLines: string[] = [];
      if (item.description) {
        descLines = pdf.splitTextToSize(item.description, MW - 2);
        entryH += descLines.length * LINE_H + 5;
      }
      ensureSpace(entryH);

      // Title
      pdf.setFont(font, "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(18, 18, 32);
      pdf.text(item.title, MX, y);
      y += INNER_GAP + 1;

      // Tags as inline badges
      if (item.tags?.length) {
        const tagStr = item.tags.slice(0, 6).join("  ·  ");
        pdf.setFont(font, "italic");
        pdf.setFontSize(7.5);
        pdf.setTextColor(ar, ag, ab);
        pdf.text(tagStr, MX, y);
        y += INNER_GAP;
      }

      // Description
      if (descLines.length > 0) {
        pdf.setFont(font, "normal");
        pdf.setFontSize(8.2);
        pdf.setTextColor(65, 65, 82);
        pdf.text(descLines, MX + 2, y);
        y += descLines.length * LINE_H;
      }

      if (idx < projs.length - 1) {
        y += 4;
        renderDivider();
        y += ITEM_GAP - 2;
      }
    });
    y += SECTION_GAP;
  }

  // ── EDUCATION
  const edus = cv.education.filter(e => e.school || e.degree);
  if (edus.length > 0) {
    ensureSpace(20);
    renderSectionTitle("EDUCATION");

    edus.forEach((edu, idx) => {
      ensureSpace(18);

      pdf.setFont(font, "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(18, 18, 32);
      pdf.text(edu.degree || "—", MX, y);

      if (edu.year) {
        pdf.setFont(font, "italic");
        pdf.setFontSize(7.8);
        pdf.setTextColor(140, 140, 160);
        pdf.text(edu.year, MX + MW, y, { align: "right" });
      }
      y += INNER_GAP + 1;

      if (edu.school) {
        pdf.setFont(font, "normal");
        pdf.setFontSize(8.8);
        pdf.setTextColor(ar, ag, ab);
        pdf.text(edu.school, MX, y);
        y += 5;
      }

      if (idx < edus.length - 1) {
        y += 3;
        renderDivider();
        y += ITEM_GAP - 2;
      }
    });
    y += SECTION_GAP;
  }

  // ─────────────────────────────────────────────────────────────
  // FOOTERS FOR ALL PAGES
  // ─────────────────────────────────────────────────────────────
  const totalPages = (pdf as unknown as { internal: { getNumberOfPages(): number } }).internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    pdf.setPage(p);
    drawFooter(p);
  }

  // ── Save
  pdf.save(`${(user.fullName || "CV").replace(/\s+/g, "_")}_CV.pdf`);
}

// ─────────────────────────────────────────────────────────────
// ATS-FRIENDLY MODE (separate, plain text layout)
// ─────────────────────────────────────────────────────────────
async function generateAts(
  user: UserData,
  portfolio: PortfolioItem[],
  cv: CVData,
  palette: CVPalette,
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const PW = 210, PH = 297;
  const MX = 18, MW = PW - 36;
  const [ar, ag, ab] = h2r(palette.accent);
  const font = "times";
  let y = 20;
  const LINE_H = 5.8;
  const FOOTER_H = 10;

  const checkBreak = (need: number) => {
    if (y + need > PH - FOOTER_H - 5) {
      pdf.addPage();
      y = 20;
    }
  };

  const sectionTitle = (title: string) => {
    checkBreak(12);
    pdf.setFont(font, "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);
    pdf.text(title, MX, y);
    y += 2;
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.4);
    pdf.line(MX, y, MX + MW, y);
    y += 6;
    pdf.setFont(font, "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(40, 40, 40);
  };

  // Header
  pdf.setFont(font, "bold");
  pdf.setFontSize(18);
  pdf.setTextColor(0, 0, 0);
  pdf.text(user.fullName || "", PW / 2, y, { align: "center" });
  y += 7;

  pdf.setFont(font, "normal");
  pdf.setFontSize(11);
  pdf.setTextColor(ar, ag, ab);
  pdf.text(user.profession || "", PW / 2, y, { align: "center" });
  y += 6;

  // Contact line
  const cleanUrl = (u: string) => u.replace(/^https?:\/\/(www\.)?/, "").split("/")[0];
  const contactParts: string[] = [];
  if (user.email)     contactParts.push(user.email);
  if (cv.phone)       contactParts.push(cv.phone);
  if (user.location)  contactParts.push(user.location);
  if (user.linkedin)  contactParts.push(cleanUrl(user.linkedin));
  if (user.github)    contactParts.push(cleanUrl(user.github));
  pdf.setFontSize(9);
  pdf.setTextColor(60, 60, 60);
  pdf.text(contactParts.join("  |  "), PW / 2, y, { align: "center" });
  y += 10;

  // Summary
  if (cv.summary.trim()) {
    sectionTitle("SUMMARY");
    const lines = pdf.splitTextToSize(cv.summary, MW);
    checkBreak(lines.length * LINE_H);
    pdf.text(lines, MX, y);
    y += lines.length * LINE_H + 8;
  }

  // Experience
  const exps = cv.experience.filter(e => e.role || e.company);
  if (exps.length > 0) {
    sectionTitle("WORK EXPERIENCE");
    exps.forEach(exp => {
      const descLines = exp.desc ? pdf.splitTextToSize(exp.desc, MW - 4) : [];
      checkBreak(16 + descLines.length * LINE_H);
      pdf.setFont(font, "bold");
      pdf.setFontSize(10.5);
      pdf.setTextColor(0, 0, 0);
      pdf.text(exp.role || "—", MX, y);
      if (exp.period) {
        pdf.setFont(font, "italic");
        pdf.setFontSize(9);
        pdf.setTextColor(80, 80, 80);
        pdf.text(exp.period, MX + MW, y, { align: "right" });
      }
      y += 5;
      if (exp.company) {
        pdf.setFont(font, "italic");
        pdf.setFontSize(9.5);
        pdf.setTextColor(60, 60, 60);
        pdf.text(exp.company, MX, y);
        y += 5;
      }
      if (descLines.length > 0) {
        pdf.setFont(font, "normal");
        pdf.setFontSize(9.5);
        pdf.setTextColor(40, 40, 40);
        pdf.text(descLines, MX + 4, y);
        y += descLines.length * LINE_H;
      }
      y += 6;
    });
  }

  // Projects
  const projs = portfolio.slice(0, 5);
  if (projs.length > 0) {
    sectionTitle("PROJECTS");
    projs.forEach(item => {
      const descLines = item.description ? pdf.splitTextToSize(item.description, MW - 4) : [];
      checkBreak(14 + descLines.length * LINE_H);
      pdf.setFont(font, "bold");
      pdf.setFontSize(10.5);
      pdf.setTextColor(0, 0, 0);
      pdf.text(item.title, MX, y);
      y += 5;
      if (item.tags?.length) {
        pdf.setFont(font, "italic");
        pdf.setFontSize(9);
        pdf.setTextColor(80, 80, 80);
        pdf.text(item.tags.slice(0, 6).join(", "), MX, y);
        y += 5;
      }
      if (descLines.length > 0) {
        pdf.setFont(font, "normal");
        pdf.setFontSize(9.5);
        pdf.setTextColor(40, 40, 40);
        pdf.text(descLines, MX + 4, y);
        y += descLines.length * LINE_H;
      }
      y += 5;
    });
  }

  // Education
  const edus = cv.education.filter(e => e.school || e.degree);
  if (edus.length > 0) {
    sectionTitle("EDUCATION");
    edus.forEach(edu => {
      checkBreak(16);
      pdf.setFont(font, "bold");
      pdf.setFontSize(10.5);
      pdf.setTextColor(0, 0, 0);
      pdf.text(edu.degree || "—", MX, y);
      if (edu.year) {
        pdf.setFont(font, "italic");
        pdf.setFontSize(9);
        pdf.setTextColor(80, 80, 80);
        pdf.text(edu.year, MX + MW, y, { align: "right" });
      }
      y += 5;
      if (edu.school) {
        pdf.setFont(font, "normal");
        pdf.setFontSize(10);
        pdf.setTextColor(60, 60, 60);
        pdf.text(edu.school, MX, y);
        y += 5;
      }
      y += 4;
    });
  }

  // Skills
  if ((user.skills || []).length > 0) {
    sectionTitle("SKILLS");
    pdf.setFont(font, "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(40, 40, 40);
    const skillText = user.skills.join("  ·  ");
    const skillLines = pdf.splitTextToSize(skillText, MW);
    checkBreak(skillLines.length * LINE_H);
    pdf.text(skillLines, MX, y);
    y += skillLines.length * LINE_H + 6;
  }

  // Languages
  if (cv.languages?.trim()) {
    sectionTitle("LANGUAGES");
    pdf.setFont(font, "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(40, 40, 40);
    pdf.text(cv.languages, MX, y);
  }

  // Footer
  const totalPages = (pdf as unknown as { internal: { getNumberOfPages(): number } }).internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    pdf.setPage(p);
    pdf.setFont(font, "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(160, 160, 160);
    pdf.text(`${user.fullName || "CV"}  ·  ATS Format  ·  DevHub.uz  ·  Page ${p}/${totalPages}`, PW / 2, PH - 7, { align: "center" });
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.2);
    pdf.line(MX, PH - FOOTER_H, MX + MW, PH - FOOTER_H);
  }

  pdf.save(`${(user.fullName || "CV").replace(/\s+/g, "_")}_ATS_CV.pdf`);
}
