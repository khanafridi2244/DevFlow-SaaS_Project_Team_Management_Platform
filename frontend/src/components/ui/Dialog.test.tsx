import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Dialog } from "./Dialog";

describe("Dialog", () => {
  it("renders its title and children when open", () => {
    render(
      <Dialog open={true} onOpenChange={() => {}} title="Test Dialog">
        <p>Dialog content</p>
      </Dialog>
    );

    expect(screen.getByText("Test Dialog")).toBeInTheDocument();
    expect(screen.getByText("Dialog content")).toBeInTheDocument();
  });

  it("does not render content when closed", () => {
    render(
      <Dialog open={false} onOpenChange={() => {}} title="Test Dialog">
        <p>Dialog content</p>
      </Dialog>
    );

    expect(screen.queryByText("Dialog content")).not.toBeInTheDocument();
  });

  it("centers using a flexbox wrapper, not a transform-based position", () => {
    // This directly guards against the regression we found and fixed:
    // Framer Motion's own transform (for the scale/y animation) was
    // silently overriding Tailwind's left-1/2/-translate-x-1/2 centering
    // trick, since inline styles beat stylesheet rules. The fix moved
    // centering to a flex wrapper instead of relying on transform math.
    // This test can't literally check computed CSS px values easily in
    // jsdom, but it does verify the wrapper structure the fix depends on.
    const { container } = render(
      <Dialog open={true} onOpenChange={() => {}} title="Test">
        <p>Content</p>
      </Dialog>
    );

    const flexWrapper = container.querySelector(".flex.items-center.justify-center");
    expect(flexWrapper).toBeInTheDocument();
  });
});