import React, { useState } from 'react';
import MethodologyTooltip from './MethodologyTooltip';

const RiskGauge = ({ title, data, maxScore = 20, tooltipPosition = 'right' }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  if (!data) return null;
  
  const score = data.score || 0;
  const label = data.label || 'Unknown';
  const pct = Math.min(Math.round((score / maxScore) * 100), 100);

  const colors = {
    High: {
      text: 'text-red-600',
      bg: 'bg-white/95 backdrop-blur-lg shadow-xl shadow-red-500/10',
      border: 'border-red-200 hover:border-red-400 hover:shadow-2xl hover:shadow-red-500/20',
      bar: 'bg-gradient-to-r from-red-400 to-red-600',
      glow: 'bg-red-500'
    },
    Moderate: {
      text: 'text-amber-600',
      bg: 'bg-white/95 backdrop-blur-lg shadow-xl shadow-amber-500/10',
      border: 'border-amber-200 hover:border-amber-400 hover:shadow-2xl hover:shadow-amber-500/20',
      bar: 'bg-gradient-to-r from-amber-400 to-amber-600',
      glow: 'bg-amber-500'
    },
    Low: {
      text: 'text-emerald-600',
      bg: 'bg-white/95 backdrop-blur-lg shadow-xl shadow-emerald-500/10',
      border: 'border-emerald-200 hover:border-emerald-400 hover:shadow-2xl hover:shadow-emerald-500/20',
      bar: 'bg-gradient-to-r from-emerald-400 to-emerald-600',
      glow: 'bg-emerald-500'
    },
    Neutral: {
      text: 'text-emerald-600',
      bg: 'bg-white/95 backdrop-blur-lg shadow-xl shadow-emerald-500/10',
      border: 'border-emerald-200 hover:border-emerald-400 hover:shadow-2xl hover:shadow-emerald-500/20',
      bar: 'bg-gradient-to-r from-emerald-400 to-emerald-600',
      glow: 'bg-emerald-500'
    }
  };

  const theme = colors[label] || colors.Low;

  const tooltipPosClasses = tooltipPosition === 'right' 
    ? 'left-full ml-5 top-[-100px]' 
    : 'right-full mr-5 top-[-100px]';

  return (
    <div 
      className={`flex flex-col items-center group relative w-full max-w-[150px] transition-all duration-300
        ${showTooltip ? 'z-[1000] scale-[1.05]' : 'z-10'}
      `}
    >
      <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-[0.15em] mb-3 transition-colors group-hover:text-blue-500">
        {title}
      </div>
      
      <div 
        className={`relative w-full h-28 flex flex-col items-center justify-center p-4 rounded-3xl border transition-all duration-300 cursor-help
          ${theme.bg} ${theme.border} group-hover:-translate-y-1`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {/* Subtle background glowing orb wrapped in an overflow hidden container so it doesn't clip the methodology popup! */}
        <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
          <div className={`absolute -right-4 -top-4 w-16 h-16 rounded-full blur-xl opacity-20 ${theme.glow}`}></div>
        </div>

        <div className={`text-2xl font-black tracking-tighter relative z-10 ${theme.text}`}>{label}</div>
        <div className="text-xs text-slate-400 font-mono font-bold mt-1 relative z-10">{score} <span className="text-[9px]">/ {maxScore}</span></div>

        {/* DIRECTIONAL POPOVER (QualPredict Aesthetic) */}
        {showTooltip && data.methodology && (
          <div className={`absolute z-[500] pointer-events-none animate-in fade-in zoom-in duration-200 ${tooltipPosClasses}`}>
            <MethodologyTooltip 
              methodology={data.methodology} 
              organName={title} 
            />
          </div>
        )}
      </div>

      <div className="w-[85%] bg-slate-100/80 rounded-full h-1.5 overflow-hidden mt-4 transition-all group-hover:w-full shadow-inner">
        <div 
          className={`h-1.5 rounded-full ${theme.bar} transition-all duration-1000 ease-out`} 
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

export default RiskGauge;
