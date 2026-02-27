import { useTranslation } from "react-i18next";

/**
 * Returns translated title and description for a module.
 * Looks up by the English title stored in the DB as the key.
 * Falls back to the original DB value if no translation exists.
 *
 * Usage:
 *   const { moduleTitle, moduleDescription } = useModuleTranslation(module);
 */
export function useModuleTranslation(module) {
  const { t, i18n } = useTranslation();

  if (!module) return { moduleTitle: "", moduleDescription: "" };

  const isEs = i18n.language?.startsWith("es");

  // 1. Prefer DB-stored translations
  if (isEs && module.title_es && module.title_es.trim().length > 0) {
    return {
      moduleTitle:       module.title_es,
      moduleDescription: module.description_es || module.description || "",
    };
  }

  // 2. Fall back to predefined JSON keys (legacy)
  const key = `moduleTranslations.${module.title}`;
  const hasTranslation = i18n.exists(key);

  return {
    moduleTitle:       hasTranslation ? t(`${key}.title`)       : (module.title       || ""),
    moduleDescription: hasTranslation ? t(`${key}.description`) : (module.description || ""),
  };
}

/**
 * Non-hook version: translate a list of modules (for use outside components).
 * Returns the array with translated title and description added.
 */
export function translateModuleList(modules, t, i18n) {
  if (!modules) return [];
  const isEs = i18n.language?.startsWith("es");
  return modules.map((m) => {
    // 1. Prefer DB-stored translations (title_es / description_es)
    if (isEs && m.title_es && m.title_es.trim().length > 0) {
      return {
        ...m,
        translatedTitle:       m.title_es,
        translatedDescription: m.description_es || m.description,
      };
    }
    // 2. Fall back to predefined JSON keys (legacy, English-titled modules)
    const key = `moduleTranslations.${m.title}`;
    const has = i18n.exists(key);
    return {
      ...m,
      translatedTitle:       has ? t(`${key}.title`)       : m.title,
      translatedDescription: has ? t(`${key}.description`) : m.description,
    };
  });
}
