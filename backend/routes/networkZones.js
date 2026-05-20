const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'network_zones',
  fields: ['zone_id','name','purdue_level','criticality','gateway','asset_count'],
  webhookPrefix: 'network_zones',
});
