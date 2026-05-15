"use client"

import { createClient } from "@/lib/supabase/client"

export default function LoginButton(){
    const supabase = createClient()

    const handleLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })
    }
    return (
        <button onClick={handleLogin} className="bg-white text-black p-2 rounded shadow">
            Se connecter avec Google
        </button>
    )
}