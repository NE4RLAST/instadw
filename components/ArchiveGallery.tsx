import React from 'react';
import { ArchivedItem } from '../types';
import { Image, ExternalLink } from 'lucide-react';

interface ArchiveGalleryProps {
  items: ArchivedItem[];
}

const ArchiveGallery: React.FC<ArchiveGalleryProps> = ({ items }) => {
  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-slate-200 flex items-center gap-2">
          <Image size={18} /> Archive Gallery
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2">
            <Image size={48} className="opacity-20" />
            <p>No items downloaded yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {items.map((item) => (
              <div key={item.id} className="group relative bg-slate-900 rounded-lg overflow-hidden border border-slate-700 aspect-square">
                <img 
                  src={item.imageUrl} 
                  alt="Archived content" 
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                  <span className="text-xs font-bold text-white">@{item.username}</span>
                  <p className="text-[10px] text-slate-300 line-clamp-2">{item.caption}</p>
                  <div className="mt-2 flex gap-2">
                    <span className="text-[10px] uppercase tracking-wider bg-blue-600 px-1.5 py-0.5 rounded text-white">{item.type}</span>
                    <span className="text-[10px] text-slate-400">{item.archivedAt.toLocaleTimeString([],{hour:'2-digit', minute:'2-digit'})}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ArchiveGallery;