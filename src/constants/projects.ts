import type { Project } from "@/types/resume";

export const PROJECTS_PER_PAGE = 4;

export const PROJECTS: Project[] = [
  {
    title: "DigiGarden",
    techStack: [
      "Next.js",
      "React",
      "TypeScript",
      "Tailwind CSS",
      "Radix UI",
      "Supabase",
    ],
    description:
      "A digital garden where people plant virtual flowers carrying messages of kindness. Built for the Web Dev Challenge on CodeTV.",
    link: {
      label: "Visit Garden",
      href: "https://www.youtube.com/watch?v=qYx8NX49OS8&t=1s",
    },
  },
  {
    title: "Uber Eats Wrapped",
    techStack: [
      "Serverless",
      "Vercel",
      "React",
      "Python",
      "Stagehand",
      "Docker",
      "Browserbase",
      "CI/CD",
      "AWS",
    ],
    description:
      "Let an AI agent analyze your Uber Eats order history and generate a personalized summary of your eating habits.",
    link: {
      label: "Try it out",
      href: "https://ubereatswrappedfrontend.vercel.app/",
    },
  },
  {
    title: "Serverless Web Scraping",
    techStack: [
      "Serverless",
      "AWS",
      "Web Scraping",
      "Browserbase",
      "Python",
      "Docker",
      "CI/CD",
    ],
    description:
      "A template for deploying Playwright browser automation tasks on AWS Lambda, utilizing Browserbase for headless browser management. Includes an asynchronous API, job status tracking, and CI/CD with GHA.",
    link: {
      label: "View on GitHub",
      href: "https://github.com/derekmeegan/browserbase-lambda-playwright",
    },
  },
  {
    title: "Polymarket Watcher",
    techStack: [
      "Serverless",
      "AWS",
      "Python",
      "Polymarket API",
      "Twitter API",
      "Data Analysis",
      "AWS CDK",
    ],
    description:
      "A serverless application monitoring prediction markets for significant price changes and automatically tweeting alerts. Built on AWS, it features advanced signal analysis and confidence scoring.",
    link: {
      label: "X Account",
      href: "https://x.com/pmarket_watcher",
    },
  },
  {
    title: "Swoupon",
    techStack: [
      "DeFi",
      "React",
      "Vite",
      "Node.js API",
      "Solidity",
      "Moralis SDK",
      "Hardhat",
      "TailwindCSS",
      "Vercel",
    ],
    description:
      "A DeFi dApp for token swaps featuring the 'Swoupon' rewards system. Its backend utilizes a Node.js/Moralis API for data, while core tokenomics are driven by a Solidity/Hardhat smart contract library. Deployed on Vercel.",
    link: {
      label: "View dApp",
      href: "https://swoopon.vercel.app/",
    },
  },
  {
    title: "Mark Venaglia Portfolio",
    techStack: [
      "React",
      "TypeScript",
      "Vite",
      "TailwindCSS",
      "Supabase",
      "PWA",
      "Vercel",
      "Cal.com",
      "Stripe",
    ],
    description:
      "A personal portfolio website for artist Mark Venaglia, showcasing artwork and NYC tours. Features an admin dashboard for content management, all powered by Supabase and deployed on Vercel.",
    link: {
      label: "Visit Website",
      href: "https://markvenaglia.com/",
    },
  },
  {
    title: "KeywordGenie",
    techStack: [
      "Side Project",
      "SEO",
      "NextJS",
      "Serverless",
      "OpenAI API",
      "Google Keyword API",
    ],
    description:
      "A micro-saas that uses AI and Google data to provide better keyword suggestions for SEO.",
    link: {
      label: "",
      href: "https://thekeywordgenie.com/",
    },
  },
  {
    title: "AmerikickGPT",
    techStack: [
      "Streamlit",
      "Python",
      "OpenAI API",
      "Google Places API",
      "Selenium",
      "GCP",
    ],
    description:
      "Chatbot for the Amerikick Internationals with functionality to query ruleset, local resturants, and event details with natural language.",
    link: {
      label: "",
      href: "",
    },
  },
];
