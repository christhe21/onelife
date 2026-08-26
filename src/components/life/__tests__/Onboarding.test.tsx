import { render, screen } from "@testing-library/react";
import { expect, test, describe } from "vitest";
import { Onboarding } from "../Onboarding";
import { AppDataProvider } from "@/lib/app-data";
import { userEvent } from "@testing-library/user-event";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  Outlet,
} from "@tanstack/react-router";

function renderOnboarding() {
  const rootRoute = createRootRoute({
    component: () => (
      <AppDataProvider>
        <Onboarding />
        <Outlet />
      </AppDataProvider>
    ),
  });
  const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: "/" });
  const routeTree = rootRoute.addChildren([indexRoute]);
  const memoryHistory = createMemoryHistory({ initialEntries: ["/"] });
  const router = createRouter({ routeTree, history: memoryHistory });
  render(<RouterProvider router={router} />);
}

describe("Onboarding Workflow", () => {
  test("completes the streamlined five-step flow", async () => {
    const user = userEvent.setup();
    renderOnboarding();
    expect(await screen.findByText(/Welcome to/i)).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText(/Your first name/i), "John");
    await user.click(screen.getByText("Get started"));
    expect(await screen.findByText(/Skip — use Career and Health/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Continue/i }));
    expect(await screen.findByText(/Choose a starting point/i)).toBeInTheDocument();
    expect(screen.getByText("Just explore")).toBeInTheDocument();
    await user.click(screen.getByText("Blank goal"));
    const goalTitle = await screen.findByPlaceholderText(/e.g. Run a 5K under 25 minutes/i);
    await user.type(goalTitle, "Learn testing");
    await user.click(screen.getByRole("button", { name: /Create goal/i }));
    expect(await screen.findByText(/You're all set, John/i)).toBeInTheDocument();
    await user.click(screen.getByText(/Enter dashboard/i));
  });
});
