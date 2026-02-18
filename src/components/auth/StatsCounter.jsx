import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

function CountUpNumber({ end, duration = 2000, suffix = '' }) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);

          const startTime = Date.now();
          const animate = () => {
            const now = Date.now();
            const progress = Math.min((now - startTime) / duration, 1);
            const current = Math.floor(progress * end);

            setCount(current);

            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };

          animate();
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [end, duration, hasAnimated]);

  return <span ref={ref}>{count}{suffix}</span>;
}

export function StatsCounter() {
  const { t } = useTranslation();

  const stats = [
    { value: 500, suffix: '+', labelKey: 'auth.hero.statsModules' },
    { value: 10000, suffix: '+', labelKey: 'auth.hero.statsTechnicians' },
    { value: 95, suffix: '%', labelKey: 'auth.hero.statsSatisfaction' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.5 }}
      className="grid grid-cols-3 gap-8 text-white text-center"
    >
      {stats.map((stat, i) => (
        <div key={i}>
          <div className="text-4xl font-bold mb-2">
            <CountUpNumber end={stat.value} suffix={stat.suffix} />
          </div>
          <div className="text-sm text-white/80">
            {t(stat.labelKey)}
          </div>
        </div>
      ))}
    </motion.div>
  );
}
