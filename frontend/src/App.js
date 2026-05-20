import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';

// 18 CRUD pages
import OtAssetsPage          from './pages/OtAssetsPage';
import PlcsPage              from './pages/PlcsPage';
import HmisPage              from './pages/HmisPage';
import ScadaServersPage      from './pages/ScadaServersPage';
import IcsAlertsPage         from './pages/IcsAlertsPage';
import IcsIncidentsPage      from './pages/IcsIncidentsPage';
import NetworkZonesPage      from './pages/NetworkZonesPage';
import ProtocolAnomaliesPage from './pages/ProtocolAnomaliesPage';
import FirmwareVersionsPage  from './pages/FirmwareVersionsPage';
import VendorPatchesPage     from './pages/VendorPatchesPage';
import ChangeWindowsPage     from './pages/ChangeWindowsPage';
import SafetySystemsPage     from './pages/SafetySystemsPage';
import ControlLoopsPage      from './pages/ControlLoopsPage';
import OperatorActionsPage   from './pages/OperatorActionsPage';
import IcsRunbooksPage       from './pages/IcsRunbooksPage';
import NetworkBaselinesPage  from './pages/NetworkBaselinesPage';
import IcsIocsPage           from './pages/IcsIocsPage';
import AuditLogPage          from './pages/AuditLogPage';

// 16 AI pages
import AITriageIcsAlertPage         from './pages/AITriageIcsAlertPage';
import AIBaselineProtocolPage       from './pages/AIBaselineProtocolPage';
import AIClassifyIncidentPage       from './pages/AIClassifyIncidentPage';
import AISuggestIsolationPage       from './pages/AISuggestIsolationPage';
import AIDraftChangeProcedurePage   from './pages/AIDraftChangeProcedurePage';
import AIVendorPatchImpactPage      from './pages/AIVendorPatchImpactPage';
import AIControlLoopAnomalyPage     from './pages/AIControlLoopAnomalyPage';
import AISafetyImpactPage           from './pages/AISafetyImpactPage';
import AIExecutiveBriefPage         from './pages/AIExecutiveBriefPage';
import AIHuntAttackPathPage         from './pages/AIHuntAttackPathPage';
import AIAssetCriticalityPage       from './pages/AIAssetCriticalityPage';
import AINetworkSegmentationPage    from './pages/AINetworkSegmentationPage';
import AIMaliciousFirmwareDetectPage from './pages/AIMaliciousFirmwareDetectPage';
import AIOperatorActionReviewPage   from './pages/AIOperatorActionReviewPage';
import AIMitreIcsMapperPage         from './pages/AIMitreIcsMapperPage';
import AISupplyChainFirmwarePage    from './pages/AISupplyChainFirmwarePage';

// Custom Views (Operations dashboards)
import CustomViewsPage from './pages/CustomViewsPage';

// Admin
import WebhooksPage from './pages/WebhooksPage';

import LoginPage from './pages/LoginPage';
import { getToken } from './services/api';

import './App.css';

function RequireAuth({ children }) {
  const location = useLocation();
  if (!getToken()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}

function ShellRoutes() {
  return (
    <div className="app">
      <Sidebar />
      <main className="main" style={{ padding: 0 }}>
        <Topbar />
        <div style={{ padding: '24px 32px' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />

            <Route path="/ot-assets"           element={<OtAssetsPage />} />
            <Route path="/plcs"                element={<PlcsPage />} />
            <Route path="/hmis"                element={<HmisPage />} />
            <Route path="/scada-servers"       element={<ScadaServersPage />} />
            <Route path="/ics-alerts"          element={<IcsAlertsPage />} />
            <Route path="/ics-incidents"       element={<IcsIncidentsPage />} />
            <Route path="/network-zones"       element={<NetworkZonesPage />} />
            <Route path="/protocol-anomalies"  element={<ProtocolAnomaliesPage />} />
            <Route path="/firmware-versions"   element={<FirmwareVersionsPage />} />
            <Route path="/vendor-patches"      element={<VendorPatchesPage />} />
            <Route path="/change-windows"      element={<ChangeWindowsPage />} />
            <Route path="/safety-systems"      element={<SafetySystemsPage />} />
            <Route path="/control-loops"       element={<ControlLoopsPage />} />
            <Route path="/operator-actions"    element={<OperatorActionsPage />} />
            <Route path="/ics-runbooks"        element={<IcsRunbooksPage />} />
            <Route path="/network-baselines"   element={<NetworkBaselinesPage />} />
            <Route path="/ics-iocs"            element={<IcsIocsPage />} />
            <Route path="/audit-log"           element={<AuditLogPage />} />

            <Route path="/ai/triage-ics-alert"          element={<AITriageIcsAlertPage />} />
            <Route path="/ai/baseline-protocol"         element={<AIBaselineProtocolPage />} />
            <Route path="/ai/classify-incident"         element={<AIClassifyIncidentPage />} />
            <Route path="/ai/suggest-isolation"         element={<AISuggestIsolationPage />} />
            <Route path="/ai/draft-change-procedure"    element={<AIDraftChangeProcedurePage />} />
            <Route path="/ai/vendor-patch-impact"       element={<AIVendorPatchImpactPage />} />
            <Route path="/ai/control-loop-anomaly"      element={<AIControlLoopAnomalyPage />} />
            <Route path="/ai/safety-impact"             element={<AISafetyImpactPage />} />
            <Route path="/ai/executive-brief"           element={<AIExecutiveBriefPage />} />
            <Route path="/ai/hunt-attack-path"          element={<AIHuntAttackPathPage />} />
            <Route path="/ai/asset-criticality"         element={<AIAssetCriticalityPage />} />
            <Route path="/ai/network-segmentation"      element={<AINetworkSegmentationPage />} />
            <Route path="/ai/malicious-firmware-detect" element={<AIMaliciousFirmwareDetectPage />} />
            <Route path="/ai/operator-action-review"    element={<AIOperatorActionReviewPage />} />
            <Route path="/ai/mitre-ics-mapper"          element={<AIMitreIcsMapperPage />} />
            <Route path="/ai/supply-chain-firmware"     element={<AISupplyChainFirmwarePage />} />

            <Route path="/custom-views" element={<CustomViewsPage />} />

            <Route path="/webhooks" element={<WebhooksPage />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <RequireAuth>
              <ShellRoutes />
            </RequireAuth>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
