const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'firmware_versions',
  fields: ['firmware_id','vendor','model','version','cve_count','latest'],
  webhookPrefix: 'firmware_versions',
});
