export const PAGE_SIZE = 50;

/** Sort newest first by date, then by creation time encoded in the ID. */
export const compareNewest = (
  a: { date: string; id: string },
  b: { date: string; id: string },
) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id);

/** Filter by a yyyy-MM month string; an empty string includes all months. */
export const matchesMonth = (date: string, month: string) =>
  !month || date.slice(0, 7) === month;
