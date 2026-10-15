import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api";
import { LoginPage } from "./LoginPage";

vi.mock("@/features/auth/api", () => ({
  login: vi.fn(),
  fetchCurrentUser: vi.fn(),
}));

import { fetchCurrentUser, login } from "@/features/auth/api";

const sampleUser = {
  id: "u1",
  phone: "+251912345678",
  displayName: "Marta Tesfaye",
  role: "OWNER" as const,
  shop: {
    id: "s1",
    name: "Addis Mini Market",
    currency: "ETB",
    timezone: "Africa/Addis_Ababa",
  },
};

function renderLoginPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<div>Home content</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchCurrentUser).mockRejectedValue(
      new ApiError(401, "AUTH_REQUIRED", "Sign in to continue."),
    );
  });

  it("shows validation errors for an empty submission", async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.click(await screen.findByRole("button", { name: "Sign in" }));

    expect(
      await screen.findByText("Enter your phone number."),
    ).toBeInTheDocument();
    expect(screen.getByText("Enter your password.")).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it("logs in and redirects home on success", async () => {
    vi.mocked(fetchCurrentUser)
      .mockRejectedValueOnce(
        new ApiError(401, "AUTH_REQUIRED", "Sign in to continue."),
      )
      .mockResolvedValueOnce(sampleUser);
    vi.mocked(login).mockResolvedValue(sampleUser);

    const user = userEvent.setup();
    renderLoginPage();

    await user.type(
      await screen.findByLabelText("Phone number"),
      "0912345678",
    );
    await user.type(screen.getByLabelText("Password"), "a-strong-password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() =>
      expect(login).toHaveBeenCalledWith({
        phone: "0912345678",
        password: "a-strong-password",
      }),
    );
    expect(await screen.findByText("Home content")).toBeInTheDocument();
  });

  it("shows a server error message when login fails", async () => {
    vi.mocked(login).mockRejectedValue(
      new ApiError(401, "INVALID_CREDENTIALS", "Invalid phone number or password."),
    );

    const user = userEvent.setup();
    renderLoginPage();

    await user.type(
      await screen.findByLabelText("Phone number"),
      "0912345678",
    );
    await user.type(screen.getByLabelText("Password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(
      await screen.findByText("Invalid phone number or password."),
    ).toBeInTheDocument();
  });
});
