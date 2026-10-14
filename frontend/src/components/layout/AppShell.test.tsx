import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
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
});
