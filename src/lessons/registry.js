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
 * lessonRegistryByTitle allows fallback lookup by module title when UUID is unknown.
 */
import { ElectricalCircuitBasics } from "./ElectricalCircuitBasics";
import { AlternatorAndBattery }     from "./AlternatorAndBattery";
import { OilChange }                from "./OilChange";
import { BrakeSystem }              from "./BrakeSystem";
import { TireService }              from "./TireService";
import { EngineCooling }            from "./EngineCooling";
import { VehicleSafety }            from "./VehicleSafety";
import { JobAssignment }           from "./JobAssignment";

// ─── Lesson configs ───────────────────────────────────────────────────────────

const electricalCircuitLesson = {
  id: "electrical-circuit-basics",
  titleKey: "lessons.electricalCircuitBasics.title",
  descriptionKey: "lessons.electricalCircuitBasics.description",
  icon: "⚡",
  component: ElectricalCircuitBasics,
  contentText: `BASIC LAMP CIRCUIT — INTERACTIVE LESSON

SECTION 1: BASIC LAMP CIRCUIT
A car lamp circuit consists of five components connected in series:
- Battery (12V): The energy source. Provides 12 volts of direct current (DC). Without a battery there is no circuit.
- Fuse: Protects the circuit against overloads. If current exceeds the fuse amperage, the filament breaks and the circuit opens — protecting other components.
- Switch: Controls current flow. In the OPEN position it interrupts the circuit (lamp off). In the CLOSED position it completes the circuit (lamp on).
- Lamp (Load): Converts electrical energy into light and heat. If the lamp does not turn on, the issue could be the lamp itself or any component before it in the circuit.
- Ground: Completes the circuit back to the battery. Without a good ground connection, the circuit does not work even if all other components are functioning correctly.

When the switch is closed, the circuit is complete and current flows from the battery positive terminal through the fuse, switch, and lamp to ground and back to the battery negative terminal. The lamp turns on. When the switch is open, the circuit is broken and the lamp stays off.

SECTION 2: TYPES OF ELECTRICAL FAULTS
Normal Circuit: All components working correctly. Power Probe reads 12V at all test points.
Open Circuit: A break prevents current flow. Power Probe reads 12V before the open point and 0V after.
Short Circuit: Unintended path to ground. Fuse blows immediately. Most dangerous fault type.
High Resistance: Corroded connection creates extra resistance. Lamp turns on dimly. Voltage drop at the high-resistance point.

SECTION 3: DIAGNOSIS WITH POWER PROBE
Step 1 — Connect RED wire to battery POSITIVE (+), BLACK wire to NEGATIVE (−) or chassis ground.
Step 2 — Test Battery + Terminal: Should read 12V with GREEN light.
Step 3 — Test Fuse Output: 12V = fuse good. 0V = fuse blown.
Step 4 — Test Switch Input: Should read 12V regardless of switch position.
Step 5 — Test Switch Output (switch ON): 0V with switch ON = switch defective.
Step 6 — Verify Lamp Ground: Power Probe shows ground signal = good ground.

SECTION 4: QUIZ ANSWERS
Q1: Open circuit on load side → 0V at load.
Q2: BLACK wire → battery negative terminal or verified chassis ground.
Q3: 12V at switch input, 0V at output with switch ON → switch is defective.`,
};

const alternatorLesson = {
  id: "alternator-and-battery",
  titleKey: "lessons.alternatorAndBattery.title",
  descriptionKey: "lessons.alternatorAndBattery.description",
  icon: "🔋",
  component: AlternatorAndBattery,
  contentText: `ALTERNATOR AND BATTERY — INTERACTIVE LESSON

SECTION 1: CHARGING SYSTEM OVERVIEW
The automotive charging system has four main components:
- Battery (12V): Stores electrical energy. At rest: 12.6V fully charged. Below 12.4V needs charging.
- Alternator: Converts mechanical energy (engine rotation via belt) into AC electricity, then rectifies to DC. Output: 13.8–14.8V when engine running.
- Voltage Regulator: Limits alternator output to safe levels (typically 14.5V max) to prevent overcharging the battery.
- Serpentine Belt: Drives the alternator from the engine crankshaft. A broken or slipping belt = no charging.

SECTION 2: BATTERY TESTING
Step 1 — Resting Voltage Test: Battery at rest (engine off, no loads). 12.6V = fully charged. 12.4V = 75%. 12.0V = 25%. Below 11.8V = dead or bad cell.
Step 2 — Load Test: Apply load (headlights on, engine cranking). Voltage should not drop below 9.6V during cranking. Below 9.6V = battery cannot hold load — replace.
Step 3 — Post-Charge Test: After charging, retest resting voltage. If it drops quickly back to low, battery has bad cells — replace.
Step 4 — Hydrometer Test (flooded batteries): Specific gravity 1.265 = fully charged. Below 1.200 = discharged. Variation >0.050 between cells = bad cell.

SECTION 3: ALTERNATOR TESTING
Good alternator: 13.8–14.8V at battery terminals with engine running. Load test: add electrical loads (headlights, AC, blower) — voltage should stay above 13.0V.
Low output (below 13.5V): Worn brushes, bad diodes, failing stator or rotor, slipping belt.
High output (above 15V): Voltage regulator failure — can overcharge and boil battery.
AC Ripple: Set multimeter to AC volts. More than 0.5V AC = bad diodes in the rectifier bridge — replace alternator.

SECTION 4: QUIZ ANSWERS
Q1: Normal alternator output with engine running → 13.8–14.8V DC.
Q2: AC ripple above 0.5V at battery terminals → bad rectifier diodes in alternator.
Q3: Battery cranks fine but dies after driving → alternator not charging (check belt, alternator output).`,
};

const oilChangeLesson = {
  id: "oil-change-fluid-services",
  titleKey: "lessons.oilChange.title",
  descriptionKey: "lessons.oilChange.description",
  icon: "🛢️",
  component: OilChange,
  contentText: `OIL CHANGE & FLUID SERVICES — INTERACTIVE LESSON

SECTION 1: OIL VISCOSITY & SPECIFICATIONS
0W-20: Most modern Honda, Toyota, Mazda, Subaru, newer Ford. Best cold-start protection.
5W-20: Older Ford, Lincoln, some Chrysler/Ram models.
5W-30: Most GM vehicles, older imports, many European models.
5W-40: VW, Audi, BMW, Mercedes, European diesel vehicles.
The "W" number = winter/cold viscosity. The second number = operating viscosity. Always follow manufacturer's specification — using wrong viscosity can cause engine damage.

SECTION 2: DRAIN & FILL PROCEDURE
Step 1 — Position vehicle on lift. Locate drain plug and oil filter. Place drain pan.
Step 2 — Remove drain plug. Allow oil to drain completely (3–5 minutes). Inspect plug threads and gasket.
Step 3 — Replace drain plug. Torque to spec (typically 25–35 ft-lbs). Do not overtighten.
Step 4 — Fill with correct oil and quantity. Check dipstick — must be between MIN and MAX marks.
Step 5 — Start engine, check for leaks. Run to operating temp. Recheck oil level cold. Reset oil life monitor.

SECTION 3: FLUID INSPECTION CHECKLIST
Every oil change: inspect coolant level and condition, brake fluid level and color, power steering fluid, windshield washer fluid, transmission fluid (if accessible dipstick). Document any recommendations on the repair order.

SECTION 4: QUIZ ANSWERS
Q1: Vehicle uses 0W-20 but 5W-30 is available → use correct 0W-20 per spec, not available substitute.
Q2: Oil appears black and gritty → change immediately; contamination accelerates wear.
Q3: Oil level between MIN and MAX marks → acceptable; not full does not mean low.`,
};

const brakeLesson = {
  id: "brake-system-inspection",
  titleKey: "lessons.brakeSystem.title",
  descriptionKey: "lessons.brakeSystem.description",
  icon: "🛑",
  component: BrakeSystem,
  contentText: `BRAKE SYSTEM INSPECTION & SERVICE — INTERACTIVE LESSON

SECTION 1: BRAKE SYSTEM COMPONENTS
Rotor (disc): Cast iron disc rotating with wheel. Must be smooth and within minimum thickness.
Brake Pads: Friction material bonded to metal backing plate. Inner and outer pad per caliper.
Caliper: Hydraulically actuated clamp. Floating caliper slides on caliper pins (must be lubricated with caliper pin grease, NOT regular grease).
Piston: Hydraulic piston pushes pads against rotor when brake pedal pressed.
Brake Hose: Flexible line connecting hard line to caliper. Can swell internally and cause brake drag.

SECTION 2: PAD & ROTOR MEASUREMENT
Brake pad minimum: 2mm (replace at or below). Warn customer at 4mm or less.
Rotor minimum thickness: stamped on rotor edge or hub. Typical passenger car: 20–22mm minimum (new ~28–30mm).
If rotor measures below minimum → must replace, cannot resurface.
If within spec: measure for thickness variation (warping). Max variation: 0.001" (0.025mm). Pulsation complaint = check runout with dial indicator.

SECTION 3: BRAKE BLEEDING
Bleed order: RR → LR → RF → LF (farthest from master cylinder first).
Step 1 — Top off master cylinder reservoir with DOT 3 or DOT 4 (per spec).
Step 2 — Attach clear hose to bleeder screw on RR caliper.
Step 3 — Open bleeder screw ¾ turn. Have helper pump and hold pedal. Close screw before pedal comes up.
Step 4 — Repeat until no air bubbles visible in fluid stream.
Step 5 — Move to LR, RF, LF in order. Top off master cylinder frequently.

SECTION 4: QUIZ ANSWERS
Q1: Brake pad thickness at 2mm → replace immediately (at minimum spec limit).
Q2: Customer complains of pulsating brake pedal → check rotor runout and thickness variation.
Q3: Proper bleeding sequence starting from master cylinder → RR → LR → RF → LF.`,
};

const tireLesson = {
  id: "tire-service-tpms-rotation",
  titleKey: "lessons.tireService.title",
  descriptionKey: "lessons.tireService.description",
  icon: "🔵",
  component: TireService,
  contentText: `TIRE SERVICE, TPMS & ROTATION — INTERACTIVE LESSON

SECTION 1: TIRE SIZING
Example: P225/60R16
- P = Passenger vehicle type
- 225 = Section width in millimeters
- 60 = Aspect ratio (sidewall height is 60% of width)
- R = Radial construction
- 16 = Rim diameter in inches
Never mix tire sizes unless specified. Check load rating and speed rating (e.g., H = 130mph, V = 149mph).

SECTION 2: TPMS & INFLATION
Correct inflation: listed on door jamb sticker (NOT the max pressure on the tire sidewall).
TPMS warning light (! in horseshoe): pressure is 25% or more below recommended.
TPMS sensor service: handle carefully. Do not impact the sensor. Use proper TPMS tool kit.
After mounting: always relearn TPMS sensors (drive relearn or tool relearn per vehicle).
Recommended inflation: typically 30–36 PSI for passenger vehicles. Always check door jamb.

SECTION 3: ROTATION PATTERNS
Forward cross: FWD vehicles. Fronts straight back, rears cross to front.
X-pattern: FWD or AWD. All four tires cross when rotated.
Rearward cross: RWD vehicles. Rears straight forward, fronts cross to rear.
Rotate every 5,000–7,500 miles (or with every oil change).

SECTION 4: QUIZ ANSWERS
Q1: The 225 in P225/60R16 → section width in millimeters.
Q2: TPMS light illuminates → check all four tire pressures with gauge; inflate to door jamb spec.
Q3: FWD vehicle rotation pattern → forward cross (fronts straight back, rears cross forward).`,
};

const coolingLesson = {
  id: "engine-cooling-system",
  titleKey: "lessons.engineCooling.title",
  descriptionKey: "lessons.engineCooling.description",
  icon: "🌡️",
  component: EngineCooling,
  contentText: `ENGINE COOLING SYSTEM SERVICE — INTERACTIVE LESSON

SECTION 1: COOLING SYSTEM COMPONENTS
Radiator: Dissipates heat from coolant. Finned tubes transfer heat to air passing through.
Thermostat: Controls coolant flow based on temperature. Opens at ~195°F. Stuck closed = overheating. Stuck open = slow warmup, heater issues.
Water Pump: Circulates coolant through the system. Belt or chain driven. Failure = overheating quickly.
Expansion/Overflow Tank: Stores excess coolant as it expands when hot. Pressure cap maintains system pressure (typically 13–16 PSI).
Hoses: Upper radiator hose (from engine to radiator top). Lower hose (from radiator bottom to water pump). Check for softness, cracking, bulging, and collapsing.

SECTION 2: COOLANT TYPES & MIXING
Green (IAT): Traditional. Phosphate/silicate based. Service interval: 2 years/30,000 miles.
Orange (DEX-COOL): OAT (Organic Acid Technology). GM vehicles. 5 years/150,000 miles.
Yellow/Blue/Purple: HOAT (Hybrid OAT). Most modern Asian and European vehicles. 5 years/150,000 miles.
Never mix different coolant types — can cause gel-like deposits and premature corrosion.
Always mix 50/50 coolant to water unless using pre-diluted. 50/50 protects to -34°F and boils at 265°F (pressurized).

SECTION 3: PRESSURE TESTING
Step 1 — Let engine cool completely. Never open radiator cap on hot engine.
Step 2 — Attach pressure tester to radiator neck. Pump to cap pressure rating (e.g., 16 PSI).
Step 3 — Hold pressure for 2 minutes. Pressure drops = leak somewhere in system.
Step 4 — Inspect: radiator, hoses, clamps, water pump, heater core, head gasket (bubbles in coolant = combustion leak).
Step 5 — Release pressure slowly. Test cap pressure rating with tester cap adapter.

SECTION 4: QUIZ ANSWERS
Q1: Opening radiator cap on hot engine → dangerous; pressurized steam can cause severe burns.
Q2: Engine overheats only at highway speed → thermostat stuck open OR low coolant/restricted airflow.
Q3: Mixing green and orange coolant → not recommended; different inhibitor packages can react.`,
};

const jobAssignmentLesson = {
  id: "job-assignment-dispatch",
  titleKey: "lessons.jobAssignment.title",
  descriptionKey: "lessons.jobAssignment.description",
  icon: "📋",
  component: JobAssignment,
  contentText: `JOB ASSIGNMENT & DISPATCH — INTERACTIVE LESSON

SECTION 1: THE PRIORITY QUEUE
Each technician is assigned a dispatch number based on technical knowledge and company tenure.
Current dispatch order:
- #1 Romel: Most senior technician. Highest technical knowledge across all systems. First to receive job assignments.
- #2 Juan: Second most senior. Strong diagnostic and repair skills across multiple vehicle systems.
- #3 Eluzahin: Mid-level technician. Developing expertise across common repair categories.
- #4 Kevin: Developing technician. Handles routine services and is building diagnostic skills.
- #5 Ivan: Newest team member. Focused on routine maintenance and basic repairs.

SECTION 2: OVERRIDE RULES (7 rules that change the normal dispatch order)
1. Punctuality: A technician who arrives late without a valid excuse moves to the end of the queue for that day's assignments. Consistent unpunctuality affects the dispatch number long-term.
2. Committed Time: If a technician has already committed to completing a job at a specific time for a customer, they should not receive a new assignment that would conflict with that deadline. Assign to the next available technician.
3. Waiting Room Customer: A customer who is waiting in the waiting room takes priority over the normal queue. The next available technician — regardless of queue order — should take the job to minimize customer wait time.
4. Abandoned Work: If a technician is absent and a job was left incomplete, that job must be reassigned. It goes to the next technician in queue who has the skill to complete it. The original technician loses the job credit.
5. Skill Gap: If the next technician in queue clearly cannot perform the assigned job (lacks the skill), the job passes to the next technician who can. Assigning a job to someone without the skill wastes time for everyone.
6. Rejection Limit: A technician may decline a job assignment. However, after 3 rejections in a single week, the technician moves to the end of the queue for the remainder of that week.
7. Return Vehicle: A vehicle returning for a follow-up on a previous repair goes back to the same technician who did the original work — regardless of queue position. Exception: if that technician is absent or arrived late without excuse, the job follows normal queue order.

SECTION 3: SCENARIO PRACTICE
Scenario 1 — Waiting Room Customer: Normal queue is Romel→Juan→Eluzahin. A new customer just arrived and is waiting in the waiting room. Eluzahin just finished a job. Who gets the next assignment? Answer: Eluzahin — waiting room rule overrides normal rotation; the next available technician takes it.
Scenario 2 — Return Vehicle: A customer's car is back for a follow-up on brake work done last week by Kevin. Romel and Juan are next in queue. Who gets the job? Answer: Kevin — return vehicle rule means the original technician gets the follow-up regardless of queue.
Scenario 3 — Late Arrival: Ivan arrived 45 minutes late this morning with no notification. He's normally #5. Where does he go in today's queue? Answer: End of queue after all present technicians — punctuality override applies.
Scenario 4 — Abandoned Work: Juan is absent today. He had a half-finished transmission job from yesterday. Eluzahin is next in queue but is not certified for transmission. Kevin is also not certified. Who takes the job? Answer: Romel — skill gap rule means the job goes to the next technician with the required skill.

SECTION 4: QUIZ ANSWERS
Q1: Dispatch numbers are assigned based on technical knowledge + company tenure (not seniority alone, not alphabetical, not hours billed).
Q2: Waiting room customer rule — the next available technician takes the job, bypassing normal queue order.
Q3: Abandoned work rule — if the original technician is absent, the job goes to the next qualified technician in queue.`,
};

const vehicleSafetyLesson = {
  id: "vehicle-safety-lift-operation",
  titleKey: "lessons.vehicleSafety.title",
  descriptionKey: "lessons.vehicleSafety.description",
  icon: "🏗️",
  component: VehicleSafety,
  contentText: `VEHICLE SAFETY & LIFT OPERATION — INTERACTIVE LESSON

SECTION 1: LIFT TYPES
2-Post Lift: Most common shop lift. Two columns with swing arms. Best for most undercar service. Must locate arms on vehicle pinch weld lift points.
4-Post Lift: Vehicle drives onto runways. Best for alignments, transmission work, and heavy vehicles. More stable platform.
Scissor Lift: Compact. Raises from center. Good for quick undercar access. Found at quick-lube shops.
Floor Jack: Portable. Must use with jack stands. Never work under a vehicle supported only by a floor jack.

SECTION 2: SAFE LIFT PROCEDURE
Step 1 — Inspect lift for damage, check cables, arms, and pads before use.
Step 2 — Position vehicle on lift. Locate manufacturer pinch weld lift points on door jamb sticker.
Step 3 — Raise vehicle slowly to working height. Stop midway to verify arm contact.
Step 4 — Engage lift safety locks. Never work under a vehicle with locks disengaged.
Step 5 — Before lowering: clear area, remove tools and parts from under vehicle.
CRITICAL: Always engage safety locks. A lift without engaged locks can drop unexpectedly.

SECTION 3: PPE & SAFETY RULES
Required PPE: Safety glasses (always), nitrile gloves, steel-toe boots, shop jacket/apron.
Remove before working: rings, watches, loose jewelry, loose clothing (caught in moving parts = serious injury).
Never work under a car supported only by a floor jack.
Keep lift area clear of people and obstructions.
If unsure about lift points: check AllData or Mitchell, or ask supervisor.

SECTION 4: QUIZ ANSWERS
Q1: Vehicle lift arm won't engage safety lock → do NOT use the lift; tag out and report to supervisor.
Q2: Correct lift point location → door jamb sticker or factory service manual pinch weld diagram.
Q3: Working under vehicle with floor jack → always use jack stands; never rely on jack alone.`,
};

// ─── Main registry by UUID ─────────────────────────────────────────────────────
export const lessonRegistry = {
  // ── Electrical Diagnostics Fundamentals ────────────────────────────────────
  "7fb7c91a-c97e-40bd-a8b1-5889b7f47e30": [
    electricalCircuitLesson,
    alternatorLesson,
  ],

  // ── Oil Change & Fluid Services ────────────────────────────────────────────
  // (UUID filled in when known; lessonRegistryByTitle is the fallback)
};

// ─── Fallback registry by module title ────────────────────────────────────────
// Used when module UUID is not yet registered above.
// Keys must match the module.title field exactly as stored in Supabase.
export const lessonRegistryByTitle = {
  "Electrical Diagnostics Fundamentals": [
    electricalCircuitLesson,
    alternatorLesson,
  ],
  "Oil Change & Fluid Services": [
    oilChangeLesson,
  ],
  "Brake System Inspection & Service": [
    brakeLesson,
  ],
  "Tire Service, TPMS & Rotation": [
    tireLesson,
  ],
  "Engine Cooling System Service": [
    coolingLesson,
  ],
  "Vehicle Safety & Lift Operation": [
    vehicleSafetyLesson,
  ],
  "Scheduling & Shop Loading": [
    jobAssignmentLesson,
  ],
};
