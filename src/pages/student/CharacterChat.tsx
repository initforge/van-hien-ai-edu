import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(res => res.json());

type Step = "select-work" | "select-character" | "chatting";
interface Message { role: "user" | "ai"; text: string; time: string; }
interface WorkChar { id: string; name: string; role: string; desc: string; avatar: string; }
interface GroupedWork { id: string; title: string; author: string; characters: WorkChar[]; }

export default function CharacterChatPage() {
  const [step, setStep] = useState<Step>("select-work");
  const [selectedWork, setSelectedWork] = useState<string | null>(null);
  const [selectedChar, setSelectedChar] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [threadId, setThreadId] = useState<string | null>(null);

  const { data: charactersData, isLoading } = useSWR("/api/characters", fetcher);
  const characters = (charactersData || []) as any[];

  const works: GroupedWork[] = (() => {
    const map = new Map<string, GroupedWork>();
    for (const c of characters) {
      if (!c.workId) continue;
      if (!map.has(c.workId)) {
        map.set(c.workId, {
          id: c.workId,
          title: c.workTitle || "Tác phẩm",
          author: "",
          characters: [],
        });
      }
      map.get(c.workId)!.characters.push({
        id: c.id,
        name: c.name,
        role: c.role || "Nhân vật",
        desc: c.description || "",
        avatar: c.initials || (c.name?.slice(0, 2).toUpperCase() ?? "??"),
      });
    }
    return Array.from(map.values());
  })();

  const work = works.find((w) => w.id === selectedWork);
  const character = work?.characters.find((c) => c.id === selectedChar);

  const handleSelectWork = (id: string) => {
    setSelectedWork(id);
    setSelectedChar(null);
    setStep("select-character");
  };

  const handleSelectChar = async (id: string) => {
    setSelectedChar(id);
    try {
      const charName = work?.characters.find((c) => c.id === id)?.name || id;
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [], characterId: charName }),
      });
      if (res.headers.has("X-Thread-Id")) {
        setThreadId(res.headers.get("X-Thread-Id")!);
      }
    } catch (_) { /* non-critical */ }
    setStep("chatting");
  };

  const handleBack = () => {
    if (step === "chatting") {
      setStep("select-character");
      setSelectedChar(null);
    } else if (step === "select-character") {
      setStep("select-work");
      setSelectedWork(null);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const time = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    const newMsg: Message = { role: "user", text: input, time };
    const currentMessages = [...messages, newMsg];
    setMessages((prev) => [...prev, newMsg, { role: "ai", text: "", time }]);
    setInput("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: currentMessages, characterId: character?.name, threadId }),
      });
      if (!res.body) throw new Error("No response body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      while (!done) {
        const { value, done: d } = await reader.read();
        done = d;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          setMessages((prev) => {
            const msgs = [...prev];
            msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], text: msgs[msgs.length - 1].text + chunk };
            return msgs;
          });
        }
      }
    } catch {
      setMessages((prev) => {
        const msgs = [...prev];
        msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], text: "(Lỗi: Không nhận được phản hồi. Vui lòng thử lại.)" };
        return msgs;
      });
    }
  };

  // ── STEP 1: Select Work ──
  if (step === "select-work") {
    return (
      <div className="p-8 lg:p-12 min-h-screen page-enter">
        <header className="mb-10">
          <span className="text-xs font-label tracking-widest text-secondary font-bold uppercase mb-2 block">Chatbot Nhân vật AI</span>
          <h2 className="text-4xl font-headline font-bold text-primary tracking-tight mb-2">Chọn tác phẩm</h2>
          <p className="text-on-surface-variant max-w-xl">Chọn một tác phẩm văn học để bắt đầu trò chuyện với nhân vật bên trong.</p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {isLoading && (
            <div className="col-span-4 p-12 text-center text-outline">Đang tải tác phẩm...</div>
          )}
          {!isLoading && works.length === 0 && (
            <div className="col-span-4 p-12 text-center text-outline">Chưa có tác phẩm nào được phân tích.</div>
          )}
          {works.map((w) => (
            <div
              key={w.id}
              onClick={() => handleSelectWork(w.id)}
              className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border-[0.5px] border-outline-variant/30 hover:border-primary/40 hover:-translate-y-1 hover:shadow-lg cursor-pointer transition-all duration-300 flex flex-col group"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <span className="material-symbols-outlined text-primary text-3xl">menu_book</span>
              </div>
              <h3 className="font-headline font-bold text-xl text-primary mb-1">{w.title}</h3>
              <p className="text-sm text-on-surface-variant italic mb-4">{w.author}</p>
              <div className="mt-auto flex items-center gap-2 text-xs font-bold text-primary-container uppercase tracking-widest">
                <span className="material-symbols-outlined text-sm">groups</span>
                {w.characters.length} nhân vật
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── STEP 2: Select Character ──
  if (step === "select-character" && work) {
    return (
      <div className="p-8 lg:p-12 min-h-screen">
        <button onClick={handleBack} className="flex items-center gap-2 text-primary font-bold mb-8 hover:gap-3 transition-all">
          <span className="material-symbols-outlined">arrow_back</span>
          Quay lại chọn tác phẩm
        </button>
        <header className="mb-10">
          <span className="text-xs font-label tracking-widest text-secondary font-bold uppercase mb-2 block">{work.title} — {work.author}</span>
          <h2 className="text-4xl font-headline font-bold text-primary tracking-tight mb-2">Chọn nhân vật</h2>
          <p className="text-on-surface-variant max-w-xl">Chọn nhân vật bạn muốn trò chuyện. AI sẽ hoá thân vào vai nhân vật dựa trên nguyên tác.</p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
          {work.characters.map((c) => (
            <div
              key={c.id}
              onClick={() => handleSelectChar(c.id)}
              className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border-[0.5px] border-outline-variant/30 hover:border-primary/40 hover:-translate-y-1 hover:shadow-lg cursor-pointer transition-all duration-300 group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center text-white text-xl font-bold font-headline shadow-sm ring-2 ring-primary-container/20">
                  {c.avatar}
                </div>
                <div>
                  <h4 className="font-headline font-bold text-lg text-on-surface">{c.name}</h4>
                  <p className="text-[10px] text-secondary font-bold uppercase tracking-widest mt-0.5">{c.role}</p>
                </div>
              </div>
              <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">{c.desc}</p>
              <div className="flex items-center gap-2 text-primary font-bold text-sm group-hover:gap-3 transition-all">
                <span className="material-symbols-outlined text-sm">chat_bubble</span>
                Trò chuyện
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── STEP 3: Chat Interface ──
  if (step === "chatting" && character && work) {
    return (
      <div className="flex flex-col h-screen">
        <div className="px-8 py-4 border-b border-outline-variant/10 flex items-center justify-between bg-white/80 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={handleBack} className="text-slate-400 hover:text-primary transition-colors">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-white text-sm font-bold font-headline shadow-sm ring-2 ring-primary-container/20">
              {character.avatar}
            </div>
            <div>
              <span className="block font-headline text-lg text-primary font-bold leading-tight">{character.name} AI</span>
              <span className="block text-[10px] text-secondary font-semibold uppercase tracking-widest mt-0.5">
                {work.title} — Đã kết nối
              </span>
            </div>
          </div>
          <button
            onClick={() => { setMessages([]); setThreadId(null); }}
            className="flex items-center gap-2 px-4 py-2 border border-outline-variant/30 bg-white text-primary-container rounded-lg text-sm font-bold hover:bg-primary-container/5 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Trò chuyện mới
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-surface-container-low/30">
          {messages.map((msg, i) =>
            msg.role === "user" ? (
              <div key={i} className="flex flex-col items-end">
                <div className="max-w-[70%] bg-primary-container text-white px-5 py-3.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed shadow-sm">
                  {msg.text}
                </div>
                <span className="text-[10px] text-slate-400 mt-1.5 mr-2 font-medium">{msg.time}</span>
              </div>
            ) : (
              <div key={i} className="flex flex-col items-start">
                <div className="flex items-end gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-container flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold shadow-sm ring-1 ring-primary-container/20">
                    {character.avatar}
                  </div>
                  <div className="max-w-[70%] bg-white text-primary px-5 py-4 rounded-2xl rounded-bl-sm text-sm leading-relaxed border-[0.5px] border-outline-variant/30 italic shadow-sm">
                    {msg.text}
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 mt-1.5 ml-11 font-medium">{character.name} AI • {msg.time}</span>
              </div>
            )
          )}
        </div>

        <div className="p-6 pt-4 bg-white/80 backdrop-blur-md border-t border-outline-variant/10 shrink-0">
          <div className="relative flex items-center bg-surface-container-lowest border border-outline-variant/40 rounded-xl px-2 py-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30 transition-all shadow-sm max-w-4xl mx-auto">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 px-3 placeholder:italic placeholder:text-slate-400"
              placeholder={`Hỏi ${character.name} điều gì đó...`}
              type="text"
            />
            <button
              onClick={handleSend}
              className="w-10 h-10 bg-primary-container text-white rounded-lg flex items-center justify-center hover:bg-primary transition-all shadow-sm hover:shadow-primary/20"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
            </button>
          </div>
          <p className="text-[10px] text-center text-slate-400 mt-3 flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-[12px]">info</span>
            Nhân vật AI được huấn luyện dựa trên nguyên tác văn học.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
