import { useState, useRef, useEffect } from "react";

const SYSTEM_PROMPT = `You are a smart booking assistant for a barber/hair stylist shop called FreshCuts Studio. You help clients:
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

const STYLISTS = [
  { name: "Marcus", role: "Master Barber", specialty: "Fades & Tapers", color: "#7c5cfc", emoji: "✂️" },
  { name: "Jada", role: "Color Specialist", specialty: "Color & Braids", color: "#ff6eb4", emoji: "🎨" },
  { name: "Trey", role: "Senior Barber", specialty: "Cuts & Beards", color: "#4ec9ff", emoji: "💈" },
  { name: "Sofia", role: "Stylist", specialty: "All Hair Types", color: "#4eff91", emoji: "✨" },
];

const SERVICES = [
  { name: "Haircut", price: "$30", time: "30 min", icon: "✂️", desc: "Classic cut, any style" },
  { name: "Fade / Taper", price: "$35", time: "45 min", icon: "💈", desc: "Skin, low, mid, or high fade" },
  { name: "Beard Trim", price: "$20", time: "20 min", icon: "🧔", desc: "Shape, line up & oil" },
  { name: "Cut + Beard", price: "$45", time: "60 min", icon: "⭐", desc: "Full grooming combo" },
  { name: "Hair Color", price: "$80+", time: "90 min", icon: "🎨", desc: "Full color or highlights" },
  { name: "Braids", price: "$60+", time: "2 hrs", icon: "🪢", desc: "Box braids, cornrows & more" },
  { name: "Kid's Cut", price: "$20", time: "20 min", icon: "🧒", desc: "Ages 12 and under" },
];

const QUICK_ACTIONS = [
  { label: "📅 Book Appointment", msg: "I'd like to book an appointment" },
  { label: "💈 See Services", msg: "What services do you offer?" },
  { label: "⏰ Shop Hours", msg: "What are your hours?" },
  { label: "✂️ Style Advice", msg: "Can you help me pick a hairstyle?" },
  { label: "🔄 Reschedule", msg: "I need to reschedule my appointment" },
  { label: "💰 Pricing", msg: "How much do your services cost?" },
];

const MOCK_APPOINTMENTS = [
  { id: 1, client: "Jordan Miles", service: "Fade / Taper", stylist: "Marcus", date: "Jun 6, 2026", time: "10:00 AM", status: "confirmed", phone: "555-0101", email: "jordan@email.com" },
  { id: 2, client: "Aisha Brown", service: "Braids", stylist: "Jada", date: "Jun 6, 2026", time: "11:30 AM", status: "confirmed", phone: "555-0102", email: "aisha@email.com" },
  { id: 3, client: "Devon King", service: "Cut + Beard", stylist: "Trey", date: "Jun 6, 2026", time: "1:00 PM", status: "pending", phone: "555-0103", email: "devon@email.com" },
  { id: 4, client: "Maya Chen", service: "Hair Color", stylist: "Sofia", date: "Jun 7, 2026", time: "9:00 AM", status: "confirmed", phone: "555-0104", email: "maya@email.com" },
  { id: 5, client: "Tyler Ross", service: "Haircut", stylist: "Marcus", date: "Jun 7, 2026", time: "2:00 PM", status: "pending", phone: "555-0105", email: "tyler@email.com" },
  { id: 6, client: "Zara Williams", service: "Kid's Cut", stylist: "Sofia", date: "Jun 5, 2026", time: "3:00 PM", status: "completed", phone: "555-0106", email: "zara@email.com" },
  { id: 7, client: "Cam Davis", service: "Beard Trim", stylist: "Trey", date: "Jun 5, 2026", time: "4:30 PM", status: "completed", phone: "555-0107", email: "cam@email.com" },
  { id: 8, client: "Nia Foster", service: "Fade / Taper", stylist: "Marcus", date: "Jun 4, 2026", time: "11:00 AM", status: "completed", phone: "555-0108", email: "nia@email.com" },
];

const TABS = ["Chat", "Book", "Team", "Services", "History", "Dashboard"];

export default function BarberApp() {
  const [activeTab, setActiveTab] = useState("Chat");
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hey! 👋 Welcome to **FreshCuts Studio**. I can help you book an appointment, check our services, or answer any questions. What can I do for you today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState(MOCK_APPOINTMENTS);
  const [intakeStep, setIntakeStep] = useState(0);
  const [intakeData, setIntakeData] = useState({ name: "", phone: "", email: "", service: "", stylist: "", date: "", time: "", hairType: "", notes: "", firstVisit: "" });
  const [intakeSubmitted, setIntakeSubmitted] = useState(false);
  const [ownerView, setOwnerView] = useState("overview");
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  async function sendMessage(text) {
    const userText = text || input.trim();
    if (!userText) return;
    setInput("");
    const newMessages = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: SYSTEM_PROMPT, messages: newMessages }),
      });
      const data = await res.json();
      const reply = data.content?.map(b => b.text || "").join("") || "Sorry, try again!";
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Connection issue — please try again!" }]);
    } finally { setLoading(false); }
  }

  function renderText(text) {
    return text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
      part.startsWith("**") && part.endsWith("**")
        ? <strong key={i} style={{ color: "#fff" }}>{part.slice(2, -2)}</strong>
        : part
    );
  }

  function updateAppointmentStatus(id, status) {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  }

  function submitIntake() {
    const newAppt = {
      id: appointments.length + 1,
      client: intakeData.name,
      service: intakeData.service,
      stylist: intakeData.stylist || "Any",
      date: intakeData.date,
      time: intakeData.time,
      status: "pending",
      phone: intakeData.phone,
      email: intakeData.email,
    };
    setAppointments(prev => [newAppt, ...prev]);
    setIntakeSubmitted(true);
  }

  const todayAppts = appointments.filter(a => a.date === "Jun 6, 2026");
  const totalRevenue = appointments.filter(a => a.status === "completed").length * 38;
  const confirmedCount = appointments.filter(a => a.status === "confirmed").length;
  const completedCount = appointments.filter(a => a.status === "completed").length;

  const statusColor = { confirmed: "#4eff91", pending: "#ffd04e", completed: "#4ec9ff", cancelled: "#ff6e50" };
  const statusBg = { confirmed: "rgba(78,255,145,0.12)", pending: "rgba(255,208,78,0.12)", completed: "rgba(78,201,255,0.12)", cancelled: "rgba(255,110,80,0.12)" };

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
              <div style={s.brandSub}>Book · Chat · Manage</div>
            </div>
          </div>
          <div style={s.online}><span style={s.onlineDot} />Online</div>
        </div>

        {/* Tabs */}
        <div style={s.tabBar}>
          {TABS.map(t => (
            <button key={t} style={{ ...s.tab, ...(activeTab === t ? s.tabActive : {}) }} onClick={() => setActiveTab(t)}>{t}</button>
          ))}
        </div>

        <div style={s.body}>

          {/* ── CHAT ── */}
          {activeTab === "Chat" && (
            <>
              <div style={s.chatArea}>
                {messages.map((msg, i) => (
                  <div key={i} style={{ ...s.row, justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                    {msg.role === "assistant" && <div style={s.avatar}>💈</div>}
                    <div style={msg.role === "user" ? s.userBub : s.aiBub}>{renderText(msg.content)}</div>
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
              <div style={s.quickWrap}>
                {QUICK_ACTIONS.map((a, i) => (
                  <button key={i} style={s.chip} onClick={() => sendMessage(a.msg)}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.13)"}
                    onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}>{a.label}</button>
                ))}
              </div>
              <div style={s.inputRow}>
                <input style={s.input} placeholder="Type a message..." value={input}
                  onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} />
                <button style={{ ...s.sendBtn, opacity: input.trim() ? 1 : 0.4 }}
                  onClick={() => sendMessage()} disabled={!input.trim() || loading}>➤</button>
              </div>
            </>
          )}

          {/* ── INTAKE FORM ── */}
          {activeTab === "Book" && (
            <div style={s.scrollArea}>
              {intakeSubmitted ? (
                <div style={s.successBox}>
                  <div style={s.successIcon}>✅</div>
                  <div style={s.successTitle}>You're booked!</div>
                  <div style={s.successSub}>We'll send a confirmation to {intakeData.email || intakeData.phone}. See you soon!</div>
                  <div style={s.summaryCard}>
                    <div style={s.summaryRow}><span style={s.summaryLabel}>Name</span><span style={s.summaryVal}>{intakeData.name}</span></div>
                    <div style={s.summaryRow}><span style={s.summaryLabel}>Service</span><span style={s.summaryVal}>{intakeData.service}</span></div>
                    <div style={s.summaryRow}><span style={s.summaryLabel}>Stylist</span><span style={s.summaryVal}>{intakeData.stylist || "Any available"}</span></div>
                    <div style={s.summaryRow}><span style={s.summaryLabel}>Date</span><span style={s.summaryVal}>{intakeData.date}</span></div>
                    <div style={s.summaryRow}><span style={s.summaryLabel}>Time</span><span style={s.summaryVal}>{intakeData.time}</span></div>
                  </div>
                  <button style={s.resetBtn} onClick={() => { setIntakeSubmitted(false); setIntakeStep(0); setIntakeData({ name: "", phone: "", email: "", service: "", stylist: "", date: "", time: "", hairType: "", notes: "", firstVisit: "" }); }}>Book Another</button>
                </div>
              ) : (
                <div style={s.intakeWrap}>
                  <div style={s.intakeHeader}>
                    <div style={s.intakeTitle}>Book an Appointment</div>
                    <div style={s.stepDots}>
                      {[0,1,2,3].map(i => <div key={i} style={{ ...s.dot, background: i <= intakeStep ? "#ff6e50" : "rgba(255,255,255,0.15)" }} />)}
                    </div>
                  </div>

                  {intakeStep === 0 && (
                    <div style={s.formStep}>
                      <div style={s.stepLabel}>Step 1 — Your Info</div>
                      {[["Full Name", "name", "text", "Jordan Miles"], ["Phone", "phone", "tel", "555-0100"], ["Email", "email", "email", "you@email.com"]].map(([label, key, type, ph]) => (
                        <div key={key} style={s.fieldGroup}>
                          <label style={s.fieldLabel}>{label}</label>
                          <input style={s.field} type={type} placeholder={ph} value={intakeData[key]}
                            onChange={e => setIntakeData(p => ({ ...p, [key]: e.target.value }))} />
                        </div>
                      ))}
                      <div style={s.fieldGroup}>
                        <label style={s.fieldLabel}>First Visit?</label>
                        <div style={s.radioGroup}>
                          {["Yes", "No"].map(v => (
                            <button key={v} style={{ ...s.radioBtn, ...(intakeData.firstVisit === v ? s.radioBtnActive : {}) }}
                              onClick={() => setIntakeData(p => ({ ...p, firstVisit: v }))}>{v}</button>
                          ))}
                        </div>
                      </div>
                      <button style={s.nextBtn} disabled={!intakeData.name || !intakeData.phone}
                        onClick={() => setIntakeStep(1)}>Next →</button>
                    </div>
                  )}

                  {intakeStep === 1 && (
                    <div style={s.formStep}>
                      <div style={s.stepLabel}>Step 2 — Choose Service</div>
                      <div style={s.serviceGrid}>
                        {SERVICES.map((sv, i) => (
                          <button key={i} style={{ ...s.serviceOption, ...(intakeData.service === sv.name ? s.serviceOptionActive : {}) }}
                            onClick={() => setIntakeData(p => ({ ...p, service: sv.name }))}>
                            <span style={s.svcIcon}>{sv.icon}</span>
                            <span style={s.svcName}>{sv.name}</span>
                            <span style={s.svcPrice}>{sv.price}</span>
                          </button>
                        ))}
                      </div>
                      <div style={s.fieldGroup}>
                        <label style={s.fieldLabel}>Hair Type</label>
                        <div style={s.radioGroup}>
                          {["Fine", "Medium", "Thick", "Curly", "Coily"].map(v => (
                            <button key={v} style={{ ...s.radioBtn, ...(intakeData.hairType === v ? s.radioBtnActive : {}) }}
                              onClick={() => setIntakeData(p => ({ ...p, hairType: v }))}>{v}</button>
                          ))}
                        </div>
                      </div>
                      <div style={s.navRow}>
                        <button style={s.backBtn} onClick={() => setIntakeStep(0)}>← Back</button>
                        <button style={s.nextBtn} disabled={!intakeData.service} onClick={() => setIntakeStep(2)}>Next →</button>
                      </div>
                    </div>
                  )}

                  {intakeStep === 2 && (
                    <div style={s.formStep}>
                      <div style={s.stepLabel}>Step 3 — Pick a Stylist</div>
                      <div style={s.stylistGrid}>
                        {[{ name: "Any Available", role: "First open slot", color: "#aaa", emoji: "🎲" }, ...STYLISTS].map((st, i) => (
                          <button key={i} style={{ ...s.stylistOption, ...(intakeData.stylist === st.name ? { ...s.stylistOptionActive, borderColor: st.color } : {}) }}
                            onClick={() => setIntakeData(p => ({ ...p, stylist: st.name }))}>
                            <span style={{ fontSize: 24 }}>{st.emoji}</span>
                            <span style={s.stName}>{st.name}</span>
                            <span style={{ ...s.stRole, color: st.color }}>{st.role}</span>
                          </button>
                        ))}
                      </div>
                      <div style={s.navRow}>
                        <button style={s.backBtn} onClick={() => setIntakeStep(1)}>← Back</button>
                        <button style={s.nextBtn} disabled={!intakeData.stylist} onClick={() => setIntakeStep(3)}>Next →</button>
                      </div>
                    </div>
                  )}

                  {intakeStep === 3 && (
                    <div style={s.formStep}>
                      <div style={s.stepLabel}>Step 4 — Date & Time</div>
                      {[["Preferred Date", "date", "date"], ["Preferred Time", "time", "time"]].map(([label, key, type]) => (
                        <div key={key} style={s.fieldGroup}>
                          <label style={s.fieldLabel}>{label}</label>
                          <input style={s.field} type={type} value={intakeData[key]}
                            onChange={e => setIntakeData(p => ({ ...p, [key]: e.target.value }))} />
                        </div>
                      ))}
                      <div style={s.fieldGroup}>
                        <label style={s.fieldLabel}>Notes (optional)</label>
                        <textarea style={{ ...s.field, height: 80, resize: "none" }} placeholder="Any special requests..."
                          value={intakeData.notes} onChange={e => setIntakeData(p => ({ ...p, notes: e.target.value }))} />
                      </div>
                      <div style={s.navRow}>
                        <button style={s.backBtn} onClick={() => setIntakeStep(2)}>← Back</button>
                        <button style={s.nextBtn} disabled={!intakeData.date || !intakeData.time} onClick={submitIntake}>Confirm Booking ✓</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── TEAM ── */}
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

          {/* ── SERVICES ── */}
          {activeTab === "Services" && (
            <div style={s.serviceList}>
              {SERVICES.map((sv, i) => (
                <div key={i} style={s.serviceCard}>
                  <div style={s.serviceIcon}>{sv.icon}</div>
                  <div style={s.serviceInfo}>
                    <div style={s.serviceName}>{sv.name}</div>
                    <div style={s.serviceDesc}>{sv.desc}</div>
                    <div style={s.serviceMeta}><span style={s.serviceTime}>⏱ {sv.time}</span></div>
                  </div>
                  <div style={s.serviceRight}>
                    <div style={s.servicePrice}>{sv.price}</div>
                    <button style={s.bookSmall} onClick={() => { setActiveTab("Book"); setIntakeData(p => ({ ...p, service: sv.name })); setIntakeStep(1); }}>Book</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── HISTORY ── */}
          {activeTab === "History" && (
            <div style={s.scrollArea}>
              <div style={s.historyHeader}>
                <div style={s.historyTitle}>Appointment History</div>
                <div style={s.historyCount}>{appointments.length} total</div>
              </div>
              {appointments.map((a, i) => (
                <div key={i} style={s.apptCard}>
                  <div style={s.apptLeft}>
                    <div style={s.apptClient}>{a.client}</div>
                    <div style={s.apptMeta}>{a.service} · {a.stylist}</div>
                    <div style={s.apptMeta}>{a.date} at {a.time}</div>
                    <div style={s.apptContact}>{a.phone} · {a.email}</div>
                  </div>
                  <div style={s.apptRight}>
                    <div style={{ ...s.statusBadge, color: statusColor[a.status], background: statusBg[a.status] }}>{a.status}</div>
                    {a.status === "pending" && (
                      <div style={s.apptActions}>
                        <button style={s.confirmBtn} onClick={() => updateAppointmentStatus(a.id, "confirmed")}>✓ Confirm</button>
                        <button style={s.cancelBtn} onClick={() => updateAppointmentStatus(a.id, "cancelled")}>✕</button>
                      </div>
                    )}
                    {a.status === "confirmed" && (
                      <button style={s.completeBtn} onClick={() => updateAppointmentStatus(a.id, "completed")}>Mark Done</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── DASHBOARD ── */}
          {activeTab === "Dashboard" && (
            <div style={s.scrollArea}>
              <div style={s.dashHeader}>
                <div style={s.dashTitle}>Owner Dashboard</div>
                <div style={s.dashSub}>Today · Jun 6, 2026</div>
              </div>

              {/* Stats */}
              <div style={s.statsGrid}>
                {[
                  { label: "Today's Bookings", value: todayAppts.length, icon: "📅", color: "#7c5cfc" },
                  { label: "Confirmed", value: confirmedCount, icon: "✅", color: "#4eff91" },
                  { label: "Completed", value: completedCount, icon: "💈", color: "#4ec9ff" },
                  { label: "Revenue (done)", value: `$${totalRevenue}`, icon: "💰", color: "#ffd04e" },
                ].map((stat, i) => (
                  <div key={i} style={s.statCard}>
                    <div style={s.statIcon}>{stat.icon}</div>
                    <div style={{ ...s.statValue, color: stat.color }}>{stat.value}</div>
                    <div style={s.statLabel}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Today's schedule */}
              <div style={s.sectionTitle}>Today's Schedule</div>
              {todayAppts.length === 0 ? (
                <div style={s.emptyState}>No appointments today</div>
              ) : (
                todayAppts.map((a, i) => (
                  <div key={i} style={s.scheduleRow}>
                    <div style={s.scheduleTime}>{a.time}</div>
                    <div style={s.scheduleInfo}>
                      <div style={s.scheduleClient}>{a.client}</div>
                      <div style={s.scheduleMeta}>{a.service} · {a.stylist}</div>
                    </div>
                    <div style={{ ...s.statusBadge, color: statusColor[a.status], background: statusBg[a.status] }}>{a.status}</div>
                  </div>
                ))
              )}

              {/* Stylist breakdown */}
              <div style={s.sectionTitle}>Stylist Load</div>
              <div style={s.stylistLoad}>
                {STYLISTS.map((st, i) => {
                  const count = appointments.filter(a => a.stylist === st.name).length;
                  const pct = Math.round((count / appointments.length) * 100);
                  return (
                    <div key={i} style={s.loadRow}>
                      <div style={s.loadName}>{st.emoji} {st.name}</div>
                      <div style={s.loadBar}>
                        <div style={{ ...s.loadFill, width: `${pct}%`, background: st.color }} />
                      </div>
                      <div style={{ ...s.loadPct, color: st.color }}>{count} appts</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input:focus, button:focus, textarea:focus { outline: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 4px; }
        input[type="date"]::-webkit-calendar-picker-indicator,
        input[type="time"]::-webkit-calendar-picker-indicator { filter: invert(1) opacity(0.5); }
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
  root: { minHeight: "100vh", background: "linear-gradient(135deg, #080810 0%, #100d1e 60%, #08100e 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif", position: "relative", overflow: "hidden", padding: 16 },
  blob1: { position: "fixed", top: "-5%", left: "-5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,92,252,0.15) 0%, transparent 70%)", pointerEvents: "none" },
  blob2: { position: "fixed", bottom: "-10%", right: "-5%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,110,80,0.1) 0%, transparent 70%)", pointerEvents: "none" },
  shell: { width: "100%", maxWidth: 720, height: "93vh", maxHeight: 880, display: "flex", flexDirection: "column", background: "rgba(255,255,255,0.04)", backdropFilter: "blur(28px)", borderRadius: 28, border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 40px 100px rgba(0,0,0,0.6)", overflow: "hidden", position: "relative", zIndex: 1 },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 22px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", flexShrink: 0 },
  brand: { display: "flex", alignItems: "center", gap: 10 },
  brandIcon: { width: 38, height: 38, borderRadius: 12, background: "linear-gradient(135deg, #ff6e50, #ff4eb4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, boxShadow: "0 4px 16px rgba(255,110,80,0.4)" },
  brandName: { fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 17, color: "#fff", letterSpacing: "-0.01em" },
  brandSub: { fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: "0.06em", marginTop: 1 },
  online: { display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "rgba(255,255,255,0.5)" },
  onlineDot: { display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: "#4eff91", boxShadow: "0 0 6px #4eff91", animation: "pulse 2.5s infinite" },
  tabBar: { display: "flex", padding: "0 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", gap: 2, overflowX: "auto", flexShrink: 0 },
  tab: { padding: "10px 14px", background: "transparent", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 13, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", borderBottom: "2px solid transparent", transition: "all 0.2s", marginBottom: -1, whiteSpace: "nowrap" },
  tabActive: { color: "#fff", borderBottomColor: "#ff6e50" },
  body: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  scrollArea: { flex: 1, overflowY: "auto", padding: "16px 18px" },

  // Chat
  chatArea: { flex: 1, overflowY: "auto", padding: "18px 18px 8px", display: "flex", flexDirection: "column", gap: 12 },
  row: { display: "flex", alignItems: "flex-end", gap: 8, animation: "fadeUp 0.3s ease" },
  avatar: { width: 30, height: 30, borderRadius: 9, flexShrink: 0, background: "linear-gradient(135deg, #ff6e50, #ff4eb4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 },
  userBub: { maxWidth: "72%", padding: "10px 14px", borderRadius: "16px 16px 4px 16px", background: "linear-gradient(135deg, #7c5cfc, #9b70ff)", color: "#fff", fontSize: 14, lineHeight: 1.55 },
  aiBub: { maxWidth: "78%", padding: "10px 14px", borderRadius: "16px 16px 16px 4px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)", fontSize: 14, lineHeight: 1.6 },
  d1: { fontSize: 10, marginRight: 3, animation: "d1 1.2s infinite" },
  d2: { fontSize: 10, marginRight: 3, animation: "d2 1.2s infinite" },
  d3: { fontSize: 10, animation: "d3 1.2s infinite" },
  quickWrap: { display: "flex", flexWrap: "wrap", gap: 6, padding: "8px 16px" },
  chip: { padding: "6px 12px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.65)", fontSize: 12, cursor: "pointer", transition: "all 0.2s", fontFamily: "'DM Sans', sans-serif" },
  inputRow: { display: "flex", gap: 8, padding: "10px 14px 14px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", flexShrink: 0 },
  input: { flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: "10px 14px", color: "#fff", fontSize: 14, fontFamily: "'DM Sans', sans-serif" },
  sendBtn: { width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #ff6e50, #ff4eb4)", border: "none", color: "#fff", fontSize: 15, cursor: "pointer", transition: "all 0.2s", boxShadow: "0 4px 12px rgba(255,110,80,0.35)" },

  // Intake
  intakeWrap: { maxWidth: 480, margin: "0 auto" },
  intakeHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  intakeTitle: { fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, color: "#fff" },
  stepDots: { display: "flex", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: "50%", transition: "background 0.3s" },
  formStep: { display: "flex", flexDirection: "column", gap: 14, animation: "fadeUp 0.3s ease" },
  stepLabel: { fontSize: 12, color: "#ff6e50", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 },
  fieldGroup: { display: "flex", flexDirection: "column", gap: 6 },
  fieldLabel: { fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 500 },
  field: { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "11px 14px", color: "#fff", fontSize: 14, fontFamily: "'DM Sans', sans-serif", width: "100%" },
  radioGroup: { display: "flex", flexWrap: "wrap", gap: 8 },
  radioBtn: { padding: "7px 14px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", fontSize: 13, cursor: "pointer", transition: "all 0.2s", fontFamily: "'DM Sans', sans-serif" },
  radioBtnActive: { background: "rgba(255,110,80,0.2)", borderColor: "#ff6e50", color: "#ff6e50" },
  serviceGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
  serviceOption: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "12px 8px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", cursor: "pointer", transition: "all 0.2s", fontFamily: "'DM Sans', sans-serif" },
  serviceOptionActive: { background: "rgba(255,110,80,0.15)", borderColor: "#ff6e50" },
  svcIcon: { fontSize: 22 },
  svcName: { fontSize: 12, color: "rgba(255,255,255,0.8)", fontWeight: 500, textAlign: "center" },
  svcPrice: { fontSize: 11, color: "#ff6e50" },
  stylistGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 },
  stylistOption: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "12px 6px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", cursor: "pointer", transition: "all 0.2s", fontFamily: "'DM Sans', sans-serif" },
  stylistOptionActive: { background: "rgba(255,110,80,0.1)" },
  stName: { fontSize: 12, color: "#fff", fontWeight: 600, textAlign: "center" },
  stRole: { fontSize: 10, textAlign: "center" },
  navRow: { display: "flex", justifyContent: "space-between", gap: 10, marginTop: 4 },
  nextBtn: { flex: 1, padding: "12px", borderRadius: 14, border: "none", background: "linear-gradient(135deg, #ff6e50, #ff4eb4)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", opacity: 1, transition: "opacity 0.2s" },
  backBtn: { padding: "12px 18px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "rgba(255,255,255,0.5)", fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" },
  successBox: { display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "40px 20px", textAlign: "center" },
  successIcon: { fontSize: 48 },
  successTitle: { fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 24, color: "#fff" },
  successSub: { fontSize: 14, color: "rgba(255,255,255,0.45)", maxWidth: 280, lineHeight: 1.5 },
  summaryCard: { width: "100%", maxWidth: 340, background: "rgba(255,255,255,0.06)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", padding: "16px", display: "flex", flexDirection: "column", gap: 10 },
  summaryRow: { display: "flex", justifyContent: "space-between" },
  summaryLabel: { fontSize: 12, color: "rgba(255,255,255,0.35)" },
  summaryVal: { fontSize: 13, color: "#fff", fontWeight: 500 },
  resetBtn: { padding: "11px 28px", borderRadius: 14, border: "none", background: "linear-gradient(135deg, #ff6e50, #ff4eb4)", color: "#fff", fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" },

  // Team
  teamGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: 16, overflowY: "auto" },
  stylistCard: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: "18px 14px", display: "flex", flexDirection: "column", alignItems: "center", gap: 5, transition: "transform 0.2s" },
  stylistAvatar: { width: 64, height: 64, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 },
  stylistName: { fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, color: "#fff" },
  stylistRole: { fontSize: 11, fontWeight: 500 },
  stylistSpec: { fontSize: 11, color: "rgba(255,255,255,0.35)", textAlign: "center" },
  bookBtn: { marginTop: 8, padding: "7px 16px", borderRadius: 10, border: "none", color: "#fff", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 500 },

  // Services
  serviceList: { overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 9 },
  serviceCard: { display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "13px 14px" },
  serviceIcon: { fontSize: 26, width: 42, height: 42, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.06)", borderRadius: 11, flexShrink: 0 },
  serviceInfo: { flex: 1 },
  serviceName: { fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, color: "#fff" },
  serviceDesc: { fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 },
  serviceMeta: { marginTop: 3 },
  serviceTime: { fontSize: 10, color: "rgba(255,255,255,0.3)" },
  serviceRight: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 },
  servicePrice: { fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, color: "#ff6e50" },
  bookSmall: { padding: "5px 12px", borderRadius: 9, border: "none", background: "linear-gradient(135deg, #ff6e50, #ff4eb4)", color: "#fff", fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" },

  // History
  historyHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  historyTitle: { fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: "#fff" },
  historyCount: { fontSize: 12, color: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.07)", padding: "4px 10px", borderRadius: 20 },
  apptCard: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "13px 14px", marginBottom: 8, gap: 10 },
  apptLeft: { display: "flex", flexDirection: "column", gap: 3 },
  apptClient: { fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, color: "#fff" },
  apptMeta: { fontSize: 12, color: "rgba(255,255,255,0.45)" },
  apptContact: { fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 2 },
  apptRight: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 },
  statusBadge: { padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, textTransform: "capitalize" },
  apptActions: { display: "flex", gap: 5 },
  confirmBtn: { padding: "5px 10px", borderRadius: 8, border: "none", background: "rgba(78,255,145,0.2)", color: "#4eff91", fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" },
  cancelBtn: { padding: "5px 8px", borderRadius: 8, border: "none", background: "rgba(255,110,80,0.15)", color: "#ff6e50", fontSize: 11, cursor: "pointer" },
  completeBtn: { padding: "5px 10px", borderRadius: 8, border: "none", background: "rgba(78,201,255,0.15)", color: "#4ec9ff", fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" },

  // Dashboard
  dashHeader: { marginBottom: 16 },
  dashTitle: { fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, color: "#fff" },
  dashSub: { fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2 },
  statsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 },
  statCard: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "16px 14px", display: "flex", flexDirection: "column", gap: 4 },
  statIcon: { fontSize: 22, marginBottom: 4 },
  statValue: { fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 26 },
  statLabel: { fontSize: 11, color: "rgba(255,255,255,0.35)" },
  sectionTitle: { fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, color: "#fff", marginBottom: 10, marginTop: 6 },
  emptyState: { fontSize: 13, color: "rgba(255,255,255,0.3)", textAlign: "center", padding: "20px 0" },
  scheduleRow: { display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "11px 13px", marginBottom: 7, border: "1px solid rgba(255,255,255,0.06)" },
  scheduleTime: { fontSize: 13, color: "#ff6e50", fontWeight: 600, width: 68, flexShrink: 0 },
  scheduleInfo: { flex: 1 },
  scheduleClient: { fontSize: 14, color: "#fff", fontWeight: 600 },
  scheduleMeta: { fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 },
  stylistLoad: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 },
  loadRow: { display: "flex", alignItems: "center", gap: 10 },
  loadName: { width: 100, fontSize: 13, color: "rgba(255,255,255,0.7)", flexShrink: 0 },
  loadBar: { flex: 1, height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 4, overflow: "hidden" },
  loadFill: { height: "100%", borderRadius: 4, transition: "width 0.6s ease" },
  loadPct: { fontSize: 12, fontWeight: 600, width: 56, textAlign: "right", flexShrink: 0 },
};
