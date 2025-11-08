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

## Correcting Errors

This prompt was used to correct the salt adjustment.

```md
**Instruction for Codex (read first):**
Implement targeted corrections to `meltingLib.js` that fix the strand-concentration behavior in the Polymer algorithm.

### Objectives
1. **Remove strand concentration (`conc`) from the salt activityFactor.**
   - In `melt.ion.mixedSalt`, delete the term that modifies `activityFactor` based on `conc`.
   - The resulting expression should depend only on ionic strength (Na⁺ and Mg²⁺):
     ```js
     const activityFactor = Math.max(
       0.2,
       1 + 0.35 * melt.Thermo.log10(ionicStrength)
     );
     ```
   - Keep `conc` in the argument list and in the cache key, but do not use it inside this formula.

2. **Introduce concentration scaling into the Polymer model at the initiation stage.**
   - In `melt.Simulate.simulatePolymer`, locate the existing constant:
     ```js
     const Beta = 1e-7;
     ```
   - Replace it with a term that scales with strand concentration:
     ```js
     const Ct = Math.max(1e-12, params?.conc ?? 0.5e-6); // molar
     // Preserve the original numeric scale at 0.5 µM
     const Beta = 1e-7 * (Ct / 0.5e-6);
     ```
   - Comment that this reflects the proper dependence of duplex initiation on strand pairing probability.

3. **Verify correct directionality.**
   - After modification, increasing `params.conc` should **increase** Tm and shift the melting curve to higher temperatures.
   - Changes in Na⁺/Mg²⁺ should continue to shift the curve according to the mixed-salt correction.

4. **Leave other algorithms untouched.**
   - Do not alter `simulateThermodynamic`, `simulateSigmoid`, or any caching logic.

### Test checklist
- Run the Polymer simulation with `conc = 0.5e-6` and again with `conc = 5e-6`.  
  The higher-concentration run should melt at a higher temperature.
- Ensure thermodynamic and sigmoid curves are unchanged.
- Keep reference citations and log10 helper as they are.

### Summary of file edits
| Section | Change |
|----------|--------|
| `melt.ion.mixedSalt` | remove `- 0.04 * log10(conc)` term |
| `simulatePolymer` | scale `Beta` by `(conc / 0.5e-6)` |
| Comments | explain rationale and reference SantaLucia (1998) and Owczarzy (2008) |

```
After saving, rebuild and compare Polymer curves against the DECIPHER *MeltDNA* reference; the new curves should retain correct salt behavior and show higher Tm for higher strand concentrations.


v0.7.3.2: This prompt was used to switch to legacy behavior at very low Mg and strand concentrations:

```md
**Instruction for Codex (read first):**
Update `simulatePolymer` to gracefully revert to legacy behavior when both Mg and strand concentration are extremely low.

Implementation notes:
- Define `useLegacy = (Mg < 1e-6 && Ct < 1e-9)`.
- If true:
  - Skip mixed-salt correction and keep `Beta = 1e-7`.
  - Set `activityFactor = 1.0`.
  - Proceed with the same recursion, ensuring identical results to the original Polymer method.
- Otherwise, use the full Owczarzy mixed-salt correction and scaled Beta.
- Document this threshold with a code comment explaining that it preserves backward compatibility with the DECIPHER MeltDNA reference.
```

v0.7.3.3: smooth blending between legacy and mixed-salt behavior.

```md
**Instruction for Codex (read first):**
Modify `simulatePolymer` and related salt handling to make the legacy behavior continuous rather than thresholded.

### Tasks
1. **Remove hard threshold logic**  
   Delete any `if (Mg < ...) return legacy` or equivalent block that switches entirely to the old behavior.

2. **Introduce a blending factor**  
   Add a smooth weight that gradually transitions between the legacy and mixed-salt behaviors:
   ```js
   const MgWeight = Math.min(1, Mg / 1e-3);   // fades in by ~1 mM
   const CtWeight = Math.min(1, Ct / 1e-8);   // fades in by ~10 nM
   const w = Math.max(MgWeight, CtWeight);    // choose whichever dominates
   ```

3. **Always compute mixed-salt correction, then blend results**  
   Use the mixed-salt correction but fade its influence in smoothly:
   ```js
   const salt = melt.ion.mixedSalt({ Na, Mg, conc: Ct, T });
   const activity = 1.0 * (1 - w) + salt.activityFactor * w;
   const tmShift  = 0.0 * (1 - w) + salt.tmShift_C * w;
   ```

4. **Blend Beta with strand concentration scaling**  
   Instead of a discrete switch, fade in the concentration effect:
   ```js
   const Beta = 1e-7 * ((1 - w) + w * (Ct / 0.5e-6));
   ```

5. **Replace existing `activityFactor` and `Beta` definitions**  
   Use these blended quantities wherever the Polymer recursion references them.

6. **Add explanatory comments**  
   Document that this ensures a continuous asymptotic transition:
   - As Mg→0 and Ct→0, behavior matches the original Polymer model.
   - As Mg or Ct increase, melting curves transition smoothly to the mixed-salt regime.
   - No discontinuous jumps occur when Mg crosses an arbitrary threshold.

7. **Verification**  
   - Confirm that increasing Mg or strand concentration gradually shifts the melting curve upward.
   - Verify that with Mg=0 and Ct≈0, results match the legacy DECIPHER-based Polymer curves.
   - Keep all other algorithms unchanged and maintain mixed-salt caching as before.

```

v0.7.3.4: More smooth blending.

```md
**Instruction for Codex (read first):**
Implement a smooth, continuous blending mechanism for the Polymer algorithm so that the transition between the legacy (low-Mg, low-strand-concentration) and mixed-salt regimes is gradual and physically consistent.

### Tasks
1. **Replace existing linear blend logic**  
   Remove or comment out the current block:
   ```js
   const MgWeight = Math.min(1, Mg / 1e-3);
   const CtWeight = Math.min(1, Ct / 1e-8);
   const blendWeight = Math.max(MgWeight, CtWeight);
   ```

2. **Add a smooth logistic (Hill-type) weighting function**  
   Implement continuous weighting on free Mg²⁺ and strand concentration:
   ```js
   const MgFree = Math.max(0, Mg - (params?.dNTP ?? 0)); // M
   const Ct = Math.max(1e-12, params?.conc ?? 0.5e-6);   // M

   const K_Mg = 1e-3, n_Mg = 2;   // half-activation around 1 mM
   const K_Ct = 1e-8, n_Ct = 2;   // half-activation around 10 nM

   const wMg = 1 / (1 + Math.pow(K_Mg / Math.max(1e-12, MgFree), n_Mg));
   const wCt = 1 / (1 + Math.pow(K_Ct / Math.max(1e-15, Ct),    n_Ct));
   const blendWeight = Math.max(wMg, wCt);
   ```

3. **Use the blended weight for all downstream quantities**  
   Maintain smooth transitions:
   ```js
   const salt = melt.ion.mixedSalt({ Na, Mg, conc: Ct, T });
   const activity = (1 - blendWeight) * 1.0 + blendWeight * salt.activityFactor;
   const tmShift  = (1 - blendWeight) * 0.0 + blendWeight * salt.tmShift_C;
   const Beta     = 1e-7 * ((1 - blendWeight) + blendWeight * (Ct / 0.5e-6));
   ```
   These replace any existing discrete or thresholded versions of `activityFactor`, `tmShift`, and `Beta`.

4. **Avoid special-case branches**  
   Do not use conditions like `if (blendWeight === 0)` or `if (blendWeight === 1)`.
   Always compute the blended values for numerical smoothness.

5. **Add explanatory comments**  
   Clarify in the code that:
   - As Mg²⁺ → 0 and strand concentration → 0, the algorithm reproduces the legacy Polymer model.
   - As Mg²⁺ or concentration increases, the model transitions smoothly to the mixed-salt regime.
   - This prevents discontinuities (e.g., jumps around 1 mM Mg) and yields physically continuous melting curves.

6. **Verification**  
   - Sweep Mg from 0 → 2 mM at fixed Ct to confirm smooth Tₘ evolution.
   - Sweep Ct from 0 → 100 nM at Mg=0; verify monotonic behavior.
   - Confirm that Mg=0, Ct≈0 reproduces legacy DECIPHER-like curves.
   - No discontinuous jumps should occur near the former 1 mM threshold.

```

v0.7.3.5: Instrument the Polymer algorithm to report both the unadjusted (baseline) and salt-corrected (adjusted) melting temperatures so we can see exactly where the sign or magnitude of the ΔTm shift is coming from.

```md
**Instruction for Codex (read first):**
Augment the Polymer melting algorithm with internal diagnostics to output both the *baseline* and *adjusted* melting temperatures, enabling verification of salt-correction direction and magnitude.

### Tasks

1. **Add optional diagnostic logging**
   - Add a new boolean flag `options.diagnostics` (default `false`).
   - When `options.diagnostics` is `true`, the function should record:
     ```js
     {
       Tm_base: <°C before any salt or conc correction>,
       Tm_adj:  <°C after applying salt.tmShift_C and concentration blend>,
       deltaTm: Tm_adj - Tm_base,
       salt: { tmShift_C, activityFactor, Na_mM, Mg_mM, dNTP_mM, conc_M }
     }
     ```
   - Include this object as `diagnostics` in the returned value from `simulatePolymer()`.

2. **Capture both stages**
   - Compute the baseline curve normally (before applying mixed-salt or concentration adjustments).
   - Store the midpoint temperature of that curve as `Tm_base`.
   - Apply the mixed-salt and concentration corrections (activityFactor, tmShift_C, Beta blending, etc.).
   - Recompute or interpolate the adjusted midpoint as `Tm_adj`.
   - Compute `deltaTm = Tm_adj - Tm_base`.

3. **Emit diagnostics cleanly**
   - The return value of `simulatePolymer()` should remain the same (with `temperatures` and `fractionMelted` arrays), but include:
     ```js
     return {
       temperatures,
       fractionMelted,
       diagnostics: diagnosticsObject
     };
     ```
   - If `options.diagnostics` is `false`, omit the property.

4. **Implement helper for midpoint detection**
   - Add a small internal helper:
     ```js
     function findTm(y, temps) {
       const i = y.findIndex(p => p >= 0.5);
       if (i <= 0 || i >= temps.length - 1) return NaN;
       const frac = (0.5 - y[i - 1]) / (y[i] - y[i - 1]);
       return temps[i - 1] + frac * (temps[i] - temps[i - 1]);
     }
     ```
   - Use this to compute `Tm_base` and `Tm_adj`.

5. **Update mixed-salt comment**
   - Immediately above where `salt.tmShift_C` is applied, add a comment reminding that positive `tmShift_C` should *increase* duplex stability (raise Tₘ).  

     ```js
     // Note: Positive tmShift_C should correspond to *higher* Tm as Mg²⁺ increases.
     ```

6. **Verification checklist**
   - Run the harness with `options.diagnostics: true` and log the returned `diagnostics` object.
   - Confirm:
     - `Tm_base` is constant across Mg sweep.
     - `Tm_adj` increases with Mg (positive deltaTm).
     - If deltaTm is negative, the correction sign must be flipped in `melt.ion.mixedSalt`.

7. **Return format example**
   ```js
   {
     temperatures: [...],
     fractionMelted: [...],
     diagnostics: {
       Tm_base: 53.8,
       Tm_adj: 56.4,
       deltaTm: +2.6,
       salt: {
         tmShift_C: +2.6,
         activityFactor: 1.08,
         Na_mM: 50,
         Mg_mM: 1,
         dNTP_mM: 0,
         conc_M: 5e-7
       }
     }
   }

```


**Instruction for Codex (read first):**
Implement version **v0.7.6 — Empirical Mg²⁺ correction and graceful blending**
to replace the simplified mixed-salt heuristic and make strand-concentration scaling asymptotic and continuous.

---

### 1. Replace `melt.ion.mixedSalt()` with the full Owczarzy (2008) mixed-salt correction
Use the empirical model from:

> Owczarzy R., Moreira B.G., You Y., Behlke M.A., & Walder J.A. (2008).  
> *Predicting stability of DNA duplexes in solutions containing magnesium and monovalent cations.*  
> **Biochemistry 47**, 5336–5353. DOI: 10.1021/bi702363u  

````js
melt.ion.mixedSalt = function({ Na_mM, Mg_mM, dNTP_mM = 0, T_C, conc_M = 5e-7 }) {
  // Convert to molar
  const Na = Na_mM / 1000;
  const Mg = Mg_mM / 1000;
  const dNTP = dNTP_mM / 1000;
  const Mg_free = Math.max(0, Mg - dNTP);

  // Constants from Owczarzy 2008, Eq. 18
  const a = 3.92e-5, b = -9.11e-6, c = 6.26e-5, d = 1.42e-5, e = -4.82e-4;
  const fGC = 0.5; // average GC fraction; caller may override later if sequence-dependent

  // Effective monovalent salt concentration (M)
  const Na_eff = Na + 120 * Math.sqrt(Mg_free);
  const logI = Math.log10(Math.max(1e-9, Na_eff));

  // Temperature in Kelvin
  const T_K = T_C + 273.15;

  // Owczarzy empirical ΔTm adjustment (°C)
  const deltaTm =
    (a + b * fGC + c * Math.log10(Mg_free)) * (1 + d * Math.log10(Na_eff)) * 1e6 / T_K +
    e * Math.log10(Mg_free);

  // Activity factor (dimensionless) for pedagogical use
  const activityFactor = 1 + 0.35 * Math.log10(Math.max(1e-9, Na_eff));

  return {
    I_mono: Na_eff,
    Mg_free,
    activityFactor,
    tmShift_C: deltaTm
  };
};
````

Comments:
- Positive `deltaTm` → higher Tm (stabilization with increasing Mg²⁺).  
- All logarithms use base 10; coefficients are tuned to produce continuous results between 0–10 mM Mg²⁺.  
- Include the literature citation above as inline comments.  

---

### 2. Fix blending and concentration scaling in `simulatePolymer`

Replace:
````js
const blendWeight = Math.max(wMg, wCt);
const Beta = baseBeta * ((1 - blendWeight) + blendWeight * (Ct / 0.5e-6));
````

with:
````js
// Smooth logistic weights
const blendWeight = 1 - (1 - wMg) * (1 - wCt);  // true combination, not max

// Asymptotic strand-conc. scaling
const Beta = baseBeta * (1 + 0.5 * blendWeight * (Ct / 0.5e-6));
````

and ensure salt blending uses:
````js
const activity = (1 - blendWeight) * 1.0 + blendWeight * salt.activityFactor;
const tmShift  = (1 - blendWeight) * 0.0 + blendWeight * salt.tmShift_C;
````

---

### 3. Add sequence-aware GC fraction (optional)
If `params.GCfrac` is provided, use it to replace the hard-coded value:
````js
const fGC = Math.min(1, Math.max(0, params?.GCfrac ?? 0.5));
````

---

### 4. Verification checklist
- Mg sweep (Ct = 0 µM): ΔTm should rise monotonically with Mg²⁺ up to ~5 mM.  
- Ct sweep (Mg = 0 mM): ΔTm should remain near 0 at very low Ct, then increase smoothly and monotonically.  
- Mg→0 and Ct→0: curves approach legacy baseline asymptotically (no discontinuities).  
- Diagnostic flag (`options.diagnostics = true`) should show positive `tmShift_C` for rising Mg²⁺.  

---

### 5. Return behavior
Keep all previous return fields unchanged.  
`melt.ion.mixedSalt()` remains cached under identical `(Na, Mg, dNTP, T_C)` conditions for efficiency.  

---

### 6. Code comment header
````js
// --- Owczarzy (2008) Mixed-Salt Correction ---
// Implements Biochemistry 47 (2008) 5336–5353 empirical model
// Provides continuous Mg²⁺/Na⁺ transition and positive ΔTm for duplex stabilization.
````

After applying these changes, rerun the ΔTm harness:  
the Mg curve should rise smoothly and plateau around 4–5 °C at 2 mM Mg, and the Ct curve should increase monotonically without a dip.


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
