// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import React from "react";

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

import Sidebar from "./Sidebar";

afterEach(cleanup);

describe("Sidebar admin nav", () => {
  it("links admins to /admin/employment-bundles", () => {
    render(<Sidebar userEmail="a@b.com" userName="Admin" userRole="admin" />);
    const link = screen.getByRole("link", { name: /employment bundles/i });
    expect(link.getAttribute("href")).toBe("/admin/employment-bundles");
  });

  it("does not render the admin link for officers", () => {
    render(<Sidebar userEmail="o@b.com" userName="Officer" userRole="officer" />);
    expect(
      screen.queryByRole("link", { name: /employment bundles/i })
    ).toBeNull();
  });
});
