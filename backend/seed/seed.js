const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'ot_secops_ics',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function run() {
  const client = await pool.connect();
  try {
    console.log('[seed] resetting tables...');
    await client.query(`
      DROP TABLE IF EXISTS ot_assets           CASCADE;
      DROP TABLE IF EXISTS plcs                CASCADE;
      DROP TABLE IF EXISTS hmis                CASCADE;
      DROP TABLE IF EXISTS scada_servers       CASCADE;
      DROP TABLE IF EXISTS ics_alerts          CASCADE;
      DROP TABLE IF EXISTS ics_incidents       CASCADE;
      DROP TABLE IF EXISTS network_zones       CASCADE;
      DROP TABLE IF EXISTS protocol_anomalies  CASCADE;
      DROP TABLE IF EXISTS firmware_versions   CASCADE;
      DROP TABLE IF EXISTS vendor_patches      CASCADE;
      DROP TABLE IF EXISTS change_windows      CASCADE;
      DROP TABLE IF EXISTS safety_systems      CASCADE;
      DROP TABLE IF EXISTS control_loops       CASCADE;
      DROP TABLE IF EXISTS operator_actions    CASCADE;
      DROP TABLE IF EXISTS ics_runbooks        CASCADE;
      DROP TABLE IF EXISTS network_baselines   CASCADE;
      DROP TABLE IF EXISTS ics_iocs            CASCADE;
      DROP TABLE IF EXISTS audit_log           CASCADE;
      DROP TABLE IF EXISTS ai_results          CASCADE;
      DROP TABLE IF EXISTS users               CASCADE;
      DROP TABLE IF EXISTS notifications       CASCADE;
      DROP TABLE IF EXISTS attachments         CASCADE;
      DROP TABLE IF EXISTS webhooks            CASCADE;
      DROP TABLE IF EXISTS webhook_deliveries  CASCADE;
    `);

    console.log('[seed] applying migrations...');
    const schema1 = fs.readFileSync(path.join(__dirname, '..', 'migrations', '001_schema.sql'), 'utf8');
    await client.query(schema1);
    // Apply pass 7: zone editor, change-window approvals, SIS audit, vendor advisories
    const schema2Path = path.join(__dirname, '..', 'migrations', '002_apply7.sql');
    if (fs.existsSync(schema2Path)) {
      const schema2 = fs.readFileSync(schema2Path, 'utf8');
      await client.query(schema2);
    }

    // ───────── ot_assets ─────────
    console.log('[seed] ot_assets...');
    const otAssets = [
      ['OTA-0001','PLC',          'Siemens',           'S7-1500',                'critical','Refinery Zone A'],
      ['OTA-0002','HMI',          'Rockwell',          'FactoryTalk View ME',    'high',    'Pumping Station 2'],
      ['OTA-0003','SCADA Server', 'GE',                'iFIX 6.5',               'critical','Control Room 1'],
      ['OTA-0004','RTU',          'Schneider Electric','SCADAPack 535E',         'high',    'Substation North'],
      ['OTA-0005','Engineering WS','Siemens',          'SIMATIC Manager',        'high',    'Engineering Office'],
      ['OTA-0006','PLC',          'Rockwell',          'ControlLogix 1756',      'critical','Boiler House'],
      ['OTA-0007','Historian',    'OSIsoft',           'PI Server 2018',         'critical','Data Center'],
      ['OTA-0008','HMI',          'Wonderware',        'InTouch 2020',           'medium',  'Compressor Plant'],
      ['OTA-0009','Safety PLC',   'HIMA',              'HIMax X-CPU-31',         'critical','Safety Cabinet 1'],
      ['OTA-0010','PLC',          'Schneider Electric','Modicon M580',           'high',    'Water Treatment'],
      ['OTA-0011','Field Switch', 'Cisco',             'IE-4000-8GT4G-E',        'medium',  'Field Network L2'],
      ['OTA-0012','Gateway',      'Moxa',              'MGate 5111',             'medium',  'DMZ'],
      ['OTA-0013','HMI',          'Siemens',           'WinCC Comfort V16',      'high',    'Mixing Unit B'],
      ['OTA-0014','PLC',          'ABB',               'AC 800M PM866',          'critical','Generator Hall'],
      ['OTA-0015','Jump Server',  'Microsoft',         'Windows Server 2019',    'high',    'DMZ'],
    ];
    for (const r of otAssets) {
      await client.query(`INSERT INTO ot_assets (asset_id,type,vendor,model,criticality,zone) VALUES ($1,$2,$3,$4,$5,$6)`, r);
    }

    // ───────── plcs ─────────
    console.log('[seed] plcs...');
    const plcs = [
      ['PLC-1001','Siemens',           'V2.9.2',  'Refinery Zone A',     'online',     '2026-02-12'],
      ['PLC-1002','Rockwell',          'v32.011', 'Boiler House',        'online',     '2026-01-28'],
      ['PLC-1003','Schneider Electric','SV4.20',  'Water Treatment',     'online',     '2025-11-15'],
      ['PLC-1004','ABB',               '6.0.3',   'Generator Hall',      'degraded',   '2025-12-04'],
      ['PLC-1005','Siemens',           'V2.8.1',  'Substation North',    'online',     '2025-09-20'],
      ['PLC-1006','Rockwell',          'v33.012', 'Compressor Plant',    'online',     '2026-03-02'],
      ['PLC-1007','HIMA',              'HCFW6.30','Safety Cabinet 1',    'online',     '2026-01-09'],
      ['PLC-1008','Yokogawa',          'R5.05.20','Polymer Reactor',     'online',     '2025-10-22'],
      ['PLC-1009','Mitsubishi',        'FX5U-R32','Packaging Line',      'online',     '2026-02-25'],
      ['PLC-1010','Omron',             'NX1P2',   'Conveyor Cell 3',     'offline',    '2025-08-14'],
      ['PLC-1011','Siemens',           'V3.0.1',  'Pumping Station 2',   'online',     '2026-04-01'],
      ['PLC-1012','Phoenix Contact',   'FW 4.40', 'Tank Farm East',      'maintenance','2026-01-15'],
      ['PLC-1013','Bosch Rexroth',     'v14',     'Press Line 2',        'online',     '2025-12-30'],
      ['PLC-1014','Beckhoff',          'TwinCAT3','Building Mgmt',       'online',     '2026-03-18'],
      ['PLC-1015','Emerson',           'DeltaV14','DCS Module 4',        'online',     '2026-02-08'],
    ];
    for (const r of plcs) {
      await client.query(`INSERT INTO plcs (plc_id,vendor,firmware,location,status,last_patch) VALUES ($1,$2,$3,$4,$5,$6)`, r);
    }

    // ───────── hmis ─────────
    console.log('[seed] hmis...');
    const hmis = [
      ['HMI-2001','Refinery Plant A',  'Windows 10 LTSC',   '21H2',     'online',     'Adam Carter'],
      ['HMI-2002','Boiler House',      'Windows Server 2019','1809',    'online',     'Maria Lopez'],
      ['HMI-2003','Water Treatment',   'Windows 10 LTSC',   '1809',     'online',     'Jin Park'],
      ['HMI-2004','Generator Hall',    'Windows 7 SP1',     'SP1',      'eol',        'Bilal Khan'],
      ['HMI-2005','Substation North',  'Windows 11 IoT',    '23H2',     'online',     'Sara Weber'],
      ['HMI-2006','Compressor Plant',  'Windows 10 LTSC',   '21H2',     'online',     'Tomasz Nowak'],
      ['HMI-2007','Polymer Reactor',   'Windows Server 2016','1607',    'patching',   'Ravi Iyer'],
      ['HMI-2008','Packaging Line',    'Windows 10 LTSC',   '21H2',     'online',     'Lena Müller'],
      ['HMI-2009','Conveyor Cell 3',   'Windows 10',        '22H2',     'offline',    'Diego Rivera'],
      ['HMI-2010','Pumping Station 2', 'Windows 11 IoT',    '23H2',     'online',     'Ayşe Demir'],
      ['HMI-2011','Tank Farm East',    'Windows 10 LTSC',   '21H2',     'online',     'Henrik Olsen'],
      ['HMI-2012','Press Line 2',      'Windows Server 2022','21H2',    'online',     'Yuki Tanaka'],
      ['HMI-2013','Building Mgmt',     'Windows 10',        '22H2',     'online',     'Chen Wei'],
      ['HMI-2014','DCS Module 4',      'Windows Server 2019','1809',    'maintenance','Olu Adeyemi'],
      ['HMI-2015','Mixing Unit B',     'Windows 10 LTSC',   '21H2',     'online',     'Priya Singh'],
    ];
    for (const r of hmis) {
      await client.query(`INSERT INTO hmis (hmi_id,plant,operating_system,version,status,owner) VALUES ($1,$2,$3,$4,$5,$6)`, r);
    }

    // ───────── scada_servers ─────────
    console.log('[seed] scada_servers...');
    const scadas = [
      ['SCD-3001','Primary',   '6.5 SIM10','Control Room 1','active-passive','2026-05-10'],
      ['SCD-3002','Standby',   '6.5 SIM10','Control Room 1','active-passive','2026-05-10'],
      ['SCD-3003','Historian', '2018 SP3', 'Data Center',   'cluster',       '2026-05-12'],
      ['SCD-3004','Engineering','9.2.1',   'Engineering Office','single',    '2026-04-30'],
      ['SCD-3005','Primary',   '12.0.3',   'Control Room 2','active-active', '2026-05-13'],
      ['SCD-3006','Standby',   '12.0.3',   'Control Room 2','active-active', '2026-05-13'],
      ['SCD-3007','Alarm',     '4.1',      'Control Room 1','single',        '2026-05-08'],
      ['SCD-3008','DMZ Proxy', '2.4.5',    'DMZ',           'single',        '2026-05-14'],
      ['SCD-3009','Reporting', '2020 R2',  'Data Center',   'cluster',       '2026-05-11'],
      ['SCD-3010','Primary',   '7.1.2',    'Substation North','active-passive','2026-05-09'],
      ['SCD-3011','Standby',   '7.1.2',    'Substation North','active-passive','2026-05-09'],
      ['SCD-3012','Backup',    'Veeam 12', 'Data Center',   'single',        '2026-05-15'],
      ['SCD-3013','Patch Mgmt','SCCM 2403','IT DMZ',        'single',        '2026-05-14'],
      ['SCD-3014','AD Domain', '2019',     'IT DMZ',        'cluster',       '2026-05-12'],
      ['SCD-3015','Historian', '2018 SP3', 'DR Site',       'replica',       '2026-05-15'],
    ];
    for (const r of scadas) {
      await client.query(`INSERT INTO scada_servers (server_id,role,version,location,redundancy,last_backup) VALUES ($1,$2,$3,$4,$5,$6)`, r);
    }

    // ───────── ics_alerts ─────────
    console.log('[seed] ics_alerts...');
    const alerts = [
      ['ALT-4001','Claroty CTD',  'critical','OTA-0001','Suspicious Modbus write to PLC during off-hours','open'],
      ['ALT-4002','Dragos',       'high',    'PLC-1004','DNP3 unsolicited response burst from substation','triaging'],
      ['ALT-4003','Nozomi Guardian','critical','PLC-1006','Unauthorized firmware update attempt detected','investigating'],
      ['ALT-4004','Splunk SIEM',  'medium',  'HMI-2001','Operator override outside change window','closed'],
      ['ALT-4005','Claroty CTD',  'high',    'OTA-0007','Protocol anomaly cluster on Purdue level 2','open'],
      ['ALT-4006','Dragos',       'medium',  'OTA-0012','SMB v1 traffic from DMZ jump host','triaging'],
      ['ALT-4007','Nozomi Guardian','critical','PLC-1009','PLC stop command from unauthorized engineering WS','open'],
      ['ALT-4008','Tenable.ot',   'low',     'OTA-0008','Outdated firmware reported on field device','closed'],
      ['ALT-4009','Claroty CTD',  'high',    'PLC-1011','Ethernet/IP enumeration scan against PLC','investigating'],
      ['ALT-4010','Splunk SIEM',  'medium',  'OTA-0015','Failed logon attempts from external IP','closed'],
      ['ALT-4011','Dragos',       'critical','OTA-0009','Safety controller forced into bypass mode','open'],
      ['ALT-4012','Nozomi Guardian','high',  'PLC-1015','Profinet packet storm on cell network','triaging'],
      ['ALT-4013','Tenable.ot',   'medium',  'OTA-0011','New asset connected to OT network without approval','open'],
      ['ALT-4014','Claroty CTD',  'high',    'PLC-1003','Modbus function code 0x90 (program write) issued','investigating'],
      ['ALT-4015','Splunk SIEM',  'critical','OTA-0002','HMI account abused after-hours from remote IP','open'],
    ];
    for (const r of alerts) {
      await client.query(`INSERT INTO ics_alerts (alert_id,source,severity,asset_id,signature,status) VALUES ($1,$2,$3,$4,$5,$6)`, r);
    }

    // ───────── ics_incidents ─────────
    console.log('[seed] ics_incidents...');
    const incidents = [
      ['INC-5001','Suspicious Modbus traffic against refinery PLC',     'investigating','critical','2026-05-15 06:12+00','Yusuf Erdem'],
      ['INC-5002','Engineering WS infected with USB-borne malware',     'open',         'high',    '2026-05-14 21:30+00','Maria Lopez'],
      ['INC-5003','Unauthorized firmware push on boiler PLC',           'contained',    'critical','2026-05-13 09:45+00','Jin Park'],
      ['INC-5004','Operator override outside approved change window',   'closed',       'medium',  '2026-05-12 14:20+00','Bilal Khan'],
      ['INC-5005','Protocol anomaly cluster on Purdue L2',              'investigating','high',    '2026-05-16 02:10+00','Sara Weber'],
      ['INC-5006','Ransomware indicators on jump host',                 'eradicating',  'critical','2026-05-11 23:55+00','Tomasz Nowak'],
      ['INC-5007','GPS spoofing affecting station time sync',           'open',         'medium',  '2026-05-15 17:00+00','Ravi Iyer'],
      ['INC-5008','Suspicious VPN access from unusual geo',             'closed',       'low',     '2026-05-10 03:30+00','Lena Müller'],
      ['INC-5009','PLC stop command issued from rogue node',            'investigating','critical','2026-05-15 13:42+00','Diego Rivera'],
      ['INC-5010','Safety system forced into bypass for 4 minutes',     'investigating','critical','2026-05-16 05:55+00','Ayşe Demir'],
      ['INC-5011','HMI screen unresponsive in Compressor Plant',        'closed',       'medium',  '2026-05-09 11:20+00','Henrik Olsen'],
      ['INC-5012','Historian disk filled — alarms suppressed',          'closed',       'high',    '2026-05-08 02:00+00','Yuki Tanaka'],
      ['INC-5013','Phishing campaign targeting OT engineers',           'open',         'high',    '2026-05-14 12:50+00','Chen Wei'],
      ['INC-5014','Vendor remote-support session not logged',           'closed',       'medium',  '2026-05-07 18:35+00','Olu Adeyemi'],
      ['INC-5015','Unknown DNS lookups from engineering subnet',        'investigating','high',    '2026-05-15 22:18+00','Priya Singh'],
    ];
    for (const r of incidents) {
      await client.query(`INSERT INTO ics_incidents (incident_id,title,status,severity,opened_at,owner) VALUES ($1,$2,$3,$4,$5,$6)`, r);
    }

    // ───────── network_zones ─────────
    console.log('[seed] network_zones...');
    const zones = [
      ['ZN-6001','Process Network',     'L1', 'critical','10.10.1.1',   45],
      ['ZN-6002','Supervisory Control', 'L2', 'critical','10.10.2.1',   38],
      ['ZN-6003','Operations Mgmt',     'L3', 'high',    '10.10.3.1',   24],
      ['ZN-6004','OT DMZ',              'L3.5','high',   '10.10.35.1',  12],
      ['ZN-6005','Enterprise',          'L4', 'medium',  '10.20.0.1',  140],
      ['ZN-6006','Internet',            'L5', 'low',     '0.0.0.0',      0],
      ['ZN-6007','Safety System',       'L1', 'critical','10.11.1.1',    9],
      ['ZN-6008','Refinery Cell A',     'L1', 'critical','10.10.10.1',  22],
      ['ZN-6009','Refinery Cell B',     'L1', 'critical','10.10.11.1',  19],
      ['ZN-6010','Substation North',    'L1', 'critical','10.10.12.1',  16],
      ['ZN-6011','Water Treatment',     'L1', 'high',    '10.10.13.1',  14],
      ['ZN-6012','Boiler House',        'L1', 'critical','10.10.14.1',  11],
      ['ZN-6013','Building Mgmt',       'L2', 'medium',  '10.10.20.1',  28],
      ['ZN-6014','Vendor Remote',       'L3.5','medium', '10.10.36.1',   6],
      ['ZN-6015','DR Site',             'L3', 'high',    '10.30.0.1',   34],
    ];
    for (const r of zones) {
      await client.query(`INSERT INTO network_zones (zone_id,name,purdue_level,criticality,gateway,asset_count) VALUES ($1,$2,$3,$4,$5,$6)`, r);
    }

    // ───────── protocol_anomalies ─────────
    console.log('[seed] protocol_anomalies...');
    const anomalies = [
      ['ANM-7001','Modbus TCP', 'OTA-0001','PLC-1001','function-code-spike',          312.5],
      ['ANM-7002','DNP3',       'OTA-0004','SCD-3010','unsolicited-response-burst',   180.2],
      ['ANM-7003','EtherNet/IP','HMI-2001','PLC-1006','enumeration-scan',              97.4],
      ['ANM-7004','Profinet',   'PLC-1015','PLC-1015','packet-storm',                 540.0],
      ['ANM-7005','OPC UA',     'SCD-3001','SCD-3003','session-spike',                 64.1],
      ['ANM-7006','S7Comm',     'OTA-0005','PLC-1001','program-block-write',           22.8],
      ['ANM-7007','BACnet',     'HMI-2013','OTA-0013','broadcast-flood',              210.5],
      ['ANM-7008','Modbus TCP', 'OTA-0010','PLC-1003','function-code-0x5b',            18.0],
      ['ANM-7009','IEC-61850',  'SCD-3010','PLC-1005','goose-message-anomaly',         88.7],
      ['ANM-7010','SMB',        'OTA-0015','OTA-0007','smb-v1-traffic',                12.0],
      ['ANM-7011','EtherNet/IP','OTA-0012','PLC-1011','class3-msg-flood',             145.6],
      ['ANM-7012','HTTP',       'OTA-0015','OTA-0012','beacon-pattern',                34.2],
      ['ANM-7013','OPC UA',     'OTA-0005','SCD-3001','unauthorized-subscription',     29.9],
      ['ANM-7014','S7Comm-Plus','OTA-0005','PLC-1011','firmware-upload',              430.0],
      ['ANM-7015','Modbus TCP', 'PLC-1010','PLC-1011','rate-anomaly',                 240.0],
    ];
    for (const r of anomalies) {
      await client.query(`INSERT INTO protocol_anomalies (anomaly_id,protocol,src_asset,dst_asset,type,baseline_deviation) VALUES ($1,$2,$3,$4,$5,$6)`, r);
    }

    // ───────── firmware_versions ─────────
    console.log('[seed] firmware_versions...');
    const firmwares = [
      ['FW-8001','Siemens',           'S7-1500',          'V2.9.2',   2,  true],
      ['FW-8002','Siemens',           'S7-1500',          'V2.8.1',   6,  false],
      ['FW-8003','Rockwell',          'ControlLogix 1756','v33.012',  1,  true],
      ['FW-8004','Rockwell',          'ControlLogix 1756','v32.011',  4,  false],
      ['FW-8005','Schneider Electric','Modicon M580',     'SV4.20',   3,  true],
      ['FW-8006','Schneider Electric','SCADAPack 535E',   'v8.16.1',  5,  true],
      ['FW-8007','ABB',               'AC 800M PM866',    '6.0.3',    2,  true],
      ['FW-8008','HIMA',              'HIMax X-CPU-31',   'HCFW6.30', 0,  true],
      ['FW-8009','Yokogawa',          'CENTUM VP',        'R6.10.10', 1,  true],
      ['FW-8010','Emerson',           'DeltaV',           'v14.LTS',  2,  true],
      ['FW-8011','Mitsubishi',        'FX5U-R32',         '1.260',    1,  true],
      ['FW-8012','Omron',             'NX1P2',            '1.45',     2,  true],
      ['FW-8013','Phoenix Contact',   'AXC F 2152',       'FW 4.40',  3,  true],
      ['FW-8014','Beckhoff',          'CX5140',           '4024.42',  1,  true],
      ['FW-8015','Bosch Rexroth',     'IndraMotion MLC',  'v14',      2,  true],
    ];
    for (const r of firmwares) {
      await client.query(`INSERT INTO firmware_versions (firmware_id,vendor,model,version,cve_count,latest) VALUES ($1,$2,$3,$4,$5,$6)`, r);
    }

    // ───────── vendor_patches ─────────
    console.log('[seed] vendor_patches...');
    const patches = [
      ['VP-9001','Siemens',           'SSA-714771 — S7-1500 auth bypass',           'critical','S7-1500 V2.8.x','pending'],
      ['VP-9002','Rockwell',          'CVE-2026-1102 — Logix logic injection',      'high',    'ControlLogix 1756 v32.x','staged'],
      ['VP-9003','Schneider Electric','SEVD-2026-067 — Modicon DoS',                'medium',  'Modicon M580 SV4.10','applied'],
      ['VP-9004','ABB',               'ABBVU-PSGS-1A45 — AC 800M memory overflow',  'high',    'AC 800M PM866 6.0.1','pending'],
      ['VP-9005','HIMA',              'HIMA-A-2026-002 — config write w/o auth',    'critical','HIMax X-CPU-31','staged'],
      ['VP-9006','GE',                'iFIX-2026-04 — historian path traversal',    'medium',  'iFIX 6.0','applied'],
      ['VP-9007','OSIsoft',           'PI-2026-09 — PI Web API XSS',                'medium',  'PI Server 2018','applied'],
      ['VP-9008','Wonderware',        'WW-2026-11 — InTouch DLL hijack',            'high',    'InTouch 2017','pending'],
      ['VP-9009','Moxa',              'MX-2026-005 — MGate auth weakness',          'high',    'MGate 5111','pending'],
      ['VP-9010','Cisco',             'cisco-sa-iesw-2026 — IOS XE',                'medium',  'IE-4000 series','applied'],
      ['VP-9011','Microsoft',         'KB5036893 — Win10 LTSC May rollup',          'high',    'Windows 10 LTSC 21H2','staged'],
      ['VP-9012','Emerson',           'DV-2026-12 — DeltaV controller hardening',   'medium',  'DeltaV v14','applied'],
      ['VP-9013','Yokogawa',          'YK-2026-02 — Centum auth bypass',            'high',    'CENTUM VP R6.05','pending'],
      ['VP-9014','Phoenix Contact',   'PC-2026-03 — AXC F 2152 web UI auth',        'medium',  'AXC F 2152 FW<4.40','applied'],
      ['VP-9015','Mitsubishi',        'MA-2026-007 — FX5U remote code',             'critical','FX5U-R32 <1.260','pending'],
    ];
    for (const r of patches) {
      await client.query(`INSERT INTO vendor_patches (patch_id,vendor,advisory,severity,affected_models,status) VALUES ($1,$2,$3,$4,$5,$6)`, r);
    }

    // ───────── change_windows ─────────
    console.log('[seed] change_windows...');
    const windows = [
      ['CW-1101','May Refinery Shutdown',  '2026-05-25 22:00+00','2026-05-26 06:00+00','Refinery Zone A — PLC patches','Yusuf Erdem'],
      ['CW-1102','Substation Failover',    '2026-05-19 02:00+00','2026-05-19 04:00+00','Substation North primary→standby','Sara Weber'],
      ['CW-1103','Boiler Patching',        '2026-05-22 23:00+00','2026-05-23 03:00+00','Boiler House PLC firmware','Jin Park'],
      ['CW-1104','Water Treatment Upgrade','2026-05-28 01:00+00','2026-05-28 05:00+00','Water Treatment PLC SW update','Bilal Khan'],
      ['CW-1105','Historian Maintenance',  '2026-05-20 00:00+00','2026-05-20 02:00+00','PI Server cluster failover','Ravi Iyer'],
      ['CW-1106','DMZ Firewall Rule Push', '2026-05-18 21:00+00','2026-05-18 22:00+00','DMZ — outbound HTTPS tighten','Maria Lopez'],
      ['CW-1107','Compressor Patching',    '2026-05-24 22:00+00','2026-05-25 02:00+00','Compressor Plant HMI patches','Tomasz Nowak'],
      ['CW-1108','Polymer Reactor Upgrade','2026-05-30 22:00+00','2026-05-31 06:00+00','Reactor PLC + DCS module','Lena Müller'],
      ['CW-1109','Packaging Line Patch',   '2026-05-21 23:00+00','2026-05-22 01:00+00','Packaging Line PLC patches','Diego Rivera'],
      ['CW-1110','Conveyor Network Reroute','2026-05-19 22:00+00','2026-05-20 00:00+00','Conveyor cell L2 switch swap','Ayşe Demir'],
      ['CW-1111','Tank Farm PLC Replace',  '2026-06-01 02:00+00','2026-06-01 06:00+00','Tank Farm East controller swap','Henrik Olsen'],
      ['CW-1112','Press Line Patch',       '2026-05-23 22:00+00','2026-05-24 00:00+00','Press Line 2 PLC patches','Yuki Tanaka'],
      ['CW-1113','BMS Patching',           '2026-05-26 02:00+00','2026-05-26 04:00+00','Building Mgmt controller','Chen Wei'],
      ['CW-1114','DCS Module Replace',     '2026-05-29 22:00+00','2026-05-30 02:00+00','DCS Module 4 firmware','Olu Adeyemi'],
      ['CW-1115','Mixing Unit Cutover',    '2026-05-27 01:00+00','2026-05-27 03:00+00','Mixing Unit B PLC cutover','Priya Singh'],
    ];
    for (const r of windows) {
      await client.query(`INSERT INTO change_windows (window_id,name,start_at,end_at,scope,approver) VALUES ($1,$2,$3,$4,$5,$6)`, r);
    }

    // ───────── safety_systems ─────────
    console.log('[seed] safety_systems...');
    const sis = [
      ['SIS-2201','Refinery ESD',          'ESD','SIL3','2026-04-12','healthy'],
      ['SIS-2202','Boiler Burner Management','BMS','SIL2','2026-03-22','healthy'],
      ['SIS-2203','Water Treatment Trip',  'ESD','SIL2','2026-05-01','healthy'],
      ['SIS-2204','Generator Hall Trip',   'ESD','SIL3','2025-12-19','degraded'],
      ['SIS-2205','Polymer Reactor SIS',   'SIS','SIL3','2026-02-08','healthy'],
      ['SIS-2206','Tank Farm Overfill',    'HIPPS','SIL2','2026-04-25','healthy'],
      ['SIS-2207','Compressor Surge Prot.','ESD','SIL2','2026-03-30','healthy'],
      ['SIS-2208','Substation Trip',       'PSP','SIL2','2026-05-08','healthy'],
      ['SIS-2209','Mixing Unit ESD',       'ESD','SIL2','2026-04-19','degraded'],
      ['SIS-2210','Pumping Station Trip',  'ESD','SIL2','2026-02-28','healthy'],
      ['SIS-2211','Refinery Fire & Gas',   'FGS','SIL3','2026-04-02','healthy'],
      ['SIS-2212','Packaging Line ESD',    'ESD','SIL1','2026-03-15','healthy'],
      ['SIS-2213','DCS Safety Loop',       'SIS','SIL2','2026-05-10','healthy'],
      ['SIS-2214','Boiler Overpressure',   'HIPPS','SIL3','2026-04-28','healthy'],
      ['SIS-2215','Conveyor E-Stop Mesh',  'ESS','SIL2','2026-03-04','bypassed'],
    ];
    for (const r of sis) {
      await client.query(`INSERT INTO safety_systems (sis_id,name,type,sil_level,last_test,status) VALUES ($1,$2,$3,$4,$5,$6)`, r);
    }

    // ───────── control_loops ─────────
    console.log('[seed] control_loops...');
    const loops = [
      ['LP-3301','Crude Inlet Temp',       'PLC-1001','TI-1001.PV','TI-1001.SP','normal'],
      ['LP-3302','Boiler Drum Level',      'PLC-1002','LI-2010.PV','LI-2010.SP','normal'],
      ['LP-3303','Water Treatment pH',     'PLC-1003','AI-3300.PV','AI-3300.SP','normal'],
      ['LP-3304','Generator Speed',        'PLC-1004','SI-4100.PV','SI-4100.SP','oscillating'],
      ['LP-3305','Substation Bus Voltage', 'PLC-1005','VI-5050.PV','VI-5050.SP','normal'],
      ['LP-3306','Compressor Discharge P', 'PLC-1006','PI-6020.PV','PI-6020.SP','normal'],
      ['LP-3307','Reactor Jacket Temp',    'PLC-1008','TI-7090.PV','TI-7090.SP','normal'],
      ['LP-3308','Packaging Line Speed',   'PLC-1009','SI-8100.PV','SI-8100.SP','normal'],
      ['LP-3309','Conveyor Tension',       'PLC-1010','LI-9012.PV','LI-9012.SP','manual'],
      ['LP-3310','Pump Suction Pressure',  'PLC-1011','PI-1120.PV','PI-1120.SP','normal'],
      ['LP-3311','Tank Farm Level',        'PLC-1012','LI-1330.PV','LI-1330.SP','frozen'],
      ['LP-3312','Press Line Force',       'PLC-1013','FI-1440.PV','FI-1440.SP','normal'],
      ['LP-3313','Chiller Setpoint (BMS)', 'PLC-1014','TI-1550.PV','TI-1550.SP','normal'],
      ['LP-3314','DCS Distillate Cut',     'PLC-1015','AI-1660.PV','AI-1660.SP','normal'],
      ['LP-3315','Mixing Unit Ratio',      'PLC-1015','FI-1770.PV','FI-1770.SP','oscillating'],
    ];
    for (const r of loops) {
      await client.query(`INSERT INTO control_loops (loop_id,name,asset,pv_tag,sp_tag,status) VALUES ($1,$2,$3,$4,$5,$6)`, r);
    }

    // ───────── operator_actions ─────────
    console.log('[seed] operator_actions...');
    const actions = [
      ['OPA-4401','adam.carter',  'PLC-1001','SP change TI-1001 230C→235C','2026-05-15 06:20+00','Process upset response'],
      ['OPA-4402','maria.lopez',  'PLC-1002','Manual bypass LI-2010 alarm', '2026-05-14 22:00+00','Sensor swap in progress'],
      ['OPA-4403','jin.park',     'PLC-1003','Acknowledge pH high-high',    '2026-05-13 10:30+00','False positive — sensor calib'],
      ['OPA-4404','bilal.khan',   'PLC-1004','Force start gen #2',          '2026-05-12 14:25+00','Grid frequency support'],
      ['OPA-4405','sara.weber',   'PLC-1005','Open breaker B17',            '2026-05-16 02:45+00','Maintenance lockout'],
      ['OPA-4406','tomasz.nowak', 'PLC-1006','Setpoint change PI-6020',     '2026-05-11 23:50+00','Discharge over-pressure'],
      ['OPA-4407','ravi.iyer',    'PLC-1008','Manual override reactor jacket','2026-05-15 17:05+00','Cooling water issue'],
      ['OPA-4408','lena.muller',  'PLC-1009','Pause packaging line',        '2026-05-10 03:35+00','Mechanical jam'],
      ['OPA-4409','diego.rivera', 'PLC-1010','Issue PLC STOP',              '2026-05-15 13:50+00','Unauthorized — investigation'],
      ['OPA-4410','ayse.demir',   'OTA-0009','Force SIS bypass',            '2026-05-16 05:55+00','Pending fix of trip valve'],
      ['OPA-4411','henrik.olsen', 'PLC-1011','Start spare pump',            '2026-05-09 11:25+00','Main pump trip'],
      ['OPA-4412','yuki.tanaka',  'PLC-1013','Reset press line force lim',  '2026-05-08 02:10+00','Operator error correction'],
      ['OPA-4413','chen.wei',     'PLC-1014','Adjust chiller setpoint',     '2026-05-14 13:00+00','Hot weather response'],
      ['OPA-4414','olu.adeyemi',  'PLC-1015','Switch DCS module to manual', '2026-05-07 18:40+00','Vendor diagnostic'],
      ['OPA-4415','priya.singh',  'PLC-1015','Mixing ratio change',         '2026-05-15 22:25+00','Product grade transition'],
    ];
    for (const r of actions) {
      await client.query(`INSERT INTO operator_actions (action_id,operator,asset,action,ts,justification) VALUES ($1,$2,$3,$4,$5,$6)`, r);
    }

    // ───────── ics_runbooks ─────────
    console.log('[seed] ics_runbooks...');
    const runbooks = [
      ['RB-5501','Ransomware on OT Jump Host',  'Containment','Suspicious encryption activity on engineering jump server','v3.2','SOC OT Team'],
      ['RB-5502','Unauthorized PLC Firmware Push','Eradication','Detect & revert unauthorized firmware upload on PLC','v2.0','Plant Engineering'],
      ['RB-5503','Modbus Anomaly Triage',       'Triage',      'Investigate Modbus function-code anomalies','v1.5','Tier-1 OT SOC'],
      ['RB-5504','Operator Override Review',    'Compliance',  'Review operator overrides outside change windows','v1.1','Compliance & Audit'],
      ['RB-5505','SIS Bypass Investigation',    'Safety',      'Investigate safety system forced into bypass','v2.4','Process Safety'],
      ['RB-5506','Network Zone Crossing Alert', 'Triage',      'Asset crossed Purdue zone boundary unexpectedly','v1.0','Network Team'],
      ['RB-5507','Vendor Patch Emergency',      'Patching',    'Emergency vendor advisory rollout','v3.0','Patch Team'],
      ['RB-5508','GPS / Time Sync Drift',       'Triage',      'Investigate station clock drift or GPS spoofing','v1.2','OT SOC'],
      ['RB-5509','Historian Outage Response',   'Recovery',    'PI server cluster degraded or down','v2.1','Data Platform'],
      ['RB-5510','Phishing of OT Engineers',    'Containment', 'Targeted phishing of OT/ICS personnel','v1.3','Security Awareness'],
      ['RB-5511','Suspicious VPN Access',       'Triage',      'Anomalous geo / time VPN login','v1.0','Identity Team'],
      ['RB-5512','PLC Stop Command',            'Eradication', 'PLC issued STOP from unknown source','v2.2','Plant Engineering'],
      ['RB-5513','DCS Module Failover',         'Recovery',    'Failover DCS module to standby','v3.1','Control Engineering'],
      ['RB-5514','Switch / VLAN Misconfig',     'Recovery',    'Misconfigured field switch causing storm','v1.4','Network Team'],
      ['RB-5515','Supply-Chain Firmware Audit', 'Hunt',        'Verify firmware hashes against vendor goldens','v1.0','Vendor Risk'],
    ];
    for (const r of runbooks) {
      await client.query(`INSERT INTO ics_runbooks (runbook_id,name,category,scenario,version,owner) VALUES ($1,$2,$3,$4,$5,$6)`, r);
    }

    // ───────── network_baselines ─────────
    console.log('[seed] network_baselines...');
    const baselines = [
      ['BL-6601','Refinery Cell A',     'Modbus TCP', '2026-05-01 00:00+00',  3.2,'stable'],
      ['BL-6602','Substation North',    'DNP3',       '2026-04-25 00:00+00',  6.1,'stable'],
      ['BL-6603','Boiler House',        'EtherNet/IP','2026-04-28 00:00+00', 12.4,'drifting'],
      ['BL-6604','Water Treatment',     'Modbus TCP', '2026-05-02 00:00+00',  2.8,'stable'],
      ['BL-6605','Polymer Reactor',     'OPC UA',     '2026-04-20 00:00+00',  4.5,'stable'],
      ['BL-6606','Packaging Line',      'Profinet',   '2026-04-30 00:00+00',  8.9,'drifting'],
      ['BL-6607','Conveyor Cell 3',     'EtherCAT',   '2026-04-22 00:00+00',  1.6,'stable'],
      ['BL-6608','Pumping Station 2',   'Modbus TCP', '2026-05-03 00:00+00',  5.0,'stable'],
      ['BL-6609','Tank Farm East',      'Modbus TCP', '2026-04-29 00:00+00', 18.2,'breach'],
      ['BL-6610','Press Line 2',        'Profinet',   '2026-05-04 00:00+00',  7.3,'stable'],
      ['BL-6611','Building Mgmt',       'BACnet',     '2026-04-27 00:00+00',  9.1,'drifting'],
      ['BL-6612','DCS Module 4',        'OPC UA',     '2026-05-05 00:00+00',  3.7,'stable'],
      ['BL-6613','Generator Hall',      'IEC-61850',  '2026-04-26 00:00+00', 14.8,'breach'],
      ['BL-6614','Mixing Unit B',       'S7Comm',     '2026-05-06 00:00+00',  4.2,'stable'],
      ['BL-6615','OT DMZ',              'HTTPS',      '2026-05-07 00:00+00',  6.6,'stable'],
    ];
    for (const r of baselines) {
      await client.query(`INSERT INTO network_baselines (baseline_id,zone,protocol,learned_at,drift_pct,status) VALUES ($1,$2,$3,$4,$5,$6)`, r);
    }

    // ───────── ics_iocs ─────────
    console.log('[seed] ics_iocs...');
    const iocs = [
      ['IOC-7701','ip',     '203.0.113.45',                                        'Dragos WW',         'high',   '2026-05-12 04:00+00'],
      ['IOC-7702','domain', 'update.ics-firmware-vendor[.]net',                    'CISA advisory',     'high',   '2026-05-10 14:00+00'],
      ['IOC-7703','hash',   'd41d8cd98f00b204e9800998ecf8427e',                    'Mandiant',          'medium', '2026-05-11 09:30+00'],
      ['IOC-7704','ip',     '198.51.100.77',                                        'OT-ISAC',           'high',   '2026-05-13 22:00+00'],
      ['IOC-7705','filename','svchost_update.exe',                                  'Claroty TRL',       'medium', '2026-05-09 11:15+00'],
      ['IOC-7706','hash',   '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8','Internal hunt','high','2026-05-14 06:45+00'],
      ['IOC-7707','registry','HKLM\\SYSTEM\\CurrentControlSet\\Services\\ICSAgent', 'CrowdStrike',       'low',    '2026-05-08 19:00+00'],
      ['IOC-7708','domain', 'cdn.opcua-tools[.]ru',                                 'CISA advisory',     'high',   '2026-05-15 02:10+00'],
      ['IOC-7709','ip',     '192.0.2.131',                                          'Nozomi',            'medium', '2026-05-16 03:30+00'],
      ['IOC-7710','hash',   'b3a8e0e1f9ab1bfe3a147ef3d9b1f3b4cf7d2c1e5a9b8c7d6e5f4a3b2c1d0e9f','Mandiant','high','2026-05-15 12:00+00'],
      ['IOC-7711','ip',     '203.0.113.99',                                         'Internal hunt',     'medium', '2026-05-14 17:45+00'],
      ['IOC-7712','filename','plc_loader.dll',                                      'Dragos WW',         'high',   '2026-05-13 20:20+00'],
      ['IOC-7713','domain', 'auth.scada-services[.]biz',                            'OT-ISAC',           'medium', '2026-05-12 08:00+00'],
      ['IOC-7714','user-agent','EngStudio/1.0',                                     'Claroty TRL',       'low',    '2026-05-11 14:30+00'],
      ['IOC-7715','hash',   'aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d',             'Internal hunt',     'high',   '2026-05-16 01:00+00'],
    ];
    for (const r of iocs) {
      await client.query(`INSERT INTO ics_iocs (ioc_id,type,value,source,confidence,first_seen) VALUES ($1,$2,$3,$4,$5,$6)`, r);
    }

    // ───────── audit_log ─────────
    console.log('[seed] audit_log...');
    const audit = [
      ['AU-8801','adam.carter@otsec.io','PLC-1001','setpoint-change','success','2026-05-15 06:20+00'],
      ['AU-8802','maria.lopez@otsec.io','PLC-1002','alarm-bypass',   'success','2026-05-14 22:00+00'],
      ['AU-8803','jin.park@otsec.io',   'PLC-1003','ack-alarm',      'success','2026-05-13 10:30+00'],
      ['AU-8804','bilal.khan@otsec.io', 'PLC-1004','start-asset',    'success','2026-05-12 14:25+00'],
      ['AU-8805','sara.weber@otsec.io', 'PLC-1005','open-breaker',   'success','2026-05-16 02:45+00'],
      ['AU-8806','admin@otsec.io',      'users',   'create-user',    'success','2026-05-01 08:00+00'],
      ['AU-8807','analyst@otsec.io',    'ics_alerts','update-status','success','2026-05-15 03:00+00'],
      ['AU-8808','viewer@otsec.io',     'ics_alerts','read',         'success','2026-05-15 03:05+00'],
      ['AU-8809','svc.scanner@otsec.io','ot_assets','scan',          'success','2026-05-14 23:00+00'],
      ['AU-8810','svc.patcher@otsec.io','vendor_patches','apply',    'success','2026-05-13 02:00+00'],
      ['AU-8811','unknown',             'jump-host','login',         'failed', '2026-05-12 04:01+00'],
      ['AU-8812','unknown',             'vpn',     'login',          'failed', '2026-05-12 04:02+00'],
      ['AU-8813','vendor.acme@otsec.io','PLC-1006','remote-support', 'success','2026-05-11 14:00+00'],
      ['AU-8814','adam.carter@otsec.io','sis_2204','sis-bypass',     'success','2026-05-16 05:55+00'],
      ['AU-8815','admin@otsec.io',      'webhooks','create',         'success','2026-05-02 09:30+00'],
    ];
    for (const r of audit) {
      await client.query(`INSERT INTO audit_log (entry_id,actor,target,action,result,ts) VALUES ($1,$2,$3,$4,$5,$6)`, r);
    }

    // ───────── users ─────────
    console.log('[seed] users...');
    const users = [
      ['admin@otsec.io',  'admin123',   'OT Security Admin', 'admin'],
      ['analyst@otsec.io','analyst123', 'OT Analyst',        'analyst'],
      ['viewer@otsec.io', 'viewer123',  'Plant Viewer',      'viewer'],
    ];
    for (const u of users) {
      await client.query(`INSERT INTO users (email,password,name,role) VALUES ($1,$2,$3,$4)`, u);
    }

    // ───────── notifications ─────────
    console.log('[seed] notifications...');
    const notes = [
      [1,'Critical ICS alert',         'Suspicious Modbus write on refinery PLC',         'critical','ics_alerts'],
      [1,'Unauthorized firmware push', 'Boiler PLC firmware tampering attempt detected',  'critical','ics_incidents'],
      [1,'SIS bypassed',               'Safety system forced into bypass for 4 minutes',  'critical','safety_systems'],
      [2,'Protocol anomaly cluster',   'OPC UA / Profinet anomalies on Purdue L2',        'high',    'protocol_anomalies'],
      [2,'Patch backlog growing',      '7 critical vendor patches still pending',         'high',    'vendor_patches'],
    ];
    for (const n of notes) {
      await client.query(`INSERT INTO notifications (user_id,title,body,severity,source) VALUES ($1,$2,$3,$4,$5)`, n);
    }

    // ───────── webhooks ─────────
    console.log('[seed] webhooks...');
    const webhooks = [
      ['OT SOC Notifier',  'https://httpbin.org/post', 'sec_otsoc_2026',   'ics_alerts.created,ics_incidents.created', true],
      ['Plant Mgmt Bridge','https://httpbin.org/post', 'sec_plantmgmt_2026','ics_incidents.created',                   true],
    ];
    for (const w of webhooks) {
      await client.query(`INSERT INTO webhooks (name,url,secret,events,active) VALUES ($1,$2,$3,$4,$5)`, w);
    }

    console.log('[seed] complete.');
  } catch (e) {
    console.error('[seed] error:', e);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
