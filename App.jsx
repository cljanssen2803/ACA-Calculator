import { useState, useEffect } from "react";

const COLORS = {
  teal: "#2A7A6F",
  tealDark: "#1B5C53",
  tealDeep: "#0F3D37",
  tealLight: "#E6F4F2",
  tealMid: "#4A9E92",
  white: "#FFFFFF",
  offWhite: "#F5FAFA",
  text: "#1A2E2B",
  textLight: "#4A6260",
  border: "#B8D9D5",
  warning: "#E07B39",
  warningLight: "#FEF3EC",
  success: "#2A7A6F",
  successLight: "#E6F4F2",
  error: "#C0392B",
  errorLight: "#FDECEA",
  gray: "#8FA8A5",
};

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function addWeeks(date, weeks) {
  const d = new Date(date);
  d.setDate(d.getDate() + weeks * 7);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function fmt(date) {
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function diffWeeks(d1, d2) {
  return Math.round((d2 - d1) / (7 * 24 * 60 * 60 * 1000));
}

function getSMP(date) {
  const month = date.getMonth(); // 0-indexed
  if (month <= 5) {
    return {
      label: "January–June",
      start: new Date(date.getFullYear(), 0, 1),
      end: new Date(date.getFullYear(), 5, 30),
    };
  } else {
    return {
      label: "July–December",
      start: new Date(date.getFullYear(), 6, 1),
      end: new Date(date.getFullYear(), 11, 31),
    };
  }
}

function calcNewHire(hireDate, avgHours) {
  const hire = new Date(hireDate);

  if (avgHours >= 30) {
    return {
      type: "full_time",
      result: "offer_at_hire",
      hireDate: hire,
      offerDate: hire,
      notes: "Employee is expected to average 30+ hours/week. Benefits must be offered at hire.",
      flags: [{ type: "action", text: "Offer health insurance at time of hire" }],
    };
  }

  const impEnd = addMonths(hire, 3);
  const ispEnd = addMonths(hire, 6);
  const offerDeadline = addMonths(hire, 7); // ~1 month admin after ISP

  const today = new Date();
  const daysUntilOffer = Math.round((offerDeadline - today) / (1000 * 60 * 60 * 24));

  const flags = [];
  if (daysUntilOffer <= 30 && daysUntilOffer > 0) {
    flags.push({ type: "urgent", text: `Offer deadline in ${daysUntilOffer} days — act now` });
  } else if (daysUntilOffer <= 0) {
    flags.push({ type: "overdue", text: "Offer window may have passed — review immediately" });
  }

  return {
    type: "variable",
    result: "measurement_required",
    hireDate: hire,
    impEnd,
    ispEnd,
    offerDeadline,
    daysUntilOffer,
    notes: "Variable-hour hire. Employee must be measured during the Initial Measurement Period.",
    flags,
    timeline: [
      { label: "Hire Date", date: hire, desc: "Clock starts" },
      { label: "IMP Ends", date: impEnd, desc: "Initial Measurement Period closes (3 mo)" },
      { label: "ISP Ends", date: ispEnd, desc: "Initial Stability Period ends (6 mo)" },
      { label: "Offer Deadline", date: offerDeadline, desc: "~1 mo admin period; offer coverage by this date if eligible" },
    ],
  };
}

function calcOngoing(lastSMPStart) {
  const today = new Date();
  const smp = getSMP(today);
  const adminEnd = addMonths(smp.end, 1);
  const stabilityStart = addDays(adminEnd, 1);
  const stabilityEnd = addMonths(stabilityStart, 6);

  return {
    type: "ongoing",
    smp,
    adminEnd,
    stabilityStart,
    stabilityEnd,
    today,
    timeline: [
      { label: "Current SMP", date: smp.start, dateEnd: smp.end, desc: `Standard Measurement Period: ${smp.label}` },
      { label: "Admin Period Ends", date: adminEnd, desc: "~1 month after SMP close; finalize eligibility determinations" },
      { label: "Stability Period Starts", date: stabilityStart, desc: "Coverage offer must be in place" },
      { label: "Stability Period Ends", date: stabilityEnd, desc: "6-month stability window closes" },
    ],
  };
}

function calcBreakInService(returnDate, breakWeeks) {
  const weeks = parseInt(breakWeeks);
  let outcome, detail, treatment;

  if (weeks < 4) {
    outcome = "no_break";
    detail = "Less than 4 weeks — no break in service recognized.";
    treatment = "Employee retains prior hours of service. Continue prior measurement period.";
  } else if (weeks < 13) {
    outcome = "parity";
    detail = `${weeks} weeks — parity rule applies.`;
    treatment = "Break cannot exceed length of prior employment period. If it does, treat as new employee. Otherwise, retain prior credited hours.";
  } else {
    outcome = "new_employee";
    detail = "13+ weeks — treated as a new employee.";
    treatment = "Restart IMP/ISP process from return date. Apply new hire ACA rules.";
  }

  return { outcome, detail, treatment, weeks };
}

const Badge = ({ type, text }) => {
  const styles = {
    action: { bg: COLORS.tealLight, color: COLORS.tealDark, border: COLORS.border },
    urgent: { bg: COLORS.warningLight, color: COLORS.warning, border: "#F0C090" },
    overdue: { bg: COLORS.errorLight, color: COLORS.error, border: "#F5C6C2" },
    info: { bg: COLORS.offWhite, color: COLORS.textLight, border: COLORS.border },
  };
  const s = styles[type] || styles.info;
  return (
    <div style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      borderRadius: 6, padding: "7px 12px", fontSize: 13, fontWeight: 600,
      display: "inline-block", marginTop: 6,
    }}>
      {type === "urgent" ? "⚠ " : type === "overdue" ? "🔴 " : type === "action" ? "✓ " : ""}
      {text}
    </div>
  );
};

const TimelineRow = ({ item, index }) => (
  <div style={{ display: "flex", gap: 16, marginBottom: 4 }}>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 20 }}>
      <div style={{
        width: 12, height: 12, borderRadius: "50%", background: COLORS.teal,
        border: `2px solid ${COLORS.tealMid}`, marginTop: 3, flexShrink: 0,
      }} />
      {index !== undefined && <div style={{ width: 2, flexGrow: 1, background: COLORS.border, marginTop: 2 }} />}
    </div>
    <div style={{ paddingBottom: 14 }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: COLORS.tealDark }}>{item.label}</div>
      <div style={{ fontSize: 13, color: COLORS.text, fontWeight: 600 }}>
        {fmt(item.date)}{item.dateEnd ? ` – ${fmt(item.dateEnd)}` : ""}
      </div>
      <div style={{ fontSize: 12, color: COLORS.textLight, marginTop: 1 }}>{item.desc}</div>
    </div>
  </div>
);

const Card = ({ children, style = {} }) => (
  <div style={{
    background: COLORS.white, borderRadius: 12, border: `1px solid ${COLORS.border}`,
    boxShadow: "0 2px 12px rgba(42,122,111,0.07)", padding: 24, ...style,
  }}>
    {children}
  </div>
);

const Label = ({ children }) => (
  <label style={{ display: "block", fontWeight: 600, fontSize: 13, color: COLORS.tealDark, marginBottom: 6, letterSpacing: 0.3 }}>
    {children}
  </label>
);

const Input = ({ ...props }) => (
  <input {...props} style={{
    width: "100%", padding: "10px 14px", borderRadius: 8,
    border: `1.5px solid ${COLORS.border}`, fontSize: 14, color: COLORS.text,
    background: COLORS.offWhite, outline: "none", boxSizing: "border-box",
    fontFamily: "inherit",
    ...props.style,
  }} />
);

const Select = ({ children, ...props }) => (
  <select {...props} style={{
    width: "100%", padding: "10px 14px", borderRadius: 8,
    border: `1.5px solid ${COLORS.border}`, fontSize: 14, color: COLORS.text,
    background: COLORS.offWhite, outline: "none", boxSizing: "border-box",
    fontFamily: "inherit", appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%232A7A6F' d='M6 8L0 0h12z'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center",
    ...props.style,
  }}>
    {children}
  </select>
);

const Button = ({ children, onClick, variant = "primary", disabled }) => (
  <button onClick={onClick} disabled={disabled} style={{
    background: variant === "primary" ? COLORS.teal : COLORS.white,
    color: variant === "primary" ? COLORS.white : COLORS.teal,
    border: `2px solid ${COLORS.teal}`,
    borderRadius: 8, padding: "11px 24px", fontSize: 14, fontWeight: 700,
    cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit",
    opacity: disabled ? 0.5 : 1, letterSpacing: 0.3,
    transition: "all 0.15s",
  }}>
    {children}
  </button>
);

function ResultPanel({ result }) {
  if (!result) return null;

  if (result.type === "full_time") {
    return (
      <Card style={{ borderLeft: `4px solid ${COLORS.teal}`, marginTop: 20 }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: COLORS.tealDark, marginBottom: 8 }}>
          Full-Time / Benefits-Eligible at Hire
        </div>
        <p style={{ fontSize: 14, color: COLORS.text, margin: "0 0 12px" }}>{result.notes}</p>
        <Badge type="action" text="Offer health insurance at time of hire" />
      </Card>
    );
  }

  if (result.type === "variable") {
    return (
      <Card style={{ borderLeft: `4px solid ${COLORS.tealMid}`, marginTop: 20 }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: COLORS.tealDark, marginBottom: 4 }}>
          Variable-Hour New Hire — Measurement Required
        </div>
        <p style={{ fontSize: 13, color: COLORS.textLight, margin: "0 0 16px" }}>{result.notes}</p>
        {result.flags.map((f, i) => <Badge key={i} type={f.type} text={f.text} />)}
        <div style={{ marginTop: 20, borderTop: `1px solid ${COLORS.border}`, paddingTop: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: COLORS.gray, letterSpacing: 1, marginBottom: 12, textTransform: "uppercase" }}>
            Timeline
          </div>
          {result.timeline.map((item, i) => (
            <TimelineRow key={i} item={item} index={i < result.timeline.length - 1 ? i : undefined} />
          ))}
        </div>
        {result.daysUntilOffer > 0 && (
          <div style={{
            marginTop: 12, background: COLORS.tealLight, borderRadius: 8,
            padding: "10px 14px", fontSize: 13, color: COLORS.tealDark, fontWeight: 600,
          }}>
            {result.daysUntilOffer} days until offer deadline
          </div>
        )}
      </Card>
    );
  }

  if (result.type === "ongoing") {
    return (
      <Card style={{ borderLeft: `4px solid ${COLORS.tealMid}`, marginTop: 20 }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: COLORS.tealDark, marginBottom: 4 }}>
          Ongoing Employee — Current Period: {result.smp.label}
        </div>
        <p style={{ fontSize: 13, color: COLORS.textLight, margin: "0 0 16px" }}>
          Based on today's date, here are the active measurement and stability windows.
        </p>
        <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: COLORS.gray, letterSpacing: 1, marginBottom: 12, textTransform: "uppercase" }}>
            Timeline
          </div>
          {result.timeline.map((item, i) => (
            <TimelineRow key={i} item={item} index={i < result.timeline.length - 1 ? i : undefined} />
          ))}
        </div>
      </Card>
    );
  }

  if (result.type === "break") {
    const outcomeColor = result.outcome === "no_break" ? COLORS.success : result.outcome === "parity" ? COLORS.warning : COLORS.error;
    const outcomeLight = result.outcome === "no_break" ? COLORS.successLight : result.outcome === "parity" ? COLORS.warningLight : COLORS.errorLight;
    return (
      <Card style={{ borderLeft: `4px solid ${outcomeColor}`, marginTop: 20 }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: COLORS.tealDark, marginBottom: 8 }}>
          Break-in-Service: {result.weeks} Weeks
        </div>
        <div style={{ background: outcomeLight, borderRadius: 8, padding: "12px 14px", marginBottom: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: outcomeColor }}>{result.detail}</div>
          <div style={{ fontSize: 13, color: COLORS.text, marginTop: 4 }}>{result.treatment}</div>
        </div>
        {result.outcome === "new_employee" && (
          <Badge type="urgent" text="Restart IMP/ISP — use New Hire calculator above" />
        )}
      </Card>
    );
  }

  return null;
}

export default function App() {
  const [mode, setMode] = useState("new_hire");
  const [hireDate, setHireDate] = useState("");
  const [avgHours, setAvgHours] = useState("");
  const [breakWeeks, setBreakWeeks] = useState("");
  const [result, setResult] = useState(null);
  const [tab, setTab] = useState("new_hire");

  const handleCalc = () => {
    if (tab === "new_hire") {
      if (!hireDate || !avgHours) return;
      setResult(calcNewHire(hireDate, parseFloat(avgHours)));
    } else if (tab === "ongoing") {
      setResult(calcOngoing());
    } else if (tab === "break") {
      if (!breakWeeks) return;
      setResult({ type: "break", ...calcBreakInService(null, breakWeeks) });
    }
  };

  const tabs = [
    { id: "new_hire", label: "New Hire" },
    { id: "ongoing", label: "Ongoing Employee" },
    { id: "break", label: "Break in Service" },
  ];

  return (
    <div style={{
      minHeight: "100vh", background: COLORS.offWhite, fontFamily: "'Georgia', serif",
    }}>
      {/* Header */}
      <div style={{
        background: COLORS.tealDeep,
        padding: "0",
      }}>
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "20px 24px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 10,
              background: COLORS.teal, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, flexShrink: 0,
            }}>
              🏥
            </div>
            <div>
              <div style={{ fontSize: 11, color: COLORS.tealMid, letterSpacing: 2, textTransform: "uppercase", fontFamily: "sans-serif", fontWeight: 600 }}>
                Wabash Center — HR Tools
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.white, lineHeight: 1.2 }}>
                ACA Eligibility Calculator
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 2 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => { setTab(t.id); setResult(null); }} style={{
                background: tab === t.id ? COLORS.white : "transparent",
                color: tab === t.id ? COLORS.tealDark : COLORS.tealMid,
                border: "none", borderRadius: "8px 8px 0 0",
                padding: "9px 18px", fontSize: 13, fontWeight: 700,
                cursor: "pointer", fontFamily: "sans-serif", letterSpacing: 0.2,
                transition: "all 0.15s",
              }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 24px 48px" }}>

        {tab === "new_hire" && (
          <Card>
            <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.tealDark, marginBottom: 4 }}>New Hire Eligibility</div>
            <p style={{ fontSize: 13, color: COLORS.textLight, margin: "0 0 20px", lineHeight: 1.6 }}>
              Enter the hire date and expected average weekly hours. If 30+, coverage must be offered at hire. Variable-hour employees enter the IMP/ISP track.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div>
                <Label>Hire Date</Label>
                <Input type="date" value={hireDate} onChange={e => setHireDate(e.target.value)} />
              </div>
              <div>
                <Label>Avg Weekly Hours (Expected)</Label>
                <Input
                  type="number" placeholder="e.g. 25"
                  value={avgHours} onChange={e => setAvgHours(e.target.value)}
                  min={0} max={60} step={0.5}
                />
              </div>
            </div>

            <Button onClick={handleCalc} disabled={!hireDate || !avgHours}>
              Calculate Eligibility →
            </Button>
          </Card>
        )}

        {tab === "ongoing" && (
          <Card>
            <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.tealDark, marginBottom: 4 }}>Ongoing Employee Periods</div>
            <p style={{ fontSize: 13, color: COLORS.textLight, margin: "0 0 20px", lineHeight: 1.6 }}>
              Calculates the current Standard Measurement Period, admin window, and stability period based on today's date and Wabash's Jan–Jun / Jul–Dec SMP structure.
            </p>
            <Button onClick={handleCalc}>Show Current Period Dates →</Button>
          </Card>
        )}

        {tab === "break" && (
          <Card>
            <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.tealDark, marginBottom: 4 }}>Break-in-Service Rules</div>
            <p style={{ fontSize: 13, color: COLORS.textLight, margin: "0 0 20px", lineHeight: 1.6 }}>
              Enter the length of the break (in weeks) to determine whether it counts as a break in service and how the employee should be treated upon return.
            </p>

            <div style={{ marginBottom: 20, maxWidth: 240 }}>
              <Label>Break Length (Weeks)</Label>
              <Input
                type="number" placeholder="e.g. 6"
                value={breakWeeks} onChange={e => setBreakWeeks(e.target.value)}
                min={1} max={52}
              />
            </div>

            <div style={{
              background: COLORS.tealLight, borderRadius: 8, padding: "12px 14px",
              marginBottom: 20, fontSize: 12, color: COLORS.tealDark, lineHeight: 1.7,
            }}>
              <strong>Quick Reference:</strong><br />
              &lt;4 weeks → No break recognized<br />
              4–12 weeks → Parity rule applies<br />
              13+ weeks → Treated as new employee
            </div>

            <Button onClick={handleCalc} disabled={!breakWeeks}>Apply Rules →</Button>
          </Card>
        )}

        <ResultPanel result={result} />

        {/* Footer note */}
        <div style={{
          marginTop: 28, padding: "12px 16px",
          background: COLORS.white, borderRadius: 8, border: `1px solid ${COLORS.border}`,
          fontSize: 11, color: COLORS.gray, lineHeight: 1.6, fontFamily: "sans-serif",
        }}>
          <strong>Note:</strong> This tool reflects Wabash Center's internal ACA measurement thresholds (IMP 3 mo, ISP 6 mo, SMP Jan–Jun / Jul–Dec, Stability 6 mo). Always confirm edge cases with HR leadership or benefits counsel. Not legal advice.
        </div>
      </div>
    </div>
  );
}
