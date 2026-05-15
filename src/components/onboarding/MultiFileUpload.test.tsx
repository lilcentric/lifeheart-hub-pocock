// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import React from "react";
import MultiFileUpload from "./MultiFileUpload";

afterEach(cleanup);

vi.mock("@/app/actions/multi-upload", () => ({
  getStaffUploadUrl: vi.fn(),
  recordStaffUpload: vi.fn(),
}));

describe("MultiFileUpload", () => {
  it("does not render the document label as a visible paragraph — the checklist row above already shows it", () => {
    render(
      <MultiFileUpload
        token="test-token"
        documentType="qualifications"
        label={"Qualifications" as never}
      />
    );
    expect(screen.queryByText("Qualifications")).toBeNull();
  });

  it("renders the upload zone", () => {
    render(
      <MultiFileUpload token="test-token" documentType="qualifications" />
    );
    expect(screen.queryByText("Choose files or drop here")).not.toBeNull();
  });

  it("shows file count when initialCount is provided", () => {
    render(
      <MultiFileUpload
        token="test-token"
        documentType="first_aid_cpr"
        initialCount={3}
      />
    );
    expect(screen.queryByText("3 files uploaded")).not.toBeNull();
  });
});
