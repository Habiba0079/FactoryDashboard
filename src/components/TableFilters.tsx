interface TableFiltersProps {
  search: string;
  onSearch: (value: string) => void;
  month: string; // yyyy-MM أو فاضي
  onMonth: (value: string) => void;
  placeholder: string;
  shown: number; // عدد الصفوف بعد الفلتر
  total: number; // العدد الكلي
}

function TableFilters({
  search,
  onSearch,
  month,
  onMonth,
  placeholder,
  shown,
  total,
}: TableFiltersProps) {
  const active = search !== "" || month !== "";

  return (
    <div className="table-filters">
      <input
        type="search"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder={placeholder}
        aria-label="بحث"
      />
      <label>
        الشهر
        <input
          type="month"
          value={month}
          onChange={(e) => onMonth(e.target.value)}
        />
      </label>
      {active && (
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => {
            onSearch("");
            onMonth("");
          }}
        >
          مسح الفلتر
        </button>
      )}
      <span className="filter-count">
        {active ? `${shown} من ${total}` : `${total}`}
      </span>
    </div>
  );
}

export default TableFilters;
