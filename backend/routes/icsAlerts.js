const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'ics_alerts',
  fields: ['alert_id','source','severity','asset_id','signature','status'],
  webhookPrefix: 'ics_alerts',
});
