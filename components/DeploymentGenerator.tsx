import React, { useState } from 'react';
import { MonitoredUser } from '../types';
import { Copy, Check, Terminal, Server, Shield, FileCode, Github, Box, Save } from 'lucide-react';

interface DeploymentGeneratorProps {
  users: MonitoredUser[];
  checkInterval: number;
}

const DeploymentGenerator: React.FC<DeploymentGeneratorProps> = ({ users, checkInterval }) => {
  const [igUser, setIgUser] = useState('');
  const [igPass, setIgPass] = useState('');
  const [driveId, setDriveId] = useState('');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  
  // Checklist State
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>({});

  const activeUsers = users.filter(u => u.status === 'active').map(u => u.username).join(',');

  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const toggleStep = (stepId: string) => {
    setCheckedSteps(prev => ({
      ...prev,
      [stepId]: !prev[stepId]
    }));
  };

  const pythonCode = `import os
import time
import json
import instaloader
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

# --- COOLIFY ENV VARIABLES ---
TARGET_USERS = os.getenv("TARGET_USERS", "${activeUsers}").split(",")
IG_USER = os.getenv("IG_USER", "${igUser}")
IG_PASS = os.getenv("IG_PASS", "${igPass}")
DRIVE_FOLDER_ID = os.getenv("DRIVE_FOLDER_ID", "${driveId}")
CHECK_INTERVAL = int(os.getenv("CHECK_INTERVAL", ${checkInterval * 60}))
GOOGLE_CREDS_JSON = os.getenv("GOOGLE_CREDS_JSON")
PERSISTENT_DIR = "/app/data"

def authenticate_drive():
    if not GOOGLE_CREDS_JSON:
        print("HATA: GOOGLE_CREDS_JSON eksik!")
        return None
    creds_dict = json.loads(GOOGLE_CREDS_JSON)
    creds = service_account.Credentials.from_service_account_info(
        creds_dict, scopes=['https://www.googleapis.com/auth/drive'])
    return build('drive', 'v3', credentials=creds)

def upload_to_drive(service, file_path, file_name):
    try:
        metadata = {'name': file_name, 'parents': [DRIVE_FOLDER_ID]}
        media = MediaFileUpload(file_path, resumable=True)
        service.files().create(body=metadata, media_body=media).execute()
        print(f"✅ Drive'a yüklendi: {file_name}")
        return True
    except Exception as e:
        print(f"❌ Drive hatası: {e}")
        return False

def main():
    print("🚀 InstaArchiver Başlatılıyor...")
    os.makedirs(PERSISTENT_DIR, exist_ok=True)
    os.chdir(PERSISTENT_DIR)

    L = instaloader.Instaloader(
        download_pictures=True, download_videos=True, 
        download_video_thumbnails=False, save_metadata=False,
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    )

    # Giriş
    try:
        L.load_session_from_file(IG_USER, filename=f"{PERSISTENT_DIR}/session-{IG_USER}")
        print("🔓 Session ile giriş yapıldı.")
    except FileNotFoundError:
        print("🔑 Şifre ile giriş yapılıyor...")
        try:
            L.login(IG_USER, IG_PASS)
            L.save_session_to_file(filename=f"{PERSISTENT_DIR}/session-{IG_USER}")
        except Exception as e:
            print(f"❌ Giriş Hatası: {e}")
            time.sleep(60)
            return

    drive_service = authenticate_drive()

    while True:
        print(f"⏰ Kontrol: {time.strftime('%H:%M')}")
        for username in TARGET_USERS:
            if not username: continue
            try:
                print(f"🔍 {username} taranıyor...")
                profile = instaloader.Profile.from_username(L.context, username.strip())
                for post in profile.get_posts():
                    if L.download_post(post, target=username):
                        # Yeni indirme oldu, Drive'a yükle
                        target_path = os.path.join(PERSISTENT_DIR, username)
                        for r, d, f in os.walk(target_path):
                            for file in f:
                                if file.endswith(('.jpg', '.mp4')):
                                    fp = os.path.join(r, file)
                                    if upload_to_drive(drive_service, fp, f"{username}_{file}"):
                                        os.remove(fp)
                        try: os.rmdir(target_path)
                        except: pass
                    else:
                        break # Eski gönderilere geldik
            except Exception as e:
                print(f"⚠️ Hata ({username}): {e}")
        
        print(f"💤 {CHECK_INTERVAL}sn uyku...")
        time.sleep(CHECK_INTERVAL)

if __name__ == "__main__":
    main()`;

  const dockerCode = `FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
ENV PYTHONUNBUFFERED=1
CMD ["python", "main.py"]`;

  const reqCode = `instaloader
google-api-python-client
google-auth-httplib2
google-auth-oauthlib`;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">VPS Deployment Center</h1>
        <p className="text-slate-400">
          Follow this guide to deploy your Instagram Archiver to your Hostinger VPS using Coolify.
        </p>
      </div>

      {/* Config Form */}
      <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase">Target Users</label>
          <div className="bg-slate-900 p-3 rounded border border-slate-700 text-sm text-slate-300 min-h-[42px] flex items-center">
            {activeUsers || 'No active users selected'}
          </div>
          <p className="text-[10px] text-slate-500">Managed in "Monitoring List" tab</p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase">IG Username (Bot)</label>
          <input 
            type="text" 
            value={igUser}
            onChange={(e) => setIgUser(e.target.value)}
            placeholder="my_bot_account"
            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-blue-500 focus:outline-none"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase">IG Password</label>
          <input 
            type="password" 
            value={igPass}
            onChange={(e) => setIgPass(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-blue-500 focus:outline-none"
          />
        </div>

         <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase">Drive Folder ID</label>
          <input 
            type="text" 
            value={driveId}
            onChange={(e) => setDriveId(e.target.value)}
            placeholder="1A2b3C..."
            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Step-by-Step Guide */}
      <div className="space-y-6">
        
        {/* STEP 1: GITHUB */}
        <div className={`border rounded-lg transition-colors duration-300 ${checkedSteps['step1'] ? 'bg-green-900/10 border-green-800' : 'bg-slate-800 border-slate-700'}`}>
          <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Github className="text-purple-400" size={20} />
              Step 1: Prepare GitHub Repository
            </h3>
            <button 
              onClick={() => toggleStep('step1')}
              className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${checkedSteps['step1'] ? 'bg-green-500 border-green-500 text-white' : 'border-slate-500 text-transparent hover:border-slate-300'}`}
            >
              <Check size={14} />
            </button>
          </div>
          <div className="p-6 space-y-6">
            <p className="text-sm text-slate-300">Create a new <strong>Private Repository</strong> on GitHub and create these 3 files inside it.</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* main.py */}
              <div className="bg-slate-900 rounded border border-slate-800">
                <div className="px-3 py-2 border-b border-slate-800 flex justify-between items-center">
                   <span className="text-xs font-mono text-yellow-400">main.py</span>
                   <button onClick={() => handleCopy(pythonCode, 'main')} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
                     {copiedSection === 'main' ? <Check size={12}/> : <Copy size={12}/>} Copy
                   </button>
                </div>
                <div className="p-2 overflow-x-auto h-32">
                  <pre className="text-[10px] font-mono text-slate-500">{pythonCode}</pre>
                </div>
              </div>

              <div className="space-y-4">
                {/* requirements.txt */}
                <div className="bg-slate-900 rounded border border-slate-800">
                  <div className="px-3 py-2 border-b border-slate-800 flex justify-between items-center">
                    <span className="text-xs font-mono text-blue-400">requirements.txt</span>
                    <button onClick={() => handleCopy(reqCode, 'req')} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
                      {copiedSection === 'req' ? <Check size={12}/> : <Copy size={12}/>} Copy
                    </button>
                  </div>
                  <div className="p-2 overflow-x-auto">
                    <pre className="text-[10px] font-mono text-slate-500">{reqCode}</pre>
                  </div>
                </div>

                {/* Dockerfile */}
                <div className="bg-slate-900 rounded border border-slate-800">
                  <div className="px-3 py-2 border-b border-slate-800 flex justify-between items-center">
                    <span className="text-xs font-mono text-purple-400">Dockerfile</span>
                    <button onClick={() => handleCopy(dockerCode, 'docker')} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
                      {copiedSection === 'docker' ? <Check size={12}/> : <Copy size={12}/>} Copy
                    </button>
                  </div>
                  <div className="p-2 overflow-x-auto">
                    <pre className="text-[10px] font-mono text-slate-500">{dockerCode}</pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* STEP 2: COOLIFY SETUP */}
        <div className={`border rounded-lg transition-colors duration-300 ${checkedSteps['step2'] ? 'bg-green-900/10 border-green-800' : 'bg-slate-800 border-slate-700'}`}>
          <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Box className="text-blue-400" size={20} />
              Step 2: Create Service in Coolify
            </h3>
            <button 
              onClick={() => toggleStep('step2')}
              className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${checkedSteps['step2'] ? 'bg-green-500 border-green-500 text-white' : 'border-slate-500 text-transparent hover:border-slate-300'}`}
            >
              <Check size={14} />
            </button>
          </div>
          <div className="p-6 text-sm text-slate-300 space-y-3">
            <p>Go to your Coolify Dashboard and follow these clicks:</p>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>Click <strong className="text-white">Projects</strong> &rarr; Select or create a project.</li>
              <li>Click <strong className="text-white">+ New</strong> &rarr; Select <strong className="text-white">Git Repository</strong>.</li>
              <li>Select your GitHub account and the repository you created in Step 1.</li>
              <li>In the configuration screen, ensure <strong className="text-white">Build Pack</strong> is set to <strong className="text-white">Dockerfile</strong>.</li>
            </ol>
          </div>
        </div>

        {/* STEP 3: CONFIGURATION */}
        <div className={`border rounded-lg transition-colors duration-300 ${checkedSteps['step3'] ? 'bg-green-900/10 border-green-800' : 'bg-slate-800 border-slate-700'}`}>
          <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Shield className="text-emerald-400" size={20} />
              Step 3: Environment Variables & Storage
            </h3>
            <button 
              onClick={() => toggleStep('step3')}
              className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${checkedSteps['step3'] ? 'bg-green-500 border-green-500 text-white' : 'border-slate-500 text-transparent hover:border-slate-300'}`}
            >
              <Check size={14} />
            </button>
          </div>
          <div className="p-6 space-y-6">
            <p className="text-sm text-slate-300">In Coolify project settings, find the <strong>Environment Variables</strong> tab and add these keys. <br/><span className="text-xs text-slate-500">(The values below are auto-filled from your inputs above)</span></p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900 p-3 rounded border border-slate-800 flex justify-between items-center">
                   <div>
                     <p className="text-xs font-bold text-slate-500">IG_USER</p>
                     <p className="text-sm font-mono text-white">{igUser || '...'}</p>
                   </div>
                   <Copy size={14} className="text-slate-600 cursor-pointer hover:text-white" onClick={() => handleCopy(igUser, 'iguser')}/>
                </div>
                <div className="bg-slate-900 p-3 rounded border border-slate-800 flex justify-between items-center">
                   <div>
                     <p className="text-xs font-bold text-slate-500">IG_PASS</p>
                     <p className="text-sm font-mono text-white">{igPass ? '••••••' : '...'}</p>
                   </div>
                   <Copy size={14} className="text-slate-600 cursor-pointer hover:text-white" onClick={() => handleCopy(igPass, 'igpass')}/>
                </div>
                <div className="bg-slate-900 p-3 rounded border border-slate-800 flex justify-between items-center">
                   <div>
                     <p className="text-xs font-bold text-slate-500">TARGET_USERS</p>
                     <p className="text-sm font-mono text-white truncate max-w-[150px]">{activeUsers || '...'}</p>
                   </div>
                   <Copy size={14} className="text-slate-600 cursor-pointer hover:text-white" onClick={() => handleCopy(activeUsers, 'targets')}/>
                </div>
                <div className="bg-slate-900 p-3 rounded border border-slate-800 flex justify-between items-center">
                   <div>
                     <p className="text-xs font-bold text-slate-500">DRIVE_FOLDER_ID</p>
                     <p className="text-sm font-mono text-white truncate max-w-[150px]">{driveId || '...'}</p>
                   </div>
                   <Copy size={14} className="text-slate-600 cursor-pointer hover:text-white" onClick={() => handleCopy(driveId, 'drive')}/>
                </div>
                <div className="bg-slate-900 p-3 rounded border border-slate-800 flex justify-between items-center col-span-1 md:col-span-2">
                   <div>
                     <p className="text-xs font-bold text-slate-500">GOOGLE_CREDS_JSON</p>
                     <p className="text-xs text-slate-400">Paste the full content of your credentials.json file here.</p>
                   </div>
                </div>
            </div>

            <div className="bg-blue-900/20 p-4 rounded border border-blue-500/30">
                <h4 className="text-sm font-bold text-blue-300 mb-2">CRITICAL: Persistent Storage</h4>
                <p className="text-xs text-slate-300 mb-2">Go to the <strong>Storage</strong> tab in Coolify and add a new volume:</p>
                <div className="flex items-center gap-4 bg-slate-900 p-2 rounded border border-slate-800 w-fit">
                    <span className="text-xs font-bold text-slate-500">Mount Path:</span>
                    <code className="text-sm font-mono text-green-400">/app/data</code>
                </div>
            </div>
          </div>
        </div>

         {/* STEP 4: DEPLOY */}
         <div className={`border rounded-lg transition-colors duration-300 ${checkedSteps['step4'] ? 'bg-green-900/10 border-green-800' : 'bg-slate-800 border-slate-700'}`}>
          <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Save className="text-pink-400" size={20} />
              Step 4: Deploy & Monitor
            </h3>
            <button 
              onClick={() => toggleStep('step4')}
              className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${checkedSteps['step4'] ? 'bg-green-500 border-green-500 text-white' : 'border-slate-500 text-transparent hover:border-slate-300'}`}
            >
              <Check size={14} />
            </button>
          </div>
          <div className="p-6 text-sm text-slate-300">
             Click the <strong>Deploy</strong> button in the top right of Coolify. <br/>
             Once deployed, go to the <strong>Logs</strong> tab to watch your bot start working!
          </div>
        </div>

      </div>
    </div>
  );
};

export default DeploymentGenerator;