import LoginButton from "@/components/auth/LoginButton";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const cookieStore = await cookies();
  

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/chat");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-white font-sans tracking-tight">
      <div className="flex flex-col items-center max-w-sm text-center">
        <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center mb-8 shadow-xl">
           <span className="text-white font-bold text-2xl">B</span>
        </div>
        
        <h1 className="text-4xl font-extrabold mb-4 text-slate-900">BrainstoChat</h1>
        <p className="text-slate-500 mb-10 leading-relaxed">
          La messagerie instantanée ultra-sécurisée avec traduction automatique intégrée et tableau pour braionstormer !!!
        </p>
        
        <div className="w-full p-1 bg-slate-50 rounded-2xl border border-slate-100">
          <LoginButton />
        </div>
      </div>
    </main>
  );
}