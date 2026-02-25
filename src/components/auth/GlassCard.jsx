import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export function GlassCard({ children, className = '' }) {
  const ref = useRef(null);

  // Mouse-tracked tilt values
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  // Spring-smooth the tilt
  const springConfig = { stiffness: 150, damping: 20 };
  const rotateX = useSpring(useTransform(rawY, [-0.5, 0.5], [6, -6]), springConfig);
  const rotateY = useSpring(useTransform(rawX, [-0.5, 0.5], [-6, 6]), springConfig);

  const handleMouseMove = (e) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    rawX.set((e.clientX - rect.left) / rect.width - 0.5);
    rawY.set((e.clientY - rect.top)  / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    rawX.set(0);
    rawY.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        transformPerspective: 900,
      }}
      className={`
        relative
        bg-white/80 backdrop-blur-xl
        border border-white/40
        rounded-3xl
        p-6 md:p-8
        ${className}
      `}
      /* Layered shadow: close soft + far diffuse + specular top edge */
      sx={{}}
    >
      {/* Top-edge specular highlight — gives the "lifted glass" look */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-3xl"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)' }}
      />

      {/* Subtle inner glow */}
      <div
        className="pointer-events-none absolute inset-0 rounded-3xl"
        style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.12)' }}
      />

      {/* Content sits above decorative layers */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}
