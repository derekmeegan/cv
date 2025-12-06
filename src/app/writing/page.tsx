import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Article {
  title: string;
  link: string;
  pubDate: string;
  categories: string[];
}

interface RSSResponse {
  items: Article[];
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const day = date.getDate();
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  const getOrdinal = (day: number): string => {
    if (day > 3 && day < 21) return "th";
    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  return `${month} ${day}${getOrdinal(day)}, ${year}`;
}

export default async function MediumArticles() {
  const res = await fetch(
    "https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/@derekmeegan",
  );
  const data: RSSResponse = await res.json();
  return (
    <div className="flex flex-col gap-5">
      {data.items.map((article) => {
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
