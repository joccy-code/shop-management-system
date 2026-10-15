import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Toaster, clearToasts } from "@/components/ui/toast";
import type { Customer } from "@/features/customers/api";
import { CustomersPage } from "./CustomersPage";

vi.mock("@/features/customers/api", () => ({
  listCustomers: vi.fn(),
  createCustomer: vi.fn(),
  getCustomer: vi.fn(),
  recordRepayment: vi.fn(),
  removeCustomer: vi.fn(),
}));

import { createCustomer, getCustomer, listCustomers, removeCustomer } from "@/features/customers/api";
import { ApiError } from "@/lib/api";

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
        <Toaster />
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
    clearToasts();
  });

  it("refuses to remove a customer who still owes", async () => {
    vi.mocked(listCustomers).mockResolvedValue(page([owing]));
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole("button", { name: "Remove" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "This customer still owes money",
    );
    expect(removeCustomer).not.toHaveBeenCalled();
  });

  it("removes a paid customer after confirmation and drops them from the list", async () => {
    vi.mocked(listCustomers)
      .mockResolvedValueOnce(page([paid, owing]))
      .mockResolvedValue(page([owing]));
    vi.mocked(removeCustomer).mockResolvedValue({ removed: true });
    const confirm = vi.spyOn(window, "confirm");

    const user = userEvent.setup();
    renderPage();
    expect(await screen.findByText("Abebe Kebede")).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "Remove" })[0]!);
    const toast = await screen.findByRole("status");
    expect(toast).toHaveTextContent("Remove this customer? Past sales stay in the history.");
    await user.click(within(toast).getByRole("button", { name: "Remove" }));

    await waitFor(() => expect(removeCustomer).toHaveBeenCalledWith("c-paid"));
    expect(confirm).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.queryByText("Abebe Kebede")).not.toBeInTheDocument(),
    );
    expect(screen.getByText("Sara Bekele")).toBeInTheDocument();
    confirm.mockRestore();
  });

  it("shows a newly added customer in the list", async () => {
    const created = { ...paid, id: "c-new", name: "Liya Alemu" };
    vi.mocked(listCustomers)
      .mockResolvedValueOnce(page([]))
      .mockResolvedValue(page([created]));
    vi.mocked(createCustomer).mockResolvedValue(created);
    vi.mocked(getCustomer).mockResolvedValue({ ...created, sales: [], repayments: [] });

    const user = userEvent.setup();
    renderPage();
    expect(await screen.findByText("No customers yet")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Customer name"), "Liya Alemu");
    await user.click(screen.getByRole("button", { name: "Add customer" }));

    expect(await screen.findAllByText("Liya Alemu")).toHaveLength(2);
    expect(document.getElementById("customer-c-new")).toBeInTheDocument();
    expect(createCustomer).toHaveBeenCalledWith({
      name: "Liya Alemu",
      phone: null,
      notes: null,
    });
  });

  it("shows a load error instead of an empty list when customers cannot be loaded", async () => {
    vi.mocked(listCustomers).mockRejectedValue(
      new ApiError(500, "INTERNAL_ERROR", "Something went wrong. Please try again."),
    );
    renderPage();

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Something went wrong. Please try again.",
    );
    expect(screen.queryByText("No customers yet")).not.toBeInTheDocument();
  });
});
