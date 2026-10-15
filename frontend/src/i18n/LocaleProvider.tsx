import { useEffect, type ReactNode } from "react";
import { getAppName, useLocale } from "./index";

export function LocaleProvider({ children }: { children: ReactNode }) {
  const locale = useLocale();

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = getAppName();
  }, [locale]);

  return children;
}
