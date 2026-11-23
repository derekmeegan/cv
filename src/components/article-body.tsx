import Image from "next/image";

import type { Block, Inline } from "@/types/articles";

/** The column is 672px wide; this covers it on a high-density screen. */
const MEDIUM_WIDTH = 1400;

function Inlines({ items }: { items: Inline[] }) {
  return items.map((item, i) => {
    if (typeof item === "string") return item;
    switch (item.type) {
      case "break":
        return <br key={i} />;
      case "code":
        return <code key={i}>{item.text}</code>;
      case "strong":
        return (
          <strong key={i}>
            <Inlines items={item.children} />
          </strong>
        );
      case "em":
        return (
          <em key={i}>
            <Inlines items={item.children} />
          </em>
        );
      case "link": {
        const external = /^https?:/.test(item.href);
        return (
          <a
            key={i}
            href={item.href}
            {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
          >
            <Inlines items={item.children} />
          </a>
        );
      }
    }
  });
}

function Picture({ block }: { block: Extract<Block, { type: "image" }> }) {
  const { src, alt, width, height } = block;
  const local = src.startsWith("/");

  return (
    <figure>
      {local && width && height ? (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          sizes="(max-width: 720px) 100vw, 672px"
        />
      ) : (
        // Served by the publisher's own image CDN, at a size that suits the
        // column. Width and height keep its place while it loads.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src.replace(/\/max\/\d+\//, `/max/${MEDIUM_WIDTH}/`)}
          alt={alt}
          width={width}
          height={height}
          loading="lazy"
          decoding="async"
        />
      )}
      {block.caption ? (
        <figcaption>
          <Inlines items={block.caption} />
        </figcaption>
      ) : null}
    </figure>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "paragraph":
      return (
        <p>
          <Inlines items={block.children} />
        </p>
      );
    case "heading": {
      const Heading = block.level === 2 ? "h2" : "h3";
      return (
        <Heading>
          <Inlines items={block.children} />
        </Heading>
      );
    }
    case "list": {
      const List = block.ordered ? "ol" : "ul";
      return (
        <List>
          {block.items.map((item, i) => (
            <li key={i}>
              <Inlines items={item} />
            </li>
          ))}
        </List>
      );
    }
    case "quote":
      return (
        <blockquote>
          <Inlines items={block.children} />
        </blockquote>
      );
    case "code":
      return (
        <pre data-language={block.language}>
          <code>{block.code}</code>
        </pre>
      );
    case "image":
      return <Picture block={block} />;
    case "embed":
      return (
        <p>
          <a href={block.url} target="_blank" rel="noreferrer">
            View the embedded content ↗
          </a>
        </p>
      );
    case "rule":
      return <hr />;
  }
}

/** An article's body. Typography lives in writing/article.css. */
export function ArticleBody({ blocks }: { blocks: Block[] }) {
  return (
    <div className="article-body">
      {blocks.map((block, i) => (
        <BlockView key={i} block={block} />
      ))}
    </div>
  );
}
