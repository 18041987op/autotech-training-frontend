import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useModules } from '../hooks/useModules';
import { motion, AnimatePresence } from 'framer-motion';

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const { data: modulesData } = useModules();
  const navigate = useNavigate();

  const results = useMemo(() => {
    if (!query || !modulesData?.modules) return [];

    return modulesData.modules
      .filter(m =>
        m.title.toLowerCase().includes(query.toLowerCase()) ||
        m.description?.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 5);
  }, [query, modulesData]);

  const handleSelect = (moduleId) => {
    navigate(`/modules/${moduleId}`);
    setQuery('');
    setFocused(false);
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          placeholder="Search modules, assessments..."
          className="input-brand pl-10 w-full"
        />
      </div>

      <AnimatePresence>
        {focused && query && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-12 left-0 right-0 card shadow-xl z-50"
          >
            {results.map(module => (
              <button
                key={module.id}
                onClick={() => handleSelect(module.id)}
                className="w-full text-left p-3 hover:bg-slate-50 border-b last:border-b-0"
              >
                <p className="font-medium text-sm">{module.title}</p>
                <p className="text-xs text-slate-500 truncate">{module.description}</p>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
