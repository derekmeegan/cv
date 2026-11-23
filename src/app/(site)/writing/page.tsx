import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, getArticles } from "@/lib/articles";

export default async function Writing() {
  const articles = await getArticles();

  return (
    <div className="flex flex-col gap-5">
      {articles.map((article) => {
        return (
          <Card
            className="flex flex-col overflow-hidden border border-muted p-3"
            key={article.slug}
          >
            <CardContent className="mt-auto h-full flex-col">
              <div className="flex w-full flex-row gap-5">
                <div className="mt-2 w-full">
                  <div className="mb-3 flex w-full flex-col items-start justify-between md:flex-row">
                    <Link
                      style={{ fontSize: "16px", lineHeight: "20px" }}
                      className="text-card-foreground hover:underline"
                      href={`/writing/${article.slug}`}
                    >
                      {article.title}
                    </Link>
                  </div>
                  <div className="mb-2 flex flex-wrap gap-1">
                    {article.categories.map((category) => {
                      return (
                        <Badge style={{ width: "fit-content" }} key={category}>
                          {category}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="flex justify-between">
                <p className="text-md ml-auto">{formatDate(article.pubDate)}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
