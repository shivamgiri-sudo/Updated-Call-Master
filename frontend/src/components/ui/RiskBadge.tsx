// frontend/src/components/ui/RiskBadge.tsx
import React from 'react';

const COLORS: Record<string, { bg: string; text: string }> = {
  low:      { bg: 'rgba(72,187,120,0.15)',  text: '#48bb78' },
  medium:   { bg: 'rgba(237,137,54,0.15)',  text: '#ed8936' },
  high:     { bg: 'rgba(252,129,129,0.15)', text: '#fc8181' },
  critical: { bg: 'rgba(229,62,62,0.20)',   text: '#e53e3e' },
};

export default function RiskBadge({ level }: { level: string }) {
  const c = COLORS[level] || COLORS.medium;
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 999,
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      background: c.bg,
      color: c.text,
    }}>
      {level}
    </span>
  );
}
