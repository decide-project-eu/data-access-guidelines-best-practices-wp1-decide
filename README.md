# data-access-guidelines-best-practices-wp1-decide
## SPARQL Query Benchmark (Comunica v5.2.0)

**DOI:** 10.5281/zenodo.17085993

This repository documents and compares three data access approaches — **direct data sharing**, **centralized access**, and **federated access using Solid Pods** — evaluated within the DECIDE project (WP1, Task 1.3). It provides practical guidelines, experimental benchmarks (Comunica v5.2.0), Jupyter notebooks, and best practices for FAIR- and GDPR-aligned data sharing in veterinary disease surveillance.

Reproducible benchmark code for the data-access experiments in:

> **From data silos to actionable insights: A comparative evaluation of data access approaches for animal health surveillance.**

The benchmark queries RDF data hosted in **Solid Pods** using the open-source [**Comunica**](https://comunica.dev/) SPARQL engine (`@comunica/query-sparql` **v5.2.0**), comparing **centralized** access (one combined dataset) against **federated** access (data distributed across multiple pods), over the Livestock Health Ontology (LHO).

---

## How it works

The engine is given a SPARQL **query** and a JSON array of **sources**, and runs the query over them in place, no data movement:

```js
const stream = await engine.queryBindings(query, { sources });
```

- **Centralized:** `sources` is a **single** combined dataset hosted as one file on a pod.
- **Federated:** `sources` is the **list** of separate pod TTL URLs, queried in parallel.

Same engine, same query — only the data topology differs.

| Script                              | Description                                                              |
| ----------------------------------- | ------------------------------------------------------------------------ |
| **`centralized-v5.2.0.js`** | Queries the combined cattle dataset (one source) with Q1.                |
| **`benchmark-v5.2.0.js`**   | Runs the three federated experiments (5 runs each), reports mean ± std. |
| `run_query.js` | Single-query JSON runner (used by the notebook) |
| `package.json`                    | Dependency:`@comunica/query-sparql ^5.2.0`.                            |
| `FederatedQuery_Final_ExperimentsLocal.ipynb` | Experiments + Welch's t-tests + figures |
| `Results/` | Figure 5 (centralized vs federated) and Figure 6 (vertical vs horizontal) |

---

## Requirements

- **Node.js** ≥ 18 (uses the global `fetch`)
- **Access** to the Solid pods at `https://solidserver.bovi-analytics.com /  https://solidserver2.bovi-analytics.com`

---

## First time? Step-by-step setup (no Node.js experience needed)

You do **not** need to write or edit any code — just install Node.js once and run the commands.

1. **Install Node.js.** Download the **LTS** installer from [https://nodejs.org](https://nodejs.org), run it, and accept the defaults. This also installs `npm`. Close and reopen your terminal afterwards.
2. **Check it worked.** Open a terminal , on **Windows** use *PowerShell*, on **macOS / Linux** use *Terminal* , and run:

   ```bash
   node --version
   npm --version
   ```

   Both should print a version number (Node ≥ 18).
3. **Get the code.** Download this repository as a ZIP and unzip it (or `git clone` it).
4. **Open a terminal inside the unzipped folder.**

   - **Windows:** open the folder in File Explorer, type `powershell` in the address bar, and press Enter.
   - **macOS / Linux:** `cd` into the folder.
5. **Install the dependency (one time only):**

   ```bash
   npm install
   ```

   This downloads Comunica into a local `node_modules` folder (may take a minute).
6. **Run an experiment** (see below). Results print directly in the terminal — nothing else to set up.

---

## Run it

```bash
npm install

# Centralized — combined cattle dataset (one source):
node centralized-v5.2.0.js

# Federated — all three experiments:
node benchmark-v5.2.0.js

# Or one / some federated experiments at a time:
node benchmark-v5.2.0.js exp1
node benchmark-v5.2.0.js exp1 exp3
```

---

## Experiments

| Layout                                  | Sources                   | Query                    | Maps to paper                       |
| --------------------------------------- | ------------------------- | ------------------------ | ----------------------------------- |
| **Centralized — cattle**         | 1 combined cattle dataset | Q1 (single-species)      | Centralized arm of**Table 4** |
| **Federated Exp 1 — cattle**     | 5 cattle pods             | Q1 (single-species)      | Federated arm of**Table 4**   |
| **Federated Exp 2 — vertical**   |  species-specific pods  | Q2 (multi-species UNION) | **Table 5** (vertical)        |
| **Federated Exp 3 — horizontal** |  mixed-species pods      | Q2 (same UNION)          | **Table 5** (horizontal)      |

Centralized and federated cattle runs use the **same query (Q1)** and the **same engine**;
only the topology differs (1 combined source vs 5 pods), which isolates federation overhead.
Federated Exp 2 and Exp 3 likewise use the **identical query (Q2)** over the **same data** .

---

## Expected results (full dataset)

Values as reported in the paper, measured on the **complete** dataset:

| Layout                  | Rows            | Mean time (n = 5) |
| ----------------------- | --------------- | ----------------- |
| Centralized — cattle   | **569**   | ~20 s             |
| Federated — cattle     | **569**   | ~30 s             |
| Federated — vertical   | **1,378** | ~30 s             |
| Federated — horizontal | **1,378** | ~34 s             |

The **row counts are deterministic**; the **timings vary with network latency and load**
(the first run of each experiment is typically slower, as connections warm up).

---

## Sample data vs. full data

The diagnostic data are **sensitive** and shared under agreements with the participating laboratories.

The public Solid pods therefore host a **small sample (a few rows per pod)** so that the workflow can be run and inspected by anyone.

As a result, **running these scripts against the public sample pods will return only a few rows in a second or two, it will NOT reproduce the 569 / 1,378 row counts or the timings above.** Those numbers were measured by the authors on the complete dataset, which is not publicly available. The `expected: 569 / 1378` labels printed by the scripts refer to the full dataset and are provided only as a reference.

In short: the **code** is fully reproducible; the **published numbers** require the full (private) dataset.

---

## Citation

Code and sample RDF dataset archived on Zenodo: [https://doi.org/10.5281/zenodo.17085993](https://doi.org/10.5281/zenodo.17085993)

## Data availability
The diagnostic data are sensitive and shared under agreements with the participating laboratories. The public pods host a small **sample** so the workflow can be run by anyone; the row counts and timings reported in the paper were measured on the **complete dataset**, which is not publicly available. Code and sample RDF are archived on Zenodo: https://doi.org/10.5281/zenodo.17085993
