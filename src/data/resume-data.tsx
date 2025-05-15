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
  location: "Los Angeles, CA | Philadelphia, PA",
  locationLink: "https://www.google.com/maps/place/USA",
  about: "Data and Analytics Senior Associate at Grant Thornton",
  summary:
    "At my core, I am a builder. At Grant Thornton, I architect innovative systems that enhance operational efficiency, leading initiatives to achieve significant project growth and cost savings. My drive for innovation extends beyond my corporate role; I build a lot outside of work, primarily focusing on web scraping, serverless automation tools, and more recently, AI agents. My commitment to community and mentorship is vital to me. I am proud to co-organize Code and Coffee Philadelphia, a thriving developer collective, and to serve as a co-coach for the Amerikick National Team, guiding martial arts athletes to championship success in the North American Sport Karate Association Circuit.",
  avatarUrl: "https://avatars.githubusercontent.com/derekmeegan",
  personalWebsiteUrl: "https://derekmeegan.com",
  contact: {
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
        name: "X",
        url: "https://x.com/derekmeegan",
        icon: XIcon,
      }
    ],
    email: "derekmeegan@gmail.com",
    tel: "+16615930925",
  },
  education: [
    {
      school: "Temple University",
      degree:
        "Bachelor's of Business Administration",
      major: "Economics and Management Information Systems",
      minor: "Political Science",
      gpa: "3.92",
      honors: "Summa cum laude",
      start: "2018",
      end: "2022",
    },
  ],
  certifications: [
    {
      name: "Google Cloud Foundational Certification",
      content:
        "Covers Google Cloud services, infrastructure, and solutions for building and deploying applications on GCP.",
      year: "2024",
    },
    {
      name: "Version Control with Git",
      content:
        "Covers fundamentals of Git for version control, including branching, merging, and collaborative workflows.",
      year: "2024",
    },
    {
      name: "Azure Data Fundamentals",
      content:
        "Introduces core data concepts and services within Microsoft Azure, including relational and non-relational databases, and big data solutions.",
      year: "2023",
    },
    {
      name: "Alteryx Core",
      content:
        "Focuses on building workflows for data preparation, blending, and advanced analytics using Alteryx Designer.",
      year: "2021",
    },
  ],
  work: [
    {
      company: "Grant Thornton",
      link: "https://parabol.co",
      badges: ["Remote"],
      title: "Data and Analytics Senior Associate",
      logo: ParabolLogo,
      start: "June 2021",
      end: "Current",
      description:
        "I lead the development of an in-house reporting platform for a global ride-share client, replacing a third-party vendor, saving over $1 million annually, and improving U.S. regulatory compliance. I manage and expand a cross-functional data analytics team from 5 to 18 members, directly supervising 7, resulting in a 3x growth in project headcount and enhanced delivery of data-driven solutions. I develop and automate workflows by integrating third-party APIs, enhancing data quality, reducing audits and IRS fees, and saving over 200 person-hours annually. Additionally, I extend reporting workflows to meet new regulatory requirements, leading to $100,000 in quarterly savings, and oversee the implementation of a Looker dashboard to improve customer inquiry management and operational efficiency.",
    },
    {
      company: "Uventex",
      link: "https://www.uventexlabs.com/",
      badges: ["Remote"],
      title: "Marketing and Sales Engineer",
      logo: ClevertechLogo,
      start: "August 2019",
      end: "April 2020",
      description:
        "I worked directly under the CEO at a sports management and CRM company, where I assisted with social media content creation, facilitated sales, and conceptualized technical solutions by translating business requirements into user stories for development. I collaborated with clients and stakeholders to drive sales initiatives and managed client relationships, overseeing demos and onboarding processes to enhance customer satisfaction and drive adoption, ensuring smooth transitions and clear communication throughout.",
    },
  ],
  skills: [
    "AWS",
    "Azure",
    "Blockchain Development",
    "Business Process Automation",
    "CSS3",
    "CI/CD",
    "Data Analysis",
    "Data Visualization",
    "DeFi",
    "Docker",
    "GCP",
    "Git",
    "HTML5",
    "JavaScript",
    "NextJS",
    "Node.js",
    "Pandas",
    "Playwright",
    "Python",
    "React",
    "Serverless",
    "Solidity",
    "Spark",
    "Supabase",
    "SQL",
    "TailwindCSS",
    "TypeScript",
    "Vercel",
    "Vite",
    "Web Scraping"
  ],
  projects: [
    {
      "title": "Serverless Web Scraping",
      "techStack": [
        "Serverless",
        "AWS",
        "Web Scraping",
        "Browserbase",
        "Python",
        "Docker",
        "CI/CD"
      ],
      "description": "A template for deploying Playwright browser automation tasks on AWS Lambda, utilizing Browserbase for headless browser management. Includes an asynchronous API, job status tracking, and CI/CD with GHA.",
      "link": {
        "label": "View on GitHub",
        "href": "https://github.com/derekmeegan/browserbase-lambda-playwright"
      }
    },
    {
      "title": "Polymarket Watcher",
      "techStack": [
        "Serverless",
        "AWS",
        "Python",
        "Polymarket API",
        "Twitter API",
        "Data Analysis",
        "AWS CDK"
      ],
      "description": "A serverless application monitoring prediction markets for significant price changes and automatically tweeting alerts. Built on AWS, it features advanced signal analysis and confidence scoring.",
      "link": {
        "label": "X Account",
        "href": "https://x.com/pmarket_watcher"
      }
    },
    {
      "title": "Swoupon",
      "techStack": [
        "DeFi",
        "React",
        "Vite",
        "Node.js API",
        "Solidity",
        "Moralis SDK",
        "Hardhat",
        "TailwindCSS",
        "Vercel"
      ],
      "description": "A DeFi dApp for token swaps featuring the 'Swoupon' rewards system. Its backend utilizes a Node.js/Moralis API for data, while core tokenomics are driven by a Solidity/Hardhat smart contract library. Deployed on Vercel.",
      "link": {
        "label": "View dApp",
        "href": "https://swoopon.vercel.app/"
      }
    },
    {
      "title": "Mark Venaglia Portfolio",
      "techStack": [
        "React",
        "TypeScript",
        "Vite",
        "TailwindCSS",
        "Supabase",
        "PWA",
        "Vercel",
        "Cal.com",
        "Stripe"
      ],
      "description": "A personal portfolio website for artist Mark Venaglia, showcasing artwork and NYC tours. Features an admin dashboard for content management, all powered by Supabase and deployed on Vercel.",
      "link": {
        "label": "Visit Website",
        "href": "https://markvenaglia.com/"
      }
    },
    {
      title: "KeywordGenie",
      techStack: ["Side Project", "SEO", "NextJS", 'Serverless', 'OpenAI API', 'Google Keyword API'],
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
  ],
  students: [
    {
      name: "Alessandra Alinea",
      alt: "AA",
      start: "Sep 2018",
      end: "Aug 2023",
      achievements: [
        "Creative Challenge Champion, Amerikick Internationals 2022",
        "Overall Weapons Winner, Amerikick Internationals 2023",
        "NASKA World Champion",
      ],
      divisions: ["Traditional Weapons", "Traditional Forms", "CMX Weapons"],
      image: "images/aleegator.png",
    },
    {
      name: "Matthew Shamet",
      alt: "MS",
      start: "Feb 2019",
      end: "Mar 2022",
      achievements: [
        "Overall Weapons Winnder, Amerikick Internationals 2021",
        "NASKA Top 10 Competitor",
        "NASKA World Champion",
      ],
      divisions: ["Traditional Weapons", "Traditional Forms"],
      image: "images/shamet.png",
    },
    {
      name: "John Lorenz",
      alt: "JL",
      start: "Jan 2021",
      end: "",
      achievements: [
        "Team Captain, Amerikick National Team",
        "Overall Weapons Winnder, Ocean State Grand Nationals 2024",
        "Overall Weapons Winnder, Pan American Internationals 2024",
        "NASKA World Champion",
      ],
      divisions: ["CMX Weapons", "CMX Forms"],
      image: "images/JOHN.png",
    },
    {
      name: "Samantha Mitling",
      alt: "SM",
      start: "Jun 2022",
      end: "",
      achievements: [
        "Overall Weapons Grand Champion, Quebec Open 2023",
        "Overall Weapons Grand Champion, Pan American Internationals 2024",
        "NASKA World Champion",
      ],
      divisions: ["Traditional Weapons", "CMX Weapons"],
      image: "images/sam.png",
    },
    {
      name: "Derrick Barnes",
      alt: "DB",
      start: "Nov 2022",
      end: "Aug 2023",
      achievements: [
        "Creative Weapons Winner, Quebec Open 2023",
        "Mens Extreme Forms Winner, Amerikick Internationals 2023",
        "NASKA Top 10 Competitor",
      ],
      divisions: ["Traditional Weapons", "CMX Weapons"],
      image: "images/barnes.png",
    },
    {
      name: "Niko Torofias",
      alt: "NT",
      start: "Jan 2023",
      end: "Jan 2024",
      achievements: ["NASKA First Place Winner", "NASKA Top 10 Competitor"],
      divisions: ["Traditional Weapons", "CMX Weapons", "Point Fighting"],
      image: "images/niko.png",
    },
    {
      name: "Cate Esmond",
      alt: "CE",
      start: "Feb 2023",
      end: "",
      achievements: [
        "Multiple NASKA Regional Division Wins",
        "Multiple NASKA Regional Grand Championships ",
        "NASKA Top 10 Competitor",
      ],
      divisions: ["Traditional Weapons"],
      image: "images/cate.png",
    },
    {
      name: "Harold Lerner",
      alt: "HL",
      start: "May 2023",
      end: "",
      achievements: [
        "Overall Weapons Winnder, Ocean State Grand Nationals 2024",
        "Overall Weapons Winnder, Quebec Open 2024",
        "NASKA World Champion",
      ],
      divisions: ["Traditional Weapons", "CMX Weapons"],
      image: "images/h.png",
    },
    {
      name: "Erica Goldt",
      alt: "HL",
      start: "Aug 2023",
      end: "Jun 2024",
      achievements: ["ATA World Champion", "NASKA Top 10 Competitor"],
      divisions: ["Traditional Weapons", "Traditional Forms", "CMX Weapons"],
      image: "images/erica.png",
    },
    {
      name: "Wyatt Mak",
      alt: "WM",
      start: "Oct 2023",
      end: "",
      achievements: [
        "2 Time Grand Champion, NY Tournament",
        "NASKA Top 10 Competitor",
      ],
      divisions: ["CMX Weapons", "Point Fighting"],
      image: "images/wyatt.png",
    },
    {
      name: "Lola Granger",
      alt: "LG",
      start: "Jan 2024",
      end: "",
      achievements: [
        "Open Forms Grand Champion, NY Tournaments 2024",
        "NASKA Top 10 Competitor",
      ],
      divisions: ["CMX Weapons"],
      image: "images/lola.png",
    },
  ],
} as const;
