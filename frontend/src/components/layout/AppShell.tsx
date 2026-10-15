import { Outlet } from "react-router-dom";
import { LanguageSwitch } from "@/components/i18n/LanguageSwitch";
import { Toaster } from "@/components/ui/toast";
import { getAppName, t, useMessages } from "@/i18n";
import { BottomNav } from "./BottomNav";
import { MoreMenu } from "./MoreMenu";
import { Sidebar } from "./Sidebar";

export function AppShell() {
  useMessages();
  const messages = t();
  const appName = getAppName();

  return (
    <div className="min-h-dvh md:flex">
      <Sidebar />
      <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-ink-300/70 bg-white/90 pt-[env(safe-area-inset-top)] backdrop-blur md:hidden">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-base font-bold text-ink-900">{appName}</p>
              <p className="sr-only">{messages.shell.mobileWorkspace}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <LanguageSwitch compact />
              <MoreMenu />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full min-w-0 max-w-3xl flex-1 px-4 py-5 pb-[calc(7rem+env(safe-area-inset-bottom))] md:max-w-5xl md:px-8 md:pb-8">
          <Outlet />
        </main>

        <BottomNav />
      </div>
      <Toaster />
    </div>
  );
}
