const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'ics_runbooks',
  fields: ['runbook_id','name','category','scenario','version','owner'],
  webhookPrefix: 'ics_runbooks',
});
