import { useState } from "react";
import { supabase } from "./supabaseClient";

// ─── Brand tokens ──────────────────────────────────────────────────────────
const C = {
  mint:    "#3dd6a3",
  sky:     "#5bbde0",
  ocean:   "#1a3a4a",
  frost:   "#e8f9f4",
  mist:    "#d6f0ff",
  white:   "#ffffff",
  gray1:   "#f4f7f9",
  gray2:   "#e2eaed",
  gray3:   "#9ab3be",
  gray4:   "#4a6572",
  alert:   "#e05555",
  success: "#27ae60",
};

// ─── Map watermark ─────────────────────────────────────────────────────────
function MapWatermark() {
  return (
    <svg style={{ position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none" }}
      viewBox="0 0 400 300" opacity={0.04} preserveAspectRatio="xMidYMid slice">
      {[50,100,150,200,250].map(y=><line key={y} x1="0" y1={y} x2="400" y2={y} stroke={C.ocean} strokeWidth="0.5"/>)}
      {[80,160,240,320].map(x=><line key={x} x1={x} y1="0" x2={x} y2="300" stroke={C.ocean} strokeWidth="0.4"/>)}
      <path d="M30 55 Q42 44 58 46 Q64 38 74 42 Q80 36 88 40 Q95 34 104 38 Q110 33 118 37 L118 95 Q110 102 104 97 Q95 103 88 98 Q80 103 74 97 Q64 102 58 95 Q42 100 30 93 Z" fill={C.ocean}/>
      <path d="M168 44 Q176 38 185 40 Q192 35 200 38 Q206 33 212 37 L212 68 Q206 73 200 69 Q192 74 185 69 Q176 73 168 68 Z" fill={C.ocean}/>
      <path d="M176 82 Q184 76 194 77 Q202 76 210 82 Q214 92 215 108 Q214 128 210 146 Q205 160 196 166 Q187 160 182 146 Q178 128 177 108 Q176 92 176 82 Z" fill={C.ocean}/>
      <path d="M304 152 Q330 147 350 156 Q356 166 354 180 Q340 200 318 195 Q300 188 304 176 Z" fill={C.ocean}/>
    </svg>
  );
}

// ─── Logo ──────────────────────────────────────────────────────────────────
function RhomieLogo({ size = 48 }) {
  const fs = size * 0.38;
  return (
    <div style={{ position:"relative", width:size*1.6, height:size, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <svg style={{ position:"absolute",inset:0,width:"100%",height:"100%",opacity:0.12 }} viewBox="0 0 80 50">
        <line x1="0" y1="25" x2="80" y2="25" stroke={C.ocean} strokeWidth="0.5"/>
        <line x1="0" y1="15" x2="80" y2="15" stroke={C.ocean} strokeWidth="0.3"/>
        <line x1="0" y1="35" x2="80" y2="35" stroke={C.ocean} strokeWidth="0.3"/>
        <line x1="26" y1="0" x2="26" y2="50" stroke={C.ocean} strokeWidth="0.3"/>
        <line x1="54" y1="0" x2="54" y2="50" stroke={C.ocean} strokeWidth="0.3"/>
        <path d="M4 12 Q14 7 26 9 Q34 5 40 7 Q46 5 54 9 Q66 7 76 12 L76 28 Q66 34 54 31 Q46 35 40 33 Q34 35 26 31 Q14 34 4 28 Z" fill={C.ocean}/>
      </svg>
      <div style={{ position:"relative", lineHeight:0.88, textAlign:"center", fontFamily:"'DM Serif Display',serif", fontStyle:"italic" }}>
        <div style={{ fontSize:fs, color:C.ocean, letterSpacing:"-0.5px" }}>rho</div>
        <div style={{ fontSize:fs, color:C.ocean, letterSpacing:"-0.5px" }}>mie<span style={{ color:C.mint }}>.</span></div>
      </div>
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
    primary:   { background: disabled||loading ? C.gray2 : hov ? "#2ec994" : C.mint, color: disabled||loading ? C.gray3 : C.ocean },
    secondary: { background:"transparent", color:C.ocean, border:`1.5px solid ${C.gray2}` },
    ghost:     { background:"transparent", color:C.gray4 },
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

// ─── Alert banner ──────────────────────────────────────────────────────────
function Alert({ message, type="error" }) {
  if (!message) return null;
  const bg     = type === "error" ? "#fef2f2" : "#f0fdf4";
  const color  = type === "error" ? C.alert   : C.success;
  const border = type === "error" ? "#fecaca" : "#bbf7d0";
  return (
    <div style={{ background:bg, border:`1px solid ${border}`, borderRadius:10, padding:"10px 14px", marginBottom:16, fontSize:13, color, lineHeight:1.5 }}>
      {type === "error" ? "⚠️ " : "✅ "}{message}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────
export default function RhomieSignIn({ onComplete, onCreateAccount }) {
  const [view, setView]       = useState("signin"); // "signin" | "forgot" | "forgot-sent"
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  function validate() {
    const e = {};
    if (!email.includes("@")) e.email = "Enter a valid email address";
    if (view === "signin" && password.length < 1) e.password = "Password is required";
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSignIn() {
    if (!validate()) return;
    setLoading(true);
    setError("");
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        onComplete?.({
          firstName:  profile.first_name,
          lastName:   profile.last_name,
          username:   profile.username,
          groupLabel: profile.group_label || "My Crew",
          locationPref: profile.location_pref || "ask",
        });
      } else {
        // Signed in but no profile — send to onboarding to finish setup
        onCreateAccount?.();
      }
    } catch (err) {
      const msg = err.message || "";
      if (msg.toLowerCase().includes("invalid login")) {
        setError("Incorrect email or password. Please try again.");
      } else {
        setError(msg || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!email.includes("@")) {
      setFieldErrors({ email: "Enter a valid email address" });
      return;
    }
    setFieldErrors({});
    setLoading(true);
    setError("");
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (resetError) throw resetError;
      setView("forgot-sent");
    } catch (err) {
      setError(err.message || "Could not send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      if (view === "signin") handleSignIn();
      if (view === "forgot") handleForgotPassword();
    }
  }

  return (
    <div
      onKeyDown={handleKeyDown}
      style={{
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

        {/* ── SIGN IN ── */}
        {view === "signin" && (
          <div style={{ padding:40, position:"relative" }}>
            <div style={{ display:"flex", justifyContent:"center", marginBottom:28 }}>
              <RhomieLogo size={52} />
            </div>
            <h2 style={{ fontSize:26, fontStyle:"italic", color:C.ocean, marginBottom:6, textAlign:"center" }}>
              Welcome back.
            </h2>
            <p style={{ fontSize:14, color:C.gray4, marginBottom:28, textAlign:"center" }}>
              Sign in to continue your journey.
            </p>
            <Alert message={error} />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
              icon="✉️"
              error={fieldErrors.email}
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="Your password"
              icon="🔒"
              error={fieldErrors.password}
            />
            <div style={{ textAlign:"right", marginTop:-8, marginBottom:20 }}>
              <button
                onClick={() => { setError(""); setFieldErrors({}); setView("forgot"); }}
                style={{ background:"none", border:"none", fontSize:13, color:C.sky, cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}>
                Forgot password?
              </button>
            </div>
            <Btn onClick={handleSignIn} loading={loading}>Sign in</Btn>
            <div style={{ textAlign:"center", marginTop:20, paddingTop:20, borderTop:`1px solid ${C.gray2}` }}>
              <span style={{ fontSize:14, color:C.gray4 }}>New to Rhomie? </span>
              <button
                onClick={onCreateAccount}
                style={{ background:"none", border:"none", fontSize:14, color:C.ocean, cursor:"pointer", fontFamily:"inherit", fontWeight:700 }}>
                Create an account →
              </button>
            </div>
          </div>
        )}

        {/* ── FORGOT PASSWORD ── */}
        {view === "forgot" && (
          <div style={{ padding:40, position:"relative" }}>
            <div style={{ display:"flex", justifyContent:"center", marginBottom:28 }}>
              <RhomieLogo size={52} />
            </div>
            <h2 style={{ fontSize:26, fontStyle:"italic", color:C.ocean, marginBottom:6, textAlign:"center" }}>
              Reset password
            </h2>
            <p style={{ fontSize:14, color:C.gray4, marginBottom:28, textAlign:"center", lineHeight:1.6 }}>
              Enter your email and we'll send you a link to reset your password.
            </p>
            <Alert message={error} />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
              icon="✉️"
              error={fieldErrors.email}
            />
            <Btn onClick={handleForgotPassword} loading={loading}>Send reset link</Btn>
            <div style={{ textAlign:"center", marginTop:12 }}>
              <button
                onClick={() => { setError(""); setFieldErrors({}); setView("signin"); }}
                style={{ background:"none", border:"none", fontSize:13, color:C.gray3, cursor:"pointer", fontFamily:"inherit" }}>
                ← Back to sign in
              </button>
            </div>
          </div>
        )}

        {/* ── FORGOT SENT ── */}
        {view === "forgot-sent" && (
          <div style={{ padding:40, position:"relative", textAlign:"center" }}>
            <div style={{ fontSize:56, marginBottom:16 }}>📬</div>
            <h2 style={{ fontSize:26, fontStyle:"italic", color:C.ocean, marginBottom:10 }}>
              Check your inbox.
            </h2>
            <p style={{ fontSize:14, color:C.gray4, lineHeight:1.7, marginBottom:28 }}>
              We sent a password reset link to <strong style={{ color:C.ocean }}>{email}</strong>. Follow the link in the email to choose a new password.
            </p>
            <div style={{ background:C.frost, borderRadius:12, padding:"12px 16px", marginBottom:28, fontSize:13, color:C.gray4, border:`1px solid ${C.gray2}` }}>
              Don't see it? Check your spam folder or wait a minute.
            </div>
            <Btn variant="secondary" onClick={() => { setPassword(""); setView("signin"); }}>
              Back to sign in
            </Btn>
          </div>
        )}

        {/* Mint accent bar */}
        <div style={{ height:4, background:`linear-gradient(90deg, ${C.mint}, ${C.sky})`, position:"absolute", bottom:0, left:0, right:0 }}/>
      </div>
    </div>
  );
}

// ─── Reset password (landing screen for the recovery email link) ──────────
export function ResetPasswordScreen({ onComplete }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [done, setDone]         = useState(false);

  function validate() {
    const e = {};
    if (password.length < 6) e.password = "Password must be at least 6 characters";
    if (confirm !== password) e.confirm = "Passwords don't match";
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleReset() {
    if (!validate()) return;
    setLoading(true);
    setError("");
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setDone(true);
      setTimeout(() => onComplete?.(), 1500);
    } catch (err) {
      setError(err.message || "Could not reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleReset();
  }

  return (
    <div
      onKeyDown={handleKeyDown}
      style={{
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

        <div style={{ padding:40, position:"relative" }}>
          {done ? (
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:56, marginBottom:16 }}>✅</div>
              <h2 style={{ fontSize:26, fontStyle:"italic", color:C.ocean, marginBottom:10 }}>
                Password updated.
              </h2>
              <p style={{ fontSize:14, color:C.gray4 }}>Taking you to your map...</p>
            </div>
          ) : (
            <>
              <div style={{ display:"flex", justifyContent:"center", marginBottom:28 }}>
                <RhomieLogo size={52} />
              </div>
              <h2 style={{ fontSize:26, fontStyle:"italic", color:C.ocean, marginBottom:6, textAlign:"center" }}>
                Set a new password
              </h2>
              <p style={{ fontSize:14, color:C.gray4, marginBottom:28, textAlign:"center" }}>
                Choose a new password for your account.
              </p>
              <Alert message={error} />
              <Input
                label="New password"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="At least 6 characters"
                icon="🔒"
                error={fieldErrors.password}
              />
              <Input
                label="Confirm password"
                type="password"
                value={confirm}
                onChange={setConfirm}
                placeholder="Re-enter your password"
                icon="🔒"
                error={fieldErrors.confirm}
              />
              <Btn onClick={handleReset} loading={loading}>Update password</Btn>
            </>
          )}
        </div>

        <div style={{ height:4, background:`linear-gradient(90deg, ${C.mint}, ${C.sky})`, position:"absolute", bottom:0, left:0, right:0 }}/>
      </div>
    </div>
  );
}
