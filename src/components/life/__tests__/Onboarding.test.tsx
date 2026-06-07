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

describe("Onboarding Workflow", () => {
  test("completes the onboarding flow", async () => {
    const user = userEvent.setup();

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

    // Step 1: Welcome
    expect(await screen.findByText(/Welcome to/i)).toBeInTheDocument();
    await user.click(screen.getByText("Get started"));

    // Step 2: Name
    expect(screen.getByText(/What should we call you\?/i)).toBeInTheDocument();
    const nameInput = screen.getByPlaceholderText(/Your first name/i);
    await user.type(nameInput, "John");
    await user.click(screen.getByText("Continue"));

    // Step 3: Areas
    expect(screen.getByText(/Which life areas matter to you\?/i)).toBeInTheDocument();
    await user.click(screen.getByText("Continue"));

    // Step 4: Template
    expect(screen.getByText(/Start from a science-backed template\?/i)).toBeInTheDocument();
    await user.click(screen.getByText("Start blank"));

    // Step 5: Goal
    expect(screen.getByText(/Your first goal/i)).toBeInTheDocument();
    // It's just a text label not an actual <label for="..."> so getByLabelText fails
    const goalTitle = screen.getByPlaceholderText(/e.g. Run a 5K under 25 minutes/i);
    await user.type(goalTitle, "Learn testing");
    // Select skill (already selected)
    // Select date (already populated)
    await user.click(screen.getByText("Create goal"));

    // Step 6: Milestones
    expect(screen.getByText(/Add milestones/i)).toBeInTheDocument();
    await user.click(screen.getByText("Continue"));

    // Step 7: Tasks
    expect(screen.getByText(/Add starter tasks/i)).toBeInTheDocument();
    await user.click(screen.getByText("Continue"));

    // Step 8: Done
    expect(screen.getByText(/You're all set, John/i)).toBeInTheDocument();
    await user.click(screen.getByText("Enter dashboard"));
  });
});
