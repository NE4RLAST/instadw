import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  LayoutDashboard, 
  Users as UsersIcon, 
  Settings, 
  Play, 
  Pause, 
  Plus, 
  Trash2, 
  HelpCircle,
  Cloud,
  RefreshCw,
  Rocket
} from 'lucide-react';
import { MonitoredUser, ActivityLog, ArchivedItem, AppState } from './types';
import { simulateInstagramCheck } from './services/geminiService';
import ActivityLogViewer from './components/ActivityLogViewer';
import StatsOverview from './components/StatsOverview';
import ArchiveGallery from './components/ArchiveGallery';
import DeploymentGenerator from './components/DeploymentGenerator';

// Initial Mock Data
const INITIAL_USERS: MonitoredUser[] = [
  { id: '1', username: 'natgeo', lastChecked: null, status: 'active' },
  { id: '2', username: 'nasa', lastChecked: null, status: 'active' },
  { id: '3', username: 'techcrunch', lastChecked: null, status: 'paused' },
];

export default function App() {
  // --- State ---
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'settings' | 'deployment' | 'guide'>('dashboard');
  const [users, setUsers] = useState<MonitoredUser[]>(INITIAL_USERS);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [archivedItems, setArchivedItems] = useState<ArchivedItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [checkIntervalMinutes, setCheckIntervalMinutes] = useState(30);
  const [countdown, setCountdown] = useState(30 * 60); // in seconds
  const [newUsername, setNewUsername] = useState('');

  // --- Logic ---

  // Logging Helper
  const addLog = useCallback((username: string, action: ActivityLog['action'], details: string, status: ActivityLog['status'] = 'info') => {
    const newLog: ActivityLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      username,
      action,
      details,
      status
    };
    setLogs(prev => [newLog, ...prev]);
  }, []);

  // The Core Check Logic
  const performCheck = useCallback(async () => {
    if (users.length === 0) return;

    addLog('System', 'check', `Starting batch check for ${users.length} users...`, 'info');

    for (const user of users) {
      if (user.status !== 'active') continue;

      try {
        addLog(user.username, 'check', 'Checking for new updates...', 'info');
        
        // Simulate API call to Instagram (via Gemini)
        const result = await simulateInstagramCheck(user.username);

        if (result.hasNewContent && result.imageUrl) {
          addLog(user.username, 'download', `Found new ${result.type}! Downloading...`, 'success');
          
          // Simulate Upload to Drive
          await new Promise(resolve => setTimeout(resolve, 1000)); // Fake network delay
          addLog(user.username, 'upload', 'Uploaded successfully to Google Drive /Archive folder', 'success');

          // Update Archive State
          const newItem: ArchivedItem = {
            id: Math.random().toString(36).substr(2, 9),
            username: user.username,
            type: result.type || 'post',
            imageUrl: result.imageUrl,
            caption: result.caption || 'No caption',
            archivedAt: new Date()
          };
          setArchivedItems(prev => [newItem, ...prev]);

        } else {
          addLog(user.username, 'check', 'No new posts found.', 'info');
        }

        // Update user last checked time
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, lastChecked: new Date() } : u));

      } catch (error) {
        addLog(user.username, 'error', 'Failed to check profile', 'failure');
      }
    }
    
    addLog('System', 'check', 'Batch check completed. Waiting for next cycle.', 'info');
  }, [users, addLog]);

  // Timer Effect
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    if (isRunning) {
      intervalId = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            performCheck();
            return checkIntervalMinutes * 60; // Reset timer
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(intervalId);
  }, [isRunning, checkIntervalMinutes, performCheck]);


  // Handlers
  const toggleSystem = () => {
    setIsRunning(!isRunning);
    if (!isRunning) {
      addLog('System', 'check', 'System started. Auto-monitoring active.', 'success');
    } else {
      addLog('System', 'check', 'System paused by user.', 'info');
    }
  };

  const addUser = () => {
    if (!newUsername.trim()) return;
    const newUser: MonitoredUser = {
      id: Math.random().toString(36).substr(2, 9),
      username: newUsername.replace('@', '').trim(),
      lastChecked: null,
      status: 'active'
    };
    setUsers([...users, newUser]);
    setNewUsername('');
    addLog(newUser.username, 'check', 'User added to monitoring list', 'info');
  };

  const removeUser = (id: string) => {
    setUsers(users.filter(u => u.id !== id));
  };

  const triggerManualCheck = () => {
    performCheck();
    setCountdown(checkIntervalMinutes * 60);
  };

  // --- Render ---
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-900 text-slate-200">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-950 border-r border-slate-800 flex-shrink-0">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Cloud size={18} className="text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">InstaArchiver</span>
        </div>
        
        <nav className="p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'users' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <UsersIcon size={18} /> Monitoring List
          </button>
          <button 
            onClick={() => setActiveTab('deployment')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'deployment' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Rocket size={18} /> VPS Deployment
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'settings' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Settings size={18} /> Configuration
          </button>
          <button 
            onClick={() => setActiveTab('guide')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'guide' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <HelpCircle size={18} /> How It Works
          </button>
        </nav>

        <div className="p-4 mt-auto border-t border-slate-800">
           <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">System Status</span>
                <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
              </div>
              <button 
                onClick={toggleSystem}
                className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg font-semibold text-sm transition-colors ${isRunning ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-green-500 text-white hover:bg-green-600'}`}
              >
                {isRunning ? <><Pause size={16} /> Stop System</> : <><Play size={16} /> Start Monitoring</>}
              </button>
              {isRunning && (
                <div className="mt-3 text-center">
                  <p className="text-[10px] text-slate-500">Next check in</p>
                  <p className="font-mono text-xl font-bold text-slate-300">
                    {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                  </p>
                </div>
              )}
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        
        {/* Dashboard View */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
                <p className="text-slate-400 text-sm">Real-time monitoring and archiving overview (Simulation Mode).</p>
              </div>
              <button onClick={triggerManualCheck} className="p-2 bg-slate-800 border border-slate-700 text-slate-300 rounded hover:bg-slate-700 transition-colors" title="Force Check Now">
                <RefreshCw size={18} />
              </button>
            </div>

            <StatsOverview 
              userCount={users.filter(u => u.status === 'active').length}
              archivedCount={archivedItems.length}
              nextCheckIn={countdown}
              isRunning={isRunning}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[400px]">
              <div className="lg:col-span-2 h-full">
                <ArchiveGallery items={archivedItems} />
              </div>
              <div className="lg:col-span-1 h-full">
                <ActivityLogViewer logs={logs} />
              </div>
            </div>
          </div>
        )}

        {/* User Management View */}
        {activeTab === 'users' && (
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">Monitoring List</h1>
                <p className="text-slate-400 text-sm">Manage the Instagram accounts you want to archive.</p>
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 mb-6">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Plus size={18} /> Add New User</h3>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">@</span>
                  <input 
                    type="text" 
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="instagram_username"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-8 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    onKeyDown={(e) => e.key === 'Enter' && addUser()}
                  />
                </div>
                <button onClick={addUser} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                  Add
                </button>
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
              <table className="w-full text-left text-sm text-slate-400">
                <thead className="bg-slate-900/50 uppercase text-xs font-medium border-b border-slate-700">
                  <tr>
                    <th className="px-6 py-4">Account</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Last Checked</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-white">@{user.username}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          user.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {user.lastChecked ? user.lastChecked.toLocaleString() : 'Never'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => removeUser(user.id)}
                          className="text-slate-500 hover:text-red-400 transition-colors"
                          title="Remove"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                        No users currently monitored. Add one above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Deployment Generator View */}
        {activeTab === 'deployment' && (
          <DeploymentGenerator users={users} checkInterval={checkIntervalMinutes} />
        )}

        {/* Settings View */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto">
             <h1 className="text-2xl font-bold text-white mb-6">Configuration</h1>
             
             <div className="space-y-6">
               {/* Frequency */}
               <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                  <h3 className="text-lg font-semibold text-white mb-1">Check Frequency</h3>
                  <p className="text-slate-400 text-sm mb-4">How often should the system check for new posts?</p>
                  
                  <div className="flex items-center gap-4">
                    <input 
                      type="range" 
                      min="10" 
                      max="120" 
                      step="10"
                      value={checkIntervalMinutes}
                      onChange={(e) => setCheckIntervalMinutes(Number(e.target.value))}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <span className="px-4 py-2 bg-slate-900 rounded-lg font-mono text-blue-400 whitespace-nowrap border border-slate-700">
                      {checkIntervalMinutes} Minutes
                    </span>
                  </div>
               </div>

               {/* Storage */}
               <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                  <h3 className="text-lg font-semibold text-white mb-1">Storage Connection</h3>
                  <p className="text-slate-400 text-sm mb-4">Destination for downloaded media.</p>
                  
                  <div className="flex items-center justify-between p-4 bg-slate-900 rounded-lg border border-slate-700 border-l-4 border-l-emerald-500">
                    <div className="flex items-center gap-3">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" alt="Drive" className="w-8 h-8" />
                      <div>
                        <p className="font-medium text-white">Google Drive</p>
                        <p className="text-xs text-emerald-500">Connected as user@example.com</p>
                      </div>
                    </div>
                    <button className="text-xs text-slate-400 hover:text-white underline">Change</button>
                  </div>
               </div>
             </div>
          </div>
        )}

        {/* Guide View */}
        {activeTab === 'guide' && (
          <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold text-white mb-6">Implementation Roadmap</h1>
            
            <div className="space-y-6">
              <div className="bg-blue-900/20 border border-blue-500/30 p-6 rounded-lg">
                <h3 className="text-lg font-bold text-blue-400 mb-2">⚠️ Important Technical Note</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Instagram does not allow direct scraping from a client-side browser application due to CORS policies and authentication requirements. 
                  This application acts as the <strong>Frontend Control Panel</strong>.
                </p>
              </div>

              <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                <h3 className="text-xl font-bold text-white mb-4">Project Roadmap</h3>
                
                <div className="relative border-l-2 border-slate-700 pl-8 space-y-10 ml-2">
                  
                  {/* Step 1 */}
                  <div className="relative">
                    <span className="absolute -left-[41px] top-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    <h4 className="text-lg font-semibold text-white">Backend Setup (Python/Node.js)</h4>
                    <p className="text-slate-400 text-sm mt-2">
                      You need a server to perform the actual scraping. Python is recommended.
                      <br/>
                      <code className="bg-black px-2 py-1 rounded text-xs mt-2 inline-block text-green-400">pip install instaloader google-auth</code>
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className="relative">
                    <span className="absolute -left-[41px] top-0 w-6 h-6 bg-slate-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    <h4 className="text-lg font-semibold text-white">Authentication Handling</h4>
                    <p className="text-slate-400 text-sm mt-2">
                      The backend must log in to Instagram. Use session files to avoid getting banned. 
                      For Google Drive, enable the Drive API in Google Cloud Console and download <code className="text-xs text-slate-300">credentials.json</code>.
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div className="relative">
                    <span className="absolute -left-[41px] top-0 w-6 h-6 bg-slate-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                    <h4 className="text-lg font-semibold text-white">Cron Jobs / Scheduling</h4>
                    <p className="text-slate-400 text-sm mt-2">
                      Instead of the browser checking every 30 minutes, set up a CRON job on your server:
                      <br/>
                      <code className="bg-black px-2 py-1 rounded text-xs mt-2 inline-block text-slate-300">*/30 * * * * python check_updates.py</code>
                    </p>
                  </div>

                  {/* Step 4 */}
                  <div className="relative">
                    <span className="absolute -left-[41px] top-0 w-6 h-6 bg-slate-600 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                    <h4 className="text-lg font-semibold text-white">Connect this Frontend</h4>
                    <p className="text-slate-400 text-sm mt-2">
                      Replace the <code className="text-xs text-blue-400">simulateInstagramCheck</code> function in this React app with a real API call to your Python backend to get the status logs.
                    </p>
                  </div>

                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}