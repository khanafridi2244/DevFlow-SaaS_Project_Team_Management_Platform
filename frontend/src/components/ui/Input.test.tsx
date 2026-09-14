import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "./Input";

describe("Input", () => {
  it("renders a plain text input without a toggle for non-password types", () => {
    render(<Input id="email" type="email" label="Email" />);

    const input = screen.getByLabelText(/email/i);
    expect(input).toHaveAttribute("type", "email");
    // No eye icon button should exist for non-password fields
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("hides password text by default and reveals it on toggle click", async () => {
    const user = userEvent.setup();
    render(<Input id="password" type="password" label="Password" />);

    const input = screen.getByLabelText(/password/i);
    expect(input).toHaveAttribute("type", "password");

    const toggleButton = screen.getByRole("button");
    await user.click(toggleButton);

    expect(input).toHaveAttribute("type", "text");

    await user.click(toggleButton);
    expect(input).toHaveAttribute("type", "password");
  });

  it("does not submit a surrounding form when the toggle is clicked", async () => {
    const handleSubmit = vi.fn((e) => e.preventDefault());
    const user = userEvent.setup();

    render(
      <form onSubmit={handleSubmit}>
        <Input id="password" type="password" label="Password" />
      </form>
    );

    // This directly guards against the exact mistake that's easy to
    // make here: a toggle button without type="button" defaults to
    // type="submit" inside a form, which would submit the form every
    // time someone just wanted to peek at their password.
    await user.click(screen.getByRole("button"));

    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("displays an error message when the error prop is set", () => {
    render(<Input id="email" label="Email" error="Invalid email address" />);
    expect(screen.getByText("Invalid email address")).toBeInTheDocument();
  });
});