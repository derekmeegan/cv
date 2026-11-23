import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

import { ArticleBody } from "@/components/article-body";
import { Badge } from "@/components/ui/badge";
import { PROFILE } from "@/constants/profile";
import {
  excerpt,
  formatDate,
  getArticles,
  readingMinutes,
  sourceName,
} from "@/lib/articles";

import "../article.css";

interface Props {
  params: Promise<{ slug: string }>;
}

// Every article is known when the site is built; anything else is a 404.
export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getArticles()).map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = (await getArticles()).find((a) => a.slug === slug);
  if (!article) return {};

  const description = excerpt(article);
  const lead = article.blocks.find((block) => block.type === "image");
  const images = lead?.type === "image" ? [lead.src] : undefined;

  return {
    title: `${article.title} | ${PROFILE.name}`,
    description,
    // These first appeared elsewhere; point search engines at the original.
    alternates: { canonical: article.url },
    openGraph: {
      type: "article",
      title: article.title,
      description,
      url: `/writing/${article.slug}`,
      publishedTime: new Date(article.pubDate).toISOString(),
      authors: article.authors,
      images,
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title: article.title,
      description,
      images,
    },
  };
}

function names(list: string[]) {
  if (list.length < 3) return list.join(" and ");
  return `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}`;
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const articles = await getArticles();
  const index = articles.findIndex((a) => a.slug === slug);
  if (index === -1) notFound();

  const article = articles[index];
  // the list runs newest first
  const newer = articles[index - 1];
  const older = articles[index + 1];

  return (
    <article className="pb-10">
      <Link
        href="/writing"
        className="inline-flex items-center gap-1.5 font-mono text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        Writing
      </Link>

      <header className="mt-8 space-y-4">
        <h1 className="text-balance text-2xl font-semibold leading-tight md:text-[28px]">
          {article.title}
        </h1>

        <p className="font-mono text-sm text-muted-foreground">
          <time dateTime={new Date(article.pubDate).toISOString()}>
            {formatDate(article.pubDate)}
          </time>
          <span aria-hidden="true"> · </span>
          {readingMinutes(article)} min read
          {article.authors.length > 1 ? (
            <>
              <span aria-hidden="true"> · </span>
              {names(article.authors)}
            </>
          ) : null}
        </p>

        {article.categories.length ? (
          <div className="flex flex-wrap gap-1">
            {article.categories.map((category) => (
              <Badge key={category} variant="secondary">
                {category}
              </Badge>
            ))}
          </div>
        ) : null}
      </header>

      <div className="mt-10">
        <ArticleBody blocks={article.blocks} />
      </div>

      <footer className="mt-14 space-y-8 border-t pt-6 font-mono text-sm text-muted-foreground">
        <p>
          Originally published on{" "}
          <a
            href={article.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-0.5 text-foreground underline decoration-foreground/30 underline-offset-[3px] hover:decoration-foreground"
          >
            {sourceName(article)}
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </a>
        </p>

        {newer || older ? (
          <nav
            aria-label="More writing"
            className="grid gap-6 sm:grid-cols-2 sm:gap-10"
          >
            {older ? (
              <Link href={`/writing/${older.slug}`} className="group block">
                <span className="text-xs">← Older</span>
                <span className="mt-1 block text-pretty text-foreground group-hover:underline">
                  {older.title}
                </span>
              </Link>
            ) : (
              <span />
            )}
            {newer ? (
              <Link
                href={`/writing/${newer.slug}`}
                className="group block sm:text-right"
              >
                <span className="text-xs">Newer →</span>
                <span className="mt-1 block text-pretty text-foreground group-hover:underline">
                  {newer.title}
                </span>
              </Link>
            ) : null}
          </nav>
        ) : null}
      </footer>
    </article>
  );
}
