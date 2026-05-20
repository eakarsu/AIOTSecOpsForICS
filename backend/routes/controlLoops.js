const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'control_loops',
  fields: ['loop_id','name','asset','pv_tag','sp_tag','status'],
  webhookPrefix: 'control_loops',
});
