import { useEffect, useState } from "react";

type Option = {
  label: string;
  value: string;
};

type Props = {
  label: string;
  options: Option[];
  selectedValues: string[];   // single me bhi array hi rahega
  onChange: (values: string[]) => void;
  onSearch?: (search: string) => void;
  loading?: boolean;
  isMulti?: boolean;          // 👈 NEW PROP
};

const SearchableMultiSelect = ({
  label,
  options,
  selectedValues,
  onChange,
  onSearch,
  loading,
  isMulti = true,  // default multi
}: Props) => {

  const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
      const timer = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
  };

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    onSearch?.(debouncedSearch);
  }, [debouncedSearch]);

  const toggleValue = (value: string) => {
    if (isMulti) {
      if (selectedValues.includes(value)) {
        onChange(selectedValues.filter((v) => v !== value));
      } else {
        onChange([...selectedValues, value]);
      }
    } else {
      // 👇 Single select logic
      if (selectedValues.includes(value)) {
        onChange([]); // deselect
      } else {
        onChange([value]); // only one allowed
      }
    }
  };

  return (
    <div className="w-72 bg-white border rounded-md p-2 shadow">
      <div className="text-sm font-medium mb-2">{label}</div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search..."
        className="w-full border px-2 py-1 mb-2 rounded text-sm"
      />

      <div className="max-h-48 overflow-auto">
        {loading ? (
          <div className="text-sm text-gray-500">Loading...</div>
        ) : options.length ? (
          options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => toggleValue(opt.value)}
              className={`cursor-pointer px-2 py-1 text-sm rounded ${
                selectedValues.includes(opt.value)
                  ? "bg-primary text-white"
                  : "hover:bg-gray-100"
              }`}
            >
              {opt.label}
            </div>
          ))
        ) : (
          <div className="text-sm text-gray-400">No data</div>
        )}
      </div>
    </div>
  );
};

export default SearchableMultiSelect;