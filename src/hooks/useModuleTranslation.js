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

  const key = `moduleTranslations.${module.title}`;

  // Check if the key exists in current language
  const hasTranslation = i18n.exists(key);

  const moduleTitle = hasTranslation
    ? t(`${key}.title`)
    : module.title || "";

  const moduleDescription = hasTranslation
    ? t(`${key}.description`)
    : module.description || "";

  return { moduleTitle, moduleDescription };
}

/**
 * Non-hook version: translate a list of modules (for use outside components).
 * Returns the array with translated title and description added.
 */
export function translateModuleList(modules, t, i18n) {
  if (!modules) return [];
  return modules.map((m) => {
    const key = `moduleTranslations.${m.title}`;
    const has = i18n.exists(key);
    return {
      ...m,
      translatedTitle: has ? t(`${key}.title`) : m.title,
      translatedDescription: has ? t(`${key}.description`) : m.description,
    };
  });
}
