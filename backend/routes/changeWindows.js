const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'change_windows',
  fields: ['window_id','name','start_at','end_at','scope','approver'],
  webhookPrefix: 'change_windows',
});
