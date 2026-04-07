import React, { useState, useEffect, useContext } from "react";
import { UserContext } from "../context/UserContext";
import API_URL from "../config";

const STATUS_CONFIG = {
  approved:      { color: "#00b894", bg: "#00b89412", border: "#00b89435", label: "APPROVED",      icon: "✓" },
  rejected:      { color: "#d63031", bg: "#d6303112", border: "#d6303135", label: "REJECTED",       icon: "✗" },
  manual_review: { color: "#e67e22", bg: "#e67e2212", border: "#e67e2235", label: "MANUAL REVIEW",  icon: "⚠" },
  pending:       { color: "#868e96", bg: "#f8f9fa",   border: "#dee2e6",   label: "PENDING",        icon: "○" },
};

const FIELD_LABELS = {
  license_number: "License No.",
  first_name:     "First Name",
  last_name:      "Last Name",
  date_of_birth:  "Date of Birth",
  expiry_date:    "Expiry Date",
  issue_date:     "Issue Date",
  address:        "Address",
  license_class:  "Class",
  issuing_state:  "Issued By",
};

const RiskBadge = ({ score }) => {
  const pct = Math.round(score * 100);
  const [color, label] =
    score < 0.35 ? ["#00b894", "LOW"] :
    score < 0.65 ? ["#e67e22", "MED"] :
                   ["#d63031", "HIGH"];
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: `${color}15`, border: `1px solid ${color}40`,
      borderRadius: 6, padding: "3px 9px",
    }}>
      <span style={{ fontSize: 10, fontWeight: 800, color, fontFamily: "monospace" }}>{label}</span>
      <span style={{ fontSize: 11, color, fontFamily: "monospace" }}>{pct}%</span>
    </div>
  );
};

const DriverRow = ({ doc, onSelect, selected }) => {
  const cfg = STATUS_CONFIG[doc.status] || STATUS_CONFIG.pending;
  return (
    <div
      onClick={() => onSelect(doc)}
      style={{
        padding: "14px 18px", cursor: "pointer",
        borderBottom: "1px solid #f1f3f5",
        background: selected ? "#f0f0ff" : "#fff",
        borderLeft: selected ? "3px solid #5352ed" : "3px solid transparent",
        transition: "background 0.15s",
        display: "flex", alignItems: "center", gap: 12,
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: "50%",
        background: "linear-gradient(135deg, #e9ecef, #dee2e6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 14, fontWeight: 700, color: "#5352ed", flexShrink: 0,
      }}>
        {(doc.driver_name || "?")[0].toUpperCase()}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#2d3436", marginBottom: 2 }}>
          {doc.driver_name || "Unknown Driver"}
        </div>
        <div style={{ fontSize: 11, color: "#868e96", fontFamily: "monospace" }}>
          {new Date(doc.submitted_at).toLocaleDateString("en-GB", {
            day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
          })}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: cfg.color, fontFamily: "monospace", letterSpacing: 1 }}>
          {cfg.icon} {cfg.label}
        </div>
        {doc.risk_score !== undefined && <RiskBadge score={doc.risk_score} />}
      </div>
    </div>
  );
};

export default function AdminLicenseReview() {
  const [token] = useContext(UserContext);

  const [docs, setDocs]             = useState([]);
  const [selected, setSelected]     = useState(null);
  const [filterStatus, setFilter]   = useState("manual_review");
  const [adminNote, setAdminNote]   = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback]     = useState(null);
  const [imageModal, setImageModal] = useState(false);
  const [loading, setLoading]       = useState(true);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/license/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setDocs(Array.isArray(data) ? data : []);
    } catch { setDocs([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDocs(); }, [token]);
  useEffect(() => { if (selected) setAdminNote(selected.admin_note || ""); }, [selected]);

  const filtered = docs.filter(d => filterStatus === "all" || d.status === filterStatus);

  const handleDecision = async (decision) => {
    if (!selected) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch(`${API_URL}/license/${selected.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ decision, admin_note: adminNote }),
      });
      if (!res.ok) throw new Error("Review submission failed");
      setFeedback({ type: "success", message: `License ${decision} successfully.` });
      await fetchDocs();
      setSelected(prev => ({ ...prev, status: decision, admin_note: adminNote }));
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const counts = {
    all:           docs.length,
    manual_review: docs.filter(d => d.status === "manual_review").length,
    approved:      docs.filter(d => d.status === "approved").length,
    rejected:      docs.filter(d => d.status === "rejected").length,
    pending:       docs.filter(d => d.status === "pending").length,
  };

  const cfg = selected ? (STATUS_CONFIG[selected.status] || STATUS_CONFIG.pending) : null;

  return (
    <div style={{ fontFamily: "inherit", color: "#2d3436" }}>
      <style>{`
        .lic-filter-tab { cursor: pointer; transition: all 0.15s; border: none; background: transparent; }
        .lic-filter-tab:hover { background: #f1f3f5 !important; }
        .lic-driver-row:hover { background: #f8f9fa !important; }
        .lic-action-btn { transition: all 0.18s; border: none; cursor: pointer; }
        .lic-action-btn:hover:not(:disabled) { transform: translateY(-1px); filter: brightness(0.95); }
        .lic-action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        @keyframes licFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .lic-fade-in { animation: licFadeIn 0.3s ease; }
        .lic-img-overlay { position: fixed; inset: 0; background: #000000cc; z-index: 1000;
          display: flex; align-items: center; justify-content: center; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "linear-gradient(135deg, #5352ed, #3742fa)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
          }}>🪪</div>
          <div>
            <div style={{ fontSize: 9, letterSpacing: 3, color: "#5352ed", fontFamily: "monospace", textTransform: "uppercase" }}>
              Admin Panel
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>License Verification Queue</h2>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{
        display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap",
        background: "#f8f9fa", borderRadius: 10, padding: 6, border: "1px solid #e9ecef",
      }}>
        {[
          { key: "manual_review", label: "Needs Review", color: "#e67e22" },
          { key: "approved",      label: "Approved",     color: "#00b894" },
          { key: "rejected",      label: "Rejected",     color: "#d63031" },
          { key: "pending",       label: "Pending",      color: "#868e96" },
          { key: "all",           label: "All",          color: "#5352ed" },
        ].map(({ key, label, color }) => (
          <button
            key={key}
            className="lic-filter-tab"
            onClick={() => setFilter(key)}
            style={{
              padding: "6px 12px", borderRadius: 7, fontSize: 12, fontWeight: 700,
              background: filterStatus === key ? "#fff" : "transparent",
              color: filterStatus === key ? color : "#868e96",
              boxShadow: filterStatus === key ? "0 1px 4px #0000001a" : "none",
              border: filterStatus === key ? `1px solid ${color}30` : "1px solid transparent",
            }}
          >
            {label}
            <span style={{
              marginLeft: 6, fontSize: 10, fontFamily: "monospace",
              background: "#e9ecef", color: "#495057",
              padding: "1px 5px", borderRadius: 4,
            }}>
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      {/* Main split layout */}
      <div style={{
        display: "flex", gap: 16, alignItems: "flex-start",
        border: "1px solid #e9ecef", borderRadius: 12, overflow: "hidden",
        background: "#fff", minHeight: 500,
      }}>

        {/* LEFT — list */}
        <div style={{ width: 300, borderRight: "1px solid #f1f3f5", flexShrink: 0, overflowY: "auto", maxHeight: 700 }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#868e96", fontSize: 13 }}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center" }}>
              <div style={{ fontSize: 30, marginBottom: 8, opacity: 0.3 }}>📭</div>
              <div style={{ color: "#868e96", fontSize: 13 }}>No submissions here</div>
            </div>
          ) : (
            filtered.map(doc => (
              <DriverRow
                key={doc.id}
                doc={doc}
                selected={selected?.id === doc.id}
                onSelect={setSelected}
              />
            ))
          )}
        </div>

        {/* RIGHT — detail */}
        {selected ? (
          <div className="lic-fade-in" style={{ flex: 1, padding: 24, overflowY: "auto", maxHeight: 700 }}>

            {/* Driver header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 10, letterSpacing: 3, color: "#868e96", fontFamily: "monospace", marginBottom: 3 }}>
                  SUBMISSION #{selected.id}
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 3px" }}>{selected.driver_name}</h3>
                <div style={{ fontSize: 12, color: "#868e96", fontFamily: "monospace" }}>
                  Submitted {new Date(selected.submitted_at).toLocaleString()}
                </div>
              </div>
              <div style={{
                background: cfg.bg, border: `1px solid ${cfg.border}`,
                borderRadius: 10, padding: "10px 18px", textAlign: "center",
              }}>
                <div style={{ fontSize: 22, color: cfg.color }}>{cfg.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: cfg.color, letterSpacing: 1 }}>{cfg.label}</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>

              {/* License image */}
              <div>
                <div style={{ fontSize: 10, letterSpacing: 2, color: "#868e96", fontFamily: "monospace", marginBottom: 8 }}>
                  UPLOADED IMAGE
                </div>
                {selected.image_url ? (
                  <div
                    onClick={() => setImageModal(true)}
                    style={{ cursor: "zoom-in", borderRadius: 10, overflow: "hidden", border: "1px solid #e9ecef" }}
                  >
                    <img
                      src={selected.image_url}
                      alt="Driver license"
                      style={{ width: "100%", display: "block", maxHeight: 180, objectFit: "cover" }}
                    />
                    <div style={{
                      padding: "6px 12px", background: "#f8f9fa",
                      fontSize: 11, color: "#868e96", textAlign: "center",
                    }}>
                      Click to enlarge
                    </div>
                  </div>
                ) : (
                  <div style={{
                    background: "#f8f9fa", border: "1px solid #e9ecef",
                    borderRadius: 10, height: 150, display: "flex",
                    alignItems: "center", justifyContent: "center",
                    fontSize: 12, color: "#868e96",
                  }}>
                    No image available
                  </div>
                )}

                {/* Risk score */}
                {selected.risk_score !== undefined && (
                  <div style={{
                    marginTop: 12, background: "#f8f9fa", border: "1px solid #e9ecef",
                    borderRadius: 10, padding: 14,
                  }}>
                    <div style={{ fontSize: 10, letterSpacing: 2, color: "#868e96", fontFamily: "monospace", marginBottom: 8 }}>
                      RISK ASSESSMENT
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <RiskBadge score={selected.risk_score} />
                      <div style={{ fontSize: 12, color: "#495057" }}>
                        {selected.risk_reason || "No reason provided"}
                      </div>
                    </div>
                    {selected.validation_flags?.length > 0 && (
                      <div style={{ marginTop: 10 }}>
                        {selected.validation_flags.map((flag, i) => (
                          <div key={i} style={{
                            fontSize: 11, color: "#e67e22", padding: "5px 10px",
                            background: "#fff8ee", border: "1px solid #ffd8a8",
                            borderRadius: 5, marginBottom: 4,
                            display: "flex", gap: 8, alignItems: "center",
                          }}>
                            <span>⚑</span> {flag}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Extracted data */}
              <div>
                <div style={{ fontSize: 10, letterSpacing: 2, color: "#868e96", fontFamily: "monospace", marginBottom: 8 }}>
                  EXTRACTED DATA
                </div>
                <div style={{
                  background: "#f8f9fa", border: "1px solid #e9ecef",
                  borderRadius: 10, padding: "4px 14px",
                }}>
                  {selected.extracted_data
                    ? Object.entries(FIELD_LABELS).map(([key, label]) => (
                        selected.extracted_data[key] !== undefined && (
                          <div key={key} style={{
                            display: "flex", justifyContent: "space-between",
                            alignItems: "center", padding: "8px 0",
                            borderBottom: "1px solid #f1f3f5",
                          }}>
                            <span style={{ fontSize: 10, color: "#868e96", fontFamily: "monospace", letterSpacing: 1, textTransform: "uppercase" }}>
                              {label}
                            </span>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: 12, fontWeight: 600, fontFamily: "monospace", color: "#2d3436" }}>
                                {selected.extracted_data[key]}
                              </span>
                              {selected.profile_matches?.[key] !== undefined && (
                                <span style={{
                                  fontSize: 9, padding: "2px 5px", borderRadius: 3, fontWeight: 700,
                                  background: selected.profile_matches[key] ? "#00b89415" : "#d6303115",
                                  color: selected.profile_matches[key] ? "#00b894" : "#d63031",
                                }}>
                                  {selected.profile_matches[key] ? "✓" : "✗"}
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      ))
                    : (
                      <div style={{ padding: 20, color: "#868e96", fontSize: 12, textAlign: "center" }}>
                        No extracted data available
                      </div>
                    )
                  }
                </div>
              </div>
            </div>

            {/* Admin decision */}
            <div style={{
              background: "#f8f9fa", border: "1px solid #e9ecef",
              borderRadius: 12, padding: 18,
            }}>
              <div style={{ fontSize: 10, letterSpacing: 2, color: "#868e96", fontFamily: "monospace", marginBottom: 12 }}>
                ADMIN DECISION
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, color: "#495057", display: "block", marginBottom: 5 }}>
                  Note to driver (optional)
                </label>
                <textarea
                  value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                  placeholder="e.g. License image too blurry, please re-upload…"
                  rows={3}
                  style={{
                    width: "100%", background: "#fff", border: "1px solid #dee2e6",
                    borderRadius: 8, padding: "10px 13px", color: "#2d3436",
                    fontSize: 13, resize: "vertical", fontFamily: "inherit",
                    outline: "none",
                  }}
                />
              </div>

              {feedback && (
                <div style={{
                  marginBottom: 12, padding: "9px 13px", borderRadius: 8, fontSize: 12,
                  background: feedback.type === "success" ? "#00b89412" : "#d6303112",
                  color: feedback.type === "success" ? "#00b894" : "#d63031",
                  border: `1px solid ${feedback.type === "success" ? "#00b89435" : "#d6303135"}`,
                }}>
                  {feedback.message}
                </div>
              )}

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  className="lic-action-btn"
                  onClick={() => handleDecision("approved")}
                  disabled={submitting || selected.status === "approved"}
                  style={{
                    flex: 1, padding: "11px 0", borderRadius: 9, fontWeight: 700,
                    fontSize: 13, background: "#00b89415", color: "#00b894",
                    border: "1px solid #00b89440",
                  }}
                >
                  ✓ Approve
                </button>
                <button
                  className="lic-action-btn"
                  onClick={() => handleDecision("rejected")}
                  disabled={submitting || selected.status === "rejected"}
                  style={{
                    flex: 1, padding: "11px 0", borderRadius: 9, fontWeight: 700,
                    fontSize: 13, background: "#d6303115", color: "#d63031",
                    border: "1px solid #d6303140",
                  }}
                >
                  ✗ Reject
                </button>
                <button
                  className="lic-action-btn"
                  onClick={() => handleDecision("manual_review")}
                  disabled={submitting || selected.status === "manual_review"}
                  style={{
                    flex: 1, padding: "11px 0", borderRadius: 9, fontWeight: 700,
                    fontSize: 13, background: "#e67e2215", color: "#e67e22",
                    border: "1px solid #e67e2240",
                  }}
                >
                  ⚠ Flag Review
                </button>
              </div>
            </div>

          </div>
        ) : (
          <div style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
            flexDirection: "column", gap: 10, color: "#868e96", padding: 40,
          }}>
            <div style={{ fontSize: 44, opacity: 0.2 }}>🪪</div>
            <div style={{ fontSize: 13 }}>Select a submission to review</div>
          </div>
        )}
      </div>

      {/* Image zoom modal */}
      {imageModal && selected?.image_url && (
        <div className="lic-img-overlay" onClick={() => setImageModal(false)}>
          <img
            src={selected.image_url}
            alt="License full"
            style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: 12, boxShadow: "0 20px 60px #00000080" }}
          />
        </div>
      )}
    </div>
  );
}
