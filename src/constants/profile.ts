import type { Profile } from "@/types/resume";

export const MARTIAL_ARTS_START_YEAR = 2006;

const martialArtsYears = new Date().getFullYear() - MARTIAL_ARTS_START_YEAR;

export const PROFILE: Profile = {
  name: "Derek Meegan",
  initials: "DJM",
  location: "San Francisco, CA",
  locationLink: "https://www.google.com/maps/place/USA",
  about: "Software Engineer",
  summary: `I like to build apps, automate boring stuff, and solve interesting problems. I am a martial artist of ${martialArtsYears} years. I like to read, periodically write articles, and enjoy the natural and human-made beauty of Earth. I like working in mutlidisciplinary roles and self-describe as a generalist. I currently work at Browserbase as a Software Engineer.`,
  avatarUrl: "/images/derek-meegan.jpg",
  personalWebsiteUrl: "https://derekmeegan.com",
};
