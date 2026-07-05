import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabaseClient";

const C = {
  mint:"#3dd6a3",sky:"#5bbde0",ocean:"#1a3a4a",frost:"#e8f9f4",mist:"#d6f0ff",
  white:"#ffffff",gray1:"#f4f7f9",gray2:"#e2eaed",gray3:"#9ab3be",gray4:"#4a6572",
  alert:"#e05555",warning:"#f5c842",success:"#27ae60",peach:"#f0845a",
};

// ─── Generate a random invite code ────────────────────────────────────────
function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ─── Button ────────────────────────────────────────────────────────────────
function Btn({ children, onClick, disabled, loading, variant="primary", fullWidth=true, small=false }) {
  const [hov, setHov] = useState(false);
  const styles = {
    primary: { background: disabled||loading ? C.gray2 : hov ? "#2ec994" : C.mint, color: disabled||loading ? C.gray3 : C.ocean },
    secondary: { background: "transparent", color: C.ocean, border: `1.5px solid ${C.gray2}` },
    danger: { background: hov ? "#c94444" : C.alert, color: C.white },
    sky: { background: hov ? "#4aaed0" : C.sky, color: C.white },
  };
  return (
    <button onClick={onClick} disabled={disabled||loading}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        width: fullWidth ? "100%" : "auto",
        padding: small ? "7px 14px" : "12px 20px",
        borderRadius: 12, border: "none", fontFamily: "inherit",
        fontSize: small ? 12 : 14, fontWeight: 600,
        cursor: disabled||loading ? "not-allowed" : "pointer",
        transition: "all 0.15s", ...styles[variant],
      }}>
      {loading ? "Please wait..." : children}
    </button>
  );
}

// ─── Alert ─────────────────────────────────────────────────────────────────
function Alert({ message, type="error" }) {
  if (!message) return null;
  const cfg = {
    error:   { bg:"#fef2f2", color:C.alert,   border:"#fecaca", icon:"⚠️" },
    success: { bg:"#f0fdf4", color:C.success,  border:"#bbf7d0", icon:"✅" },
    info:    { bg:C.frost,   color:C.sky,      border:C.mist,    icon:"ℹ️" },
  }[type];
  return (
    <div style={{ background:cfg.bg, border:`1px solid ${cfg.border}`, borderRadius:10, padding:"10px 14px", marginBottom:14, fontSize:13, color:cfg.color, lineHeight:1.5 }}>
      {cfg.icon} {message}
    </div>
  );
}

// ─── Invite sheet ──────────────────────────────────────────────────────────
export function InviteSheet({ onClose, groupLabel="My Crew", userId }) {
  const [inviteCode,   setInviteCode]   = useState(null);
  const [inviteLink,   setInviteLink]   = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [copied,       setCopied]       = useState(false);
  const [error,        setError]        = useState("");
  const [existingInvites, setExistingInvites] = useState([]);

  useEffect(() => { fetchInvites(); }, []);

  async function fetchInvites() {
    const { data } = await supabase
      .from("invites")
      .select("*")
      .eq("created_by", userId)
      .order("created_at", { ascending: false })
      .limit(5);
    if (data) setExistingInvites(data);
  }

  async function generateInvite() {
    setLoading(true);
    setError("");
    try {
      const code = generateCode();
      const { data, error: insertError } = await supabase
        .from("invites")
        .insert({ created_by: userId, code })
        .select()
        .single();
      if (insertError) throw insertError;
      const link = `${window.location.origin}?invite=${data.code}`;
      setInviteCode(data.code);
      setInviteLink(link);
      fetchInvites();
    } catch (err) {
      setError(err.message || "Could not generate invite.");
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function shareLink() {
    if (navigator.share) {
      navigator.share({ title: "Join my Rhomie crew!", text: `Join my ${groupLabel} on Rhomie — a travel safety app. Use my invite link:`, url: inviteLink });
    } else { copyLink(); }
  }

  return (
    <div style={{ padding: "0 0 20px" }}>
      <Alert message={error} />

      {/* Generate section */}
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.gray2}` }}>
        <p style={{ fontSize: 13, color: C.gray4, marginBottom: 14, lineHeight: 1.6 }}>
          Generate a private invite link. Anyone with this link can join your <strong style={{ color: C.ocean }}>{groupLabel}</strong> and see your location on the map.
        </p>
        <Btn onClick={generateInvite} loading={loading}>
          ✨ Generate invite link
        </Btn>
      </div>

      {/* Generated link */}
      {inviteLink && (
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.gray2}` }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.gray4, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Your invite link</div>
          <div style={{
            background: C.frost, borderRadius: 10, padding: "10px 14px",
            fontSize: 12, color: C.ocean, fontFamily: "monospace",
            wordBreak: "break-all", marginBottom: 10, border: `1px solid ${C.gray2}`,
          }}>
            {inviteLink}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn onClick={copyLink} variant="secondary" fullWidth={false} small>
              {copied ? "✅ Copied!" : "📋 Copy"}
            </Btn>
            <Btn onClick={shareLink} variant="sky" fullWidth={false} small>
              📤 Share
            </Btn>
          </div>
          <div style={{ fontSize: 11, color: C.gray3, marginTop: 8, fontStyle: "italic" }}>
            ⏱ This link expires in 7 days
          </div>
        </div>
      )}

      {/* Existing invites */}
      {existingInvites.length > 0 && (
        <div style={{ padding: "16px 20px" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.gray4, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>Recent invites</div>
          {existingInvites.map(inv => (
            <div key={inv.id} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "8px 0", borderBottom: `0.5px solid ${C.gray2}`,
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.ocean, fontFamily: "monospace" }}>{inv.code}</div>
                <div style={{ fontSize: 11, color: C.gray4 }}>
                  {inv.accepted_by ? "✅ Accepted" : "⏳ Pending"} · expires {new Date(inv.expires_at).toLocaleDateString()}
                </div>
              </div>
              <button onClick={async () => {
                const link = `${window.location.origin}?invite=${inv.code}`;
                await navigator.clipboard.writeText(link);
              }} style={{ background: C.gray1, border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 11, color: C.gray4, cursor: "pointer" }}>
                Copy
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Accept invite screen ──────────────────────────────────────────────────
export function AcceptInviteScreen({ code, userId, onComplete }) {
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState(false);
  const [inviteData, setInviteData] = useState(null);

  useEffect(() => { lookupInvite(); }, [code]);

  async function lookupInvite() {
    const { data, error } = await supabase.rpc("preview_invite", { invite_code: code });
    if (error || !data) { setError(error?.message || "This invite link is invalid or has expired."); return; }
    setInviteData(data);
  }

  async function acceptInvite() {
    if (!inviteData) return;
    setLoading(true);
    setError("");
    try {
      const { error: acceptError } = await supabase.rpc("accept_invite", { invite_code: code });
      if (acceptError) throw acceptError;

      setSuccess(true);
      setTimeout(() => onComplete?.(), 2000);
    } catch (err) {
      setError(err.message || "Could not accept invite.");
    } finally {
      setLoading(false);
    }
  }

  if (success) return (
    <div style={{ minHeight: "100vh", background: C.frost, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'DM Serif Display',serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
        <h2 style={{ fontSize: 28, fontStyle: "italic", color: C.ocean, marginBottom: 8 }}>You're in!</h2>
        <p style={{ fontSize: 15, color: C.gray4 }}>You've joined the crew. Opening Rhomie...</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: C.frost, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'DM Serif Display',serif" }}>
      <div style={{ width: "100%", maxWidth: 380, background: C.white, borderRadius: 24, boxShadow: "0 20px 60px rgba(26,58,74,0.12)", overflow: "hidden" }}>
        <div style={{ background: C.ocean, padding: "28px 24px 24px", textAlign: "center" }}>
          <div style={{ lineHeight: 0.88, fontStyle: "italic", fontSize: 32, color: C.white, letterSpacing: "-1px", marginBottom: 12 }}>
            <div>rho</div><div>mie<span style={{ color: C.mint }}>.</span></div>
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>You've been invited</div>
        </div>
        <div style={{ padding: "24px 24px 28px" }}>
          <Alert message={error} />
          {inviteData && !error && (
            <>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>👥</div>
                <h3 style={{ fontSize: 20, fontStyle: "italic", color: C.ocean, marginBottom: 6 }}>
                  Join {inviteData.first_name}'s {inviteData.group_label || "crew"}
                </h3>
                <p style={{ fontSize: 13, color: C.gray4, lineHeight: 1.6 }}>
                  You'll be able to see each other's location on the map and stay connected while traveling.
                </p>
              </div>
              <div style={{ background: C.frost, borderRadius: 12, padding: "12px 16px", marginBottom: 20, fontSize: 12, color: C.gray4 }}>
                🔒 Location sharing is always opt-in. You control when you're visible.
              </div>
              <Btn onClick={acceptInvite} loading={loading}>Join the crew 🗺️</Btn>
            </>
          )}
          {error && (
            <Btn onClick={() => window.location.href = "/"} variant="secondary">Go to Rhomie</Btn>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Real-time location hook ───────────────────────────────────────────────
export function useRealtimeLocation({ userId, mapInstance, crewMembers, pinColors }) {
  const watchId        = useRef(null);
  const crewMarkersRef = useRef({});
  const [sharing, setSharing] = useState(false);

  // Broadcast own location
  const startSharing = useCallback(async () => {
    if (!navigator.geolocation) return;
    setSharing(true);
    watchId.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { lat, lng } = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        await supabase.from("locations").upsert({ user_id: userId, lat, lng, updated_at: new Date().toISOString() });
      },
      (err) => console.error("Location error:", err),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
  }, [userId]);

  const stopSharing = useCallback(async () => {
    if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
    setSharing(false);
    await supabase.from("locations").delete().eq("user_id", userId);
  }, [userId]);

  // Place or move a crew marker
  const upsertMarker = useCallback((user_id, lat, lng, mapInstance, member, pinColors) => {
    const pos = new window.google.maps.LatLng(lat, lng);
    if (crewMarkersRef.current[user_id]) {
      crewMarkersRef.current[user_id].setPosition(pos);
    } else {
      const marker = new window.google.maps.Marker({
        position: pos,
        map: mapInstance,
        title: member?.name || "Crew member",
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: pinColors?.team || C.sky,
          fillOpacity: 1,
          strokeColor: C.white,
          strokeWeight: 2.5,
        },
        zIndex: 900,
      });
      // Show name on click
      const iw = new window.google.maps.InfoWindow({
        content: `<div style="font-family:'DM Serif Display',serif;padding:2px 4px;font-size:13px;color:#1a3a4a;font-weight:600;">${member?.name || "Crew member"}<br/><span style="font-size:11px;font-weight:400;color:#4a6572;">Live location</span></div>`,
      });
      marker.addListener("click", () => iw.open(mapInstance, marker));
      crewMarkersRef.current[user_id] = marker;
    }
  }, []);

  // Load markers for crew already sharing when map becomes available
  useEffect(() => {
    if (!mapInstance) return;
    const ids = crewMembers.map(m => m.id);
    const query = ids.length > 0
      ? supabase.from("locations").select("user_id,lat,lng").in("user_id", ids)
      : supabase.from("locations").select("user_id,lat,lng");
    query.then(({ data, error }) => {
      if (error) console.error("initial crew locations fetch:", error);
      if (!data) return;
      data.forEach(({ user_id, lat, lng }) => {
        if (user_id === userId) return;
        const member = crewMembers.find(m => m.id === user_id);
        upsertMarker(user_id, lat, lng, mapInstance, member, pinColors);
      });
    });
  }, [mapInstance, crewMembers, userId, pinColors, upsertMarker]);

  // Subscribe to crew location updates
  useEffect(() => {
    if (!mapInstance) return;

    const channel = supabase
      .channel("crew-locations")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "locations",
      }, (payload) => {
        // Handle stop-sharing: remove the marker
        if (payload.eventType === "DELETE") {
          const uid = payload.old?.user_id;
          if (uid && crewMarkersRef.current[uid]) {
            crewMarkersRef.current[uid].setMap(null);
            delete crewMarkersRef.current[uid];
          }
          return;
        }

        const { user_id, lat, lng } = payload.new || {};
        if (!user_id || user_id === userId) return;
        const isCrew = crewMembers.some(m => m.id === user_id);
        if (!isCrew || !mapInstance) return;

        const member = crewMembers.find(m => m.id === user_id);
        upsertMarker(user_id, lat, lng, mapInstance, member, pinColors);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [mapInstance, crewMembers, userId, pinColors, upsertMarker]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
      Object.values(crewMarkersRef.current).forEach(m => m.setMap(null));
    };
  }, []);

  return { sharing, startSharing, stopSharing };
}

// ─── Location sharing toggle button ───────────────────────────────────────
export function LocationToggle({ sharing, onStart, onStop }) {
  return (
    <button onClick={sharing ? onStop : onStart} style={{
      display: "flex", alignItems: "center", gap: 6,
      padding: "8px 14px", borderRadius: 20,
      background: sharing ? "#fef2f2" : C.frost,
      border: `1.5px solid ${sharing ? C.alert : C.mint}`,
      color: sharing ? C.alert : C.ocean,
      fontSize: 12, fontWeight: 600, cursor: "pointer",
      fontFamily: "inherit", transition: "all 0.15s",
    }}>
      <div style={{
        width: 8, height: 8, borderRadius: "50%",
        background: sharing ? C.alert : C.mint,
        boxShadow: sharing ? `0 0 0 3px ${C.alert}33` : `0 0 0 3px ${C.mint}33`,
        animation: sharing ? "pulse 1.5s ease-in-out infinite" : "none",
      }}/>
      {sharing ? "Sharing location" : "Share location"}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </button>
  );
}
