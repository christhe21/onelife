import { render, screen } from "@testing-library/react";
import { expect, test, describe } from "vitest";
import { NewGoalWizard } from "../NewGoalWizard";
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

describe("NewGoalWizard Workflow", () => {
  test("completes new goal creation", async () => {
    const user = userEvent.setup();
    let onCloseCalled = false;

    const rootRoute = createRootRoute({
      component: () => (
        <AppDataProvider>
          <NewGoalWizard
            open={true}
            onOpenChange={() => {
              onCloseCalled = true;
            }}
          />
          <Outlet />
        </AppDataProvider>
      ),
    });

    const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: "/" });
    const routeTree = rootRoute.addChildren([indexRoute]);

    const memoryHistory = createMemoryHistory({ initialEntries: ["/"] });
    const router = createRouter({ routeTree, history: memoryHistory });

    render(<RouterProvider router={router} />);

    // Step 1: Goal details (basics)
    expect(await screen.findByText(/Goal basics/i)).toBeInTheDocument();
    const titleInput = screen.getByPlaceholderText(/e.g. Run a 5K under 25 minutes/i);
    await user.type(titleInput, "My New Test Goal");
    await user.click(screen.getByText("Continue"));

    // Step 2: Milestones
    expect(screen.getByText(/Add milestones/i)).toBeInTheDocument();
    await user.click(screen.getByText("Continue"));

    // Step 3: Tasks
    expect(screen.getByText(/Add starter tasks/i)).toBeInTheDocument();
    await user.click(screen.getByText("Continue"));

    // Step 4: Sub-tasks
    expect(screen.getByText(/Sub-tasks \(optional\)/i)).toBeInTheDocument();
    await user.click(screen.getByText("Finish"));

    // Step 5: Done
    expect(screen.getByText(/Goal created/i)).toBeInTheDocument();
    await user.click(screen.getByText("Done"));

    // We expect onClose to be called
    expect(onCloseCalled).toBe(true);
  });
});
