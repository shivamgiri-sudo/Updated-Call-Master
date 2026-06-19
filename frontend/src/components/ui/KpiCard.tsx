// frontend/src/components/ui/KpiCard.tsx
import React from 'react';

interface TrendPoint {
  value: number;
  direction: 'up' | 'down';
}

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: TrendPoint;
  trendPositiveIsUp?: boolean;
  accentColor?: string;
  icon?: React.ReactNode;
}

export default function KpiCard({
  title,
  value,
  subtitle,
  trend,
  trendPositiveIsUp = true,
  accentColor = '#4299e1',
  icon,
}: KpiCardProps) {
  const isGood = trend
    ? trendPositiveIsUp ? trend.direction === 'up' : trend.direction === 'down'
    : null;

  return (
    <div style={{ ...styles.card, '--accent': accentColor } as React.CSSProperties}>
      <div style={styles.topRow}>
        <span style={styles.title}>{title}</span>
        {icon && <span style={{ ...styles.icon, color: accentColor }}>{icon}</span>}
      </div>
      <div style={styles.value}>{value}</div>
      {subtitle && <div style={styles.subtitle}>{subtitle}</div>}
      {trend && (
        <div style={{ ...styles.trend, color: isGood ? '#48bb78' : '#fc8181' }}>
          {trend.direction === 'up' ? '↑' : '↓'} {trend.value}%
          <span style={styles.trendLabel}> vs prev period</span>
        </div>
      )}
      <div style={{ ...styles.accent, background: accentColor }} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    position: 'relative',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 16,
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    padding: '20px 22px 18px',
    overflow: 'hidden',
    transition: 'background 150ms ease, box-shadow 150ms ease',
    cursor: 'default',
  },
  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
    color: 'rgba(232,238,246,0.55)',
  },
  icon: {
    fontSize: 18,
    opacity: 0.8,
  },
  value: {
    fontSize: 30,
    fontWeight: 700,
    color: '#e8eef6',
    letterSpacing: '-0.5px',
    lineHeight: 1.1,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 12,
    color: 'rgba(232,238,246,0.45)',
  },
  trend: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: 600,
  },
  trendLabel: {
    fontWeight: 400,
    color: 'rgba(232,238,246,0.40)',
  },
  accent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    opacity: 0.6,
  },
};
