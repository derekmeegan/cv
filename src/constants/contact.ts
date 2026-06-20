import { GitHubIcon, LinkedInIcon, XIcon } from "@/components/icons";
import type { Contact } from "@/types/resume";

export const CONTACT: Contact = {
  social: [
    {
      name: "X",
      url: "https://x.com/derekmeegan",
      icon: XIcon,
    },
    {
      name: "LinkedIn",
      url: "https://www.linkedin.com/in/derekmeegan/",
      icon: LinkedInIcon,
    },
    {
      name: "GitHub",
      url: "https://github.com/derekmeegan",
      icon: GitHubIcon,
    },
  ],
  email: "derekmeegan@gmail.com",
  tel: "",
};
