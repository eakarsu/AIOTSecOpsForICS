const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'scada_servers',
  fields: ['server_id','role','version','location','redundancy','last_backup'],
  webhookPrefix: 'scada_servers',
});
