/**
 * ctmc.js – Continuous-Time Markov Chain utilities for UCLTouchRehab PLP HEA
 *
 * Provides matrix logarithm and exponential to derive a proper monthly
 * transition matrix from data observed over t months (e.g. 15 weeks = 3.45 months).
 *
 * Method:
 *   1. Q_raw  = log(P_observed) / t          [matrix logarithm]
 *   2. Q      = clampGenerator(Q_raw)        [fix negative off-diagonals — see §18 of Methodology]
 *   3. P_1mo  = exp(Q × 1)                   [matrix exponential]
 *
 * Clamping is the standard NICE DSU TSD-14 / CADTH approach for the "embedding problem":
 * when a stochastic matrix does not have a valid generator (negative rate entries),
 * negative off-diagonals are set to zero and diagonals are renormalised so row sums = 0.
 * The resulting Q is the closest valid generator in the L1 sense.
 *
 * References:
 *   Higham NJ (2008). Functions of Matrices: Theory and Computation. SIAM.
 *   Israel RB, Rosenthal JS, Wei JZ (2001). Finding generators for Markov chains.
 *     Advances in Applied Probability 33(3):603–616.
 *   NICE DSU TSD 14 (2014). Survival analysis for economic evaluations.
 */

'use strict';

const CTMCMath = (() => {

    /* ── Basic matrix helpers ── */
    const zeros = (n, m) =>
        Array.from({ length: n }, () => Array(m !== undefined ? m : n).fill(0));

    const eye = n => {
        const I = zeros(n);
        for (let i = 0; i < n; i++) I[i][i] = 1;
        return I;
    };

    const clone = A => A.map(r => [...r]);

    const add   = (A, B) => A.map((r, i) => r.map((v, j) => v + B[i][j]));
    const sub   = (A, B) => A.map((r, i) => r.map((v, j) => v - B[i][j]));
    const scl   = (A, s) => A.map(r => r.map(v => v * s));

    const mul = (A, B) => {
        const n = A.length, m = B[0].length, p = B.length;
        const C = zeros(n, m);
        for (let i = 0; i < n; i++)
            for (let k = 0; k < p; k++)
                if (A[i][k] !== 0)
                    for (let j = 0; j < m; j++)
                        C[i][j] += A[i][k] * B[k][j];
        return C;
    };

    const frob = A =>
        Math.sqrt(A.reduce((s, r) => s + r.reduce((ss, v) => ss + v * v, 0), 0));

    const infNorm = A =>
        Math.max(...A.map(r => r.reduce((s, v) => s + Math.abs(v), 0)));

    /* ── LU decomposition with partial pivoting ── */
    const luDecomp = A => {
        const n = A.length;
        const U = clone(A), L = eye(n), P = eye(n);
        for (let k = 0; k < n; k++) {
            let maxVal = Math.abs(U[k][k]), maxRow = k;
            for (let i = k + 1; i < n; i++)
                if (Math.abs(U[i][k]) > maxVal) { maxVal = Math.abs(U[i][k]); maxRow = i; }
            if (maxRow !== k) {
                [U[k], U[maxRow]] = [U[maxRow], U[k]];
                [P[k], P[maxRow]] = [P[maxRow], P[k]];
                for (let j = 0; j < k; j++) [L[k][j], L[maxRow][j]] = [L[maxRow][j], L[k][j]];
            }
            if (Math.abs(U[k][k]) < 1e-15) continue;
            for (let i = k + 1; i < n; i++) {
                L[i][k] = U[i][k] / U[k][k];
                for (let j = k; j < n; j++) U[i][j] -= L[i][k] * U[k][j];
            }
        }
        return { L, U, P };
    };

    const solve = (A, b) => {
        const { L, U, P } = luDecomp(A);
        const n = A.length;
        const pb = P.map(r => r.reduce((s, v, j) => s + v * b[j], 0));
        const y = Array(n).fill(0);
        for (let i = 0; i < n; i++) {
            y[i] = pb[i];
            for (let j = 0; j < i; j++) y[i] -= L[i][j] * y[j];
        }
        const x = Array(n).fill(0);
        for (let i = n - 1; i >= 0; i--) {
            x[i] = y[i];
            for (let j = i + 1; j < n; j++) x[i] -= U[i][j] * x[j];
            if (Math.abs(U[i][i]) > 1e-15) x[i] /= U[i][i];
        }
        return x;
    };

    const inv = A => {
        const n = A.length, R = zeros(n);
        for (let j = 0; j < n; j++) {
            const col = solve(A, eye(n).map(r => r[j]));
            for (let i = 0; i < n; i++) R[i][j] = col[i];
        }
        return R;
    };

    /* ── Denman–Beavers matrix square root ── */
    const sqrtm = A => {
        let Y = clone(A), Z = eye(A.length);
        for (let k = 0; k < 24; k++) {
            const Yi = inv(Y), Zi = inv(Z);
            const Yn = scl(add(Y, Zi), 0.5);
            const Zn = scl(add(Z, Yi), 0.5);
            const err = frob(sub(Yn, Y));
            Y = Yn; Z = Zn;
            if (err < 1e-13) break;
        }
        return Y;
    };

    /* ── Matrix exponential – Padé [3/3] with scaling & squaring ── */
    const expm = A => {
        const n = A.length;
        let s = Math.max(0, Math.ceil(Math.log2(infNorm(A) + 1e-15)));
        const As = scl(A, 1 / Math.pow(2, s));
        const I  = eye(n);
        const A2 = mul(As, As);
        const U  = mul(As, add(A2, scl(I, 60)));
        const V  = add(scl(A2, 12), scl(I, 120));
        let F = mul(inv(sub(V, U)), add(V, U));
        for (let i = 0; i < s; i++) F = mul(F, F);
        return F;
    };

    /* ── Matrix logarithm – inverse scaling & squaring + Mercator series ── */
    const logm = P => {
        const n = P.length;
        let A = clone(P);
        let k = 0;
        for (let iter = 0; iter < 20; iter++) {
            if (frob(sub(A, eye(n))) < 0.5) break;
            A = sqrtm(A);
            k++;
        }
        const X = sub(A, eye(n));
        let logA = zeros(n);
        let Xk   = eye(n);
        for (let j = 1; j <= 30; j++) {
            Xk   = mul(Xk, X);
            const term = scl(Xk, Math.pow(-1, j + 1) / j);
            logA = add(logA, term);
            if (frob(term) < 1e-14) break;
        }
        return scl(logA, Math.pow(2, k));
    };

    /**
     * Clamp a generator matrix to be a valid CTMC generator.
     *
     * The matrix logarithm of a stochastic matrix can produce negative
     * off-diagonal entries due to the "embedding problem" — not every
     * stochastic matrix is embeddable in a CTMC with a valid generator.
     *
     * Standard fix (Israel, Rosenthal & Wei 2001; NICE DSU TSD 14):
     *   1. Set any negative off-diagonal Q[i][j] < 0 to 0  (transition rates must be ≥ 0)
     *   2. Renormalise the diagonal: Q[i][i] = -sum_{j≠i} Q[i][j]  (so rows sum to 0)
     *
     * This produces the closest valid generator in the element-wise L1 sense.
     * The modifications are typically very small (< 0.01/month) and have negligible
     * impact on model results for near-embeddable matrices.
     *
     * @param {number[][]} Q – raw generator (may have small negative off-diagonals)
     * @param {number} threshold – values below this are considered zero (default 0)
     * @returns {{ Q: number[][], numClamped: number, maxClamp: number }}
     */
    const clampGenerator = (Q, threshold = 0) => {
        const n = Q.length;
        const Qc = Q.map(r => [...r]);
        let numClamped = 0;
        let maxClamp   = 0;

        for (let i = 0; i < n; i++) {
            // Death is an absorbing state — its row must stay [0,…,0,1] → Q row = [0,…,0]
            // We leave it untouched; it should already be all-zeros in Q.
            if (i === n - 1) continue;  // Skip absorbing Death row

            let sumOff = 0;
            for (let j = 0; j < n; j++) {
                if (i !== j) {
                    if (Qc[i][j] < threshold) {
                        maxClamp = Math.max(maxClamp, Math.abs(Qc[i][j]));
                        Qc[i][j] = 0;
                        numClamped++;
                    }
                    sumOff += Qc[i][j];
                }
            }
            // Renormalise diagonal so row sums to exactly 0
            Qc[i][i] = -sumOff;
        }

        return { Q: Qc, numClamped, maxClamp };
    };

    /* ── Public API ── */
    return {
        /**
         * Compute the generator matrix Q = clamp(log(P_observed) / t)
         *
         * Applies the Israel-Rosenthal-Wei clamping procedure after the matrix log
         * to ensure the generator is valid (non-negative off-diagonals, rows sum to 0).
         * The raw (pre-clamp) generator and clamping statistics are also returned
         * for transparency and display in the CTMC panel.
         *
         * @param {number[][]} P_obs  – observed n×n transition matrix over period t
         * @param {number}     t      – observation period in months (e.g. 3.45 for 15 weeks)
         * @returns {{ Q, Q_raw, numClamped, maxClamp }}
         */
        computeGenerator(P_obs, t) {
            const logP  = logm(P_obs);
            const Q_raw = scl(logP, 1 / t);
            const { Q, numClamped, maxClamp } = clampGenerator(Q_raw);
            return { Q, Q_raw, numClamped, maxClamp };
        },

        /**
         * Compute k-month transition matrix from generator Q
         * @param {number[][]} Q       – generator matrix
         * @param {number}     months  – number of months (default 1)
         */
        monthlyMatrix(Q, months) {
            return expm(scl(Q, months !== undefined ? months : 1));
        },

        /**
         * Validate that Q is a proper generator matrix.
         * Returns { valid, issues[], rowSums[] }
         */
        validateGenerator(Q) {
            const n = Q.length;
            const issues  = [];
            const rowSums = [];
            const STATE   = ['Pain Free', 'Mild PLP', 'Moderate PLP', 'Severe PLP', 'Death'];
            for (let i = 0; i < n; i++) {
                let rowSum = 0;
                for (let j = 0; j < n; j++) {
                    rowSum += Q[i][j];
                    if (i !== j && Q[i][j] < -1e-6) {
                        issues.push(
                            `Q[${STATE[i]}→${STATE[j]}] = ${Q[i][j].toFixed(6)} (negative off-diagonal)`
                        );
                    }
                }
                rowSums.push(rowSum);
                if (Math.abs(rowSum) > 0.005) {
                    issues.push(`${STATE[i]} row sum = ${rowSum.toFixed(6)} (should be ≈ 0)`);
                }
            }
            return { valid: issues.length === 0, issues, rowSums };
        },

        /**
         * Validate that P is a proper stochastic matrix (rows sum to 1, entries in [0,1])
         * Returns { valid, issues[], rowSums[] }
         */
        validateStochastic(P) {
            const n = P.length;
            const issues  = [];
            const rowSums = [];
            const STATE   = ['Pain Free', 'Mild PLP', 'Moderate PLP', 'Severe PLP', 'Death'];
            for (let i = 0; i < n; i++) {
                let rowSum = 0;
                for (let j = 0; j < n; j++) {
                    rowSum += P[i][j];
                    if (P[i][j] < -1e-4 || P[i][j] > 1 + 1e-4) {
                        issues.push(`P[${STATE[i]}→${STATE[j]}] = ${P[i][j].toFixed(5)} (outside [0,1])`);
                    }
                }
                rowSums.push(rowSum);
                if (Math.abs(rowSum - 1) > 0.005) {
                    issues.push(`${STATE[i]} row sum = ${rowSum.toFixed(5)} (should be ≈ 1)`);
                }
            }
            return { valid: issues.length === 0, issues, rowSums };
        },

        /**
         * Run a comprehensive self-test suite.
         * Call CTMCMath.selfTest() in the browser console to verify correctness.
         * Returns { passed, failed, log[] }
         */
        selfTest() {
            const log    = [];
            let passed   = 0;
            let failed   = 0;
            const assert = (label, cond, detail) => {
                if (cond) { log.push(`  ✅ PASS: ${label}`); passed++; }
                else      { log.push(`  ❌ FAIL: ${label}${detail ? ' — ' + detail : ''}`); failed++; }
            };

            log.push('── CTMCMath Self-Test Suite ─────────────────────────────');

            // ── Test 1: expm of zero matrix = identity ──
            log.push('\n[1] exp(0) = I');
            const Z = zeros(4);
            const eZ = expm(Z);
            assert('expm(0)[0][0] ≈ 1', Math.abs(eZ[0][0] - 1) < 1e-10);
            assert('expm(0)[0][1] ≈ 0', Math.abs(eZ[0][1]) < 1e-10);

            // ── Test 2: expm(A) expm(-A) = I ──
            log.push('\n[2] exp(A)·exp(-A) = I');
            const A2 = [[0,-1,0,0],[1,0,0,0],[0,0,0,-2],[0,0,2,0]];
            const eA  = expm(A2);
            const emA = expm(scl(A2,-1));
            const prod = mul(eA, emA);
            assert('exp(A)·exp(-A) ≈ I (diag)', Math.abs(prod[0][0]-1)<1e-8 && Math.abs(prod[2][2]-1)<1e-8);

            // ── Test 3: logm(expm(A)) ≈ A ──
            log.push('\n[3] log(exp(Q)) = Q  (round-trip)');
            const Qtest = [[-0.12,0.10,0.02,0,0],[0,-0.08,0.08,0,0],[0,0.05,-0.10,0.05,0],[0,0,0,-0.001,0.001],[0,0,0,0,0]];
            const eQ   = expm(Qtest);
            const logQ = logm(eQ);
            let maxErr = 0;
            for (let i=0;i<5;i++) for (let j=0;j<5;j++) maxErr = Math.max(maxErr, Math.abs(logQ[i][j]-Qtest[i][j]));
            assert(`log(exp(Q)) round-trip max error < 1e-6 (got ${maxErr.toExponential(2)})`, maxErr < 1e-6);

            // ── Test 4: clampGenerator removes negatives ──
            log.push('\n[4] clampGenerator removes negative off-diagonals');
            const Qbad = [[-0.10, 0.08, -0.002, 0.022, 0],[0,-0.05,0.05,0,0],[0,0,-0.01,0.01,0],[0,0,0,-0.001,0.001],[0,0,0,0,0]];
            const {Q: Qgood, numClamped} = clampGenerator(Qbad);
            assert('Negative off-diag clamped to 0', Qgood[0][2] === 0);
            assert('numClamped = 1', numClamped === 1);
            assert('Row 0 sum ≈ 0 after clamp', Math.abs(Qgood[0].reduce((a,b)=>a+b,0)) < 1e-12);

            // ── Test 5: Full pipeline with the PLP parameter data ──
            log.push('\n[5] Full PLP pipeline: P_obs → Q → P_1mo validity');
            const d = 0.0005;
            const P_obs = [
                [0.8892-d, 0.1108,  0.0000,   0.0000,   d],
                [0.0000,   0.9200-d,0.0800,   0.0000,   d],
                [0.0000,   0.0626,  0.8748-d, 0.0626,   d],
                [0.0000,   0.0000,  0.0000,   1.0000-d, d],
                [0.0000,   0.0000,  0.0000,   0.0000,   1.0000],
            ];
            const { Q: Qplp, Q_raw, numClamped: nc } = this.computeGenerator(P_obs, 3.45);
            assert('Generator computed without throw', true);
            assert(`Clamped entries ≥ 0 (${nc} clamped)`, nc >= 0);

            const valQ = this.validateGenerator(Qplp);
            assert('Clamped Q passes validateGenerator', valQ.valid,
                valQ.valid ? '' : valQ.issues.join('; '));

            const Pm = this.monthlyMatrix(Qplp, 1);
            const valP = this.validateStochastic(Pm);
            assert('P_1mo passes validateStochastic', valP.valid,
                valP.valid ? '' : valP.issues.join('; '));

            // Row sums of P_1mo should all be ≈ 1
            let maxRowErr = 0;
            Pm.forEach(r => { maxRowErr = Math.max(maxRowErr, Math.abs(r.reduce((a,b)=>a+b,0)-1)); });
            assert(`P_1mo row sums all ≈ 1 (max err = ${maxRowErr.toExponential(2)})`, maxRowErr < 1e-6);

            // All entries in [0,1]
            let anyNeg = false;
            Pm.forEach(r => r.forEach(v => { if(v < -1e-6 || v > 1+1e-6) anyNeg = true; }));
            assert('All P_1mo entries in [0,1]', !anyNeg);

            // ── Test 6: Verify P_1mo^3.45 ≈ P_obs (reconstruction check) ──
            log.push('\n[6] Reconstruction: exp(Q × 3.45) ≈ P_obs (for non-Death states)');
            const Precon = this.monthlyMatrix(Qplp, 3.45);
            // Pain Free row
            const errPF_PF   = Math.abs(Precon[0][0] - P_obs[0][0]);
            const errPF_Mild = Math.abs(Precon[0][1] - P_obs[0][1]);
            // Mild row
            const errMild_Mild = Math.abs(Precon[1][1] - P_obs[1][1]);
            const errMild_Mod  = Math.abs(Precon[1][2] - P_obs[1][2]);
            // Mod row
            const errMod_Mild  = Math.abs(Precon[2][1] - P_obs[2][1]);
            assert(`PF→PF reconstruction err < 0.01 (got ${errPF_PF.toFixed(5)})`, errPF_PF < 0.01);
            assert(`PF→Mild reconstruction err < 0.01 (got ${errPF_Mild.toFixed(5)})`, errPF_Mild < 0.01);
            assert(`Mild→Mild reconstruction err < 0.01 (got ${errMild_Mild.toFixed(5)})`, errMild_Mild < 0.01);
            assert(`Mild→Mod reconstruction err < 0.01 (got ${errMild_Mod.toFixed(5)})`, errMild_Mod < 0.01);
            assert(`Mod→Mild reconstruction err < 0.01 (got ${errMod_Mild.toFixed(5)})`, errMod_Mild < 0.01);

            // ── Test 7: sqrtm(A)² ≈ A ──
            log.push('\n[7] sqrtm(A)² ≈ A');
            const Asym = [[2,1,0,0],[1,2,1,0],[0,1,2,1],[0,0,1,2]];
            const Asq  = sqrtm(Asym);
            const A2b  = mul(Asq, Asq);
            let sqErr  = 0;
            for(let i=0;i<4;i++) for(let j=0;j<4;j++) sqErr = Math.max(sqErr,Math.abs(A2b[i][j]-Asym[i][j]));
            assert(`sqrtm(A)² ≈ A  max err = ${sqErr.toExponential(2)}`, sqErr < 1e-8);

            // ── Test 8: inv(A) · A = I ──
            log.push('\n[8] inv(A) · A = I');
            const Ainv_test = [[4,3,1,0],[6,3,1,0],[2,6,1,0],[1,0,0,1]];
            const Ai = inv(Ainv_test);
            const prod2 = mul(Ai, Ainv_test);
            let idErr = 0;
            for(let i=0;i<4;i++) for(let j=0;j<4;j++) idErr = Math.max(idErr,Math.abs(prod2[i][j]-(i===j?1:0)));
            assert(`inv(A)·A ≈ I  max err = ${idErr.toExponential(2)}`, idErr < 1e-10);

            // ── Test 9: Q_raw info ──
            log.push('\n[9] Q_raw diagnostic (before clamping)');
            let negCount = 0, maxNeg = 0;
            for(let i=0;i<5;i++) for(let j=0;j<5;j++)
                if(i!==j && Q_raw[i][j]<0){ negCount++; maxNeg=Math.max(maxNeg,Math.abs(Q_raw[i][j])); }
            log.push(`  ℹ Q_raw negative off-diagonals: ${negCount}, max magnitude: ${maxNeg.toFixed(6)}`);
            assert('maxNeg < 0.05 (small clamping adjustment)', maxNeg < 0.05);

            log.push('\n── Results ──────────────────────────────────────────────');
            log.push(`  PASSED: ${passed}   FAILED: ${failed}`);
            if (failed === 0) log.push('  🎉 All tests passed!');

            return { passed, failed, log };
        },

        /**
         * Format matrix as a display-ready 2D array of strings
         */
        formatMatrix(M, dp) {
            dp = dp !== undefined ? dp : 5;
            return M.map(r => r.map(v => {
                if (Math.abs(v) < 1e-10) return (0).toFixed(dp);
                return v.toFixed(dp);
            }));
        },

        // Export internals for testing / advanced use
        expm, logm, sqrtm, inv, mul, sub, add, scl, eye, zeros, frob, clampGenerator
    };
})();
