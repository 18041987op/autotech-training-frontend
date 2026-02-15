import { Moon, Sun } from 'lucide-react';
import { useUIStore } from '../stores/uiStore';
import { useEffect } from 'react';

export function DarkModeToggle() {
  const { darkMode, toggleDarkMode } = useUIStore();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <button
      onClick={toggleDarkMode}
      className="btn-outline-sm"
      aria-label="Toggle dark mode"
    >
      {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
