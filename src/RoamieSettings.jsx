import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";

const C = {
  mint:"#3dd6a3",sky:"#5bbde0",ocean:"#1a3a4a",frost:"#e8f9f4",mist:"#d6f0ff",
  white:"#ffffff",gray1:"#f4f7f9",gray2:"#e2eaed",gray3:"#9ab3be",gray4:"#4a6572",
  alert:"#e05555",warning:"#f5c842",success:"#27ae60",peach:"#f0845a",
};

const AVATAR_COLORS = [
  { bg:"#e8f9f4", text:C.ocean },
  { bg:C.mist,   text:"#185fa5" },
  { bg:"#fff3ec", text:"#712b13" },
  { bg:"#eeedfe", text:"#3c3489" },
  { bg:"#fef3c7", text:"#92400e" },
  { bg:"#fce7f3", text:"#9d174d" },
];

const LABEL_PRESETS = ["My Crew","My People","My Squad","Travel Fam","Road Crew","My Team","Gang Gang","The Fam","Ride or Dies"];

const PIN_CATEGORIES = [
  { key:"hospital", label:"Hospital",    icon:"🏥", default:"#e05555" },
  { key:"embassy",  label:"Embassy",     icon:"🏛️", default:"#5bbde0" },
  { key:"police",   label:"Police",      icon:"🚔", default:"#3d5afe" },
  { key:"church",   label:"Church",      icon:"⛪", default:"#27ae60" },
  { key:"ev",       label:"EV Charger",  icon:"⚡", default:"#3dd6a3" },
  { key:"gas",      label:"Gas Station", icon:"⛽", default:"#f59e0b" },
  { key:"gem",      label:"Hidden Gems", icon:"💎", default:"#f0845a" },
  { key:"team",     label:"Crew Members",icon:"👥", default:"#f5c842" },
];

const COLOR_PALETTE = [
  "#e05555","#f0845a","#f5c842","#27ae60","#3dd6a3",
  "#5bbde0","#3d5afe","#9c27b0","#e91e63","#1a3a4a",
  "#ff6b6b","#ffd93d","#6bcb77","#4d96ff","#c77dff",
];

function Btn({ children, onClick, disabled, loading, variant="primary", small=false, fullWidth=true }) {
  const [hov,setHov]=useState(false);
  const styles={
    primary:{background:disabled||loading?C.gray2:hov?"#2ec994":C.mint,color:disabled||loading?C.gray3:C.ocean},
    secondary:{background:"transparent",color:C.ocean,border:`1.5px solid ${C.gray2}`},
    danger:{background:hov?"#c04040":C.alert,color:C.white},
  };
  return (
    <button onClick={onClick} disabled={disabled||loading}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{width:fullWidth?"100%":"auto",padding:small?"7px 16px":"12px 20px",borderRadius:12,border:"none",fontFamily:"inherit",fontSize:small?12:14,fontWeight:600,cursor:disabled||loading?"not-allowed":"pointer",transition:"all 0.15s",...styles[variant]}}>
      {loading?"Saving...":children}
    </button>
  );
}

function Alert({ message, type="error" }) {
  if(!message) return null;
  const cfg={
    error:{bg:"#fef2f2",color:C.alert,border:"#fecaca",icon:"⚠️"},
    success:{bg:"#f0fdf4",color:C.success,border:"#bbf7d0",icon:"✅"},
  }[type];
  return (
    <div style={{background:cfg.bg,border:`1px solid ${cfg.border}`,borderRadius:10,padding:"10px 14px",marginBottom:14,fontSize:13,color:cfg.color,lineHeight:1.5}}>
      {cfg.icon} {message}
    </div>
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <div style={{padding:"20px 20px 10px"}}>
      <div style={{fontSize:16,fontWeight:600,color:C.ocean,fontFamily:"'DM Serif Display',serif",fontStyle:"italic"}}>{title}</div>
      {subtitle&&<div style={{fontSize:12,color:C.gray4,marginTop:3}}>{subtitle}</div>}
    </div>
  );
}

function Divider() {
  return <div style={{height:8,background:C.gray1,borderTop:`0.5px solid ${C.gray2}`,borderBottom:`0.5px solid ${C.gray2}`}}/>;
}

// ─── Avatar display helper ─────────────────────────────────────────────────
export function Avatar({ url, initials, color, size=40, style={} }) {
  const [imgError, setImgError] = useState(false);
  const showPhoto = url && !imgError;
  return (
    <div style={{
      width:size,height:size,borderRadius:"50%",flexShrink:0,overflow:"hidden",
      background:showPhoto?"transparent":(color?.bg||C.mist),
      display:"flex",alignItems:"center",justifyContent:"center",
      ...style,
    }}>
      {showPhoto ? (
        <img
          src={url}
          alt={initials||"Avatar"}
          onError={()=>setImgError(true)}
          style={{width:"100%",height:"100%",objectFit:"cover"}}
        />
      ) : (
        <span style={{
          fontFamily:"'DM Serif Display',serif",fontStyle:"italic",
          fontSize:size*0.35,fontWeight:600,
          color:color?.text||"#185fa5",
        }}>{initials||"?"}</span>
      )}
    </div>
  );
}

export default function RoamieSettings({ profile, userId, onClose, onSave }) {
  const fileInputRef = useRef(null);
  const [loading,      setLoading]      = useState(false);
  const [uploadLoading,setUploadLoading]= useState(false);
  const [error,        setError]        = useState("");
  const [success,      setSuccess]      = useState("");

  const [firstName,    setFirstName]    = useState(profile?.firstName||"");
  const [lastName,     setLastName]     = useState(profile?.lastName||"");
  const [username,     setUsername]     = useState(profile?.username||"");
  const [groupLabel,   setGroupLabel]   = useState(profile?.groupLabel||"My Crew");
  const [avatarColor,  setAvatarColor]  = useState(profile?.avatarColor||AVATAR_COLORS[0]);
  const [avatarUrl,    setAvatarUrl]    = useState(profile?.avatarUrl||null);
  const [locationPref, setLocationPref] = useState("ask");
  const [activePinKey, setActivePinKey] = useState(null);
  const [pinColors,    setPinColors]    = useState(()=>{
    try { return profile?.pinColors?JSON.parse(profile.pinColors):{} } catch { return {}; }
  });

  const initials=`${firstName?.[0]||""}${lastName?.[0]||""}`.toUpperCase()||"?";

  function getPinColor(key) {
    return pinColors[key]||PIN_CATEGORIES.find(c=>c.key===key)?.default||"#666";
  }

  // ── Handle photo upload ──────────────────────────────────────────────────
  async function handlePhotoSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB.");
      return;
    }

    setUploadLoading(true);
    setError("");

    try {
      const ext = file.name.split(".").pop();
      const path = `${userId}/avatar.${ext}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);

      // Add cache buster so it refreshes immediately
      const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;
      setAvatarUrl(urlWithCacheBust);

      // Save to profile immediately
      await supabase.from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("user_id", userId);

      setSuccess("Photo uploaded!");
      setTimeout(()=>setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Could not upload photo.");
    } finally {
      setUploadLoading(false);
    }
  }

  async function handleRemovePhoto() {
    if (!avatarUrl) return;
    setUploadLoading(true);
    try {
      // Remove from storage
      const path = `${userId}/avatar.jpg`;
      await supabase.storage.from("avatars").remove([path]);
      // Also try png
      await supabase.storage.from("avatars").remove([`${userId}/avatar.png`]);
      await supabase.storage.from("avatars").remove([`${userId}/avatar.jpeg`]);
      await supabase.storage.from("avatars").remove([`${userId}/avatar.webp`]);

      // Clear from profile
      await supabase.from("profiles").update({ avatar_url: null }).eq("user_id", userId);
      setAvatarUrl(null);
      setSuccess("Photo removed.");
      setTimeout(()=>setSuccess(""), 3000);
    } catch (err) {
      setError(err.message||"Could not remove photo.");
    } finally {
      setUploadLoading(false);
    }
  }

  async function handleSave() {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      if (username !== profile?.username) {
        const { data: existing } = await supabase
          .from("profiles").select("id")
          .eq("username", username.toLowerCase())
          .neq("user_id", userId).single();
        if (existing) { setError("That username is already taken."); setLoading(false); return; }
      }

      const { error: updateError } = await supabase.from("profiles").update({
        first_name:   firstName.trim(),
        last_name:    lastName.trim(),
        username:     username.toLowerCase().trim(),
        group_label:  groupLabel,
        avatar_color: JSON.stringify(avatarColor),
        pin_colors:   JSON.stringify(pinColors),
      }).eq("user_id", userId);

      if (updateError) throw updateError;

      setSuccess("Settings saved!");
      setTimeout(()=>setSuccess(""), 3000);

      onSave?.({
        firstName:firstName.trim(),
        lastName:lastName.trim(),
        username:username.toLowerCase().trim(),
        groupLabel,avatarColor,pinColors,
        avatarUrl,
      });
    } catch (err) {
      setError(err.message||"Could not save settings.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.reload();
  }

  return (
    <div style={{position:"fixed",inset:0,zIndex:100,background:C.white,display:"flex",flexDirection:"column",fontFamily:"'DM Serif Display','Georgia',serif",overflowY:"auto"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&display=swap');*{box-sizing:border-box;}input{font-family:'DM Serif Display',Georgia,serif!important;}`}</style>

      {/* Header */}
      <div style={{position:"sticky",top:0,zIndex:10,background:C.white,borderBottom:`1px solid ${C.gray2}`,padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <button onClick={onClose} style={{background:"none",border:"none",fontSize:13,color:C.gray4,cursor:"pointer",fontFamily:"inherit"}}>← Back</button>
        <span style={{fontSize:16,fontWeight:600,color:C.ocean,fontStyle:"italic"}}>Settings</span>
        <Btn onClick={handleSave} loading={loading} small fullWidth={false}>Save</Btn>
      </div>

      <div style={{flex:1,paddingBottom:40}}>
        {error&&<div style={{padding:"0 20px"}}><Alert message={error}/></div>}
        {success&&<div style={{padding:"0 20px"}}><Alert message={success} type="success"/></div>}

        {/* ── PROFILE PHOTO ── */}
        <SectionHeader title="Profile photo" subtitle="Upload a photo so your crew can recognize you"/>
        <div style={{padding:"0 20px 20px",display:"flex",alignItems:"center",gap:16}}>

          {/* Avatar preview */}
          <div style={{position:"relative",flexShrink:0}}>
            <Avatar
              url={avatarUrl}
              initials={initials}
              color={avatarColor}
              size={80}
              style={{border:`3px solid ${C.mint}`,boxShadow:`0 0 0 5px ${C.mint}22`}}
            />
            {uploadLoading&&(
              <div style={{position:"absolute",inset:0,borderRadius:"50%",background:"rgba(255,255,255,0.8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>
                ⏳
              </div>
            )}
          </div>

          {/* Upload controls */}
          <div style={{flex:1,display:"flex",flexDirection:"column",gap:8}}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoSelect}
              style={{display:"none"}}
            />
            <Btn
              onClick={()=>fileInputRef.current?.click()}
              loading={uploadLoading}
              small
            >
              📷 {avatarUrl?"Change photo":"Upload photo"}
            </Btn>
            {avatarUrl&&(
              <Btn onClick={handleRemovePhoto} variant="secondary" small>
                🗑️ Remove photo
              </Btn>
            )}
            <div style={{fontSize:11,color:C.gray3}}>JPG, PNG or WebP · Max 5MB</div>
          </div>
        </div>

        {/* Avatar color (fallback when no photo) */}
        {!avatarUrl&&(
          <div style={{padding:"0 20px 16px"}}>
            <div style={{fontSize:11,fontWeight:600,color:C.gray4,textTransform:"uppercase",letterSpacing:"0.3px",marginBottom:8}}>
              Background color (shown when no photo)
            </div>
            <div style={{display:"flex",gap:8}}>
              {AVATAR_COLORS.map((c,i)=>(
                <div key={i} onClick={()=>setAvatarColor(c)} style={{
                  width:26,height:26,borderRadius:"50%",background:c.bg,
                  border:avatarColor===c?`2.5px solid ${C.ocean}`:`1.5px solid ${C.gray2}`,
                  cursor:"pointer",
                  transform:avatarColor===c?"scale(1.2)":"scale(1)",
                  transition:"all 0.15s",
                }}/>
              ))}
            </div>
          </div>
        )}

        <Divider/>

        {/* ── PROFILE INFO ── */}
        <SectionHeader title="Your profile" subtitle="How your crew sees you"/>
        <div style={{padding:"0 20px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
          {[["First name",firstName,setFirstName,"First"],["Last name",lastName,setLastName,"Last"]].map(([label,val,set,ph])=>(
            <div key={label}>
              <label style={{display:"block",fontSize:11,fontWeight:600,color:C.ocean,marginBottom:5,textTransform:"uppercase",letterSpacing:"0.3px"}}>{label}</label>
              <input value={val} onChange={e=>set(e.target.value)} placeholder={ph}
                style={{width:"100%",padding:"10px 12px",borderRadius:10,border:`1.5px solid ${C.gray2}`,fontSize:14,color:C.ocean,outline:"none",background:C.frost}}/>
            </div>
          ))}
        </div>
        <div style={{padding:"0 20px",marginBottom:4}}>
          <label style={{display:"block",fontSize:11,fontWeight:600,color:C.ocean,marginBottom:5,textTransform:"uppercase",letterSpacing:"0.3px"}}>Username</label>
          <div style={{display:"flex",alignItems:"center",border:`1.5px solid ${C.gray2}`,borderRadius:10,background:C.frost,overflow:"hidden"}}>
            <span style={{padding:"10px 10px 10px 14px",fontSize:14,color:C.gray3}}>@</span>
            <input value={username} onChange={e=>setUsername(e.target.value.replace(/\s/g,"").toLowerCase())}
              placeholder="yourname"
              style={{flex:1,padding:"10px 12px 10px 0",border:"none",fontSize:14,color:C.ocean,outline:"none",background:"transparent"}}/>
          </div>
        </div>

        <Divider/>

        {/* ── CREW LABEL ── */}
        <SectionHeader title="Your crew name" subtitle="What do you call the people you travel with?"/>
        <div style={{padding:"0 20px 16px"}}>
          <input value={groupLabel} onChange={e=>setGroupLabel(e.target.value)}
            placeholder="e.g. My Crew, My People..."
            style={{width:"100%",padding:"11px 14px",borderRadius:10,border:`1.5px solid ${C.gray2}`,fontSize:15,color:C.ocean,outline:"none",background:C.frost,marginBottom:10}}/>
          <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
            {LABEL_PRESETS.map(p=>(
              <div key={p} onClick={()=>setGroupLabel(p)} style={{
                padding:"6px 13px",borderRadius:20,cursor:"pointer",fontSize:12,
                border:`1.5px solid ${groupLabel===p?C.mint:C.gray2}`,
                background:groupLabel===p?C.frost:C.white,
                color:groupLabel===p?C.ocean:C.gray4,
                fontWeight:groupLabel===p?600:400,
                transition:"all 0.15s",
              }}>{p}</div>
            ))}
          </div>
        </div>

        <Divider/>

        {/* ── PIN COLORS ── */}
        <SectionHeader title="Pin colors" subtitle="Customize how each category appears on your map"/>
        <div style={{padding:"0 20px 8px"}}>
          {PIN_CATEGORIES.map(cat=>(
            <div key={cat.key}>
              <div onClick={()=>setActivePinKey(activePinKey===cat.key?null:cat.key)}
                style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 0",borderBottom:`0.5px solid ${C.gray2}`,cursor:"pointer"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:20}}>{cat.icon}</span>
                  <span style={{fontSize:14,color:C.ocean,fontWeight:500}}>{cat.label}</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:22,height:22,borderRadius:"50%",background:getPinColor(cat.key),border:`2px solid ${C.white}`,boxShadow:`0 0 0 1.5px ${C.gray2}`}}/>
                  <span style={{fontSize:12,color:C.gray3}}>{activePinKey===cat.key?"▲":"▼"}</span>
                </div>
              </div>
              {activePinKey===cat.key&&(
                <div style={{padding:"12px 0 8px",display:"flex",flexWrap:"wrap",gap:8}}>
                  {COLOR_PALETTE.map(color=>(
                    <div key={color} onClick={()=>setPinColors(prev=>({...prev,[cat.key]:color}))} style={{
                      width:30,height:30,borderRadius:"50%",background:color,cursor:"pointer",
                      border:getPinColor(cat.key)===color?`3px solid ${C.ocean}`:`2px solid ${C.white}`,
                      boxShadow:`0 0 0 1px ${C.gray2}`,
                      transform:getPinColor(cat.key)===color?"scale(1.2)":"scale(1)",
                      transition:"all 0.15s",
                    }}/>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <Divider/>

        {/* ── LOCATION PREFS ── */}
        <SectionHeader title="Location sharing" subtitle="Control when Roamie shares your location"/>
        <div style={{padding:"0 20px 16px",display:"flex",flexDirection:"column",gap:8}}>
          {[
            {key:"ask",    label:"Ask every time",   desc:"Roamie asks before sharing your location",    icon:"❓"},
            {key:"always", label:"Share when active", desc:"Share while the app is open and toggle is on", icon:"📍"},
            {key:"never",  label:"Never share",       desc:"Your location is never visible to anyone",     icon:"🔒"},
          ].map(opt=>(
            <div key={opt.key} onClick={()=>setLocationPref(opt.key)} style={{
              display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:12,cursor:"pointer",
              border:`1.5px solid ${locationPref===opt.key?C.mint:C.gray2}`,
              background:locationPref===opt.key?C.frost:C.white,transition:"all 0.15s",
            }}>
              <span style={{fontSize:20}}>{opt.icon}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:600,color:C.ocean}}>{opt.label}</div>
                <div style={{fontSize:11,color:C.gray4,marginTop:2}}>{opt.desc}</div>
              </div>
              <div style={{width:18,height:18,borderRadius:"50%",flexShrink:0,border:`2px solid ${locationPref===opt.key?C.mint:C.gray2}`,background:locationPref===opt.key?C.mint:"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>
                {locationPref===opt.key&&<div style={{width:6,height:6,borderRadius:"50%",background:C.white}}/>}
              </div>
            </div>
          ))}
        </div>

        <Divider/>

        <div style={{padding:"20px"}}>
          <Btn onClick={handleSave} loading={loading}>Save all changes</Btn>
        </div>

        <Divider/>

        <div style={{padding:"20px"}}>
          <Btn onClick={handleSignOut} variant="danger">Sign out</Btn>
        </div>
      </div>
    </div>
  );
}