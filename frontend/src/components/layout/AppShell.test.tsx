import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { setLocale } from "@/i18n";
import { AppShell } from "./AppShell";

function renderShell(initialPath = "/") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<div>Home content</div>} />
          <Route path="sales" element={<div>Sales content</div>} />
          <Route path="expenses" element={<div>Expenses content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("AppShell", () => {
  afterEach(() => {
    act(() => {
      setLocale("en");
    });
    localStorage.removeItem("shop-manager.locale");
  });

  it("renders the configurable app name and primary destinations", () => {
    renderShell();

    expect(screen.getAllByText("Shop Manager").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Home" }).length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByRole("link", { name: "Sales" }).length).toBeGreaterThan(
      0,
    );
    expect(
      screen.getAllByRole("link", { name: "Products" }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("link", { name: "Reports" }).length,
    ).toBeGreaterThan(0);
  });

  it("opens the mobile menu for secondary destinations", async () => {
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByRole("button", { name: "Menu" }));
    const menu = screen.getByRole("dialog", { name: "More" });
    expect(menu).toBeInTheDocument();
    expect(
      menu.querySelector('a[href="/expenses"]'),
    ).toHaveTextContent("Expenses");
    expect(
      menu.querySelector('a[href="/customers"]'),
    ).toHaveTextContent("Customers");
    expect(
      menu.querySelector('a[href="/settings"]'),
    ).toHaveTextContent("Settings");
  });

  it("switches the workspace into Amharic", async () => {
    const user = userEvent.setup();
    renderShell();

    const amharic = screen.getAllByRole("button", { name: "አማርኛ" })[0];
    expect(amharic).toBeDefined();
    await act(async () => {
      await user.click(amharic!);
    });
    expect(screen.getAllByRole("link", { name: "መነሻ" }).length).toBeGreaterThan(0);
    expect(screen.getByText("የሱቅ የስራ ቦታ")).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("am");
    expect(document.documentElement.getAttribute("translate")).toBe("no");
    expect(screen.getAllByRole("button", { name: "አማርኛ" })[0]).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(localStorage.getItem("shop-manager.locale")).toBe("am");
  });
});
