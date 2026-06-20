import type { DateRangeEnd, ISODateString } from "@/types/resume";

type DateDisplay = "month" | "year";

function formatDate(date: Date, display: DateDisplay) {
  return new Intl.DateTimeFormat("en-US", {
    month: display === "month" ? "short" : undefined,
    timeZone: "UTC",
    year: "numeric",
  }).format(date);
}

export function formatDateRange(
  start: ISODateString,
  end: DateRangeEnd,
  display: DateDisplay = "month",
) {
  const startLabel = formatDate(new Date(start), display);
  const endLabel = end ? formatDate(new Date(end), display) : "Present";

  return `${startLabel} - ${endLabel}`;
}

export function formatPositionDuration(
  start: ISODateString,
  end: DateRangeEnd,
) {
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date();
  const totalMonths = Math.max(
    1,
    (endDate.getUTCFullYear() - startDate.getUTCFullYear()) * 12 +
      endDate.getUTCMonth() -
      startDate.getUTCMonth() +
      1,
  );
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  if (!years) {
    return `${totalMonths} mo${totalMonths === 1 ? "" : "s"}`;
  }

  if (!months) {
    return `${years} yr${years === 1 ? "" : "s"}`;
  }

  return `${years} yr${years === 1 ? "" : "s"} ${months} mo${months === 1 ? "" : "s"}`;
}
