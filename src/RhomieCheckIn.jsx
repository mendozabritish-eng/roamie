import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

const C = {
  mint:"#3dd6a3", sky:"#5bbde0", ocean:"#1a3a4a", frost:"#e8f9f4",
  mist:"#d6f0ff", white:"#ffffff", gray1:"#f4f7f9", gray2:"#e2eaed",
  gray3:"#9ab3be", gray4:"#4a6572", alert:"#e05555", success:"#27ae60",
};

const QUICK_MESSAGES = [
  { emoji:"👋", text:"All good" },
  { emoji:"🏨", text:"At the hotel" },
  { emoji:"🚶", text:"Heading back" },
  { emoji:"⏰", text:"Running late" },
  { emoji:"🍽️", text:"At dinner" },
  { emoji:"🗺️", text:"Exploring" },
  { emoji:"✈️", text:"At the airport" },
  { emoji:"🚗", text:"In transit" },
];

export function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)    return "just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ─── Hook: tracks own last check-in via realtime ───────────────────────────
export function useCheckIn(userId) {
  const [lastCheckIn, setLastCheckIn] = useState(null);

  useEffect(() => {
    if (!userId) return;

    supabase.from("check_ins")
      .select("id, message, created_at, lat, lng")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error("useCheckIn fetch:", error);
        if (data) setLastCheckIn(data);
      });

    const channel = supabase.channel("own-check-ins")
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "check_ins",
        filter: `user_id=eq.${userId}`,
      }, (payload) => { setLastCheckIn(payload.new); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  return { lastCheckIn };
}

// ─── Floating check-in button ──────────────────────────────────────────────
export function CheckInButton({ lastCheckIn, onClick }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick(n => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const checked = !!lastCheckIn;
  return (
    <button onClick={onClick} style={{
      display:"flex", alignItems:"center", gap:7,
      padding:"11px 20px", borderRadius:24,
      background: checked ? "#f0fdf4" : C.mint,
      border:`2px solid ${checked ? "#86efac" : "transparent"}`,
      color: checked ? C.success : C.ocean,
      fontSize:13, fontWeight:700, cursor:"pointer",
      fontFamily:"'DM Serif Display',serif",
      boxShadow:"0 4px 20px rgba(26,58,74,0.18)",
      transition:"all 0.2s",
    }}>
      <span style={{ fontSize:16 }}>{checked ? "✓" : "📍"}</span>
      {checked ? `I'm safe · ${timeAgo(lastCheckIn.created_at)}` : "Check in"}
    </button>
  );
}

// ─── Check-in bottom sheet content ────────────────────────────────────────
export function CheckInSheet({ userId, userLocation, onClose }) {
  const [selected, setSelected]   = useState(null);
  const [custom,   setCustom]     = useState("");
  const [loading,  setLoading]    = useState(false);
  const [done,     setDone]       = useState(false);
  const [error,    setError]      = useState("");

  async function handleCheckIn() {
    setLoading(true);
    setError("");
    const message = selected
      ? `${selected.emoji} ${selected.text}`
      : custom.trim();
    const { error: err } = await supabase.from("check_ins").insert({
      user_id: userId,
      lat: userLocation?.lat ?? null,
      lng: userLocation?.lng ?? null,
      message,
    });
    setLoading(false);
    if (err) { setError("Could not check in. Try again."); return; }
    setDone(true);
    setTimeout(onClose, 1800);
  }

  if (done) return (
    <div style={{ padding:"36px 24px", textAlign:"center" }}>
      <style>{`@keyframes popIn{from{opacity:0;transform:scale(0.8)}to{opacity:1;transform:scale(1)}}`}</style>
      <div style={{
        width:68, height:68, borderRadius:"50%",
        background:"#f0fdf4", border:`3px solid ${C.success}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:30, margin:"0 auto 20px",
        boxShadow:`0 0 0 10px #bbf7d033`,
        animation:"popIn 0.3s ease",
      }}>✓</div>
      <div style={{ fontSize:22, fontWeight:700, color:C.ocean, fontStyle:"italic", marginBottom:6 }}>
        You're checked in.
      </div>
      <div style={{ fontSize:13, color:C.gray4 }}>Your crew can see you're safe.</div>
    </div>
  );

  return (
    <div style={{ padding:"16px 20px 32px" }}>
      {error && (
        <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, padding:"10px 14px", marginBottom:14, fontSize:13, color:C.alert }}>
          ⚠️ {error}
        </div>
      )}

      <p style={{ fontSize:13, color:C.gray4, marginBottom:16, lineHeight:1.6 }}>
        Let your crew know you're safe. Add a quick note if you'd like.
      </p>

      {/* Quick messages */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:16 }}>
        {QUICK_MESSAGES.map(q => {
          const active = selected?.text === q.text;
          return (
            <button key={q.text}
              onClick={() => setSelected(active ? null : q)}
              style={{
                display:"flex", alignItems:"center", gap:5,
                padding:"7px 13px", borderRadius:20,
                border:`1.5px solid ${active ? C.mint : C.gray2}`,
                background: active ? C.frost : C.white,
                color: active ? C.ocean : C.gray4,
                fontSize:12, fontWeight: active ? 600 : 400,
                cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s",
              }}>
              <span>{q.emoji}</span>{q.text}
            </button>
          );
        })}
      </div>

      {/* Custom message (only when nothing selected) */}
      {!selected && (
        <div style={{
          border:`1.5px solid ${C.gray2}`, borderRadius:12,
          padding:"10px 14px", marginBottom:16,
          display:"flex", alignItems:"center", gap:8,
          background:C.white,
        }}>
          <span style={{ fontSize:16, flexShrink:0 }}>✏️</span>
          <input
            value={custom}
            onChange={e => setCustom(e.target.value)}
            placeholder="Add a custom message..."
            maxLength={120}
            style={{
              flex:1, border:"none", outline:"none",
              fontSize:14, color:C.ocean, background:"transparent",
              fontFamily:"inherit",
            }}
          />
        </div>
      )}

      <div style={{ fontSize:11, color:C.gray3, marginBottom:20, display:"flex", alignItems:"center", gap:5 }}>
        <span>📍</span> Your current location will be saved with this check-in.
      </div>

      <button onClick={handleCheckIn} disabled={loading} style={{
        width:"100%", padding:"14px", borderRadius:14, border:"none",
        background: loading ? C.gray2 : C.success,
        color: loading ? C.gray3 : C.white,
        fontSize:15, fontWeight:700,
        cursor: loading ? "not-allowed" : "pointer",
        fontFamily:"inherit", transition:"all 0.2s",
        boxShadow: loading ? "none" : `0 4px 16px ${C.success}44`,
      }}>
        {loading ? "Checking in..." : "I'm safe ✓"}
      </button>
    </div>
  );
}
