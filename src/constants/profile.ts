import type { Profile } from "@/types/resume";

export const MARTIAL_ARTS_START_YEAR = 2006;

const martialArtsYears = new Date().getFullYear() - MARTIAL_ARTS_START_YEAR;

const aboutParagraphs = [
  "I like to build systems, solve interesting problems, and spend a lot of time thinking about how technology changes the way people work.",
  "I grew up in California, studied information systems and economics at Temple University, and began my career as a technology consultant at Grant Thornton.",
  "Currently, I am a software engineer at Browserbase and living in San Francisco.",
];

const descriptors = [
  "I am a martial artist of " + martialArtsYears + " years",
  "I am a brother",
  "I am a son",
  "I like to read",
  "I like to rock climb",
  "I kickbox",
  "I am a multiple-time karate champion",
  "I ask a lot of questions",
  "I am persistent",
  "I am competitive",
  "I like to play chess",
  "I am a pickleball demon",
  "I practice yoga",
  "I like to cook, but I can't grill",
  "I am a designer",
  "I am an artist",
  "I enjoy the sunset",
  "I love my girlfriend <3",
  "I am a nephew",
  "I am an uncle (in a second-cousin way)",
  "I lived in Philadelphia for 7 years",
];

export const PROFILE: Profile = {
  name: "Derek Meegan",
  initials: "DJM",
  location: "San Francisco, CA",
  locationLink: "https://www.google.com/maps/place/USA",
  about: "Software Engineer",
  summary: aboutParagraphs.join(" "),
  aboutParagraphs,
  descriptors,
  avatarUrl: "/images/derek-meegan.jpg",
  personalWebsiteUrl: "https://derekmeegan.com",
};
