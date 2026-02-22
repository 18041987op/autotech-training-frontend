/**
 * Lesson Registry
 * Maps module UUID → interactive lesson component.
 *
 * To add a new lesson:
 *   1. Create the component in src/lessons/
 *   2. Import it below
 *   3. Add the module's UUID as the key
 *
 * Module UUIDs come from Supabase → modules table → id column.
 */
// eslint-disable-next-line no-unused-vars
import { ElectricalCircuitBasics } from "./ElectricalCircuitBasics";

export const lessonRegistry = {
  // ── Electrical Diagnostics Fundamentals ──────────────────────────────────
  // Replace with the actual UUID from Supabase for this module:
  // "PASTE-MODULE-UUID-HERE": ElectricalCircuitBasics,

  // Example (uncomment and replace UUID after checking Supabase):
  // "7fb7c91a-c975-4b2d-a811-00526c20d48c": ElectricalCircuitBasics,
};
