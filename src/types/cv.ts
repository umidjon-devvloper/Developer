// src/types/cv.ts

export interface CVData {
  phone: string;
  summary: string;
  languages: string;
  templateId?: string;
  sectionOrder?: string[];
  experience: {
    role: string;
    company: string;
    period: string;
    desc: string;
  }[];
  education: {
    school: string;
    degree: string;
    year: string;
  }[];
}

export interface CVPalette {
  id: string;
  name: string;
  sidebar: string;
  accent: string;
}

export interface CVTemplate {
  id: string;
  name: string;
}
