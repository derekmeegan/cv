"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CommandMenu } from "@/components/command-menu";
import { Section } from "@/components/ui/section";
import { GlobeIcon, MailIcon, PhoneIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RESUME_DATA } from "@/data/resume-data";
import { ProjectCard } from "@/components/project-card";
import React, { useState } from "react";

export default function Page() {
  const [activeContent, setActiveContent] = useState("About");
  return (
    <main className="container relative mx-auto scroll-my-12 overflow-auto p-4 print:p-12 md:p-16">
      <section className="mx-auto w-full max-w-2xl space-y-8 bg-white print:space-y-6">
        <div className="flex flex-row gap-1 font-mono text-sm text-muted-foreground">
          <button onClick={() => setActiveContent("About")}>About</button>
          <div> | </div>
          <button onClick={() => setActiveContent("Students")}>Students</button>
        </div>
        {activeContent === "About" && (
          <>
            <div className="flex items-center justify-between">
              <div className="flex-1 space-y-1.5">
                <h1 className="text-2xl font-bold">{RESUME_DATA.name}</h1>
                <p className="max-w-md text-pretty font-mono text-sm text-muted-foreground">
                  {RESUME_DATA.about}
                </p>
                <p className="max-w-md items-center text-pretty font-mono text-xs text-muted-foreground">
                  <a
                    className="inline-flex gap-x-1.5 align-baseline leading-none hover:underline"
                    href={RESUME_DATA.locationLink}
                    target="_blank"
                  >
                    <GlobeIcon className="size-3" />
                    {RESUME_DATA.location}
                  </a>
                </p>
                <div className="flex gap-x-1 pt-1 font-mono text-sm text-muted-foreground print:hidden">
                  {RESUME_DATA.contact.email ? (
                    <Button
                      className="size-8"
                      variant="outline"
                      size="icon"
                      asChild
                    >
                      <a href={`mailto:${RESUME_DATA.contact.email}`}>
                        <MailIcon className="size-4" />
                      </a>
                    </Button>
                  ) : null}
                  {RESUME_DATA.contact.tel ? (
                    <Button
                      className="size-8"
                      variant="outline"
                      size="icon"
                      asChild
                    >
                      <a href={`tel:${RESUME_DATA.contact.tel}`}>
                        <PhoneIcon className="size-4" />
                      </a>
                    </Button>
                  ) : null}
                  {RESUME_DATA.contact.social.map((social) => (
                    <Button
                      key={social.name}
                      className="size-8"
                      variant="outline"
                      size="icon"
                      asChild
                    >
                      <a href={social.url}>
                        <social.icon className="size-4" />
                      </a>
                    </Button>
                  ))}
                </div>
                <div className="hidden flex-col gap-x-1 font-mono text-sm text-muted-foreground print:flex">
                  {RESUME_DATA.contact.email ? (
                    <a href={`mailto:${RESUME_DATA.contact.email}`}>
                      <span className="underline">
                        {RESUME_DATA.contact.email}
                      </span>
                    </a>
                  ) : null}
                  {RESUME_DATA.contact.tel ? (
                    <a href={`tel:${RESUME_DATA.contact.tel}`}>
                      <span className="underline">
                        {RESUME_DATA.contact.tel}
                      </span>
                    </a>
                  ) : null}
                </div>
              </div>

              <Avatar className="size-28">
                <AvatarImage
                  alt={RESUME_DATA.name}
                  src={RESUME_DATA.avatarUrl}
                />
                <AvatarFallback>{RESUME_DATA.initials}</AvatarFallback>
              </Avatar>
            </div>
            <Section>
              <h2 className="text-xl font-bold">About</h2>
              <p className="text-pretty font-mono text-sm text-muted-foreground">
                {RESUME_DATA.summary}
              </p>
            </Section>
            <Section>
              <h2 className="text-xl font-bold">Work Experience</h2>
              {RESUME_DATA.work.map((work) => {
                return (
                  <Card key={work.company}>
                    <CardHeader>
                      <div className="flex items-center justify-between gap-x-2 text-base">
                        <h3 className="inline-flex items-center justify-center gap-x-1 font-semibold leading-none">
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
                          {work.start} - {work.end ?? "Present"}
                        </div>
                      </div>

                      <h4 className="font-mono text-sm leading-none">
                        {work.title}
                      </h4>
                    </CardHeader>
                    <CardContent className="mt-2 text-xs">
                      {work.description}
                    </CardContent>
                  </Card>
                );
              })}
            </Section>
            <Section className="print-force-new-page scroll-mb-16">
              <h2 className="text-xl font-bold">Projects</h2>
              <div className="-mx-3 grid grid-cols-1 gap-3 print:grid-cols-3 print:gap-2 md:grid-cols-2 lg:grid-cols-3">
                {RESUME_DATA.projects.map((project) => {
                  return (
                    <ProjectCard
                      key={project.title}
                      title={project.title}
                      description={project.description}
                      tags={project.techStack}
                      link={"link" in project ? project.link.href : undefined}
                    />
                  );
                })}
              </div>
            </Section>
            <Section>
              <h2 className="text-xl font-bold">Education</h2>
              {RESUME_DATA.education.map((education) => {
                return (
                  <Card key={education.school}>
                    <CardHeader>
                      <div className="flex items-center justify-between gap-x-2 text-base">
                        <h3 className="font-semibold leading-none">
                          {education.school}
                        </h3>
                        <div className="text-sm tabular-nums text-gray-500">
                          {education.start} - {education.end}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="mt-2">
                      {education.degree}
                    </CardContent>
                  </Card>
                );
              })}
            </Section>
            <Section>
              <h2 className="text-xl font-bold">Certifications</h2>
              {RESUME_DATA.certifications.map((certification) => {
                return (
                  <Card key={certification.name}>
                    <CardHeader>
                      <div className="flex items-center justify-between gap-x-2 text-base">
                        <h3 className="font-semibold leading-none">
                          {certification.name}
                        </h3>
                        <div className="text-sm tabular-nums text-gray-500">
                          {certification.year}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="mt-2">
                      {certification.content}
                    </CardContent>
                  </Card>
                );
              })}
            </Section>
            <Section>
              <h2 className="text-xl font-bold">Skills</h2>
              <div className="flex flex-wrap gap-1">
                {RESUME_DATA.skills.map((skill) => {
                  return <Badge key={skill}>{skill}</Badge>;
                })}
              </div>
            </Section>
          </>
        )}
        {activeContent === "Students" && (
          <div className="flex flex-col gap-5">
            <div className="text-md flex flex-col justify-between font-mono text-muted-foreground md:flex-row">
              <p>Total Students: {RESUME_DATA.students.length}</p>
              <p className="hidden md:block">|</p>
              <p>
                World Champions:{" "}
                {RESUME_DATA.students
                  .map((student) =>
                    (student.achievements.join("").match(/Overall/g) || [])
                      .length > 0
                      ? 1
                      : 0,
                  )
                  .reduce((partialSum, a) => partialSum + a, 0 as number)}
              </p>
              <p className="hidden md:block">|</p>
              <p>
                Overall Wins:{" "}
                {RESUME_DATA.students
                  .map(
                    (student) =>
                      (student.achievements.join("").match(/Overall/g) || [])
                        .length,
                  )
                  .reduce((partialSum, a) => partialSum + a, 0)}
              </p>
            </div>
            {RESUME_DATA.students.map((student) => {
              return (
                <Card
                  className="flex flex-col overflow-hidden border border-muted p-3"
                  key={student.name}
                >
                  <CardContent className="mt-auto flex">
                    <div className="flex w-full flex-row gap-5 ">
                      <Avatar className="size-32">
                        <AvatarImage alt={student.name} src={student.image} />
                        <AvatarFallback>{student.name}</AvatarFallback>
                      </Avatar>
                      <div className="mt-2 w-full">
                        <div className="mb-3 flex w-full flex-col items-start justify-between md:flex-row">
                          <p
                            style={{ fontSize: "30px", lineHeight: "32px" }}
                            className="text-card-foreground"
                          >
                            {student.name}
                          </p>
                          <p className="text-md">
                            {student.start} - {student.end}
                          </p>
                        </div>
                        <div className="mb-2 flex flex-wrap gap-1">
                          {student.divisions.map((division) => {
                            return (
                              <Badge
                                style={{ width: "fit-content" }}
                                key={division}
                              >
                                {division}
                              </Badge>
                            );
                          })}
                        </div>
                        <ul>
                          {student.achievements.map((achievement) => {
                            return <li key={achievement}>{achievement}</li>;
                          })}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <CommandMenu
        links={[
          {
            url: RESUME_DATA.personalWebsiteUrl,
            title: "Personal Website",
          },
          ...RESUME_DATA.contact.social.map((socialMediaLink) => ({
            url: socialMediaLink.url,
            title: socialMediaLink.name,
          })),
        ]}
      />
    </main>
  );
}
