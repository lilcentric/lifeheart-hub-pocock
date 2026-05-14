// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act, cleanup } from "@testing-library/react";
import React from "react";
import StaffDetailsForm from "./StaffDetailsForm";
import type { StaffDetail } from "@/lib/types";

// ---------------------------------------------------------------------------
// Mock hoisting
// ---------------------------------------------------------------------------

const mockSubmitStaffDetails = vi.fn();

vi.mock("@/app/actions/staff-details", () => ({
  submitStaffDetails: (...args: unknown[]) => mockSubmitStaffDetails(...args),
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const EXISTING: StaffDetail = {
  id: "det-1",
  record_id: "rec-1",
  first_name: "Alice",
  last_name: "Smith",
  preferred_name: "Ali",
  personal_email: "alice@example.com",
  phone: "0400000000",
  emergency_contact_name: "Bob Smith",
  emergency_contact_relationship: "Spouse",
  emergency_contact_phone: "0411111111",
  right_to_work: "australian_citizen",
  visa_type: null,
  visa_expiry_date: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fillRequiredFields() {
  const nameInput = document.querySelector('input[name="full_name"]') as HTMLInputElement;
  fireEvent.change(nameInput, { target: { value: "Jane Doe" } });

  const statusSelect = document.querySelector('select[name="citizenship_status"]') as HTMLSelectElement;
  fireEvent.change(statusSelect, { target: { value: "permanent_resident" } });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

afterEach(cleanup);

beforeEach(() => {
  vi.clearAllMocks();
  mockSubmitStaffDetails.mockResolvedValue({ success: true });
});

describe("StaffDetailsForm — rendering", () => {
  it("renders Contact section heading", () => {
    render(<StaffDetailsForm token="tok-123" />);
    // getByText throws if not found — implicit assertion
    screen.getByText("Contact");
  });

  it("renders Emergency contact section heading", () => {
    render(<StaffDetailsForm token="tok-123" />);
    screen.getByText("Emergency contact");
  });

  it("renders Right to work section heading", () => {
    render(<StaffDetailsForm token="tok-123" />);
    screen.getByText("Right to work");
  });

  it("renders Submit details button when no existing data", () => {
    render(<StaffDetailsForm token="tok-123" />);
    screen.getByRole("button", { name: /submit details/i });
  });

  it("renders Update details button when existing data is provided", () => {
    render(<StaffDetailsForm token="tok-123" existing={EXISTING} />);
    screen.getByRole("button", { name: /update details/i });
  });
});

describe("StaffDetailsForm — pre-population from existing data", () => {
  it("pre-populates full name as first_name + last_name", () => {
    render(<StaffDetailsForm token="tok-123" existing={EXISTING} />);
    screen.getByDisplayValue("Alice Smith");
  });

  it("pre-populates personal email", () => {
    render(<StaffDetailsForm token="tok-123" existing={EXISTING} />);
    screen.getByDisplayValue("alice@example.com");
  });

  it("pre-populates preferred name", () => {
    render(<StaffDetailsForm token="tok-123" existing={EXISTING} />);
    screen.getByDisplayValue("Ali");
  });

  it("pre-populates phone", () => {
    render(<StaffDetailsForm token="tok-123" existing={EXISTING} />);
    screen.getByDisplayValue("0400000000");
  });

  it("pre-populates citizenship status", () => {
    render(<StaffDetailsForm token="tok-123" existing={EXISTING} />);
    const select = document.querySelector('select[name="citizenship_status"]') as HTMLSelectElement;
    expect(select.value).toBe("australian_citizen");
  });
});

describe("StaffDetailsForm — visa fields visibility", () => {
  it("hides visa fields by default (no citizenship status selected)", () => {
    render(<StaffDetailsForm token="tok-123" />);
    expect(screen.queryByText(/visa type/i)).toBeNull();
    expect(screen.queryByText(/visa expiry date/i)).toBeNull();
  });

  it("shows visa fields when Visa Holder is selected", async () => {
    render(<StaffDetailsForm token="tok-123" />);
    const select = document.querySelector('select[name="citizenship_status"]') as HTMLSelectElement;
    await act(async () => {
      fireEvent.change(select, { target: { value: "visa_holder" } });
    });
    screen.getByText(/visa type/i);
    screen.getByText(/visa expiry date/i);
  });

  it("hides visa fields when Australian Citizen is selected", async () => {
    render(<StaffDetailsForm token="tok-123" />);
    const select = document.querySelector('select[name="citizenship_status"]') as HTMLSelectElement;
    await act(async () => {
      fireEvent.change(select, { target: { value: "australian_citizen" } });
    });
    expect(screen.queryByText(/visa type/i)).toBeNull();
  });
});

describe("StaffDetailsForm — submission", () => {
  it("calls submitStaffDetails with token and form data on valid submit", async () => {
    render(<StaffDetailsForm token="tok-abc" />);
    fillRequiredFields();

    fireEvent.click(screen.getByRole("button", { name: /submit details/i }));

    await waitFor(() => {
      expect(mockSubmitStaffDetails).toHaveBeenCalledWith(
        "tok-abc",
        expect.objectContaining({
          full_name: "Jane Doe",
          citizenship_status: "permanent_resident",
        })
      );
    });
  });

  it("shows success message after successful submit", async () => {
    render(<StaffDetailsForm token="tok-123" />);
    fillRequiredFields();

    fireEvent.click(screen.getByRole("button", { name: /submit details/i }));

    await waitFor(() => {
      screen.getByText(/your details have been saved/i);
    });
  });

  it("shows error message when server action returns error", async () => {
    mockSubmitStaffDetails.mockResolvedValue({ error: "Something went wrong" });
    render(<StaffDetailsForm token="tok-123" />);
    fillRequiredFields();

    fireEvent.click(screen.getByRole("button", { name: /submit details/i }));

    await waitFor(() => {
      screen.getByText("Something went wrong");
    });
  });

  it("does not show success message when server action returns error", async () => {
    mockSubmitStaffDetails.mockResolvedValue({ error: "DB error" });
    render(<StaffDetailsForm token="tok-123" />);
    fillRequiredFields();

    fireEvent.click(screen.getByRole("button", { name: /submit details/i }));

    await waitFor(() => {
      expect(screen.queryByText(/your details have been saved/i)).toBeNull();
    });
  });
});
