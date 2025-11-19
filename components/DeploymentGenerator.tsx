import React, { useState } from 'react';
import { MonitoredUser } from '../types';
import { Copy, Check, Terminal, Server, Shield, FileCode } from 'lucide-react';

interface DeploymentGeneratorProps {
  users: MonitoredUser[];
  checkInterval: number;
}

const DeploymentGenerator: React.FC<DeploymentGeneratorProps> = ({ users, checkInterval }) => {
  const [igUser, setIgUser] = useState('');
  const [igPass, setIgPass] = useState('');
  const [driveId, setDriveId] = useState('');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const activeUsers = users.filter(u => u.status === 'active').map(u => u.username).join(',');

  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
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
    except FileNotFoundError:
        print("🔑 Giriş yapılıyor...")
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
        <h1 className="text-2xl font-bold text-white mb-2">VPS Deployment Generator</h1>
        <p className="text-slate-400">
          Since we cannot scrape Instagram directly from the browser due to security restrictions, 
          use this tool to generate the exact code needed for your Coolify VPS based on your settings.
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

      {/* File Generation */}
      <div className="grid grid-cols-1 gap-8">
        
        {/* MAIN.PY */}
        <div className="bg-slate-900 rounded-lg overflow-hidden border border-slate-800">
          <div className="bg-slate-800 px-4 py-2 flex justify-between items-center border-b border-slate-700">
            <div className="flex items-center gap-2">
              <FileCode size={16} className="text-yellow-400" />
              <span className="font-mono text-sm font-bold text-slate-200">main.py</span>
            </div>
            <button 
              onClick={() => handleCopy(pythonCode, 'main')}
              className="flex items-center gap-1 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded transition-colors"
            >
              {copiedSection === 'main' ? <Check size={14} /> : <Copy size={14} />}
              {copiedSection === 'main' ? 'Copied!' : 'Copy Code'}
            </button>
          </div>
          <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
            {pythonCode}
          </pre>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* REQUIREMENTS.TXT */}
          <div className="bg-slate-900 rounded-lg overflow-hidden border border-slate-800 h-fit">
            <div className="bg-slate-800 px-4 py-2 flex justify-between items-center border-b border-slate-700">
              <div className="flex items-center gap-2">
                <FileCode size={16} className="text-blue-400" />
                <span className="font-mono text-sm font-bold text-slate-200">requirements.txt</span>
              </div>
              <button 
                onClick={() => handleCopy(reqCode, 'req')}
                className="flex items-center gap-1 text-xs font-medium bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded transition-colors"
              >
                 {copiedSection === 'req' ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
            <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto">
              {reqCode}
            </pre>
          </div>

          {/* DOCKERFILE */}
          <div className="bg-slate-900 rounded-lg overflow-hidden border border-slate-800 h-fit">
            <div className="bg-slate-800 px-4 py-2 flex justify-between items-center border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Server size={16} className="text-purple-400" />
                <span className="font-mono text-sm font-bold text-slate-200">Dockerfile</span>
              </div>
               <button 
                onClick={() => handleCopy(dockerCode, 'docker')}
                className="flex items-center gap-1 text-xs font-medium bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded transition-colors"
              >
                 {copiedSection === 'docker' ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
            <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto">
              {dockerCode}
            </pre>
          </div>
        </div>
        
        {/* Instructions */}
        <div className="bg-blue-900/20 border border-blue-500/30 p-6 rounded-lg">
          <h3 className="text-lg font-bold text-blue-400 mb-4 flex items-center gap-2">
            <Terminal size={20} /> Coolify Deployment Instructions
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-slate-300">
            <li>Create a <strong>Private GitHub Repository</strong> and upload these 3 files.</li>
            <li>In Coolify, create a new project from this repository.</li>
            <li>Go to <strong>Environment Variables</strong> in Coolify and add:</li>
            <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-slate-400 font-mono text-xs">
              <li>GOOGLE_CREDS_JSON: (Paste contents of your credentials.json here)</li>
              <li>IG_USER: {igUser || '...'}</li>
              <li>IG_PASS: {igPass ? '******' : '...'}</li>
            </ul>
            <li className="mt-2">Go to <strong>Storage</strong> and add a volume mounting to <code className="bg-slate-900 px-1 rounded">/app/data</code>.</li>
            <li>Click <strong>Deploy</strong>.</li>
          </ol>
        </div>

      </div>
    </div>
  );
};

export default DeploymentGenerator;