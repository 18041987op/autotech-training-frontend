/**
 * Lesson Registry
 * Maps module UUID → LessonConfig[]
 *
 * Each LessonConfig has:
 *   id            – unique slug (used for routing and AI sync)
 *   titleKey      – i18n key for the card title
 *   descriptionKey– i18n key for the card description
 *   icon          – emoji icon shown on the card
 *   component     – React component to render the lesson
 *   contentText   – plain English text of the lesson (used by the admin
 *                   "Sync lesson content for AI" button to inject into
 *                   module_resources so AI assessment generation can use it)
 *
 * To add a new lesson:
 *   1. Create the component in src/lessons/
 *   2. Import it below
 *   3. Add an entry to the module's array (or create a new module key)
 *
 * Module UUIDs come from Supabase → modules table → id column.
 */
import { ElectricalCircuitBasics } from "./ElectricalCircuitBasics";

export const lessonRegistry = {
  // ── Procedimientos de Diagnóstico (Eléctrico y Mecánico) ─────────────────
  "7fb7c91a-c97e-40bd-a8b1-5889b7f47e30": [
    {
      id: "electrical-circuit-basics",
      titleKey: "lessons.electricalCircuitBasics.title",
      descriptionKey: "lessons.electricalCircuitBasics.description",
      icon: "⚡",
      component: ElectricalCircuitBasics,
      // Plain English text for AI assessment generation.
      // This gets upserted into module_resources via the admin
      // "Sync lesson content for AI" button.
      contentText: `BASIC LAMP CIRCUIT — INTERACTIVE LESSON

SECTION 1: BASIC LAMP CIRCUIT
A car lamp circuit consists of five components connected in series:
- Battery (12V): The energy source. Provides 12 volts of direct current (DC). Without a battery there is no circuit.
- Fuse: Protects the circuit against overloads. If current exceeds the fuse amperage, the filament breaks and the circuit opens — protecting other components.
- Switch: Controls current flow. In the OPEN position it interrupts the circuit (lamp off). In the CLOSED position it completes the circuit (lamp on).
- Lamp (Load): Converts electrical energy into light and heat. If the lamp does not turn on, the issue could be the lamp itself or any component before it in the circuit.
- Ground: Completes the circuit back to the battery. Without a good ground connection, the circuit does not work even if all other components are functioning correctly.

When the switch is closed, the circuit is complete and current flows from the battery positive terminal through the fuse, switch, and lamp to ground and back to the battery negative terminal. The lamp turns on. When the switch is open, the circuit is broken and the lamp stays off.

If the fuse blows, the circuit opens and the lamp does not turn on. The fuse protects the circuit from excessive current.

SECTION 2: TYPES OF ELECTRICAL FAULTS

Normal Circuit: All components working correctly. Voltage flows from battery through fuse, switch, and lamp to ground. Lamp turns on. Power Probe reads 12V at all test points.

Open Circuit: A break in the circuit prevents current flow. Can be a blown fuse, broken wire, defective switch, or bad ground connection. Lamp does not turn on. Power Probe reads 12V before the open point and 0V after the break.

Short Circuit: A wire or component creates an unintended path to ground before reaching the load. This causes excessive current that immediately blows the fuse. This is the most dangerous fault type. Power Probe reads fuse blown immediately, 0V at the lamp.

High Resistance: A corroded connection, corroded terminal, or damaged wire creates extra resistance in the circuit. The lamp turns on but dimly (lower than normal brightness). Over time can cause overheating and complete failure. Power Probe reads voltage drop at the high-resistance point, for example 9V at the lamp instead of 12V.

Diagnosis Tip: Always start by testing the power source (battery). If the source is good, test each component sequentially toward the load. The point where voltage disappears is where the fault is.

SECTION 3: DIAGNOSIS WITH POWER PROBE
The Power Probe is a DC-powered test light and voltmeter used to diagnose automotive electrical circuits.

Step 1 — Connect Power Probe to Battery: Connect the RED wire to the POSITIVE (+) battery terminal. Connect the BLACK wire to the NEGATIVE (−) terminal or chassis ground. The Power Probe always needs a direct battery reference to work correctly.

Step 2 — Test Battery + Terminal: Touch the Power Probe tip to the positive (+) battery terminal. You should see 12V and the GREEN light turn on. If you do not see 12V here, the problem is the battery — charge or replace it.

Step 3 — Test Fuse Output: Touch the fuse output (the load side). If the fuse is good, you should see 12V. If you see 0V, the fuse is blown. You can test both sides of the fuse — if the input side has voltage but the output side does not, the fuse is blown.

Step 4 — Test Switch Input: Touch the switch input terminal (the one coming from the fuse). You should see 12V here regardless of whether the switch is open or closed. If there is no voltage at the switch input, the problem is before it — check the fuse and wires.

Step 5 — Test Switch Output (with switch ON): With the switch in the ON position, touch its output terminal. If the switch works correctly, you should see 12V. If you see 0V with the switch ON, the switch is defective. This is the key diagnosis: 12V input + 0V output with switch ON = bad switch. Replace the switch.

Step 6 — Verify Lamp Ground: Touch the lamp's ground connection with the Power Probe. If the Power Probe shows a ground signal, the ground is good. A bad ground can cause the lamp to turn on dimly or not at all, even if it has voltage at the input.

SECTION 4: QUIZ QUESTIONS AND CORRECT ANSWERS

Q1: What does the Power Probe show when there is an open circuit on the load side?
Correct Answer: 0V — no voltage at the load.
Explanation: In an open circuit, current cannot flow. The Power Probe will not detect voltage on the load side (after the break point). Before the break point it will still show 12V.

Q2: Where should you connect the BLACK (negative) wire of the Power Probe for accurate readings?
Correct Answer: To the battery negative terminal or a verified chassis ground.
Explanation: The ground reference must be solid and direct. A bad ground will give incorrect readings. Always use the battery negative terminal or a verified chassis ground point.

Q3: You have 12V at the switch input but 0V at its output with the switch in the ON position. What is the problem?
Correct Answer: The switch is defective.
Explanation: 12V at the input and 0V at the output with the switch ON is the definitive diagnosis of a defective switch. The component that has voltage at its input but does not pass it to its output is the failed component.`,
    },
  ],
};
