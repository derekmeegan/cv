import {
  GitHubIcon,
  LinkedInIcon,
  XIcon,
} from "@/components/icons";

export const RESUME_DATA = {
  name: "Derek Meegan",
  initials: "DJM",
  location: "San Francisco, CA",
  locationLink: "https://www.google.com/maps/place/USA",
  about: "Customer Engineer Lead at Browserbase",
  summary:
    "I like to build apps, automate boring stuff, and solve interesting problems. I am a martial artist of 19 years. I like to read, periodically write articles, and enjoy the natural and human-made beauty of Earth. I like working in mutlidisciplinary roles and self-describe as a generalist. I currently work at Browserbase as a Customer Engineer Lead.",
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
      name: "Six Sigma Green Belt",
      content:
        "Covers Six Sigma principles, tools, and methodologies for process improvement and quality management.",
      year: "2025",
    },
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
    }
  ],
  work: [
    {
      company: "Browserbase",
      link: "https://www.browserbase.com",
      badges: [],
      title: "Customer Engineer Lead",
      start: "June 2024",
      end: "Current",
      description:
        "Designated Customer Engineer Lead within three months of joining, I defined and systematized our customer engineering motion—establishing operating verticals and cross-functional interfaces with sales and product. I lead development of internal tools including a browser performance benchmarking system, a customer account management application that enables faster session debugging and provides sales with easy and safe access to customer data, and an agentic support system that keeps our internal knowledge bank up to date, democratizing know-how learned from customer interactions and reducing time to support resolution. I personally handle enterprise accounts, working hands-on in customer infrastructure to ensure success and drive enterprise ARR. I have also directly contributed to our core product offerings, including Stagehand, our open source web automation framework, and Director, our agentic web automation tool.",
    },
    {
      company: "Grant Thornton",
      link: "https://www.grantthornton.com",
      badges: ["Remote"],
      title: "Data and Analytics Senior Associate",
      start: "June 2021",
      end: "June 2025",
      description:
        "I led the development of an in-house reporting platform for a global ride-share client, replacing a third-party vendor, saving over $1 million annually, and improving U.S. regulatory compliance. I managed and expanded a cross-functional data analytics team from 5 to 18 members, directly supervising 7, resulting in a 3x growth in project headcount and enhanced delivery of data-driven solutions. I developed and automated workflows by integrating third-party APIs, enhancing data quality, reducing audits and IRS fees, and saving over 200 person-hours annually. Additionally, I extended reporting workflows to meet new regulatory requirements, leading to $100,000 in quarterly savings, and oversaw the implementation of a Looker dashboard to improve customer inquiry management and operational efficiency.",
    },
    {
      company: "Uventex",
      link: "https://www.uventexlabs.com",
      badges: ["Remote"],
      title: "Marketing and Sales Engineer",
      start: "August 2019",
      end: "April 2020",
      description:
        "I worked directly under the CEO at a sports management and CRM company, where I assisted with social media content creation, facilitated sales, and conceptualized technical solutions by translating business requirements into user stories for development. I collaborated with clients and stakeholders to drive sales initiatives and managed client relationships, overseeing demos and onboarding processes to enhance customer satisfaction and drive adoption, ensuring smooth transitions and clear communication throughout.",
    },
  ],
  skills: [
    "Python",
    "Go",
    "JavaScript",
    "TypeScript",
    "SQL",
    "Solidity",
    "React",
    "NextJS",
    "Node.js",
    "Tailwind",
    "Pandas",
    "Playwright",
    "Supabase",
    "Spark",
    "Docker",
    "Serverless",
    "Vercel",
    "AWS",
    "GCP",
    "Azure",
    "Git",
    "CI/CD",
    "API Development",
    "Full Stack Engineering",
    "Web Automation",
    "Business Process Automation",
    "Data Analysis",
    "Data Visualization",
    "AI Engineering",
    "Agentic Workflows",
    "gRPC"
  ],
  projects: [
    {
      "title": "DigiGarden",
      "techStack": [
        "Next.js",
        "React",
        "TypeScript",
        "Tailwind CSS",
        "Radix UI",
        "Supabase"
      ],
      "description": "A digital garden where people plant virtual flowers carrying messages of kindness. Built for the Web Dev Challenge on CodeTV.",
      "link": {
        "label": "Visit Garden",
        "href": "" //"https://digigarden-pi.vercel.app/"
      }
    },
    {
      "title": "Uber Eats Wrapped",
      "techStack": [
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
      "description": "Let an AI agent analyze your Uber Eats order history and generate a personalized summary of your eating habits.",
      "link": {
        "label": "Try it out",
        "href": "https://ubereatswrappedfrontend.vercel.app/"
      }
    },
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
