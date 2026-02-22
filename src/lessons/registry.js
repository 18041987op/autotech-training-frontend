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
import { ElectricalCircuitBasics } from "./ElectricalCircuitBasics";

export const lessonRegistry = {
  // ── Procedimientos de Diagnóstico (Eléctrico y Mecánico) ─────────────────
  "7fb7c91a-c97e-40bd-a8b1-5889b7f47e30": ElectricalCircuitBasics,
};
