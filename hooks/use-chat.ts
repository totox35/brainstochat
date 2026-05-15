import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { importPrivateKey, importPublicKey, deriveSharedSecret, decryptWithAES, encryptWithAES } from '@/lib/crypto/elliptic';
import { translateText } from '@/lib/translate';
import { channel } from 'diagnostics_channel';


export function useChat(roomId: string, user: any) {
    const [messages, setMessages] = useState<any[]>([]);
    const [sharedKey, setSharedKey] = useState<CryptoKey | null>(null);
    const [loading, setLoading] = useState(true);
    const [isOnline,setIsOnline ] = useState(false);
    const [remoteDrawData, setRemoteDrawData] = useState<any>(null);
    const [remoteIsTyping,setRemoteIsTyping ] = useState(false);

    const supabase = createClient();
    const myLanguage = typeof window !== 'undefined' ? navigator.language.split('-')[0] : 'en';

    const channelRef = useRef<any>(null);

    useEffect(() => {
        if (!user || !roomId) return;

        const processMessage = async (msg: any, key: CryptoKey) => {
            const decrypted = await decryptWithAES(msg.content, key);
            let translated = decrypted;
            if (msg.user_id !== user.id) translated = await translateText(decrypted, myLanguage);
            return { ...msg, content: decrypted, translation: translated };
        };

        const initChat = async () => {
            setLoading(true);
            
            const { data: room } = await supabase.from("rooms").select('*').eq('id', roomId).single();
            if (!room) return;

            const otherId = room.fingerprint.split('_').find((id: string) => id !== user.id);
            const { data: keyData } = await supabase.from('public_keys').select('public_key').eq('user_id', otherId).single();
            if (!keyData) return;

            const pvtKeyJwk = localStorage.getItem(`pvt_key_${user.id}`);
            if (!pvtKeyJwk) return;

            const myPvtKey = await importPrivateKey(pvtKeyJwk);
            const theirPubKey = await importPublicKey(keyData.public_key);
            const key = await deriveSharedSecret(myPvtKey, theirPubKey);

            setSharedKey(key);

            const { data: msgs } = await supabase.from('messages').select('*').eq('room_id', roomId).order('created_at', { ascending: true });

            if (msgs) {
                const processed = await Promise.all(msgs.map(m => processMessage(m, key)));
                setMessages(processed);
            }
            setLoading(false);
            
            // Création d'un channel supabase pour communiquer/récup les msgs.
            const channel = supabase.channel(`room-${roomId}`, {
                config: { presence: { key: user.id } }
            });

            channel
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
                    async (payload: any) => {
                        const processed = await processMessage(payload.new, key);
                        setMessages(prev => [...prev, processed]);
                    })
                .on('presence', {event: 'sync'}, () => {
                    const state = channel.presenceState();
                    const isOtherHere = Object.keys(state).includes(otherId as string);
                    setIsOnline(isOtherHere);
                })
                .on('broadcast', {event : 'typing'}, ({payload} : any) => {
                    if(payload.userId === otherId){
                        setRemoteIsTyping(payload.isTyping)
                    }
                })
                .on('broadcast', { event: 'draw'}, async ({ payload }) => {
                    if(payload.userId !== user.id){
                        const decrypted = await decryptWithAES(payload.data,key);
                        setRemoteDrawData(JSON.parse(decrypted));
                    }
                })
                .subscribe(async (status: string) => {
                    if (status === 'SUBSCRIBED') {
                        await channel.track({ user_id: user.id, online_at: new Date().toISOString() });
                    }
                });
            channelRef.current = channel;
        };
        initChat();

        return () => {
            if (channelRef.current) supabase.removeChannel(channelRef.current);
        };
    }, [roomId, user?.id]);

    const sendDrawData = async (paths: any) => {
        if (!sharedKey || !channelRef.current) return;
        const encrypted = await encryptWithAES(JSON.stringify(paths), sharedKey);
        channelRef.current.send({
            type: 'broadcast',
            event: 'draw',
            payload: { userId: user.id, data: encrypted },
        });
    };

    const sendTypingStatus = (typing: boolean) => {
        if (channelRef.current) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'typing',
                payload: { userId: user.id, isTyping: typing },
            });
        }
    };

    const sendMessage = async (content: string) => {
        if (!sharedKey || !content.trim()) return;
        
        const encrypted = await encryptWithAES(content, sharedKey);
        const { error } = await supabase.from('messages').insert({ 
            room_id: roomId, 
            user_id: user.id, 
            content: encrypted 
        });

        if (!error) {
            sendTypingStatus(false);
        }
    };

  return { 
        messages, 
        loading, 
        remoteDrawData,
        isOnline, 
        remoteIsTyping, 
        sendMessage,
        sendTypingStatus, 
        sendDrawData 
    };
}