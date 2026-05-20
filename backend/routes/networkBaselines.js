const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'network_baselines',
  fields: ['baseline_id','zone','protocol','learned_at','drift_pct','status'],
  webhookPrefix: 'network_baselines',
});
