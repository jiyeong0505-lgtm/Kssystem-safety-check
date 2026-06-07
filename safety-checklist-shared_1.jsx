import { useState, useEffect, useCallback } from "react";

// ─── 점검 항목 데이터 ───────────────────────────────────────────
const CATEGORIES = [
  {
    id: "safety", icon: "🔥", color: "#ef4444", bg: "rgba(239,68,68,0.12)",
    title: "안전 / 화재 점검",
    items: [
      { id: "s1", text: "소화기 위치 확인 및 압력 정상 여부", tag: "daily" },
      { id: "s2", text: "비상구 및 피난통로 장애물 없음", tag: "daily" },
      { id: "s3", text: "안전통로(황색선) 내 물건 적재 없음", tag: "daily" },
      { id: "s4", text: "화재감지기 및 경보장치 정상 작동", tag: "weekly" },
      { id: "s5", text: "가연성 물질 지정장소 보관 여부", tag: "daily" },
      { id: "s6", text: "전기배선 피복 손상 및 과부하 없음", tag: "weekly" },
      { id: "s7", text: "위험물 경고 표지판 부착 상태", tag: "monthly" },
    ]
  },
  {
    id: "equip", icon: "⚙️", color: "#3b82f6", bg: "rgba(59,130,246,0.12)",
    title: "설비 / 기계 점검",
    items: [
      { id: "e1", text: "기계 방호장치 (커버, 가드) 설치 및 정상", tag: "daily" },
      { id: "e2", text: "비상정지 버튼 작동 정상 여부", tag: "daily" },
      { id: "e3", text: "기계 오일·유압·냉각수 누설 없음", tag: "daily" },
      { id: "e4", text: "기계 소음·진동 이상 없음", tag: "daily" },
      { id: "e5", text: "설비 점검 태그 / 작업지시서 부착 여부", tag: "weekly" },
      { id: "e6", text: "전동공구 및 수공구 손상 없음", tag: "weekly" },
      { id: "e7", text: "정기 검사 기한 도래 설비 확인", tag: "monthly" },
    ]
  },
  {
    id: "5s", icon: "🧹", color: "#10b981", bg: "rgba(16,185,129,0.12)",
    title: "환경 / 정리정돈 (5S)",
    items: [
      { id: "f1", text: "작업 구역 내 불필요한 물건 없음 (정리)", tag: "daily" },
      { id: "f2", text: "물건 지정위치 보관 및 표식 확인 (정돈)", tag: "daily" },
      { id: "f3", text: "바닥·작업대 청결 상태 (청소)", tag: "daily" },
      { id: "f4", text: "청결 기준 및 유지 규칙 현장 부착 (청결)", tag: "weekly" },
      { id: "f5", text: "5S 습관화 및 표준 준수 여부 (습관화)", tag: "weekly" },
      { id: "f6", text: "폐기물 분리수거 및 처리 적정 여부", tag: "daily" },
    ]
  },
  {
    id: "ppe", icon: "🦺", color: "#f59e0b", bg: "rgba(245,158,11,0.12)",
    title: "작업자 보호구 착용",
    items: [
      { id: "p1", text: "안전모 착용 및 상태 이상 없음", tag: "daily" },
      { id: "p2", text: "안전화 착용 (발등 보호 기준 충족)", tag: "daily" },
      { id: "p3", text: "보호안경 / 안면보호구 착용 (해당 공정)", tag: "daily" },
      { id: "p4", text: "방진·방독 마스크 착용 (해당 공정)", tag: "daily" },
      { id: "p5", text: "내화학·내열 장갑 착용 (해당 공정)", tag: "daily" },
      { id: "p6", text: "보호구 보관함 정리 및 재고 확인", tag: "weekly" },
      { id: "p7", text: "불량·노후 보호구 교체 요청 여부", tag: "monthly" },
    ]
  }
];
const ALL_ITEMS = CATEGORIES.flatMap(c => c.items);
const ADMIN_PASSWORD = "admin1234"; // ← 관리자 비밀번호 (원하는 값으로 바꾸세요)
const STORAGE_KEY = "safety_records_shared";

const DEPT_OPTIONS = [
  "1본부 조립1팀",
  "1본부 조립2팀",
  "1본부 조립3팀(1층)",
  "1본부 조립3팀(2층)",
  "2본부 가공1팀 1파트",
  "2본부 가공1팀 2파트",
  "2본부 가공2팀",
  "2본부 조립팀 조립1파트",
  "2본부 조립팀 조립2파트",
];

// ─── 유틸 ──────────────────────────────────────────────────────
const now = () => new Date().toISOString();
const fmtDate = (iso) => {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,"0")}.${String(d.getDate()).padStart(2,"0")} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
};
const tagLabel = { daily: "일일", weekly: "주간", monthly: "월간" };
const tagColor = { daily: "#60a5fa", weekly: "#fbbf24", monthly: "#c084fc" };
const tagBg   = { daily: "rgba(59,130,246,0.15)", weekly: "rgba(245,158,11,0.15)", monthly: "rgba(168,85,247,0.15)" };

// ─── 스타일 ────────────────────────────────────────────────────
const S = {
  app: { fontFamily:"'Noto Sans KR',sans-serif", background:"#080c18", minHeight:"100vh", color:"#f1f5f9", padding:"0 0 80px" },
  inner: { maxWidth:860, margin:"0 auto", padding:"0 16px" },
  header: { padding:"22px 0 18px", borderBottom:"1px solid #1e2d45", marginBottom:20, display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" },
  logo: { width:42, height:42, borderRadius:10, background:"#f59e0b", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0, boxShadow:"0 0 18px rgba(245,158,11,0.35)" },
  h1: { fontSize:17, fontWeight:700, margin:0 },
  sub: { fontSize:11, color:"#64748b", fontFamily:"monospace", margin:"2px 0 0" },
  tabs: { display:"flex", gap:4, background:"#111827", border:"1px solid #1e2d45", borderRadius:12, padding:4, marginBottom:20 },
  tab: (active) => ({ flex:1, padding:"10px 8px", borderRadius:8, border: active?"1px solid #1e2d45":"none", background: active?"#1a2235":"transparent", color: active?"#f1f5f9":"#64748b", cursor:"pointer", fontFamily:"'Noto Sans KR',sans-serif", fontSize:13, fontWeight:500, transition:"all 0.15s" }),
  infoBar: { background:"#111827", border:"1px solid #1e2d45", borderRadius:12, padding:"14px 16px", marginBottom:16, display:"flex", gap:10, flexWrap:"wrap", alignItems:"flex-end" },
  fieldGroup: { display:"flex", flexDirection:"column", gap:5, flex:1, minWidth:130 },
  label: { fontSize:11, color:"#94a3b8", fontWeight:600, letterSpacing:"0.5px", textTransform:"uppercase" },
  input: { background:"#1a2235", border:"1px solid #1e2d45", borderRadius:8, padding:"9px 12px", color:"#f1f5f9", fontFamily:"'Noto Sans KR',sans-serif", fontSize:13, outline:"none", width:"100%" },
  select: { background:"#1a2235", border:"1px solid #1e2d45", borderRadius:8, padding:"9px 12px", color:"#f1f5f9", fontFamily:"'Noto Sans KR',sans-serif", fontSize:13, outline:"none", width:"100%" },
  summGrid: { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:18 },
  summCard: (color) => ({ background:"#111827", border:"1px solid #1e2d45", borderRadius:12, padding:"14px 10px", textAlign:"center" }),
  summNum: (color) => ({ fontSize:26, fontWeight:900, fontFamily:"monospace", color, lineHeight:1, marginBottom:4 }),
  summLbl: { fontSize:11, color:"#64748b" },
  cat: { background:"#111827", border:"1px solid #1e2d45", borderRadius:14, marginBottom:14, overflow:"hidden" },
  catHead: (bg) => ({ display:"flex", alignItems:"center", gap:12, padding:"14px 18px", cursor:"pointer", background:"#141e30", userSelect:"none" }),
  catIcon: (bg,color) => ({ width:34, height:34, borderRadius:8, background:bg, color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }),
  catTitle: { fontSize:14, fontWeight:700 },
  catSub: { fontSize:11, color:"#64748b", marginTop:2 },
  progWrap: { marginLeft:"auto", display:"flex", alignItems:"center", gap:8 },
  progBar: { width:72, height:4, background:"#1e2d45", borderRadius:9, overflow:"hidden" },
  progFill: (pct,color) => ({ width:pct+"%", height:"100%", borderRadius:9, background:color, transition:"width 0.3s" }),
  progTxt: { fontSize:11, fontFamily:"monospace", color:"#64748b", minWidth:32, textAlign:"right" },
  arrow: (open) => ({ fontSize:11, color:"#475569", transition:"transform 0.2s", transform: open?"":"rotate(-90deg)" }),
  item: { display:"flex", alignItems:"flex-start", gap:12, padding:"13px 18px", borderBottom:"1px solid rgba(30,45,69,0.5)" },
  itemTxt: { fontSize:13, lineHeight:1.5 },
  tagPill: (tag) => ({ display:"inline-block", fontSize:10, padding:"1px 7px", borderRadius:4, marginTop:4, fontWeight:600, background:tagBg[tag], color:tagColor[tag], letterSpacing:"0.4px" }),
  btnRow: { display:"flex", gap:4, flexShrink:0 },
  chkBtn: (st,type) => {
    const active = st === type;
    const map = { ok:["rgba(16,185,129,0.2)","#10b981"], ng:["rgba(239,68,68,0.2)","#ef4444"], na:["rgba(71,85,105,0.25)","#64748b"] };
    return { width:28, height:28, borderRadius:6, border:`1px solid ${active ? map[type][1] : "#1e2d45"}`, background: active ? map[type][0] : "#1a2235", color: active ? map[type][1] : "#475569", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, transition:"all 0.15s", fontFamily:"monospace" };
  },
  noteBtn: { width:28, height:28, borderRadius:6, border:"1px solid #1e2d45", background:"#1a2235", color:"#64748b", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11 },
  noteArea: { padding:"6px 18px 12px 48px" },
  textarea: { width:"100%", background:"#1a2235", border:"1px solid #1e2d45", borderRadius:8, padding:"8px 12px", color:"#f1f5f9", fontFamily:"'Noto Sans KR',sans-serif", fontSize:12, resize:"none", outline:"none", minHeight:52 },
  submitBar: { position:"fixed", bottom:0, left:0, right:0, background:"rgba(8,12,24,0.95)", backdropFilter:"blur(12px)", borderTop:"1px solid #1e2d45", padding:"12px 16px", display:"flex", justifyContent:"center", gap:10, zIndex:100 },
  btn: (variant) => {
    const v = { primary:{background:"#f59e0b",color:"#000"}, success:{background:"#10b981",color:"#fff"}, ghost:{background:"#1a2235",color:"#94a3b8",border:"1px solid #1e2d45"}, danger:{background:"rgba(239,68,68,0.15)",color:"#ef4444",border:"1px solid rgba(239,68,68,0.3)"}, admin:{background:"rgba(99,102,241,0.2)",color:"#818cf8",border:"1px solid rgba(99,102,241,0.35)"} };
    return { padding:"10px 18px", borderRadius:8, border:"none", cursor:"pointer", fontFamily:"'Noto Sans KR',sans-serif", fontSize:13, fontWeight:600, display:"flex", alignItems:"center", gap:6, transition:"all 0.15s", ...v[variant] };
  },
  recCard: { background:"#111827", border:"1px solid #1e2d45", borderRadius:12, padding:"14px 18px", marginBottom:10 },
  recHead: { display:"flex", alignItems:"center", gap:8, marginBottom:8, flexWrap:"wrap" },
  recMeta: { display:"flex", gap:14, fontSize:12, color:"#94a3b8", flexWrap:"wrap" },
  statPill: (type) => {
    const m = { ok:{bg:"rgba(16,185,129,0.15)",c:"#10b981"}, ng:{bg:"rgba(239,68,68,0.15)",c:"#ef4444"}, na:{bg:"rgba(71,85,105,0.18)",c:"#64748b"} };
    return { padding:"2px 10px", borderRadius:20, fontSize:12, fontWeight:600, background:m[type].bg, color:m[type].c, display:"inline-flex", alignItems:"center", gap:4 };
  },
  badge: (type) => {
    const m = { pass:{bg:"rgba(16,185,129,0.2)",c:"#10b981"}, fail:{bg:"rgba(239,68,68,0.2)",c:"#ef4444"}, inc:{bg:"rgba(245,158,11,0.2)",c:"#f59e0b"} };
    return { display:"inline-flex", alignItems:"center", gap:4, padding:"2px 8px", borderRadius:5, fontSize:11, fontWeight:600, background:m[type].bg, color:m[type].c };
  },
  ngBox: { marginTop:10, padding:"9px 12px", background:"rgba(239,68,68,0.05)", border:"1px solid rgba(239,68,68,0.18)", borderRadius:8, fontSize:12, color:"#94a3b8" },
  filterBar: { background:"#111827", border:"1px solid #1e2d45", borderRadius:12, padding:"12px 14px", marginBottom:14, display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" },
  filterInput: { flex:1, minWidth:150, background:"#1a2235", border:"1px solid #1e2d45", borderRadius:8, padding:"8px 12px", color:"#f1f5f9", fontFamily:"'Noto Sans KR',sans-serif", fontSize:13, outline:"none" },
  modal: { position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center" },
  modalBox: { background:"#111827", border:"1px solid #1e2d45", borderRadius:16, padding:24, maxWidth:480, width:"90%", maxHeight:"80vh", overflowY:"auto" },
  toast: (show,type) => ({ position:"fixed", top:18, right:18, background:"#1a2235", border:`1px solid ${type==="success"?"#10b981":type==="error"?"#ef4444":"#1e2d45"}`, borderRadius:10, padding:"11px 16px", fontSize:13, zIndex:300, transition:"transform 0.3s", transform: show?"translateX(0)":"translateX(130%)", maxWidth:260 }),
  statusDot: (st) => {
    const c = { ok:"#10b981", ng:"#ef4444", na:"#64748b", null:"#1e2d45" };
    return { width:8, height:8, borderRadius:"50%", background:c[st]||c.null, display:"inline-block", marginRight:4 };
  },
  liveTag: { background:"rgba(16,185,129,0.2)", color:"#10b981", border:"1px solid rgba(16,185,129,0.3)", borderRadius:6, fontSize:10, padding:"2px 8px", fontWeight:700, letterSpacing:"0.5px", display:"inline-flex", alignItems:"center", gap:4 },
  adminTag: { background:"rgba(99,102,241,0.2)", color:"#818cf8", border:"1px solid rgba(99,102,241,0.3)", borderRadius:6, fontSize:10, padding:"2px 8px", fontWeight:700, letterSpacing:"0.5px" },
};

// ─── 메인 컴포넌트 ─────────────────────────────────────────────
export default function SafetyApp() {
  const [tab, setTab] = useState("check");
  const [checkState, setCheckState] = useState({});
  const [notes, setNotes] = useState({});
  const [openNotes, setOpenNotes] = useState({});
  const [openCats, setOpenCats] = useState({ safety:true, equip:true, "5s":true, ppe:true });
  const [dept, setDept] = useState("");
  const [checkType, setCheckType] = useState("일일점검");
  const [records, setRecords] = useState([]);
  const [filterName, setFilterName] = useState("");
  const [filterType, setFilterType] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPw, setAdminPw] = useState("");
  const [pwError, setPwError] = useState(false);
  const [detailRec, setDetailRec] = useState(null);
  const [editingId, setEditingId] = useState(null); // 수정 중인 기록 id
  const [toast, setToast] = useState({ show:false, msg:"", type:"" });
  const [loading, setLoading] = useState(true);
  const [syncTime, setSyncTime] = useState("");

  // ── Storage 로드 ──
  const loadFromStorage = useCallback(async () => {
    try {
      const res = await window.storage.get(STORAGE_KEY, true);
      const data = res ? JSON.parse(res.value) : [];
      setRecords(Array.isArray(data) ? data : []);
      setSyncTime(fmtDate(now()));
    } catch {
      setRecords([]);
    }
    setLoading(false);
  }, []);

  const saveToStorage = useCallback(async (newRecords) => {
    try {
      await window.storage.set(STORAGE_KEY, JSON.stringify(newRecords), true);
      setSyncTime(fmtDate(now()));
      return true;
    } catch {
      showToast("저장 실패. 잠시 후 다시 시도해주세요.", "error");
      return false;
    }
  }, []);

  useEffect(() => {
    loadFromStorage();
    const iv = setInterval(loadFromStorage, 15000); // 15초마다 자동 동기화
    return () => clearInterval(iv);
  }, [loadFromStorage]);

  // ── Toast ──
  const showToast = (msg, type="") => {
    setToast({ show:true, msg, type });
    setTimeout(() => setToast(t => ({...t, show:false})), 2800);
  };

  // ── Summary ──
  const ok = ALL_ITEMS.filter(i => checkState[i.id]==="ok").length;
  const ng = ALL_ITEMS.filter(i => checkState[i.id]==="ng").length;
  const na = ALL_ITEMS.filter(i => checkState[i.id]==="na").length;
  const total = ALL_ITEMS.length;

  // ── 오늘 날짜 키 (YYYY-MM-DD) ──
  const todayKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  };

  // ── Submit ──
  const handleSubmit = async () => {
    if (!dept) { showToast("소속/공정을 선택해주세요.", "error"); return; }
    const answered = ALL_ITEMS.filter(i => checkState[i.id]);
    if (answered.length === 0) { showToast("최소 1개 이상 점검 결과를 입력해주세요.", "error"); return; }

    // 신규 저장일 때만 중복 체크
    if (!editingId) {
      const today = todayKey();
      const dup = records.find(r => {
        const rDay = r.date.slice(0,10);
        return rDay === today && r.dept === dept && r.type === checkType;
      });
      if (dup) {
        showToast(`오늘 이미 ${dept} ${checkType} 기록이 있습니다.\n기록 조회에서 수정하세요.`, "error");
        return;
      }
    }

    const rec = {
      id: editingId || Date.now(),
      date: editingId ? records.find(r=>r.id===editingId)?.date || now() : now(),
      updatedAt: editingId ? now() : undefined,
      inspector: dept,
      dept,
      type: checkType,
      results: {},
      notes: { ...notes },
    };
    ALL_ITEMS.forEach(i => { rec.results[i.id] = checkState[i.id] || null; });

    const updated = editingId
      ? records.map(r => r.id === editingId ? rec : r)
      : [rec, ...records];

    const saved = await saveToStorage(updated);
    if (saved) {
      setRecords(updated);
      setCheckState({});
      setNotes({});
      setOpenNotes({});
      setDept("");
      setEditingId(null);
      showToast(editingId ? "수정이 완료되었습니다! ✓" : "점검 기록이 저장되었습니다! ✓", "success");
      setTimeout(() => setTab("records"), 900);
    }
  };

  // ── 수정 모드 진입 ──
  const startEdit = (rec) => {
    const restored = {};
    const restoredNotes = {};
    ALL_ITEMS.forEach(i => {
      if (rec.results[i.id]) restored[i.id] = rec.results[i.id];
      if (rec.notes?.[i.id]) restoredNotes[i.id] = rec.notes[i.id];
    });
    setCheckState(restored);
    setNotes(restoredNotes);
    setOpenNotes({});
    setDept(rec.dept);
    setCheckType(rec.type);
    setEditingId(rec.id);
    setTab("check");
    window.scrollTo({top:0, behavior:"smooth"});
    showToast("수정 모드: 내용을 변경 후 저장하세요.", "");
  };

  // ── CSV Export (관리자 전용) ──
  const exportCSV = () => {
    if (records.length === 0) { showToast("내보낼 기록이 없습니다.", "error"); return; }
    const headers = ["점검ID","일시","점검자","소속/공정","점검구분",...ALL_ITEMS.map(i=>i.text),"OK수","NG수","NA수"];
    const rows = records.map(rec => {
      const ok = ALL_ITEMS.filter(i=>rec.results[i.id]==="ok").length;
      const ng = ALL_ITEMS.filter(i=>rec.results[i.id]==="ng").length;
      const na = ALL_ITEMS.filter(i=>rec.results[i.id]==="na").length;
      return [rec.id, fmtDate(rec.date), rec.inspector, rec.dept, rec.type,
        ...ALL_ITEMS.map(i=>rec.results[i.id]||""), ok, ng, na];
    });
    const csv = "\uFEFF" + [headers,...rows].map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv],{type:"text/csv;charset=utf-8;"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `안전점검_취합_${new Date().toLocaleDateString("ko-KR").replace(/\. /g,"-").replace(".","")}.csv`;
    a.click(); URL.revokeObjectURL(url);
    showToast("CSV 다운로드 완료!", "success");
  };

  // ── Admin Login ──
  const handleAdminLogin = () => {
    if (adminPw === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setShowAdminModal(false);
      setAdminPw("");
      setPwError(false);
      showToast("관리자 모드 활성화!", "success");
    } else {
      setPwError(true);
    }
  };

  // ── Delete ──
  const deleteRecord = async (id) => {
    if (!confirm("이 기록을 삭제하시겠습니까?")) return;
    const updated = records.filter(r => r.id !== id);
    const ok = await saveToStorage(updated);
    if (ok) { setRecords(updated); showToast("삭제되었습니다.", "success"); }
  };

  const clearAll = async () => {
    if (!confirm("모든 기록을 삭제합니까? 되돌릴 수 없습니다.")) return;
    const ok = await saveToStorage([]);
    if (ok) { setRecords([]); showToast("전체 기록 삭제 완료.", "success"); }
  };

  // ── Filter ──
  const filtered = records.filter(r => {
    const nm = filterName.trim().toLowerCase();
    if (nm && !r.inspector.toLowerCase().includes(nm)) return false;
    if (filterType && r.type !== filterType) return false;
    return true;
  });

  // ── Now string ──
  const [clockStr, setClockStr] = useState("");
  useEffect(() => {
    const t = setInterval(() => setClockStr(fmtDate(now())), 1000);
    setClockStr(fmtDate(now()));
    return () => clearInterval(t);
  }, []);

  return (
    <div style={S.app}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&display=swap" rel="stylesheet" />

      {/* HEADER */}
      <div style={S.inner}>
        <div style={S.header}>
          <div style={S.logo}>🏭</div>
          <div>
            <div style={S.h1}>현장 안전점검 시스템</div>
            <div style={S.sub}>{clockStr}</div>
          </div>
          <div style={{marginLeft:"auto", display:"flex", gap:8, alignItems:"center", flexWrap:"wrap"}}>
            <span style={S.liveTag}>
              <span style={{width:6,height:6,borderRadius:"50%",background:"#10b981",animation:"pulse 1.5s infinite"}}></span>
              공유 서버 연결
            </span>
            {syncTime && <span style={{fontSize:11,color:"#475569"}}>동기화 {syncTime}</span>}
            {isAdmin
              ? <span style={S.adminTag}>👑 관리자</span>
              : <button style={S.btn("admin")} onClick={()=>setShowAdminModal(true)}>🔐 관리자 로그인</button>
            }
          </div>
        </div>

        {/* TABS */}
        <div style={S.tabs}>
          {[["check","✅ 점검하기"],["records","📋 기록 조회"]].map(([id,lbl])=>(
            <button key={id} style={S.tab(tab===id)} onClick={()=>setTab(id)}>{lbl}</button>
          ))}
        </div>

        {/* ── CHECK TAB ── */}
        {tab==="check" && (
          <>
            {/* 수정 모드 배너 */}
            {editingId && (
              <div style={{background:"rgba(245,158,11,0.1)",border:"1px solid rgba(245,158,11,0.4)",borderRadius:12,padding:"11px 16px",marginBottom:14,display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:16}}>✏️</span>
                <span style={{fontSize:13,color:"#fbbf24",fontWeight:600}}>수정 모드</span>
                <span style={{fontSize:12,color:"#94a3b8"}}>기존 기록을 불러왔습니다. 변경 후 저장하세요.</span>
                <button style={{...S.btn("ghost"),marginLeft:"auto",fontSize:12,padding:"5px 12px"}}
                  onClick={()=>{setCheckState({});setNotes({});setOpenNotes({});setDept("");setEditingId(null);}}>
                  취소
                </button>
              </div>
            )}

            {/* Summary */}
            <div style={S.summGrid}>
              {[["#3b82f6","전체",total],["#10b981","정상 (OK)",ok],["#ef4444","불량 (NG)",ng],["#64748b","해당없음",na]].map(([c,l,v])=>(
                <div key={l} style={S.summCard(c)}>
                  <div style={S.summNum(c)}>{v}</div>
                  <div style={S.summLbl}>{l}</div>
                </div>
              ))}
            </div>

            {/* Info bar */}
            <div style={S.infoBar}>
              <div style={S.fieldGroup}>
                <label style={S.label}>소속 / 공정</label>
                <select style={{...S.select, color: dept ? "#f1f5f9" : "#64748b"}}
                  value={dept} onChange={e=>setDept(e.target.value)}>
                  <option value="">-- 소속/공정 선택 --</option>
                  {DEPT_OPTIONS.map(v=><option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div style={S.fieldGroup}>
                <label style={S.label}>점검 구분</label>
                <select style={S.select} value={checkType} onChange={e=>setCheckType(e.target.value)}>
                  {["일일점검","주간점검","월간점검"].map(v=><option key={v}>{v}</option>)}
                </select>
              </div>
            </div>

            {/* Categories */}
            {CATEGORIES.map(cat => {
              const catOk = cat.items.filter(i=>checkState[i.id]).length;
              const pct = Math.round(catOk/cat.items.length*100);
              const pColor = pct===100?"#10b981":pct>50?"#3b82f6":"#f59e0b";
              const open = openCats[cat.id];
              return (
                <div key={cat.id} style={S.cat}>
                  <div style={S.catHead(cat.bg)} onClick={()=>setOpenCats(p=>({...p,[cat.id]:!p[cat.id]}))}>
                    <div style={S.catIcon(cat.bg,cat.color)}>{cat.icon}</div>
                    <div>
                      <div style={S.catTitle}>{cat.title}</div>
                      <div style={S.catSub}>{cat.items.length}개 항목</div>
                    </div>
                    <div style={S.progWrap}>
                      <div style={S.progBar}><div style={S.progFill(pct,pColor)}></div></div>
                      <span style={S.progTxt}>{catOk}/{cat.items.length}</span>
                      <span style={S.arrow(open)}>▾</span>
                    </div>
                  </div>
                  {open && cat.items.map((item,idx) => (
                    <div key={item.id}>
                      <div style={{...S.item, ...(idx===cat.items.length-1?{borderBottom:"none"}:{})}}>
                        <div style={{flex:1}}>
                          <div style={S.itemTxt}>{item.text}</div>
                          <span style={S.tagPill(item.tag)}>{tagLabel[item.tag]}</span>
                        </div>
                        <div style={S.btnRow}>
                          {[["ok","✓"],["ng","✕"],["na","—"]].map(([type,lbl])=>(
                            <button key={type} style={S.chkBtn(checkState[item.id],type)}
                              onClick={()=>setCheckState(p=>{
                                const n={...p};
                                if(n[item.id]===type) delete n[item.id]; else n[item.id]=type;
                                return n;
                              })}>{lbl}</button>
                          ))}
                          <button style={S.noteBtn} onClick={()=>setOpenNotes(p=>({...p,[item.id]:!p[item.id]}))}>📝</button>
                        </div>
                      </div>
                      {(openNotes[item.id]||notes[item.id]) && (
                        <div style={S.noteArea}>
                          <textarea style={S.textarea} placeholder="특이사항 메모..."
                            value={notes[item.id]||""}
                            onChange={e=>setNotes(p=>({...p,[item.id]:e.target.value}))} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </>
        )}

        {/* ── RECORDS TAB ── */}
        {tab==="records" && (
          <>
            {/* Admin toolbar */}
            {isAdmin && (
              <div style={{background:"rgba(99,102,241,0.08)",border:"1px solid rgba(99,102,241,0.25)",borderRadius:12,padding:"12px 16px",marginBottom:14,display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
                <span style={{fontSize:13,color:"#818cf8",fontWeight:600}}>👑 관리자 메뉴</span>
                <span style={{fontSize:12,color:"#64748b"}}>전체 {records.length}건</span>
                <div style={{marginLeft:"auto",display:"flex",gap:8}}>
                  <button style={S.btn("admin")} onClick={exportCSV}>📊 전체 CSV 다운로드</button>
                  <button style={S.btn("danger")} onClick={clearAll}>🗑 전체 삭제</button>
                </div>
              </div>
            )}

            {/* Filter */}
            <div style={S.filterBar}>
              <input style={S.filterInput} placeholder="🔍 소속/공정 검색..." value={filterName} onChange={e=>setFilterName(e.target.value)} />
              <select style={{...S.filterInput,flex:"0 0 auto",minWidth:120}} value={filterType} onChange={e=>setFilterType(e.target.value)}>
                <option value="">전체 구분</option>
                {["일일점검","주간점검","월간점검"].map(v=><option key={v}>{v}</option>)}
              </select>
              <button style={S.btn("ghost")} onClick={loadFromStorage}>🔄 새로고침</button>
            </div>

            {loading ? (
              <div style={{textAlign:"center",padding:"60px 0",color:"#64748b"}}>서버에서 데이터 불러오는 중...</div>
            ) : filtered.length === 0 ? (
              <div style={{textAlign:"center",padding:"60px 0",color:"#64748b"}}>
                <div style={{fontSize:36,marginBottom:12}}>📭</div>
                <div>저장된 점검 기록이 없습니다.</div>
              </div>
            ) : filtered.map(rec => {
              const rOk = ALL_ITEMS.filter(i=>rec.results[i.id]==="ok").length;
              const rNg = ALL_ITEMS.filter(i=>rec.results[i.id]==="ng").length;
              const rNa = ALL_ITEMS.filter(i=>rec.results[i.id]==="na").length;
              const ans = rOk+rNg+rNa;
              const ngItems = ALL_ITEMS.filter(i=>rec.results[i.id]==="ng");
              const badgeType = rNg>0?"fail":ans===total?"pass":"inc";
              const badgeLbl = rNg>0?"⚠ NG 있음":ans===total?"✓ 완료":"⏳ 부분점검";
              return (
                <div key={rec.id} style={S.recCard}>
                  <div style={S.recHead}>
                    <span style={{fontSize:11,color:"#475569",fontFamily:"monospace"}}>#{rec.id}</span>
                    <span style={S.badge(badgeType)}>{badgeLbl}</span>
                    <span style={{marginLeft:"auto",fontSize:11,color:"#475569"}}>{fmtDate(rec.date)}</span>
                  </div>
                  <div style={S.recMeta}>
                    <span>👤 {rec.inspector}</span>
                    <span>🏭 {rec.dept}</span>
                    <span>📋 {rec.type}</span>
                    <span>✍ {ans}/{total}</span>
                  </div>
                  <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
                    <span style={S.statPill("ok")}>✓ OK {rOk}</span>
                    <span style={S.statPill("ng")}>✕ NG {rNg}</span>
                    <span style={S.statPill("na")}>— N/A {rNa}</span>
                  </div>
                  {ngItems.length>0 && (
                    <div style={S.ngBox}>
                      <div style={{color:"#ef4444",fontWeight:700,fontSize:11,marginBottom:4}}>⚠ NG 항목</div>
                      {ngItems.map(i=><div key={i.id} style={{marginBottom:2}}>• {i.text}</div>)}
                    </div>
                  )}
                  <div style={{display:"flex",gap:8,marginTop:10}}>
                    <button style={S.btn("ghost")} onClick={()=>setDetailRec(rec)}>🔍 상세보기</button>
                    <button style={S.btn("primary")} onClick={()=>startEdit(rec)}>✏️ 수정</button>
                    {isAdmin && <button style={S.btn("danger")} onClick={()=>deleteRecord(rec.id)}>🗑 삭제</button>}
                  </div>
                  {rec.updatedAt && (
                    <div style={{fontSize:11,color:"#475569",marginTop:6}}>✏️ 수정됨: {fmtDate(rec.updatedAt)}</div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* ── SUBMIT BAR ── */}
      {tab==="check" && (
        <div style={S.submitBar}>
          <button style={S.btn("ghost")} onClick={()=>{setCheckState({});setNotes({});setOpenNotes({});setDept("");setEditingId(null);}}>🔄 초기화</button>
          <button style={{...S.btn("success"), ...(editingId?{background:"#f59e0b",color:"#000"}:{})}} onClick={handleSubmit}>
            {editingId ? "✏️ 수정 완료 저장" : "💾 점검 완료 저장"}
          </button>
        </div>
      )}

      {/* ── ADMIN LOGIN MODAL ── */}
      {showAdminModal && (
        <div style={S.modal} onClick={e=>{if(e.target===e.currentTarget){setShowAdminModal(false);setAdminPw("");setPwError(false);}}}>
          <div style={S.modalBox}>
            <div style={{fontSize:16,fontWeight:700,marginBottom:6}}>🔐 관리자 인증</div>
            <div style={{fontSize:12,color:"#64748b",marginBottom:18}}>관리자 비밀번호를 입력하면 CSV 다운로드 및 기록 삭제 기능이 활성화됩니다.</div>
            <div style={S.fieldGroup}>
              <label style={S.label}>비밀번호</label>
              <input type="password" style={{...S.input,border:pwError?"1px solid #ef4444":"1px solid #1e2d45"}}
                placeholder="비밀번호 입력"
                value={adminPw}
                onChange={e=>{setAdminPw(e.target.value);setPwError(false);}}
                onKeyDown={e=>e.key==="Enter"&&handleAdminLogin()} />
              {pwError && <span style={{fontSize:11,color:"#ef4444",marginTop:3}}>비밀번호가 올바르지 않습니다.</span>}
            </div>
            <div style={{display:"flex",gap:10,marginTop:16}}>
              <button style={S.btn("admin")} onClick={handleAdminLogin}>확인</button>
              <button style={S.btn("ghost")} onClick={()=>{setShowAdminModal(false);setAdminPw("");setPwError(false);}}>취소</button>
            </div>
          </div>
        </div>
      )}

      {/* ── DETAIL MODAL ── */}
      {detailRec && (
        <div style={S.modal} onClick={e=>{if(e.target===e.currentTarget)setDetailRec(null);}}>
          <div style={S.modalBox}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <span style={{fontSize:15,fontWeight:700}}>점검 상세 기록</span>
              <button style={S.btn("ghost")} onClick={()=>setDetailRec(null)}>✕</button>
            </div>
            {[["점검자",detailRec.inspector],["소속/공정",detailRec.dept],["점검구분",detailRec.type],["일시",fmtDate(detailRec.date)]].map(([k,v])=>(
              <div key={k} style={{display:"flex",gap:10,padding:"7px 0",borderBottom:"1px solid #1e2d45",fontSize:13}}>
                <span style={{color:"#64748b",minWidth:80}}>{k}</span><span>{v}</span>
              </div>
            ))}
            {CATEGORIES.map(cat=>(
              <div key={cat.id}>
                <div style={{margin:"14px 0 6px",fontSize:12,fontWeight:700,color:"#94a3b8"}}>{cat.icon} {cat.title}</div>
                {cat.items.map(item=>{
                  const r = detailRec.results[item.id];
                  const lbl = r==="ok"?<span style={{color:"#10b981"}}>OK</span>:r==="ng"?<span style={{color:"#ef4444"}}>NG</span>:r==="na"?<span style={{color:"#64748b"}}>N/A</span>:<span style={{color:"#475569"}}>미점검</span>;
                  const note = detailRec.notes&&detailRec.notes[item.id];
                  return (
                    <div key={item.id} style={{display:"flex",gap:8,padding:"7px 0",borderBottom:"1px solid #1e2d45",fontSize:12}}>
                      <span style={{minWidth:40,display:"flex",alignItems:"center",gap:4}}><span style={S.statusDot(r)}></span>{lbl}</span>
                      <span>{item.text}{note&&<div style={{fontSize:11,color:"#f59e0b",marginTop:2}}>📝 {note}</div>}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TOAST */}
      <div style={S.toast(toast.show,toast.type)}>{toast.msg}</div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0a0e1a; }
        ::-webkit-scrollbar-thumb { background: #1e2d45; border-radius: 3px; }
      `}</style>
    </div>
  );
}
