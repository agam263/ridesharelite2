import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, Circle } from 'lucide-react';

export const SafetyChecklist: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [checks, setChecks] = useState({
    details: false,
    photo: false,
    location: false,
  });

  const toggleCheck = (key: keyof typeof checks) => {
    const newChecks = { ...checks, [key]: !checks[key] };
    setChecks(newChecks);
    if (Object.values(newChecks).every(Boolean)) {
      setTimeout(onComplete, 500);
    }
  };

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 mb-4 transition-colors">
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h3 className="font-bold text-blue-800 dark:text-blue-200">Safety First</h3>
      </div>
      <div className="space-y-2">
        <button 
          onClick={() => toggleCheck('details')}
          className="flex items-center gap-3 w-full text-left p-2 hover:bg-white dark:hover:bg-slate-800 rounded transition-colors"
        >
          {checks.details ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5 text-slate-400 dark:text-slate-500" />}
          <span className={`transition-all ${checks.details ? "text-slate-700 dark:text-slate-300 line-through opacity-50" : "text-slate-700 dark:text-slate-300"}`}>Verify car details</span>
        </button>
        <button 
          onClick={() => toggleCheck('photo')}
          className="flex items-center gap-3 w-full text-left p-2 hover:bg-white dark:hover:bg-slate-800 rounded transition-colors"
        >
          {checks.photo ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5 text-slate-400 dark:text-slate-500" />}
          <span className={`transition-all ${checks.photo ? "text-slate-700 dark:text-slate-300 line-through opacity-50" : "text-slate-700 dark:text-slate-300"}`}>Check driver photo</span>
        </button>
        <button 
          onClick={() => toggleCheck('location')}
          className="flex items-center gap-3 w-full text-left p-2 hover:bg-white dark:hover:bg-slate-800 rounded transition-colors"
        >
          {checks.location ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5 text-slate-400 dark:text-slate-500" />}
          <span className={`transition-all ${checks.location ? "text-slate-700 dark:text-slate-300 line-through opacity-50" : "text-slate-700 dark:text-slate-300"}`}>Share location with friend</span>
        </button>
      </div>
    </div>
  );
};