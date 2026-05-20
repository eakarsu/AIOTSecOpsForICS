const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'ics_incidents',
  fields: ['incident_id','title','status','severity','opened_at','owner'],
  webhookPrefix: 'ics_incidents',
});
