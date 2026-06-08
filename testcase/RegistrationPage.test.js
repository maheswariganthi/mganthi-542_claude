/**
 * Jest Test Suite — RegistrationPage
 * ───────────────────────────────────
 * Framework : Jest + React Testing Library
 * Renderer  : jsdom
 *
 * ── Setup ──────────────────────────────────────────────────────────────────
 * 1. Install deps
 *    npm install --save-dev jest jest-environment-jsdom \
 *      @testing-library/react @testing-library/jest-dom \
 *      @testing-library/user-event \
 *      babel-jest @babel/core @babel/preset-env @babel/preset-react
 *
 * 2. jest.config.js
 *    module.exports = {
 *      testEnvironment: 'jsdom',
 *      setupFilesAfterFramework: ['<rootDir>/jest.setup.js'],
 *      transform: { '^.+\\.[jt]sx?$': 'babel-jest' },
 *      moduleNameMapper: { '\\.(css|less|scss)$': 'identity-obj-proxy' }
 *    };
 *
 * 3. jest.setup.js
 *    import '@testing-library/jest-dom';
 *
 * 4. babel.config.js
 *    module.exports = {
 *      presets: [
 *        ['@babel/preset-env', { targets: { node: 'current' } }],
 *        ['@babel/preset-react', { runtime: 'automatic' }]
 *      ]
 *    };
 *
 * 5. Run
 *    npx jest RegistrationPage.test.js
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import RegistrationPage, { validate, getStrength } from "./RegistrationPage";

// ─── Shared helpers ───────────────────────────────────────────────────────────

/** Mount the page and return shortcut accessors. */
const setup = () => {
  render(<RegistrationPage />);
  return {
    firstName:       () => screen.getByTestId("input-firstName"),
    lastName:        () => screen.getByTestId("input-lastName"),
    email:           () => screen.getByTestId("input-email"),
    password:        () => screen.getByTestId("input-password"),
    confirmPassword: () => screen.getByTestId("input-confirmPassword"),
    agreed:          () => screen.getByTestId("checkbox-agreed"),
    submitBtn:       () => screen.getByTestId("submit-btn"),
  };
};

/** Fill every field with valid data. */
const fillValidForm = async (user, s) => {
  await user.type(s.firstName(),       "Jane");
  await user.type(s.lastName(),        "Doe");
  await user.type(s.email(),           "jane@example.com");
  await user.type(s.password(),        "Secret@123");
  await user.type(s.confirmPassword(), "Secret@123");
  await user.click(s.agreed());
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. UNIT — validate()
// ─────────────────────────────────────────────────────────────────────────────

describe("validate() — unit tests", () => {
  const base = {
    firstName: "Jane", lastName: "Doe",
    email: "jane@example.com",
    password: "Secret@123", confirmPassword: "Secret@123",
    agreed: true,
  };

  test("returns empty object for fully valid input", () => {
    expect(validate(base)).toEqual({});
  });

  test("flags missing firstName", () => {
    expect(validate({ ...base, firstName: "" })).toHaveProperty("firstName");
  });

  test("flags firstName that is only whitespace", () => {
    expect(validate({ ...base, firstName: "   " })).toHaveProperty("firstName");
  });

  test("flags missing lastName", () => {
    expect(validate({ ...base, lastName: "" })).toHaveProperty("lastName");
  });

  test("flags missing email", () => {
    expect(validate({ ...base, email: "" })).toHaveProperty("email");
  });

  test("flags malformed email — no @", () => {
    const errs = validate({ ...base, email: "notanemail" });
    expect(errs.email).toMatch(/valid email/i);
  });

  test("flags malformed email — no domain", () => {
    const errs = validate({ ...base, email: "user@" });
    expect(errs.email).toMatch(/valid email/i);
  });

  test("flags missing password", () => {
    expect(validate({ ...base, password: "", confirmPassword: "" }))
      .toHaveProperty("password");
  });

  test("flags password shorter than 8 characters", () => {
    const errs = validate({ ...base, password: "abc", confirmPassword: "abc" });
    expect(errs.password).toMatch(/8 characters/i);
  });

  test("flags missing confirmPassword", () => {
    expect(validate({ ...base, confirmPassword: "" }))
      .toHaveProperty("confirmPassword");
  });

  test("flags mismatched passwords", () => {
    const errs = validate({ ...base, confirmPassword: "Other@999" });
    expect(errs.confirmPassword).toMatch(/do not match/i);
  });

  test("flags unchecked terms", () => {
    expect(validate({ ...base, agreed: false })).toHaveProperty("agreed");
  });

  test("can return multiple errors simultaneously", () => {
    const errs = validate({
      firstName: "", lastName: "", email: "bad",
      password: "", confirmPassword: "", agreed: false,
    });
    expect(Object.keys(errs).length).toBeGreaterThan(3);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. UNIT — getStrength()
// ─────────────────────────────────────────────────────────────────────────────

describe("getStrength() — unit tests", () => {
  test("returns 0 for empty string", () => {
    expect(getStrength("")).toBe(0);
  });

  test("returns 1 for a long lowercase-only password", () => {
    expect(getStrength("abcdefgh")).toBe(1); // length ✓ only
  });

  test("returns 2 for length + uppercase", () => {
    expect(getStrength("Abcdefgh")).toBe(2);
  });

  test("returns 3 for length + uppercase + digit", () => {
    expect(getStrength("Abcdefg1")).toBe(3);
  });

  test("returns 4 for all criteria (length + upper + digit + symbol)", () => {
    expect(getStrength("Secret@1")).toBe(4);
  });

  test("short password with all character types scores only what length allows", () => {
    // "A1!" is only 3 chars — fails length check (score 0 for length) → max 3
    expect(getStrength("A1!")).toBe(3);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. RENDERING
// ─────────────────────────────────────────────────────────────────────────────

describe("Rendering", () => {
  test("renders the registration form", () => {
    setup();
    expect(screen.getByTestId("reg-form")).toBeInTheDocument();
  });

  test("renders all six input controls", () => {
    const s = setup();
    expect(s.firstName()).toBeInTheDocument();
    expect(s.lastName()).toBeInTheDocument();
    expect(s.email()).toBeInTheDocument();
    expect(s.password()).toBeInTheDocument();
    expect(s.confirmPassword()).toBeInTheDocument();
    expect(s.agreed()).toBeInTheDocument();
  });

  test("submit button is present and enabled by default", () => {
    const s = setup();
    expect(s.submitBtn()).toBeInTheDocument();
    expect(s.submitBtn()).not.toBeDisabled();
  });

  test("renders the page heading", () => {
    setup();
    expect(screen.getByText(/join us today/i)).toBeInTheDocument();
  });

  test("does not show success screen on initial render", () => {
    setup();
    expect(screen.queryByTestId("success-message")).not.toBeInTheDocument();
  });

  test("password and confirmPassword fields start as type=password", () => {
    const s = setup();
    expect(s.password()).toHaveAttribute("type", "password");
    expect(s.confirmPassword()).toHaveAttribute("type", "password");
  });

  test("strength bar is hidden when password is empty", () => {
    setup();
    expect(screen.queryByTestId("strength-bar")).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. VALIDATION — empty submit
// ─────────────────────────────────────────────────────────────────────────────

describe("Validation: empty form submit", () => {
  test("shows error messages for all required fields", async () => {
    const user = userEvent.setup();
    const s = setup();
    await user.click(s.submitBtn());

    expect(screen.getByTestId("error-firstName")).toBeInTheDocument();
    expect(screen.getByTestId("error-lastName")).toBeInTheDocument();
    expect(screen.getByTestId("error-email")).toBeInTheDocument();
    expect(screen.getByTestId("error-password")).toBeInTheDocument();
    expect(screen.getByTestId("error-confirmPassword")).toBeInTheDocument();
    expect(screen.getByTestId("error-agreed")).toBeInTheDocument();
  });

  test("does not show success screen when form is empty", async () => {
    const user = userEvent.setup();
    const s = setup();
    await user.click(s.submitBtn());
    expect(screen.queryByTestId("success-message")).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. VALIDATION — individual field rules
// ─────────────────────────────────────────────────────────────────────────────

describe("Validation: individual fields", () => {
  test("shows invalid-email error for badly formed email", async () => {
    const user = userEvent.setup();
    const s = setup();
    await user.type(s.email(), "not-an-email");
    await user.click(s.submitBtn());
    expect(screen.getByTestId("error-email")).toHaveTextContent(/valid email/i);
  });

  test("shows error when password is under 8 characters", async () => {
    const user = userEvent.setup();
    const s = setup();
    await user.type(s.password(), "short");
    await user.click(s.submitBtn());
    expect(screen.getByTestId("error-password")).toHaveTextContent(/8 characters/i);
  });

  test("shows error when passwords do not match", async () => {
    const user = userEvent.setup();
    const s = setup();
    await user.type(s.password(), "Secret@123");
    await user.type(s.confirmPassword(), "Different!9");
    await user.click(s.submitBtn());
    expect(screen.getByTestId("error-confirmPassword"))
      .toHaveTextContent(/do not match/i);
  });

  test("shows terms error when checkbox is unchecked", async () => {
    const user = userEvent.setup();
    const s = setup();
    await user.type(s.firstName(),       "Jane");
    await user.type(s.lastName(),        "Doe");
    await user.type(s.email(),           "jane@example.com");
    await user.type(s.password(),        "Secret@123");
    await user.type(s.confirmPassword(), "Secret@123");
    // intentionally skip the checkbox
    await user.click(s.submitBtn());
    expect(screen.getByTestId("error-agreed")).toBeInTheDocument();
  });

  test("clears firstName error once user types a value", async () => {
    const user = userEvent.setup();
    const s = setup();
    await user.click(s.submitBtn());
    expect(screen.getByTestId("error-firstName")).toBeInTheDocument();
    await user.type(s.firstName(), "J");
    expect(screen.queryByTestId("error-firstName")).not.toBeInTheDocument();
  });

  test("clears email error once user corrects the value", async () => {
    const user = userEvent.setup();
    const s = setup();
    await user.type(s.email(), "bad");
    await user.click(s.submitBtn());
    expect(screen.getByTestId("error-email")).toBeInTheDocument();
    await user.clear(s.email());
    await user.type(s.email(), "good@example.com");
    expect(screen.queryByTestId("error-email")).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. PASSWORD VISIBILITY TOGGLE
// ─────────────────────────────────────────────────────────────────────────────

describe("Password visibility toggle", () => {
  test("clicking toggle-password switches type to text", async () => {
    const user = userEvent.setup();
    const s = setup();
    await user.click(screen.getByTestId("toggle-password"));
    expect(s.password()).toHaveAttribute("type", "text");
  });

  test("clicking toggle-password twice restores type to password", async () => {
    const user = userEvent.setup();
    const s = setup();
    await user.click(screen.getByTestId("toggle-password"));
    await user.click(screen.getByTestId("toggle-password"));
    expect(s.password()).toHaveAttribute("type", "password");
  });

  test("clicking toggle-confirm switches confirmPassword type to text", async () => {
    const user = userEvent.setup();
    const s = setup();
    await user.click(screen.getByTestId("toggle-confirm"));
    expect(s.confirmPassword()).toHaveAttribute("type", "text");
  });

  test("toggling confirm does not affect the main password field", async () => {
    const user = userEvent.setup();
    const s = setup();
    await user.click(screen.getByTestId("toggle-confirm"));
    expect(s.password()).toHaveAttribute("type", "password");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. PASSWORD STRENGTH INDICATOR
// ─────────────────────────────────────────────────────────────────────────────

describe("Password strength indicator", () => {
  test("strength bar appears when user types in password field", async () => {
    const user = userEvent.setup();
    const s = setup();
    await user.type(s.password(), "a");
    expect(screen.getByTestId("strength-bar")).toBeInTheDocument();
  });

  test("renders exactly 4 strength segments", async () => {
    const user = userEvent.setup();
    const s = setup();
    await user.type(s.password(), "abc");
    for (let i = 1; i <= 4; i++) {
      expect(screen.getByTestId(`strength-seg-${i}`)).toBeInTheDocument();
    }
  });

  test("first segment is active for a weak password (strength = 1)", async () => {
    const user = userEvent.setup();
    const s = setup();
    await user.type(s.password(), "abcdefgh"); // only length qualifies
    expect(screen.getByTestId("strength-seg-1")).toHaveClass("active-1");
    expect(screen.getByTestId("strength-seg-2")).not.toHaveClass(/active/);
  });

  test("all four segments active for a strong password (strength = 4)", async () => {
    const user = userEvent.setup();
    const s = setup();
    await user.type(s.password(), "Secret@123"); // all 4 criteria
    for (let i = 1; i <= 4; i++) {
      expect(screen.getByTestId(`strength-seg-${i}`)).toHaveClass("active-4");
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. FORM SUBMISSION
// ─────────────────────────────────────────────────────────────────────────────

describe("Form submission", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(()  => jest.useRealTimers());

  test("submit button becomes disabled while loading", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const s = setup();
    await fillValidForm(user, s);
    await user.click(s.submitBtn());
    // button disabled immediately after click (before timer resolves)
    expect(s.submitBtn()).toBeDisabled();
    jest.runAllTimers();
  });

  test("shows success message after API call completes", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const s = setup();
    await fillValidForm(user, s);
    await user.click(s.submitBtn());
    jest.runAllTimers();
    await waitFor(() =>
      expect(screen.getByTestId("success-message")).toBeInTheDocument()
    );
  });

  test("success message includes the submitted email", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const s = setup();
    await fillValidForm(user, s);
    await user.click(s.submitBtn());
    jest.runAllTimers();
    await waitFor(() =>
      expect(screen.getByTestId("success-message"))
        .toHaveTextContent("jane@example.com")
    );
  });

  test("registration form is removed after successful submission", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const s = setup();
    await fillValidForm(user, s);
    await user.click(s.submitBtn());
    jest.runAllTimers();
    await waitFor(() =>
      expect(screen.queryByTestId("reg-form")).not.toBeInTheDocument()
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. ACCESSIBILITY
// ─────────────────────────────────────────────────────────────────────────────

describe("Accessibility", () => {
  test("all inputs are reachable via accessible labels (getByLabelText)", () => {
    setup();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  test("toggle password button has aria-label", () => {
    setup();
    expect(screen.getByTestId("toggle-password"))
      .toHaveAttribute("aria-label");
  });

  test("toggle confirm button has aria-label", () => {
    setup();
    expect(screen.getByTestId("toggle-confirm"))
      .toHaveAttribute("aria-label");
  });

  test("submit button has descriptive text content", () => {
    const s = setup();
    expect(s.submitBtn()).toHaveTextContent(/create account/i);
  });
});
