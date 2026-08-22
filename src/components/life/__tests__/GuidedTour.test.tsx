import { render, screen } from "@testing-library/react";
import { expect, test, describe } from "vitest";
import { userEvent } from "@testing-library/user-event";
import { GuidedTour } from "../GuidedTour";
import { AppDataProvider } from "@/lib/app-data";

const STORAGE_KEY = "life-manager:v1";

describe("GuidedTour", () => {
  test("asks if the user wants a tutorial after onboarding", async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        goals: [],
        tasks: [],
        bucketList: [],
        settings: { onboardedAt: "2026-08-22T00:00:00.000Z", userName: "John" },
      }),
    );

    const user = userEvent.setup();
    render(
      <AppDataProvider>
        <GuidedTour tab="dashboard" onTab={() => undefined} />
      </AppDataProvider>,
    );

    expect(await screen.findByText(/Do you want a tutorial on this\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Start tutorial/i)).toBeInTheDocument();

    await user.click(screen.getByText(/Start tutorial/i));
    expect(await screen.findByText(/This is your dashboard/i)).toBeInTheDocument();
  });

  test("does not invite when the tutorial was already finished", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        goals: [],
        tasks: [],
        bucketList: [],
        settings: {
          onboardedAt: "2026-08-22T00:00:00.000Z",
          tutorialCompletedAt: "completed:2026-08-22T00:00:00.000Z",
        },
      }),
    );

    render(
      <AppDataProvider>
        <GuidedTour tab="dashboard" onTab={() => undefined} />
      </AppDataProvider>,
    );

    expect(screen.queryByText(/Do you want a tutorial on this\?/i)).not.toBeInTheDocument();
  });
});
