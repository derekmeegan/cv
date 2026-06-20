import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BROWSERBASE_ARTICLES } from "@/constants/articles";
import { formatDate, orderArticlesChronologically } from "@/lib/articles";
import type { RSSResponse } from "@/types/articles";

export default async function MediumArticles() {
  return (
    <div className="flex flex-col gap-5">
      {(
        await fetch(
          "https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/@derekmeegan",
        )
          .then((res) => res.json() as Promise<RSSResponse>)
          .then((data) =>
            orderArticlesChronologically([
              ...data.items,
              ...BROWSERBASE_ARTICLES,
            ]),
          )
      ).map((article) => {
        return (
          <Card
            className="flex flex-col overflow-hidden border border-muted p-3"
            key={article.title}
          >
            <CardContent className="mt-auto h-full flex-col">
              <div className="flex w-full flex-row gap-5">
                <div className="mt-2 w-full">
                  <div className="mb-3 flex w-full flex-col items-start justify-between md:flex-row">
                    <a
                      style={{ fontSize: "16px", lineHeight: "20px" }}
                      className="text-card-foreground"
                      href={article.link}
                    >
                      {article.title}
                    </a>
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
