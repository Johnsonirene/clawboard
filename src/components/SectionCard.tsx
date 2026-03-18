import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface SectionCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  to: string;
  children: ReactNode;
  layoutId: string;
}

export default function SectionCard({
  title,
  description,
  icon,
  to,
  children,
  layoutId,
}: SectionCardProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      layoutId={layoutId}
      onClick={() => navigate(to)}
      whileHover={{ scale: 1.02, y: -3 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      style={{
        cursor: 'pointer',
        flex: '1 1 0',
        minWidth: '280px',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '1rem',
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(51, 65, 85, 0.5)',
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        position: 'relative',
      }}
      className="group"
    >
      {/* Hover border glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '1rem',
          border: '1px solid transparent',
          background:
            'linear-gradient(rgba(15,23,42,0), rgba(15,23,42,0)) padding-box, ' +
            'linear-gradient(135deg, rgba(56,189,248,0.35), rgba(129,140,248,0.35)) border-box',
          pointerEvents: 'none',
          opacity: 0,
          transition: 'opacity 0.25s',
          zIndex: 1,
        }}
        className="group-hover:opacity-100"
      />

      {/* ── Header: icon + title + description ── */}
      <div
        style={{
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          borderBottom: '1px solid rgba(51,65,85,0.4)',
          background: 'rgba(2,6,23,0.35)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            flexShrink: 0,
            width: '2rem',
            height: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '0.5rem',
            background: 'rgba(56,189,248,0.12)',
            color: '#38bdf8',
          }}
        >
          {icon}
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: '0.9rem',
              fontWeight: 600,
              color: '#f1f5f9',
              marginBottom: '0.1rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: '0.72rem',
              color: '#64748b',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {description}
          </div>
        </div>
      </div>

      {/* ── Preview content ── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.25rem',
        }}
      >
        {children}
      </div>

      {/* ── Bottom CTA ── */}
      <div
        style={{
          padding: '0.55rem 1.25rem',
          borderTop: '1px solid rgba(51,65,85,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '0.3rem',
          background: 'rgba(2,6,23,0.2)',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: '0.7rem',
            color: '#475569',
            transition: 'color 0.2s',
            fontWeight: 500,
          }}
          className="group-hover:text-sky-400"
        >
          查看详情
        </span>
        <svg
          style={{ color: '#475569', transition: 'color 0.2s, transform 0.2s' }}
          className="group-hover:text-sky-400 group-hover:translate-x-0.5"
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
        >
          <path
            d="M6 3l5 5-5 5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </motion.div>
  );
}
