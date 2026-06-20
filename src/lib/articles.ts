import type { Article } from "@/types/articles";

export function parseArticleDate(dateString: string): Date {
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);

  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  return new Date(dateString);
}

export function formatDate(dateString: string): string {
  const date = parseArticleDate(dateString);

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

export function orderArticlesChronologically(articles: Article[]): Article[] {
  return [...articles].sort(
    (a, b) =>
      parseArticleDate(b.pubDate).getTime() -
      parseArticleDate(a.pubDate).getTime(),
  );
}
