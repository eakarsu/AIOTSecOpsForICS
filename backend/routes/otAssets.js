const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'ot_assets',
  fields: ['asset_id','type','vendor','model','criticality','zone'],
  webhookPrefix: 'ot_assets',
});
