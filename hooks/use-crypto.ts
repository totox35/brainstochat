import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { generateECDHKeyPair, exportPublicKey } from '@/lib/crypto/elliptic';

export function useCryptoInit(userId: string | undefined, userEmail: string | undefined){
    const supabase = createClient();

    useEffect(()=> {
        if(!userId) return;

        const initKeys = async () => {
            const hasKey = localStorage.getItem(`pvt_key_${userId}`);
            if(hasKey) return;

            const keyPair = await generateECDHKeyPair();

            const pubKeyBase64 = await exportPublicKey(keyPair.publicKey);

            //TODO : check if its legal
            const exportedPvt = await window.crypto.subtle.exportKey("jwk", keyPair.privateKey);
            localStorage.setItem(`pvt_key_${userId}`, JSON.stringify(exportedPvt));

            const browserLang = navigator.language.split("-")[0] || "en";

            await supabase.from('public_keys').upsert({
                user_id: userId,
                public_key: pubKeyBase64,
                email: userEmail,
                language_code: browserLang
            });
        };
    initKeys();
  }, [userId]);
}