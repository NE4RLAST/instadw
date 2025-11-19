import React from 'react';
import { ActivityLog } from '../types';
import { Activity, CheckCircle, AlertCircle, CloudUpload, Download } from 'lucide-react';

interface ActivityLogViewerProps {
  logs: ActivityLog[];
}

const ActivityLogViewer: React.FC<ActivityLogViewerProps> = ({ logs }) => {
  const getIcon = (action: ActivityLog['action']) => {
    switch (action) {
      case 'check': return <Activity size={16} className="text-blue-400" />;
      case 'download': return <Download size={16} className="text-yellow-400" />;
      case 'upload': return <CloudUpload size={16} className="text-green-400" />;
      case 'error': return <AlertCircle size={16} className="text-red-400" />;
      default: return <CheckCircle size={16} className="text-gray-400" />;
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 h-full flex flex-col">
      <div className="p-4 border-b border-slate-700 flex justify-between items-center">
        <h3 className="font-semibold text-slate-200 flex items-center gap-2">
          <Activity size={18} /> System Logs
        </h3>
        <span className="text-xs text-slate-500">{logs.length} Events</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {logs.length === 0 ? (
          <div className="text-center text-slate-500 mt-10 text-sm">No activity recorded yet.</div>
        ) : (
          logs.slice().reverse().map((log) => (
            <div key={log.id} className="flex items-start gap-3 p-3 rounded bg-slate-700/30 hover:bg-slate-700/50 transition-colors text-sm border border-slate-700/50">
              <div className="mt-0.5">{getIcon(log.action)}</div>
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="font-medium text-slate-200">@{log.username}</span>
                  <span className="text-xs text-slate-500">
                    {log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                <p className="text-slate-400 text-xs">{log.details}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActivityLogViewer;