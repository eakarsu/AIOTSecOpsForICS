const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'protocol_anomalies',
  fields: ['anomaly_id','protocol','src_asset','dst_asset','type','baseline_deviation'],
  webhookPrefix: 'protocol_anomalies',
});
