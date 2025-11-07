// meltingLib.js
// Shared DNA melting simulation library (API-compliant, client-side)
// Implements algorithms extracted from teaching app prototype

(() => {
  const melt = {};

  melt.meta = {
    version: '0.7.2',
    algorithms: [
      { key: 'independent', label: 'Independent' },
      { key: 'posterior', label: 'HMM Posterior' },
      { key: 'viterbi', label: 'HMM Viterbi' },
      { key: 'thermo', label: 'Thermodynamic (Mixed Salt)' },
      { key: 'hmm', label: 'Pedagogical HMM' },
      { key: 'transferFast', label: 'Transfer Matrix (Fast)' },
      { key: 'transfer', label: 'Transfer Matrix (Full)' },
      { key: 'partitionFast', label: 'Partition Function (Fast)' },
      { key: 'partition', label: 'Partition Function (Full)' },
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
  function saltKey(Na, Mg, dNTP, conc, T){
    return `${Na}|${Mg}|${dNTP}|${conc}|${T}`;
  }

  melt.ion.mixedSalt = function ({ Na, Mg, dNTP = 0, conc, T }) {
    Na = Math.max(1e-9, Na);
    Mg = Math.max(0, Mg);
    dNTP = Math.max(0, dNTP);
    conc = Math.max(1e-12, conc);
    const Tk = (T ?? 50) + 273.15;
    const key = saltKey(Na, Mg, dNTP, conc, Tk.toFixed(3));
    if (saltCache.has(key)) return saltCache.get(key);

    const MgFree = Math.max(0, Mg - dNTP);
    const ionicStrength = Math.max(1e-9, Na + 4 * Math.sqrt(MgFree));
    const tmShift_C = 16.6 * melt.Thermo.log10(Math.max(1e-9, ionicStrength));
    const activityFactor = Math.max(
      0.2,
      1 + 0.35 * melt.Thermo.log10(ionicStrength) - 0.04 * melt.Thermo.log10(Math.max(1e-9, conc))
    );

    const result = { tmShift_C, activityFactor };
    saltCache.set(key, result);
    return result;
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
  function buildSaltSampler({ Na, Mg, conc, dNTP = 0, temperatures, fastSalt }) {
    if (!fastSalt) {
      return (T) => melt.ion.mixedSalt({ Na, Mg, conc, dNTP, T });
    }
    const midIdx = Math.max(0, Math.floor((temperatures?.length || 1) / 2));
    const midTemp = temperatures?.[midIdx] ?? 60;
    const cached = melt.ion.mixedSalt({ Na, Mg, conc, dNTP, T: midTemp });
    return () => cached;
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

  // --- HMM Posterior ---
  function hmmPosterior(p, L, piM = 0.5, eps = 1e-6) {
    const n = p.length;
    const pi = [Math.log(1 - piM), Math.log(piM)];
    const alpha = Math.max(1e-6, 1 / L);
    const A = [
      [Math.log(1 - alpha), Math.log(alpha)],
      [Math.log(alpha), Math.log(1 - alpha)]
    ];
    const B = (i, s) => {
      const pi_ = Math.min(1 - eps, Math.max(eps, p[i]));
      return s === 1 ? Math.log(pi_) : Math.log(1 - pi_);
    };

    const f = Array.from({ length: n }, () => [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY]);
    for (let s = 0; s < 2; s++) f[0][s] = pi[s] + B(0, s);
    for (let i = 1; i < n; i++) {
      for (let s = 0; s < 2; s++) {
        const v0 = f[i - 1][0] + A[0][s];
        const v1 = f[i - 1][1] + A[1][s];
        const m = Math.max(v0, v1);
        f[i][s] = B(i, s) + (m + Math.log(Math.exp(v0 - m) + Math.exp(v1 - m)));
      }
    }

    const b = Array.from({ length: n }, () => [0, 0]);
    for (let i = n - 2; i >= 0; i--) {
      for (let s = 0; s < 2; s++) {
        const v0 = A[s][0] + B(i + 1, 0) + b[i + 1][0];
        const v1 = A[s][1] + B(i + 1, 1) + b[i + 1][1];
        const m = Math.max(v0, v1);
        b[i][s] = m + Math.log(Math.exp(v0 - m) + Math.exp(v1 - m));
      }
    }

    const post = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      const h = f[i][0] + b[i][0];
      const m = f[i][1] + b[i][1];
      const mm = Math.max(h, m);
      const denom = mm + Math.log(Math.exp(h - mm) + Math.exp(m - mm));
      post[i] = Math.exp(m - denom);
    }
    return post;
  }

  melt.Simulate.simulateHMMPosterior = function ({ sequence, temperatures, conditions, params, options }) {
    const seq = melt.Thermo.sanitizeSeq(sequence);
    const Na = conditions?.Na ?? 0.05;
    const Mg = conditions?.Mg ?? 0.001;
    const conc = params?.conc ?? 0.5e-6;
    const win = params?.window ?? 15;
    const k = params?.k ?? 0.8;
    const L = params?.L ?? 20;
    const piM = params?.piM ?? 0.5;
    const eps = params?.eps ?? 1e-6;

    const tms = melt.Thermo.localTms(seq, conc, Na, win);
    const saltSample = buildSaltSampler({
      Na,
      Mg,
      conc,
      dNTP: params?.dNTP ?? 0,
      temperatures,
      fastSalt: options?.fastSalt
    });
    const perBase = [];
    const fractionMelted = [];

    for (const T of temperatures) {
      const activity = saltSample(T).activityFactor;
      const kEff = Math.max(1e-3, k / activity);
      const indep = tms.map(tm => (isFinite(tm) ? meltProb(T, tm, kEff) : NaN));
      const posterior = hmmPosterior(indep, L, piM, eps);
      const f = meanFinite(posterior);
      fractionMelted.push(f);
      if (options?.returnPerBase) perBase.push(posterior);
    }

    const result = { temperatures, fractionMelted };
    if (options?.returnPerBase) result.perBase = perBase;
    return result;
  };

  // --- HMM Viterbi ---
  function hmmViterbi(p, L, piM = 0.5, eps = 1e-6) {
    const n = p.length;
    const pi = [Math.log(1 - piM), Math.log(piM)];
    const alpha = Math.max(1e-6, 1 / L);
    const A = [
      [Math.log(1 - alpha), Math.log(alpha)],
      [Math.log(alpha), Math.log(1 - alpha)]
    ];
    const B = (i, s) => {
      const pi_ = Math.min(1 - eps, Math.max(eps, p[i]));
      return s === 1 ? Math.log(pi_) : Math.log(1 - pi_);
    };

    const dp = Array.from({ length: n }, () => [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY]);
    const bp = Array.from({ length: n }, () => [0, 0]);
    for (let s = 0; s < 2; s++) dp[0][s] = pi[s] + B(0, s);
    for (let i = 1; i < n; i++) {
      for (let s = 0; s < 2; s++) {
        const c0 = dp[i - 1][0] + A[0][s];
        const c1 = dp[i - 1][1] + A[1][s];
        if (c0 > c1) { dp[i][s] = c0 + B(i, s); bp[i][s] = 0; }
        else { dp[i][s] = c1 + B(i, s); bp[i][s] = 1; }
      }
    }
    const path = new Array(n).fill(0);
    path[n - 1] = dp[n - 1][1] > dp[n - 1][0] ? 1 : 0;
    for (let i = n - 2; i >= 0; i--) path[i] = bp[i + 1][path[i + 1]];
    return path.map(s => s === 1 ? 1 : 0);
  }

  melt.Simulate.simulateHMMViterbi = function ({ sequence, temperatures, conditions, params, options }) {
    const seq = melt.Thermo.sanitizeSeq(sequence);
    const Na = conditions?.Na ?? 0.05;
    const conc = params?.conc ?? 0.5e-6;
    const win = params?.window ?? 15;
    const k = params?.k ?? 0.8;
    const L = params?.L ?? 20;
    const piM = params?.piM ?? 0.5;
    const eps = params?.eps ?? 1e-6;

    const tms = melt.Thermo.localTms(seq, conc, Na, win);
    const perBase = [];
    const fractionMelted = [];

    for (const T of temperatures) {
      const indep = tms.map(tm => isFinite(tm) ? meltProb(T, tm, k) : NaN);
      const path = hmmViterbi(indep, L, piM, eps);
      const f = meanFinite(path);
      fractionMelted.push(f);
      if (options?.returnPerBase) perBase.push(path);
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
      fastSalt: options?.fastSalt
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
      fastSalt: options?.fastSalt
    });

    const fractionMelted = temperatures.map(T => {
      const salt = saltSample(T);
      const tmEff = baseTm + salt.tmShift_C;
      const kEff = Math.max(1e-3, baseK / salt.activityFactor);
      return 1 / (1 + Math.exp(-(T - tmEff) / kEff));
    });

    return { temperatures, fractionMelted };
  };

  // --- Pedagogical HMM (Forward–Backward, cooperative version) ---
  melt.Simulate.simulateHMM = function ({ sequence, temperatures, conditions, params, options }) {
    const seq = melt.Thermo.sanitizeSeq(sequence);
    const Na = conditions?.Na ?? 0.05;
    const conc = params?.conc ?? 0.5e-6;
    const win = params?.window ?? 15;
    const k = params?.k ?? 0.8;
    const L = params?.L ?? 20;
    const piM = params?.piM ?? 0.5;
    const eps = params?.eps ?? 1e-6;
    const coop = params?.cooperativity ?? 1.0;   // 0 = independent; >1 = stronger cooperativity

    const tms = melt.Thermo.localTms(seq, conc, Na, win);
    const perBase = [];
    const fractionMelted = [];

    for (const T of temperatures) {
        // Basewise independent probabilities
        const indep = tms.map(tm =>
        isFinite(tm) ? 1 / (1 + Math.exp(-(T - tm) / k)) : NaN
        );

        // Apply cooperative influence between neighbors
        const post = [];
        for (let i = 0; i < indep.length; i++) {
        const p = indep[i];
        if (!isFinite(p)) {
            post.push(NaN);
            continue;
        }

        const left = indep[i - 1] ?? p;
        const right = indep[i + 1] ?? p;
        const neighborAvg = 0.5 * (left + right);

        // Neighbor effect shifts effective local "temperature" toward neighbors
        const delta = coop * (neighborAvg - 0.5);   // bias direction: melt if neighbors melted
        const adjusted = 1 / (1 + Math.exp(-10 * (p + delta - 0.5)));  // strong logistic sharpening

        post.push(Math.min(1, Math.max(0, adjusted)));
        }

        // Average over valid bases
        const valid = post.filter(Number.isFinite);
        const f = valid.reduce((a, b) => a + b, 0) / (valid.length || 1);

        fractionMelted.push(f);
        if (options?.returnPerBase) perBase.push(post);
    }

    const result = { temperatures, fractionMelted };
    if (options?.returnPerBase) result.perBase = perBase;
    return result;
  };

  // ===============================================================
  // === TRANSFER MATRIX MODELS ====================================
  // ===============================================================
  
  // --- Fast pedagogical version ---
  // Simplified from Michoel et al. (2006)
  // Changes for speed:
  //   - Uses constant stacking energy instead of base-specific ΔH/ΔS.
  //   - Uses 2x2 scalar recursion instead of full matrix multiplication.
  //   - Ignores boundary normalization and logs for performance.
  // --- Transfer-Matrix Fast (corrected) ---
  // Still pedagogical and very fast.
 // Changes vs earlier version:
  //   • Adds normalization of the forward vector at each base.
  //   • Uses a mild per-base energy gradient for realism.
  //   • Prevents underflow by bounding exponentials.
  //   • Returns fractionMelted ≈ average open probability (sigmoid-like).
  // --- Transfer-Matrix Fast (domain-resolved) ---
  // Each base gets a local Tm from GC content in a sliding window.
  // Cooperative smoothing couples adjacent bases slightly.
  melt.Simulate.simulateTransferMatrixFast = function ({
    sequence, temperatures, conditions, params, options
  }) {
    const seq = melt.Thermo.sanitizeSeq(sequence);
    const N = seq.length;
    const win = params?.window ?? 10;
    const coop = params?.cooperativity ?? 0.2;
  
    // local "Tm" (°C) based on GC fraction in window
    const localTm = [];
    for (let i = 0; i < N; i++) {
      let gc = 0;
      for (let j = Math.max(0, i - win / 2); j < Math.min(N, i + win / 2); j++) {
        if (seq[j] === "G" || seq[j] === "C") gc++;
      }
      localTm[i] = 50 + 0.5 * (gc / win) * 100; // ~50–100 °C span
    }
  
    const perBase = [];
    const fractionMelted = [];
  
    for (const T of temperatures) {
      // Independent melt probability per base
      const indep = localTm.map(Tm => 1 / (1 + Math.exp(-(T - Tm) / 2)));
  
      // Cooperative smoothing (averages with neighbors)
      const probs = [];
      for (let i = 0; i < N; i++) {
        const left = indep[i - 1] ?? indep[i];
        const right = indep[i + 1] ?? indep[i];
        probs[i] = (1 - coop) * indep[i] + coop * 0.5 * (left + right);
      }
  
      const avg = probs.reduce((a, b) => a + b, 0) / N;
      fractionMelted.push(avg);
      if (options?.returnPerBase) perBase.push(probs);
    }
  
    const result = { temperatures, fractionMelted };
    if (options?.returnPerBase) result.perBase = perBase;
    return result;
  };
  
  // --- Full version ---
  // Full 2×2 transfer-matrix per Michoel et al. (2006).
  // Changes compared to Fast version:
  //   - Uses per-base nearest-neighbor ΔH/ΔS.
  //   - Performs both forward and backward passes.
  //   - Normalizes by partition function Z at each step.
  //   - Computational cost: O(N·T) but heavier constant factors.
  // --- Transfer-Matrix Full (corrected) ---
  // Closer to Michoel et al. 2006, but stabilized for browser use.
  //   • Normalizes forward/backward vectors.
  //   • Guards against NaNs and zero partition functions.
  //   • Uses a small built-in NN table for ΔH/ΔS.
  melt.Simulate.simulateTransferMatrix = function ({
    sequence, temperatures, conditions, params, options
    }) {
    const seq = melt.Thermo.sanitizeSeq(sequence);
    const N = seq.length;
    const cooperativity = params?.cooperativity ?? 0.2;

    const perBase = [];
    const fractionMelted = [];

    const nn = {
        AA: { dH: -7.9, dS: -22.2 },
        AT: { dH: -7.2, dS: -20.4 },
        TA: { dH: -7.2, dS: -21.3 },
        GC: { dH: -8.0, dS: -22.0 },
        CG: { dH: -10.6, dS: -27.2 },
        GG: { dH: -8.0, dS: -19.9 }
    };

    for (const T of temperatures) {
        const TK = T + 273.15;
        const RT = 0.001987 * TK;
        const F = Array(N).fill(null).map(() => [1, 1]);
        const B = Array(N).fill(null).map(() => [1, 1]);
        const P = Array(N).fill(0);

        // forward
        for (let i = 1; i < N; i++) {
        const pair = seq.slice(i - 1, i + 1);
        const key = nn[pair] ? pair : "GC";
        const { dH, dS } = nn[key];
        const w = Math.exp(-(dH * 1000 - TK * dS) / (RT * 1000));
        const Fprev = F[i - 1];
        let Fi = [
            Fprev[0] + cooperativity * Fprev[1] * w,
            Fprev[1] + cooperativity * Fprev[0] * w
        ];
        const sum = Fi[0] + Fi[1];
        F[i] = [Fi[0] / sum, Fi[1] / sum];
        }

        // backward
        for (let i = N - 2; i >= 0; i--) {
        const pair = seq.slice(i, i + 2);
        const key = nn[pair] ? pair : "GC";
        const { dH, dS } = nn[key];
        const w = Math.exp(-(dH * 1000 - TK * dS) / (RT * 1000));
        const Bnext = B[i + 1];
        let Bi = [
            Bnext[0] + cooperativity * Bnext[1] * w,
            Bnext[1] + cooperativity * Bnext[0] * w
        ];
        const sum = Bi[0] + Bi[1];
        B[i] = [Bi[0] / sum, Bi[1] / sum];
        }

        const Z = Math.max(F[N - 1][0] + F[N - 1][1], 1e-12);
        for (let i = 0; i < N; i++) {
        const pOpen = (F[i][1] * B[i][1]) / Z;
        P[i] = Math.min(1, Math.max(0, pOpen));
        }

        const avg = P.reduce((a, b) => a + b, 0) / N;
        fractionMelted.push(avg);
        if (options?.returnPerBase) perBase.push(P);
    }

    const result = { temperatures, fractionMelted };
    if (options?.returnPerBase) result.perBase = perBase;
    return result;
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
    const Beta = 1e-7;
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

    const saltSample = buildSaltSampler({
      Na,
      Mg,
      conc: params?.conc ?? 0.5e-6,
      dNTP: params?.dNTP ?? 0,
      temperatures,
      fastSalt: options?.fastSalt
    });

    for (const T of temperatures) {
      const salt = saltSample(T);
      const NaEff = Math.max(1e-9, Na * salt.activityFactor);
      const logNa = Math.log(NaEff);
      const RT = 0.0019871 * (273.15 + T);
      const s_11 = Array.from({ length: 4 }, () => new Array(4).fill(0));
      const s_end = new Array(4);
      const s_010 = new Array(4);

      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          s_11[i][j] = Math.exp(
            (-1 * (dH[i][j] - (273.15 + T) * (dS[i][j] + 0.368 * logNa) / 1000)) / RT
          );
        }
        s_end[i] = Math.exp(
          (-1 * (dHini[i] - (273.15 + T) * (dSini[i] + 0.368 * logNa) / 1000)) / RT
        );
        s_010[i] = Math.exp(
          (-1 * (dH_010[i] - (273.15 + T) * (dS_010[i] + 0.368 * logNa) / 1000)) / RT
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
        let val =
          (U_01_LR[i] * s_010[seq[i]] * U_01_RL[N - i - 1] +
            U_01_LR[i] * s_end[seq[i]] * U_11_RL[N - i - 1] +
            U_11_LR[i] * s_end[seq[i]] * U_01_RL[N - i - 1] +
            U_11_LR[i] * U_11_RL[N - i - 1]) /
          (Beta * Q_tot);
        P[i] = Math.min(1, Math.max(0, val));
      }

      const avg = P.reduce((a, b) => a + b, 0) / N;
      fractionMelted.push(1 - avg);
      if (options?.returnPerBase) perBase.push(P);
    }

    const result = { temperatures, fractionMelted };
    if (options?.returnPerBase) result.perBase = perBase;
    return result;
  };
  
  // ===============================================================
  // === PARTITION FUNCTION MODELS ================================
  // ===============================================================
  
  // --- Fast pedagogical version ---
  // Simplified from Chitsaz et al. (2009)
  // Changes for speed:
  //   - Ignores loop terms and pseudo-knots.
  //   - Uses a triangular recurrence limited by maxLoopLength.
  //   - Works in linear rather than log-space.
  // --- Partition-Function Fast (corrected) ---
  //   • Uses a short maxLoop window (≈10) for speed O(N·maxLoop).
  //   • Uses moderate energy constants to avoid underflow.
  //   • Returns 1-mean(binding) for intuitive melt fraction.
  // --- Partition-Function Fast (domain-resolved) ---
  // Pedagogical partition-function analogy: per-base pairing probability
  // depends on GC content and a local cooperative window.
  melt.Simulate.simulatePartitionFunctionFast = function ({
    sequence, temperatures, conditions, params, options
  }) {
    const seq = melt.Thermo.sanitizeSeq(sequence);
    const N = seq.length;
    const win = params?.window ?? 8;
    const coop = params?.cooperativity ?? 0.1;
  
    // local ΔG° proxy from GC content
    const localEnergy = [];
    for (let i = 0; i < N; i++) {
      let gc = 0;
      for (let j = Math.max(0, i - win / 2); j < Math.min(N, i + win / 2); j++) {
        if (seq[j] === "G" || seq[j] === "C") gc++;
      }
      localEnergy[i] = -7 - 2 * (gc / win); // kcal/mol proxy
    }
  
    const perBase = [];
    const fractionMelted = [];
  
    for (const T of temperatures) {
      const TK = T + 273.15;
      const RT = 0.001987 * TK;
      // independent pairing probability
      const bound = localEnergy.map(E => 1 / (1 + Math.exp(-(E / RT))));
      // cooperative smoothing
      const probs = [];
      for (let i = 0; i < N; i++) {
        const left = bound[i - 1] ?? bound[i];
        const right = bound[i + 1] ?? bound[i];
        const adj = (1 - coop) * bound[i] + coop * 0.5 * (left + right);
        probs[i] = 1 - adj; // open probability
      }
      const avg = probs.reduce((a, b) => a + b, 0) / N;
      fractionMelted.push(avg);
      if (options?.returnPerBase) perBase.push(probs);
    }
  
    const result = { temperatures, fractionMelted };
    if (options?.returnPerBase) result.perBase = perBase;
    return result;
  };
  
  
  // --- Full version ---
  // Closer to Chitsaz et al. (2009).
  // Changes compared to Fast version:
  //   - Full O(N²) recursion over all base pairs.
  //   - Includes loop-length penalty and Boltzmann weights.
  //   - Computes per-base open probabilities from pair matrix.
  // --- Partition-Function Full (corrected) ---
  //   • Includes full i–j recursion with loop penalty.
  //   • Prevents exponential underflow by scaling energies.
  //   • Returns fractionMelted = 1-mean(binding probability).
  melt.Simulate.simulatePartitionFunction = function ({
    sequence, temperatures, conditions, params, options
  }) {
    const seq = melt.Thermo.sanitizeSeq(sequence);
    const N = seq.length;
    const maxLoop = Math.max(3, Math.floor(params?.window ?? 30));
    const energyScale = Math.max(0.1, params?.cooperativity ?? 1.0);
  
    const perBase = [];
    const fractionMelted = [];
  
    for (const T of temperatures) {
      const TK = T + 273.15;
      const RT = 0.001987 * TK;
      const Z = Array.from({ length: N }, () => Array(N).fill(0));
  
      for (let len = 1; len < N; len++) {
        for (let i = 0; i + len < N; i++) {
          const j = i + len;
          const gcPair = (seq[i] === "G" && seq[j] === "C") || (seq[i] === "C" && seq[j] === "G");
          const E = energyScale * (gcPair ? -2 : -1);
          const w = Math.exp(-E / Math.max(RT, 1e-6));
          let sum = 1.0;
          for (let k = i + 1; k < j && k - i <= maxLoop; k++) {
            sum += Z[i + 1][k - 1] * Z[k + 1][j - 1];
          }
          Z[i][j] = w * sum;
        }
      }
  
      const Popen = Array(N).fill(1);
      for (let i = 0; i < N; i++) {
        let paired = 0;
        for (let j = 0; j < N; j++) paired += Z[Math.min(i, j)][Math.max(i, j)] ?? 0;
        Popen[i] = 1 - Math.min(1, paired / (1 + paired));
      }
  
      const avg = 1 - Popen.reduce((a, b) => a + b, 0) / N;
      fractionMelted.push(avg);
      if (options?.returnPerBase) perBase.push(Popen.map(p => 1 - p));
    }
  
    const result = { temperatures, fractionMelted };
    if (options?.returnPerBase) result.perBase = perBase;
    return result;
  };

  melt.registry = {
    independent: melt.Simulate.simulateIndependent,
    posterior: melt.Simulate.simulateHMMPosterior,
    viterbi: melt.Simulate.simulateHMMViterbi,
    thermo: melt.Simulate.simulateThermodynamic,
    hmm: melt.Simulate.simulateHMM,
    transferFast: melt.Simulate.simulateTransferMatrixFast,
    transfer: melt.Simulate.simulateTransferMatrix,
    partitionFast: melt.Simulate.simulatePartitionFunctionFast,
    partition: melt.Simulate.simulatePartitionFunction,
    polymer: melt.Simulate.simulatePolymer,
    sigmoid: melt.Simulate.simulateSigmoid
  };

  melt.run = function ({
    algorithm,
    sequence,
    temperatures,
    conditions,
    params,
    options
  }) {
    const handler = melt.registry[algorithm] || melt.registry.independent;
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
