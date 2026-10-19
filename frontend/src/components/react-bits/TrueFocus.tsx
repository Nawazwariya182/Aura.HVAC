"use client";

import React, { useRef, useState, useEffect } from "react";

interface TrueFocusProps {
  items: { id: string; label: string; icon?: React.ReactNode }[];
  activeId: string;
  onSelect: (id: string) => void;
  className?: string;
}

export const TrueFocus: React.FC<TrueFocusProps> = ({
  items,
  activeId,
  onSelect,
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState({ left: 0, width: 0, opacity: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const activeEl = containerRef.current.querySelector<HTMLButtonElement>(
      `[data-id="${activeId}"]`
    );
    if (activeEl) {
      setStyle({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
        opacity: 1,
      });
    }
  }, [activeId, items]);

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/90 border border-slate-200/90 backdrop-blur-md ${className}`}
    >
      <div
        className="absolute top-1 bottom-1 rounded-lg bg-white border border-slate-200 shadow-sm transition-all duration-300 ease-out pointer-events-none"
        style={{
          left: `${style.left}px`,
          width: `${style.width}px`,
          opacity: style.opacity,
        }}
      />
      {items.map((item) => {
        const isActive = item.id === activeId;
        return (
          <button
            key={item.id}
            data-id={item.id}
            onClick={() => onSelect(item.id)}
            className={`relative z-10 flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors duration-200 ${
              isActive
                ? "text-sky-700"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default TrueFocus;
