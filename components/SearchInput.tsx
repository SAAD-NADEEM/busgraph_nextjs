"use client";
import { useState, useEffect, useRef } from "react";
import { getAutocomplete, AutocompleteResult } from "@/utils/autocomplete";

interface Props {
  placeholder: string;
  onSelect: (label: string, coords: [number, number]) => void;
  onClear?: () => void;
}

export default function SearchInput({ placeholder, onSelect, onClear }: Props) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<AutocompleteResult[]>([]);
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
    }, 350);
  }, [query]);

  const handleSelect = (item: AutocompleteResult) => {
    selectionRef.current = true;
    const chosenName = item.name || item.label;
    setQuery(chosenName);
    setOpen(false);
    onSelect(chosenName, item.coords);
  };

  const handleClear = () => {
    setQuery("");
    setSuggestions([]);
    setOpen(false);
    onClear?.();
  };

  return (
    <div style={{ position: "relative" }}>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.length >= 2 && suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "10px 32px 10px 10px",
          borderRadius: "8px",
          border: "1px solid #ddd",
          boxSizing: "border-box",
          fontSize: "14px",
          outline: "none",
        }}
      />

      {loading && (
        <div
          style={{
            position: "absolute",
            right: "10px",
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: "11px",
            color: "#888",
          }}
        >
          Searching...
        </div>
      )}

      {!loading && query.length > 0 && (
        <button
          type="button"
          onClick={handleClear}
          style={{
            position: "absolute",
            right: "8px",
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            color: "#999",
            cursor: "pointer",
            fontSize: "14px",
            padding: "2px 6px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          title="Clear"
        >
          ✕
        </button>
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
            maxHeight: "220px",
            overflowY: "auto",
          }}
        >
          {suggestions.length > 0
            ? suggestions.map((item, i) => (
                <li
                  key={i}
                  onClick={() => handleSelect(item)}
                  style={{
                    padding: "8px 12px",
                    cursor: "pointer",
                    borderBottom: "1px solid #f0f0f0",
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#f5f5f5")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "white")
                  }
                >
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: "13px",
                      color: "#1f2937",
                    }}
                  >
                    {item.name || item.label}
                  </div>
                  {item.subtitle && (
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#6b7280",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {item.subtitle}
                    </div>
                  )}
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
