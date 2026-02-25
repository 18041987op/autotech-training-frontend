import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, TrendingUp, Sparkles, Award } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const features = [
  {
    icon: GraduationCap,
    titleKey: 'auth.features.training.title',
    descKey: 'auth.features.training.description',
    color: 'bg-blue-500',
  },
  {
    icon: TrendingUp,
    titleKey: 'auth.features.progress.title',
    descKey: 'auth.features.progress.description',
    color: 'bg-green-500',
  },
  {
    icon: Sparkles,
    titleKey: 'auth.features.aiCoach.title',
    descKey: 'auth.features.aiCoach.description',
    color: 'bg-purple-500',
  },
  {
    icon: Award,
    titleKey: 'auth.features.certification.title',
    descKey: 'auth.features.certification.description',
    color: 'bg-orange-500',
  },
];

export function FeatureCarousel() {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const currentFeature = features[activeIndex];
  const Icon = currentFeature.icon;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Slide area — compact horizontal card */}
      <div className="relative w-full h-16 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-4 text-white"
          >
            {/* Icon */}
            <div
              className={`shrink-0 w-12 h-12 rounded-xl ${currentFeature.color}
                flex items-center justify-center shadow-md`}
            >
              <Icon className="w-6 h-6 text-white" />
            </div>

            {/* Text */}
            <div className="text-left min-w-0">
              <p className="text-sm font-extrabold leading-tight">
                {t(currentFeature.titleKey)}
              </p>
              <p className="text-xs text-white/80 leading-snug mt-0.5 max-w-[260px]">
                {t(currentFeature.descKey)}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dot indicators */}
      <div className="flex gap-2">
        {features.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActiveIndex(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === activeIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/40'
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
