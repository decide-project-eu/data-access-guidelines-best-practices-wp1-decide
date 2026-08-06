/**
 * Federated Access Benchmark — Comunica v5.2.0
 * =============================================
 * Reproduces the three federated query experiments from:
 *   "From data silos to actionable insights: A comparative evaluation
 *    of data access models for animal health surveillance"
 *
 * Experiments:
 *   Exp 1 -- Cattle Barometer    (Q1 simple,  5 cattle pods)
 *   Exp 2 -- Complex Vertical    (Q2 UNION,  12 species pods)
 *   Exp 3 -- Complex Horizontal  (Q2 UNION,   6 horizontal pods)
 *
 * Usage:
 *   node benchmark-v5.2.0.js            # run all 3 experiments
 *   node benchmark-v5.2.0.js exp1       # only Exp 1
 *   node benchmark-v5.2.0.js exp1 exp3  # Exp 1 and Exp 3
 */

const { QueryEngine } = require('@comunica/query-sparql');

// ----------------------------------------------------------------------
// SPARQL Queries
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

const Q2_COMPLEX_UNION = `
PREFIX LHO: <http://www.purl.org/decide/LiveStockHealthOnto/LHO#>
SELECT ?Sample ?Species ?Pathogen ?Breed ?SampleType ?DiagnosticTest ?ProductionStages ?Country ?SampleResult
WHERE {
  {
    ?Sample a LHO:CattleSample ;
            LHO:hasPathogen ?Pathogen ;
            LHO:hasCountry ?Country ;
            LHO:hasResult ?SampleResult ;
            LHO:hasBreed ?Breed ;
            LHO:hasSampleType ?SampleType ;
            LHO:hasDiagnosticTest ?DiagnosticTest .
    FILTER(?Pathogen = LHO:MB)
    FILTER(?SampleType = LHO:Swab)
    FILTER(?SampleResult = LHO:1)
    BIND("NA" AS ?ProductionStages)
    BIND("Cattle" AS ?Species)
  }
  UNION
  {
    ?Sample a LHO:PigSample ;
            LHO:hasPathogen ?Pathogen ;
            LHO:hasCountry ?Country ;
            LHO:hasResult ?SampleResult ;
            LHO:hasBreed ?Breed ;
            LHO:hasSampleType ?SampleType ;
            LHO:hasDiagnosticTest ?DiagnosticTest ;
            LHO:hasProductionStages ?PigProductionStage .
    FILTER(?Pathogen = LHO:Mycoplasma_hyopneumoniae)
    FILTER(?SampleType = LHO:Tissue)
    FILTER(?PigProductionStage = LHO:Finishing)
    FILTER(?SampleResult = LHO:1)
    BIND(?PigProductionStage AS ?ProductionStages)
    BIND("Pig" AS ?Species)
  }
  UNION
  {
    ?Sample a LHO:PoultrySample ;
            LHO:hasPathogen ?Pathogen ;
            LHO:hasBreed ?Breed ;
            LHO:hasSampleType ?SampleType ;
            LHO:hasProductionStages ?PoultryProductionStage ;
            LHO:hasCountry ?Country ;
            LHO:hasResult ?SampleResult .
    FILTER(?Pathogen = LHO:QX)
    FILTER(?SampleType = LHO:SS)
    FILTER(?PoultryProductionStage = LHO:Broiler)
    FILTER(?SampleResult = LHO:1)
    BIND(?PoultryProductionStage AS ?ProductionStages)
    BIND("Poultry" AS ?Species)
    BIND("NA" AS ?DiagnosticTest)
  }
}
`;

// ----------------------------------------------------------------------
// Solid Pod endpoints
// ----------------------------------------------------------------------

const BASE = 'https://solidserver.bovi-analytics.com';
const BASE2 = 'https://solidserver2.bovi-analytics.com';//for mutliple servers
const BASE3 = 'https://solidserver3.bovi-analytics.com';//for mutliple servers
const cattle_pods = [
  `${BASE}/decide_lab1/Vertical/RDFoutputCattleSampleLab1.ttl`,
  `${BASE}/decide_lab2/Vertical/RDFoutputCattleSampleLab2.ttl`,
  `${BASE}/decide_lab3/Vertical/RDFoutputCattleSampleLab3.ttl`,
  `${BASE}/decide_lab4/Vertical/RDFoutputCattleSampleLab4.ttl`,
  `${BASE}/decide_lab5/Vertical/RDFoutputCattleSampleLab5.ttl`,
];

const pig_pods = [
  `${BASE}/decide_lab6/Vertical/PigLab1.ttl`,
  `${BASE}/decide_lab7/Vertical/PigLab2.ttl`,
  `${BASE}/decide_lab8/Vertical/PigLab3.ttl`,
  `${BASE}/decide_lab9/Vertical/PigLab4.ttl`,
  `${BASE}/decide_lab10/Vertical/PigLab5.ttl`,
  `${BASE}/decide_lab11/Vertical/PigLab6.ttl`,
];

const poultry_pods = [
  `${BASE}/decide_lab12/Vertical/Poultrylab1.ttl`,
];

const vertical_pods = [...cattle_pods, ...pig_pods, ...poultry_pods];

const horizontal_pods = [
  `${BASE}/decide_lab1/Horizontal/HorizontalLab1.ttl`,
  `${BASE}/decide_lab2/Horizontal/HorizontalLab2.ttl`,
  `${BASE}/decide_lab3/Horizontal/HorizontalLab3.ttl`,
  `${BASE}/decide_lab4/Horizontal/HorizontalLab4.ttl`,
  `${BASE}/decide_lab5/Horizontal/HorizontalLab5.ttl`,
  `${BASE}/decide_lab6/Horizontal/HorizontalLab6.ttl`,
  `${BASE}/decide_lab6/Horizontal/HorizontalLab7.ttl`,
  `${BASE}/decide_lab6/Horizontal/HorizontalLab8.ttl`,
  `${BASE}/decide_lab6/Horizontal/HorizontalLab9.ttl`,
  `${BASE}/decide_lab6/Horizontal/HorizontalLab10.ttl`,
  `${BASE}/decide_lab6/Horizontal/HorizontalLab11.ttl`,
  `${BASE}/decide_lab6/Horizontal/HorizontalLab12.ttl`,
];

// ----------------------------------------------------------------------
// Experiment definitions
// ----------------------------------------------------------------------

const EXPERIMENTS = {
  exp1: {
    label: 'Exp 1 -- Cattle Barometer (Q1, 5 cattle pods)',
    sources: cattle_pods,
    query: Q1_CATTLE,
    expectedRows: 569,
  },
  exp2: {
    label: 'Exp 2 -- Vertical federation (Q2, species-specific pods)',
    sources: vertical_pods,
    query: Q2_COMPLEX_UNION,
    expectedRows: 1378,
  },
  exp3: {
    label: 'Exp 3 -- Horizontal federation (Q2,  mixed-species pods)',
    sources: horizontal_pods,
    query: Q2_COMPLEX_UNION,
    expectedRows: 1378,
  },
};

const N_RUNS = 5;

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

async function runExperiment(name, exp) {
  console.log(`\n${'='.repeat(72)}`);
  console.log(`  ${exp.label}`);
  console.log(`  ${exp.sources.length} sources, ${N_RUNS} runs`);
  console.log('='.repeat(72));

  const engine = new QueryEngine();
  const timings = [];
  let lastCount = 0;

  for (let i = 1; i <= N_RUNS; i++) {
    try {
      const { elapsed, count } = await runOnce(engine, exp.query, exp.sources, i);
      timings.push(elapsed);
      lastCount = count;
    } catch (err) {
      console.error(`  Run ${i}:  ERROR  ${err.message}`);
    }
  }

  if (timings.length === 0) return null;

  const mean = timings.reduce((a, b) => a + b, 0) / timings.length;
  const variance = timings.map(t => (t - mean) ** 2).reduce((a, b) => a + b, 0) / timings.length;
  const std = Math.sqrt(variance);

  console.log('  ----');
  console.log(`  Rows:           ${lastCount}    (expected: ${exp.expectedRows}${lastCount === exp.expectedRows ? ' OK' : ' MISMATCH'})`);
  console.log(`  Mean:           ${fmt(mean)} s   +/- ${fmt(std)}`);
  console.log(`  Min / Max:      ${fmt(Math.min(...timings))} s / ${fmt(Math.max(...timings))} s`);

  return {
    name, label: exp.label,
    sources: exp.sources.length,
    rows: lastCount, expectedRows: exp.expectedRows,
    mean, std, timings,
  };
}

async function main() {
  const args = process.argv.slice(2).filter(a => /^exp[123]$/.test(a));
  const toRun = args.length > 0 ? args : ['exp1', 'exp2', 'exp3'];

  console.log('================================================================');
  console.log(' Federated Access Benchmark');
  console.log(' Comunica @comunica/query-sparql v5.2.0');
  console.log('================================================================');
  console.log(` Running: ${toRun.join(', ')}`);
  console.log(` Runs per experiment: ${N_RUNS}`);

  const results = [];
  for (const name of toRun) {
    const r = await runExperiment(name, EXPERIMENTS[name]);
    if (r) results.push(r);
  }

  if (results.length > 0) {
    console.log(`\n${'='.repeat(72)}`);
    console.log('  RESULTS SUMMARY');
    console.log('='.repeat(72));
    console.log(' experiment                    mean(s)        std(s)    rows');
    console.log(' ' + '-'.repeat(70));
    for (const r of results) {
      const tag = r.name.padEnd(28);
      const m = fmt(r.mean).padStart(8);
      const s = fmt(r.std).padStart(8);
      const rows = String(r.rows).padStart(8);
      console.log(` ${tag} ${m}    ${s}    ${rows}`);
    }

    const exp2 = results.find(r => r.name === 'exp2');
    const exp3 = results.find(r => r.name === 'exp3');
    if (exp2 && exp3) {
      const ratio = exp3.mean / exp2.mean;
      console.log('');
      console.log(`  Vertical vs Horizontal ratio: ${fmt(ratio)}x`);
      console.log(`    Vertical (${exp2.sources} pods):   ${fmt(exp2.mean)} +/- ${fmt(exp2.std)} s`);
      console.log(`    Horizontal (${exp3.sources} pods): ${fmt(exp3.mean)} +/- ${fmt(exp3.std)} s`);
    }

    console.log('='.repeat(72));
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
