import React, { useEffect, useState } from 'react';
import { changeWindowApprovalsApi, canWrite } from '../services/api';

// Apply pass 7 — Change-window approval workflow.
// Advisory only — recording approval intent; does not gate downstream automation.
export default function ChangeWindowApprovalsPage() {
  const writer = canWrite();
  const [rows, setRows] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [calendar, setCalendar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [draft, setDraft] = useState({ window_id: '', approver: '', reason: '' });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const [a, c, cal] = await Promise.all([
        changeWindowApprovalsApi.list(),
        changeWindowApprovalsApi.conflicts(),
        changeWindowApprovalsApi.calendar(),
      ]);
      setRows(Array.isArray(a) ? a : []);
      setConflicts(Array.isArray(c?.conflicts) ? c.conflicts : []);
      setCalendar(Array.isArray(cal) ? cal : []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const submitRequest = async () => {
    if (!draft.window_id) return;
    setBusy(true);
    try {
      await changeWindowApprovalsApi.request(draft);
      setDraft({ window_id: '', approver: '', reason: '' });
      await load();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const decide = async (id, decision) => {
    setBusy(true);
    try {
      await changeWindowApprovalsApi.decide(id, { decision });
      await load();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Change-Window Approvals</h2>
          <p>Approval workflow, conflict detection and freeze-window calendar. Advisory only.</p>
        </div>
      </div>

      {err && <div className="ai-error">{err}</div>}

      {writer && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3>Request Approval</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Window ID</label>
              <input value={draft.window_id} onChange={(e) => setDraft({ ...draft, window_id: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Approver</label>
              <input value={draft.approver} onChange={(e) => setDraft({ ...draft, approver: e.target.value })} />
            </div>
            <div className="form-group full-width">
              <label>Reason</label>
              <textarea value={draft.reason} onChange={(e) => setDraft({ ...draft, reason: e.target.value })} />
            </div>
          </div>
          <button className="btn ai" onClick={submitRequest} disabled={busy || !draft.window_id}>Submit Request</button>
        </div>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <h3>Approval Decisions ({rows.length})</h3>
        {loading && <div className="empty-state">Loading...</div>}
        {!loading && rows.length === 0 && <div className="empty-state">No approval records yet.</div>}
        {rows.length > 0 && (
          <table className="data-table">
            <thead>
              <tr><th>Window</th><th>Decision</th><th>Approver</th><th>Reason</th><th>At</th><th /></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.window_id}</td>
                  <td>{r.decision}</td>
                  <td>{r.approver || '—'}</td>
                  <td>{r.reason || '—'}</td>
                  <td>{r.decided_at ? new Date(r.decided_at).toLocaleString() : ''}</td>
                  <td>
                    {writer && r.decision === 'requested' && (
                      <>
                        <button className="btn small" onClick={() => decide(r.id, 'approved')} disabled={busy}>Approve</button>
                        <button className="btn small secondary" onClick={() => decide(r.id, 'rejected')} disabled={busy}>Reject</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3>Conflicts ({conflicts.length})</h3>
        {conflicts.length === 0 ? (
          <div className="empty-state">No overlapping change windows detected.</div>
        ) : (
          <table className="data-table">
            <thead><tr><th>A Window</th><th>A Window Time</th><th>B Window</th><th>B Window Time</th></tr></thead>
            <tbody>
              {conflicts.map((c, i) => (
                <tr key={i}>
                  <td>{c.a_window}</td>
                  <td>{c.a_start} → {c.a_end}</td>
                  <td>{c.b_window}</td>
                  <td>{c.b_start} → {c.b_end}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3>Freeze-Window Calendar ({calendar.length})</h3>
        {calendar.length === 0 ? (
          <div className="empty-state">No change windows on file.</div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Window</th><th>Name</th><th>Start</th><th>End</th><th>Scope</th><th>Latest Decision</th></tr></thead>
            <tbody>
              {calendar.map((c) => (
                <tr key={c.id}>
                  <td>{c.window_id}</td>
                  <td>{c.name}</td>
                  <td>{c.start_at}</td>
                  <td>{c.end_at}</td>
                  <td>{c.scope}</td>
                  <td>{c.latest_decision || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
