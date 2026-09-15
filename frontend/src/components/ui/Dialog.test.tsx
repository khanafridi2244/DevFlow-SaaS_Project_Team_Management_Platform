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
    render(
      <Dialog open={true} onOpenChange={() => {}} title="Test">
        <p>Content</p>
      </Dialog>
    );

    // Query from `document.body` (where Radix portals render, outside
    // the local render container) rather than the RTL-returned
    // `container`, since Dialog uses RadixDialog.Portal — its content
    // is NOT a descendant of the container render() returns.
    const flexWrapper = document.body.querySelector(".flex.items-center.justify-center");
    expect(flexWrapper).not.toBeNull();
    expect(flexWrapper).toBeInTheDocument();
  });
});