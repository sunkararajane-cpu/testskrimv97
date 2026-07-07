import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Share2, Pencil } from 'lucide-react';
import { TICKETS_CONFIG, TicketedEvent } from '../../lib/mock/monetizationMockData';

export default function TicketsManageScreen() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<TicketedEvent[]>(TICKETS_CONFIG.events);
  const [createOpen, setCreateOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2200); };

  const handleCreate = (event: Omit<TicketedEvent, 'id' | 'sold' | 'earned'>) => {
    setEvents((prev) => [{ ...event, id: `evt_${Date.now()}`, sold: 0, earned: 0 }, ...prev]);
    setCreateOpen(false);
  };

  return (
    <div className="w-full h-full flex flex-col bg-black text-white overflow-hidden">
      <header className="px-4 pt-6 pb-4 sticky top-0 bg-[#05050A]/95 backdrop-blur-md z-40 border-b border-white/5">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/monetization')} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 text-white/60">
            <X className="w-5 h-5" />
          </button>
          <h1 className="text-sm font-bold tracking-widest uppercase">🎟️ Live Event Tickets</h1>
          <div className="w-9" />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 pb-24 flex flex-col gap-6">
        <div className="text-center py-2">
          <span className="text-5xl block mb-3">🎟️</span>
          <p className="text-sm text-gray-400 max-w-[280px] mx-auto leading-relaxed">
            Sell access to special ticketed live streams. Fans buy a ticket in advance to join.
          </p>
        </div>

        <button onClick={() => setCreateOpen(true)} className="w-full py-3.5 bg-neon-purple text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> Create Ticketed Event
        </button>

        <div>
          <h3 className="text-xs font-bold uppercase text-gray-400 mb-3">Your Events</h3>
          {events.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-10 bg-skrim-surface rounded-2xl border border-white/5">No events yet</p>
          ) : (
            <div className="flex flex-col gap-3">
              {events.map((e) => (
                <div key={e.id} className="bg-skrim-surface rounded-2xl border border-white/5 p-4">
                  <p className="font-bold text-white text-sm mb-1">{e.title}</p>
                  <p className="text-[11px] text-gray-500 mb-3">{e.date} · {e.time} · ₹{e.price}</p>
                  <div className="flex gap-4 mb-3 text-[12px]">
                    <span className="text-gray-300">{e.sold} sold</span>
                    <span className="text-[#D4AF37] font-bold">₹{e.earned.toLocaleString()} earned</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => showToast('Event link copied')} className="flex-1 py-2 bg-white/5 border border-white/10 rounded-lg text-[12px] font-bold text-white flex items-center justify-center gap-1.5">
                      <Share2 className="w-3.5 h-3.5" /> Share Event
                    </button>
                    <button className="flex-1 py-2 bg-white/5 border border-white/10 rounded-lg text-[12px] font-bold text-white flex items-center justify-center gap-1.5">
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>{createOpen && <CreateEventSheet onClose={() => setCreateOpen(false)} onCreate={handleCreate} />}</AnimatePresence>

      {toast && (
        <div className="fixed bottom-24 inset-x-0 flex justify-center z-[300] pointer-events-none">
          <div className="bg-[#1A1A24] border border-white/10 rounded-full px-4 py-2 text-xs font-bold text-white shadow-xl">{toast}</div>
        </div>
      )}
    </div>
  );
}

function CreateEventSheet({ onClose, onCreate }: { onClose: () => void; onCreate: (e: Omit<TicketedEvent, 'id' | 'sold' | 'earned'>) => void }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [price, setPrice] = useState(99);
  const [customPrice, setCustomPrice] = useState('');
  const [noLimit, setNoLimit] = useState(true);
  const [limit, setLimit] = useState('');
  const [description, setDescription] = useState('');

  const finalPrice = customPrice ? parseInt(customPrice) || 0 : price;
  const canCreate = title && date && time;

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[200] bg-black/70" />
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed bottom-0 inset-x-0 z-[210] bg-[#111115] rounded-t-3xl border-t border-white/10 p-6 pb-safe-bottom max-h-[88vh] overflow-y-auto no-scrollbar"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Create Ticketed Event</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex flex-col gap-3 mb-4">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" className="bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none" />
          <div className="flex gap-3">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="flex-1 bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none" />
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="flex-1 bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none" />
          </div>
        </div>

        <h4 className="text-[11px] font-bold text-gray-400 uppercase mb-2">Ticket Price</h4>
        <div className="flex gap-2 mb-2">
          {[49, 99, 199].map((p) => (
            <button key={p} onClick={() => { setPrice(p); setCustomPrice(''); }} className={`flex-1 py-2.5 rounded-xl text-sm font-bold border ${price === p && !customPrice ? 'border-neon-purple bg-neon-purple/10 text-white' : 'border-white/10 text-gray-400'}`}>
              ₹{p}
            </button>
          ))}
        </div>
        <input value={customPrice} onChange={(e) => setCustomPrice(e.target.value.replace(/\D/g, ''))} placeholder="Custom price" className="w-full mb-4 bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none" />

        <h4 className="text-[11px] font-bold text-gray-400 uppercase mb-2">Ticket Limit</h4>
        <div className="flex gap-2 mb-4">
          <button onClick={() => setNoLimit(true)} className={`flex-1 py-2.5 rounded-xl text-sm font-bold border ${noLimit ? 'border-neon-purple bg-neon-purple/10 text-white' : 'border-white/10 text-gray-400'}`}>No limit</button>
          <button onClick={() => setNoLimit(false)} className={`flex-1 py-2.5 rounded-xl text-sm font-bold border ${!noLimit ? 'border-neon-purple bg-neon-purple/10 text-white' : 'border-white/10 text-gray-400'}`}>Set limit</button>
        </div>
        {!noLimit && (
          <input value={limit} onChange={(e) => setLimit(e.target.value.replace(/\D/g, ''))} placeholder="e.g. 100" className="w-full mb-4 bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none" />
        )}

        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" rows={3} className="w-full mb-5 bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none resize-none" />

        <button
          disabled={!canCreate}
          onClick={() => onCreate({ title, date, time, price: finalPrice, ticketLimit: noLimit ? null : parseInt(limit) || null, description })}
          className={`w-full py-4 rounded-xl font-bold text-sm ${canCreate ? 'bg-neon-purple text-white' : 'bg-white/5 text-white/30'}`}
        >
          Create Event →
        </button>
      </motion.div>
    </>
  );
}
