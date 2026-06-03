/**
 * Single-query runner for Comunica v5.2.0.
 *
 * Reads JSON {"query":"...","sources":["...","..."]} from stdin,
 * runs the query once, writes JSON to stdout:
 *   {"totalMs": ..., "count": ..., "rows": [ {var: value, ...}, ... ]}
 *
 * Used by FederatedQuery_Final_ExperimentsLocal.ipynb (Python subprocess).
 */

const { QueryEngine } = require('@comunica/query-sparql');

function termToString(term) {
  if (!term) return null;
  if (term.termType === 'NamedNode') return term.value;
  if (term.termType === 'Literal') return term.value;
  if (term.termType === 'BlankNode') return '_:' + term.value;
  return String(term);
}

async function readStdin() {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}

(async () => {
  try {
    const input = await readStdin();
    const { query, sources, limit } = JSON.parse(input);

    const engine = new QueryEngine();
    const start = Date.now();
    const rows = [];
    const stream = await engine.queryBindings(query, { sources });

    await new Promise((resolve, reject) => {
      stream.on('data', binding => {
        if (limit && rows.length >= limit) return;
        const row = {};
        for (const [key, term] of binding) {
          row[key.value] = termToString(term);
        }
        rows.push(row);
      });
      stream.on('end', resolve);
      stream.on('error', reject);
    });

    const totalMs = Date.now() - start;
    process.stdout.write(JSON.stringify({ totalMs, count: rows.length, rows }));
  } catch (err) {
    process.stderr.write(String(err && err.stack || err));
    process.exit(1);
  }
})();
