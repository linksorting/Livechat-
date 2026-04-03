import dayjs from "dayjs";

export function getDateRange(range = "7d") {
  const end = dayjs();
  let start = end.subtract(7, "day");

  if (range === "24h") start = end.subtract(1, "day");
  if (range === "30d") start = end.subtract(30, "day");
  if (range === "90d") start = end.subtract(90, "day");
  if (range === "1y") start = end.subtract(1, "year");

  return {
    start: start.toDate(),
    end: end.toDate()
  };
}

export function startOfDay(date) {
  return dayjs(date).startOf("day").toDate();
}

export function endOfDay(date) {
  return dayjs(date).endOf("day").toDate();
}
