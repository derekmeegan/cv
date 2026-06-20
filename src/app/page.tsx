import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Section } from "@/components/ui/section";
import { GlobeIcon, MailIcon, PhoneIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Library } from "@/components/library";
import { TypingDescriptor } from "@/components/typing-descriptor";
import { CONTACT } from "@/constants/contact";
import { EDUCATION } from "@/constants/education";
import { PROFILE } from "@/constants/profile";
import { PROJECTS, PROJECTS_PER_PAGE } from "@/constants/projects";
import { ROLES } from "@/constants/roles";
import { formatDateRange, formatPositionDuration } from "@/lib/dates";
import { ProjectCard } from "@/components/project-card";

export default async function Page() {
  const projectGroups = Array.from(
    { length: Math.ceil(PROJECTS.length / PROJECTS_PER_PAGE) },
    (_, index) =>
      PROJECTS.slice(
        index * PROJECTS_PER_PAGE,
        index * PROJECTS_PER_PAGE + PROJECTS_PER_PAGE,
      ),
  );
  const leadingAboutParagraphs = PROFILE.aboutParagraphs.slice(0, -1);
  const closingAboutParagraph =
    PROFILE.aboutParagraphs[PROFILE.aboutParagraphs.length - 1];

  return (
    <>
      <div className="flex items-stretch justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-1.5">
          <h1 className="text-2xl font-semibold">{PROFILE.name}</h1>
          <p className="max-w-md text-pretty font-mono text-sm text-muted-foreground">
            {PROFILE.about}
          </p>
          <p className="max-w-md items-center text-pretty font-mono text-xs text-muted-foreground">
            <a
              className="inline-flex gap-x-1.5 align-baseline leading-none hover:underline"
              href={PROFILE.locationLink}
              target="_blank"
            >
              <GlobeIcon className="size-3" />
              {PROFILE.location}
            </a>
          </p>
          <div className="flex gap-x-1 pt-1 font-mono text-sm text-muted-foreground print:hidden">
            {CONTACT.social.map((social) => (
              <Button
                key={social.name}
                className="size-8"
                variant="outline"
                size="icon"
                asChild
              >
                <a href={social.url} aria-label={social.name}>
                  <social.icon className="size-4" />
                </a>
              </Button>
            ))}
            {CONTACT.email ? (
              <Button className="size-8" variant="outline" size="icon" asChild>
                <a href={`mailto:${CONTACT.email}`} aria-label="Email">
                  <MailIcon className="size-4" />
                </a>
              </Button>
            ) : null}
            {CONTACT.tel ? (
              <Button className="size-8" variant="outline" size="icon" asChild>
                <a href={`tel:${CONTACT.tel}`} aria-label="Phone">
                  <PhoneIcon className="size-4" />
                </a>
              </Button>
            ) : null}
          </div>
          <div className="hidden flex-col gap-x-1 font-mono text-sm text-muted-foreground print:flex">
            {CONTACT.email ? (
              <a href={`mailto:${CONTACT.email}`}>
                <span className="underline">{CONTACT.email}</span>
              </a>
            ) : null}
            {CONTACT.tel ? (
              <a href={`tel:${CONTACT.tel}`}>
                <span className="underline">{CONTACT.tel}</span>
              </a>
            ) : null}
          </div>
        </div>

        <Avatar className="h-auto min-h-32 w-32 self-stretch">
          <AvatarImage alt={PROFILE.name} src={PROFILE.avatarUrl} />
          <AvatarFallback>{PROFILE.initials}</AvatarFallback>
        </Avatar>
      </div>
      <Section>
        <h2 className="text-xl font-semibold">About</h2>
        {leadingAboutParagraphs.map((paragraph) => (
          <p
            className="text-pretty font-mono text-sm text-muted-foreground"
            key={paragraph}
          >
            {paragraph}
          </p>
        ))}
        <p className="text-pretty font-mono text-sm text-muted-foreground">
          <TypingDescriptor descriptors={PROFILE.descriptors}>
            {closingAboutParagraph} Among other things,{" "}
          </TypingDescriptor>
        </p>
      </Section>
      <Section>
        <h2 className="text-xl font-semibold">Roles</h2>
        {ROLES.map((work) => {
          const currentPosition = work.positions[0];
          const firstPosition = work.positions[work.positions.length - 1];

          return (
            <Card key={work.company}>
              <CardHeader>
                <div className="flex items-center justify-between gap-x-2 text-base">
                  <h3 className="inline-flex items-center justify-center gap-x-1 font-medium leading-none">
                    <a className="hover:underline" href={work.link}>
                      {work.company}
                    </a>

                    <span className="inline-flex gap-x-1">
                      {work.badges.map((badge) => (
                        <Badge
                          variant="secondary"
                          className="align-middle text-xs"
                          key={badge}
                        >
                          {badge}
                        </Badge>
                      ))}
                    </span>
                  </h3>
                  <div className="text-sm tabular-nums text-gray-500">
                    {formatDateRange(firstPosition.start, currentPosition.end)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="mt-3">
                <ol className="relative ml-1 before:absolute before:left-0 before:top-2.5 before:h-[calc(100%-0.625rem)] before:w-px before:-translate-x-1/2 before:bg-border before:content-['']">
                  {work.positions.map((position) => (
                    <li
                      key={`${work.company}-${position.title}-${position.start}`}
                      className="relative pb-4 pl-4 last:pb-0"
                    >
                      <span className="absolute left-0 top-2.5 z-10 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background ring-1 ring-border" />
                      <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
                        <h4 className="font-mono text-sm font-medium text-foreground">
                          {position.title}
                        </h4>
                        <span className="font-mono text-xs tabular-nums text-gray-500">
                          {"duration" in position && position.duration
                            ? position.duration
                            : formatPositionDuration(
                                position.start,
                                position.end,
                              )}
                        </span>
                      </div>
                      {Array.isArray(position.description) ? (
                        <ul className="mt-2 list-disc space-y-1 pl-4 text-[13px] leading-relaxed">
                          {position.description.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      ) : position.description ? (
                        <p className="mt-2 text-[13px] leading-relaxed">
                          {position.description}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          );
        })}
      </Section>
      <Section className="print-force-new-page scroll-mb-16">
        <h2 className="text-xl font-semibold">Projects</h2>
        <Carousel opts={{ align: "start" }} className="w-full print:hidden">
          <CarouselContent>
            {projectGroups.map((projectGroup, index) => (
              <CarouselItem key={index}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {projectGroup.map((project) => (
                    <ProjectCard
                      key={project.title}
                      title={project.title}
                      description={project.description}
                      tags={project.techStack}
                      link={project.link?.href}
                    />
                  ))}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:inline-flex" />
          <CarouselNext className="hidden md:inline-flex" />
        </Carousel>
        <div className="-mx-3 hidden grid-cols-1 gap-3 print:grid print:grid-cols-3 print:gap-2">
          {PROJECTS.map((project) => (
            <ProjectCard
              key={project.title}
              title={project.title}
              description={project.description}
              tags={project.techStack}
              link={project.link?.href}
            />
          ))}
        </div>
      </Section>
      <Section>
        <h2 className="text-xl font-semibold">Education</h2>
        {EDUCATION.map((education) => {
          return (
            <Card key={education.school}>
              <CardHeader>
                <div className="flex items-center justify-between gap-x-2 text-base">
                  <h3 className="font-medium leading-none">
                    {education.school}
                  </h3>
                  <div className="text-sm tabular-nums text-gray-500">
                    {formatDateRange(education.start, education.end)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="mt-2">{education.degree}</CardContent>
              <CardContent className="mt-2">
                <span className="font-medium">Majors:</span> {education.major} |{" "}
                <span className="font-medium">Minor:</span> {education.minor}
              </CardContent>
              <CardContent className="mt-2">
                <span className="font-medium">GPA:</span> {education.gpa} |{" "}
                <span className="font-medium">Honors:</span> {education.honors}
              </CardContent>
            </Card>
          );
        })}
      </Section>
      <Section className="print:hidden">
        <h2 className="text-xl font-semibold">Library</h2>
        <Library />
      </Section>
    </>
  );
}
