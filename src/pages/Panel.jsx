import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function Panel() {
  const [messages, setMessages] = useState([]);
  const [botStatus, setBotStatus] = useState("offline");

  // 🔥 STATUS DO BOT
  useEffect(() => {
    let lastData = null;

    function isOnline(last_ping) {
      const diff = (new Date() - new Date(last_ping)) / 1000;
      return diff < 30;
    }

    async function load() {
      const { data } = await supabase
        .from("bot_status")
        .select("*")
        .eq("id", "bot-main")
        .single();

      if (data) {
        lastData = data;
        setBotStatus(isOnline(data.last_ping) ? "online" : "offline");
      }
    }

    load();

    const channel = supabase
      .channel("bot-status")
      .on("postgres_changes", { event: "*", schema: "public", table: "bot_status" }, (payload) => {
        const data = payload.new;
        if (data.id === "bot-main") {
          lastData = data;
          setBotStatus(isOnline(data.last_ping) ? "online" : "offline");
        }
      })
      .subscribe();

    const interval = setInterval(() => {
      if (!lastData) return;
      if (!isOnline(lastData.last_ping)) setBotStatus("offline");
    }, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  // 💬 MENSAGENS (BASE)
  useEffect(() => {
    async function loadMessages() {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .limit(50)
        .order("created_at", { ascending: false });

      setMessages(data || []);
    }

    loadMessages();
  }, []);

  return (
    <div className="flex h-screen bg-[#0f172a] text-white">

      {/* 🧭 SIDEBAR SERVERS */}
      <div className="w-16 bg-[#020617] flex flex-col items-center py-4 gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
          G
        </div>
      </div>

      {/* 📁 CANAIS */}
      <div className="w-56 bg-[#020617] p-4">
        <h2 className="text-sm text-gray-400 mb-3">CANAIS</h2>

        <div className="space-y-2">
          <div className="hover:bg-[#1e293b] p-2 rounded cursor-pointer">
            # geral
          </div>
        </div>
      </div>

      {/* 💬 CHAT */}
      <div className="flex-1 flex flex-col">

        {/* 🔝 HEADER */}
        <div className="h-14 border-b border-gray-800 flex items-center justify-between px-4">
          <span># geral</span>

          <span className="flex items-center gap-2 text-sm">
            <span className={`w-2 h-2 rounded-full ${
              botStatus === "online" ? "bg-green-500" : "bg-red-500"
            }`} />

            {botStatus === "online" ? "Bot Online" : "Bot Offline"}
          </span>
        </div>

        {/* 💬 MENSAGENS */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className="bg-[#1e293b] p-3 rounded">
              <div className="text-xs text-gray-400">
                {msg.user_id}
              </div>
              <div>{msg.content}</div>
            </div>
          ))}
        </div>

        {/* ✏️ INPUT */}
        <div className="p-3 border-t border-gray-800">
          <input
            placeholder="Digite uma mensagem..."
            className="w-full bg-[#020617] p-3 rounded outline-none"
          />
        </div>
      </div>
    </div>
  );
}
