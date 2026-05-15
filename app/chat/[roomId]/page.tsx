"use client"
import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { useChat } from "@/hooks/use-chat";
import { Lock, Send, ChevronLeft, Globe, Palette, ShieldCheck } from "lucide-react";
import Whiteboard from "@/components/chat/Whiteboard";

export default function RoomPage() {
  const { roomId } = useParams();
  const router = useRouter();
  const { user } = useUser();
  
  const { 
    messages, 
    loading, 
    sendMessage, 
    isOnline, 
    remoteIsTyping, 
    sendTypingStatus,
    remoteDrawData,
    sendDrawData
  } = useChat(roomId as string, user);
  
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    await sendMessage(newMessage);
    setNewMessage("");
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white space-y-4">
        <div className="w-12 h-12 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin" />
        <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-bold">Initialisation du tunnel</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-white font-sans tracking-tight overflow-hidden">
      
      <aside className="w-[400px] flex flex-col border-r border-slate-100 bg-white z-20 shadow-xl">
        
        <header className="p-5 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push('/chat')}
              className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-slate-900"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-slate-900 leading-none">Tunnel prive</h1>
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
              </div>
              <p className="text-[10px] text-slate-400 uppercase tracking-tighter mt-1 font-medium">
                {isOnline ? "En ligne" : "Hors ligne"}
              </p>
            </div>
          </div>
          <Lock className="w-4 h-4 text-slate-200" />
        </header>

        <main 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide bg-slate-50/30"
        >
          {messages.map((msg) => {
            const isMe = msg.user_id === user?.id;
            const hasTranslation = msg.translation && msg.translation !== msg.content;

            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                <div className="flex flex-col gap-1 max-w-[85%]">
                  <div className={`px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                      isMe ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'
                  }`}>
                    <p>{hasTranslation ? msg.translation : msg.content}</p>
                  </div>
                  {hasTranslation && (
                    <span className={`text-[9px] font-medium text-slate-400 px-2 uppercase ${isMe ? 'text-right' : 'text-left'}`}>
                      Original: {msg.content}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {remoteIsTyping && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-100 px-3 py-2 rounded-2xl rounded-tl-none flex gap-1 items-center">
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
              </div>
            </div>
          )}
        </main>

        <footer className="p-4 border-t border-slate-50 bg-white">
          <form onSubmit={handleSend} className="relative flex items-center">
            <input 
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                sendTypingStatus(e.target.value.length > 0);
              }}
              onBlur={() => sendTypingStatus(false)}
              placeholder="Message chiffré..."
              className="w-full py-3 px-4 pr-12 bg-slate-100 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all text-sm placeholder:text-slate-400"
            />
            <button 
              type="submit"
              disabled={!newMessage.trim()}
              className="absolute right-2 p-2 bg-slate-900 text-white rounded-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-20"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </footer>
      </aside>

      <section className="flex-1 relative bg-slate-50 flex flex-col overflow-hidden">
        
        <div className="absolute top-6 left-6 z-10 flex gap-2">
            <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-200 shadow-xl flex items-center gap-3">
                <div className="p-2 bg-indigo-50 rounded-xl">
                    <Palette className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                    <h2 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">Tableau Partagé</h2>
                    <div className="flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-green-500" />
                        <span className="text-[9px] text-slate-400 font-medium uppercase">Vecteurs chiffrés AES-GCM</span>
                    </div>
                </div>
            </div>
        </div>

        <div className="flex-1 w-full h-full bg-[#f8fafc] cursor-crosshair">
            <Whiteboard 
                onDrawEnd={sendDrawData} 
                remoteData={remoteDrawData} 
            />
        </div>
      </section>
    </div>
  );
}
