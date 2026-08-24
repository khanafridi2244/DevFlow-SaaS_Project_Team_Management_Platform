import { create } from "zustand";
import { Organization } from "@/lib/workspace";

interface WorkspaceState {
  organizations: Organization[];
  activeOrgId: string | null;
  setOrganizations: (orgs: Organization[]) => void;
  setActiveOrgId: (id: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  organizations: [],
  activeOrgId: null,
  setOrganizations: (organizations) => {
    set({ organizations });
    // If nothing's selected yet, default to the first org — most
    // users will only have one workspace initially, so this avoids
    // an empty-state screen on first login for the common case.
    if (!get().activeOrgId && organizations.length > 0) {
      set({ activeOrgId: organizations[0].id });
    }
  },
  setActiveOrgId: (activeOrgId) => set({ activeOrgId }),
}));