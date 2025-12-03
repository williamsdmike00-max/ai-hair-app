import { useState, useEffect, useRef } from "react";
import type { FormEvent } from "react";

type Status = "booked" | "completed" | "no-show";

type ServiceKey =
  | "rootTouchUp"
  | "fullHighlight"
  | "balayage"
  | "tonerGloss"
  | "silkPress";

type Client = {
  id: number;
  name: string;
  formula: string;
  notes: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM (24h)
  status: Status;
  timerEnd?: string | null; // ISO timestamp when processing timer ends
  summary?: string; // AI-style summary of notes
  aftercare?: string; // optional aftercare text for later
  serviceKey?: ServiceKey; // which service template was used
  suggestedRebook?: string; // e.g. "Feb 10, 10:00 AM"
};

const SERVICE_TEMPLATES: {
  key: ServiceKey;
  label: string;
  defaultFormula: string;
  defaultNotes: string;
}[] = [
  {
    key: "rootTouchUp",
    label: "Root touch-up",
    defaultFormula:
      "Permanent color, natural level + gray coverage at roots only.",
    defaultNotes:
      "Focus on regrowth only. Blend into mid-lengths if needed, avoid overlapping on ends.",
  },
  {
    key: "fullHighlight",
    label: "Full highlight",
    defaultFormula:
      "Foil highlights, fine weaves, lightener + bond builder, mid to high lift.",
    defaultNotes:
      "Full head foils, focus on brightness around face and crown. Tone after lift reaches desired level.",
  },
  {
    key: "balayage",
    label: "Balayage / lived-in",
    defaultFormula:
      "Hand-painted lightener on mid-lengths to ends, soft blended root.",
    defaultNotes:
      "Soft, low-maintenance blend. Keep depth at root, brightest toward ends. Great for 10–12 week maintenance.",
  },
  {
    key: "tonerGloss",
    label: "Toner / gloss",
    defaultFormula:
      "Demi-permanent gloss to refine tone and add shine, mid-lengths and ends.",
    defaultNotes:
      "Refresh tone and shine between lightening services. Watch timing on porous ends.",
  },
  {
    key: "silkPress",
    label: "Silk press",
    defaultFormula:
      "Moisturizing shampoo + deep conditioner, heat protectant, light finishing serum.",
    defaultNotes:
      "Full cleanse and deep condition. Blow dry with tension, press in small sections. Avoid heavy oils at roots.",
  },
];

// Default rebook intervals in weeks per service
const REBOOK_WEEKS: Record<ServiceKey, number> = {
  rootTouchUp: 6,
  fullHighlight: 10,
  balayage: 12,
  tonerGloss: 4,
  silkPress: 3,
};

// localStorage key
const STORAGE_KEY = "aiHairAssistant_clients_v1";

const HomeDashboard = () => {
  const [showForm, setShowForm] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [now, setNow] = useState<number>(Date.now());
  const [recordingClientId, setRecordingClientId] = useState<number | null>(
    null
  );
  const [summarizingId, setSummarizingId] = useState<number | null>(null);

  const [selectedServiceKey, setSelectedServiceKey] = useState<string>("");

  const formulaInputRef = useRef<HTMLInputElement | null>(null);
  const notesTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const todayISO = new Date().toISOString().split("T")[0]; // e.g. "2025-12-02"

  // Load saved clients from localStorage on first mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Client[];
      if (Array.isArray(parsed)) {
        setClients(
          parsed.map((c) => ({
            ...c,
            // make sure fields exist even if older data
            timerEnd: c.timerEnd ?? null,
          }))
        );
      }
    } catch (err) {
      console.error("Failed to load saved clients", err);
    }
  }, []);

  // Save clients to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
    } catch (err) {
      console.error("Failed to save clients", err);
    }
  }, [clients]);

  // Tick every second so timers update
  useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const handleServiceChange = (key: string) => {
    setSelectedServiceKey(key);

    const template = SERVICE_TEMPLATES.find((t) => t.key === key);
    if (!template) return;

    if (formulaInputRef.current) {
      formulaInputRef.current.value = template.defaultFormula;
    }
    if (notesTextareaRef.current) {
      notesTextareaRef.current.value = template.defaultNotes;
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const clientName = (formData.get("name") as string)?.trim();
    const formula = (formData.get("formula") as string)?.trim() || "";
    const notes = (formData.get("notes") as string)?.trim() || "";
    const date = (formData.get("date") as string)?.trim();
    const time = (formData.get("time") as string)?.trim();
    const serviceRaw = (formData.get("service") as string) || "";

    if (!clientName || !date || !time) return;

    const serviceKey = SERVICE_TEMPLATES.some((t) => t.key === serviceRaw)
      ? (serviceRaw as ServiceKey)
      : undefined;

    const newClient: Client = {
      id: Date.now(),
      name: clientName,
      formula,
      notes,
      date,
      time,
      status: "booked",
      timerEnd: null,
      summary: undefined,
      aftercare: undefined,
      serviceKey,
      suggestedRebook: undefined,
    };

    setClients((prev) => {
      const updated = [...prev, newClient];

      updated.sort((a, b) => {
        const aDate = new Date(`${a.date}T${a.time}`);
        const bDate = new Date(`${b.date}T${b.time}`);
        return aDate.getTime() - bDate.getTime();
      });

      return updated;
    });

    e.currentTarget.reset();
    setShowForm(false);
    setSelectedServiceKey("");
  };

  // --- helpers ---

  const formatTime = (time: string) => {
    if (!time) return "";
    const [hourStr, minuteStr] = time.split(":");
    let hour = Number(hourStr);
    const minutes = minuteStr ?? "00";
    const ampm = hour >= 12 ? "PM" : "AM";
    if (hour === 0) hour = 12;
    else if (hour > 12) hour -= 12;
    return `${hour}:${minutes} ${ampm}`;
  };

  const formatDate = (date: string) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  const formatRebookDateTime = (d: Date) => {
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const buildSuggestedRebook = (client: Client): string => {
    // Determine weeks based on service, with a default fallback
    const weeks =
      client.serviceKey && REBOOK_WEEKS[client.serviceKey]
        ? REBOOK_WEEKS[client.serviceKey]
        : 6;

    let base = new Date(`${client.date}T${client.time || "10:00"}`);
    if (isNaN(base.getTime())) {
      base = new Date();
    }

    base.setDate(base.getDate() + weeks * 7);

    return formatRebookDateTime(base);
  };

  const statusLabel = (status: Status) => {
    if (status === "completed") return "Completed";
    if (status === "no-show") return "No-show";
    return "Booked";
  };

  const statusBadgeClass = (status: Status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700";
      case "no-show":
        return "bg-red-100 text-red-700";
      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  const updateStatus = (id: number, status: Status) => {
    setClients((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;

        const updated: Client = { ...c, status };

        if (status === "completed") {
          updated.suggestedRebook = buildSuggestedRebook(c);
        } else if (status === "booked") {
          updated.suggestedRebook = undefined;
        }

        return updated;
      })
    );
  };

  const startTimer = (id: number, minutes: number) => {
    const end = new Date();
    end.setMinutes(end.getMinutes() + minutes);
    const iso = end.toISOString();

    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, timerEnd: iso } : c))
    );
  };

  const clearTimer = (id: number) => {
    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, timerEnd: null } : c))
    );
  };

  const getTimerInfo = (client: Client) => {
    if (!client.timerEnd) return null;
    const endMs = new Date(client.timerEnd).getTime();
    const diffSeconds = Math.floor((endMs - now) / 1000);
    const remaining = diffSeconds > 0 ? diffSeconds : 0;
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    const label = `${minutes}:${seconds.toString().padStart(2, "0")}`;
    const done = diffSeconds <= 0;
    return { label, done };
  };

  // --- Voice → Notes per appointment ---

  const handleDictateNotes = (clientId: number) => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice notes are not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    setRecordingClientId(clientId);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.trim();
      if (!transcript) return;

      setClients((prev) =>
        prev.map((c) =>
          c.id === clientId
            ? {
                ...c,
                notes: c.notes ? `${c.notes} ${transcript}` : transcript,
                summary: undefined,
                aftercare: undefined,
              }
            : c
        )
      );
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event);
      alert("There was a problem with voice capture.");
    };

    recognition.onend = () => {
      setRecordingClientId(null);
    };

    recognition.start();
  };

  // --- Fake "AI" summary (local) for now ---

  const buildLocalSummary = (
    client: Client
  ): { summary: string; aftercare: string } => {
    const notes = client.notes || "";
    const formula = client.formula || "";

    const baseSummary = notes
      ? `Client ${client.name} preferences: ${notes}`
      : `Client ${client.name} had a color service.`;

    const formulaLine = formula ? ` Formula used: ${formula}.` : "";

    const summary = `${baseSummary}${formulaLine}`.trim();

    const aftercare = [
      "Use sulfate-free shampoo and conditioner.",
      "Avoid hot tools or keep heat low with heat protectant.",
      "Schedule a refresh or toner in 6–8 weeks.",
    ].join(" ");

    return { summary, aftercare };
  };

  const handleSummarizeNotes = (clientId: number) => {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;
    if (!client.notes && !client.formula) {
      alert("No notes or formula to summarize yet.");
      return;
    }

    setSummarizingId(clientId);

    setTimeout(() => {
      const { summary, aftercare } = buildLocalSummary(client);

      setClients((prev) =>
        prev.map((c) =>
          c.id === clientId
            ? {
                ...c,
                summary,
                aftercare,
              }
            : c
        )
      );
      setSummarizingId(null);
    }, 600);
  };

  // sorted list for display
  const sortedClients = [...clients].sort((a, b) => {
    const aDate = new Date(`${a.date}T${a.time}`);
    const bDate = new Date(`${b.date}T${b.time}`);
    return aDate.getTime() - bDate.getTime();
  });

  const todaysAppointments = sortedClients.filter((c) => c.date === todayISO);
  const upcomingAppointments = sortedClients.filter((c) => c.date > todayISO);

  // Color history (latest formula per client name)
  const colorHistoryMap = new Map<string, Client>();
  for (const client of sortedClients) {
    if (!client.formula) continue;
    colorHistoryMap.set(client.name, client);
  }
  const colorHistory = Array.from(colorHistoryMap.values());

  // Active timers (for the strip)
  const activeTimers = sortedClients
    .filter((c) => c.timerEnd)
    .map((c) => {
      const info = getTimerInfo(c);
      return info
        ? {
            id: c.id,
            name: c.name,
            label: info.label,
            done: info.done,
          }
        : null;
    })
    .filter(Boolean) as {
    id: number;
    name: string;
    label: string;
    done: boolean;
  }[];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top bar */}
      <header className="bg-black text-white py-4">
        <div className="max-w-4xl mx-auto px-4 flex justify-between items-center">
          <h1 className="text-lg font-semibold">AI Hair Assistant</h1>
          <button
            onClick={() => setShowForm(true)}
            className="bg-white text-black px-4 py-2 rounded-lg font-medium"
          >
            New Appointment
          </button>
        </div>
      </header>

      {/* Now Processing Strip */}
      {activeTimers.length > 0 && (
        <div className="bg-indigo-50 border-b border-indigo-100">
          <div className="max-w-4xl mx-auto px-4 py-2 flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-indigo-800 uppercase tracking-wide">
              Now Processing
            </span>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {activeTimers.map((t) => (
                <div
                  key={t.id}
                  className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs border ${
                    t.done
                      ? "bg-red-50 border-red-200 text-red-700"
                      : "bg-indigo-100 border-indigo-200 text-indigo-800"
                  }`}
                >
                  <span className="font-semibold">{t.name}</span>
                  <span className="text-[11px]">
                    {t.done ? "Done" : t.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => clearTimer(t.id)}
                    className="text-[10px] underline ml-1"
                  >
                    Clear
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main dashboard */}
      <main className="max-w-4xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Today's Appointments */}
        <section className="md:col-span-2 bg-white rounded-2xl shadow p-4">
          <h2 className="font-semibold mb-3">Today&apos;s Appointments</h2>

          {todaysAppointments.length === 0 ? (
            <div className="border border-dashed border-gray-300 rounded-xl p-6 text-center text-gray-500 text-sm">
              No appointments booked for today.
            </div>
          ) : (
            <ul className="space-y-3">
              {todaysAppointments.map((client) => {
                const timer = getTimerInfo(client);
                const isRecording = recordingClientId === client.id;
                const isSummarizing = summarizingId === client.id;

                return (
                  <li
                    key={client.id}
                    className="border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="font-medium">{client.name}</span>
                        <span className="text-xs text-gray-500">
                          Today at{" "}
                          <span className="font-semibold">
                            {formatTime(client.time)}
                          </span>
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusBadgeClass(
                          client.status
                        )}`}
                      >
                        {statusLabel(client.status)}
                      </span>
                    </div>

                    {client.formula && (
                      <p className="text-xs text-gray-700">
                        <span className="font-semibold">Formula:</span>{" "}
                        {client.formula}
                      </p>
                    )}

                    {client.notes && (
                      <p className="text-xs text-gray-600">
                        <span className="font-semibold">Notes:</span>{" "}
                        {client.notes}
                      </p>
                    )}

                    {client.summary && (
                      <div className="mt-1 rounded-lg bg-white border border-indigo-100 p-2">
                        <p className="text-[11px] text-indigo-900">
                          <span className="font-semibold">Summary:</span>{" "}
                          {client.summary}
                        </p>
                        {client.aftercare && (
                          <p className="text-[11px] text-indigo-900 mt-1">
                            <span className="font-semibold">Aftercare:</span>{" "}
                            {client.aftercare}
                          </p>
                        )}
                      </div>
                    )}

                    {client.status === "completed" &&
                      client.suggestedRebook && (
                        <p className="text-[11px] text-emerald-700 mt-1">
                          <span className="font-semibold">
                            Suggested rebook:
                          </span>{" "}
                          {client.suggestedRebook}
                        </p>
                      )}

                    {/* Voice / summary / timer controls */}
                    <div className="flex flex-wrap gap-2 items-center mt-1">
                      <button
                        type="button"
                        onClick={() => handleDictateNotes(client.id)}
                        className={`text-[11px] px-2 py-1 rounded-full border ${
                          isRecording
                            ? "border-red-400 bg-red-50 text-red-700"
                            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {isRecording ? "Listening…" : "🎙 Dictate notes"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSummarizeNotes(client.id)}
                        disabled={isSummarizing}
                        className={`text-[11px] px-2 py-1 rounded-full border ${
                          isSummarizing
                            ? "border-indigo-200 bg-indigo-50 text-indigo-400"
                            : "border-indigo-300 bg-indigo-50 text-indigo-800 hover:bg-indigo-100"
                        }`}
                      >
                        {isSummarizing
                          ? "Summarizing..."
                          : client.summary
                          ? "Regenerate summary"
                          : "Summarize notes"}
                      </button>

                      {timer ? (
                        <div className="flex items-center gap-2 ml-auto">
                          <p
                            className={`text-xs font-semibold ${
                              timer.done ? "text-red-600" : "text-indigo-600"
                            }`}
                          >
                            Timer: {timer.label}{" "}
                            {timer.done && <span>(Done)</span>}
                          </p>
                          <button
                            type="button"
                            onClick={() => clearTimer(client.id)}
                            className="text-[11px] text-gray-600 hover:underline"
                          >
                            Clear
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2 ml-auto">
                          <span className="text-[11px] text-gray-500 self-center">
                            Start processing:
                          </span>
                          <button
                            type="button"
                            onClick={() => startTimer(client.id, 15)}
                            className="text-[11px] px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                          >
                            15 min
                          </button>
                          <button
                            type="button"
                            onClick={() => startTimer(client.id, 30)}
                            className="text-[11px] px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                          >
                            30 min
                          </button>
                          <button
                            type="button"
                            onClick={() => startTimer(client.id, 45)}
                            className="text-[11px] px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                          >
                            45 min
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3 text-xs mt-1">
                      <button
                        type="button"
                        onClick={() => updateStatus(client.id, "completed")}
                        className="text-green-700 hover:underline"
                      >
                        Mark Completed
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStatus(client.id, "no-show")}
                        className="text-red-700 hover:underline"
                      >
                        Mark No-show
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStatus(client.id, "booked")}
                        className="text-gray-600 hover:underline"
                      >
                        Reset
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Upcoming Appointments */}
        <aside className="bg-white rounded-2xl shadow p-4">
          <h2 className="font-semibold mb-3">Upcoming</h2>

          {upcomingAppointments.length === 0 ? (
            <div className="text-gray-500 text-sm">
              No upcoming appointments yet.
            </div>
          ) : (
            <ul className="space-y-3">
              {upcomingAppointments.map((client) => {
                const timer = getTimerInfo(client);
                const isRecording = recordingClientId === client.id;
                const isSummarizing = summarizingId === client.id;

                return (
                  <li
                    key={client.id}
                    className="border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 text-sm"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{client.name}</span>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBadgeClass(
                              client.status
                            )}`}
                          >
                            {statusLabel(client.status)}
                          </span>
                        </div>
                        <span className="text-gray-500 text-xs">
                          {formatDate(client.date)} •{" "}
                          {formatTime(client.time)}
                        </span>
                      </div>
                    </div>

                    {client.formula && (
                      <p className="text-xs text-gray-700 mt-1">
                        <span className="font-semibold">Formula:</span>{" "}
                        {client.formula}
                      </p>
                    )}
                    {client.notes && (
                      <p className="text-[11px] text-gray-600 mt-1">
                        <span className="font-semibold">Notes:</span>{" "}
                        {client.notes}
                      </p>
                    )}
                    {client.summary && (
                      <div className="mt-1 rounded-lg bg-white border border-indigo-100 p-2">
                        <p className="text-[11px] text-indigo-900">
                          <span className="font-semibold">Summary:</span>{" "}
                          {client.summary}
                        </p>
                        {client.aftercare && (
                          <p className="text-[11px] text-indigo-900 mt-1">
                            <span className="font-semibold">Aftercare:</span>{" "}
                            {client.aftercare}
                          </p>
                        )}
                      </div>
                    )}

                    {client.status === "completed" &&
                      client.suggestedRebook && (
                        <p className="text-[11px] text-emerald-700 mt-1">
                          <span className="font-semibold">
                            Suggested rebook:
                          </span>{" "}
                          {client.suggestedRebook}
                        </p>
                      )}

                    <div className="flex flex-wrap gap-2 items-center mt-1">
                      <button
                        type="button"
                        onClick={() => handleDictateNotes(client.id)}
                        className={`text-[11px] px-2 py-1 rounded-full border ${
                          isRecording
                            ? "border-red-400 bg-red-50 text-red-700"
                            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {isRecording ? "Listening…" : "🎙 Dictate notes"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSummarizeNotes(client.id)}
                        disabled={isSummarizing}
                        className={`text-[11px] px-2 py-1 rounded-full border ${
                          isSummarizing
                            ? "border-indigo-200 bg-indigo-50 text-indigo-400"
                            : "border-indigo-300 bg-indigo-50 text-indigo-800 hover:bg-indigo-100"
                        }`}
                      >
                        {isSummarizing
                          ? "Summarizing..."
                          : client.summary
                          ? "Regenerate summary"
                          : "Summarize notes"}
                      </button>

                      {timer ? (
                        <div className="flex items-center gap-2 ml-auto">
                          <p
                            className={`text-[11px] font-semibold ${
                              timer.done ? "text-red-600" : "text-indigo-600"
                            }`}
                          >
                            Timer: {timer.label}{" "}
                            {timer.done && <span>(Done)</span>}
                          </p>
                          <button
                            type="button"
                            onClick={() => clearTimer(client.id)}
                            className="text-[11px] text-gray-600 hover:underline"
                          >
                            Clear
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2 ml-auto">
                          <span className="text-[11px] text-gray-500 self-center">
                            Start processing:
                          </span>
                          <button
                            type="button"
                            onClick={() => startTimer(client.id, 15)}
                            className="text-[11px] px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                          >
                            15
                          </button>
                          <button
                            type="button"
                            onClick={() => startTimer(client.id, 30)}
                            className="text-[11px] px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                          >
                            30
                          </button>
                          <button
                            type="button"
                            onClick={() => startTimer(client.id, 45)}
                            className="text-[11px] px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                          >
                            45
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3 text-[11px] mt-1">
                      <button
                        type="button"
                        onClick={() => updateStatus(client.id, "completed")}
                        className="text-green-700 hover:underline"
                      >
                        Completed
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStatus(client.id, "no-show")}
                        className="text-red-700 hover:underline"
                      >
                        No-show
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStatus(client.id, "booked")}
                        className="text-gray-600 hover:underline"
                      >
                        Reset
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>
      </main>

      {/* Color History */}
      {colorHistory.length > 0 && (
        <section className="max-w-4xl mx_auto px-4 pb-8">
          <div className="bg-white rounded-2xl shadow p-4 mt-2">
            <h2 className="font-semibold mb-3">Client Color History</h2>
            <ul className="space-y-2 text-sm">
              {colorHistory.map((c) => (
                <li
                  key={c.id}
                  className="border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 flex flex-col md:flex-row md:items-center md:justify-between gap-1"
                >
                  <div>
                    <span className="font-medium">{c.name}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      Last visit: {formatDate(c.date)} at{" "}
                      {formatTime(c.time)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-700">
                    <span className="font-semibold">Formula:</span> {c.formula}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* New Appointment Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">New Appointment</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Service template selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Service (optional)
                </label>
                <select
                  name="service"
                  value={selectedServiceKey}
                  onChange={(e) => handleServiceChange(e.target.value)}
                  className="w-full border px-3 py-2 rounded-lg text-sm bg-white"
                >
                  <option value="">Select a service template…</option>
                  {SERVICE_TEMPLATES.map((service) => (
                    <option key={service.key} value={service.key}>
                      {service.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-gray-500">
                  Choosing a service will pre-fill formula and notes. You can
                  still edit them.
                </p>
              </div>

              <input
                name="name"
                placeholder="Client Name"
                className="w-full border px-3 py-2 rounded-lg"
                required
              />

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    className="w-full border px-3 py-2 rounded-lg"
                    defaultValue={todayISO}
                    required
                  />
                </div>

                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    name="time"
                    className="w-full border px-3 py-2 rounded-lg"
                    required
                  />
                </div>
              </div>

              <input
                name="formula"
                placeholder="Formula (optional)"
                className="w-full border px-3 py-2 rounded-lg"
                ref={formulaInputRef}
              />

              <textarea
                name="notes"
                placeholder="Notes (optional)"
                className="w-full border px-3 py-2 rounded-lg"
                rows={3}
                ref={notesTextareaRef}
              />

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-lg bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-black text-white"
                >
                  Save Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeDashboard;
