import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Remove everything a test rendered, so tests never affect each other.
afterEach(() => {
  cleanup();
});
