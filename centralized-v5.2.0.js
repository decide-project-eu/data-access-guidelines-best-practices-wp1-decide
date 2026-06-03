/**
 * Centralized cattle query — Comunica v5.2.0
 * ==========================================
 * Queries the combined cattle RDF dataset, hosted as a single file on a
 * Solid Pod, using @comunica/query-sparql v5.2.0 with query Q1.
 *
 * Usage:
 *   node centralized-v5.2.0.js
 */

const { QueryEngine } = require('@comunica/query-sparql');

// ----------------------------------------------------------------------
// SPARQL Query (Q1)
// ----------------------------------------------------------------------

const Q1_CATTLE = `
PREFIX LHO: <http://www.purl.org/decide/LiveStockHealthOnto/LHO#>
SELECT ?Sample ?Pathogen ?Breed ?SampleType ?DiagnosticTest ?Country ?Province ?SampleResult
WHERE {
  ?Sample a LHO:CattleSample ;
          LHO:hasPathogen ?Pathogen ;
          LHO:hasSampleType ?SampleType ;
          LHO:hasCountry ?Country ;
          LHO:hasProvince ?Province ;
          LHO:hasBreed ?Breed ;
          LHO:hasDiagnosticTest ?DiagnosticTest ;
          LHO:hasResult ?SampleResult .
  FILTER(?Pathogen = LHO:MB)
  FILTER(?SampleType = LHO:Swab)
  FILTER(?SampleResult = LHO:1)
}
`;

// ----------------------------------------------------------------------
// Source: combined cattle dataset hosted as a single file on a Solid Pod
// ----------------------------------------------------------------------

const BASE = 'https://solidserver.bovi-analytics.com';
const combined_source = `${BASE}/decide_Combined_labs/RDFoutputcombined.ttl`;

const N_RUNS = 5;
const EXPECTED_ROWS = 569;

// ----------------------------------------------------------------------
// Runner
// ----------------------------------------------------------------------

function fmt(n) { return n.toFixed(2); }

async function runOnce(engine, query, sources, runIdx) {
  const start = Date.now();
  let count = 0;
  const stream = await engine.queryBindings(query, { sources });
  await new Promise((resolve, reject) => {
    stream.on('data', () => { count += 1; });
    stream.on('end', resolve);
    stream.on('error', reject);
  });
  const elapsed = (Date.now() - start) / 1000;
  console.log(`  Run ${runIdx}:  ${fmt(elapsed).padStart(7)} s    rows=${count}`);
  return { elapsed, count };
}

async function main() {
  console.log('================================================================');
  console.log(' Centralized cattle query');
  console.log(' Comunica @comunica/query-sparql v5.2.0');
  console.log('================================================================');
  console.log(' Query: Q1 (cattle MB-positive swabs)');
  console.log(` Source: ${combined_source}`);
  console.log(` Runs: ${N_RUNS}`);

  console.log(`\n${'='.repeat(72)}`);
  console.log('  Combined cattle dataset (single source)');
  console.log('='.repeat(72));

  const engine = new QueryEngine();
  const timings = [];
  let lastCount = 0;

  for (let i = 1; i <= N_RUNS; i++) {
    try {
      const { elapsed, count } = await runOnce(engine, Q1_CATTLE, [combined_source], i);
      timings.push(elapsed);
      lastCount = count;
    } catch (err) {
      console.error(`  Run ${i}:  ERROR  ${err.message}`);
    }
  }

  if (timings.length === 0) {
    console.error('\n  No successful runs. Check that the source is reachable and public-read.');
    process.exit(1);
  }

  const mean = timings.reduce((a, b) => a + b, 0) / timings.length;
  const std = Math.sqrt(timings.map(t => (t - mean) ** 2).reduce((a, b) => a + b, 0) / timings.length);

  console.log('  ----');
  console.log(`  Rows:           ${lastCount}    (expected: ${EXPECTED_ROWS}${lastCount === EXPECTED_ROWS ? ' OK' : ' MISMATCH'})`);
  console.log(`  Mean:           ${fmt(mean)} s   +/- ${fmt(std)}`);
  console.log(`  Min / Max:      ${fmt(Math.min(...timings))} s / ${fmt(Math.max(...timings))} s`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
