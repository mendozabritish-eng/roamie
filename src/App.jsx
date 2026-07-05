import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import RhomieOnboarding from "./RhomieOnboarding";
import RhomieSignIn, { ResetPasswordScreen } from "./RhomieSignIn";
import RhomieMap from "./RhomieMap";
import { AcceptInviteScreen } from "./RhomieInvite";

export default function App() {
  const [screen,  setScreen]  = useState("loading");
  const [profile, setProfile] = useState(null);
  const [userId,  setUserId]  = useState(null);
  const [inviteCode, setInviteCode] = useState(null);

  async function enterApp(session, code) {
    setUserId(session.user.id);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", session.user.id)
      .single();
    if (data) {
      setProfile({
        firstName:  data.first_name,
        lastName:   data.last_name,
        username:   data.username,
        groupLabel: data.group_label || "My Crew",
      });
      // If there's an invite code and user is logged in, show accept screen
      setScreen(code ? "accept-invite" : "map");
    } else {
      setScreen("onboarding");
    }
  }

  useEffect(() => {
    // Check for invite code in URL
    const params = new URLSearchParams(window.location.search);
    const code = params.get("invite");
    if (code) setInviteCode(code);

    // Supabase parses the recovery token out of the URL hash as soon as the
    // client initializes (before this effect runs), so the PASSWORD_RECOVERY
    // event can fire and be missed. Detect it directly from the hash instead.
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const isRecovery = hashParams.get("type") === "recovery";
    if (isRecovery) setScreen("recovery");

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isRecovery) return;
      if (session?.user) {
        enterApp(session, code);
      } else {
        // Not logged in — if invite link, show onboarding first then accept
        setScreen(code ? "onboarding" : "signin");
      }
    });

    // Fallback for cases where the recovery event fires after this subscribes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setScreen("recovery");
    });
    return () => subscription.unsubscribe();
  }, []);

  if (screen === "loading") return (
    <div style={{height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#e8f9f4",fontFamily:"'DM Serif Display',serif"}}>
      <div style={{textAlign:"center",lineHeight:0.88,fontStyle:"italic",fontSize:42,color:"#1a3a4a",letterSpacing:"-1px"}}>
        <div>rho</div><div>mie<span style={{color:"#3dd6a3"}}>.</span></div>
      </div>
    </div>
  );

  if (screen === "recovery") return (
    <ResetPasswordScreen
      onComplete={() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) enterApp(session, inviteCode);
        });
      }}
    />
  );

  if (screen === "signin") return (
    <RhomieSignIn
      onComplete={(p) => {
        setProfile(p);
        setScreen(inviteCode ? "accept-invite" : "map");
      }}
      onCreateAccount={() => setScreen("onboarding")}
    />
  );

  if (screen === "onboarding") return (
    <RhomieOnboarding
      onComplete={(p) => {
        setProfile(p);
        setScreen(inviteCode ? "accept-invite" : "map");
      }}
      onSignIn={() => setScreen("signin")}
    />
  );

  if (screen === "accept-invite" && inviteCode) return (
    <AcceptInviteScreen
      code={inviteCode}
      userId={userId}
      onComplete={() => {
        // Clear invite from URL
        window.history.replaceState({}, "", "/");
        setScreen("map");
      }}
    />
  );

  return <RhomieMap profile={profile} />;
}
