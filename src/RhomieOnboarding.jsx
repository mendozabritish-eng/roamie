import { useState } from "react";
import { supabase } from "./supabaseClient";

// ─── Brand tokens ──────────────────────────────────────────────────────────
const C = {
  mint:    "#3dd6a3",
  sky:     "#5bbde0",
  ocean:   "#1a3a4a",
  frost:   "#e8f9f4",
  mist:    "#d6f0ff",
  peach:   "#f0845a",
  white:   "#ffffff",
  gray1:   "#f4f7f9",
  gray2:   "#e2eaed",
  gray3:   "#9ab3be",
  gray4:   "#4a6572",
  alert:   "#e05555",
  success: "#27ae60",
};

// ─── Map watermark ─────────────────────────────────────────────────────────
function MapWatermark({ color = C.ocean, opacity = 0.04 }) {
  return (
    <svg style={{ position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none" }}
      viewBox="0 0 400 300" opacity={opacity} preserveAspectRatio="xMidYMid slice">
      {[50,100,150,200,250].map(y=><line key={y} x1="0" y1={y} x2="400" y2={y} stroke={color} strokeWidth="0.5"/>)}
      {[80,160,240,320].map(x=><line key={x} x1={x} y1="0" x2={x} y2="300" stroke={color} strokeWidth="0.4"/>)}
      <path d="M30 55 Q42 44 58 46 Q64 38 74 42 Q80 36 88 40 Q95 34 104 38 Q110 33 118 37 L118 95 Q110 102 104 97 Q95 103 88 98 Q80 103 74 97 Q64 102 58 95 Q42 100 30 93 Z" fill={color}/>
      <path d="M58 95 Q64 105 68 118 Q70 128 66 140 Q62 152 58 158 Q54 150 52 138 Q50 126 52 115 Z" fill={color}/>
      <path d="M80 22 Q90 17 100 20 Q105 26 98 32 Q90 34 82 30 Z" fill={color}/>
      <path d="M168 44 Q176 38 185 40 Q192 35 200 38 Q206 33 212 37 L212 68 Q206 73 200 69 Q192 74 185 69 Q176 73 168 68 Z" fill={color}/>
      <path d="M176 82 Q184 76 194 77 Q202 76 210 82 Q214 92 215 108 Q214 128 210 146 Q205 160 196 166 Q187 160 182 146 Q178 128 177 108 Q176 92 176 82 Z" fill={color}/>
      <path d="M212 38 Q240 30 272 32 Q298 35 316 50 Q314 62 304 68 Q274 74 242 70 Q214 68 210 58 Z" fill={color}/>
      <path d="M258 70 Q265 72 268 84 Q267 98 262 108 Q256 98 254 84 Z" fill={color}/>
      <path d="M304 152 Q330 147 350 156 Q356 166 354 180 Q340 200 318 195 Q300 188 304 176 Z" fill={color}/>
    </svg>
  );
}

// ─── Logo ──────────────────────────────────────────────────────────────────
function RhomieLogo({ size = 48, dark = false }) {
  const color = dark ? C.white : C.ocean;
  const fs = size * 0.38;
  return (
    <div style={{ position:"relative", width:size*1.6, height:size, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <svg style={{ position:"absolute",inset:0,width:"100%",height:"100%",opacity:0.12 }} viewBox="0 0 80 50">
        <line x1="0" y1="25" x2="80" y2="25" stroke={color} strokeWidth="0.5"/>
        <line x1="0" y1="15" x2="80" y2="15" stroke={color} strokeWidth="0.3"/>
        <line x1="0" y1="35" x2="80" y2="35" stroke={color} strokeWidth="0.3"/>
        <line x1="26" y1="0" x2="26" y2="50" stroke={color} strokeWidth="0.3"/>
        <line x1="54" y1="0" x2="54" y2="50" stroke={color} strokeWidth="0.3"/>
        <path d="M4 12 Q14 7 26 9 Q34 5 40 7 Q46 5 54 9 Q66 7 76 12 L76 28 Q66 34 54 31 Q46 35 40 33 Q34 35 26 31 Q14 34 4 28 Z" fill={color}/>
      </svg>
      <div style={{ position:"relative", lineHeight:0.88, textAlign:"center", fontFamily:"'DM Serif Display',serif", fontStyle:"italic" }}>
        <div style={{ fontSize:fs, color, letterSpacing:"-0.5px" }}>rho</div>
        <div style={{ fontSize:fs, color, letterSpacing:"-0.5px" }}>mie<span style={{ color:C.mint }}>.</span></div>
      </div>
    </div>
  );
}

// ─── Step dots ─────────────────────────────────────────────────────────────
function StepDots({ total, current }) {
  return (
    <div style={{ display:"flex", gap:6, justifyContent:"center" }}>
      {Array.from({ length:total }).map((_,i) => (
        <div key={i} style={{
          width: i===current ? 20 : 7, height:7, borderRadius:4,
          background: i===current ? C.mint : i<current ? C.sky : C.gray2,
          transition:"all 0.3s ease",
        }}/>
      ))}
    </div>
  );
}

// ─── Input ─────────────────────────────────────────────────────────────────
function Input({ label, type="text", value, onChange, placeholder, icon, error }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom:16 }}>
      {label && <label style={{ display:"block", fontSize:12, fontWeight:600, color:C.ocean, marginBottom:6, letterSpacing:"0.3px", textTransform:"uppercase" }}>{label}</label>}
      <div style={{
        display:"flex", alignItems:"center", gap:10,
        border:`1.5px solid ${error ? C.alert : focused ? C.mint : C.gray2}`,
        borderRadius:12, padding:"12px 14px",
        background: focused ? C.frost : C.white,
        transition:"all 0.2s",
        boxShadow: focused ? `0 0 0 3px ${C.mint}22` : "none",
      }}>
        {icon && <span style={{ fontSize:18, flexShrink:0 }}>{icon}</span>}
        <input type={type} value={value} onChange={e=>onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
          style={{ flex:1, border:"none", outline:"none", fontSize:15, color:C.ocean, background:"transparent", fontFamily:"inherit" }}
        />
      </div>
      {error && <p style={{ fontSize:12, color:C.alert, marginTop:4 }}>{error}</p>}
    </div>
  );
}

// ─── Button ────────────────────────────────────────────────────────────────
function Btn({ children, onClick, disabled, loading, variant="primary", fullWidth=true }) {
  const [hov, setHov] = useState(false);
  const styles = {
    primary: { background: disabled||loading ? C.gray2 : hov ? "#2ec994" : C.mint, color: disabled||loading ? C.gray3 : C.ocean },
    secondary: { background:"transparent", color:C.ocean, border:`1.5px solid ${C.gray2}` },
    ghost: { background:"transparent", color:C.gray4 },
  };
  return (
    <button onClick={onClick} disabled={disabled||loading}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        width: fullWidth ? "100%" : "auto", padding:"14px 20px",
        borderRadius:14, border:"none", fontFamily:"inherit", fontSize:15, fontWeight:600,
        cursor: disabled||loading ? "not-allowed" : "pointer", transition:"all 0.2s",
        transform: hov&&!disabled&&!loading ? "translateY(-1px)" : "none",
        boxShadow: hov&&!disabled&&!loading&&variant==="primary" ? `0 6px 20px ${C.mint}55` : "none",
        ...styles[variant],
      }}>
      {loading ? "Please wait..." : children}
    </button>
  );
}

// ─── Avatar picker ─────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  { bg:"#e8f9f4", text:C.ocean },
  { bg:C.mist,   text:"#185fa5" },
  { bg:"#fff3ec", text:"#712b13" },
  { bg:"#eeedfe", text:"#3c3489" },
  { bg:"#fef3c7", text:"#92400e" },
  { bg:"#fce7f3", text:"#9d174d" },
];

function AvatarPicker({ initials, selectedColor, onSelect }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:16 }}>
      <div style={{
        width:90, height:90, borderRadius:"50%",
        background:selectedColor.bg,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontFamily:"'DM Serif Display',serif", fontStyle:"italic",
        fontSize:32, color:selectedColor.text,
        border:`3px solid ${C.mint}`, boxShadow:`0 0 0 6px ${C.mint}22`, transition:"all 0.2s",
      }}>
        {initials || "?"}
      </div>
      <div style={{ display:"flex", gap:10 }}>
        {AVATAR_COLORS.map((c,i) => (
          <div key={i} onClick={()=>onSelect(c)} style={{
            width:28, height:28, borderRadius:"50%", background:c.bg,
            border: selectedColor===c ? `2.5px solid ${C.ocean}` : `1.5px solid ${C.gray2}`,
            cursor:"pointer",
            transform: selectedColor===c ? "scale(1.2)" : "scale(1)",
            transition:"all 0.15s",
          }}/>
        ))}
      </div>
    </div>
  );
}

// ─── Travel styles ─────────────────────────────────────────────────────────
const TRAVEL_STYLES = [
  { id:"solo",    emoji:"🎒", label:"Solo Explorer",   desc:"I roam alone" },
  { id:"couple",  emoji:"💑", label:"Couple",          desc:"Traveling with a partner" },
  { id:"family",  emoji:"👨‍👩‍👧", label:"Family",          desc:"Kids in tow" },
  { id:"squad",   emoji:"🎉", label:"Squad Goals",     desc:"Group trips" },
  { id:"business",emoji:"💼", label:"Business",        desc:"Work travel" },
  { id:"content", emoji:"🎬", label:"Content Creator", desc:"I document everything" },
];

function TravelStylePicker({ selected, onToggle }) {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
      {TRAVEL_STYLES.map(s => {
        const active = selected.includes(s.id);
        return (
          <div key={s.id} onClick={()=>onToggle(s.id)} style={{
            border:`1.5px solid ${active ? C.mint : C.gray2}`,
            borderRadius:12, padding:"10px 12px",
            display:"flex", alignItems:"center", gap:10,
            cursor:"pointer", background: active ? C.frost : C.white,
            boxShadow: active ? `0 0 0 2px ${C.mint}33` : "none",
            transition:"all 0.15s",
          }}>
            <span style={{ fontSize:22 }}>{s.emoji}</span>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:C.ocean }}>{s.label}</div>
              <div style={{ fontSize:11, color:C.gray4 }}>{s.desc}</div>
            </div>
            {active && (
              <div style={{ marginLeft:"auto", width:18, height:18, borderRadius:"50%", background:C.mint, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <span style={{ color:C.ocean, fontSize:11, fontWeight:700 }}>✓</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Group label ───────────────────────────────────────────────────────────
const LABEL_PRESETS = ["My Crew","My People","My Squad","Travel Fam","Road Crew","My Team"];

function GroupLabelPicker({ value, onChange }) {
  return (
    <div>
      <Input label="What do you call your group?" value={value} onChange={onChange} placeholder="e.g. My Crew, My People..." icon="👥"/>
      <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:4 }}>
        {LABEL_PRESETS.map(p => (
          <div key={p} onClick={()=>onChange(p)} style={{
            padding:"6px 14px", borderRadius:20,
            border:`1.5px solid ${value===p ? C.mint : C.gray2}`,
            background: value===p ? C.frost : C.white,
            fontSize:13, color: value===p ? C.ocean : C.gray4,
            cursor:"pointer", fontWeight: value===p ? 600 : 400,
            transition:"all 0.15s",
          }}>{p}</div>
        ))}
      </div>
    </div>
  );
}

// ─── Completion screen ─────────────────────────────────────────────────────
function CompletionScreen({ profile, onEnter }) {
  const initials = `${profile.firstName?.[0]??""}${profile.lastName?.[0]??""}`.toUpperCase();
  return (
    <div style={{ textAlign:"center", padding:"20px 0" }}>
      <div style={{ fontSize:56, marginBottom:16 }}>🌍</div>
      <h2 style={{ fontFamily:"'DM Serif Display',serif", fontStyle:"italic", fontSize:32, color:C.ocean, marginBottom:8 }}>
        You're ready to roam.
      </h2>
      <p style={{ fontSize:15, color:C.gray4, lineHeight:1.6, marginBottom:28 }}>
        Welcome to Rhomie, {profile.firstName}. Your adventure is waiting.
      </p>
      <div style={{ background:C.frost, borderRadius:16, padding:20, border:`1px solid ${C.gray2}`, marginBottom:24, textAlign:"left" }}>
        <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16 }}>
          <div style={{
            width:52, height:52, borderRadius:"50%",
            background:profile.avatarColor.bg,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontFamily:"'DM Serif Display',serif", fontStyle:"italic",
            fontSize:20, color:profile.avatarColor.text,
            border:`2px solid ${C.mint}`,
          }}>{initials}</div>
          <div>
            <div style={{ fontWeight:700, fontSize:16, color:C.ocean }}>{profile.firstName} {profile.lastName}</div>
            <div style={{ fontSize:13, color:C.gray4 }}>@{profile.username}</div>
          </div>
        </div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
          {profile.travelStyles.map(s => {
            const style = TRAVEL_STYLES.find(t=>t.id===s);
            return style ? (
              <span key={s} style={{ fontSize:12, padding:"3px 10px", borderRadius:20, background:C.mist, color:"#185fa5", fontWeight:500 }}>
                {style.emoji} {style.label}
              </span>
            ) : null;
          })}
        </div>
        {profile.groupLabel && (
          <div style={{ marginTop:10, fontSize:13, color:C.gray4 }}>
            Group label: <strong style={{ color:C.ocean }}>{profile.groupLabel}</strong>
          </div>
        )}
      </div>
      <Btn onClick={onEnter}>Open Rhomie 🗺️</Btn>
    </div>
  );
}

// ─── Alert banner ──────────────────────────────────────────────────────────
function Alert({ message, type="error" }) {
  if (!message) return null;
  const bg = type === "error" ? "#fef2f2" : "#f0fdf4";
  const color = type === "error" ? C.alert : C.success;
  const border = type === "error" ? "#fecaca" : "#bbf7d0";
  return (
    <div style={{ background:bg, border:`1px solid ${border}`, borderRadius:10, padding:"10px 14px", marginBottom:16, fontSize:13, color, lineHeight:1.5 }}>
      {type === "error" ? "⚠️ " : "✅ "}{message}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────
export default function RhomieOnboarding({ onComplete, onSignIn }) {
  const [step, setStep]         = useState(0);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // Form state
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [firstName, setFirstName]       = useState("");
  const [lastName, setLastName]         = useState("");
  const [username, setUsername]         = useState("");
  const [avatarColor, setAvatarColor]   = useState(AVATAR_COLORS[0]);
  const [travelStyles, setTravelStyles] = useState([]);
  const [groupLabel, setGroupLabel]     = useState("My Crew");

  const initials = `${firstName?.[0]??""}${lastName?.[0]??""}`.toUpperCase();
  const TOTAL_DOTS = 4;

  function toggleStyle(id) {
    setTravelStyles(prev => prev.includes(id) ? prev.filter(s=>s!==id) : [...prev, id]);
  }

  function validate() {
    const e = {};
    if (step === 1) {
      if (!email.includes("@")) e.email = "Enter a valid email address";
      if (password.length < 8) e.password = "Password must be at least 8 characters";
    }
    if (step === 2) {
      if (!firstName.trim()) e.firstName = "First name is required";
      if (!username.trim()) e.username = "Username is required";
      if (username.includes(" ")) e.username = "Username cannot contain spaces";
    }
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── Step 1 → 2: Create Supabase auth account ───────────────────────────
  async function handleCreateAccount() {
    if (!validate()) return;
    setLoading(true);
    setError("");
    try {
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) throw signUpError;
      setStep(2);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2 → 3: Save profile to Supabase ──────────────────────────────
  async function handleSaveProfile() {
    if (!validate()) return;
    setLoading(true);
    setError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user found.");

      // Check username is unique
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username.toLowerCase())
        .single();

      if (existing) {
        setFieldErrors({ username: "That username is already taken" });
        setLoading(false);
        return;
      }

      const { error: profileError } = await supabase.from("profiles").upsert({
        user_id:      user.id,
        first_name:   firstName.trim(),
        last_name:    lastName.trim(),
        username:     username.toLowerCase().trim(),
        avatar_color: JSON.stringify(avatarColor),
        group_label:  groupLabel,
      });

      if (profileError) throw profileError;
      setStep(3);
    } catch (err) {
      setError(err.message || "Could not save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Step 3 → 4: Save travel styles ────────────────────────────────────
  async function handleSaveTravelStyles() {
    setLoading(true);
    setError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user found.");

      // Delete existing styles first (in case of re-run)
      await supabase.from("travel_styles").delete().eq("user_id", user.id);

      const rows = travelStyles.map(style => ({ user_id: user.id, style }));
      if (rows.length > 0) {
        const { error: stylesError } = await supabase.from("travel_styles").insert(rows);
        if (stylesError) throw stylesError;
      }
      setStep(4);
    } catch (err) {
      setError(err.message || "Could not save travel styles. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Step 4 → 5: Save group label & finish ─────────────────────────────
  async function handleFinish() {
    setLoading(true);
    setError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user found.");

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ group_label: groupLabel })
        .eq("user_id", user.id);

      if (updateError) throw updateError;
      setStep(5);
    } catch (err) {
      setError(err.message || "Could not save. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function back() {
    setError("");
    setFieldErrors({});
    setStep(s => s - 1);
  }

  const profile = { firstName, lastName, username, avatarColor, travelStyles, groupLabel };

  // ── Shell ──────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight:"100vh",
      background:`linear-gradient(145deg, ${C.frost} 0%, ${C.mist} 50%, #f0fbff 100%)`,
      display:"flex", alignItems:"center", justifyContent:"center",
      padding:20, fontFamily:"'DM Serif Display','Georgia',serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&display=swap');
        * { box-sizing: border-box; }
        input::placeholder { color: #9ab3be; }
        input { font-family: 'DM Serif Display', Georgia, serif !important; }
      `}</style>

      <div style={{
        width:"100%", maxWidth:420,
        background:C.white, borderRadius:28,
        boxShadow:"0 20px 60px rgba(26,58,74,0.12)",
        overflow:"hidden", position:"relative",
      }}>
        <MapWatermark />

        {/* WELCOME */}
        {step === 0 && (
          <div style={{ padding:40, textAlign:"center", position:"relative" }}>
            <div style={{ display:"flex", justifyContent:"center", marginBottom:24 }}>
              <RhomieLogo size={52} />
            </div>
            <h1 style={{ fontSize:28, fontStyle:"italic", color:C.ocean, marginBottom:10, lineHeight:1.2 }}>
              Go further.<br/>Stay found.
            </h1>
            <p style={{ fontSize:15, color:C.gray4, lineHeight:1.7, marginBottom:32 }}>
              Your travel companion for solo adventures, road trips, and keeping your people in the loop — anywhere in the world.
            </p>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <Btn onClick={()=>setStep(1)}>Create your Rhomie profile</Btn>
              <Btn variant="ghost" onClick={onSignIn}>
                Already have an account? Sign in
              </Btn>
            </div>
            <div style={{ marginTop:24, display:"flex", justifyContent:"center", gap:24 }}>
              {["🌍 48 states","🛡️ Safe havens","👥 Your crew"].map(t=>(
                <span key={t} style={{ fontSize:11, color:C.gray3, fontStyle:"italic" }}>{t}</span>
              ))}
            </div>
          </div>
        )}

        {/* ACCOUNT */}
        {step === 1 && (
          <div style={{ padding:36, position:"relative" }}>
            <div style={{ marginBottom:24 }}><StepDots total={TOTAL_DOTS} current={0}/></div>
            <h2 style={{ fontSize:24, fontStyle:"italic", color:C.ocean, marginBottom:6 }}>Create account</h2>
            <p style={{ fontSize:14, color:C.gray4, marginBottom:24 }}>Your Rhomie starts here.</p>
            <Alert message={error} />
            <Input label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" icon="✉️" error={fieldErrors.email}/>
            <Input label="Password" type="password" value={password} onChange={setPassword} placeholder="At least 8 characters" icon="🔒" error={fieldErrors.password}/>
            <div style={{ background:C.frost, borderRadius:10, padding:"10px 14px", marginBottom:20, fontSize:12, color:C.gray4 }}>
              🔐 Private by default. Only people you invite can see your location.
            </div>
            <Btn onClick={handleCreateAccount} loading={loading}>Continue</Btn>
            <div style={{ textAlign:"center", marginTop:12 }}>
              <button onClick={back} style={{ background:"none", border:"none", fontSize:13, color:C.gray3, cursor:"pointer", fontFamily:"inherit" }}>← Back</button>
            </div>
          </div>
        )}

        {/* PROFILE */}
        {step === 2 && (
          <div style={{ padding:36, position:"relative" }}>
            <div style={{ marginBottom:24 }}><StepDots total={TOTAL_DOTS} current={1}/></div>
            <h2 style={{ fontSize:24, fontStyle:"italic", color:C.ocean, marginBottom:6 }}>Your profile</h2>
            <p style={{ fontSize:14, color:C.gray4, marginBottom:24 }}>How should your crew know you?</p>
            <Alert message={error} />
            <div style={{ marginBottom:24, display:"flex", justifyContent:"center" }}>
              <AvatarPicker initials={initials} selectedColor={avatarColor} onSelect={setAvatarColor}/>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <Input label="First name" value={firstName} onChange={setFirstName} placeholder="First" error={fieldErrors.firstName}/>
              <Input label="Last name" value={lastName} onChange={setLastName} placeholder="Last"/>
            </div>
            <Input label="Username" value={username} onChange={v=>setUsername(v.replace(/\s/g,"").toLowerCase())} placeholder="@yourname" icon="@" error={fieldErrors.username}/>
            <Btn onClick={handleSaveProfile} loading={loading}>Continue</Btn>
            <div style={{ textAlign:"center", marginTop:12 }}>
              <button onClick={back} style={{ background:"none", border:"none", fontSize:13, color:C.gray3, cursor:"pointer", fontFamily:"inherit" }}>← Back</button>
            </div>
          </div>
        )}

        {/* TRAVEL STYLE */}
        {step === 3 && (
          <div style={{ padding:36, position:"relative" }}>
            <div style={{ marginBottom:24 }}><StepDots total={TOTAL_DOTS} current={2}/></div>
            <h2 style={{ fontSize:24, fontStyle:"italic", color:C.ocean, marginBottom:6 }}>How do you travel?</h2>
            <p style={{ fontSize:14, color:C.gray4, marginBottom:20 }}>Pick all that apply.</p>
            <Alert message={error} />
            <TravelStylePicker selected={travelStyles} onToggle={toggleStyle}/>
            <div style={{ marginTop:20 }}>
              <Btn onClick={handleSaveTravelStyles} loading={loading} disabled={travelStyles.length===0}>Continue</Btn>
            </div>
            <div style={{ textAlign:"center", marginTop:12 }}>
              <button onClick={back} style={{ background:"none", border:"none", fontSize:13, color:C.gray3, cursor:"pointer", fontFamily:"inherit" }}>← Back</button>
            </div>
          </div>
        )}

        {/* GROUP LABEL */}
        {step === 4 && (
          <div style={{ padding:36, position:"relative" }}>
            <div style={{ marginBottom:24 }}><StepDots total={TOTAL_DOTS} current={3}/></div>
            <h2 style={{ fontSize:24, fontStyle:"italic", color:C.ocean, marginBottom:6 }}>Name your crew</h2>
            <p style={{ fontSize:14, color:C.gray4, marginBottom:24 }}>What do you call the people you travel with? Change it anytime.</p>
            <Alert message={error} />
            <GroupLabelPicker value={groupLabel} onChange={setGroupLabel}/>
            <div style={{ marginTop:24 }}>
              <Btn onClick={handleFinish} loading={loading}>Finish setup</Btn>
            </div>
            <div style={{ textAlign:"center", marginTop:12 }}>
              <button onClick={back} style={{ background:"none", border:"none", fontSize:13, color:C.gray3, cursor:"pointer", fontFamily:"inherit" }}>← Back</button>
            </div>
          </div>
        )}

        {/* DONE */}
        {step === 5 && (
          <div style={{ padding:36, position:"relative" }}>
            <CompletionScreen profile={profile} onEnter={()=>onComplete?.(profile)}/>
          </div>
        )}

        {/* Mint accent bar */}
        <div style={{ height:4, background:`linear-gradient(90deg, ${C.mint}, ${C.sky})`, position:"absolute", bottom:0, left:0, right:0 }}/>
      </div>
    </div>
  );
}
