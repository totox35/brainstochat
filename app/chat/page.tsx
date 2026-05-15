"use client"
import { useState, useEffect } from "react";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";
import { useCryptoInit } from "@/hooks/use-crypto";
import { useRouter } from "next/navigation";
import { Lock, Search, ArrowRight, ShieldCheck, MessageSquare } from "lucide-react";

export default function ChatPage() {
  const { user } = useUser();
  const router = useRouter();
  const supabase = createClient();
  
  const [searchEmail, setSearchEmail] = useState("");
  const [recipient, setRecipient] = useState<any>(null);
  const [error, setError] = useState("");
  
  const [myRooms, setMyRooms] = useState<any[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);

  useCryptoInit(user?.id, user?.email);

  useEffect(() => {
    const fetchMyRooms = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .ilike('fingerprint', `%${user.id}%`)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setMyRooms(data);
      }
      setLoadingRooms(false);
    };

    fetchMyRooms();
  }, [user, supabase]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const { data, error } = await supabase
      .from('public_keys')
      .select('*')
      .eq('email', searchEmail)
      .single();

    if (error || !data) {
      setError("Utilisateur introuvable ou non sécurisé.");
      setRecipient(null);
    } else {
      if (data.user_id === user?.id) {
        setError("Vous ne pouvez pas créer un tunnel avec vous-même.");
        return;
      }
      setRecipient(data);
    }
  };

  const startConversation = async () => {
    if (!user || !recipient) return;

    const ids = [user.id, recipient.user_id].sort();
    const fingerprint = ids.join('_');

    const { data: room, error } = await supabase
      .from('rooms')
      .upsert({ 
          fingerprint, 
          name: `Chat avec ${recipient.email.split('@')[0]}`,
          created_by: user.id 
      }, { onConflict: 'fingerprint' })
      .select()
      .single();

    if (error) {
        setError("Impossible de créer le tunnel.");
        return;
    }

    router.push(`/chat/${room.id}`);
  };

  if (!user) return <div className="h-screen flex items-center justify-center font-sans text-slate-400">Initialisation...</div>;

  return (
    <div className="flex flex-col min-h-screen bg-white items-center p-6 font-sans tracking-tight max-w-2xl mx-auto">
      
      <header className="w-full py-8 mb-8 border-b border-slate-50 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Messages</h1>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">Chiffrement E2EE Actif</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-bold">
          {user.email?.[0].toUpperCase()}
        </div>
      </header>

      <section className="w-full mb-12">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Nouveau tunnel</h2>
        <form onSubmit={handleSearch} className="relative group">
          <input 
            type="email"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            placeholder="Email du destinataire..."
            className="w-full py-4 px-6 rounded-2xl border border-slate-100 bg-slate-50/50 focus:outline-none focus:border-slate-900 transition-all text-sm shadow-sm"
          />
          <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-900 transition-colors">
            <Search className="w-5 h-5" />
          </button>
        </form>
        {error && <p className="mt-2 text-xs text-red-500 font-medium">{error}</p>}

        {recipient && (
          <div className="mt-4 p-4 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-between animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-green-600 w-5 h-5" />
              <span className="text-sm font-medium text-green-900">{recipient.email}</span>
            </div>
            <button 
              onClick={startConversation}
              className="bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-green-700 transition-all flex items-center gap-2"
            >
              Ouvrir <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </section>

      <section className="w-full flex-1">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Conversations récentes</h2>
        
        {loadingRooms ? (
          <div className="space-y-3">
            {[1, 2].map((i) => <div key={i} className="h-16 w-full bg-slate-50 rounded-2xl animate-pulse" />)}
          </div>
        ) : myRooms.length > 0 ? (
          <div className="grid gap-3">
            {myRooms.map((room) => (
              <button
                key={room.id}
                onClick={() => router.push(`/chat/${room.id}`)}
                className="w-full p-4 flex items-center justify-between rounded-2xl border border-slate-100 hover:border-slate-900 hover:shadow-md transition-all group bg-white"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-slate-900">{room.name}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-tighter">Sécurisé via ECDH</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-900 group-hover:translate-x-1 transition-all" />
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-slate-50 rounded-3xl">
            <Lock className="w-8 h-8 text-slate-200 mx-auto mb-3" />
            <p className="text-xs text-slate-400">Aucune conversation active.<br/>Recherchez un email pour commencer.</p>
          </div>
        )}
      </section>

      <footer className="w-full py-8 text-center">
        <p className="text-[9px] text-slate-300 font-bold uppercase tracking-[0.3em]">
          Identifiant Session : {user.email}
        </p>
      </footer>
    </div>
  );
}