import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { Send } from "lucide-react";
import { api, API_URL } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { invalidate, REFRESH_EVENT, shouldRefresh } from "../utils/refresh";

export default function ChatPanel({ mode }) {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const bottomRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    refreshLists();
  }, []);

  useEffect(() => {
    const onRefresh = (event) => {
      if (shouldRefresh(event, ["chat"])) refreshLists();
    };
    window.addEventListener(REFRESH_EVENT, onRefresh);
    return () => window.removeEventListener(REFRESH_EVENT, onRefresh);
  }, []);

  async function refreshLists() {
    const [contactsRes, conversationsRes] = await Promise.all([
      api.get("/chat/contacts"),
      api.get("/chat/conversations")
    ]);
    setContacts(contactsRes.data || []);
    setConversations(conversationsRes.data || []);
  }

  useEffect(() => {
    const token = localStorage.getItem("sweety_token");
    const socket = io(API_URL || window.location.origin, { auth: { token } });
    socketRef.current = socket;
    socket.on("chat:message", (message) => {
      setMessages((items) =>
        Number(message.conversation_id) === Number(active?.id) && !items.some((item) => item.id === message.id)
          ? [...items, message]
          : items
      );
      api.get("/chat/conversations").then(({ data }) => setConversations(data || []));
      invalidate(["chat", "notifications"]);
    });
    return () => socket.disconnect();
  }, [active?.id]);

  useEffect(() => {
    if (active?.id) socketRef.current?.emit("chat:join", active.id);
  }, [active?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, active?.id]);

  useEffect(() => {
    function openFromUrl() {
      const id = new URLSearchParams(window.location.search).get("conversationId");
      if (!id) return;
      api.get("/chat/conversations").then(({ data }) => {
        const found = (data || []).find((item) => String(item.id) === String(id));
        if (found) openConversation(found);
      });
    }
    openFromUrl();
    window.addEventListener("popstate", openFromUrl);
    return () => window.removeEventListener("popstate", openFromUrl);
  }, []);

  async function openContact(contact) {
    try {
      setError("");
      const payload =
        mode === "student"
          ? { facultyId: contact.id }
          : contact.role === "hod"
            ? { hodId: contact.id }
            : { studentId: contact.id };
      const { data } = await api.post("/chat/conversations", payload);
      await openConversation(data);
      await refreshLists();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to open chat");
    }
  }

  async function openConversation(conversation) {
    try {
      setError("");
      setActive(conversation);
      const { data } = await api.get(`/chat/conversations/${conversation.id}/messages`);
      setMessages(data || []);
      await api.put("/chat/messages/read", { conversationId: conversation.id });
      invalidate(["chat", "notifications"]);
    } catch (err) {
      setError(err.response?.data?.message || "You are not allowed to access this conversation.");
      setActive(null);
      setMessages([]);
      setConversations((items) => items.filter((item) => Number(item.id) !== Number(conversation.id)));
    }
  }

  async function send(event) {
    event.preventDefault();
    if (!text.trim() || !active?.id) return;
    try {
      setError("");
      const { data } = await api.post("/chat/messages", { conversationId: active.id, message: text });
      setMessages((items) => (items.some((item) => item.id === data.id) ? items : [...items, data]));
      setText("");
      await refreshLists();
      invalidate(["chat", "notifications"]);
    } catch (err) {
      setError(err.response?.data?.message || "You are not allowed to access this conversation.");
    }
  }

  const listItems = [
    ...conversations.map((item) => ({ kind: "conversation", item })),
    ...contacts.map((item) => ({ kind: "contact", item }))
  ].filter(({ item }) =>
    `${item.name || ""} ${item.student_name || ""} ${item.faculty_name || ""} ${item.roll_number || ""} ${item.faculty_id || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="app-card flex max-h-[min(720px,calc(100vh-200px))] min-h-[520px] flex-col overflow-hidden lg:max-h-[calc(100vh-180px)] lg:min-h-[600px] lg:flex-row">
      <aside className="flex w-full shrink-0 flex-col border-b border-blue-50 dark:border-slate-800 lg:w-80 lg:border-b-0 lg:border-r">
        <div className="shrink-0 border-b border-blue-50 p-4 dark:border-slate-800">
          <h3 className="font-semibold dark:text-white">
            {mode === "student" ? "Faculty / HOD" : mode === "hod" ? "Faculty / Students" : "Students / HOD"}
          </h3>
          <p className="text-sm text-muted">Branch and class contacts</p>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search user"
            className="mt-3 w-full rounded-lg border border-blue-100 px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-950"
          />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {listItems.map(({ kind, item }, index) => {
            const label =
              kind === "conversation"
                ? mode === "student" || (mode === "faculty" && item.hod_id)
                  ? item.faculty_name
                  : item.student_name
                : item.name;
            const sub =
              kind === "conversation"
                ? mode === "student" || (mode === "faculty" && item.hod_id)
                  ? item.faculty_id
                  : item.roll_number
                : item.subject_name || item.roll_number || item.faculty_id || item.email;
            const key = `${kind}-${item.id || "contact"}-${index}`;
            return (
              <button
                key={key}
                type="button"
                onClick={() => (kind === "conversation" ? openConversation(item) : openContact(item))}
                className="flex w-full items-center justify-between border-b border-blue-50 px-4 py-3 text-left hover:bg-sky-50 dark:border-slate-800 dark:hover:bg-slate-800"
              >
                <span>
                  <span className="block font-semibold dark:text-white">{label}</span>
                  <span className="text-sm text-muted">{sub}</span>
                </span>
                {Number(item.unread_count) > 0 && (
                  <span className="rounded-full bg-sweety-crimson px-2 py-1 text-xs text-white">{item.unread_count}</span>
                )}
              </button>
            );
          })}
        </div>
      </aside>

      <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-sky-50/40 dark:bg-slate-900/40">
        <div className="shrink-0 border-b border-blue-50 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="font-semibold dark:text-white">{active ? "Conversation" : "Select a contact"}</h3>
          <p className="text-sm text-emerald-600 dark:text-emerald-400">
            {active ? "Messages update in real time" : "Start a secure class chat"}
          </p>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
          {messages.length === 0 && <p className="rounded-lg bg-white p-4 text-sm text-muted dark:bg-slate-900">No Messages</p>}
          {messages.map((message) => {
            const mine = Number(message.sender_id) === Number(user.id);
            return (
              <div
                key={message.id}
                className={`max-w-[78%] rounded-lg px-4 py-2 text-sm shadow-sm ${mine ? "ml-auto bg-sweety-blue text-white" : "bg-white text-sweety-ink dark:bg-slate-800 dark:text-white"}`}
              >
                <p>{message.message}</p>
                <p className={`mt-1 text-xs ${mine ? "text-white/70" : "text-muted"}`}>
                  {new Date(message.created_at).toLocaleTimeString()}
                </p>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
        <form onSubmit={send} className="flex shrink-0 gap-3 border-t border-blue-50 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Type a message"
            className="flex-1 rounded-lg border border-blue-100 px-3 py-3 outline-none dark:border-slate-700 dark:bg-slate-950"
          />
          <button type="submit" className="rounded-lg bg-sweety-blue px-4 text-white">
            <Send size={18} />
          </button>
        </form>
      </section>
    </div>
  );
}
