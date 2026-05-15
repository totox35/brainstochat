export async function translateText(text: string, targetLang: string){
    if(!text.trim()) return text;
    try{
        const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURI(text)}`);
        const data = await res.json()
        return data[0][0][0]
    }catch(e){
        console.error("Translation error : ",e);
        return text;
    }
}