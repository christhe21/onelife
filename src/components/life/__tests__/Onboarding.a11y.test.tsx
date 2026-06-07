import { render } from "@testing-library/react";
import { expect, test, describe } from "vitest";
import { axe } from "jest-axe";
import { Onboarding } from "../Onboarding";
import { AppDataProvider } from "@/lib/app-data";

describe("Onboarding Accessibility (Non-Functional Test)", () => {
  test("should have no accessibility violations on initial load", async () => {
    const { container } = render(
      <AppDataProvider>
        <Onboarding />
      </AppDataProvider>,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
