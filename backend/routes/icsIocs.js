const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'ics_iocs',
  fields: ['ioc_id','type','value','source','confidence','first_seen'],
  webhookPrefix: 'ics_iocs',
});
