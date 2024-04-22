import {
  AmbitLogo,
  BarepapersLogo,
  BimLogo,
  CDGOLogo,
  ClevertechLogo,
  ConsultlyLogo,
  EvercastLogo,
  Howdy,
  JarockiMeLogo,
  JojoMobileLogo,
  Minimal,
  MobileVikingsLogo,
  MonitoLogo,
  NSNLogo,
  ParabolLogo,
  TastyCloudLogo,
  YearProgressLogo,
} from "@/images/logos";
import {
  GitHubIcon,
  LinkedInIcon,
  XIcon,
  InstagramIcon,
} from "@/components/icons";

export const RESUME_DATA = {
  name: "Derek Meegan",
  initials: "DJM",
  location: "Philadelphia, PA, USA",
  locationLink: "https://www.google.com/maps/place/Philadelphia,+PA/",
  about:
    "Data and Analytics Senior Associate at Grant Thornton Co-Head Coach of the Amerikick National Team",
  summary:
    "I'm an experienced data, analytics, and cloud engineering professional at Grant Thornton, with a Bachelor's in Management Information Systems and Economics from Temple University, and a certificate in Political Science. I specialize in data engineering and cloud solutions, continually seeking to advance my expertise. Additionally, I'm a private martial arts instructor who has trained numerous champions in the North American Sport Karate Association Circuit.",
  avatarUrl: "https://avatars.githubusercontent.com/derekmeegan",
  personalWebsiteUrl: "https://derekmeegan.com",
  contact: {
    email: "derekmeegan@gmail.com",
    tel: "+16615930925",
    social: [
      {
        name: "GitHub",
        url: "https://github.com/derekmeegan",
        icon: GitHubIcon,
      },
      {
        name: "LinkedIn",
        url: "https://www.linkedin.com/in/derekmeegan/",
        icon: LinkedInIcon,
      },
      {
        name: "Instagram",
        url: "https://www.instagram.com/derekmeegan/",
        icon: InstagramIcon,
      },
    ],
  },
  education: [
    {
      school: "Temple University",
      degree:
        "Bachelor's of Business Administration | Majors:  Economics and Management Information Systems | Minor: Political Science",
      start: "2018",
      end: "2022",
    },
  ],
  work: [
    {
      company: "Grant Thornton",
      link: "https://parabol.co",
      badges: ["Remote"],
      title: "Digital Consulting Intern → Data and Analytics Senior Associate",
      logo: ParabolLogo,
      start: "June 2021",
      end: "Current",
      description:
        "I currently lead the development of a proprietary reporting system for managing earnings data for millions of drivers and merchants at Uber. Previously, I assisted in developing business intelligence applications to provide tailored solutions to internal stakeholders and clients. Additionally, I lead presentations on advanced technologies like machine learning and APIs, engaging a variety of audiences across the organization.",
    },
    {
      company: "Uventex",
      link: "https://clevertech.biz",
      badges: ["Remote"],
      title: "Marketing and Sales Engineer",
      logo: ClevertechLogo,
      start: "August 2019",
      end: "April 2020",
      description:
        "I worked directly under the CEO at a sports management and CRM company, where I assisted with social media content, facilitated sales, and conceptualized technical solutions. I collaborated with clients and stakeholders to translate business requirements into user stories for development. Additionally, I managed client relationships through demos and onboarding processes, ensuring a smooth transition and clear communication at all stages.",
    },
  ],
  skills: [
    "JavaScript",
    "Python",
    "Presto SQL",
    "T-SQL",
    "Spark",
    "Pandas",
    "Data Visualization (Plotly)",
    "Business Process Automation",
    "GCP",
    "Azure",
    "git",
    "HTML5",
    "CSS3",
    "React",
  ],
  projects: [
    {
      title: "Folio",
      techStack: [
        "Side Project",
        "TypeScript",
        "Next.js",
        "SQL",
        "Pandas",
        "Plaid API",
      ],
      description: "Sharing my networth and financial decisions",
      link: {
        label: "",
        href: "",
        // label: "folio-social.com",
        // href: "https://folio-social.com/",
      },
    },
    {
      title: "Co-Coach",
      techStack: [
        "Side Project",
        "Serverless",
        "Twilio",
        "Google Sheets",
        "Regex",
      ],
      description:
        "Easily consolidate martial arts team competition schedule through SMS",
      link: {
        label: "",
        href: "",
        // label: "monito.dev",
        // href: "https://monito.dev/",
      },
    },
    {
      title: "uTax",
      techStack: ["Work Project", "T-SQL", "GCP", "Python", "Pandas", "React"],
      description:
        "Store, analyze, and report earnings information for earners on Uber Platform",
      link: {
        label: "",
        href: "",
      },
    },
    {
      title: "Employee Preference Optimization",
      techStack: ["Work Project", "T-SQL", "Azure", "Python", "Dash"],
      description:
        "Optimize employee benefit packages to minimize costs and maximize employee satisfaction",
      link: {
        label: "",
        href: "",
      },
    },
    {
      title: "Initiative Prioritization Application",
      techStack: [
        "Work Project",
        "T-SQL",
        "Azure",
        "Python",
        "Dash",
        "SmartSheet",
      ],
      description:
        "Inform steering comittee on ongoing firm initiatives, utilizing SmartSheet backend via API connection",
      link: {
        label: "",
        href: "",
      },
    },
    // {
    //   title: "Jarocki.me",
    //   techStack: ["Side Project", "Next.js", "MDX"],
    //   description:
    //     "My personal website and blog. Built with Next.js and Notion API",
    //   logo: JarockiMeLogo,
    //   link: {
    //     label: "github.com",
    //     href: "https://jarocki.me/",
    //   },
    // },
    // {
    //   title: "Minimal",
    //   techStack: ["Side Project", "Next.js", "Puppeteer"],
    //   description:
    //     "Minimalist calendars, habit trackers and planners generator",
    //   logo: Minimal,
    //   link: {
    //     label: "useminimal.com",
    //     href: "https://useminimal.com/",
    //   },
    // },
    // {
    //   title: "Barepapers",
    //   techStack: ["Side Project", "Next.js", "Puppeteer"],
    //   description:
    //     "Generates beautiful wallpapers using random shapes and gradients",
    //   logo: BarepapersLogo,
    //   link: {
    //     label: "barepapers.com",
    //     href: "https://barepapers.com/",
    //   },
    // },
    // {
    //   title: "Year progress",
    //   techStack: ["Side Project", "TypeScript", "Next.js"],
    //   description: "Tracks current year progress and displays a countdown",
    //   logo: YearProgressLogo,
    //   link: {
    //     label: "getyearprogress.com",
    //     href: "https://getyearprogress.com/",
    //   },
    // },
  ],
  students: [
    {
      name: "Matthew Shamet",
      alt: "MS",
      nickname: "Shamu, Shamgod",
      start: "2018",
      end: "2022",
      achievements: [
        "14-17 Overall Weapons Grand Champion - Amerikick International 2021",
        "NASKA Grand Champion",
      ],
    },
  ],
} as const;
