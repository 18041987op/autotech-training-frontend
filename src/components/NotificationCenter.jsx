import { Bell } from 'lucide-react';
import { useUIStore } from '../stores/uiStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export function NotificationCenter() {
  const { notifications } = useUIStore();
  const [open, setOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="btn-outline-sm relative"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-brand-accent text-xs text-white grid place-items-center">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 top-12 w-80 card shadow-xl z-50 max-h-96 overflow-y-auto"
          >
            <div className="p-3 border-b">
              <h3 className="font-bold">Notifications</h3>
            </div>

            {notifications.length === 0 ? (
              <p className="p-4 text-sm text-slate-500 text-center">No new notifications</p>
            ) : (
              <div className="divide-y">
                {notifications.map(notif => (
                  <div key={notif.id} className="p-3 hover:bg-slate-50 cursor-pointer">
                    <p className="text-sm font-medium">{notif.title}</p>
                    <p className="text-xs text-slate-500">{notif.message}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
