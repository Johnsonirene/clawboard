import { motion } from 'framer-motion';
import { getScoreColor } from '../utils/colors';

interface ScoreBadgeProps {
  score: number;
  size?: number;
}

export default function ScoreBadge({ score, size = 72 }: ScoreBadgeProps) {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const color = getScoreColor(score);
  const pct = Math.max(0, Math.min(1, score));
  const targetOffset = circumference * (1 - pct);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(51,65,85,0.5)"
        strokeWidth={5}
      />
      {/* Animated arc */}
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={5}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: targetOffset }}
        transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
      />
      {/* Score text */}
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        fill={color}
        fontSize={size * 0.22}
        fontWeight="700"
        fontFamily="ui-monospace, monospace"
      >
        {Math.round(pct * 100)}%
      </text>
    </svg>
  );
}
