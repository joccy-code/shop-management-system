import { Outlet } from "react-router-dom";
import { getAppName } from "@/i18n";
import { BottomNav } from "./BottomNav";
import { MoreMenu } from "./MoreMenu";
import { Sidebar } from "./Sidebar";

export function AppShell() {
  const appName = getAppName();

  return (
    <div className="min-h-dvh md:flex">
      <Sidebar />
      <div className="flex min-h-dvh flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-ink-300/70 bg-white/90 backdrop-blur md:hidden">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="text-lg font-bold text-ink-900">{appName}</p>
              <p className="text-xs text-ink-500">Mobile shop workspace</p>
            </div>
            <MoreMenu />
          </div>
        </header>

        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5 pb-24 md:max-w-5xl md:px-8 md:pb-8">
          <Outlet />
        </main>

        <BottomNav />
      </div>
    </div>
  );
}
