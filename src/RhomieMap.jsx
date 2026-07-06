import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabaseClient";
import { InviteSheet, useRealtimeLocation, LocationToggle } from "./RhomieInvite";
import RhomieSettings, { Avatar } from "./RhomieSettings";
import { CheckInButton, CheckInSheet, useCheckIn, timeAgo } from "./RhomieCheckIn";
import { SOSButton, SOSSheet, IncomingSOSModal, useOwnSOS, useCrewSOS } from "./RhomieSOSAlert";

const C = {
  mint:"#3dd6a3",sky:"#5bbde0",ocean:"#1a3a4a",frost:"#e8f9f4",mist:"#d6f0ff",
  white:"#ffffff",gray1:"#f4f7f9",gray2:"#e2eaed",gray3:"#9ab3be",gray4:"#4a6572",
  alert:"#e05555",warning:"#f5c842",success:"#27ae60",peach:"#f0845a",
};

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const DEFAULT_PIN_COLORS = {
  hospital:"#e05555",embassy:"#5bbde0",police:"#3d5afe",
  church:"#27ae60",ev:"#3dd6a3",gas:"#f59e0b",gem:"#f0845a",team:"#f5c842",news:"#ff6b6b",
};

const PLACE_TYPES = {
  hospital:{ label:"Hospital",   icon:"🏥", query:"hospital" },
  embassy: { label:"Embassy",    icon:"🏛️", query:"embassy" },
  police:  { label:"Police",     icon:"🚔", query:"police station" },
  church:  { label:"Church",     icon:"⛪", query:"church" },
  ev:      { label:"EV Charger",  icon:"⚡", query:"electric vehicle charging station" },
  gas:     { label:"Gas Station", icon:"⛽", query:"gas station" },
  gem:     { label:"Hidden Gems", icon:"💎", query:"tourist attraction" },
};

function loadGoogleMaps() {
  return new Promise((resolve, reject) => {
    if (window.google?.maps) { resolve(window.google.maps); return; }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.onload = () => resolve(window.google.maps);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

const EVENT_KEYWORDS = /\b(parade|festival|carnival|concert|fair|celebration|fireworks)\b/i;
const ALERT_KEYWORDS = /\b(warning|storm|hurricane|earthquake|evacuat|closure|closed|emergency|outbreak|attack|riot|unrest|shooting|curfew|disaster|wildfire|flood|terror|hostage)\b/i;
const CAUTION_KEYWORDS = /\b(watch|advisory|delay|protest|strike|shortage|crowd)\b/i;

function classifyNews(title="") {
  if (EVENT_KEYWORDS.test(title)) return "event";
  if (ALERT_KEYWORDS.test(title)) return "alert";
  if (CAUTION_KEYWORDS.test(title)) return "warning";
  return "info";
}

function FilterPill({ label, icon, active, color, onClick }) {
  return (
    <button onClick={onClick} style={{
      display:"flex",alignItems:"center",gap:5,padding:"7px 13px",borderRadius:20,
      border:`1.5px solid ${active?color:C.gray2}`,
      background:active?color+"18":C.white,color:active?color:C.gray4,
      fontSize:12,fontWeight:active?600:400,cursor:"pointer",whiteSpace:"nowrap",
      fontFamily:"inherit",transition:"all 0.15s",
      boxShadow:active?`0 2px 8px ${color}33`:"none",
    }}><span>{icon}</span>{label}</button>
  );
}

function BottomSheet({ title, children, onClose, accent=C.mint }) {
  return (
    <div style={{
      position:"absolute",bottom:0,left:0,right:0,background:C.white,
      borderRadius:"20px 20px 0 0",boxShadow:"0 -4px 30px rgba(26,58,74,0.15)",
      maxHeight:"65vh",overflow:"hidden",display:"flex",flexDirection:"column",
      zIndex:20,animation:"slideUp 0.25s ease",
    }}>
      <style>{`@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
      <div style={{padding:"16px 20px 12px",borderBottom:`1px solid ${C.gray2}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:3,height:18,background:accent,borderRadius:2}}/>
          <span style={{fontSize:15,fontWeight:600,color:C.ocean,fontFamily:"'DM Serif Display',serif",fontStyle:"italic"}}>{title}</span>
        </div>
        <button onClick={onClose} style={{background:C.gray1,border:"none",borderRadius:"50%",width:28,height:28,cursor:"pointer",fontSize:14,color:C.gray4}}>✕</button>
      </div>
      <div style={{overflowY:"auto",flex:1}}>{children}</div>
    </div>
  );
}

function PlaceCard({ place, color, icon, onNavigate }) {
  return (
    <div style={{padding:"12px 20px",borderBottom:`0.5px solid ${C.gray2}`,display:"flex",alignItems:"center",gap:12}}>
      <div style={{width:40,height:40,borderRadius:12,flexShrink:0,background:color+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{icon}</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:13,fontWeight:600,color:C.ocean,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{place.name}</div>
        <div style={{fontSize:11,color:C.gray4,marginTop:2}}>{place.vicinity||place.formatted_address||"Nearby"}</div>
      </div>
      <button onClick={()=>onNavigate(place)} style={{background:color,border:"none",borderRadius:10,padding:"6px 12px",fontSize:11,fontWeight:600,color:C.white,cursor:"pointer",flexShrink:0,fontFamily:"inherit"}}>Go</button>
    </div>
  );
}

function NewsCard({ item }) {
  const cfg={alert:{bg:"#fef2f2",color:C.alert,icon:"🚨"},warning:{bg:"#fffbeb",color:C.warning,icon:"⚠️"},event:{bg:C.frost,color:C.mint,icon:"🎉"},info:{bg:C.frost,color:C.sky,icon:"ℹ️"}}[item.severity]||{bg:C.frost,color:C.sky,icon:"📰"};
  return (
    <div style={{padding:"12px 20px",borderBottom:`0.5px solid ${C.gray2}`}}>
      <div style={{display:"flex",gap:8,alignItems:"flex-start"}}>
        <span style={{fontSize:16,flexShrink:0,marginTop:1}}>{cfg.icon}</span>
        <div>
          <div style={{fontSize:13,fontWeight:500,color:C.ocean,lineHeight:1.4}}>{item.title}</div>
          <div style={{fontSize:11,color:C.gray4,marginTop:4}}>{item.source} · {item.time}</div>
        </div>
      </div>
    </div>
  );
}

function TeamCard({ member, onLocate, lastCheckIn }) {
  return (
    <div style={{padding:"12px 20px",borderBottom:`0.5px solid ${C.gray2}`,display:"flex",alignItems:"center",gap:12}}>
      <Avatar url={member.avatarUrl} initials={member.initials} color={member.avatarColor||{bg:C.mist,text:"#185fa5"}} size={40} style={{border:`2px solid ${member.avatarUrl?C.mint:C.sky}`,flexShrink:0}}/>
      <div style={{flex:1}}>
        <div style={{fontSize:13,fontWeight:600,color:C.ocean}}>{member.name}</div>
        <div style={{fontSize:11,color:C.gray4,marginTop:2}}>
          {member.lat?"📍 Live location active":`📍 ${member.location||"Location unknown"}`} · {member.lastSeen||""}
        </div>
        {lastCheckIn&&(
          <div style={{fontSize:11,color:"#16a34a",marginTop:3,display:"flex",alignItems:"center",gap:3}}>
            <span>✓</span>
            <span>{lastCheckIn.message||"Checked in"} · {timeAgo(lastCheckIn.created_at)}</span>
          </div>
        )}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        {member.lat&&(
          <button onClick={()=>onLocate(member)} style={{background:C.mist,border:"none",borderRadius:8,padding:"5px 10px",fontSize:11,color:"#185fa5",cursor:"pointer",fontWeight:600}}>Find</button>
        )}
        <div style={{width:8,height:8,borderRadius:"50%",background:member.online?C.success:C.gray3,flexShrink:0}}/>
      </div>
    </div>
  );
}

export default function RhomieMap({ profile: initialProfile }) {
  const mapRef=useRef(null),mapInstance=useRef(null),markersRef=useRef([]),infoWindowRef=useRef(null);
  const [mapsLoaded,setMapsLoaded]=useState(false);
  const [mapObj,setMapObj]=useState(null);
  const [userLocation,setUserLocation]=useState(null);
  const [activeFilters,setActiveFilters]=useState(["hospital","police"]);
  const [activeSheet,setActiveSheet]=useState(null);
  const [places,setPlaces]=useState({});
  const [loading,setLoading]=useState(false);
  const [pinColors,setPinColors]=useState(DEFAULT_PIN_COLORS);
  const [userId,setUserId]=useState(null);
  const [crewMembers,setCrewMembers]=useState([]);
  const [crewLocations,setCrewLocations]=useState({});
  const [crewCheckIns,setCrewCheckIns]=useState({});
  const [showSettings,setShowSettings]=useState(false);
  const [newsItems,setNewsItems]=useState([]);
  const [newsLoading,setNewsLoading]=useState(false);
  const [newsError,setNewsError]=useState("");
  const [newsQuery,setNewsQuery]=useState("");
  const [searchedLocation,setSearchedLocation]=useState(null);
  const [newsSuggestions,setNewsSuggestions]=useState([]);
  const newsAutocompleteRef=useRef(null);

  // Profile state — can be updated from settings
  const [profile,setProfile]=useState(initialProfile);
  const groupLabel = profile?.groupLabel || "My Crew";

  const { lastCheckIn } = useCheckIn(userId);
  const { activeSOS, sendSOS, cancelSOS } = useOwnSOS(userId);
  const { incomingSOSes, dismissSOS } = useCrewSOS(userId, crewMembers);

  // Get current user
  useEffect(()=>{
    supabase.auth.getUser().then(({data:{user}})=>{ if(user) setUserId(user.id); });
  },[]);

  // Fetch crew members
  useEffect(()=>{
    if(!userId) return;
    async function fetchCrew() {
      const { data: members, error: membersError } = await supabase
        .from("crew_members")
        .select("member_id")
        .eq("owner_id", userId);
      if(membersError || !members?.length) {
        if(membersError) console.error("fetchCrew (crew_members):", membersError);
        setCrewMembers([]);
        return;
      }

      const ids = members.map(m=>m.member_id);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name, username, avatar_url, avatar_color")
        .in("user_id", ids);
      if(profilesError) console.error("fetchCrew (profiles):", profilesError);

      const byId = Object.fromEntries((profiles||[]).map(p=>[p.user_id, p]));
      setCrewMembers(members.map(m=>{
        const p = byId[m.member_id];
        return {
          id:m.member_id,
          name:`${p?.first_name||""} ${p?.last_name||""}`.trim()||p?.username||"Crew member",
          initials:`${p?.first_name?.[0]||""}${p?.last_name?.[0]||""}`.toUpperCase()||"?",
          avatarUrl:p?.avatar_url||null,
          avatarColor:p?.avatar_color?JSON.parse(p.avatar_color):null,
          online:false,
        };
      }));
    }
    fetchCrew();
  },[userId]);

  // Fetch crew check-ins + subscribe to new ones
  useEffect(()=>{
    if(!userId||!crewMembers.length) return;
    const ids=crewMembers.map(m=>m.id);

    supabase.from("check_ins").select("user_id,message,created_at")
      .in("user_id",ids).order("created_at",{ascending:false}).limit(100)
      .then(({data,error})=>{
        if(error) console.error("crew check_ins fetch:",error);
        if(!data) return;
        const latest={};
        data.forEach(r=>{ if(!latest[r.user_id]) latest[r.user_id]=r; });
        setCrewCheckIns(latest);
      });

    const channel=supabase.channel("crew-check-ins")
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"check_ins"},(payload)=>{
        const{user_id}=payload.new;
        if(crewMembers.some(m=>m.id===user_id))
          setCrewCheckIns(prev=>({...prev,[user_id]:payload.new}));
      }).subscribe();
    return()=>{ supabase.removeChannel(channel); };
  },[userId,crewMembers]);

  // Subscribe to crew live locations + fetch initial state
  useEffect(()=>{
    if(!userId||!crewMembers.length) return;

    // Load any locations already being broadcast before we subscribed
    const ids=crewMembers.map(m=>m.id);
    supabase.from("locations").select("user_id,lat,lng,updated_at").in("user_id",ids)
      .then(({data,error})=>{
        if(error) console.error("crew locations fetch:",error);
        if(!data) return;
        const locs={};
        data.forEach(r=>{ locs[r.user_id]={lat:r.lat,lng:r.lng,updated_at:r.updated_at}; });
        setCrewLocations(locs);
      });

    const channel=supabase
      .channel("live-locations")
      .on("postgres_changes",{event:"*",schema:"public",table:"locations"},(payload)=>{
        if(payload.eventType==="DELETE"){
          const uid=payload.old?.user_id;
          if(uid) setCrewLocations(prev=>{ const n={...prev}; delete n[uid]; return n; });
          return;
        }
        const{user_id,lat,lng}=payload.new||{};
        if(!user_id||user_id===userId) return;
        if(!crewMembers.some(m=>m.id===user_id)) return;
        setCrewLocations(prev=>({...prev,[user_id]:{lat,lng,updated_at:payload.new.updated_at}}));
      })
      .subscribe();
    return()=>{ supabase.removeChannel(channel); };
  },[userId,crewMembers]);

  const { sharing, startSharing, stopSharing } = useRealtimeLocation({
    userId, mapInstance:mapObj, crewMembers, pinColors,
  });

  useEffect(()=>{
    if(profile?.locationPref==="always"&&userId&&mapObj&&!sharing){
      startSharing();
    }
  },[profile?.locationPref,userId,mapObj]);

  useEffect(()=>{
    if(activeSheet!=="news") return;
    setNewsLoading(true);
    setNewsError("");
    const params=searchedLocation
      ? `?q=${encodeURIComponent(searchedLocation)}`
      : userLocation?`?lat=${userLocation.lat}&lng=${userLocation.lng}`:"";
    fetch(`/api/news${params}`)
      .then(r=>r.json())
      .then(data=>{
        if(data.error){ setNewsError(data.error); setNewsItems([]); return; }
        setNewsItems(data.articles||[]);
      })
      .catch(err=>{ console.error("news fetch failed:",err); setNewsError("Could not load news right now."); })
      .finally(()=>setNewsLoading(false));
  },[activeSheet,userLocation,searchedLocation]);

  function searchNews() {
    const term=newsQuery.trim();
    if(!term) return;
    setNewsSuggestions([]);
    setSearchedLocation(term);
  }

  function clearNewsSearch() {
    setNewsQuery("");
    setSearchedLocation(null);
    setNewsSuggestions([]);
  }

  function selectNewsSuggestion(description) {
    setNewsQuery(description);
    setNewsSuggestions([]);
    setSearchedLocation(description);
  }

  useEffect(()=>{
    const term=newsQuery.trim();
    if(term.length<2||!window.google?.maps?.places){
      setNewsSuggestions([]);
      return;
    }
    const timer=setTimeout(()=>{
      if(!newsAutocompleteRef.current){
        newsAutocompleteRef.current=new window.google.maps.places.AutocompleteService();
      }
      newsAutocompleteRef.current.getPlacePredictions(
        { input:term },
        (predictions,status)=>{
          if(status===window.google.maps.places.PlacesServiceStatus.OK&&predictions){
            setNewsSuggestions(predictions);
          } else {
            setNewsSuggestions([]);
          }
        }
      );
    },300);
    return ()=>clearTimeout(timer);
  },[newsQuery]);

  useEffect(()=>{ loadGoogleMaps().then(()=>setMapsLoaded(true)).catch(console.error); },[]);

  useEffect(()=>{
    if(!mapsLoaded||!mapRef.current) return;
    navigator.geolocation.getCurrentPosition(
      pos=>{ const loc={lat:pos.coords.latitude,lng:pos.coords.longitude}; setUserLocation(loc); initMap(loc); },
      ()=>{ const loc={lat:40.7128,lng:-74.006}; setUserLocation(loc); initMap(loc); }
    );
  },[mapsLoaded]);

  function initMap(center) {
    const map=new window.google.maps.Map(mapRef.current,{
      center,zoom:14,disableDefaultUI:true,zoomControl:true,
      styles:[
        {featureType:"all",elementType:"geometry",stylers:[{saturation:-20}]},
        {featureType:"water",elementType:"geometry",stylers:[{color:"#d6f0ff"}]},
        {featureType:"road",elementType:"geometry",stylers:[{color:"#ffffff"}]},
        {featureType:"road",elementType:"geometry.stroke",stylers:[{color:"#e2eaed"}]},
        {featureType:"landscape",elementType:"geometry",stylers:[{color:"#f4f7f9"}]},
        {featureType:"poi.park",elementType:"geometry",stylers:[{color:"#e8f9f4"}]},
        {featureType:"transit",stylers:[{visibility:"off"}]},
        {featureType:"poi",stylers:[{visibility:"off"}]},
      ],
    });
    new window.google.maps.Marker({position:center,map,title:"You are here",zIndex:999,
      icon:{path:window.google.maps.SymbolPath.CIRCLE,scale:10,fillColor:C.mint,fillOpacity:1,strokeColor:C.white,strokeWeight:3}});
    new window.google.maps.Circle({map,center,radius:150,fillColor:C.mint,fillOpacity:0.08,strokeColor:C.mint,strokeOpacity:0.3,strokeWeight:1});
    mapInstance.current=map;
    setMapObj(map);
    infoWindowRef.current=new window.google.maps.InfoWindow();
    activeFilters.forEach(f=>searchNearby(f,map,center));
  }

  const searchNearby=useCallback((filterKey,map,location)=>{
    if(!window.google?.maps||!map) return;
    const cfg=PLACE_TYPES[filterKey]; if(!cfg) return;
    const service=new window.google.maps.places.PlacesService(map);
    setLoading(true);
    service.nearbySearch({location,radius:5000,keyword:cfg.query},(results,status)=>{
      setLoading(false);
      if(status!==window.google.maps.places.PlacesServiceStatus.OK||!results) return;
      const top=results.slice(0,8);
      setPlaces(prev=>({...prev,[filterKey]:top}));
      top.forEach(place=>{
        if(!place.geometry?.location) return;
        const color=pinColors[filterKey]||"#666";
        const marker=new window.google.maps.Marker({
          position:place.geometry.location,map,title:place.name,
          icon:{path:"M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
            fillColor:color,fillOpacity:1,strokeColor:C.white,strokeWeight:1.5,scale:1.4,
            anchor:new window.google.maps.Point(12,22)},
        });
        marker.addListener("click",()=>{
          infoWindowRef.current.setContent(`<div style="font-family:'DM Serif Display',serif;padding:4px 2px;min-width:160px;"><div style="font-weight:600;font-size:14px;color:${C.ocean};margin-bottom:2px;">${place.name}</div><div style="font-size:11px;color:${C.gray4};">${place.vicinity||""}</div>${place.rating?`<div style="font-size:11px;color:${C.gray4};margin-top:3px;">⭐ ${place.rating}</div>`:""}</div>`);
          infoWindowRef.current.open(map,marker);
        });
        markersRef.current.push({key:filterKey,marker});
      });
    });
  },[pinColors]);

  function toggleFilter(key) {
    const isActive=activeFilters.includes(key);
    if(isActive){
      markersRef.current.filter(m=>m.key===key).forEach(m=>m.marker.setMap(null));
      markersRef.current=markersRef.current.filter(m=>m.key!==key);
      setActiveFilters(prev=>prev.filter(k=>k!==key));
    } else {
      setActiveFilters(prev=>[...prev,key]);
      if(mapInstance.current&&userLocation) searchNearby(key,mapInstance.current,userLocation);
    }
  }

  function navigateTo(place) {
    if(!place.geometry?.location||!mapInstance.current) return;
    mapInstance.current.panTo(place.geometry.location);
    mapInstance.current.setZoom(17);
    setActiveSheet(null);
  }

  function locateMember(member) {
    const loc=crewLocations[member.id];
    if(!loc||!mapInstance.current) return;
    mapInstance.current.panTo({lat:loc.lat,lng:loc.lng});
    mapInstance.current.setZoom(16);
    setActiveSheet(null);
  }

  const enrichedCrew=crewMembers.map(m=>({
    ...m,...crewLocations[m.id]||{},
    online:!!crewLocations[m.id],
    lastSeen:crewLocations[m.id]?"Live now":"Offline",
  }));

  return (
    <div style={{position:"relative",width:"100%",height:"100vh",overflow:"hidden",fontFamily:"'DM Serif Display','Georgia',serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&display=swap');*{box-sizing:border-box;}::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-thumb{background:${C.gray2};border-radius:2px;}`}</style>

      <div ref={mapRef} style={{width:"100%",height:"100%"}}/>

      {/* TOP BAR */}
      <div style={{position:"absolute",top:0,left:0,right:0,padding:"12px 16px 8px",background:"linear-gradient(to bottom,rgba(255,255,255,0.98) 70%,transparent)",zIndex:10}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
          <div style={{lineHeight:0.88,fontStyle:"italic",fontSize:18,color:C.ocean,letterSpacing:"-0.5px"}}>rho<br/>mie<span style={{color:C.mint}}>.</span></div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {userId&&profile?.locationPref!=="never"&&<LocationToggle sharing={sharing} onStart={startSharing} onStop={stopSharing}/>}
            <button onClick={()=>setShowSettings(true)} style={{
              width:34,height:34,borderRadius:"50%",
              background:C.gray1,border:`1px solid ${C.gray2}`,
              cursor:"pointer",fontSize:16,
              display:"flex",alignItems:"center",justifyContent:"center",
            }}>⚙️</button>
          </div>
        </div>
        <div style={{display:"flex",gap:7,overflowX:"auto",paddingBottom:4}}>
          {Object.entries(PLACE_TYPES).map(([key,cfg])=>(
            <FilterPill key={key} label={cfg.label} icon={cfg.icon} active={activeFilters.includes(key)} color={pinColors[key]||C.mint} onClick={()=>toggleFilter(key)}/>
          ))}
        </div>
      </div>

      {/* CHECK-IN + SOS BUTTONS */}
      <div style={{
        position:"absolute",bottom:88,left:0,right:0,
        display:"flex",justifyContent:"center",alignItems:"center",gap:12,
        zIndex:activeSheet?0:10,
        opacity:activeSheet?0:1,
        pointerEvents:activeSheet?"none":"auto",
        transition:"opacity 0.2s",
      }}>
        {userId&&<CheckInButton lastCheckIn={lastCheckIn} onClick={()=>setActiveSheet("checkin")}/>}
        {userId&&<SOSButton activeSOS={activeSOS} onClick={()=>setActiveSheet("sos")}/>}
      </div>

      {/* BOTTOM NAV */}
      <div style={{position:"absolute",bottom:0,left:0,right:0,zIndex:activeSheet?0:10,opacity:activeSheet?0:1,transition:"opacity 0.2s"}}>
        <div style={{margin:"0 12px 16px",background:C.white,borderRadius:20,boxShadow:"0 4px 24px rgba(26,58,74,0.15)",padding:"8px 12px",display:"flex",justifyContent:"space-around",border:`1px solid ${C.gray2}`}}>
          {[
            {key:"havens",icon:"🛡️",label:"Havens"},
            {key:"ev",icon:"⚡",label:"Charge"},
            {key:"gas",icon:"⛽",label:"Gas"},
            {key:"news",icon:"📰",label:"News"},
            {key:"team",icon:"👥",label:groupLabel},
            {key:"gems",icon:"💎",label:"Gems"},
          ].map(item=>(
            <button key={item.key} onClick={()=>setActiveSheet(item.key)}
              style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,background:"none",border:"none",cursor:"pointer",padding:"4px 8px",borderRadius:12,fontFamily:"inherit",position:"relative"}}
              onMouseEnter={e=>e.currentTarget.style.background=C.gray1}
              onMouseLeave={e=>e.currentTarget.style.background="none"}>
              <span style={{fontSize:22}}>{item.icon}</span>
              <span style={{fontSize:10,color:C.gray4,fontWeight:500,maxWidth:56,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.label}</span>
              {item.key==="team"&&enrichedCrew.filter(m=>m.online).length>0&&(
                <div style={{position:"absolute",top:0,right:4,width:8,height:8,borderRadius:"50%",background:C.success,border:`1.5px solid ${C.white}`}}/>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* SHEETS */}
      {activeSheet==="havens"&&<BottomSheet title="Safe Havens Nearby" accent={C.alert} onClose={()=>setActiveSheet(null)}>
        {["hospital","embassy","police","church"].map(key=>{
          const cfg=PLACE_TYPES[key],list=places[key]||[];
          if(!list.length) return <div key={key} style={{padding:"10px 20px",fontSize:12,color:C.gray3,fontStyle:"italic"}}>{cfg.icon} No {cfg.label.toLowerCase()}s found nearby</div>;
          return list.slice(0,3).map(p=><PlaceCard key={p.place_id} place={p} color={pinColors[key]} icon={cfg.icon} onNavigate={navigateTo}/>);
        })}
      </BottomSheet>}

      {activeSheet==="ev"&&<BottomSheet title="EV Chargers Nearby" accent={C.mint} onClose={()=>setActiveSheet(null)}>
        {(places.ev||[]).length===0
          ?<div style={{padding:"20px",fontSize:13,color:C.gray3,fontStyle:"italic",textAlign:"center"}}>⚡ Searching for EV chargers...</div>
          :(places.ev||[]).map(p=><PlaceCard key={p.place_id} place={p} color={pinColors.ev||C.mint} icon="⚡" onNavigate={navigateTo}/>)}
      </BottomSheet>}

      {activeSheet==="gas"&&<BottomSheet title="Gas Stations Nearby" accent="#f59e0b" onClose={()=>setActiveSheet(null)}>
        {(places.gas||[]).length===0
          ?<div style={{padding:"20px",fontSize:13,color:C.gray3,fontStyle:"italic",textAlign:"center"}}>⛽ Searching for gas stations...</div>
          :(places.gas||[]).map(p=><PlaceCard key={p.place_id} place={p} color={pinColors.gas||"#f59e0b"} icon="⛽" onNavigate={navigateTo}/>)}
      </BottomSheet>}

      {activeSheet==="gems"&&<BottomSheet title="Hidden Gems Nearby" accent={C.peach} onClose={()=>setActiveSheet(null)}>
        {(places.gem||[]).length===0
          ?<div style={{padding:"20px",fontSize:13,color:C.gray3,fontStyle:"italic",textAlign:"center"}}>💎 Searching for hidden gems...</div>
          :(places.gem||[]).map(p=><PlaceCard key={p.place_id} place={p} color={pinColors.gem||C.peach} icon="💎" onNavigate={navigateTo}/>)}
      </BottomSheet>}

      {activeSheet==="news"&&<BottomSheet title="Local News Alerts" accent={C.warning} onClose={()=>setActiveSheet(null)}>
        <div style={{padding:"12px 20px",borderBottom:`1px solid ${C.gray2}`,position:"relative"}}>
          <div style={{display:"flex",gap:8}}>
            <input
              value={newsQuery}
              onChange={e=>setNewsQuery(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Enter") searchNews(); }}
              onBlur={()=>setTimeout(()=>setNewsSuggestions([]),150)}
              placeholder="Search news for a city or country..."
              style={{
                flex:1,border:`1.5px solid ${C.gray2}`,borderRadius:12,
                padding:"9px 12px",fontSize:13,color:C.ocean,
                fontFamily:"inherit",outline:"none",
              }}
            />
            <button onClick={searchNews} style={{
              background:C.warning,border:"none",borderRadius:12,padding:"0 16px",
              fontSize:13,fontWeight:600,color:C.ocean,cursor:"pointer",fontFamily:"inherit",
            }}>Search</button>
          </div>
          {newsSuggestions.length>0&&(
            <div style={{
              position:"absolute",left:20,right:20,top:"100%",marginTop:4,
              background:C.white,border:`1px solid ${C.gray2}`,borderRadius:12,
              boxShadow:"0 8px 24px rgba(26,58,74,0.15)",zIndex:30,overflow:"hidden",
            }}>
              {newsSuggestions.map(s=>(
                <button key={s.place_id} onMouseDown={()=>selectNewsSuggestion(s.description)} style={{
                  display:"block",width:"100%",textAlign:"left",padding:"10px 14px",
                  border:"none",background:"none",cursor:"pointer",fontFamily:"inherit",
                  fontSize:13,color:C.ocean,borderBottom:`0.5px solid ${C.gray1}`,
                }}>📍 {s.description}</button>
              ))}
            </div>
          )}
          {searchedLocation&&(
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:10}}>
              <span style={{fontSize:12,color:C.gray4}}>Showing results for <strong style={{color:C.ocean}}>{searchedLocation}</strong></span>
              <button onClick={clearNewsSearch} style={{background:"none",border:"none",fontSize:12,color:C.sky,cursor:"pointer",fontWeight:600}}>📍 Use my location</button>
            </div>
          )}
        </div>
        {newsLoading&&<div style={{padding:"20px",fontSize:13,color:C.gray3,fontStyle:"italic",textAlign:"center"}}>📰 Loading news...</div>}
        {!newsLoading&&newsError&&<div style={{padding:"20px",fontSize:13,color:C.alert,textAlign:"center"}}>⚠️ {newsError}</div>}
        {!newsLoading&&!newsError&&newsItems.length===0&&<div style={{padding:"20px",fontSize:13,color:C.gray3,fontStyle:"italic",textAlign:"center"}}>{searchedLocation?`No news found for "${searchedLocation}".`:"No news found right now."}</div>}
        {!newsLoading&&!newsError&&newsItems.map(item=>(
          <a key={item.id} href={item.url} target="_blank" rel="noreferrer" style={{textDecoration:"none",display:"block"}}>
            <NewsCard item={{title:item.title,source:item.source,severity:classifyNews(item.title),time:timeAgo(item.publishedAt)}}/>
          </a>
        ))}
        <div style={{padding:"12px 20px",fontSize:11,color:C.gray3,fontStyle:"italic",textAlign:"center"}}>News via GNews</div>
      </BottomSheet>}

      {activeSheet==="team"&&<BottomSheet title={groupLabel} accent={C.sky} onClose={()=>setActiveSheet(null)}>
        {enrichedCrew.length===0?(
          <div style={{padding:"24px 20px",textAlign:"center"}}>
            <div style={{fontSize:32,marginBottom:8}}>👥</div>
            <div style={{fontSize:13,color:C.gray4,marginBottom:4}}>Your {groupLabel.toLowerCase()} is empty.</div>
            <div style={{fontSize:12,color:C.gray3}}>Invite someone to get started.</div>
          </div>
        ):(
          enrichedCrew.map(m=><TeamCard key={m.id} member={m} onLocate={locateMember} lastCheckIn={crewCheckIns[m.id]}/>)
        )}
        <div style={{padding:"12px 20px"}}>
          <button onClick={()=>setActiveSheet("invite")} style={{
            width:"100%",padding:"11px",borderRadius:14,
            border:`1.5px dashed ${C.sky}`,background:C.mist,
            fontSize:13,color:"#185fa5",cursor:"pointer",fontFamily:"inherit",
            display:"flex",alignItems:"center",justifyContent:"center",gap:6,fontWeight:600,
          }}>
            ✉️ Invite someone to your {groupLabel.toLowerCase()}
          </button>
        </div>
      </BottomSheet>}

      {activeSheet==="invite"&&<BottomSheet title={`Invite to ${groupLabel}`} accent={C.sky} onClose={()=>setActiveSheet(null)}>
        {userId&&<InviteSheet groupLabel={groupLabel} userId={userId} onClose={()=>setActiveSheet("team")}/>}
      </BottomSheet>}

      {activeSheet==="checkin"&&<BottomSheet title="I'm safe" accent="#27ae60" onClose={()=>setActiveSheet(null)}>
        <CheckInSheet userId={userId} userLocation={userLocation} onClose={()=>setActiveSheet(null)}/>
      </BottomSheet>}

      {activeSheet==="sos"&&<BottomSheet title={activeSOS?"SOS Active":"Send SOS Alert"} accent={C.alert} onClose={()=>setActiveSheet(null)}>
        <SOSSheet
          userId={userId}
          userLocation={userLocation}
          activeSOS={activeSOS}
          onSend={sendSOS}
          onCancel={cancelSOS}
          onClose={()=>setActiveSheet(null)}
        />
      </BottomSheet>}

      {/* INCOMING SOS — shown over everything */}
      {incomingSOSes.length>0&&(()=>{
        const sos=incomingSOSes[0];
        const member=crewMembers.find(m=>m.id===sos.user_id);
        return <IncomingSOSModal sos={sos} member={member} onDismiss={()=>dismissSOS(sos.id)}/>;
      })()}

      {/* SETTINGS */}
      {showSettings&&(
        <RhomieSettings
          profile={profile}
          userId={userId}
          onClose={()=>setShowSettings(false)}
          onSave={(updated)=>{
            setProfile(prev=>({...prev,...updated}));
            if(updated.pinColors) setPinColors(prev=>({...prev,...updated.pinColors}));
            setShowSettings(false);
          }}
        />
      )}

      {/* LOADING */}
      {!mapsLoaded&&<div style={{position:"absolute",inset:0,background:C.frost,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",zIndex:50,gap:16}}>
        <div style={{lineHeight:0.88,textAlign:"center",fontStyle:"italic",fontSize:36,color:C.ocean,letterSpacing:"-1px"}}><div>rho</div><div>mie<span style={{color:C.mint}}>.</span></div></div>
        <div style={{fontSize:14,color:C.gray4}}>Loading your map...</div>
        <div style={{width:40,height:4,background:C.gray2,borderRadius:2,overflow:"hidden"}}><div style={{width:"40%",height:"100%",background:C.mint,borderRadius:2,animation:"loading 1s ease-in-out infinite alternate"}}/></div>
        <style>{`@keyframes loading{from{transform:translateX(0)}to{transform:translateX(150%)}}`}</style>
      </div>}
    </div>
  );
}