const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'vendor_patches',
  fields: ['patch_id','vendor','advisory','severity','affected_models','status'],
  webhookPrefix: 'vendor_patches',
});
