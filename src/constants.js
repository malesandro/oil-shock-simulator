// Pre-war reference prices used as the baseline against which the model and
// the UI compute "percent change since before the war began (Feb 28, 2026)."
// Keep these here so the engine, situation display, and household calculator
// can't drift apart silently.
export const PRE_WAR_OIL = 65; // Brent $/bbl, early 2026 pre-crisis level
export const PRE_WAR_GAS = 35; // EU TTF €/MWh, early 2026 pre-crisis level

// War start anchors month numbering: month 1 = March 2026, month 3 = May 2026, etc.
export const WAR_START = new Date('2026-02-28');
