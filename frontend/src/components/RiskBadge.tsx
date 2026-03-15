import React from 'react';
import { RiskCategory } from '../types';

interface RiskBadgeProps {
  risk: RiskCategory;
  size?: 'sm' | 'md' | 'lg';
}

const RISK_LABELS: Record<RiskCategory, string> = {
  HIGH: 'Wysokie',
  MEDIUM: 'Srednie',
  LOW: 'Niskie'
};

const RISK_DOTS: Record<RiskCategory, string> = {
  HIGH: '#c0392b',
  MEDIUM: '#d68910',
  LOW: '#1e7e34'
};

const RiskBadge: React.FC<RiskBadgeProps> = ({ risk, size = 'md' }) => {
  const dotSize = size === 'sm' ? 8 : size === 'lg' ? 14 : 10;

  return (
    <span className={`risk-badge ${risk}`} style={size === 'lg' ? { fontSize: 15, padding: '6px 16px' } : undefined}>
      <span
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: '50%',
          background: RISK_DOTS[risk],
          display: 'inline-block',
          flexShrink: 0
        }}
      />
      {RISK_LABELS[risk]}
    </span>
  );
};

export default RiskBadge;
