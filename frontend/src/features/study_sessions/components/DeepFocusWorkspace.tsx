import React, { useEffect, useRef } from 'react';
import { useFocusStore } from '@/store/useFocusStore';
import { useTaskStore } from '@/store/useTaskStore';
import { useStudySession } from '@/features/study_sessions/hooks/useStudySession';
import { ZenClock } from './ZenClock';
import { SoundscapePlayer } from './SoundscapePlayer';
import { useStrictFocus } from '@/hooks/useStrictFocus';
import { Play, Pause, SkipForward, Square, CheckCircle2, Circle, WifiOff } from 'lucide-react';
import QuickToast from '@/components/room/QuickToast';

const TaskQuickList = ({ taskId }: { taskId: string }) => {
  const { tasks, updateTask } = useTaskStore();
  const task = tasks.find(t => t.id === taskId);
  const [animatingIndex, setAnimatingIndex] = React.useState<number | null>(null);
  const [showToast, setShowToast] = React.useState(false);

  if (!task) return null;

  const toggleSubtask = (index: number) => {
    if (!task.subtasks) return;
    const wasCompleted = task.subtasks[index].is_completed;
    const newSubtasks = [...task.subtasks];
    newSubtasks[index] = { 
      ...newSubtasks[index], 
      is_completed: !newSubtasks[index].is_completed 
    };
    updateTask(task.id, { subtasks: newSubtasks });

    if (!wasCompleted) {
      setAnimatingIndex(index);
      setShowToast(true);
      setTimeout(() => setAnimatingIndex(null), 500);
    }
  };

  return (
    <>
    <div className="fixed bottom-8 right-8 w-80 room-glass rounded-xl p-5 animate-in slide-in-from-bottom-4 border border-white/[0.08]">
      <h3 className="text-xs font-semibold text-indigo-400/80 mb-3 tracking-[0.2em] uppercase">Focus Target</h3>
      <p className="text-white font-medium mb-4">{task.title}</p>
      
      <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
        {task.subtasks?.map((st, i) => (
          <div 
            key={i} 
            onClick={() => toggleSubtask(i)}
            className={`flex items-center gap-3 p-2 hover:bg-white/[0.05] rounded-lg cursor-pointer transition-colors group ${animatingIndex === i ? 'task-complete-flash' : ''}`}
          >
            {st.is_completed ? (
              <svg className={`w-4 h-4 shrink-0 ${animatingIndex === i ? 'task-check-draw' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" className="text-indigo-400" />
                <path d="M8 12.5 L11 15.5 L16.5 9" className="text-indigo-400" />
              </svg>
            ) : (
              <Circle className="w-4 h-4 text-gray-500 group-hover:text-gray-400 shrink-0" />
            )}
            <span className={`text-sm truncate ${st.is_completed ? `text-gray-500 line-through ${animatingIndex === i ? 'task-strike-sweep' : ''}` : 'text-gray-300'}`}>
              {st.title}
            </span>
          </div>
        ))}
        {(!task.subtasks || task.subtasks.length === 0) && (
          <p className="text-xs text-gray-500 italic">No checklist items.</p>
        )}
      </div>
    </div>
    {showToast && <QuickToast message="✅ Nice!" onDone={() => setShowToast(false)} />}
    </>
  );
};

export const DeepFocusWorkspace = () => {
  const { 
    phase, 
    linkedTaskId, 
    tick, 
    isPaused, 
    togglePause, 
    transitionPhase, 
    abortSession,
    setPhase,
    preset,
  } = useFocusStore();

  const studySession = useStudySession();
  // Track previous phase to detect transitions without stale closures
  const prevPhaseRef = useRef<any>(undefined);

  useStrictFocus();

  // ---------------------------------------------------------------------------
  // P0: Backend State Machine Orchestration
  // Map FocusStore phase transitions → useStudySession actions
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = phase;

    if (prev === phase && prev !== undefined) return;

    // SETUP/undefined → FOCUSING: user clicked "Start" — begin backend session
    if ((prev === 'SETUP' || prev === undefined) && phase === 'FOCUSING') {
      studySession.start(preset.name, useFocusStore.getState().linkedTaskId);
    }

    // FOCUSING/WARNING → ABANDONED: tab abandonment detected by useStrictFocus
    // Pause the backend session to halt authoritative timer
    if ((prev === 'FOCUSING' || prev === 'WARNING') && phase === 'ABANDONED') {
      studySession.pause();
    }

    // ABANDONED → FOCUSING/WARNING: user clicked Resume in controls
    // Resume the backend session
    if (prev === 'ABANDONED' && (phase === 'FOCUSING' || phase === 'WARNING')) {
      studySession.resume();
    }

    // FOCUSING/WARNING/BREAK → COMPLETED: natural phase completion
    // End the backend session
    if (phase === 'COMPLETED') {
      studySession.end();
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps
  // Note: studySession methods are stable useCallback refs; preset.name is only
  // needed at start time. We deliberately omit them to avoid spurious re-runs.

  // P0: Abort maps to backend end() as well
  const handleAbort = () => {
    abortSession();
    if (studySession.state === 'ACTIVE' || studySession.state === 'PAUSED') {
      studySession.end();
    }
  };

  // ---------------------------------------------------------------------------
  // Timer engine — runs entirely inside Zustand via tick()
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (isPaused || phase === 'SETUP' || phase === 'COMPLETED') return;
    if (phase === 'ABANDONED') return; // ABANDONED halts timer until user resumes

    const intervalId = setInterval(() => {
      tick();
    }, 1000);

    return () => clearInterval(intervalId);
  }, [phase, isPaused, tick]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative animate-in fade-in duration-1000">

      {/* P0: Offline Mode Banner — highly visible, absolute positioned */}
      {studySession.isOffline && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-amber-400/20 border border-amber-400/50 backdrop-blur-md shadow-lg animate-in fade-in slide-in-from-top-2">
          <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-sm font-semibold text-amber-300 tracking-wide">
            Offline Mode — Data won&apos;t sync
          </span>
        </div>
      )}

      {/* Heartbeat failure subtle indicator */}
      {studySession.heartbeatFailed && !studySession.isOffline && (
        <div className="absolute top-4 right-6 z-50 flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-400/30 text-yellow-400 text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
          Sync delayed
        </div>
      )}
      
      <ZenClock />

      <SoundscapePlayer />

      {linkedTaskId && <TaskQuickList taskId={linkedTaskId} />}

      {/* Minimalistic Floating Controls */}
      <div className="fixed bottom-10 flex items-center gap-3 room-glass rounded-full px-5 py-2.5 border border-white/[0.08]">
        
        {phase === 'ABANDONED' ? (
          <button 
            onClick={() => setPhase(useFocusStore.getState().timeLeft <= 60 ? 'WARNING' : 'FOCUSING')}
            className="p-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-full transition-colors flex items-center gap-2"
          >
            <Play className="w-5 h-5 fill-current" />
            <span className="text-sm font-medium pr-2 tracking-wider">Resume</span>
          </button>
        ) : (
          <button 
            onClick={togglePause}
            className="p-3 hover:bg-white/[0.08] text-gray-300 hover:text-white rounded-full transition-colors"
          >
            {isPaused ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5 fill-current" />}
          </button>
        )}

        <button 
          onClick={transitionPhase}
          className="p-3 hover:bg-white/[0.08] text-gray-300 hover:text-white rounded-full transition-colors"
          title="Skip Phase"
        >
          <SkipForward className="w-5 h-5 fill-current" />
        </button>

        <div className="w-px h-6 bg-white/[0.08] mx-1" />

        <button 
          onClick={handleAbort}
          className="p-3 hover:bg-red-500/15 text-gray-400 hover:text-red-400 rounded-full transition-colors"
          title="Abort Session"
        >
          <Square className="w-5 h-5 fill-current" />
        </button>

      </div>
    </div>
  );
};
