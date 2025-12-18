// src/pages/ConsultationPage.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

type ClientRow = {
  id: string;
  user_email: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_at?: string | null;
};

type ConsultationRow = {
  id: string;
  user_email: string;
  client_id: string | null;
  client_name: string | null;
  client_phone: string | null;

  // IMPORTANT: match your Supabase columns (no "notes" column)
  client_notes: string | null;       // voice notes
  hair_history: string | null;       // cut details
  products_used: string | null;      // formulas/technical
  lifestyle_notes: string | null;    // aftercare
  extra_notes: string | null;        // extra typed notes
  hair_goals: string | null;         // goals
  ai_summary: string | null;

  visit_date: string | null;
  created_at?: string | null;
};

declare global {
  interface Window {
    webkitSpeechRecognition?: any;
    SpeechRecognition?: any;
  }
}

const ConsultationPage: React.FC = () => {
  const navigate = useNavigate();

  // ---------- Auth ----------
  const [userEmail, setUserEmail] = useState<string>("");

  // ---------- Client ----------
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");

  // ---------- Consultation inputs ----------
  const [serviceType, setServiceType] = useState("");
  const [voiceNotes, setVoiceNotes] = useState("");     // talk-to-text result (and editable)
  const [cutDetails, setCutDetails] = useState("");     // guards, taper/fade, etc (saved to hair_history)
  const [formulas, setFormulas] = useState("");         // saved to products_used
  const [aftercare, setAftercare] = useState("");       // saved to lifestyle_notes
  const [hairGoals, setHairGoals] = useState("");       // saved to hair_goals
  const [extraNotes, setExtraNotes] = useState("");     // saved to extra_notes

  // ---------- Memory ----------
  const [lastVisit, setLastVisit] = useState<ConsultationRow | null>(null);
  const [loadingMemory, setLoadingMemory] = useState(false);

  // ---------- Generated output ----------
  const [hasSummary, setHasSummary] = useState(false);
  const [clientSummary, setClientSummary] = useState("");
  const [stylistSheet, setStylistSheet] = useState("");

  // ---------- Status ----------
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  // ---------- Voice (Speech API) ----------
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const canUseSpeech = useMemo(() => {
    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  }, []);

  const cleanClientName = useMemo(() => clientName.trim(), [clientName]);

  // ---------- Helpers ----------
  const safeTrim = (v: string) => (v || "").trim();

  const buildClientSummary = (previous?: ConsultationRow | null) => {
    const name = safeTrim(clientName) || "this client";
    const svc = safeTrim(serviceType) || "a hair service";

    const prevBlock = previous
      ? `Last time (${previous.visit_date ? new Date(previous.visit_date).toLocaleString() : "unknown date"}):
- Cut details: ${previous.hair_history || "N/A"}
- Formulas: ${previous.products_used || "N/A"}
- Aftercare: ${previous.lifestyle_notes || "N/A"}
- Goals: ${previous.hair_goals || "N/A"}`
      : "No prior visit found yet.";

    const nowBlock = `Today’s plan:
- Service: ${svc}
- Cut details: ${safeTrim(cutDetails) || "N/A"}
- Formulas/technical: ${safeTrim(formulas) || "N/A"}
- Aftercare: ${safeTrim(aftercare) || "N/A"}
- Goals: ${safeTrim(hairGoals) || "N/A"}

Notes:
${safeTrim(voiceNotes) || safeTrim(extraNotes) ? "" : "- (none)"}
${safeTrim(voiceNotes) ? `- Voice: ${safeTrim(voiceNotes)}` : ""}
${safeTrim(extraNotes) ? `- Extra: ${safeTrim(extraNotes)}` : ""}`.trim();

    return `
${name} is booked for: ${svc}.

${prevBlock}

${nowBlock}
`.trim();
  };

  const buildStylistSheet = (previous?: ConsultationRow | null) => {
    const name = safeTrim(clientName) || "N/A";
    const svc = safeTrim(serviceType) || "N/A";

    const prev = previous
      ? `
LAST VISIT:
- Date: ${previous.visit_date ? new Date(previous.visit_date).toLocaleString() : "unknown"}
- Cut details: ${previous.hair_history || "N/A"}
- Formulas: ${previous.products_used || "N/A"}
- Aftercare: ${previous.lifestyle_notes || "N/A"}
- Goals: ${previous.hair_goals || "N/A"}
`
      : `
LAST VISIT:
- None found yet.
`;

    const today = `
TODAY:
- Service: ${svc}
- Cut details: ${safeTrim(cutDetails) || "N/A"}
- Formulas/technical: ${safeTrim(formulas) || "N/A"}
- Aftercare: ${safeTrim(aftercare) || "N/A"}
- Goals: ${safeTrim(hairGoals) || "N/A"}

NOTES:
${safeTrim(voiceNotes) ? `Voice: ${safeTrim(voiceNotes)}` : "Voice: (none)"}
${safeTrim(extraNotes) ? `Extra: ${safeTrim(extraNotes)}` : "Extra: (none)"}
`.trim();

    return `
Client: ${name}
Phone: ${safeTrim(clientPhone) || "N/A"}
Email: ${safeTrim(clientEmail) || "N/A"}

${prev}
${today}
`.trim();
  };

  const getAuthedUserEmail = async (): Promise<string> => {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    const email = data.user?.email;
    if (!email) throw new Error("No logged-in user email found. Please log in again.");
    return email;
  };

  const getOrCreateClient = async (email: string): Promise<ClientRow> => {
    const name = safeTrim(clientName);
    if (!name) throw new Error("Client name is required.");

    // Find existing client (exact match). Your unique index is (user_email, lower(name)),
    // but eq(name, name) is fine because duplicates are blocked at DB level.
    const { data: existing, error: findErr } = await supabase
      .from("clients")
      .select("*")
      .eq("user_email", email)
      .ilike("name", name)
      .limit(1)
      .maybeSingle();

    if (findErr) throw findErr;

    if (existing?.id) {
      // If user typed new phone/email, update the client record (optional but helpful)
      const nextPhone = safeTrim(clientPhone) || existing.phone || null;
      const nextEmail = safeTrim(clientEmail) || existing.email || null;

      if (nextPhone !== existing.phone || nextEmail !== existing.email) {
        const { data: updated, error: updErr } = await supabase
          .from("clients")
          .update({ phone: nextPhone, email: nextEmail })
          .eq("id", existing.id)
          .select("*")
          .single();
        if (updErr) throw updErr;
        return updated as ClientRow;
      }

      return existing as ClientRow;
    }

    // Create new
    const { data: created, error: createErr } = await supabase
      .from("clients")
      .insert([
        {
          user_email: email,
          name,
          phone: safeTrim(clientPhone) || null,
          email: safeTrim(clientEmail) || null,
          notes: null,
        },
      ])
      .select("*")
      .single();

    if (createErr) throw createErr;
    return created as ClientRow;
  };

  const loadLastVisitForClient = async (email: string, clientId: string) => {
    const { data, error } = await supabase
      .from("consultations")
      .select(
        "id,user_email,client_id,client_name,client_phone,client_notes,hair_history,products_used,lifestyle_notes,extra_notes,hair_goals,ai_summary,visit_date,created_at"
      )
      .eq("user_email", email)
      .eq("client_id", clientId)
      .order("visit_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return (data || null) as ConsultationRow | null;
  };

  const updateClientMemory = async (clientId: string, memoryText: string) => {
    const { error } = await supabase.from("clients").update({ notes: memoryText }).eq("id", clientId);
    if (error) throw error;
  };

  // ---------- Init: load session email ----------
  useEffect(() => {
    const init = async () => {
      try {
        const email = await getAuthedUserEmail();
        setUserEmail(email);
      } catch (e: any) {
        setErrorMsg(e?.message || "Failed to load session.");
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Voice setup ----------
  useEffect(() => {
    if (!canUseSpeech) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += transcript + " ";
      }
      if (finalText.trim()) {
        setVoiceNotes((prev) => (prev ? `${prev} ` : "") + finalText.trim());
      }
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
  }, [canUseSpeech]);

  const startListening = () => {
    setErrorMsg("");
    setStatusMsg("");
    if (!canUseSpeech) {
      setErrorMsg("Voice notes not supported in this browser. Try Chrome/Edge.");
      return;
    }
    try {
      recognitionRef.current?.start();
      setListening(true);
    } catch {
      setListening(true);
    }
  };

  const stopListening = () => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    } finally {
      setListening(false);
    }
  };

  // ---------- Auto-load memory when typing a client name (debounced) ----------
  useEffect(() => {
    const t = setTimeout(async () => {
      if (!safeTrim(clientName) || safeTrim(clientName).length < 2) return;

      setLoadingMemory(true);
      setErrorMsg("");
      setStatusMsg("");

      try {
        const email = userEmail || (await getAuthedUserEmail());

        // Find client by name
        const { data: client, error: cErr } = await supabase
          .from("clients")
          .select("*")
          .eq("user_email", email)
          .ilike("name", safeTrim(clientName))
          .limit(1)
          .maybeSingle();

        if (cErr) throw cErr;
        if (!client?.id) {
          setLastVisit(null);
          setLoadingMemory(false);
          return;
        }

        // Prefill contact info only if blank
        if (client.phone && !safeTrim(clientPhone)) setClientPhone(client.phone);
        if (client.email && !safeTrim(clientEmail)) setClientEmail(client.email);

        // Prefill long-term notes only if user hasn't started typing extraNotes
        if (client.notes && !safeTrim(extraNotes)) setExtraNotes(client.notes);

        const prev = await loadLastVisitForClient(email, client.id as string);
        setLastVisit(prev);

        // Prefill last-visit details only if blanks
        if (prev) {
          if (prev.hair_history && !safeTrim(cutDetails)) setCutDetails(prev.hair_history);
          if (prev.products_used && !safeTrim(formulas)) setFormulas(prev.products_used);
          if (prev.lifestyle_notes && !safeTrim(aftercare)) setAftercare(prev.lifestyle_notes);
          if (prev.hair_goals && !safeTrim(hairGoals)) setHairGoals(prev.hair_goals);
        }

        setStatusMsg(prev ? "Loaded last visit + saved memory." : "Loaded saved client memory.");
      } catch (e: any) {
        setErrorMsg(e?.message || "Failed to load client memory.");
      } finally {
        setLoadingMemory(false);
      }
    }, 500);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientName]);

  // ---------- Save + Generate ----------
  const handleSaveAndGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");
    setStatusMsg("");

    try {
      const email = userEmail || (await getAuthedUserEmail());
      setUserEmail(email);

      // 1) Ensure client exists
      const client = await getOrCreateClient(email);

      // 2) Get previous visit for better summaries
      const prev = await loadLastVisitForClient(email, client.id);

      // 3) Generate output
      const summary = buildClientSummary(prev);
      const techSheet = buildStylistSheet(prev);
      setClientSummary(summary);
      setStylistSheet(techSheet);
      setHasSummary(true);

      // 4) Insert consultation with correct DB columns (NO "notes")
      const insertPayload = {
        user_email: email,
        client_id: client.id,
        client_name: safeTrim(clientName) || null,
        client_phone: safeTrim(clientPhone) || null,

        client_notes: safeTrim(voiceNotes) || null,
        hair_history: safeTrim(cutDetails) || null,
        products_used: safeTrim(formulas) || null,
        lifestyle_notes: safeTrim(aftercare) || null,
        extra_notes: safeTrim(extraNotes) || null,
        hair_goals: safeTrim(hairGoals) || null,

        ai_summary: summary || null,
        visit_date: new Date().toISOString(),
      };

      const { error: insErr } = await supabase.from("consultations").insert([insertPayload]);
      if (insErr) throw insErr;

      // 5) Update long-term memory on client record (clients.notes)
      const memory = [
        `Last service: ${safeTrim(serviceType) || "N/A"}`,
        safeTrim(cutDetails) ? `Cut details: ${safeTrim(cutDetails)}` : "",
        safeTrim(formulas) ? `Formulas/technical: ${safeTrim(formulas)}` : "",
        safeTrim(aftercare) ? `Aftercare: ${safeTrim(aftercare)}` : "",
        safeTrim(hairGoals) ? `Goals: ${safeTrim(hairGoals)}` : "",
        safeTrim(extraNotes) ? `Notes: ${safeTrim(extraNotes)}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      await updateClientMemory(client.id, memory);

      // 6) Refresh lastVisit panel immediately
      const refreshed = await loadLastVisitForClient(email, client.id);
      setLastVisit(refreshed);

      setStatusMsg("Saved. Client memory updated.");
    } catch (e: any) {
      setErrorMsg(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  // ---------- Styles ----------
  const inputBase: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(55, 65, 81, 1)",
    background: "#020617",
    color: "#F9FAFB",
    fontSize: 14,
    outline: "none",
  };

  const textareaBase: React.CSSProperties = {
    ...inputBase,
    resize: "vertical",
  };

  const pillBtn: React.CSSProperties = {
    padding: "8px 12px",
    borderRadius: 999,
    border: "1px solid rgba(148, 163, 184, 0.25)",
    background: "rgba(2, 6, 23, 0.4)",
    color: "#E5E7EB",
    fontSize: 13,
    cursor: "pointer",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050816",
        color: "#E5E7EB",
        display: "flex",
        justifyContent: "center",
        padding: "56px 16px",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1100,
          background: "rgba(15, 23, 42, 0.98)",
          borderRadius: 18,
          padding: 24,
          border: "1px solid rgba(148, 163, 184, 0.35)",
          display: "grid",
          gridTemplateColumns: hasSummary ? "1.1fr 1.1fr" : "1fr",
          gap: 22,
        }}
      >
        {/* LEFT */}
        <div>
          <button
            onClick={() => navigate("/dashboard")}
            style={{
              fontSize: 13,
              marginBottom: 14,
              background: "transparent",
              border: "none",
              color: "#9CA3AF",
              cursor: "pointer",
              padding: 0,
            }}
          >
            ← Back to dashboard
          </button>

          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, color: "#F9FAFB" }}>
            New consultation sheet
          </h1>
          <p style={{ fontSize: 14, color: "#9CA3AF", marginBottom: 14 }}>
            Type the client name. The app saves every visit and updates long-term client memory so you never guess what you did last time.
          </p>

          {/* Memory panel */}
          <div
            style={{
              marginBottom: 14,
              borderRadius: 14,
              border: "1px solid rgba(59, 130, 246, 0.35)",
              background: "rgba(59, 130, 246, 0.08)",
              padding: 12,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#BFDBFE" }}>Client memory</div>
                <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>
                  {loadingMemory ? "Loading memory…" : "Loads automatically when you type a saved client name."}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 10, fontSize: 13, color: "#E5E7EB", whiteSpace: "pre-wrap" }}>
              {!cleanClientName ? (
                <span style={{ color: "#9CA3AF" }}>Enter a client name to load their last visit.</span>
              ) : lastVisit ? (
                <>
                  <div style={{ fontWeight: 700, color: "#E0F2FE" }}>
                    {lastVisit.client_name || cleanClientName}
                  </div>
                  <div style={{ fontSize: 12, color: "#9CA3AF" }}>
                    Last visit:{" "}
                    {lastVisit.visit_date ? new Date(lastVisit.visit_date).toLocaleString() : "unknown"}
                  </div>
                  <div style={{ marginTop: 8, padding: 10, borderRadius: 12, border: "1px solid rgba(148, 163, 184, 0.25)", background: "rgba(2, 6, 23, 0.55)" }}>
                    {lastVisit.ai_summary || "No summary saved on last visit."}
                  </div>
                </>
              ) : (
                <span style={{ color: "#9CA3AF" }}>No prior visit found yet for this name.</span>
              )}
            </div>
          </div>

          {/* Status */}
          {statusMsg ? (
            <div
              style={{
                marginBottom: 10,
                borderRadius: 12,
                border: "1px solid rgba(34, 197, 94, 0.45)",
                background: "rgba(34, 197, 94, 0.10)",
                padding: 10,
                fontSize: 13,
                color: "#BBF7D0",
              }}
            >
              {statusMsg}
            </div>
          ) : null}

          {errorMsg ? (
            <div
              style={{
                marginBottom: 10,
                borderRadius: 12,
                border: "1px solid rgba(239, 68, 68, 0.45)",
                background: "rgba(239, 68, 68, 0.10)",
                padding: 10,
                fontSize: 13,
                color: "#FCA5A5",
              }}
            >
              {errorMsg}
            </div>
          ) : null}

          {/* FORM */}
          <form onSubmit={handleSaveAndGenerate} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>Client name</label>
                <input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Jay Brown"
                  style={inputBase}
                  required
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>Client phone</label>
                <input
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="optional"
                  style={inputBase}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>Client email</label>
              <input
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="optional"
                style={inputBase}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>Service type</label>
              <input
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                placeholder="Fade, taper, retwist, silk press, color, etc."
                style={inputBase}
              />
            </div>

            {/* Voice Notes */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>
                  Voice notes (talk it out)
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={listening ? stopListening : startListening}
                    style={{
                      ...pillBtn,
                      borderColor: listening ? "rgba(239, 68, 68, 0.45)" : "rgba(148, 163, 184, 0.25)",
                      background: listening ? "rgba(239, 68, 68, 0.10)" : "rgba(2, 6, 23, 0.4)",
                    }}
                    disabled={!canUseSpeech}
                  >
                    {listening ? "Stop" : "Start"}
                  </button>
                </div>
              </div>

              <textarea
                value={voiceNotes}
                onChange={(e) => setVoiceNotes(e.target.value)}
                placeholder="Talk and it will fill here. You can edit it."
                rows={4}
                style={textareaBase}
              />
              {!canUseSpeech ? (
                <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 6 }}>
                  Voice notes need Chrome/Edge and mic permission.
                </div>
              ) : null}
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>Cut details</label>
              <textarea
                value={cutDetails}
                onChange={(e) => setCutDetails(e.target.value)}
                placeholder="Guards, taper/fade, line-up, beard, shape, etc."
                rows={3}
                style={textareaBase}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>Formulas / technical</label>
              <textarea
                value={formulas}
                onChange={(e) => setFormulas(e.target.value)}
                placeholder="Color mixes, processing time, developer, etc."
                rows={3}
                style={textareaBase}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>Aftercare</label>
              <textarea
                value={aftercare}
                onChange={(e) => setAftercare(e.target.value)}
                placeholder="Routine + product recommendations"
                rows={3}
                style={textareaBase}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>Goals</label>
              <input
                value={hairGoals}
                onChange={(e) => setHairGoals(e.target.value)}
                placeholder="Maintain longer, growth, healthier scalp, etc."
                style={inputBase}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>Extra notes</label>
              <textarea
                value={extraNotes}
                onChange={(e) => setExtraNotes(e.target.value)}
                placeholder="Lifestyle, preferences, problem areas, maintenance level…"
                rows={4}
                style={textareaBase}
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                marginTop: 4,
                padding: "12px 18px",
                borderRadius: 999,
                border: "none",
                background: saving ? "rgba(79, 70, 229, 0.55)" : "#4F46E5",
                color: "#F9FAFB",
                fontSize: 14,
                fontWeight: 700,
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Saving…" : "Save & build summary"}
            </button>

            <div style={{ fontSize: 12, color: "#9CA3AF" }}>
              Logged in as: <span style={{ color: "#E5E7EB" }}>{userEmail || "—"}</span>
            </div>
          </form>
        </div>

        {/* RIGHT */}
        {hasSummary && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div
              style={{
                borderRadius: 14,
                border: "1px solid rgba(59, 130, 246, 0.5)",
                background:
                  "radial-gradient(circle at top, rgba(37, 99, 235, 0.25), transparent 55%)",
                padding: 14,
                fontSize: 13,
                whiteSpace: "pre-wrap",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8, color: "#BFDBFE" }}>
                Client-friendly summary
              </div>
              <div>{clientSummary}</div>
            </div>

            <div
              style={{
                borderRadius: 14,
                border: "1px solid rgba(34, 197, 94, 0.45)",
                background:
                  "radial-gradient(circle at top, rgba(22, 163, 74, 0.25), transparent 55%)",
                padding: 14,
                fontSize: 13,
                whiteSpace: "pre-wrap",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8, color: "#BBF7D0" }}>
                Stylist tech sheet
              </div>
              <div>{stylistSheet}</div>
            </div>

            <div style={{ fontSize: 12, color: "#9CA3AF" }}>
              Tip: Save again next visit with the same client name and it’ll pull their last visit automatically.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsultationPage;
