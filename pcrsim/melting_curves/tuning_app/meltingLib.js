// meltingLib.js
// Shared DNA melting simulation library (API-compliant, client-side)
// Implements algorithms extracted from teaching app prototype

(() => {
  const melt = {};

  melt.meta = {
    version: '0.7.3',
    algorithms: [
      { key: 'independent', label: 'Independent' },
      { key: 'thermo', label: 'Thermodynamic (Mixed Salt)' },
      { key: 'polymer', label: 'Polymer (Statistical Mechanics)' },
      { key: 'sigmoid', label: 'Simple Sigmoid' }
    ],
    references: [
      'SantaLucia, J. (1998) PNAS 95:1460–1465',
      'Owczarzy, R. et al. (2008) Biochemistry 47:5336–5353'
    ]
  };

  melt.defaults = {
    conditions: { Na: 0.05, Mg: 0.001 },
    params: {
      window: 15,
      k: 0.8,
      cooperativity: 0.5,
      L: 20,
      piM: 0.5,
      eps: 1e-6,
      conc: 5e-7,
      dNTP: 0
    },
    options: {
      fastSalt: false
    }
  };

  // ==========================
  // Thermodynamic Utilities
  // ==========================
  melt.Thermo = {};

  melt.Thermo.NN = {
    'AA': [-7.9, -22.2], 'TT': [-7.9, -22.2],
    'AT': [-7.2, -20.4], 'TA': [-7.2, -21.3],
    'CA': [-8.5, -22.7], 'TG': [-8.5, -22.7],
    'GT': [-8.4, -22.4], 'AC': [-8.4, -22.4],
    'CT': [-7.8, -21.0], 'AG': [-7.8, -21.0],
    'GA': [-8.2, -22.2], 'TC': [-8.2, -22.2],
    'CG': [-10.6, -27.2], 'GC': [-9.8, -24.4],
    'GG': [-8.0, -19.9], 'CC': [-8.0, -19.9]
  };
  melt.Thermo.R = 1.987;
  melt.Thermo.log10 = (x) => Math.log(x) / Math.LN10;
  melt.Thermo.sanitizeSeq = (s) => (s || '').toUpperCase().replace(/[^ATGC]/g, '');

  melt.Thermo.computeTm = function (subseq, concM, saltM) {
    let dH = 0.2, dS = -5.7;
    if (subseq.length < 2) return NaN;
    const first = subseq[0], last = subseq[subseq.length - 1];
    if (first === 'A' || first === 'T') { dH += 2.3; dS += 4.1; }
    if (last === 'A' || last === 'T') { dH += 2.3; dS += 4.1; }

    for (let i = 0; i < subseq.length - 1; i++) {
      const dinuc = subseq[i] + subseq[i + 1];
      const p = melt.Thermo.NN[dinuc];
      if (!p) return NaN;
      dH += p[0]; dS += p[1];
    }

    const Ct = Math.max(1e-15, concM / 4);
    let TmK = (dH * 1000) / (dS + melt.Thermo.R * Math.log(Ct));
    return TmK - 273.15;
  };

  melt.Thermo.localTms = function (seq, concM, saltM, windowSize) {
    const n = seq.length, half = Math.floor(windowSize / 2);
    const tms = new Array(n).fill(NaN);
    for (let i = 0; i < n; i++) {
      const start = Math.max(0, i - half);
      const end = Math.min(n, start + windowSize);
      tms[i] = melt.Thermo.computeTm(seq.slice(start, end), concM, saltM);
    }
    return tms;
  };

  // ==========================
  // Owczarzy 2008 Mixed-Salt
  // ==========================
  melt.ion = {};
  const saltCache = new Map();
  function saltKey(Na_mM, Mg_mM, dNTP_mM, T_C, conc_M, gc) {
    return `${Na_mM}|${Mg_mM}|${dNTP_mM}|${T_C}|${conc_M}|${gc}`;
  }

  // // Owczarzy et al. (2008) Biochemistry 47:5336–5353 mixed-salt correction.
  // melt.ion.mixedSalt = function ({ Na_mM, Mg_mM, dNTP_mM = 0, T_C, conc_M = 5e-7, GCfrac = 0.5 }) {
  //   const key = saltKey(Na_mM, Mg_mM, dNTP_mM, T_C, conc_M, GCfrac);
  //   if (saltCache.has(key)) return saltCache.get(key);

  //   const Na = Math.max(0, Na_mM) / 1000;
  //   const Mg = Math.max(0, Mg_mM) / 1000;
  //   const dNTP = Math.max(0, dNTP_mM) / 1000;
  //   const Mg_free = Math.max(0, Mg - dNTP);

  //   // Owczarzy 2008 empirical coefficients (Eq. 18)
  //   const a = 3.92e-5;
  //   const b = -9.11e-6;
  //   const c = 6.26e-5;
  //   const d = 1.42e-5;
  //   const e = -4.82e-4;
  //   const fGC = Math.min(1, Math.max(0, GCfrac ?? 0.5));

  //   const Na_eff = Math.max(1e-9, Na + 120 * Math.sqrt(Mg_free));
  //   const logNaEff = Math.log10(Na_eff);
  //   const logMg = Math.log10(Math.max(1e-9, Mg_free));
  //   const T_K = (T_C ?? 50) + 273.15;

  //   const deltaTm =
  //     (a + b * fGC + c * logMg) * (1 + d * logNaEff) * 1e6 / T_K +
  //     e * logMg;

  //   const activityFactor = 1 + 0.35 * logNaEff;

  //   const result = {
  //     I_mono: Na_eff,
  //     Mg_free,
  //     activityFactor,
  //     tmShift_C: deltaTm
  //   };
  //   saltCache.set(key, result);
  //   return result;
  // };

  // --- Owczarzy (2008) Mixed-Salt Correction ---
// Implements Biochemistry 47 (2008) 5336–5353 empirical model.
// Provides continuous Mg²⁺/Na⁺ transition and positive ΔTm for duplex stabilization.

  melt.ion.mixedSalt = function ({
    Na_mM,
    Mg_mM,
    dNTP_mM = 0,
    T_C = 50,
    conc_M = 5e-7,
    GCfrac = 0.5
  }) {
    // Convert to molar
    const Na = Na_mM / 1000;
    const Mg = Mg_mM / 1000;
    const dNTP = dNTP_mM / 1000;
    const Mg_free = Math.max(0, Mg - dNTP);

    // Smooth Mg fade-in to make Mg→0 a true asymptote (no discontinuity)
    const K_Mg = 1e-3; // 1 mM half-activation
    const n_Mg = 2;    // Hill coefficient
    const wMg = 1 / (1 + Math.pow(K_Mg / Math.max(1e-12, Mg_free), n_Mg));

    // Empirical constants from Owczarzy 2008 Eq. 18
    const a = 3.92e-5,
          b = -9.11e-6,
          c = 6.26e-5,
          d = 1.42e-5,
          e = -4.82e-4;
    const fGC = Math.min(1, Math.max(0, GCfrac));

    // Effective monovalent concentration (M)
    const Na_eff = Math.max(1e-9, Na + 120 * Math.sqrt(Mg_free));
    const logNaEff = Math.log10(Na_eff);
    const logMg = Math.log10(Math.max(1e-9, Mg_free));
    const T_K = T_C + 273.15;

    // Owczarzy empirical ΔTm (°C)
    const deltaTm_raw =
      (a + b * fGC + c * logMg) * (1 + d * logNaEff) * 1e6 / T_K +
      e * logMg;

    // Activity factor (dimensionless, pedagogical use)
    // Clamp so it never destabilizes when Mg≈0
    const activityInc = 0.35 * logNaEff;
    const activityFactor = 1 + wMg * Math.max(0, activityInc);

    // Mg-driven ΔTm fades in smoothly with Mg (no effect when Mg→0)
    const tmShift_C = wMg * deltaTm_raw;

    // Return structure for downstream algorithms
    return {
      I_mono: Na_eff,
      Mg_free,
      activityFactor,
      tmShift_C
    };
  };

  // ==========================
  // Core Simulation Algorithms
  // ==========================
  melt.Simulate = {};

  // Utility
  function meltProb(T, Tm, k) { return 1 / (1 + Math.exp(-(T - Tm) / k)); }
  function meanFinite(arr) {
    const vals = arr.filter(x => isFinite(x));
    return vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : NaN;
  }
  function findTm(values, temps) {
    const idx = values.findIndex(v => v >= 0.5);
    if (idx <= 0 || idx >= temps.length) return NaN;
    const prev = values[idx - 1];
    const curr = values[idx];
    if (!Number.isFinite(prev) || !Number.isFinite(curr) || curr === prev) return temps[idx];
    const frac = (0.5 - prev) / (curr - prev);
    return temps[idx - 1] + frac * (temps[idx] - temps[idx - 1]);
  }

  function buildSaltSampler({ Na, Mg, conc, dNTP = 0, temperatures, fastSalt, gcFrac }) {
    if (!fastSalt) {
      return (T) => melt.ion.mixedSalt({
        Na_mM: (Na ?? 0) * 1000,
        Mg_mM: (Mg ?? 0) * 1000,
        dNTP_mM: dNTP * 1000,
        T_C: T,
        conc_M: conc,
        GCfrac: gcFrac
      });
    }
    const midIdx = Math.max(0, Math.floor((temperatures?.length || 1) / 2));
    const midTemp = temperatures?.[midIdx] ?? 60;
    const cached = melt.ion.mixedSalt({
      Na_mM: (Na ?? 0) * 1000,
      Mg_mM: (Mg ?? 0) * 1000,
      dNTP_mM: dNTP * 1000,
      T_C: midTemp,
      conc_M: conc,
      GCfrac: gcFrac
    });
    return (T) => T === midTemp ? cached : melt.ion.mixedSalt({
      Na_mM: (Na ?? 0) * 1000,
      Mg_mM: (Mg ?? 0) * 1000,
      dNTP_mM: dNTP * 1000,
      T_C: T,
      conc_M: conc,
      GCfrac: gcFrac
    });
  }

  // --- Independent (no HMM) ---
  melt.Simulate.simulateIndependent = function ({ sequence, temperatures, conditions, params, options }) {
    const seq = melt.Thermo.sanitizeSeq(sequence);
    const Na = conditions?.Na ?? 0.05;
    const conc = params?.conc ?? 0.5e-6;
    const win = params?.window ?? 15;
    const k = params?.k ?? 0.8;

    const tms = melt.Thermo.localTms(seq, conc, Na, win);
    const perBase = [];
    const fractionMelted = [];

    for (const T of temperatures) {
      const probs = tms.map(tm => isFinite(tm) ? meltProb(T, tm, k) : NaN);
      const f = meanFinite(probs);
      fractionMelted.push(f);
      if (options?.returnPerBase) perBase.push(probs);
    }

    const result = { temperatures, fractionMelted };
    if (options?.returnPerBase) result.perBase = perBase;
    return result;
  };

  // --- Thermodynamic (Na+/Mg2+ adjusted) ---
  melt.Simulate.simulateThermodynamic = function ({ sequence, temperatures, conditions, params, options }) {
    const seq = melt.Thermo.sanitizeSeq(sequence);
    const Na = conditions?.Na ?? 0.05;
    const Mg = conditions?.Mg ?? 0.001;
    const conc = params?.conc ?? 0.5e-6;
    const win = params?.window ?? 15;
    const k = params?.k ?? 0.8;

    const baseTms = melt.Thermo.localTms(seq, conc, Na, win);
    const saltSample = buildSaltSampler({
      Na,
      Mg,
      conc,
      dNTP: params?.dNTP ?? 0,
      temperatures,
      fastSalt: options?.fastSalt,
      gcFrac: params?.GCfrac
    });

    const perBase = [];
    const fractionMelted = [];

    for (const T of temperatures) {
      const shift = saltSample(T).tmShift_C;
      const probs = baseTms.map(tm => (isFinite(tm) ? meltProb(T, tm + shift, k) : NaN));
      const f = meanFinite(probs);
      fractionMelted.push(f);
      if (options?.returnPerBase) perBase.push(probs);
    }

    const result = { temperatures, fractionMelted };
    if (options?.returnPerBase) result.perBase = perBase;
    return result;
  };

  // --- Simple Sigmoid Model ---
  melt.Simulate.simulateSigmoid = function ({ sequence, temperatures, conditions, params, options }) {
    const seq = melt.Thermo.sanitizeSeq(sequence);
    const Na = conditions?.Na ?? 0.05;
    const Mg = conditions?.Mg ?? 0.001;
    const conc = params?.conc ?? 0.5e-6;
    const baseK = Math.max(1e-3, params?.k ?? 0.8);
    const seqTm = seq.length >= 2 ? melt.Thermo.computeTm(seq, conc, Na) : NaN;
    const fallbackTm = 70.0;
    const baseTm = isFinite(seqTm) ? seqTm : fallbackTm;

    const saltSample = buildSaltSampler({
      Na,
      Mg,
      conc,
      dNTP: params?.dNTP ?? 0,
      temperatures,
      fastSalt: options?.fastSalt,
      gcFrac: params?.GCfrac
    });

    const fractionMelted = temperatures.map(T => {
      const salt = saltSample(T);
      const tmEff = baseTm + salt.tmShift_C;
      const kEff = Math.max(1e-3, baseK / salt.activityFactor);
      return 1 / (1 + Math.exp(-(T - tmEff) / kEff));
    });

    return { temperatures, fractionMelted };
  };

  
  // --- Polymer Statistical Mechanics Model ---
  // Translation of meltPolymer() from DECIPHER (Erik Wright)
  // Implements full forward–backward recursion (Tøstesen 2003)
  // and SantaLucia (1998) NN thermodynamics
  melt.Simulate.simulatePolymer = function ({
    sequence, temperatures, conditions, params, options
  }) {
    const seqStr = melt.Thermo.sanitizeSeq(sequence);
    const Na = conditions?.Na ?? 0.05; // molar
    const Mg = conditions?.Mg ?? 0.001;
    const seq = Array.from(seqStr).map(b => ({ A: 0, C: 1, G: 2, T: 3 }[b]));
    const N = seq.length;
    const alpha = 2.15;
    const sigma = 1.26e-4;
    const Ct = Math.max(1e-12, params?.conc ?? 0.5e-6); // molar duplex concentration
    const baseBeta = 1e-7;
    const dNTP = params?.dNTP ?? 0;
    const MgFree = Math.max(0, Mg - dNTP);
    // Smooth logistic transition keeps Polymer continuous from legacy (Mg→0, Ct→0) to mixed-salt regime.
    const K_Mg = 1e-3, n_Mg = 2;
    const K_Ct = 1e-8, n_Ct = 2;
    const wMg = 1 / (1 + Math.pow(K_Mg / Math.max(1e-12, MgFree), n_Mg));
    const wCt = 1 / (1 + Math.pow(K_Ct / Math.max(1e-15, Ct), n_Ct));
    const blendWeight = 1 - (1 - wMg) * (1 - wCt);
    const rescale_G = 1e1;
    const rescale_F = 1e-1;
    const rF1 = 1e1;
    const LEP = Math.pow(5, -alpha);
    const ratio = Math.pow(7, -alpha) / LEP;

    const dH = [
      [-7.9, -8.4, -7.8, -7.2],
      [-8.5, -8.0, -10.6, -7.8],
      [-8.2, -9.8, -8.0, -8.4],
      [-7.2, -8.2, -8.5, -7.9]
    ];
    const dS = [
      [-22.2, -22.4, -21.0, -20.4],
      [-22.7, -19.9, -27.2, -21.0],
      [-22.2, -24.4, -19.9, -22.4],
      [-21.3, -22.2, -22.7, -22.2]
    ];
    const dHini = [2.3, 0.1, 0.1, 2.3];
    const dSini = [4.1, -2.8, -2.8, 4.1];
    const dH_010 = [-4.54, -4.54, -4.54, -4.54];
    const dS_010 = [-20.2, -20.2, -20.2, -20.2];

    const perBase = [];
    const fractionMelted = [];
    const baselineFractions = [];
    const saltSample = buildSaltSampler({
      Na,
      Mg,
      conc: Ct,
      dNTP,
      temperatures,
      fastSalt: options?.fastSalt,
      gcFrac: params?.GCfrac
    });
    let lastSalt = null;

    function computeFraction(T, Beta, NaEff, shift, capturePerBase) {
      const logNa = Math.log(NaEff);
      const Teff = T + shift;
      const RT = 0.0019871 * (273.15 + Teff);
      const s_11 = Array.from({ length: 4 }, () => new Array(4).fill(0));
      const s_end = new Array(4);
      const s_010 = new Array(4);

      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          s_11[i][j] = Math.exp(
            (-1 * (dH[i][j] - (273.15 + Teff) * (dS[i][j] + 0.368 * logNa) / 1000)) / RT
          );
        }
        s_end[i] = Math.exp(
          (-1 * (dHini[i] - (273.15 + Teff) * (dSini[i] + 0.368 * logNa) / 1000)) / RT
        );
        s_010[i] = Math.exp(
          (-1 * (dH_010[i] - (273.15 + Teff) * (dS_010[i] + 0.368 * logNa) / 1000)) / RT
        );
      }

      const V_10_LR = new Float64Array(N + 1);
      const U_01_LR = new Float64Array(N);
      const U_11_LR = new Float64Array(N);
      const rescale = new Int32Array(N);
      let rescale_i = 0;

      V_10_LR[0] = 1;
      V_10_LR[1] = Beta * s_010[seq[0]];
      U_01_LR[1] = Beta;
      U_11_LR[1] = Beta * s_end[seq[0]] * s_11[seq[0]][seq[1]];
      V_10_LR[2] = s_010[seq[1]] * U_01_LR[1] + s_end[seq[1]] * U_11_LR[1];
      let Q_tot = V_10_LR[0] + V_10_LR[1] + V_10_LR[2];

      for (let i = 2; i < N; i++) {
        U_01_LR[i] = Beta * V_10_LR[0];
        if (i > 2) U_01_LR[i] += ratio * (U_01_LR[i - 1] - U_01_LR[i]);
        const exp1 = rescale_i - rescale[i - 2];
        let scale = exp1 === -1 ? rF1 : exp1 === 0 ? 1 : Math.pow(rescale_F, exp1);
        U_01_LR[i] += V_10_LR[i - 1] * sigma * LEP * scale;
        U_11_LR[i] = s_11[seq[i - 1]][seq[i]] * (U_01_LR[i - 1] * s_end[seq[i - 1]] + U_11_LR[i - 1]);
        V_10_LR[i + 1] = s_010[seq[i]] * U_01_LR[i] + s_end[seq[i]] * U_11_LR[i];
        Q_tot += V_10_LR[i + 1];
        if (Q_tot > rescale_G && i < N - 3) {
          rescale_i++;
          rescale[i] = rescale_i;
          Q_tot *= rescale_F;
          V_10_LR[i + 1] *= rescale_F;
          U_01_LR[i] *= rescale_F;
          U_11_LR[i] *= rescale_F;
          V_10_LR[0] *= rescale_F;
        } else rescale[i] = rescale_i;
      }

      const V_10_RL = new Float64Array(N + 1);
      const U_01_RL = new Float64Array(N);
      const U_11_RL = new Float64Array(N);

      V_10_RL[0] = 1;
      V_10_RL[1] = Beta * s_010[seq[N - 1]];
      U_01_RL[1] = Beta;
      U_11_RL[1] = Beta * s_end[seq[N - 1]] * s_11[seq[N - 2]][seq[N - 1]];
      V_10_RL[2] = s_010[seq[N - 2]] * U_01_RL[1] + s_end[seq[N - 2]] * U_11_RL[1];

      for (let i = 2; i < N; i++) {
        U_01_RL[i] = Beta * V_10_RL[0];
        if (i > 2) U_01_RL[i] += ratio * (U_01_RL[i - 1] - U_01_RL[i]);
        const exp1 = rescale[N - i - 1] - rescale[N - i];
        let scale = exp1 === -1 ? rF1 : exp1 === 0 ? 1 : Math.pow(rescale_F, exp1);
        U_01_RL[i] += V_10_RL[i - 1] * sigma * LEP * scale;
        U_11_RL[i] = s_11[seq[N - i - 1]][seq[N - i]] * (U_01_RL[i - 1] * s_end[seq[N - i]] + U_11_RL[i - 1]);
        V_10_RL[i + 1] = s_010[seq[N - i - 1]] * U_01_RL[i] + s_end[seq[N - i - 1]] * U_11_RL[i];
        if (rescale[N - i - 1] !== rescale[N - i]) {
          V_10_RL[i + 1] *= rescale_F;
          U_01_RL[i] *= rescale_F;
          U_11_RL[i] *= rescale_F;
          V_10_RL[0] *= rescale_F;
        }
      }

      const P = new Array(N).fill(0);
      for (let i = 1; i < N - 1; i++) {
        const val =
          (U_01_LR[i] * s_010[seq[i]] * U_01_RL[N - i - 1] +
            U_01_LR[i] * s_end[seq[i]] * U_11_RL[N - i - 1] +
            U_11_LR[i] * s_end[seq[i]] * U_01_RL[N - i - 1] +
            U_11_LR[i] * U_11_RL[N - i - 1]) /
          (Beta * Q_tot);
        P[i] = Math.min(1, Math.max(0, val));
      }

      const avg = P.reduce((a, b) => a + b, 0) / N;
      return { fraction: 1 - avg, perBase: capturePerBase ? P : null };
    }

    for (const T of temperatures) {
      const salt = saltSample(T);
      lastSalt = salt;
      const activity = (1 - blendWeight) * 1.0 + blendWeight * salt.activityFactor;
      // Positive tmShift_C should raise Tm as Mg²⁺ increases.
      const tmShift = (1 - blendWeight) * 0 + blendWeight * salt.tmShift_C;
      const adjBeta = baseBeta * (1 + 0.5 * blendWeight * (Ct / 0.5e-6));

      const baseRes = computeFraction(T, baseBeta, Na, 0, false);
      const adjRes = computeFraction(
        T,
        adjBeta,
        Math.max(1e-9, Na * activity),
        tmShift,
        options?.returnPerBase
      );

      baselineFractions.push(baseRes.fraction);
      fractionMelted.push(adjRes.fraction);
      if (options?.returnPerBase && adjRes.perBase) perBase.push(adjRes.perBase);
    }

    const Tm_base = findTm(baselineFractions, temperatures);
    const Tm_adj = findTm(fractionMelted, temperatures);
    const result = { temperatures, fractionMelted };
    if (options?.returnPerBase) result.perBase = perBase;
    if (options?.diagnostics) {
      result.diagnostics = {
        Tm_base,
        Tm_adj,
        deltaTm: Number.isFinite(Tm_base) && Number.isFinite(Tm_adj) ? Tm_adj - Tm_base : NaN,
        salt: lastSalt ? {
          tmShift_C: lastSalt.tmShift_C,
          activityFactor: lastSalt.activityFactor,
          Na_mM: Na * 1000,
          Mg_mM: Mg * 1000,
          dNTP_mM: dNTP * 1000,
          conc_M: Ct
        } : null
      };
    }
    return result;
  };


  melt.registry = {
    independent: melt.Simulate.simulateIndependent,
    thermo: melt.Simulate.simulateThermodynamic,
    polymer: melt.Simulate.simulatePolymer,
    sigmoid: melt.Simulate.simulateSigmoid
  };

  melt.run = function ({ id, sequence, temperatures, conditions, params, options }) {
    const handler = melt.registry[id] || melt.registry.independent;
    const mergedConditions = { ...melt.defaults.conditions, ...(conditions || {}) };
    const mergedParams = { ...melt.defaults.params, ...(params || {}) };
    const mergedOptions = { ...melt.defaults.options, ...(options || {}) };
    return handler({
      sequence,
      temperatures,
      conditions: mergedConditions,
      params: mergedParams,
      options: mergedOptions
    });
  };

  // Export globally
  window.melt = melt;
})();
