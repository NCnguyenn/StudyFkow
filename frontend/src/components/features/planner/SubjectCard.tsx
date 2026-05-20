import React, { useMemo } from 'react';
import { Subject, TaskResponseData } from '@/types/planner';
import { computeSubjectAnalytics } from '@/store/useSubjectStore';
import { CheckCircle2, Clock, Pencil, Trash2 } from 'lucide-react';

interface SubjectCardProps {
  subject: Subject;
  tasks: TaskResponseData[];
  isActive?: boolean;
  onClick?: () => void;
  onEdit?: (subject: Subject) => void;
  onDelete?: (subjectId: string) => void;
}

export const SubjectCard: React.FC<SubjectCardProps> = ({ subject, tasks, isActive, onClick, onEdit, onDelete }) => {
  const analytics = useMemo(() => computeSubjectAnalytics(subject.id, tasks), [subject.id, tasks]);
  
  // Use on-time completion rate as the progress bar metric (0-100%)
  const progressPercentage = analytics.on_time_completion_rate;

  // Determine a color based on priority if no custom color is set
  const priorityColor = subject.priority === 'HIGH' ? 'text-red-600' : 
                        subject.priority === 'MEDIUM' ? 'text-amber-600' : 'text-blue-600';

  return (
    <div 
      onClick={onClick}
      className={`
        relative group cursor-pointer overflow-hidden rounded-xl p-4 transition-all duration-300
        shadow-sm hover:shadow-md
        ${isActive ? 'ring-2 ring-indigo-400' : ''}
      `}
      style={{ backgroundColor: subject.color || '#f8fafc' }}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2 pr-2 overflow-hidden">
          <h3 className="text-slate-900 font-bold truncate">{subject.title}</h3>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit?.(subject); }}
            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-black/10 transition-all text-slate-600 hover:text-slate-900"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete?.(subject.id); }}
            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-black/10 transition-all text-slate-600 hover:text-red-600 mr-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <span className={`flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/40 border border-black/5 ${priorityColor}`}>
            {subject.priority}
          </span>
        </div>
      </div>
      
      {subject.description && (
        <p className="text-sm text-slate-700 line-clamp-2 mb-3 font-medium">{subject.description}</p>
      )}

      <div className="space-y-2 mt-4">
        <div className="flex justify-between items-center text-xs text-slate-700 font-medium">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-slate-600" />
            {analytics.total_closed_tasks} completed
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-600" />
            {analytics.total_actual_minutes}m total
          </span>
        </div>
        
        <div className="w-full h-1.5 bg-black/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-slate-800 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-700 font-bold">
          <span>On-Time Rate</span>
          <span>{progressPercentage}%</span>
        </div>
      </div>
    </div>
  );
};
