import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { timeAgo } from "./RhomieCheckIn";

const C = {
  mint:"#3dd6a3", sky:"#5bbde0", ocean:"#1a3a4a", frost:"#e8f9f4",
  mist:"#d6f0ff", white:"#ffffff", gray1:"#f4f7f9", gray2:"#e2eaed",
  gray3:"#9ab3be", gray4:"#4a6572", alert:"#e05555", success:"#27ae60",
};

// ─── Hook: own SOS state ───────────────────────────────────────────────────
export function useOwnSOS(userId) {
  const [activeSOS, setActiveSOS] = useState(null);
  const [loading,   setLoading]   = useState(false);

  useEffect(() => {
    if (!userId) return;
    supabase.from("sos_alerts")
      .select("*")
      .eq("user_id", userId)
      .is("resolved_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error("useOwnSOS fetch:", error);
        if (data) setActiveSOS(data);
      });
  }, [userId]);

  async function sendSOS({ lat, lng, message }) {
    setLoading(true);
    const { data, error } = await supabase.from("sos_alerts")
      .insert({ user_id: userId, lat, lng, message })
      .select().single();
    setLoading(false);
    if (error) { console.error("sendSOS:", error); return false; }
    setActiveSOS(data);
    return true;
  }

  async function cancelSOS() {
    if (!activeSOS) return true;
    setLoading(true);
    const { error } = await supabase.from("sos_alerts")
      .update({ resolved_at: new Date().toISOString() })
      .eq("id", activeSOS.id);
    setLoading(false);
    if (error) { console.error("cancelSOS:", error); return false; }
    setActiveSOS(null);
    return true;
  }

  return { activeSOS, sendSOS, cancelSOS, loading };
}

// ─── Hook: incoming crew SOSes ─────────────────────────────────────────────
export function useCrewSOS(userId, crewMembers) {
  const [incomingSOSes, setIncomingSOSes] = useState([]);

  useEffect(() => {
    if (!userId) return;

    // Check for already-active SOSes when crew loads
    if (crewMembers.length) {
      const ids = crewMembers.map(m => m.id);
      supabase.from("sos_alerts")
        .select("*")
        .in("user_id", ids)
        .is("resolved_at", null)
        .then(({ data, error }) => {
          if (error) console.error("useCrewSOS fetch:", error);
          if (data?.length) setIncomingSOSes(data);
        });
    }

    const channel = supabase.channel("crew-sos")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "sos_alerts" }, (payload) => {
        const { user_id } = payload.new;
        if (user_id === userId) return;
        if (!crewMembers.some(m => m.id === user_id)) return;
        setIncomingSOSes(prev => [...prev, payload.new]);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "sos_alerts" }, (payload) => {
        if (payload.new.resolved_at)
          setIncomingSOSes(prev => prev.filter(s => s.id !== payload.new.id));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, crewMembers]);

  function dismissSOS(id) {
    setIncomingSOSes(prev => prev.filter(s => s.id !== id));
  }

  return { incomingSOSes, dismissSOS };
}

// ─── Floating SOS button ───────────────────────────────────────────────────
export function SOSButton({ activeSOS, onClick }) {
  return (
    <>
      <style>{`
        @keyframes sosPulse {
          0%,100% { box-shadow: 0 4px 20px #e0555566, 0 0 0 0 #e0555544; }
          50%      { box-shadow: 0 4px 20px #e0555599, 0 0 0 10px transparent; }
        }
      `}</style>
      <button onClick={onClick} style={{
        display:"flex", alignItems:"center", justifyContent:"center", gap:6,
        height:52, padding:"0 20px", borderRadius:26,
        background: C.alert, border:"none",
        color: C.white, fontSize:14, fontWeight:700,
        cursor:"pointer", fontFamily:"'DM Serif Display',serif",
        animation: activeSOS ? "sosPulse 1.5s ease-in-out infinite" : "none",
        boxShadow: activeSOS ? "none" : `0 4px 20px ${C.alert}66`,
        transition:"all 0.2s",
      }}>
        <span style={{ fontSize:18 }}>🆘</span>
        {activeSOS ? `SOS Active · ${timeAgo(activeSOS.created_at)}` : "SOS"}
      </button>
    </>
  );
}

// ─── SOS confirm / cancel sheet ────────────────────────────────────────────
export function SOSSheet({ userId, userLocation, activeSOS, onSend, onCancel, onClose }) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [error, setError] = useState("");

  async function handleSend() {
    setLoading(true);
    setError("");
    const ok = await onSend({
      lat: userLocation?.lat ?? null,
      lng: userLocation?.lng ?? null,
      message: message.trim(),
    });
    setLoading(false);
    if (ok) onClose();
    else setError("Could not send SOS. Check your connection and try again.");
  }

  async function handleCancel() {
    setLoading(true);
    setError("");
    const ok = await onCancel();
    setLoading(false);
    if (ok) onClose();
    else setError("Could not cancel SOS. Your crew may still see it as active — try again.");
  }

  // ── Cancel active SOS view ──
  if (activeSOS) return (
    <div style={{ padding:"20px 24px 32px" }}>
      {error && (
        <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, padding:"10px 14px", marginBottom:16, fontSize:13, color:C.alert }}>
          ⚠️ {error}
        </div>
      )}
      <div style={{
        background:"#fef2f2", border:"1px solid #fecaca", borderRadius:14,
        padding:"16px 18px", marginBottom:20, textAlign:"center",
      }}>
        <div style={{ fontSize:32, marginBottom:8 }}>🆘</div>
        <div style={{ fontSize:15, fontWeight:700, color:C.alert, marginBottom:4 }}>
          SOS is active
        </div>
        <div style={{ fontSize:12, color:C.gray4 }}>
          Sent {timeAgo(activeSOS.created_at)}
          {activeSOS.message ? ` · "${activeSOS.message}"` : ""}
        </div>
      </div>
      {!confirmCancel ? (
        <>
          <p style={{ fontSize:13, color:C.gray4, marginBottom:20, textAlign:"center", lineHeight:1.6 }}>
            Your crew has been alerted. If you're safe, cancel the SOS.
          </p>
          <button onClick={() => setConfirmCancel(true)} style={{
            width:"100%", padding:"14px", borderRadius:14, border:`2px solid ${C.gray2}`,
            background:C.white, color:C.ocean, fontSize:15, fontWeight:700,
            cursor:"pointer", fontFamily:"inherit",
          }}>
            I'm safe — cancel SOS
          </button>
        </>
      ) : (
        <>
          <p style={{ fontSize:14, fontWeight:600, color:C.ocean, textAlign:"center", marginBottom:16 }}>
            Are you sure you're safe?
          </p>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={() => setConfirmCancel(false)} style={{
              flex:1, padding:"13px", borderRadius:14, border:`1.5px solid ${C.gray2}`,
              background:C.white, color:C.gray4, fontSize:14, fontWeight:600,
              cursor:"pointer", fontFamily:"inherit",
            }}>
              Go back
            </button>
            <button onClick={handleCancel} disabled={loading} style={{
              flex:1, padding:"13px", borderRadius:14, border:"none",
              background: C.success, color:C.white, fontSize:14, fontWeight:700,
              cursor: loading ? "not-allowed" : "pointer", fontFamily:"inherit",
            }}>
              {loading ? "Cancelling..." : "Yes, I'm safe ✓"}
            </button>
          </div>
        </>
      )}
    </div>
  );

  // ── Send SOS view ──
  return (
    <div style={{ padding:"20px 24px 32px" }}>
      {error && (
        <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, padding:"10px 14px", marginBottom:16, fontSize:13, color:C.alert }}>
          ⚠️ {error}
        </div>
      )}
      <div style={{
        background:"#fef2f2", border:"1px solid #fecaca", borderRadius:14,
        padding:"14px 16px", marginBottom:20,
        display:"flex", alignItems:"flex-start", gap:12,
      }}>
        <span style={{ fontSize:22, flexShrink:0 }}>⚠️</span>
        <div style={{ fontSize:13, color:"#991b1b", lineHeight:1.6 }}>
          This will immediately alert everyone in your crew with your location. Only use in a genuine emergency.
        </div>
      </div>

      <div style={{
        border:`1.5px solid ${C.gray2}`, borderRadius:12,
        padding:"10px 14px", marginBottom:16,
        display:"flex", alignItems:"center", gap:8, background:C.white,
      }}>
        <span style={{ fontSize:16, flexShrink:0 }}>✏️</span>
        <input
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Optional: describe your situation..."
          maxLength={140}
          style={{
            flex:1, border:"none", outline:"none",
            fontSize:14, color:C.ocean, background:"transparent",
            fontFamily:"inherit",
          }}
        />
      </div>

      <div style={{ fontSize:11, color:C.gray3, marginBottom:20, display:"flex", alignItems:"center", gap:5 }}>
        <span>📍</span> Your current location will be shared with your crew.
      </div>

      <button onClick={handleSend} disabled={loading} style={{
        width:"100%", padding:"15px", borderRadius:14, border:"none",
        background: loading ? C.gray2 : C.alert,
        color: loading ? C.gray3 : C.white,
        fontSize:16, fontWeight:700,
        cursor: loading ? "not-allowed" : "pointer",
        fontFamily:"inherit", transition:"all 0.2s",
        boxShadow: loading ? "none" : `0 4px 20px ${C.alert}55`,
        letterSpacing:"0.3px",
      }}>
        {loading ? "Sending alert..." : "🆘 Send SOS Alert"}
      </button>
    </div>
  );
}

// ─── Incoming SOS modal ────────────────────────────────────────────────────
export function IncomingSOSModal({ sos, member, onDismiss }) {
  const mapsUrl = sos.lat && sos.lng
    ? `https://www.google.com/maps?q=${sos.lat},${sos.lng}`
    : null;

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:200,
      background:"rgba(0,0,0,0.75)",
      display:"flex", alignItems:"center", justifyContent:"center",
      padding:24, fontFamily:"'DM Serif Display',serif",
    }}>
      <style>{`
        @keyframes sosSlideIn { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes sosBlink { 0%,100%{opacity:1} 50%{opacity:0.6} }
      `}</style>
      <div style={{
        width:"100%", maxWidth:380,
        background:C.white, borderRadius:24,
        overflow:"hidden", boxShadow:"0 24px 80px rgba(0,0,0,0.5)",
        animation:"sosSlideIn 0.3s ease",
      }}>
        {/* Header */}
        <div style={{
          background:C.alert, padding:"24px 24px 20px", textAlign:"center",
          animation:"sosBlink 2s ease-in-out infinite",
        }}>
          <div style={{ fontSize:44, marginBottom:8 }}>🆘</div>
          <div style={{ fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.7)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:4 }}>
            Emergency Alert
          </div>
          <div style={{ fontSize:22, fontWeight:700, color:C.white, fontStyle:"italic" }}>
            {member?.name || "Someone"} needs help
          </div>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.7)", marginTop:4 }}>
            {timeAgo(sos.created_at)}
          </div>
        </div>

        <div style={{ padding:"20px 24px 28px" }}>
          {/* Message */}
          {sos.message && (
            <div style={{
              background:C.gray1, borderRadius:12, padding:"12px 16px",
              marginBottom:16, fontSize:14, color:C.ocean,
              fontStyle:"italic", lineHeight:1.5,
            }}>
              "{sos.message}"
            </div>
          )}

          {/* Location */}
          {mapsUrl ? (
            <a href={mapsUrl} target="_blank" rel="noreferrer" style={{
              display:"flex", alignItems:"center", justifyContent:"center", gap:8,
              padding:"13px", borderRadius:14, marginBottom:12,
              background:C.ocean, color:C.white,
              fontSize:14, fontWeight:700, textDecoration:"none",
              boxShadow:`0 4px 16px rgba(26,58,74,0.3)`,
            }}>
              📍 Get Directions
            </a>
          ) : (
            <div style={{
              padding:"12px 16px", borderRadius:12, marginBottom:12,
              background:C.gray1, fontSize:13, color:C.gray4, textAlign:"center",
            }}>
              📍 Location not available
            </div>
          )}

          <button onClick={onDismiss} style={{
            width:"100%", padding:"13px", borderRadius:14,
            border:`1.5px solid ${C.gray2}`, background:C.white,
            color:C.gray4, fontSize:14, fontWeight:600,
            cursor:"pointer", fontFamily:"inherit",
          }}>
            I see it — dismiss
          </button>

          <div style={{ fontSize:11, color:C.gray3, textAlign:"center", marginTop:12, lineHeight:1.5 }}>
            Dismissing only hides this on your device. The alert stays active until {member?.name?.split(" ")[0] || "they"} cancels it.
          </div>
        </div>
      </div>
    </div>
  );
}
