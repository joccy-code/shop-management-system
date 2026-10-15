import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Customer } from "@/features/customers/api";
import { CustomersPage } from "./CustomersPage";

vi.mock("@/features/customers/api", () => ({
  listCustomers: vi.fn(),
  createCustomer: vi.fn(),
  getCustomer: vi.fn(),
  recordRepayment: vi.fn(),
  removeCustomer: vi.fn(),
}));

import { listCustomers, removeCustomer } from "@/features/customers/api";

const paid: Customer = {
  id: "c-paid",
  name: "Abebe Kebede",
  phone: "+251911223344",
  notes: null,
  outstandingBalance: "0.00",
};

const owing: Customer = {
  id: "c-owing",
  name: "Sara Bekele",
  phone: null,
  notes: null,
  outstandingBalance: "150.00",
};

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <CustomersPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function page(items: Customer[]) {
  return { items, page: 1, pageSize: 50, total: items.length };
}

describe("CustomersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("refuses to remove a customer who still owes", async () => {
    vi.mocked(listCustomers).mockResolvedValue(page([owing]));
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole("button", { name: "Remove" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This customer still owes money",
    );
    expect(removeCustomer).not.toHaveBeenCalled();
  });

  it("removes a paid customer after confirmation and drops them from the list", async () => {
    vi.mocked(listCustomers)
      .mockResolvedValueOnce(page([paid, owing]))
      .mockResolvedValue(page([owing]));
    vi.mocked(removeCustomer).mockResolvedValue({ removed: true });
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);

    const user = userEvent.setup();
    renderPage();
    expect(await screen.findByText("Abebe Kebede")).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "Remove" })[0]!);

    await waitFor(() => expect(removeCustomer).toHaveBeenCalledWith("c-paid"));
    expect(confirm).toHaveBeenCalledWith(
      "Remove this customer? Past sales stay in the history.",
    );
    await waitFor(() =>
      expect(screen.queryByText("Abebe Kebede")).not.toBeInTheDocument(),
    );
    expect(screen.getByText("Sara Bekele")).toBeInTheDocument();
    confirm.mockRestore();
  });
});
