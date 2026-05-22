// Apply pass 7 — Network conduits (edges between network_zones).
// This gives the Zone Editor a write surface. Read-only Purdue diagram still
// lives under /api/custom-views; this is the authoring CRUD.
const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'network_conduits',
  fields: ['conduit_id','src_zone_id','dst_zone_id','protocols','direction','posture','notes'],
  webhookPrefix: 'network_conduits',
});
