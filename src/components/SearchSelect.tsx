import { useState } from "react";

interface SearchSelectItem {
  value: string; // الـ id (داخلي)
  label: string; // اللي المصنع بيشوفه
}

interface SearchSelectProps {
  items: SearchSelectItem[];
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  emptyLabel?: string; // خيار "الافتراضي" اللي بيرجّع null
}

function SearchSelect({
  items,
  value,
  onChange,
  placeholder,
  emptyLabel,
}: SearchSelectProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const selectedLabel = items.find((item) => item.value === value)?.label ?? "";

  const filteredItems = items.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase()),
  );

  function select(newValue: string | null) {
    onChange(newValue);
    setQuery("");
    setIsOpen(false);
  }

  return (
    <div className="search-select">
      <input
        type="text"
        value={isOpen ? query : selectedLabel}
        placeholder={placeholder}
        onFocus={() => setIsOpen(true)}
        onChange={(e) => setQuery(e.target.value)}
        onBlur={() => {
          setIsOpen(false);
          setQuery("");
        }}
      />
      {isOpen && (
        <ul className="dropdown">
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
      )}
    </div>
  );
}

export default SearchSelect;
