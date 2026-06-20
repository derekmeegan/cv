import type { ComponentType, SVGProps } from "react";

export type ISODateString = `${number}-${number}-${number}`;
export type DateRangeEnd = ISODateString | null;

export interface Profile {
  name: string;
  initials: string;
  location: string;
  locationLink: string;
  about: string;
  summary: string;
  avatarUrl: string;
  personalWebsiteUrl: string;
}

export interface SocialLink {
  name: string;
  url: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

export interface Contact {
  social: SocialLink[];
  email: string;
  tel: string;
}

export interface Education {
  school: string;
  degree: string;
  major: string;
  minor: string;
  gpa: string;
  honors: string;
  start: ISODateString;
  end: ISODateString;
}

export interface RolePosition {
  title: string;
  start: ISODateString;
  end: DateRangeEnd;
  duration?: string;
  description?: string | string[];
}

export interface WorkExperience {
  company: string;
  link: string;
  badges: string[];
  positions: RolePosition[];
}

export interface ProjectLink {
  label: string;
  href: string;
}

export interface Project {
  title: string;
  techStack: string[];
  description: string;
  link?: ProjectLink;
}

export interface Student {
  name: string;
  alt: string;
  start: ISODateString;
  end: DateRangeEnd;
  achievements: string[];
  divisions: string[];
  image: string;
}
