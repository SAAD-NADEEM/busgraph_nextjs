"use client";
import { useState, useEffect, useRef } from "react";
import { getAutocomplete } from "@/utils/autocomplete";

interface Props {
  placeholder: string;
  onSelect: (label: string, coords: [number, number]) => void;
}

export default function SearchInput({ placeholder, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<
    { label: string; coords: [number, number] }[]
  >([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectionRef = useRef(false);

  useEffect(() => {
    if (selectionRef.current) {
      selectionRef.current = false;
      return;
    }

    if (query.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    setLoading(true);
    const currentQuery = query;
    debounceRef.current = setTimeout(async () => {
      const results = await getAutocomplete(currentQuery);
      if (currentQuery === query) {
        setSuggestions(results);
        setOpen(true);
        setLoading(false);
      }
    }, 400); // slightly longer debounce
  }, [query]);

  const handleSelect = (item: { label: string; coords: [number, number] }) => {
    selectionRef.current = true;
    setQuery(item.label);
    setOpen(false);
    onSelect(item.label, item.coords);
  };

  return (
    <div style={{ position: "relative" }}>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.length >= 2 && setOpen(true)}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: "8px",
          border: "1px solid #ddd",
          boxSizing: "border-box",
          fontSize: "14px",
        }}
      />
      {loading && (
        <div
          style={{
            position: "absolute",
            right: "10px",
            top: "10px",
            fontSize: "12px",
            color: "#666",
          }}
        >
          Searching...
        </div>
      )}
      {open && (
        <ul
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "white",
            border: "1px solid #ddd",
            borderRadius: "8px",
            marginTop: "4px",
            listStyle: "none",
            padding: 0,
            zIndex: 1000,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            maxHeight: "200px",
            overflowY: "auto",
          }}
        >
          {suggestions.length > 0
            ? suggestions.map((item, i) => (
                <li
                  key={i}
                  onClick={() => handleSelect(item)}
                  style={{
                    padding: "10px 12px",
                    cursor: "pointer",
                    fontSize: "13px",
                    borderBottom: "1px solid #f0f0f0",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#f5f5f5")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "white")
                  }
                >
                  {item.label}
                </li>
              ))
            : !loading && (
                <li
                  style={{
                    padding: "10px 12px",
                    fontSize: "13px",
                    color: "#999",
                  }}
                >
                  No results found for Karachi
                </li>
              )}
        </ul>
      )}
    </div>
  );
}
