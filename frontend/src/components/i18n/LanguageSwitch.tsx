import { getLocale, setLocale, useMessages, type Locale } from "@/i18n";

const options: Array<{ locale: Locale; short: string }> = [
  { locale: "en", short: "EN" },
  { locale: "am", short: "አማርኛ" },
];

type LanguageSwitchProps = {
  compact?: boolean;
};

export function LanguageSwitch({ compact = false }: LanguageSwitchProps) {
  const messages = useMessages();
  const locale = getLocale();

  return (
    <div
      role="group"
      aria-label={messages.language.label}
      className="inline-flex max-w-full flex-wrap rounded-xl border border-ink-300 bg-white p-0.5"
    >
      {options.map((option) => {
        const selected = locale === option.locale;
        const label =
          option.locale === "en" ? messages.language.english : messages.language.amharic;
        return (
          <button
            key={option.locale}
            type="button"
            aria-pressed={selected}
            aria-label={label}
            onClick={() => setLocale(option.locale)}
            className={`min-h-11 rounded-lg px-2.5 text-base font-semibold ${
              selected ? "bg-brand-700 text-white" : "text-ink-700 hover:bg-ink-100"
            }`}
          >
            {compact ? option.short : label}
          </button>
        );
      })}
    </div>
  );
}
