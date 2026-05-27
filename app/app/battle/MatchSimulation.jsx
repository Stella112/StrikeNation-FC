"use client";

import { useState, useEffect, useRef } from "react";

// Helper to play a beep using Web Audio API
function playWhistle(type) {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.type = "sine";
    
    if (type === "kickoff" || type === "foul") {
      oscillator.frequency.setValueAtTime(1500, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.3);
    } else if (type === "fulltime" || type === "halftime") {
      oscillator.frequency.setValueAtTime(1500, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      oscillator.start();
      // short, short, long
      gainNode.gain.setTargetAtTime(0, audioCtx.currentTime + 0.2, 0.015);
      
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.frequency.value = 1500;
      gain2.gain.value = 0.1;
      osc2.start(audioCtx.currentTime + 0.4);
      gain2.gain.setTargetAtTime(0, audioCtx.currentTime + 0.6, 0.015);
      osc2.stop(audioCtx.currentTime + 0.7);
      
      const osc3 = audioCtx.createOscillator();
      const gain3 = audioCtx.createGain();
      osc3.connect(gain3);
      gain3.connect(audioCtx.destination);
      osc3.frequency.value = 1500;
      gain3.gain.value = 0.1;
      osc3.start(audioCtx.currentTime + 0.8);
      gain3.gain.setTargetAtTime(0, audioCtx.currentTime + 1.5, 0.015);
      osc3.stop(audioCtx.currentTime + 1.6);
    }
  } catch (e) {
    console.error("Audio play failed", e);
  }
}

// Generates an array of players with initial X,Y coordinates (0-100 percentages)
function generateSquad(isOpponent) {
  // Simple 4-3-3 shape for both
  const positions = [
    { x: 50, y: 90 }, // GK
    { x: 20, y: 70 }, { x: 40, y: 75 }, { x: 60, y: 75 }, { x: 80, y: 70 }, // DEF
    { x: 30, y: 50 }, { x: 50, y: 55 }, { x: 70, y: 50 }, // MID
    { x: 20, y: 30 }, { x: 50, y: 20 }, { x: 80, y: 30 }  // ATT
  ];
  return positions.map((p, i) => ({
    id: `${isOpponent ? 'opp' : 'home'}-${i}`,
    x: p.x,
    // opponent goes from top to bottom, home goes from bottom to top
    y: isOpponent ? 100 - p.y : p.y,
    baseX: p.x,
    baseY: isOpponent ? 100 - p.y : p.y
  }));
}

export function MatchSimulation({ onComplete }) {
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [matchMinutes, setMatchMinutes] = useState(0); // 0 to 90
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  
  const [homeSquad, setHomeSquad] = useState(() => generateSquad(false));
  const [awaySquad, setAwaySquad] = useState(() => generateSquad(true));
  const [ballPos, setBallPos] = useState({ x: 50, y: 50 });
  
  const [commentary, setCommentary] = useState([{ time: 0, text: "Match is starting. Players taking the pitch...", type: "info" }]);
  const [liveEvent, setLiveEvent] = useState(null);

  const requestRef = useRef();
  const lastUpdateRef = useRef(Date.now());
  const simulationStartTime = useRef(Date.now());

  const TOTAL_SIM_SECONDS = 60; // Total real-world seconds
  const isDev = process.env.NODE_ENV === "development";

  const addCommentary = (text, type = "normal", timeOverride = null) => {
    setCommentary(prev => {
      const newLogs = [{ time: timeOverride ?? matchMinutes, text, type }, ...prev];
      return newLogs.slice(0, 5); // Keep last 5
    });
  };

  const triggerEvent = (eventName, text) => {
    setLiveEvent(eventName);
    addCommentary(text, "event");
    playWhistle("foul");
    setTimeout(() => setLiveEvent(null), 3000);
  };

  useEffect(() => {
    playWhistle("kickoff");
    addCommentary("Peep! We are underway in the X Layer Arena.", "info", 0);

    const updateLoop = () => {
      const now = Date.now();
      const delta = now - lastUpdateRef.current;
      const totalElapsed = (now - simulationStartTime.current) / 1000;
      
      setSecondsElapsed(totalElapsed);
      const currentMinute = Math.min(90, Math.floor((totalElapsed / TOTAL_SIM_SECONDS) * 90));
      setMatchMinutes(currentMinute);

      if (totalElapsed >= TOTAL_SIM_SECONDS) {
        // Match over
        playWhistle("fulltime");
        addCommentary("FULL TIME! The match is over. Hashing final state to X Layer...", "info", 90);
        setTimeout(onComplete, 3000);
        return; // stop loop
      }

      // Update positions every ~500ms
      if (delta > 500) {
        lastUpdateRef.current = now;
        
        // Random ball movement
        const newBallX = Math.max(5, Math.min(95, ballPos.x + (Math.random() * 20 - 10)));
        const newBallY = Math.max(5, Math.min(95, ballPos.y + (Math.random() * 20 - 10)));
        setBallPos({ x: newBallX, y: newBallY });

        // Players drift around their base position towards ball
        setHomeSquad(prev => prev.map(p => ({
          ...p,
          x: Math.max(2, Math.min(98, p.baseX + (Math.random() * 10 - 5) + (newBallX - p.baseX) * 0.1)),
          y: Math.max(2, Math.min(98, p.baseY + (Math.random() * 10 - 5) + (newBallY - p.baseY) * 0.1))
        })));
        setAwaySquad(prev => prev.map(p => ({
          ...p,
          x: Math.max(2, Math.min(98, p.baseX + (Math.random() * 10 - 5) + (newBallX - p.baseX) * 0.1)),
          y: Math.max(2, Math.min(98, p.baseY + (Math.random() * 10 - 5) + (newBallY - p.baseY) * 0.1))
        })));

        // Random Events
        const chance = Math.random();
        if (chance < 0.015 && currentMinute > 2) {
          // Goal
          const isHome = Math.random() > 0.5;
          if (isHome) {
            setHomeScore(s => s + 1);
            setLiveEvent("GOAL");
            playWhistle("kickoff");
            addCommentary("GOOOAAALLL! Brilliant strike from Nigeria!", "goal");
          } else {
            setAwayScore(s => s + 1);
            setLiveEvent("GOAL");
            playWhistle("kickoff");
            addCommentary("GOAL! The away side finds the back of the net.", "goal");
          }
          setTimeout(() => setLiveEvent(null), 3000);
        } else if (chance < 0.02) {
          triggerEvent("VAR CHECK", "VAR is reviewing a potential foul in the box...");
        } else if (chance < 0.025) {
          triggerEvent("YELLOW CARD", "Reckless challenge! The referee reaches into his pocket.");
        } else if (chance < 0.03) {
          triggerEvent("OFFSIDE", "Flag goes up! Striker strayed just offside.");
        } else if (chance < 0.035) {
          triggerEvent("FREE KICK", "Foul given in a dangerous area.");
        } else if (chance < 0.06) {
          const events = [
            "Good build-up play in the midfield.",
            "Claude Engine detects an overlapping run on the right flank.",
            "Solid defensive block.",
            "They're controlling possession well here.",
            "Keeper comes out to claim the cross easily."
          ];
          addCommentary(events[Math.floor(Math.random() * events.length)]);
        }
        
        if (currentMinute === 45 && !commentary.find(c => c.text.includes("HALF TIME"))) {
          playWhistle("halftime");
          addCommentary("HALF TIME. Both teams head to the tunnel. Strategies readjusting.", "info", 45);
        }
      }

      requestRef.current = requestAnimationFrame(updateLoop);
    };

    requestRef.current = requestAnimationFrame(updateLoop);

    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Scoreboard */}
      <div className="flex items-center justify-between bg-card border border-border p-4 md:p-6 rounded-sm">
        <div className="flex items-center gap-4">
          <span className="font-display text-2xl md:text-3xl uppercase italic">NGA</span>
          <span className="font-display text-4xl text-primary">{homeScore}</span>
        </div>
        <div className="text-center flex flex-col items-center">
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground animate-pulse mb-1">
            Match Live
          </span>
          <span className="font-display text-3xl md:text-4xl text-primary font-bold">
            {matchMinutes}'
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-display text-4xl">{awayScore}</span>
          <span className="font-display text-2xl md:text-3xl uppercase italic">AWY</span>
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr_300px] gap-6">
        {/* Pitch Area */}
        <div className="relative aspect-[4/3] bg-pitch/10 border border-pitch/30 rounded-sm overflow-hidden flex items-center justify-center">
          <div className="absolute inset-4 border-2 border-pitch/40 pointer-events-none"></div>
          <div className="absolute inset-x-4 top-1/2 h-px bg-pitch/40 pointer-events-none"></div>
          <div className="absolute left-1/2 top-1/2 size-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-pitch/40 pointer-events-none md:size-28"></div>
          
          {/* Big Live Event Overlay */}
          {liveEvent && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
              <span className="font-display text-5xl md:text-7xl uppercase italic tracking-widest text-primary drop-shadow-[0_0_15px_rgba(255,51,102,0.8)]">
                {liveEvent}
              </span>
            </div>
          )}

          {/* Home Players */}
          {homeSquad.map(p => (
            <div 
              key={p.id}
              className="absolute size-3 rounded-full bg-primary border border-background shadow-[0_0_8px_rgba(255,51,102,0.6)] transition-all duration-500 ease-linear"
              style={{ left: `${p.x}%`, top: `${p.y}%`, transform: 'translate(-50%, -50%)' }}
            />
          ))}

          {/* Away Players */}
          {awaySquad.map(p => (
            <div 
              key={p.id}
              className="absolute size-3 rounded-full bg-foreground border border-background shadow-md transition-all duration-500 ease-linear"
              style={{ left: `${p.x}%`, top: `${p.y}%`, transform: 'translate(-50%, -50%)' }}
            />
          ))}

          {/* Ball */}
          <div 
            className="absolute size-2 rounded-full bg-white z-10 transition-all duration-500 ease-linear shadow-[0_0_10px_rgba(255,255,255,0.8)]"
            style={{ left: `${ballPos.x}%`, top: `${ballPos.y}%`, transform: 'translate(-50%, -50%)' }}
          />
        </div>

        {/* Live Commentary Feed */}
        <div className="bg-card border border-border flex flex-col h-full max-h-[400px]">
          <div className="p-3 border-b border-border flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4 text-primary animate-pulse">
              <path d="M12 18V5"/><path d="M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4"/><path d="M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5"/><path d="M17.997 5.125a4 4 0 0 1 2.526 5.77"/><path d="M18 18a4 4 0 0 0 2-7.464"/><path d="M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517"/><path d="M6 18a4 4 0 0 1-2-7.464"/><path d="M6.003 5.125a4 4 0 0 0-2.526 5.77"/>
            </svg>
            <span className="font-display text-lg uppercase italic">Claude Comms</span>
          </div>
          <div className="flex-1 overflow-hidden p-4 space-y-4 flex flex-col justify-end">
            {commentary.map((c, i) => (
              <div key={i} className="animate-fade-in flex gap-3 text-sm">
                <span className="font-mono text-[10px] uppercase text-muted-foreground pt-1 min-w-[24px]">
                  {c.time}'
                </span>
                <span className={`leading-relaxed ${
                  c.type === "goal" ? "text-primary font-bold" : 
                  c.type === "event" ? "text-foreground font-semibold" : 
                  "text-muted-foreground"
                }`}>
                  {c.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isDev && (
        <button onClick={onComplete} className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground hover:text-foreground underline">
          [Dev Only] Skip to Result
        </button>
      )}

    </div>
  );
}
