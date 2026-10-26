"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, X, Check } from "lucide-react";

interface SearchableSelectProps {
  options: string[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Visa Type সিলেক্ট / সার্চ করুন...",
  required = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        minWidth: 0,
      }}
    >
      {/* Hidden input for HTML5 form validation if required */}
      {required && (
        <input
          tabIndex={-1}
          autoComplete="off"
          style={{
            opacity: 0,
            width: 0,
            height: 0,
            position: "absolute",
            pointerEvents: "none",
          }}
          value={value}
          onChange={() => {}}
          required
        />
      )}

      {/* Trigger Button */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "100%",
          minHeight: "44px",
          background: "var(--bg-input, #1e293b)",
          border: isOpen
            ? "1px solid #6366f1"
            : "1px solid var(--border-subtle, rgba(255, 255, 255, 0.15))",
          borderRadius: "8px",
          padding: "8px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          gap: "8px",
          boxSizing: "border-box",
          transition: "all 0.2s ease",
          boxShadow: isOpen ? "0 0 0 3px rgba(99, 102, 241, 0.2)" : "none",
        }}
      >
        <div
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: "0.83rem",
            lineHeight: "1.35",
            color: value ? "var(--text-main, #f8fafc)" : "var(--text-muted, #94a3b8)",
            fontWeight: value ? 500 : 400,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textOverflow: "ellipsis",
            wordBreak: "break-word",
          }}
          title={value}
        >
          {value || placeholder}
        </div>
        <ChevronDown
          size={16}
          style={{
            flexShrink: 0,
            color: "var(--text-muted, #94a3b8)",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        />
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            width: "100%",
            maxWidth: "100%",
            boxSizing: "border-box",
            zIndex: 9999,
            background: "var(--bg-modal, #0f172a)",
            border: "1px solid rgba(99, 102, 241, 0.35)",
            borderRadius: "8px",
            boxShadow:
              "0 20px 30px -10px rgba(0, 0, 0, 0.7), 0 10px 15px -5px rgba(0, 0, 0, 0.5)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Search box inside dropdown */}
          <div
            style={{
              padding: "10px",
              borderBottom: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))",
              position: "relative",
              background: "rgba(0, 0, 0, 0.25)",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Search
              size={15}
              style={{
                position: "absolute",
                left: "20px",
                color: "var(--text-muted, #94a3b8)",
                pointerEvents: "none",
              }}
            />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="সার্চ করুন (Search Visa Type)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                padding: "8px 30px 8px 34px",
                fontSize: "0.82rem",
                borderRadius: "6px",
                border: "1px solid rgba(99, 102, 241, 0.3)",
                background: "var(--bg-input, #1e293b)",
                color: "var(--text-main, #ffffff)",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            {searchTerm && (
              <X
                size={14}
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchTerm("");
                }}
                style={{
                  position: "absolute",
                  right: "20px",
                  cursor: "pointer",
                  color: "var(--text-muted, #94a3b8)",
                }}
              />
            )}
          </div>

          {/* List options with 2-3 lines wrapping */}
          <div
            style={{
              overflowY: "auto",
              maxHeight: "260px",
              padding: "4px 0",
            }}
          >
            {filteredOptions.length === 0 ? (
              <div
                style={{
                  padding: "16px",
                  fontSize: "0.82rem",
                  color: "var(--text-muted, #94a3b8)",
                  textAlign: "center",
                }}
              >
                কোনো মিল পাওয়া যায়নি
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = opt === value;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      onChange(opt);
                      setIsOpen(false);
                      setSearchTerm("");
                    }}
                    style={{
                      padding: "10px 14px",
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      lineHeight: "1.45",
                      background: isSelected
                        ? "rgba(99, 102, 241, 0.2)"
                        : "transparent",
                      color: isSelected ? "#818cf8" : "var(--text-secondary, #cbd5e1)",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                      transition: "background 0.15s ease",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "8px",
                      wordBreak: "break-word",
                      whiteSpace: "normal",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background =
                          "rgba(255, 255, 255, 0.06)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = "transparent";
                      }
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>{opt}</div>
                    {isSelected && (
                      <Check
                        size={15}
                        style={{
                          color: "#818cf8",
                          flexShrink: 0,
                          marginTop: "2px",
                        }}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
