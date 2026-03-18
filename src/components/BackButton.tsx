import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function BackButton() {
  const navigate = useNavigate();

  return (
    <motion.button
      onClick={() => navigate('/')}
      className="flex items-center gap-1.5 text-sm text-slate-400 cursor-pointer select-none"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      whileHover={{ x: -2, color: '#94a3b8' }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.15 }}
      style={{ background: 'none', border: 'none', padding: '4px 8px', borderRadius: '6px' }}
    >
      {/* Arrow icon */}
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="15 18 9 12 15 6" />
      </motion.svg>
      <span>Back</span>
    </motion.button>
  );
}
