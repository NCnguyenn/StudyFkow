import React, { useState } from 'react';
import { useTaskStore } from '@/store/useTaskStore';
import { TaskResponseData } from '@/types/planner';
import { AlertTriangle, X, Loader2 } from 'lucide-react';

interface RolloverPopupProps {
  task: TaskResponseData;
  onClose: () => void;
}

export const RolloverPopup: React.FC<RolloverPopupProps> = ({ task, onClose }) => {
  const { rolloverTask, updateTaskState } = useTaskStore();
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReschedule = async () => {
    if (!reason.trim()) return;
    setIsSubmitting(true);
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Update the current task to save the failed reason
      await updateTaskState(task.id, 'FAILED', reason);
      // Trigger backend logic to port subtasks to the new date
      await rolloverTask(task.id, tomorrow.toISOString());
      onClose();
    } catch (e) {
      console.error('Failed to reschedule:', e);
      setIsSubmitting(false);
    }
  };

  const handleMarkDone = async () => {
    setIsSubmitting(true);
    try {
      await updateTaskState(task.id, 'COMPLETED');
      onClose();
    } catch (e) {
      console.error('Failed to mark as done:', e);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 bg-[#151515]/90 backdrop-blur-2xl border border-red-500/30 rounded-2xl shadow-[0_10px_40px_rgba(239,68,68,0.15)] p-5 animate-in slide-in-from-bottom-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 text-red-400">
          <AlertTriangle className="w-5 h-5" />
          <h3 className="font-semibold">Task Time Expired</h3>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <p className="text-sm text-gray-300 mb-4">
        <span className="text-white font-medium">"{task.title}"</span> has passed its overtime buffer.
      </p>

      <div className="mb-4">
        <label className="block text-xs text-gray-400 mb-1">Reason for Incompletion</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="I was distracted..."
          className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-red-500/50 resize-none h-16"
        />
      </div>

      <div className="flex gap-2">
        <button 
          onClick={handleReschedule}
          disabled={!reason.trim() || isSubmitting}
          className="flex-1 py-2 flex items-center justify-center rounded-lg bg-red-500/20 text-red-300 text-sm font-medium hover:bg-red-500/30 border border-red-500/20 disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reschedule'}
        </button>
        <button 
          onClick={handleMarkDone}
          disabled={isSubmitting}
          className="flex-1 py-2 rounded-lg bg-white/10 text-white text-sm font-medium hover:bg-white/20 border border-white/5 disabled:opacity-50 transition-colors"
        >
          Mark Done
        </button>
      </div>
    </div>
  );
};
