import { render, screen } from "@testing-library/react";
import { expect, test, describe, beforeEach } from "vitest";
import { ProductTour } from "../ProductTour";
import { AppDataProvider } from "@/lib/app-data";
import { userEvent } from "@testing-library/user-event";

describe("Product tour", () => {
  beforeEach(() => {
    window.localStorage.setItem(
      "life-manager:v1",
      JSON.stringify({
        goals: [],
        tasks: [],
        bucketList: [],
        settings: { onboardedAt: "2026-08-01T00:00:00.000Z" },
      }),
    );
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

  test("Not now dismisses the invite", async () => {
    const user = userEvent.setup();

    render(
      <AppDataProvider>
        <ProductTour tab="dashboard" onTab={() => {}} />
      </AppDataProvider>,
    );

    expect(await screen.findByText(/Do you want a tutorial on this\?/i)).toBeInTheDocument();
    await user.click(screen.getByText("Not now"));
    expect(screen.queryByText(/Do you want a tutorial on this\?/i)).not.toBeInTheDocument();
  });
});
