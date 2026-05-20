const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'hmis',
  fields: ['hmi_id','plant','operating_system','version','status','owner'],
  webhookPrefix: 'hmis',
});
