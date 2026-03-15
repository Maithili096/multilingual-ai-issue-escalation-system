import { NavLink, Route, Routes, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000/analyze";

function loadTickets() {
  try {
    const t = localStorage.getItem("tickets_v1");
    return t ? JSON.parse(t) : [];
  } catch {
    return [];
  }
}
function saveTickets(tickets) {
  localStorage.setItem("tickets_v1", JSON.stringify(tickets));
}
function makeTicketId() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const n = Math.floor(1000 + Math.random() * 9000);
  return `TKT-${y}${m}${day}-${n}`;
}

function Layout({ children }) {
  return (
    <div className="appShell">
      <header className="nav">
        <div className="brand">Early-Warning Issue Intelligence</div>
        <nav className="links">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/report">Report Issue</NavLink>
          <NavLink to="/my-tickets">My Tickets</NavLink>
          <NavLink to="/dashboard">Admin Dashboard</NavLink>
          <NavLink to="/alerts">Alerts</NavLink>
          <NavLink to="/about">About Model</NavLink>
        </nav>
      </header>
      <main className="container">{children}</main>
    </div>
  );
}

/* 1) HOME */
function Home() {
  const nav = useNavigate();
  return (
    <div className="card">
      <h1>Multilingual Issue Analyzer & Early-Warning System</h1>
      <p className="muted">
        Citizens submit issues in Hindi/Marathi/English. The AI pipeline translates, categorizes,
        scores urgency, and helps authorities prioritize and detect early warnings.
      </p>
      <div className="row">
        <button className="btn primary" onClick={() => nav("/report")}>Citizen: Report Issue</button>
        <button className="btn" onClick={() => nav("/dashboard")}>Authority: Open Dashboard</button>
      </div>
    </div>
  );
}

/* 2) REPORT ISSUE */
function ReportIssue({ onNewTicket }) {
  const [text, setText] = useState("");
  const [city, setCity] = useState("Pune");
  const [area, setArea] = useState("Shivaji Nagar");
  const [source, setSource] = useState("Citizen App");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState(null);

  async function submit() {
    setErr("");
    setResult(null);

    const trimmed = text.trim();
    if (!trimmed) {
      setErr("Please enter issue text.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });
      if (!res.ok) throw new Error("API error");

      const data = await res.json();
      const ticket = {
        ticket_id: makeTicketId(),
        created_at: new Date().toISOString(),
        status: "New",
        city,
        area,
        source,
        input_text: trimmed,
        ...data,
      };
      setResult(ticket);
      onNewTicket(ticket);
    } catch {
      setErr("Backend not reachable (check FastAPI + CORS).");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid2">
      <div className="card">
        <h2>Report an Issue (Citizen)</h2>

        <div className="grid3">
          <div>
            <label>City</label>
            <input value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div>
            <label>Area</label>
            <input value={area} onChange={(e) => setArea(e.target.value)} />
          </div>
          <div>
            <label>Source</label>
            <input value={source} onChange={(e) => setSource(e.target.value)} />
          </div>
        </div>

        <label>Issue Text (Hindi/Marathi/English)</label>
        <textarea rows={6} value={text} onChange={(e) => setText(e.target.value)} />

        <div className="row">
          <button className="btn primary" onClick={submit} disabled={loading}>
            {loading ? "Analyzing..." : "Analyze & Submit"}
          </button>
          <button className="btn" onClick={() => { setText(""); setResult(null); setErr(""); }} disabled={loading}>
            Clear
          </button>
        </div>

        {err && <div className="alert">{err}</div>}
      </div>

      <div className="card">
        <h2>AI Output</h2>
        {!result ? (
          <p className="muted">Submit an issue to see analysis here.</p>
        ) : (
          <div className="kv">
            <p><b>Ticket ID:</b> {result.ticket_id}</p>
            <p><b>Status:</b> {result.status}</p>
            <p><b>Language:</b> {result.language}</p>
            <p><b>Category:</b> {result.issue_category}</p>
            <p><b>Urgency:</b> {result.urgency_score}</p>
            <p><b>Risk:</b> {result.risk_level}</p>
            <p><b>Translated:</b> {result.translated_text}</p>
            <p><b>Summary:</b> {result.summary}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* 3) MY TICKETS */
function MyTickets({ tickets, setTickets }) {
  const [q, setQ] = useState("");

  function updateStatus(id, status) {
    const next = tickets.map(t => t.ticket_id === id ? { ...t, status } : t);
    setTickets(next);
    saveTickets(next);
  }

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return tickets;
    return tickets.filter(t =>
      [t.ticket_id, t.input_text, t.summary, t.city, t.area, t.issue_category, t.risk_level]
        .join(" ")
        .toLowerCase()
        .includes(s)
    );
  }, [tickets, q]);

  return (
    <div className="card">
      <h2>My Tickets (Citizen)</h2>
      <input className="search" placeholder="Search tickets..." value={q} onChange={(e) => setQ(e.target.value)} />

      {filtered.length === 0 ? (
        <p className="muted">No tickets yet. Go to Report Issue.</p>
      ) : (
        <div className="list">
          {filtered.map(t => (
            <div key={t.ticket_id} className="item">
              <div className="itemTop">
                <b>{t.ticket_id}</b>
                <span className="muted">{new Date(t.created_at).toLocaleString()}</span>
              </div>
              <div className="muted">{t.city}, {t.area} • {t.source}</div>
              <div className="itemText">{t.input_text}</div>
              <div className="muted">Category: {t.issue_category} • Risk: {t.risk_level} • Urgency: {t.urgency_score}</div>

              <div className="row">
                <select value={t.status} onChange={(e) => updateStatus(t.ticket_id, e.target.value)}>
                  <option>New</option>
                  <option>In Review</option>
                  <option>Assigned</option>
                  <option>Resolved</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* 4) DASHBOARD */
function Dashboard({ tickets }) {
    const [fArea, setFArea] = useState("ALL");
  const [fRisk, setFRisk] = useState("ALL");
  const [search, setSearch] = useState("");

  const total = tickets.length;
  const high = tickets.filter(t => t.risk_level === "HIGH").length;
  const med = tickets.filter(t => t.risk_level === "MEDIUM").length;
  const low = tickets.filter(t => t.risk_level === "LOW").length;

   const areaOptions = useMemo(() => {
    const set = new Set(tickets.map(t => t.area).filter(Boolean));
    return ["ALL", ...Array.from(set).sort()];
  }, [tickets]);

    const filteredTickets = useMemo(() => {
    const q = search.trim().toLowerCase();

    return tickets.filter(t => {
      if (fArea !== "ALL" && t.area !== fArea) return false;
      if (fRisk !== "ALL" && t.risk_level !== fRisk) return false;

      if (!q) return true;

      const hay = [
        t.ticket_id,
        t.input_text,
        t.summary,
        t.city,
        t.area,
        t.issue_category,
        t.risk_level,
        t.language,
        t.source,
      ].join(" ").toLowerCase();

      return hay.includes(q);
    });
  }, [tickets, fArea, fRisk, search]);

  return (
    <div className="card">
      <h2>Admin Dashboard (Authority)</h2>
      <div className="filtersRow">
  <div className="field">
    <label>Search</label>
    <input
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="Search ticket, area, category..."
    />
  </div>

  <div className="field">
    <label>Risk</label>
    <select value={fRisk} onChange={(e) => setFRisk(e.target.value)}>
      <option value="ALL">ALL</option>
      <option value="HIGH">HIGH</option>
      <option value="MEDIUM">MEDIUM</option>
      <option value="LOW">LOW</option>
    </select>
  </div>

  <div className="field">
    <label>Area</label>
    <select value={fArea} onChange={(e) => setFArea(e.target.value)}>
      {areaOptions.map(a => (
        <option key={a} value={a}>{a}</option>
      ))}
    </select>
  </div>
</div>

      <div className="kpis">
        <div className="kpi"><div className="muted">Total</div><div className="big">{total}</div></div>
        <div className="kpi"><div className="muted">High</div><div className="big">{high}</div></div>
        <div className="kpi"><div className="muted">Medium</div><div className="big">{med}</div></div>
        <div className="kpi"><div className="muted">Low</div><div className="big">{low}</div></div>
      </div>

      <p className="muted">
        This page shows how authorities prioritize issues using risk and urgency generated by the AI pipeline.
      </p>

      <div className="list">
       {filteredTickets
          .slice()
          .sort((a, b) => (Number(b.urgency_score) || 0) - (Number(a.urgency_score) || 0))
          .map(t => (


            <div key={t.ticket_id} className={`item itemBorder${t.risk_level}`}>
              <div className="itemTop">
                <b>{t.ticket_id}</b>
                <span className="muted">
                  <span className={`riskBadge risk${t.risk_level}`}>{t.risk_level}</span>
                  {" "}• {t.issue_category}
                </span>

              </div>
              <div className="muted">{t.city}, {t.area} • {new Date(t.created_at).toLocaleString()}</div>
              <div className="itemText">{t.summary}</div>
            </div>
        ))}
      </div>
    </div>
  );
}

/* 5) ALERTS */
function Alerts({ tickets }) {
  const alerts = useMemo(() => {
    const out = [];

    // A) High-risk incidents (immediate escalation)
    const high = tickets.filter(t => t.risk_level === "HIGH");
    if (high.length) {
      out.push({
        type: "CRITICAL",
        title: `Critical: ${high.length} HIGH-risk issue(s)`,
        detail: "Immediate escalation required (emergency response / priority handling).",
        action: "Escalate to emergency team",
      });
    }

    // B) Area spike detection (early warning)
    // Rule: If >= 3 issues from same area -> spike
    const areaCount = new Map();
    for (const t of tickets) {
      const key = `${t.city}__${t.area}`;
      areaCount.set(key, (areaCount.get(key) || 0) + 1);
    }
    for (const [key, count] of areaCount.entries()) {
      if (count >= 3) {
        const [city, area] = key.split("__");
        out.push({
          type: "SPIKE",
          title: `Spike detected: ${count} complaints from ${area}, ${city}`,
          detail: "Possible localized incident/outage. Investigate and coordinate field team.",
          action: "Create area-level incident ticket",
        });
      }
    }

    // C) Category surge detection (e.g., water issues rising)
    // Rule: If any category count >= 4 -> surge
    const catCount = new Map();
    for (const t of tickets) {
      const cat = t.issue_category || "Other";
      catCount.set(cat, (catCount.get(cat) || 0) + 1);
    }
    for (const [cat, count] of catCount.entries()) {
      if (count >= 4) {
        out.push({
          type: "SURGE",
          title: `Surge: ${cat} complaints rising (${count})`,
          detail: "Early warning of systemic issue. Consider preventive measures and public updates.",
          action: "Notify department & publish advisory",
        });
      }
    }

    // D) Unresolved backlog alert
    const open = tickets.filter(t => t.status !== "Resolved");
    if (open.length >= 8) {
      out.push({
        type: "BACKLOG",
        title: `Backlog warning: ${open.length} open tickets`,
        detail: "Resolution capacity may be insufficient. Assign more staff or prioritize HIGH risk.",
        action: "Re-assign & prioritize queue",
      });
    }

    // Sort alerts by severity order
    const priority = { CRITICAL: 1, SPIKE: 2, SURGE: 3, BACKLOG: 4 };
    out.sort((a, b) => (priority[a.type] || 9) - (priority[b.type] || 9));

    return out;
  }, [tickets]);

  function alertClass(type) {
    if (type === "CRITICAL") return "alertCard critical";
    if (type === "SPIKE") return "alertCard spike";
    if (type === "SURGE") return "alertCard surge";
    return "alertCard backlog";
  }

  return (
    <div className="card">
      <h2>Alerts / Early Warnings</h2>
      <p className="muted">
        This page simulates an early-warning layer using rule thresholds on AI outputs (risk, category, and location patterns).
      </p>

      {alerts.length === 0 ? (
        <div className="emptyBox">
          <b>No alerts currently.</b>
          <div className="muted">Submit multiple issues from the same area to trigger spike alerts.</div>
        </div>
      ) : (
        <div className="list">
          {alerts.map((a, i) => (
            <div key={i} className={alertClass(a.type)}>
              <div className="alertTop">
                <b>{a.title}</b>
                <span className={`pillTag ${a.type.toLowerCase()}`}>{a.type}</span>
              </div>
              <div className="muted">{a.detail}</div>
              <div className="alertActionRow">
                <span className="muted"><b>Recommended Action:</b> {a.action}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


/* 6) ABOUT */
function About() {
  return (
    <div className="card">
      <h2>System Architecture & AI Pipeline</h2>

      <div className="archGrid">
        <div className="archBox">
          <div className="archTitle">Citizen UI (React)</div>
          <div className="muted">
            User submits complaint in Hindi/Marathi/English.
            UI sends request to FastAPI and displays AI output.
          </div>
        </div>

        <div className="archArrow">↓</div>

        <div className="archBox">
          <div className="archTitle">FastAPI Inference Layer</div>
          <div className="muted">
            Receives text, detects language, translates to English, classifies category,
            computes urgency score, and assigns risk label.
          </div>
        </div>

        <div className="archArrow">↓</div>

        <div className="archBox">
          <div className="archTitle">Structured Output</div>
          <ul className="muted">
            <li>Language: hi / mr / en</li>
            <li>Translated Text (English)</li>
            <li>Issue Category (Water/Road/Electricity/...)</li>
            <li>Urgency Score (0 to 1)</li>
            <li>Risk Level (LOW/MEDIUM/HIGH)</li>
            <li>Summary</li>
          </ul>
        </div>

        <div className="archArrow">↓</div>

        <div className="archBox">
          <div className="archTitle">Early Warning Layer (React Dashboard)</div>
          <div className="muted">
            Monitors live stream of tickets. Triggers warnings based on:
            HIGH-risk events, area spikes, category surges, and backlog.
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 12, background: "#0e1530" }}>
        <h3 style={{ marginTop: 0 }}>Why this qualifies as AI/ML Integration</h3>
        <ol className="muted">
          <li>Frontend sends real-time input to backend.</li>
          <li>Backend performs NLP pipeline (language + translation + classification + scoring).</li>
          <li>Frontend visualizes AI outputs and uses them for alerts/monitoring.</li>
        </ol>
      </div>
    </div>
  );
}


export default function App() {
  const [tickets, setTickets] = useState(loadTickets());

  function onNewTicket(ticket) {
    const next = [ticket, ...tickets].slice(0, 200);
    setTickets(next);
    saveTickets(next);
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/report" element={<ReportIssue onNewTicket={onNewTicket} />} />
        <Route path="/my-tickets" element={<MyTickets tickets={tickets} setTickets={setTickets} />} />
        <Route path="/dashboard" element={<Dashboard tickets={tickets} />} />
        <Route path="/alerts" element={<Alerts tickets={tickets} />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </Layout>
  );
}
