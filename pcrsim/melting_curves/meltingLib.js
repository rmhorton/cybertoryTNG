// meltingLib.js
// Self-contained client-side library (SantaLucia 1998 + Owczarzy 2008 + HMM)

(() => {
  const melt = {};

  // --- Constants ---
  melt.NN = {
    'AA': [-7.9, -22.2], 'TT': [-7.9, -22.2],
    'AT': [-7.2, -20.4], 'TA': [-7.2, -21.3],
    'CA': [-8.5, -22.7], 'TG': [-8.5, -22.7],
    'GT': [-8.4, -22.4], 'AC': [-8.4, -22.4],
    'CT': [-7.8, -21.0], 'AG': [-7.8, -21.0],
    'GA': [-8.2, -22.2], 'TC': [-8.2, -22.2],
    'CG': [-10.6, -27.2], 'GC': [-9.8, -24.4],
    'GG': [-8.0, -19.9], 'CC': [-8.0, -19.9]
  };
  melt.R = 1.987;
  melt.log10 = (x) => Math.log(x) / Math.LN10;

  // --- Utilities ---
  melt.sanitizeSeq = (s) => (s || '').toUpperCase().replace(/[^ATGC]/g, '');
  melt.median = (arr) => {
    const a = arr.filter(x => isFinite(x)).slice().sort((x, y) => x - y);
    if (!a.length) return NaN;
    const m = Math.floor(a.length / 2);
    return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
  };

  // --- Thermodynamics ---
  melt.computeTm = (subseq, concM, saltM) => {
    let dH = 0.2, dS = -5.7;
    if (subseq.length < 2) return NaN;
    const first = subseq[0], last = subseq[subseq.length - 1];
    if (first === 'A' || first === 'T') { dH += 2.3; dS += 4.1; }
    if (last === 'A' || last === 'T') { dH += 2.3; dS += 4.1; }
    for (let i = 0; i < subseq.length - 1; i++) {
      const dinuc = subseq[i] + subseq[i + 1];
      const p = melt.NN[dinuc];
      if (!p) return NaN;
      dH += p[0]; dS += p[1];
    }
    const Ct = Math.max(1e-15, concM / 4);
    let TmK = (dH * 1000) / (dS + melt.R * Math.log(Ct));
    return TmK - 273.15;
  };

  melt.localTms = (seq, concM, saltM, windowSize) => {
    const n = seq.length, half = Math.floor(windowSize / 2);
    const tms = new Array(n).fill(NaN);
    for (let i = 0; i < n; i++) {
      const start = Math.max(0, i - half);
      const end = Math.min(n, start + windowSize);
      tms[i] = melt.computeTm(seq.slice(start, end), concM, saltM);
    }
    return tms;
  };

  melt.meltProb = (T, Tm, k) => 1 / (1 + Math.exp(-(T - Tm) / k));

  // --- HMM algorithms ---
  melt.hmmPosterior = (p, L, piM = 0.5, eps = 1e-6) => {
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
  };

  melt.hmmViterbi = (p, L, piM = 0.5, eps = 1e-6) => {
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
  };

  melt.adjustTmForIons = (Tm, saltM, mgM) =>
    Tm + 16.6 * melt.log10(saltM) + 3.85 * melt.log10(1 + 4 * Math.sqrt(mgM));

  melt.probsAtT = (T, tms, k, mode, L, piM, eps, salt, mg) => {
    const indep = tms.map(tm => isFinite(tm) ? melt.meltProb(T, tm, k) : NaN);
    if (mode === 'thermo') {
      return tms.map(tm => isFinite(tm)
        ? melt.meltProb(T, melt.adjustTmForIons(tm, salt, mg), k)
        : NaN);
    }
    if (mode === 'indep' || indep.every(x => !isFinite(x))) return indep;
    if (mode === 'post') return melt.hmmPosterior(indep, L, piM, eps);
    if (mode === 'viterbi') return melt.hmmViterbi(indep, L, piM, eps);
    return indep;
  };

  // expose globally
  window.melt = melt;
})();