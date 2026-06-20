import type { WorkExperience } from "@/types/resume";

export const ROLES: WorkExperience[] = [
  {
    company: "Browserbase",
    link: "https://www.browserbase.com",
    badges: [],
    positions: [
      {
        title: "Software Engineer",
        start: "2026-05-01",
        end: null,
        description:
          "I maintain and expand Browserbase's internal agent platform and cloud development environment, building tooling that helps the engineering and GTM teams ship and serve our customers faster.",
      },
      {
        title: "Customer Engineer",
        start: "2025-06-01",
        end: "2026-04-01",
        duration: "11 mos",
        description:
          "I helped define Browserbase's customer engineering motion and built internal tools for benchmarking, account debugging, and support knowledge capture. I worked directly with enterprise customers in their infrastructure, translated recurring needs back into product work, and contributed to Stagehand and Director.",
      },
    ],
  },
  {
    company: "Grant Thornton",
    link: "https://www.grantthornton.com",
    badges: [],
    positions: [
      {
        title: "Senior Associate",
        start: "2022-08-01",
        end: "2025-06-01",
        duration: "2 yrs 11 mos",
        description:
          "I led delivery for an in-house reporting platform used by a global ride-share client, replacing a vendor system and saving over $1M annually. The platform supported $50B+ in payment reporting across 2M+ tax forms, while my team grew from 5 to 18 people and improved automation, compliance, and stakeholder visibility.",
      },
      {
        title: "Intern",
        start: "2021-06-01",
        end: "2022-05-01",
        duration: "11 mos",
        description:
          "I built dashboard interfaces and data workflows for custom business intelligence applications, then supported tax digital consulting work across transformation, automation, modeling, and visualization. I used Flask, Plotly Dash, Pandas, Python, Azure, Power Automate, Alteryx, Git, and Azure DevOps.",
      },
    ],
  },
  {
    company: "Uventex Labs",
    link: "https://www.uventexlabs.com",
    badges: [],
    positions: [
      {
        title: "Intern",
        start: "2019-08-01",
        end: "2020-04-01",
        duration: "9 mos",
        description:
          "I worked with the CEO of a sports management and CRM company on sales, marketing, client demos, onboarding, and QA. I translated customer needs into product requirements, helped shape website and social content, and supported client relationships from first demo through adoption.",
      },
    ],
  },
];
