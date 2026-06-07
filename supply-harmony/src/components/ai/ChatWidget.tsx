import { useState, useRef, useEffect } from "react";
import { Send, X, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
// Imagen EXCLUSIVA del chatbot (distinta del resto de la app).
import chatbot from "@/assets/chatbot.png";
import { Sparkline } from "@/components/platform/charts";
import { api } from "@/lib/api/client";

interface Msg {
  role: "ai" | "user";
  text: string;
  chart?: boolean;
}

const initial: Msg[] = [
  {
    role: "ai",
    text: "¡Hola! 👋 Soy **Pythia**, tu oráculo de inventario. Detecté un posible faltante de **Fanta 600 ml** en CEDIS Monterrey. ¿Quieres que revise la mejor alternativa?",
  },
];

const canned: Record<string, Msg> = {
  default: {
    role: "ai",
    text: "Para este cliente, mi mejor sugerencia es **Sprite 600 ml** con una **propensión de aceptación del 92%**. Conserva el sabor cítrico y el formato preferido.",
    chart: true,
  },
};

const quick = ["¿Cuál es la mejor alternativa?", "¿Qué pedidos están en riesgo?", "Resumen del día"];

export function ChatWidget({ mode = "admin" }: { mode?: "admin" | "cliente" }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>(initial);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function send(text: string) {
    if (!text.trim() || pending) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setPending(true);
    try {
      const { reply } = await api.chat(text, mode);
      setMessages((m) => [...m, { role: "ai", text: reply }]);
    } catch {
      // Si el backend no responde, usamos la respuesta de respaldo.
      setMessages((m) => [...m, canned.default]);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      {/* Botón flotante Pythia Bot */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Abrir a Pythia Bot"
        className={cn(
          "fixed bottom-6 right-6 z-50 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-ai p-1.5 shadow-ai transition-transform hover:scale-105",
          open && "scale-90 opacity-0 pointer-events-none",
        )}
        style={{ animation: open ? undefined : "pulse-ring 2.4s ease-out infinite" }}
      >
        <img src={chatbot} alt="" width={56} height={56} className="h-12 w-12 object-contain drop-shadow" />
      </button>

      {/* Panel */}
      <div
        className={cn(
          "fixed bottom-6 right-6 z-50 flex w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-card transition-all duration-300",
          open ? "h-[600px] max-h-[calc(100vh-3rem)] opacity-100" : "pointer-events-none h-0 translate-y-6 opacity-0",
        )}
      >
        {/* Header Pythia */}
        <div className="relative flex items-center gap-3 bg-gradient-ai px-4 py-3.5">
          <img src={chatbot} alt="" width={44} height={44} className="h-11 w-11 object-contain drop-shadow" />
          <div className="flex-1 leading-tight">
            <p className="text-sm font-bold text-ai-foreground">Pythia Bot</p>
            <p className="flex items-center gap-1.5 text-xs text-ai-foreground/80">
              <span className="h-1.5 w-1.5 rounded-full bg-success" /> En línea · supply chain
            </p>
          </div>
          <button onClick={() => setOpen(false)} aria-label="Cerrar" className="rounded-lg p-1.5 text-ai-foreground/90 hover:bg-white/15">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mensajes */}
        <div className="flex-1 space-y-3 overflow-y-auto bg-secondary/40 px-4 py-4">
          {messages.map((m, i) => (
            <ChatBubble key={i} msg={m} />
          ))}
          {pending && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md bg-card px-3.5 py-2.5 text-sm text-muted-foreground shadow-soft">
                Pythia está pensando…
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2 border-t border-border bg-card px-4 pt-3">
          {quick.map((q) => (
            <button
              key={q}
              onClick={() => send(q)}
              className="rounded-full border border-ai/30 bg-ai-soft px-3 py-1.5 text-xs font-semibold text-ai transition-colors hover:bg-ai/15"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-2 bg-card p-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pregunta lo que quieras…"
            className="flex-1 rounded-xl border border-border bg-secondary/50 px-3.5 py-2.5 text-sm outline-none ring-ai/40 placeholder:text-muted-foreground focus:ring-2"
          />
          <button
            type="submit"
            aria-label="Enviar"
            className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-ai text-ai-foreground shadow-ai transition-transform hover:scale-105"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </>
  );
}

function ChatBubble({ msg }: { msg: Msg }) {
  const isAi = msg.role === "ai";
  return (
    <div className={cn("flex", isAi ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
          isAi ? "rounded-bl-md bg-card text-card-foreground shadow-soft" : "rounded-br-md bg-gradient-ai text-ai-foreground",
        )}
      >
        <RichText text={msg.text} ai={isAi} />
        {msg.chart && (
          <div className="mt-3 rounded-xl border border-ai/20 bg-ai-soft/60 p-3">
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-ai">
              <BarChart3 className="h-3.5 w-3.5" /> Probabilidad de aceptación
            </div>
            <Sparkline data={[60, 70, 78, 85, 88, 90, 92]} stroke="var(--color-ai)" fill="var(--color-ai)" height={40} />
            <p className="mt-1 text-right text-lg font-extrabold text-ai">92%</p>
          </div>
        )}
      </div>
    </div>
  );
}

function RichText({ text, ai }: { text: string; ai: boolean }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") ? (
          <strong key={i} className={ai ? "font-bold text-ai" : "font-bold"}>
            {p.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}
