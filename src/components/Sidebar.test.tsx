// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import React from "react";
import Sidebar from "./Sidebar";

afterEach(cleanup);

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) =>
    React.createElement("a", { href }, children),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { signOut: vi.fn() } }),
}));

const BASE_PROPS = { userEmail: "test@example.com", userName: "Test User" };

describe("Sidebar nav — Employment Bundles", () => {
  it("admin sees Employment Bundles link to /admin/employment-bundles", () => {
    render(<Sidebar {...BASE_PROPS} userRole="admin" />);
    const link = screen.getByRole("link", { name: /employment bundles/i });
    expect(link).toBeTruthy();
    expect(link.getAttribute("href")).toBe("/admin/employment-bundles");
  });

  it("admin does not see the old Contract Templates link", () => {
    render(<Sidebar {...BASE_PROPS} userRole="admin" />);
    expect(screen.queryByRole("link", { name: /contract templates/i })).toBeNull();
  });

  it("officer does not see Employment Bundles link", () => {
    render(<Sidebar {...BASE_PROPS} userRole="officer" />);
    expect(screen.queryByRole("link", { name: /employment bundles/i })).toBeNull();
  });
});
