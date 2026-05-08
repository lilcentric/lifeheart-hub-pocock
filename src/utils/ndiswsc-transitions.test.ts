import { describe, it, expect } from "vitest";
import { canTransitionNdisWsc } from "./ndiswsc-transitions";

describe("canTransitionNdisWsc", () => {
  describe("Mark as Pending Verification (in_progress → pending_verification)", () => {
    it("allows admin when status is in_progress", () => {
      expect(canTransitionNdisWsc("in_progress", "pending_verification", "admin")).toBe(true);
    });

    it("rejects officer even when status is in_progress", () => {
      expect(canTransitionNdisWsc("in_progress", "pending_verification", "officer")).toBe(false);
    });

    it("rejects when status is not in_progress", () => {
      expect(canTransitionNdisWsc("not_completed", "pending_verification", "admin")).toBe(false);
      expect(canTransitionNdisWsc("completed", "pending_verification", "admin")).toBe(false);
      expect(canTransitionNdisWsc("pending_verification", "pending_verification", "admin")).toBe(false);
    });
  });

  describe("Mark as Cleared (pending_verification → completed)", () => {
    it("allows admin when status is pending_verification", () => {
      expect(canTransitionNdisWsc("pending_verification", "completed", "admin")).toBe(true);
    });

    it("rejects officer even when status is pending_verification", () => {
      expect(canTransitionNdisWsc("pending_verification", "completed", "officer")).toBe(false);
    });

    it("rejects when status is not pending_verification", () => {
      expect(canTransitionNdisWsc("in_progress", "completed", "admin")).toBe(false);
      expect(canTransitionNdisWsc("not_completed", "completed", "admin")).toBe(false);
    });
  });

  describe("no other transitions allowed", () => {
    it("rejects arbitrary transitions even for admin", () => {
      expect(canTransitionNdisWsc("completed", "in_progress", "admin")).toBe(false);
      expect(canTransitionNdisWsc("not_completed", "in_progress", "admin")).toBe(false);
    });
  });
});
