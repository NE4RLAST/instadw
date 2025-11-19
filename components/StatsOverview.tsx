import React from 'react';
import { Users, HardDrive, Clock, Instagram } from 'lucide-react';

interface StatsOverviewProps {
  userCount: number;
  archivedCount: number;
  nextCheckIn: number; // seconds
  isRunning: boolean;
}

const StatsOverview: React.FC<StatsOverviewProps> = ({ userCount, archivedCount, nextCheckIn, isRunning }) => {
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex items-center gap-4">
        <div className="p-3 bg-pink-500/10 rounded-full text-pink-500">
          <Instagram size={24} />
        </div>
        <div>
          <p className="text-slate-400 text-xs font-medium uppercase">Monitored</p>
          <h4 className="text-2xl font-bold text-white">{userCount}</h4>
        </div>
      </div>

      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex items-center gap-4">
        <div className="p-3 bg-blue-500/10 rounded-full text-blue-500">
          <HardDrive size={24} />
        </div>
        <div>
          <p className="text-slate-400 text-xs font-medium uppercase">Archived Items</p>
          <h4 className="text-2xl font-bold text-white">{archivedCount}</h4>
        </div>
      </div>

      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex items-center gap-4">
        <div className={`p-3 rounded-full ${isRunning ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
          <Clock size={24} />
        </div>
        <div>
          <p className="text-slate-400 text-xs font-medium uppercase">Next Check</p>
          <h4 className="text-2xl font-bold text-white">
            {isRunning ? formatTime(nextCheckIn) : 'Paused'}
          </h4>
        </div>
      </div>
      
      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-400">Drive Storage</span>
            <span className="text-xs text-emerald-400">Connected</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '12%' }}></div>
          </div>
      </div>
    </div>
  );
};

export default StatsOverview;