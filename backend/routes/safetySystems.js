const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'safety_systems',
  fields: ['sis_id','name','type','sil_level','last_test','status'],
  webhookPrefix: 'safety_systems',
});
