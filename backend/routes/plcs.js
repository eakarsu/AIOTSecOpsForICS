const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'plcs',
  fields: ['plc_id','vendor','firmware','location','status','last_patch'],
  webhookPrefix: 'plcs',
});
