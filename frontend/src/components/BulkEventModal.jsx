import React, { useState, useEffect } from "react";
import { format, addDays, parseISO } from "date-fns";
import API_URL from "../config";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
// JS getDay(): 0=Sun,1=Mon...6=Sat → ISO index Mon=0..Sun=6
const ISO_TO_INDEX = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 0: 6 };

const BulkEventModal = ({ token, onClose, onDone, templateDate }) => {
  const today = templateDate || format(new Date(), "yyyy-MM-dd");

  // ── Form state ──────────────────────────────────────────────
  const [postId, setPostId]               = useState(null);
  const [name, setName]                   = useState("");
  const [description, setDescription]     = useState("");
  const [price, setPrice]                 = useState(0);
  const [distance, setDistance]           = useState(0);
  const [time, setTime]                   = useState("09:00");
  const [duration, setDuration]           = useState(30);
  const [maxParticipants, setMaxParticipants] = useState(40);
  const [roomNumber, setRoomNumber]       = useState("");
  const [eventType, setEventType]         = useState("public");
  const [driverId, setDriverId]           = useState(null);
  const [dateFrom, setDateFrom]           = useState(today);
  const [dateTo, setDateTo]               = useState(today);
  const [days, setDays]                   = useState([0, 1, 2, 3, 4]); // Mon–Fri

  // ── Remote data ─────────────────────────────────────────────
  const [posts, setPosts]     = useState([]);
  const [drivers, setDrivers] = useState([]);

  // ── UI state ────────────────────────────────────────────────
  const [step, setStep]       = useState(1); // 1=form, 2=preview
  const [preview, setPreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  // ── Fetch posts + drivers on mount ──────────────────────────
  useEffect(() => {
    fetch(`${API_URL}/posts`)
      .then(r => r.json())
      .then(data => setPosts(Array.isArray(data) ? data : []))
      .catch(() => {});

    fetch(`${API_URL}/drivers`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => setDrivers(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [token]);

  // ── Route selection → autofill (mirrors EventModal exactly) ─
  const handleRouteSelect = (e) => {
    const selectedId = Number(e.target.value);
    setPostId(selectedId || null);
    const post = posts.find(p => p.id === selectedId);
    if (post) {
      setName(post.title ?? "");
      setDuration(post.estimated_duration ?? 30);
      setDescription(`${post.from_city ?? ""} → ${post.to_city ?? ""}`);
      setPrice(post.price ?? 0);
      setDistance(post.distance_km ?? 0);
    }
  };

  // ── Day toggle ───────────────────────────────────────────────
  const toggleDay = (idx) =>
    setDays(prev =>
      prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx]
    );

  // ── Compute matching dates in range ─────────────────────────
  const computeDates = () => {
    const dates = [];
    const start = parseISO(dateFrom);
    const end   = parseISO(dateTo);
    if (end < start) return [];
    let cursor = start;
    while (cursor <= end) {
      const isoIdx = ISO_TO_INDEX[cursor.getDay()];
      if (days.includes(isoIdx)) dates.push(format(cursor, "yyyy-MM-dd"));
      cursor = addDays(cursor, 1);
    }
    return dates;
  };

  // ── Step 1 → Step 2 ─────────────────────────────────────────
  const handlePreview = () => {
    if (!name.trim())          { setError("Please select a route first."); return; }
    if (!time)                 { setError("Please set a time."); return; }
    if (duration <= 0)         { setError("Duration must be more than 0 hour."); return; }
    if (!dateFrom || !dateTo)  { setError("Please set both dates."); return; }
    if (days.length === 0)     { setError("Select at least one day."); return; }
    const dates = computeDates();
    if (dates.length === 0)    { setError("No dates match your selection."); return; }
    setError("");
    setPreview(dates);
    setStep(2);
  };

  // ── Submit: create one event per date ───────────────────────
  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    let created = 0;
    try {
      for (const date of preview) {
        const res = await fetch(`${API_URL}/event`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name,
            description,
            date,
            time,
            duration: Number(duration),
            event_type: eventType,
            max_participants: Number(maxParticipants) > 0 ? Number(maxParticipants) : null,
            room_number: roomNumber || null,
            post_id: postId,
            driver_id: driverId || null,
            is_personal_training: false,
            trainer_id: null,
          }),
        });
        if (!res.ok) throw new Error(`Failed on ${date}`);
        created++;
      }
      onDone(created);
    } catch (err) {
      setError(err.message || "Some events failed to create.");
    } finally {
      setLoading(false);
    }
  };

  // ────────────────────────────────────────────────────────────
  return (
    <div className="modal is-active">
      <div className="modal-background" onClick={onClose} />
      <div className="modal-card" style={{ maxWidth: 580, width: "95vw" }}>

        <header className="modal-card-head">
          <p className="modal-card-title">
            {step === 1 ? "📅 Bulk Create Events" : "📋 Preview & Confirm"}
          </p>
          <button className="delete" onClick={onClose} />
        </header>

        <section className="modal-card-body">
          {error && (
            <div className="notification is-danger is-light mb-4" style={{ padding: "10px 14px" }}>
              {error}
            </div>
          )}

          {/* ── STEP 1: Form ── */}
          {step === 1 && (
            <>
              {/* Route dropdown — same as EventModal */}
              <div className="field">
                <label className="label">Event Name</label>
                <div className="select is-fullwidth">
                  <select value={postId ?? ""} onChange={handleRouteSelect}>
                    <option value="">Select a route</option>
                    {posts.map(post => (
                      <option key={post.id} value={post.id}>
                        {post.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Autofilled fields */}
              <div className="field">
                <label className="label">Description</label>
                <input
                  className="input"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Auto-filled from route"
                />
              </div>

              <div className="columns">
                <div className="column field">
                  <label className="label">Price</label>
                  <input className="input" type="number" value={price} readOnly />
                </div>
                <div className="column field">
                  <label className="label">Distance (km)</label>
                  <input className="input" type="number" value={distance} readOnly />
                </div>
              </div>

              <hr style={{ margin: "12px 0" }} />

              {/* Time + Duration */}
              <div className="columns">
                <div className="column field">
                  <label className="label">Time</label>
                  <input
                    className="input"
                    type="time"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                  />
                </div>
                <div className="column field">
                  <label className="label">Duration (hours)</label>
                  <input
                    className="input"
                    type="number"
                    value={duration}
                    onChange={e => setDuration(e.target.value)}
                    min={2}
                  />
                </div>
              </div>

              {/* Event Type */}
              <div className="field">
                <label className="label">Event Type</label>
                <div className="select is-fullwidth">
                  <select value={eventType} onChange={e => setEventType(e.target.value)}>
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>

              {/* Public-only fields — same as EventModal */}
              {eventType === "public" && (
                <>
                  <div className="field">
                    <label className="label">Max Participants</label>
                    <input
                      className="input"
                      type="number"
                      value={maxParticipants}
                      onChange={e => setMaxParticipants(e.target.value)}
                      min={1}
                    />
                  </div>

                  <div className="field">
                    <label className="label">Assign Driver</label>
                    <div className="select is-fullwidth">
                      <select
                        value={driverId ?? ""}
                        onChange={e => setDriverId(Number(e.target.value) || null)}
                      >
                        <option value="">Select a driver</option>
                        {drivers.map(driver => (
                          <option key={driver.id} value={driver.id}>
                            {driver.name} {driver.surname}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="field">
                    <label className="label">Address</label>
                    <input
                      className="input"
                      value={roomNumber}
                      onChange={e => setRoomNumber(e.target.value)}
                      placeholder="Enter place"
                    />
                  </div>
                </>
              )}

              <hr style={{ margin: "12px 0" }} />

              {/* Date range */}
              <p className="label mb-2">Date Range</p>
              <div className="columns">
                <div className="column field">
                  <label className="label">From</label>
                  <input
                    className="input"
                    type="date"
                    value={dateFrom}
                    onChange={e => setDateFrom(e.target.value)}
                  />
                </div>
                <div className="column field">
                  <label className="label">To</label>
                  <input
                    className="input"
                    type="date"
                    value={dateTo}
                    onChange={e => setDateTo(e.target.value)}
                  />
                </div>
              </div>

              {/* Day-of-week toggles */}
              <div className="field">
                <label className="label">Days of Week</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {DAY_LABELS.map((label, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleDay(idx)}
                      className={days.includes(idx) ? "button is-primary" : "button is-light"}
                      style={{ borderRadius: 20, fontWeight: 600, minWidth: 52 }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── STEP 2: Preview ── */}
          {step === 2 && (
            <>
              <div className="notification is-info is-light" style={{ padding: "10px 14px" }}>
                <strong>{preview.length} events</strong> will be created for{" "}
                <strong>{name}</strong> at <strong>{time}</strong>
              </div>
              <div
                style={{
                  maxHeight: 300,
                  overflowY: "auto",
                  border: "1px solid #ddd",
                  borderRadius: 6,
                  background: "#fff",
                }}
              >
                {preview.map((d, i) => (
                  <div
                    key={d}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px 14px",
                      borderBottom: i < preview.length - 1 ? "1px solid #f0f0f0" : "none",
                      fontSize: 14,
                    }}
                  >
                    <span>{format(parseISO(d), "EEEE, MMM d yyyy")}</span>
                    <span className="has-text-grey">{time}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 has-text-grey is-size-7">
                Review the list above. Click <strong>Confirm</strong> to create all {preview.length} events.
              </p>
            </>
          )}
        </section>

        <footer className="modal-card-foot" style={{ justifyContent: "space-between" }}>
          <div>
            {step === 2 && (
              <button className="button" onClick={() => setStep(1)} disabled={loading}>
                ← Back
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="button" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            {step === 1 ? (
              <button className="button is-primary" onClick={handlePreview}>
                Preview →
              </button>
            ) : (
              <button
                className={`button is-success ${loading ? "is-loading" : ""}`}
                onClick={handleSubmit}
                disabled={loading}
              >
                ✓ Confirm & Create {preview.length} Events
              </button>
            )}
          </div>
        </footer>

      </div>
    </div>
  );
};

export default BulkEventModal;
