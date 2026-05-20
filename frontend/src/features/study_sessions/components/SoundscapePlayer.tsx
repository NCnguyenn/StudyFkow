import React, { useEffect, useState, useRef } from 'react';
import { useFocusStore } from '@/store/useFocusStore';
import { getAudioFile } from '@/lib/audioDb';
import { Volume2, VolumeX, Music, ChevronUp, ChevronDown } from 'lucide-react';

export const SoundscapePlayer = () => {
  const { soundscape, phase, isPaused } = useFocusStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    let url: string | null = null;
    
    const loadAudio = async () => {
      if (soundscape === 'local') {
        const blob = await getAudioFile('custom_soundscape');
        if (blob) {
          url = URL.createObjectURL(blob);
          setAudioUrl(url);
        }
      } else {
        const mockUrls: Record<string, string> = {
          'rainy_cafe': 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_88447e12d2.mp3?filename=rain-and-thunder-16705.mp3',
          'deep_lofi': 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf581.mp3?filename=lofi-study-112191.mp3',
          'nature': 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=birds-in-spring-112520.mp3'
        };
        setAudioUrl(mockUrls[soundscape] || null);
      }
    };

    loadAudio();

    return () => {
      if (url && soundscape === 'local') URL.revokeObjectURL(url);
    };
  }, [soundscape]);

  useEffect(() => {
    if (audioRef.current) {
      if (phase === 'WARNING' || phase === 'SETUP' || isPaused) {
        audioRef.current.pause();
      } else {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.warn("Auto-play was prevented. User needs to interact first.", error);
          });
        }
      }
    }
  }, [phase, audioUrl, isPaused]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  return (
    <div className="fixed bottom-8 left-8 w-64 glass-card overflow-hidden transition-all duration-300">
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-white/[0.04] transition-colors"
      >
        <div className="flex items-center gap-2 text-gray-300">
          <Music className="w-4 h-4" />
          <span className="text-xs font-semibold tracking-[0.1em] uppercase">{soundscape.replace('_', ' ')}</span>
        </div>
        {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronUp className="w-4 h-4 text-gray-500" />}
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-white/[0.06]">
          <div className="flex items-center gap-3">
            {volume === 0 ? <VolumeX className="w-4 h-4 text-gray-500" /> : <Volume2 className="w-4 h-4 text-gray-400" />}
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-full appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-indigo-400 [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
            />
          </div>
        </div>
      )}

      {audioUrl && <audio ref={audioRef} src={audioUrl} loop />}
    </div>
  );
};
