"use client"
import { useRef, useEffect, useState } from "react";

export default function Whiteboard({ onDrawEnd, remoteData }: any) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<{x: number, y: number}[]>([]);

  // 1. Écouter les données distantes
  useEffect(() => {
    if (remoteData) {
      drawPath(remoteData, "#6366f1"); // Indigo pour l'autre
    }
  }, [remoteData]);

  // 2. Fonction de dessin
  const drawPath = (path: {x: number, y: number}[], color: string) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || path.length < 2) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    path.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.stroke();
  };

  // 3. Gestionnaires d'événements souris
  const startDrawing = (e: React.MouseEvent) => {
    const { offsetX, offsetY } = e.nativeEvent;
    setIsDrawing(true);
    setCurrentPath([{ x: offsetX, y: offsetY }]);
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = e.nativeEvent;
    const newPoint = { x: offsetX, y: offsetY };
    
    // On dessine localement en temps réel pour la fluidité
    const lastPoint = currentPath[currentPath.length - 1];
    drawPath([lastPoint, newPoint], "#0f172a"); // Noir pour soi
    
    setCurrentPath(prev => [...prev, newPoint]);
  };

  const endDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentPath.length > 1) {
      onDrawEnd(currentPath); // On envoie le trait complet une fois fini
    }
    setCurrentPath([]);
  };

  return (
    <div className="w-full h-full bg-slate-50 relative overflow-hidden">
      <canvas 
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={endDrawing}
        onMouseLeave={endDrawing}
        width={1200} // Largeur fixe interne pour la cohérence des coordonnées
        height={800}
        className="w-full h-full cursor-crosshair touch-none"
      />
    </div>
  );
}