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
    expect(screen.getAllByText(/LifeVerse One/i).length).toBeGreaterThan(0);
    await user.click(screen.getByText("Get started"));

    // Step 2: Name
    expect(screen.getByText(/What should we call you\?/i)).toBeInTheDocument();
    const nameInput = screen.getByPlaceholderText(/Your first name/i);
    await user.type(nameInput, "John");
    await user.click(screen.getByText("Continue"));

    // Step 3: Overview + setup mode
    expect(screen.getByText(/you start with a goal/i)).toBeInTheDocument();
    expect(screen.getByText(/^Goal$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Milestones$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Tasks$/i)).toBeInTheDocument();
    expect(screen.getByText(/Something amazing is coming/i)).toBeInTheDocument();
    expect(screen.getByText(/Try AI \(disabled\)/i)).toBeInTheDocument();
    await user.click(screen.getByText("Continue"));

    // Step 4: Areas
    expect(screen.getByText(/Which life areas matter to you\?/i)).toBeInTheDocument();
    await user.click(screen.getByText("Continue"));

    // Step 5: Template goal selection
    expect(screen.getByText(/Template goal selection/i)).toBeInTheDocument();
    await user.click(screen.getByText("Blank goal"));

    // Step 6: Goal
    expect(screen.getByText(/Create a blank goal/i)).toBeInTheDocument();
    const goalTitle = screen.getByPlaceholderText(/e.g. Run a 5K under 25 minutes/i);
    await user.type(goalTitle, "Learn testing");
    await user.click(screen.getByText("Create goal"));

    // Step 7: Milestones — goal name is shown as context
    expect(screen.getByText(/Add milestones/i)).toBeInTheDocument();
    expect(screen.getAllByText("Learn testing").length).toBeGreaterThan(0);
    await user.click(screen.getByText("Continue"));

    // Step 8: Tasks
    expect(screen.getByText(/Add starter tasks/i)).toBeInTheDocument();
    await user.click(screen.getByText("Continue"));

    // Step 9: Done
    expect(screen.getByText(/You're all set, John/i)).toBeInTheDocument();
    await user.click(screen.getByText("Enter dashboard"));
  });
});
