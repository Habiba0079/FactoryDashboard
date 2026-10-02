import { useState } from "react";

export interface SearchSelectItem {
  value: string; // الـ id (داخلي)
  label: string; // اللي المصنع بيشوفه
  date?: string; // yyyy-MM-dd (لو موجود بيظهر فلتر الشهر والسنة)
}

interface SearchSelectProps {
  items: SearchSelectItem[];
  value: string | null; // الاختيار الحالي
  onChange: (value: string | null) => void;
  placeholder?: string;
  emptyLabel?: string; // نص خيار "الافتراضي" اللي بيرجّع null
}

function SearchSelect({
  items,
  value,
  onChange,
  placeholder,
  emptyLabel,
}: SearchSelectProps) {
  const [query, setQuery] = useState("");
  const [month, setMonth] = useState(""); // yyyy-MM (من غير اليوم)
  const [isOpen, setIsOpen] = useState(false);

  const hasDates = items.some((item) => item.date);
  const selectedLabel = items.find((item) => item.value === value)?.label ?? "";

  const filteredItems = items.filter(
    (item) =>
      item.label.toLowerCase().includes(query.toLowerCase()) &&
      (!month || item.date?.slice(0, 7) === month),
  );

  function close() {
    setIsOpen(false);
    setQuery("");
    setMonth("");
  }

  function select(newValue: string | null) {
    onChange(newValue);
    close();
  }

  return (
    <div
      className="search-select"
      onFocus={() => setIsOpen(true)}
      // بنقفل القايمة بس لما الفوكس يخرج من الـ component كله
      // (فالضغط على فلتر الشهر جوّاه مايقفلهاش)
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) close();
      }}
    >
      <input
        type="text"
        value={isOpen ? query : selectedLabel}
        placeholder={placeholder}
        onChange={(e) => setQuery(e.target.value)}
      />

      {isOpen && (
        <div className="dropdown">
          {hasDates && (
            <div className="dropdown-filter">
              <label>
                الشهر والسنة
                <input
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                />
              </label>
              {month && (
                <button type="button" onClick={() => setMonth("")}>
                  كل الشهور
                </button>
              )}
            </div>
          )}

          <ul>
            {emptyLabel && (
              <li
                className={value === null ? "selected" : ""}
                onMouseDown={() => select(null)}
              >
                {emptyLabel}
              </li>
            )}
            {filteredItems.map((item) => (
              <li
                key={item.value}
                className={value === item.value ? "selected" : ""}
                onMouseDown={() => select(item.value)}
              >
                {item.label}
              </li>
            ))}
            {filteredItems.length === 0 && (
              <li className="empty">لا توجد نتائج</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default SearchSelect;
