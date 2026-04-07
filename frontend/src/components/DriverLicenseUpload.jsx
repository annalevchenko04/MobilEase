import React, { useState, useRef, useContext, useEffect } from "react";
import { UserContext } from "../context/UserContext";
import API_URL from "../config";

const STATUS_CONFIG = {
  approved:      { color: "#00b894", bg: "#00b89410", border: "#00b89430", label: "APPROVED",       icon: "✓" },
  rejected:      { color: "#d63031", bg: "#d6303110", border: "#d6303130", label: "REJECTED",        icon: "✗" },
  manual_review: { color: "#e67e22", bg: "#e67e2210", border: "#e67e2230", label: "PENDING REVIEW",  icon: "⚠" },
  pending:       { color: "#b2bec3", bg: "#f8f9fa",   border: "#dee2e6",   label: "NOT SUBMITTED",   icon: "○" },
  processing:    { color: "#5352ed", bg: "#5352ed10", border: "#5352ed30", label: "PROCESSING…",     icon: "◌" },
};

const FIELD_LABELS = {
  license_id:    "License No.",
  name:          "First Name",
  surname:       "Last Name",
  birthday_date: "Date of Birth",
  expiry_date:   "Expiry Date",
  issue_date:    "Issue Date",
  country:       "Country",
};

// ── Risk score gauge ─────────────────────────────────────────
const RiskGauge = ({ score }) => {
  const pct = Math.round(score * 100);
  const color = score < 0.35 ? "#00b894" : score < 0.65 ? "#e67e22" : "#d63031";
  const label = score < 0.35 ? "LOW RISK" : score < 0.65 ? "MODERATE" : "HIGH RISK";
  const circumference = 2 * Math.PI * 40;
  const dash = circumference * (1 - score);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <svg width={100} height={100} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={50} cy={50} r={40} fill="none" stroke="#e9ecef" strokeWidth={10} />
        <circle
          cx={50} cy={50} r={40} fill="none"
          stroke={color} strokeWidth={10}
          strokeDasharray={circumference}
          strokeDashoffset={dash}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease, stroke 0.5s" }}
        />
      </svg>
      <div style={{ marginTop: -64, marginBottom: 48, textAlign: "center", position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: "monospace" }}>{pct}%</div>
        <div style={{ fontSize: 9, color: "#868e96", letterSpacing: 2 }}>{label}</div>
      </div>
    </div>
  );
};

// ── Extracted field row ──────────────────────────────────────
const FieldRow = ({ label, value, matched, highlight }) => (
  <div style={{
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "9px 0", borderBottom: "1px solid #f1f3f5",
  }}>
    <span style={{ color: "#868e96", fontSize: 11, letterSpacing: 1, fontFamily: "monospace", textTransform: "uppercase" }}>
      {label}
    </span>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{
        fontSize: 13, fontWeight: 600,
        color: highlight ? "#e67e22" : "#2d3436",
        fontFamily: "monospace",
      }}>
        {value || "—"}
      </span>
      {matched !== undefined && (
        <span style={{
          fontSize: 10, padding: "2px 6px", borderRadius: 3, fontWeight: 700,
          background: matched ? "#00b89415" : "#d6303115",
          color: matched ? "#00b894" : "#d63031",
        }}>
          {matched ? "MATCH" : "MISMATCH"}
        </span>
      )}
    </div>
  </div>
);

// ════════════════════════════════════════════════════════════
export default function DriverLicenseUpload() {
  const [token, userRole, username, userId] = useContext(UserContext);

  const [file, setFile]               = useState(null);
  const [preview, setPreview]         = useState(null);
  const [dragging, setDragging]       = useState(false);
  const [status, setStatus]           = useState("pending");
  const [result, setResult]           = useState(null);
  const [errorMsg, setErrorMsg]       = useState("");
  const [existingDoc, setExistingDoc] = useState(null);
  const fileRef = useRef();

useEffect(() => {
    fetch(`${API_URL}/license/status`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setExistingDoc(data);
          setStatus(data.status);
          setResult(data);
          if (data.image_url) setPreview(data.image_url); // ← add this line
        }
      })
      .catch(() => {});
  }, [token]);

  const handleFile = (f) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) { setErrorMsg("Please upload a JPG or PNG image."); return; }
    if (f.size > 10 * 1024 * 1024)    { setErrorMsg("File must be under 10 MB."); return; }
    setErrorMsg("");
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setStatus("pending");
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setStatus("processing");
    setErrorMsg("");
    try {
      const formData = new FormData();
      formData.append("license_image", file);
      const res = await fetch(`${API_URL}/license/verify`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Verification failed");
      setResult(data);
      setStatus(data.status);
    } catch (err) {
      setErrorMsg(err.message);
      setStatus("pending");
    }
  };

  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  return (
    <div style={{ padding: "8px 0", fontFamily: "inherit", color: "#2d3436" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .fade-in { animation: fadeIn 0.35s ease forwards; }
        .lic-upload-zone { transition: border-color 0.2s, background 0.2s; cursor: pointer; }
        .lic-upload-zone:hover { border-color: #5352ed !important; background: #f3f3ff !important; }
        .lic-submit-btn { transition: all 0.2s; border: none; cursor: pointer; }
        .lic-submit-btn:hover:not(:disabled) { filter: brightness(1.08); transform: translateY(-1px); box-shadow: 0 6px 20px #5352ed35; }
        .lic-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: "linear-gradient(135deg, #5352ed, #3742fa)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17,
          }}>🪪</div>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 3, color: "#5352ed", fontFamily: "monospace", textTransform: "uppercase" }}>
              Driver Verification System
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>License Verification</h2>
          </div>
        </div>
        <p style={{ color: "#868e96", fontSize: 13, margin: 0 }}>
          Upload a clear photo of your driver's license. Our system will extract and validate your details automatically.
        </p>
      </div>

      {/* Status badge */}
      <div style={{
        background: cfg.bg, border: `1px solid ${cfg.border}`,
        borderRadius: 10, padding: "11px 16px", marginBottom: 20,
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <span style={{ fontSize: 18, color: cfg.color }}>{cfg.icon}</span>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 2, color: cfg.color, fontFamily: "monospace" }}>STATUS</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: cfg.color }}>{cfg.label}</div>
        </div>
        {status === "processing" && (
          <div style={{
            marginLeft: "auto", width: 17, height: 17, borderRadius: "50%",
            border: `2px solid ${cfg.color}40`, borderTopColor: cfg.color,
            animation: "spin 0.8s linear infinite",
          }} />
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        {/* LEFT — Upload */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Drop zone */}
          <div
            className="lic-upload-zone"
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? "#5352ed" : "#ced4da"}`,
              borderRadius: 12, padding: 24,
              background: dragging ? "#f3f3ff" : "#f8f9fa",
              textAlign: "center", minHeight: 160,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 10,
            }}
          >
            {preview ? (
              <img src={preview} alt="License preview" style={{
                maxHeight: 170, maxWidth: "100%", borderRadius: 8,
                border: "1px solid #dee2e6", objectFit: "contain",
              }} />
            ) : (
              <>
                <div style={{ fontSize: 34 }}>📄</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#495057" }}>
                  Drop your license image here
                </div>
                <div style={{ fontSize: 11, color: "#adb5bd" }}>JPG, PNG — max 10 MB</div>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
            onChange={e => handleFile(e.target.files[0])} />

          {file && (
            <div style={{ fontSize: 11, color: "#868e96", fontFamily: "monospace" }}>
              📎 {file.name} ({(file.size / 1024).toFixed(0)} KB)
            </div>
          )}

          {errorMsg && (
            <div style={{
              background: "#fff5f5", border: "1px solid #ffc9c9",
              borderRadius: 8, padding: "9px 13px", fontSize: 12, color: "#c92a2a",
            }}>
              ⚠ {errorMsg}
            </div>
          )}

          <button
            className="lic-submit-btn"
            onClick={handleSubmit}
            disabled={!file || status === "processing"}
            style={{
              background: "linear-gradient(135deg, #5352ed, #3742fa)",
              color: "#fff", borderRadius: 10,
              padding: "12px 0", fontWeight: 700, fontSize: 14, letterSpacing: 0.5,
            }}
          >
            {status === "processing" ? "Verifying…" : "Submit for Verification"}
          </button>

          {result?.admin_note && (
            <div style={{
              background: "#fff8ee", border: "1px solid #ffd8a8",
              borderRadius: 8, padding: "11px 14px",
            }}>
              <div style={{ fontSize: 10, letterSpacing: 2, color: "#e67e22", marginBottom: 4, fontFamily: "monospace" }}>
                ADMIN NOTE
              </div>
              <div style={{ fontSize: 13, color: "#495057" }}>{result.admin_note}</div>
            </div>
          )}

          {/* Upload guidelines */}
          <div style={{
            background: "#f8f9fa", border: "1px solid #e9ecef",
            borderRadius: 10, padding: 14,
          }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: "#868e96", fontFamily: "monospace", marginBottom: 8 }}>
              UPLOAD GUIDELINES
            </div>
            {[
              ["📸", "Ensure all text is clearly readable"],
              ["💡", "Good lighting — avoid glare and shadows"],
              ["📐", "Keep the license flat and fully in frame"],
              ["🚫", "Do not crop or edit the image"],
            ].map(([icon, text]) => (
              <div key={text} style={{ display: "flex", gap: 9, alignItems: "center", marginBottom: 7, fontSize: 12, color: "#868e96" }}>
                <span>{icon}</span> {text}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — Results */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {result ? (
            <div className="fade-in" style={{
              background: "#fff", border: "1px solid #e9ecef",
              borderRadius: 12, padding: 20, boxShadow: "0 2px 12px #0000000a",
            }}>
              {/* Risk score */}
              {result.risk_score !== undefined && (
                <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 18, paddingBottom: 16, borderBottom: "1px solid #f1f3f5" }}>
                  <RiskGauge score={result.risk_score} />
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: 2, color: "#868e96", fontFamily: "monospace" }}>RISK SCORE</div>
                    <div style={{
                      fontSize: 28, fontWeight: 800, fontFamily: "monospace",
                      color: result.risk_score < 0.35 ? "#00b894" : result.risk_score < 0.65 ? "#e67e22" : "#d63031"
                    }}>
                      {(result.risk_score * 100).toFixed(0)}<span style={{ fontSize: 14 }}>/100</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#868e96", marginTop: 4, maxWidth: 160 }}>
                      {result.risk_reason || "Automated risk assessment"}
                    </div>
                  </div>
                </div>
              )}

              {/* Validation flags */}
              {result.validation_flags?.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, letterSpacing: 2, color: "#868e96", fontFamily: "monospace", marginBottom: 7 }}>
                    VALIDATION FLAGS
                  </div>
                  {result.validation_flags.map((flag, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "6px 10px", borderRadius: 6,
                      background: "#fff8ee", border: "1px solid #ffd8a8",
                      marginBottom: 4, fontSize: 12, color: "#e67e22",
                    }}>
                      <span>⚑</span> {flag}
                    </div>
                  ))}
                </div>
              )}

              {/* Extracted fields */}
              {result.extracted_data && (
                <>
                  <div style={{ fontSize: 10, letterSpacing: 2, color: "#868e96", fontFamily: "monospace", marginBottom: 4 }}>
                    EXTRACTED DATA
                  </div>
                  {Object.entries(FIELD_LABELS).map(([key, label]) =>
                    result.extracted_data[key] !== undefined && (
                      <FieldRow
                        key={key}
                        label={label}
                        value={result.extracted_data[key]}
                        matched={result.profile_matches?.[key]}
                        highlight={key === "expiry_date" && result.validation_flags?.includes("License expired")}
                      />
                    )
                  )}
                </>
              )}
            </div>
          ) : (
            <div style={{
              background: "#f8f9fa", border: "1px solid #e9ecef",
              borderRadius: 12, padding: 40, textAlign: "center",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
            }}>
              <div style={{ fontSize: 40, opacity: 0.25 }}>🔍</div>
              <div style={{ fontSize: 13, color: "#868e96" }}>
                Verification results will appear here after you submit your license.
              </div>
              {existingDoc && (
                <div style={{
                  marginTop: 8, padding: "8px 14px", borderRadius: 8,
                  background: "#fff", border: "1px solid #dee2e6",
                  fontSize: 12, color: "#868e96", fontFamily: "monospace",
                }}>
                  Last submitted: {new Date(existingDoc.submitted_at).toLocaleDateString()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
