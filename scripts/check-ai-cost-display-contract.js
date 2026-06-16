'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const ai = fs.readFileSync(path.join(root, 'ai.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'public', 'app.js'), 'utf8');

function assertIncludes(label, text, needle) {
  if (!text.includes(needle)) throw new Error(`${label} missing: ${needle}`);
}

assertIncludes('done payload is built explicitly', ai, 'const done = { type: \'done\', turns: msg.num_turns };');
assertIncludes('cost is only exposed for Claude official provider', ai, "if (prov.key === 'claude' && msg.total_cost_usd > 0)");
assertIncludes('third-party cost is not blindly sent', ai, 'done.cost = msg.total_cost_usd;');
assertIncludes('done payload is sent after filtering cost', ai, 'send(done);');
assertIncludes('frontend still displays official cost when present', app, 'if (ev.cost > 0)');

if (ai.includes("send({ type: 'done', cost: msg.total_cost_usd")) {
  throw new Error('AI result must not send SDK cost unconditionally for third-party providers');
}

console.log('ai-cost-display contract ok');
