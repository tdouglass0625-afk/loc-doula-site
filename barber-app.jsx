import { useState, useRef, useEffect } from "react";

const SYSTEM_PROMPT = `You are a smart booking assistant for a barber/hair stylist shop. You help clients:
- Book appointments (ask for preferred date, time, service, and stylist)
- Learn about services and pricing
- Get hair care tips and style recommendations
- Reschedule or cancel appointments
- Answer FAQs about the shop

Default services available:
- Haircut - $30 (30 min)
- Fade/Taper - $35 (45 min)
- Beard Trim - $20 (20 min)
- Haircut + Beard - $45 (60 min)
- Hair Color - $80+ (90 min)
- Braids - $60+ (120 min)
- Kid's Cut - $20 (20 min)

Stylists: Marcus, Jada, Trey, Sofia

Shop hours: Mon-Sat 9am-7pm, Sun 10am-5pm

When booking, collect: name, service, preferred stylist (or any available), date and time. Then confirm the booking with a summary. Be friendly, professional, and concise. Use occasional emojis.`;

const QUICK_ACTIONS = [
  { label: "📅 Book Appointment", msg: "I'd like to book an appointment" },
  { label: "💈 See Services", msg: "What services do you offer?" },
  { label: "⏰ Shop Hours", msg: "What are your hours?" },
  { label: "✂️ Style Advice", msg: "Can you help me pick a hairstyle?" },
  { label: "🔄 Reschedule", msg: "I need to reschedule my appointment" },
  { label: "💰 Pricing", msg: "How much do your services cost?" },
];

const STYLISTS = [
  { name: "Marcus", role: "Master Barber", specialty: "Fades & Tapers", color: "#7c5cfc", emoji: "✂️" },
  { name: "Jada", role: "Color Specialist", specialty: "Color & Braids", color: "#ff6eb4", emoji: "🎨" },
  { name: "Trey", role: "Senior Barber", specialty: "Cuts & Beards", color: "#4ec9ff", emoji: "💈" },
  { name: "Sofia", role: "Stylist", specialty: "All Hair Types", color: "#4eff91", emoji: "✨" },
];

const TABS = ["Chat", "Team", "Services"];

export default function BarberApp() {
  const [activeTab, setActiveTab] = useState("Chat");
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hey! 👋 Welcome to **FreshCuts Studio**. I can help you book an appointment, check our services, or answer any questions. What can I do for you today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text) {
    const userText = text || input.trim();
    if (!userText) return;
    setInput("");
    const newMessages = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: newMessages,
        }),
      });
      const data = await res.json();
      const reply = data.content?.map(b => b.text || "").join("") || "Sorry, try again!";
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Connection issue — please try again!" }]);
    } finally {
      setLoading(false);
    }
  }

  function renderText(text) {
    return text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
      part.startsWith("**") && part.endsWith("**")
        ? <strong key={i} style={{ color: "#fff" }}>{part.slice(2, -2)}</strong>
        : part
    );
  }

  return (
    <div style={s.root}>
      <div style={s.blob1} /><div style={s.blob2} />

      <div style={s.shell}>
        {/* Header */}
        <div style={s.header}>
          <div style={s.brand}>
            <div style={s.brandIcon}>💈</div>
            <div>
              <div style={s.brandName}>FreshCuts Studio</div>
              <div style={s.brandSub}>Book · Chat · Style</div>
            </div>
          </div>
          <div style={s.online}><span style={s.onlineDot} />Online</div>
        </div>

        {/* Tabs */}
        <div style={s.tabs}>
          {TABS.map(t => (
            <button key={t} style={{ ...s.tab, ...(activeTab === t ? s.tabActive : {}) }}
              onClick={() => setActiveTab(t)}>{t}</button>
          ))}
        </div>

        {/* Content */}
        <div style={s.body}>
          {activeTab === "Chat" && (
            <>
              <div style={s.chatArea}>
                {messages.map((msg, i) => (
                  <div key={i} style={{ ...s.row, justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                    {msg.role === "assistant" && <div style={s.avatar}>💈</div>}
                    <div style={msg.role === "user" ? s.userBub : s.aiBub}>
                      {renderText(msg.content)}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div style={{ ...s.row, justifyContent: "flex-start" }}>
                    <div style={s.avatar}>💈</div>
                    <div style={s.aiBub}><span style={s.d1}>●</span><span style={s.d2}>●</span><span style={s.d3}>●</span></div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Quick actions */}
              <div style={s.quickWrap}>
                {QUICK_ACTIONS.map((a, i) => (
                  <button key={i} style={s.chip} onClick={() => sendMessage(a.msg)}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.13)"}
                    onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}>
                    {a.label}
                  </button>
                ))}
              </div>

              {/* Input */}
              <div style={s.inputRow}>
                <input style={s.input} placeholder="Type a message..."
                  value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendMessage()} />
                <button style={{ ...s.sendBtn, opacity: input.trim() ? 1 : 0.4 }}
                  onClick={() => sendMessage()} disabled={!input.trim() || loading}>➤</button>
              </div>
            </>
          )}

          {activeTab === "Team" && (
            <div style={s.teamGrid}>
              {STYLISTS.map((st, i) => (
                <div key={i} style={s.stylistCard}
                  onMouseEnter={e => e.currentTarget.style.transform = "translateY(-4px)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
                  <div style={{ ...s.stylistAvatar, background: `${st.color}22`, border: `2px solid ${st.color}44` }}>
                    <span style={{ fontSize: 32 }}>{st.emoji}</span>
                  </div>
                  <div style={s.stylistName}>{st.name}</div>
                  <div style={{ ...s.stylistRole, color: st.color }}>{st.role}</div>
                  <div style={s.stylistSpec}>{st.specialty}</div>
                  <button style={{ ...s.bookBtn, background: `linear-gradient(135deg, ${st.color}, ${st.color}99)` }}
                    onClick={() => { setActiveTab("Chat"); sendMessage(`I'd like to book with ${st.name}`); }}>
                    Book {st.name}
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === "Services" && (
            <div style={s.serviceList}>
              {[
                { name: "Haircut", price: "$30", time: "30 min", icon: "✂️", desc: "Classic cut, any style" },
                { name: "Fade / Taper", price: "$35", time: "45 min", icon: "💈", desc: "Skin, low, mid, or high fade" },
                { name: "Beard Trim", price: "$20", time: "20 min", icon: "🧔", desc: "Shape, line up & oil" },
                { name: "Cut + Beard", price: "$45", time: "60 min", icon: "⭐", desc: "Full grooming combo" },
                { name: "Hair Color", price: "$80+", time: "90 min", icon: "🎨", desc: "Full color or highlights" },
                { name: "Braids", price: "$60+", time: "2 hrs", icon: "🪢", desc: "Box braids, cornrows & more" },
                { name: "Kid's Cut", price: "$20", time: "20 min", icon: "🧒", desc: "Ages 12 and under" },
              ].map((sv, i) => (
                <div key={i} style={s.serviceCard}>
                  <div style={s.serviceIcon}>{sv.icon}</div>
                  <div style={s.serviceInfo}>
                    <div style={s.serviceName}>{sv.name}</div>
                    <div style={s.serviceDesc}>{sv.desc}</div>
                    <div style={s.serviceMeta}><span style={s.serviceTime}>⏱ {sv.time}</span></div>
                  </div>
                  <div style={s.serviceRight}>
                    <div style={s.servicePrice}>{sv.price}</div>
                    <button style={s.bookSmall} onClick={() => { setActiveTab("Chat"); sendMessage(`I'd like to book a ${sv.name}`); }}>Book</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input:focus, button:focus { outline: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 4px; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes d1 { 0%,100%{opacity:.3} 33%{opacity:1} }
        @keyframes d2 { 0%,100%{opacity:.3} 66%{opacity:1} }
        @keyframes d3 { 0%,100%{opacity:.3} 100%{opacity:1} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}

const s = {
  root: {
    minHeight: "100vh", background: "linear-gradient(135deg, #080810 0%, #100d1e 60%, #08100e 100%)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "'DM Sans', sans-serif", position: "relative", overflow: "hidden", padding: 16,
  },
  blob1: {
    position: "fixed", top: "-5%", left: "-5%", width: 500, height: 500, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(124,92,252,0.15) 0%, transparent 70%)", pointerEvents: "none",
  },
  blob2: {
    position: "fixed", bottom: "-10%", right: "-5%", width: 600, height: 600, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(255,110,80,0.1) 0%, transparent 70%)", pointerEvents: "none",
  },
  shell: {
    width: "100%", maxWidth: 700, height: "92vh", maxHeight: 860,
    display: "flex", flexDirection: "column",
    background: "rgba(255,255,255,0.04)", backdropFilter: "blur(28px)",
    borderRadius: 28, border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 40px 100px rgba(0,0,0,0.6)", overflow: "hidden", position: "relative", zIndex: 1,
  },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "18px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(255,255,255,0.02)",
  },
  brand: { display: "flex", alignItems: "center", gap: 12 },
  brandIcon: {
    width: 42, height: 42, borderRadius: 13,
    background: "linear-gradient(135deg, #ff6e50, #ff4eb4)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 20, boxShadow: "0 4px 18px rgba(255,110,80,0.4)",
  },
  brandName: { fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: "#fff", letterSpacing: "-0.01em" },
  brandSub: { fontSize: 11, color: "rgba(255,255,255,0.35)", letterSpacing: "0.06em", marginTop: 1 },
  online: { display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "rgba(255,255,255,0.5)" },
  onlineDot: { display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: "#4eff91", boxShadow: "0 0 6px #4eff91", animation: "pulse 2.5s infinite" },
  tabs: { display: "flex", padding: "0 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", gap: 4 },
  tab: {
    padding: "12px 18px", background: "transparent", border: "none", color: "rgba(255,255,255,0.4)",
    fontSize: 14, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", borderBottom: "2px solid transparent",
    transition: "all 0.2s", marginBottom: -1,
  },
  tabActive: { color: "#fff", borderBottomColor: "#ff6e50" },
  body: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },

  // Chat
  chatArea: { flex: 1, overflowY: "auto", padding: "20px 20px 8px", display: "flex", flexDirection: "column", gap: 14 },
  row: { display: "flex", alignItems: "flex-end", gap: 8, animation: "fadeUp 0.3s ease" },
  avatar: {
    width: 32, height: 32, borderRadius: 10, flexShrink: 0,
    background: "linear-gradient(135deg, #ff6e50, #ff4eb4)",
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
  },
  userBub: {
    maxWidth: "72%", padding: "11px 15px", borderRadius: "16px 16px 4px 16px",
    background: "linear-gradient(135deg, #7c5cfc, #9b70ff)", color: "#fff", fontSize: 14, lineHeight: 1.55,
  },
  aiBub: {
    maxWidth: "78%", padding: "11px 15px", borderRadius: "16px 16px 16px 4px",
    background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.85)", fontSize: 14, lineHeight: 1.6,
  },
  d1: { fontSize: 10, marginRight: 3, animation: "d1 1.2s infinite" },
  d2: { fontSize: 10, marginRight: 3, animation: "d2 1.2s infinite" },
  d3: { fontSize: 10, animation: "d3 1.2s infinite" },
  quickWrap: { display: "flex", flexWrap: "wrap", gap: 7, padding: "10px 20px" },
  chip: {
    padding: "7px 12px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.65)", fontSize: 12,
    cursor: "pointer", transition: "all 0.2s", fontFamily: "'DM Sans', sans-serif",
  },
  inputRow: {
    display: "flex", gap: 10, padding: "12px 16px 16px",
    borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)",
  },
  input: {
    flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 14, padding: "11px 15px", color: "#fff", fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 13,
    background: "linear-gradient(135deg, #ff6e50, #ff4eb4)", border: "none",
    color: "#fff", fontSize: 15, cursor: "pointer", transition: "all 0.2s",
    boxShadow: "0 4px 14px rgba(255,110,80,0.35)",
  },

  // Team
  teamGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, padding: 20, overflowY: "auto" },
  stylistCard: {
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 20, padding: "20px 16px", display: "flex", flexDirection: "column",
    alignItems: "center", gap: 6, transition: "transform 0.2s",
  },
  stylistAvatar: { width: 70, height: 70, borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 },
  stylistName: { fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, color: "#fff" },
  stylistRole: { fontSize: 12, fontWeight: 500 },
  stylistSpec: { fontSize: 11, color: "rgba(255,255,255,0.35)", textAlign: "center" },
  bookBtn: { marginTop: 8, padding: "8px 18px", borderRadius: 12, border: "none", color: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 500 },

  // Services
  serviceList: { overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 },
  serviceCard: {
    display: "flex", alignItems: "center", gap: 14,
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 16, padding: "14px 16px",
  },
  serviceIcon: { fontSize: 28, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.06)", borderRadius: 12 },
  serviceInfo: { flex: 1 },
  serviceName: { fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, color: "#fff" },
  serviceDesc: { fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 },
  serviceMeta: { marginTop: 4 },
  serviceTime: { fontSize: 11, color: "rgba(255,255,255,0.3)" },
  serviceRight: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 },
  servicePrice: { fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, color: "#ff6e50" },
  bookSmall: {
    padding: "6px 14px", borderRadius: 10, border: "none",
    background: "linear-gradient(135deg, #ff6e50, #ff4eb4)", color: "#fff",
    fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
  },
};
