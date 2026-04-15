import { Bell, X, BookOpen, ClipboardCheck, TrendingUp, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef, useCallback } from 'react';
import { apiFetch, getToken } from '../lib/api';
import { useTranslation } from 'react-i18next';

// ── Derive role from JWT ───────────────────────────────────────────────────
function getRoleFromToken() {
  try {
    const token = getToken?.();
    if (!token) return null;
    return JSON.parse(atob(token.split('.')[1]))?.role?.toLowerCase() || null;
  } catch { return null; }
}

// ── Icon + colour per notification type ──────────────────────────────────
const TYPE_META = {
  module:     { icon: BookOpen,       bg: 'bg-blue-50',   text: 'text-blue-600'   },
  assessment: { icon: ClipboardCheck, bg: 'bg-amber-50',  text: 'text-amber-600'  },
  score:      { icon: TrendingUp,     bg: 'bg-green-50',  text: 'text-green-600'  },
  welcome:    { icon: Star,           bg: 'bg-purple-50', text: 'text-purple-600' },
};

function NotifIcon({ type }) {
  const meta = TYPE_META[type] || TYPE_META.module;
  const Icon = meta.icon;
  return (
    <div className={`shrink-0 h-8 w-8 rounded-xl flex items-center justify-center ${meta.bg} ${meta.text}`}>
      <Icon className="h-4 w-4" />
    </div>
  );
}

// ── Build smart notifications from real app data ──────────────────────────
async function fetchNotifications() {
  const role = getRoleFromToken();
  const notifs = [];

  try {
    // 1. Available training modules
    const mods = await apiFetch('/api/modules');
    const allMods = mods?.modules || [];
    const pendingMods = allMods.filter(m => !m.completed && m.isActive !== false);
    if (pendingMods.length > 0) {
      notifs.push({
        id: 'pending-modules',
        type: 'module',
        title: `${pendingMods.length} module${pendingMods.length !== 1 ? 's' : ''} available`,
        body: pendingMods.slice(0, 2).map(m => m.title).join(', ') +
              (pendingMods.length > 2 ? ` +${pendingMods.length - 2} more` : ''),
        link: '/training',
      });
    }
  } catch { /* ignore */ }

  try {
    // 2. Assessments + last score
    const aData = await apiFetch('/api/assessments/user');
    let pendingCount = 0;
    let lastScore = null;
    let lastTitle  = '';

    (aData?.modules || []).forEach(m => {
      (m.assessments || []).forEach(a => {
        if (a.isActive !== false) {
          pendingCount++;
          if (a.lastAttempt?.score != null) {
            const d = new Date(a.lastAttempt.createdAt);
            if (!lastScore || d > new Date(lastScore.date)) {
              lastScore = { score: a.lastAttempt.score, passing: a.passingScore ?? 70, date: a.lastAttempt.createdAt };
              lastTitle = a.title || 'Assessment';
            }
          }
        }
      });
    });

    if (pendingCount > 0) {
      notifs.push({
        id: 'pending-assessments',
        type: 'assessment',
        title: `${pendingCount} assessment${pendingCount !== 1 ? 's' : ''} to complete`,
        body: "Validate what you\u2019ve learned with a knowledge check.",
        link: '/assessments',
      });
    }

    if (lastScore !== null) {
      const passed = lastScore.score >= lastScore.passing;
      notifs.push({
        id: 'last-score',
        type: 'score',
        title: passed ? `Passed: ${lastScore.score}%` : `Score: ${lastScore.score}% — try again`,
        body: `"${lastTitle}" · Passing: ${lastScore.passing}%`,
        link: '/assessments',
      });
    }
  } catch { /* ignore */ }

  try {
    // 3. Progress nudge
    const prog = await apiFetch('/api/progress');
    const pct = prog?.overall;
    if (pct != null && pct < 100) {
      notifs.push({
        id: 'progress-nudge',
        type: 'module',
        title: `Overall progress: ${pct}%`,
        body: pct < 30  ? 'Great start! Keep going.' :
              pct < 70  ? "You\u2019re halfway there \u2014 keep it up!" :
                          'Almost done! One final push.',
        link: '/progress',
      });
    }
  } catch { /* ignore */ }

  // 4. Welcome for users with nothing yet
  const hasScore = notifs.some(n => n.id === 'last-score');
  if (!hasScore && role !== 'admin') {
    notifs.unshift({
      id: 'welcome',
      type: 'welcome',
      title: 'Welcome to AutoRx Training',
      body: 'Start with Onboarding to get up to speed.',
      link: '/onboarding',
    });
  }

  return notifs.slice(0, 5);
}

// ── Main component ────────────────────────────────────────────────────────
export function NotificationCenter() {
  const { t } = useTranslation();
  const [open, setOpen]     = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('notif_dismissed') || '[]'); } catch { return []; }
  });
  const panelRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  // Load on mount + periodically for badge count (every 2 min)
  useEffect(() => {
    const load = () => {
      fetchNotifications()
        .then(all => setNotifs(all.filter(n => !dismissed.includes(n.id))))
        .catch(() => {});
    };
    load(); // initial load for badge
    const interval = setInterval(load, 120000); // refresh every 2 min
    return () => clearInterval(interval);
  }, []); // eslint-disable-line

  // Reload when panel opens (for freshest data)
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetchNotifications()
      .then(all => setNotifs(all.filter(n => !dismissed.includes(n.id))))
      .finally(() => setLoading(false));
  }, [open]); // eslint-disable-line

  const dismiss = useCallback((id) => {
    setNotifs(p => p.filter(n => n.id !== id));
    setDismissed(p => {
      const next = [...p, id];
      try { localStorage.setItem('notif_dismissed', JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    const ids = notifs.map(n => n.id);
    setNotifs([]);
    setDismissed(p => {
      const next = [...new Set([...p, ...ids])];
      try { localStorage.setItem('notif_dismissed', JSON.stringify(next)); } catch {}
      return next;
    });
  }, [notifs]);

  const unread = notifs.length;

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="btn-outline-sm relative"
        aria-label="Notifications"
        type="button"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-brand-accent text-[10px] font-extrabold text-white grid place-items-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 w-80 card shadow-xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h3 className="text-sm font-extrabold">{t('notifications.title', 'Notifications')}</h3>
              <button type="button" onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Notification list */}
            <div className="max-h-[360px] overflow-y-auto">
              {loading ? (
                <div className="p-6 text-center text-sm text-slate-400 animate-pulse">Loading…</div>
              ) : notifs.length === 0 ? (
                <div className="p-6 text-center">
                  <Bell className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">{t('notifications.empty', 'You\'re all caught up!')}</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {notifs.map(n => (
                    <div key={n.id}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors group">
                      <NotifIcon type={n.type} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 leading-snug">{n.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 leading-snug">{n.body}</p>
                        {n.link && (
                          <a href={n.link}
                            className="text-[11px] font-semibold text-brand-primary hover:underline mt-1 inline-block"
                            onClick={() => setOpen(false)}>
                            View →
                          </a>
                        )}
                      </div>
                      <button type="button" onClick={() => dismiss(n.id)}
                        className="shrink-0 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-slate-500 transition-all mt-0.5"
                        aria-label="Dismiss">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifs.length > 0 && (
              <div className="px-4 py-2.5 border-t border-slate-100 flex justify-end">
                <button type="button" onClick={clearAll}
                  className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
                  {t('notifications.clearAll', 'Clear all')}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
