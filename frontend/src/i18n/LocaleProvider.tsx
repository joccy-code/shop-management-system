import { useEffect, type ReactNode } from "react";
import { applyDocumentLanguage, getAppName, useLocale } from "./index";

export function LocaleProvider({ children }: { children: ReactNode }) {
  const locale = useLocale();

  useEffect(() => {
    applyDocumentLanguage(locale);
    document.title = getAppName();
  }, [locale]);

  return children;
}
