import { motion } from 'framer-motion';

export function AnimatedBackground() {
  return (
    <motion.div
      className="absolute inset-0 bg-gradient-to-br from-brand-primary-500 via-brand-primary-400 to-brand-accent-500"
      style={{ backgroundSize: '200% 200%' }}
      animate={{
        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
      }}
      transition={{
        duration: 5,
        repeat: Infinity,
        ease: 'linear'
      }}
    >
      {/* Geometric overlay pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
      </div>
    </motion.div>
  );
}
