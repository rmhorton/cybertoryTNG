# DNA Melting Simulation Tuner Specification

## Introduction
This document, **Specs.md**, is the authoritative specification and implementation guide for the DNA Melting Simulation Tuner web application. It defines all functional requirements, parameter standards, user interface behaviors, and incremental development stages.

It is designed for use with OpenAI’s **Codex** coding assistant integrated into **VS Code**. Codex should always reference and follow this file when performing edits to ensure consistency and correctness.

The document serves both as a technical specification and as a workflow guide for human developers. Sections written for Codex are in code blocks; all other sections provide human-readable context and guidance.

---

## Instructions for Codex
```
Use Specs.md as the single source of truth for this project.
Implement only the specified minor version currently in progress.
Maintain complete, working code — no placeholders or stubs.
Preserve layout, styling, and functionality unless explicitly instructed.
Keep all functions consistent with the defined parameter structure.
Each simulation function must use parameters { sequence, temperatures, conditions, params, options }.
Reaction conditions must always include Na, Mg, and conc.
Return objects must follow { temperatures, fractionMelted }.
```

---

## Functional Requirements

### General
- The application must allow users to load experimental reference melting curves and simulate corresponding theoretical curves.
- The interface must provide controls for selecting the reference dataset, choosing a simulation algorithm, and adjusting relevant parameters.
- When parameters or reaction conditions are changed, the simulated curve must update automatically — no manual run button.
- Default temperature range: **40–100 °C**.
- The visualization must overlay reference and simulated curves on the same plot with distinct colors.

### Simulation Functions
Each simulation function in `meltingLib.js` must follow the unified signature:
```js
simulateAlgorithm({ sequence, temperatures, conditions, params, options })
```
where:
- **sequence**: DNA sequence string.
- **temperatures**: Array of numeric temperature values (°C).
- **conditions**: Object containing `{ Na, Mg, conc }` in molar units.
- **params**: Algorithm-specific parameters (e.g., `k`, `window`, `L`, etc.).
- **options**: Reserved for internal flags or advanced settings.

Each function must return an object:
```js
{ temperatures: [...], fractionMelted: [...] }
```

### Algorithm Parameters
All algorithms share the same parameter set, though not all will use each parameter:
- `k`: slope constant controlling sigmoid steepness.
- `window`: local averaging or neighborhood length.
- `L`: domain size parameter for cooperative models.
- `piM`: equilibrium or transition probability.
- `eps`: tolerance threshold for iterative solvers.
- `cooperativity`: coupling strength between adjacent bases.

### Reaction Conditions
Reaction conditions must always include:
- `Na`: Sodium concentration (M)
- `Mg`: Magnesium concentration (M)
- `conc`: Strand concentration (M)

### Visualization
- The canvas plot must clearly distinguish between reference (gray) and simulated (blue) curves.
- The vertical cursor bar should be removed.
- Axis scaling should update dynamically when temperature limits are changed.

---

## Implementation Plan
Each version milestone below includes human-readable goals and tasks, followed by the exact Codex prompt to use in VS Code.

---

### Version 0.1 – Parameter Standardization and Sigmoid Adjustments
**Goal:** Ensure all simulation functions in `meltingLib.js` follow a unified signature and consistent behavior, including `simulateSigmoid`.

**Tasks:**
- Refactor all simulation functions to use `{ sequence, temperatures, conditions, params, options }`.
- Standardize all return objects to `{ temperatures, fractionMelted }`.
- Modify `simulateSigmoid` to incorporate salt and strand concentration effects in Tm.
- Ensure parameter `k` controls curve steepness (spread) and can depend on ionic conditions.

**Codex Prompt:**
```text
Open meltingLib.js and update all simulation functions to use the standardized parameters { sequence, temperatures, conditions, params, options }. Ensure simulateSigmoid accounts for Na, Mg, and conc when computing Tm, and make k affect curve steepness. Preserve all existing algorithms. Follow Specs.md (Version 0.1).
```

---

### Version 0.2 – Dynamic Parameter Controls
**Goal:** Make parameter controls algorithm-aware and automatically adjustable.

**Tasks:**
- Define a parameter schema mapping algorithms to their relevant parameters.
- Automatically render parameter inputs based on selected algorithm.
- Hide irrelevant controls dynamically.
- Trigger immediate updates on parameter change.

**Codex Prompt:**
```text
Open melting_tuner.html. Implement a dynamic parameter control panel that updates available controls based on the selected algorithm, using a paramSchema defined in Specs.md (Version 0.2). When any control changes, rerun the simulation automatically.
```

---

### Version 0.3 – Immediate Simulation Updates
**Goal:** Remove the manual run step and make simulations reactive.

**Tasks:**
- Remove the Run Simulation button.
- Make all parameter, condition, and algorithm changes immediately trigger re-simulation.
- Implement lightweight debouncing for smooth interaction.

**Codex Prompt:**
```text
Modify melting_tuner.html so that the simulation automatically re-runs whenever parameters, reaction conditions, or algorithm selection changes. Remove the Run Simulation button. Ensure performance remains smooth. Follow Specs.md (Version 0.3).
```

---

### Version 0.4 – Temperature Range Defaults and Axis Redraw
**Goal:** Normalize temperature range handling and synchronize axis scaling.

**Tasks:**
- Set 40–100 °C as the default range.
- Rescale both reference and simulated curves whenever the range changes.
- Update axis labels dynamically.

**Codex Prompt:**
```text
Ensure the default temperature range is 40–100 °C and that both curves and axes rescale automatically when tmin, tmax, or tstep are changed. Implement this in melting_tuner.html according to Specs.md (Version 0.4).
```

---

### Version 0.5 – Visualization Refinement
**Goal:** Simplify the interface by removing unneeded visual elements.

**Tasks:**
- Remove the draggable vertical cursor and related handlers.
- Maintain clear color distinction between curves.
- Ensure reference and simulation plots stay synchronized.

**Codex Prompt:**
```text
In melting_tuner.html, remove the draggable vertical cursor and related code. Keep both reference and simulation curves visually distinct and synchronized. Follow Specs.md (Version 0.5).
```

---

### Version 0.6 – Final Integration & Optimization
**Goal:** Finalize performance tuning and code consistency.

**Tasks:**
- Optimize event handling and drawing efficiency.
- Verify correctness across all algorithms.
- Ensure consistent naming conventions and inline documentation.

**Codex Prompt:**
```text
Open melting_tuner.html and meltingLib.js. Perform final cleanup and optimization as specified in Specs.md (Version 0.6). Improve efficiency, verify algorithm accuracy, and ensure full parameter consistency.
```

---

## v0.7.0 — Relocate Strand Concentration Parameter

### Requirements
Move strand concentration (`conc`) out of `conditions` and into `params` so that algorithms not requiring concentration can ignore it cleanly.

**Before:**
```js
handler({ sequence, temperatures, conditions: { Na, Mg, conc }, params, options })
```

**After:**
```js
handler({ sequence, temperatures, conditions: { Na, Mg }, params: { conc, ... }, options })
```

Defaults:
- `params.conc` is molar (M); default `5e-7` if omitted.
- Backward compatibility: accept `conditions.conc` for one minor release cycle (v0.7.x) with automatic transfer to `params.conc` (removed in v0.8).

**Affected algorithms:** Simple Sigmoid, HMM Posterior, Polymer, Thermodynamic.

### Codex Prompt — v0.7.0
```md
**Instruction for Codex (read first):**
Implement v0.7.0 changes to move strand concentration out of `conditions` and into `params`.
- Update all relevant algorithms in `meltingLib.js` to reference `params.conc`.
- Update the tuner app call in `melting_tuner.html` to pass `params.conc` instead of `conditions.conc`.
```

I then ran this additional prompt:
```md
Modify the app interface so that strand concentration is shown with the algorithm parameters, not with the conditions. As with all parameters, the input for strand concentration should only be shown for algorithms that use this parameter.
```
---

## v0.7.1 — Mixed‑Salt Correction (Owczarzy 2008)

### Requirements
Implement the **Owczarzy et al. (2008)** mixed‑salt correction for Mg²⁺ and monovalent cations. This replaces the earlier `Na_eff = Na + 4·Mg` teaching heuristic. The goal is to provide accurate Tm adjustments in the presence of Mg²⁺ while remaining stable and fast in a browser.

**Inputs & Units:**
- Public API: `conditions.Na`, `conditions.Mg` are **mM**; convert to M internally.
- Optional `options.dNTP` (mM) with default `0` to account for Mg²⁺ bound to dNTPs.

**Library API additions:**
```js
melt.ion = {
  // Owczarzy et al. (2008) Biochemistry 47:5336–5353.
  // Computes effective mixed-salt correction for DNA duplex stability.
  // References:
  //   Owczarzy, R., Moreira, B.G., You, Y., Behlke, M.A., & Walder, J.A. (2008).
  //   Predicting stability of DNA duplexes in solutions containing magnesium and monovalent cations.
  //   *Biochemistry*, 47(19), 5336–5353. doi:10.1021/bi702363u
  mixedSalt({ Na_mM, Mg_mM, dNTP_mM = 0, T_C, conc_M }) { /* implement Owczarzy 2008 formula */ }
};
```

- `mixedSalt` computes:
  - `Mg_free` (M) ≈ `max(0, Mg_mM - dNTP_mM) / 1000`
  - Apply Owczarzy mixed-salt ΔTm correction:
    ```js
    // ΔTm = (4.29 * fGC - 3.95) * 1e-5 * log([Na⁺]) + 9.40 * 1e-6 * log([Mg²⁺]) * (1 + 0.7 / L)  (simplified)
    ```
    where constants approximate the empirical model; implement the validated 2008 coefficients in code.
  - Returns `{ I_mono, Mg_free, activityFactor, tmShift_C }`.

**Usage in Thermodynamic model:**
```js
const salt = melt.ion.mixedSalt({ Na_mM, Mg_mM, dNTP_mM, T_C, conc_M });
Tm_adj = Tm_base + salt.tmShift_C;
```

**Other algorithms:**
- *HMM Posterior / Polymer / Sigmoid* use `activityFactor` to adjust transition width.

### Codex Prompt — v0.7.1
```md
**Instruction for Codex (read first):**
Implement v0.7.1 Owczarzy 2008 mixed‑salt correction.
1. Add `melt.ion.mixedSalt` per Owczarzy 2008 (Biochemistry 47:5336–5353).
2. Update Thermodynamic algorithm to apply `tmShift_C`.
3. Update HMM Posterior, Polymer, and Sigmoid to use `activityFactor`.
4. Add caching keyed by (Na, Mg, dNTP, conc, T).
5. Add optional `options.fastSalt` to reuse mid‑range temperature correction.
```

---

## v0.7.2 — Library Self‑Containment and Metadata Registry

### Requirements
Eliminate hard‑coded algorithm lists in apps. The library itself must expose available algorithms and provide a unified runner.

**Exports:**
```js
window.melt.meta = {
  version: '0.7.0',
  algorithms: [
    { id: 'sigmoid', label: 'Simple Sigmoid' },
    { id: 'posterior', label: 'HMM Posterior' },
    { id: 'polymer', label: 'Polymer' },
    { id: 'thermo', label: 'Thermodynamic' }
  ]
};

window.melt.registry = {
  sigmoid: window.melt.Simulate.simulateSigmoid,
  posterior: window.melt.Simulate.simulateHMMPosterior,
  polymer: window.melt.Simulate.simulatePolymer,
  thermo: window.melt.Simulate.simulateThermodynamic
};

window.melt.defaults = {
  // Default ionic conditions: Na⁺=50 mM, Mg²⁺=1 mM.
  conditions: { Na: 50, Mg: 1 },
  params: { conc: 5e-7, window: 15, k: 0.8, L: 20, piM: 0.5, eps: 1e-6 }
};

window.melt.run = function({ id, sequence, temperatures, conditions = {}, params = {}, options = {} }) {
  const fn = window.melt.registry[id];
  if (!fn) throw new Error(`Unknown algorithm id: ${id}`);
  const { Na = 50, Mg = 1 } = conditions; // mM
  const conc = params.conc ?? 5e-7; // M
  return fn({ sequence, temperatures, conditions: { Na, Mg }, params: { ...params, conc }, options });
};
```

### Codex Prompt — v0.7.2
```md
**Instruction for Codex (read first):**
Implement v0.7.2 library self‑containment.
- Add `melt.meta`, `melt.registry`, `melt.defaults`, and `melt.run`.
- Verify tuner app builds dropdowns from `melt.meta.algorithms`.
- Remove `algoOptions` and `simulationMap` from app.
```

---

## v0.7.3 — Algorithm Set Consolidation and UI Migration

### Requirements
Limit the algorithms to four core models:
1. Simple Sigmoid (`id: 'sigmoid'`)
2. HMM Posterior (`id: 'posterior'`)
3. Polymer (`id: 'polymer'`)
4. Thermodynamic (`id: 'thermo'`)

Remove all other algorithms from the library entirely.

**UI:**
The tuner must populate its menu dynamically from `melt.meta.algorithms`.

### Codex Prompt — v0.7.3
```md
**Instruction for Codex (read first):**
Implement v0.7.3 algorithm consolidation and UI migration.
- Modify `meltingLib.js` to implement only the four algorithms.
- In `melting_tuner.html`, generate dropdown from `melt.meta.algorithms`.
- Use `melt.run({ id })` to invoke simulations.
```

---

## Acceptance Tests

1. **Dropdown contents:** only Sigmoid, Posterior, Polymer, Thermo appear.
2. **Conc relocation:** `params.conc` respected.
3. **Mixed‑salt correctness:** Owczarzy 2008 correction reproduces expected ΔTm vs [Mg²⁺].
4. **Self‑containment:** no app‑side mappings.
5. **Regression stability:** Mg=0 reproduces legacy Na‑only curves.

---

## Version Ledger

| Version | Theme | Status |
|---|---|---|
| v0.1–v0.6 | Initial app + library: algorithm menu, parameter UI, axis override, RMSE/MAE, Na⁺/Mg²⁺ inputs, curve drawing, HMM variants, thermodynamic & polymer models, etc. | **DONE** |
| v0.7.0 | API cleanup: move strand concentration | **SPECIFIED** |
| v0.7.1 | **Mixed‑salt correction (Owczarzy 2008)** | **SPECIFIED** |
| v0.7.2 | Library self‑containment (metadata, registry, `melt.run`) | **SPECIFIED** |
| v0.7.3 | Algorithm set consolidation and UI migration | **SPECIFIED** |

---


## Notes

- Mixed‑salt correction is based on **Owczarzy et al. (2008) Biochemistry 47:5336–5353**. All constants and coefficients must follow that publication.
- Older ionic‑strength approximations (e.g., `Na + 4·Mg`) should be retained only as comments or legacy fallbacks for teaching demos.
- The new implementation must cite the paper within `meltingLib.js` using inline code comments for transparency and educational context.

## Using This Document with Codex in VS Code (for human users)

Codex sessions do not retain context between restarts. If you switch workspaces or restart Codex, always re-paste the “Instructions for Codex” block at the start of your prompt — it resets Codex’s behavioral context and ensures consistent adherence to this specification.

1. **Keep Specs.md open in VS Code.** Codex will reference it for each editing session.
2. **Run one version per session.** Provide Codex with the version’s Codex Prompt exactly as written.
3. **Avoid changing multiple files at once** unless the prompt specifies it.
4. **After each version is complete,** review, test, and commit before moving to the next.
5. **If Codex omits sections or functions,** remind it to reread Specs.md and complete the implementation.

---

## Recommended Codex Workflow (for human users)
- Start each new Codex session by pasting the prompt for the target version.
- Keep Specs.md visible in VS Code for reference.
- Run and test the app between milestones.
- Request clarifications or corrections incrementally.

---

## Future Enhancements (Post-v1.0)
- **Automated Parameter Fitting:** Implement parameter optimization to minimize RMSE.
- **Batch Comparison Mode:** Allow simultaneous display of multiple algorithm outputs.
- **Data Export:** Enable exporting fitted results to JSON or CSV.
- **Noise Smoothing:** Add an optional smoothing function for noisy experimental data.
- **UI Enhancements:** Tooltips, presets, and improved layouts for educational use.
