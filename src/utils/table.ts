/** عدد الصفوف اللي بتظهر في الجدول في كل مرة */
export const PAGE_SIZE = 50;

/** الأحدث فوق: بالتاريخ، ولو نفس اليوم بالأحدث إضافةً (الـ id فيه الوقت) */
export const compareNewest = (
  a: { date: string; id: string },
  b: { date: string; id: string },
) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id);

/** month بصيغة yyyy-MM، والفاضي معناه "كل الشهور" */
export const matchesMonth = (date: string, month: string) =>
  !month || date.slice(0, 7) === month;
