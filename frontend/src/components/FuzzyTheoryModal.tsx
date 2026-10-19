"use client";

import React from "react";
import { BookOpen, X, CheckCircle, Cpu, Zap, Layers, Sparkles, HeartHandshake } from "lucide-react";

interface FuzzyTheoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FuzzyTheoryModal: React.FC<FuzzyTheoryModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto p-6 md:p-8 rounded-3xl bg-white border border-slate-200 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-sky-100 text-sky-700">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Fuzzy Logic Made Simple
              </h2>
              <p className="text-xs text-slate-500">
                A non-technical guide to how your smart thermostat thinks & saves money
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: The Problem with Regular Thermostats */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-500" />
            <span>1. What is wrong with regular thermostats?</span>
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Most home thermostats are like a simple light switch: they turn the heater 100% full-blast ON when it&apos;s 1 degree below target, and click completely OFF when it reaches the number.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-100 space-y-1">
              <span className="font-bold text-rose-800 block">The Regular Thermostat Problem</span>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Because rooms take 20–30 minutes to absorb heat, the heater keeps blasting too long, making the room uncomfortably hot (overshoot). Then it shuts off, and the room gets cold again. This constant yo-yo wastes electricity and wears out the compressor.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 space-y-1">
              <span className="font-bold text-emerald-800 block">The Fuzzy Logic Solution</span>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Fuzzy logic acts like a smart human driver slowing down before a stoplight. As the room approaches the target temperature, it gently eases the heater power down to 30%, 15%, then coasting — saving up to 26%+ energy and eliminating temperature swings.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: How It Works */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-500" />
            <span>2. How the Fuzzy Brain Thinks</span>
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Instead of dealing with rigid 0 or 1 numbers, Fuzzy Logic uses human-like linguistic terms:
          </p>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 text-xs">
            <div className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">A</span>
              <div>
                <strong className="text-slate-800">Fuzzification:</strong>
                <span className="text-slate-600 ml-1">
                  Instead of saying &quot;20.4°C&quot;, the system notes that the room is <em>70% in the &apos;Comfort Zone&apos;</em> and <em>30% in &apos;Slightly Cool&apos;</em>.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">B</span>
              <div>
                <strong className="text-slate-800">Rule Base:</strong>
                <span className="text-slate-600 ml-1">
                  It evaluates 45 intuitive rules like: <em>&quot;IF the room is slightly cool AND warming up, THEN keep heater at gentle low speed.&quot;</em>
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">C</span>
              <div>
                <strong className="text-slate-800">Defuzzification:</strong>
                <span className="text-slate-600 ml-1">
                  It calculates the exact center balance point (e.g. exactly 34.5% power and 45% fan speed), sending a smooth command to your inverter heat pump.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Comfort & Energy Benefits */}
        <div className="p-4 rounded-2xl bg-sky-50 border border-sky-100 flex items-start gap-3 text-xs text-sky-900">
          <HeartHandshake className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Certified Human Comfort (ISO 7730 Standard)</span>
            <p className="text-[11px] text-sky-800/80 mt-0.5 leading-relaxed">
              Our controller continuously computes the Fanger PMV (Predicted Mean Vote) index. Over 94% of occupants remain completely satisfied in our multi-zone simulations with zero thermal discomfort.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FuzzyTheoryModal;
