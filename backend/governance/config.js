module.exports={
 caseType:'operator_approved_ics_incident_response',initialState:'telemetry_received',
 states:['telemetry_received','evidence_validated','rule_evaluated','triage_owned','response_proposed','operator_approved','containment_recorded','recovery_review','closed','false_positive'],
 createRoles:['ot_analyst','incident_commander'],assessmentRoles:['ot_analyst','incident_commander','safety_engineer','forensic_reviewer'],auditRoles:['incident_commander','safety_engineer','auditor'],connectorRoles:['integration_operator','incident_commander'],
 evidenceKinds:['telemetry_batch_digest','sensor_clock_attestation','scanner_receipt','identity_snapshot','rule_version','asset_zone_snapshot','severity_record','ticket_receipt','notification_receipt','response_plan','operator_approval','containment_receipt','rollback_receipt','recovery_evidence','disposition_record','corpus_evaluation'],
 requiredSignals:['telemetryVersion','ruleVersion','assetVersion','sourceTimestamp','evaluatedAt','staleAfterSeconds','ruleMatched','severity','safetyImpactReviewed','policyVersion'],
 professionalBoundary:'This service detects and records advisory response plans; it cannot scan, isolate, block, patch, restart, or command OT/ICS assets without authorized operators and approved safety procedures.',
 connectors:[{name:'telemetry_scanner',purpose:'read-only signed evidence'},{name:'identity',purpose:'actor/session snapshots'},{name:'ticketing',purpose:'ownership/status receipts'},{name:'notification',purpose:'acknowledged delivery'},{name:'response_orchestrator',purpose:'approved action receipts only'},{name:'artifact_store',purpose:'tamper-evident evidence'}],
 transitions:[
  {from:'telemetry_received',action:'validate_evidence',to:'evidence_validated',roles:['ot_analyst','forensic_reviewer'],requiresEvidence:true},
  {from:'evidence_validated',action:'evaluate_rule',to:'rule_evaluated',roles:['ot_analyst'],requiresEvidence:true},
  {from:'rule_evaluated',action:'assign_triage',to:'triage_owned',roles:['incident_commander'],requiresEvidence:true},
  {from:'triage_owned',action:'propose_response',to:'response_proposed',roles:['ot_analyst','safety_engineer'],requiresEvidence:true},
  {from:'response_proposed',action:'approve_response',to:'operator_approved',roles:['incident_commander','safety_engineer'],requiresEvidence:true,dualControl:true},
  {from:'operator_approved',action:'record_containment',to:'containment_recorded',roles:['integration_operator'],requiresEvidence:true},
  {from:'containment_recorded',action:'review_recovery',to:'recovery_review',roles:['safety_engineer','incident_commander'],requiresEvidence:true,dualControl:true},
  {from:'recovery_review',action:'close',to:'closed',roles:['incident_commander'],requiresEvidence:true,dualControl:true},
  {from:'rule_evaluated',action:'mark_false_positive',to:'false_positive',roles:['forensic_reviewer','incident_commander'],requiresEvidence:true,dualControl:true}
 ],
 assess:x=>{const source=Date.parse(x.sourceTimestamp),evaluated=Date.parse(x.evaluatedAt),limit=Number(x.staleAfterSeconds);const stale=!Number.isFinite(source)||!Number.isFinite(evaluated)||!Number.isFinite(limit)||limit<=0||evaluated<source||(evaluated-source)/1000>limit;const valid=['low','medium','high','critical'].includes(x.severity);return{disposition:stale||!valid?'evidence_freshness_hold':x.ruleMatched!==true?'analyst_false_positive_review':x.safetyImpactReviewed!==true?'safety_review_required':'incident_commander_review_required',responseCommand:null,automatedContainment:false,stale,versions:{telemetry:x.telemetryVersion,rules:x.ruleVersion,asset:x.assetVersion}};}
};
