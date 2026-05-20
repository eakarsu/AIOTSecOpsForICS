const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'operator_actions',
  fields: ['action_id','operator','asset','action','ts','justification'],
  webhookPrefix: 'operator_actions',
});
