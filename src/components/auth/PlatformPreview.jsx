import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Eye } from 'lucide-react';

export function PlatformPreview() {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className="relative group cursor-pointer"
    >
      {/* Blurred preview */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-white/30 shadow-2xl">
        <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 blur-sm">
          {/* Simulated dashboard elements */}
          <div className="p-6 space-y-4">
            <div className="h-8 bg-white/20 rounded w-1/3" />
            <div className="grid grid-cols-3 gap-4">
              <div className="h-24 bg-white/10 rounded" />
              <div className="h-24 bg-white/10 rounded" />
              <div className="h-24 bg-white/10 rounded" />
            </div>
            <div className="h-32 bg-white/10 rounded" />
          </div>
        </div>

        {/* Overlay with unlock message */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40
          backdrop-blur-sm group-hover:backdrop-blur-md transition-all">
          <div className="text-center text-white">
            <Eye className="w-12 h-12 mx-auto mb-3 opacity-80" />
            <p className="font-semibold text-lg">
              {t('auth.preview.unlock')}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
