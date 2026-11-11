"use client";
import { useState, useEffect, useRef } from "react";
import { getAutocomplete, AutocompleteResult } from "@/utils/autocomplete";

interface Props {
  placeholder: string;
  onSelect: (label: string, coords: [number, number]) => void;
  onClear?: () => void;
  dark?: boolean;
  initialValue?: string;
}

export default function SearchInput({
  placeholder,
  onSelect,
  onClear,
  dark = true,
  initialValue = "",
}: Props) {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<AutocompleteResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectionRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (initialValue !== undefined && initialValue !== query) {
      setQuery(initialValue);
    }
  }, [initialValue]);

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
    setQuery(item.label);
    setOpen(false);
    onSelect(item.label, item.coords);
  };

  const handleClear = () => {
    setQuery("");
    setSuggestions([]);
    setOpen(false);
    onClear?.();
  };

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.length >= 2 && suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "10px 32px 10px 10px",
          borderRadius: "8px",
          border: dark ? "1px solid #334155" : "1px solid #ddd",
          background: dark ? "#1e293b" : "white",
          color: dark ? "#f8fafc" : "#111827",
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
            color: dark ? "#94a3b8" : "#888",
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
            color: dark ? "#94a3b8" : "#999",
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
            background: dark ? "#1e293b" : "white",
            border: dark ? "1px solid #334155" : "1px solid #ddd",
            borderRadius: "8px",
            marginTop: "4px",
            listStyle: "none",
            padding: 0,
            zIndex: 9999,
            boxShadow: dark ? "0 8px 24px rgba(0,0,0,0.5)" : "0 4px 12px rgba(0,0,0,0.15)",
            maxHeight: "220px",
            overflowY: "auto",
            scrollbarWidth: "thin",
            scrollbarColor: dark ? "#334155 transparent" : "#cbd5e1 transparent",
          }}
        >
          {suggestions.length > 0
            ? suggestions.map((item, i) => (
                <li
                  key={i}
                  onClick={() => handleSelect(item)}
                  style={{
                    padding: "9px 12px",
                    cursor: "pointer",
                    borderBottom: dark ? "1px solid #334155" : "1px solid #f0f0f0",
                    textAlign: "left",
                    background: dark ? "#1e293b" : "white",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = dark ? "#334155" : "#f5f5f5")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = dark ? "#1e293b" : "white")
                  }
                >
                  <div
                    style={{
                      fontSize: "13px",
                      color: dark ? "#f8fafc" : "#1f2937",
                      lineHeight: "1.4",
                    }}
                  >
                    {item.label}
                  </div>
                </li>
              ))
            : !loading && (
                <li
                  style={{
                    padding: "10px 12px",
                    fontSize: "13px",
                    color: dark ? "#94a3b8" : "#999",
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
