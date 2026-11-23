import Image from "next/image";
import Link from "next/link";

import {
  coverImage,
  excerpt,
  formatDate,
  getArticles,
  readingMinutes,
} from "@/lib/articles";
import type { Article } from "@/types/articles";

/** The picture on a card, cropped to the card's frame. */
function Cover({ article, eager }: { article: Article; eager: boolean }) {
  const cover = coverImage(article);
  if (!cover) return null;

  return (
    <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden rounded-lg bg-secondary sm:aspect-[4/3] sm:w-52">
      {cover.src.startsWith("/") && cover.width && cover.height ? (
        <Image
          src={cover.src}
          alt=""
          width={cover.width}
          height={cover.height}
          sizes="(max-width: 640px) 100vw, 208px"
          priority={eager}
          className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        />
      ) : (
        // Medium's own image CDN, at a size that suits the card.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={cover.src.replace(/\/max\/\d+\//, "/max/800/")}
          alt=""
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        />
      )}
    </div>
  );
}

export default async function Writing() {
  const articles = await getArticles();

  return (
    <ul className="flex flex-col gap-10 pb-10 sm:gap-9">
      {articles.map((article, index) => (
        <li key={article.slug}>
          <Link
            href={`/writing/${article.slug}`}
            className="group flex flex-col gap-4 sm:flex-row sm:gap-6"
          >
            <Cover article={article} eager={index < 3} />

            <div className="flex min-w-0 flex-1 flex-col sm:py-0.5">
              <h2 className="text-pretty text-base font-medium leading-snug text-card-foreground decoration-foreground/30 underline-offset-4 group-hover:underline">
                {article.title}
              </h2>

              <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-muted-foreground">
                {excerpt(article, 260)}
              </p>

              <p className="mt-auto pt-3 text-xs text-muted-foreground">
                <time dateTime={new Date(article.pubDate).toISOString()}>
                  {formatDate(article.pubDate)}
                </time>
                <span aria-hidden="true"> · </span>
                {readingMinutes(article)} min read
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
