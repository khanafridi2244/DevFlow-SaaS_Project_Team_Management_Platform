import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/renderWithProviders";
import ProjectsPage from "./ProjectsPage";
import { useWorkspaceStore } from "@/store/workspaceStore";
import * as projectsApi from "@/lib/projects";

// Mock the actual API module — these are unit tests for UI behavior,
// not integration tests against a real backend. We already have real
// end-to-end coverage of the actual API via the 100+ backend tests;
// these tests exist to catch UI-only bugs like the one that motivated
// writing this file in the first place.
vi.mock("@/lib/projects", async () => {
  const actual = await vi.importActual("@/lib/projects");
  return {
    ...actual,
    listProjects: vi.fn().mockResolvedValue([]),
    createProject: vi.fn(),
  };
});

describe("ProjectsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useWorkspaceStore.setState({ activeOrgId: null, organizations: [] });
  });

  it("shows a clear error instead of silently failing when no workspace is selected", async () => {
    // This is the exact regression this test protects against: the
    // original bug was `if (!activeOrgId || !name.trim()) return;`
    // silently doing nothing, with zero feedback to the user.
    const user = userEvent.setup();
    renderWithProviders(<ProjectsPage />);

    await user.click(screen.getByRole("button", { name: /new project/i }));
    await user.type(screen.getByLabelText(/project name/i), "My Project");
    await user.click(screen.getByRole("button", { name: /create project/i }));

    expect(
      await screen.findByText(/select or create a workspace first/i)
    ).toBeInTheDocument();
    expect(projectsApi.createProject).not.toHaveBeenCalled();
  });

  it("calls createProject with the correct organizationId when a workspace IS selected", async () => {
    useWorkspaceStore.setState({
      activeOrgId: "org-123",
      organizations: [{ id: "org-123", name: "Test Org", slug: "test-org", logoUrl: null, myRole: "OWNER" }],    });

    const user = userEvent.setup();
    renderWithProviders(<ProjectsPage />);

    await user.click(screen.getByRole("button", { name: /new project/i }));
    await user.type(screen.getByLabelText(/project name/i), "My Project");
    await user.click(screen.getByRole("button", { name: /create project/i }));

    // React Query's useMutation calls mutationFn with a second internal
    // context argument we don't control — checking the FIRST call's
    // FIRST argument is the correct way to assert on the actual payload
    // our code passed, ignoring React Query's own internals.
    await waitFor(() => {
      expect(projectsApi.createProject).toHaveBeenCalled();
    });
    expect(projectsApi.createProject).toHaveBeenCalledWith(
      { organizationId: "org-123", name: "My Project" },
      expect.anything()
    );
  });

  it("shows the empty state when there are no projects", async () => {
    useWorkspaceStore.setState({
      activeOrgId: "org-123",
      organizations: [{ id: "org-123", name: "Test Org", slug: "test-org", logoUrl: null, myRole: "OWNER" }],    });

    renderWithProviders(<ProjectsPage />);

    expect(await screen.findByText(/no projects yet/i)).toBeInTheDocument();
  });
});