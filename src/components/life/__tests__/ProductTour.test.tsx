import { render, screen } from "@testing-library/react";
import { expect, test, describe, beforeEach } from "vitest";
import { ProductTour } from "../ProductTour";
import { AppDataProvider } from "@/lib/app-data";
import { userEvent } from "@testing-library/user-event";

const STORAGE_KEY = "life-manager:v1";
const TOUR_DONE_KEY = "onelife:tour-completed";

function seedOnboarded(extra: Record<string, unknown> = {}) {
  window.localStorage.removeItem(TOUR_DONE_KEY);
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      goals: [],
      tasks: [],
      bucketList: [],
      settings: { onboardedAt: "2026-08-01T00:00:00.000Z", ...extra },
    }),
  );
}

describe("Product tour", () => {
  beforeEach(() => {
    seedOnboarded();
  });

  test("asks whether to start, then walks the first dashboard step", async () => {
    const user = userEvent.setup();

    render(
      <AppDataProvider>
        <ProductTour tab="dashboard" onTab={() => {}} />
      </AppDataProvider>,
    );

    expect(await screen.findByText(/Do you want a tutorial on this\?/i)).toBeInTheDocument();
    await user.click(screen.getByText("Start tutorial"));
    expect(await screen.findByText(/This is your dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Dashboard · 1 of/i)).toBeInTheDocument();
  });

  test("Next moves from dashboard intro to Rank", async () => {
    const user = userEvent.setup();

    render(
      <AppDataProvider>
        <ProductTour tab="dashboard" onTab={() => {}} />
      </AppDataProvider>,
    );

    await user.click(await screen.findByText("Start tutorial"));
    await user.click(screen.getByRole("button", { name: /Next/i }));
    expect(await screen.findByText(/^Rank$/)).toBeInTheDocument();
    expect(screen.getByText(/Dashboard · 2 of/i)).toBeInTheDocument();
  });

  test("Not now dismisses the invite and does not ask again", async () => {
    const user = userEvent.setup();

    const { unmount } = render(
      <AppDataProvider>
        <ProductTour tab="dashboard" onTab={() => {}} />
      </AppDataProvider>,
    );

    expect(await screen.findByText(/Do you want a tutorial on this\?/i)).toBeInTheDocument();
    await user.click(screen.getByText("Not now"));
    expect(screen.queryByText(/Do you want a tutorial on this\?/i)).not.toBeInTheDocument();
    expect(window.localStorage.getItem(TOUR_DONE_KEY)).toBe("1");

    unmount();
    render(
      <AppDataProvider>
        <ProductTour tab="dashboard" onTab={() => {}} />
      </AppDataProvider>,
    );
    await new Promise((r) => setTimeout(r, 600));
    expect(screen.queryByText(/Do you want a tutorial on this\?/i)).not.toBeInTheDocument();
  });
});
