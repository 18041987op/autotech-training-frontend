import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, TrendingUp, Sparkles, Award } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const features = [
  {
    icon: GraduationCap,
    titleKey: 'auth.features.training.title',
    descKey: 'auth.features.training.description',
    color: 'bg-blue-500'
  },
  {
    icon: TrendingUp,
    titleKey: 'auth.features.progress.title',
    descKey: 'auth.features.progress.description',
    color: 'bg-green-500'
  },
  {
    icon: Sparkles,
    titleKey: 'auth.features.aiCoach.title',
    descKey: 'auth.features.aiCoach.description',
    color: 'bg-purple-500'
  },
  {
    icon: Award,
    titleKey: 'auth.features.certification.title',
    descKey: 'auth.features.certification.description',
    color: 'bg-orange-500'
  },
];

export function FeatureCarousel() {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);

  // Auto-rotate every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const currentFeature = features[activeIndex];
  const Icon = currentFeature.icon;

  return (
    <div className="relative h-64 flex items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.5 }}
          className="text-center text-white"
        >
          <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl ${currentFeature.color}
            flex items-center justify-center shadow-lg`}>
            <Icon className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold mb-3">
            {t(currentFeature.titleKey)}
          </h3>
          <p className="text-white/90 max-w-md mx-auto">
            {t(currentFeature.descKey)}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Indicator dots */}
      <div className="absolute bottom-0 flex gap-2">
        {features.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`w-2 h-2 rounded-full transition-all ${
              i === activeIndex ? 'bg-white w-8' : 'bg-white/40'
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
