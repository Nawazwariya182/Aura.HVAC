"use client";

import React, { useEffect, useState } from "react";

interface AnimatedCounterProps {
  value: number;
  decimals?: number;
  duration?: number; // ms
  prefix?: string;
  suffix?: string;
  className?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  decimals = 1,
  duration = 500,
  prefix = "",
  suffix = "",
  className = "",
}) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let startTime: number | null = null;
    const startVal = displayValue;
    const endVal = value;
    const diff = endVal - startVal;

    if (Math.abs(diff) < 0.001) {
      setDisplayValue(endVal);
      return;
    }

    let animationId: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // easeOutCubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = startVal + diff * ease;
      setDisplayValue(current);

      if (progress < 1) {
        animationId = requestAnimationFrame(step);
      } else {
        setDisplayValue(endVal);
      }
    };

    animationId = requestAnimationFrame(step);

    return () => cancelAnimationFrame(animationId);
  }, [value, duration]);

  return (
    <span className={`inline-block font-mono tracking-tight ${className}`}>
      {prefix}
      {displayValue.toFixed(decimals)}
      {suffix}
    </span>
  );
};

export default AnimatedCounter;
