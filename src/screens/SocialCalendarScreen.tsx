import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Gift, Heart, Calendar, Bell, BellOff, Trash2, Edit2, Check, X, ChevronRight, Cake, Star } from 'lucide-react';
import { mockUsers } from '../lib/mock/mockData';

// ─── Types ───────────────────────────────────────────────────────────────────

type EventType = 'birthday' | 'anniversary' | 'custom';

interface CalendarEvent {
  id: string;
  type: EventType;
  name: string;        // person's name or event label
  avatar?: string;
  date: string;        // MM-DD format for recurring, or YYYY-MM-DD for one-time
  recurring: boolean;
  reminderDays: number; // days before to remind
  notifyEnabled: boolean;
  note?: string;
  userId?: string;     // linked mock user
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const FULL_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function parseMD(mmdd: string): { month: number; day: number } {
  const [m, d] = mmdd.split('-').map(Number);
  return { month: m, day: d };
}

function getDaysUntil(mmdd: string): number {
  const today = new Date();
  const { month, day } = parseMD(mmdd);
  let next = new Date(today.getFullYear(), month - 1, day);
  if (next < today) next = new Date(today.getFullYear() + 1, month - 1, day);
  const diff = Math.ceil((next.getTime() - today.setHours(0,0,0,0)) / 86400000);
  return diff === 365 ? 0 : diff; // treat exactly 365 as "today" wrap
}

function formatDateLabel(mmdd: string): string {
  const { month, day } = parseMD(mmdd);
  return `${FULL_MONTHS[month - 1]} ${day}`;
}

function getCountdownLabel(days: number): string {
  if (days === 0) return 'Today! 🎉';
  if (days === 1) return 'Tomorrow!';
  if (days <= 7) return `In ${days} days`;
  if (days <= 30) return `In ${Math.ceil(days / 7)} weeks`;
  return `In ${days} days`;
}

function getUrgencyColor(days: number): string {
  if (days === 0) return 'text-yellow-400';
  if (days <= 3) return 'text-orange-400';
  if (days <= 7) return 'text-purple-400';
  return 'text-white/40';
}

function typeIcon(type: EventType) {
  if (type === 'birthday') return <Cake size={14} className="text-pink-400" />;
  if (type === 'anniversary') return <Heart size={14} className="text-red-400" />;
  return <Star size={14} className="text-yellow-400" />;
}

function typeColor(type: EventType): string {
  if (type === 'birthday') return 'bg-pink-500/15 border-pink-500/30';
  if (type === 'anniversary') return 'bg-red-500/15 border-red-500/30';
  return 'bg-yellow-500/15 border-yellow-500/30';
}

// ─── Mock seed data ───────────────────────────────────────────────────────────

const today = new Date();
const mm = (n: number) => String(n).padStart(2, '0');

function daysFromToday(d: number): string {
  const dt = new Date(today);
  dt.setDate(dt.getDate() + d);
  return `${mm(dt.getMonth() + 1)}-${mm(dt.getDate())}`;
}

const SEED_EVENTS: CalendarEvent[] = [
  {
    id: 'e1', type: 'birthday', name: mockUsers[0].displayName,
    avatar: mockUsers[0].avatar, userId: mockUsers[0].id,
    date: daysFromToday(0), recurring: true, reminderDays: 3, notifyEnabled: true,
    note: 'Gets excited about anything with memes 😂'
  },
  {
    id: 'e2', type: 'birthday', name: mockUsers[1].displayName,
    avatar: mockUsers[1].avatar, userId: mockUsers[1].id,
    date: daysFromToday(2), recurring: true, reminderDays: 3, notifyEnabled: true,
  },
  {
    id: 'e3', type: 'birthday', name: mockUsers[2].displayName,
    avatar: mockUsers[2].avatar, userId: mockUsers[2].id,
    date: daysFromToday(5), recurring: true, reminderDays: 3, notifyEnabled: true,
    note: 'Loves cricket 🏏'
  },
  {
    id: 'e4', type: 'anniversary', name: 'Parents Anniversary 💍',
    date: daysFromToday(12), recurring: true, reminderDays: 7, notifyEnabled: true,
    note: 'Order flowers in advance!'
  },
  {
    id: 'e5', type: 'birthday', name: mockUsers[3].displayName,
    avatar: mockUsers[3].avatar, userId: mockUsers[3].id,
    date: daysFromToday(18), recurring: true, reminderDays: 3, notifyEnabled: false,
  },
  {
    id: 'e6', type: 'anniversary', name: 'Friendship Day with Kabir 🤝',
    date: daysFromToday(22), recurring: true, reminderDays: 5, notifyEnabled: true,
  },
  {
    id: 'e7', type: 'birthday', name: mockUsers[4].displayName,
    avatar: mockUsers[4].avatar, userId: mockUsers[4].id,
    date: daysFromToday(35), recurring: true, reminderDays: 3, notifyEnabled: true,
  },
  {
    id: 'e8', type: 'custom', name: 'Squad Trip Anniversary 🏕️',
    date: daysFromToday(60), recurring: true, reminderDays: 14, notifyEnabled: true,
    note: 'Plan something this year!'
  },
];

const STORAGE_KEY = 'skrimchat_social_calendar';

function loadEvents(): CalendarEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : SEED_EVENTS;
  } catch {
    return SEED_EVENTS;
  }
}

function saveEvents(events: CalendarEvent[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

// ─── Add/Edit Modal ───────────────────────────────────────────────────────────

interface EditModalProps {
  event?: CalendarEvent | null;
  onSave: (e: CalendarEvent) => void;
  onClose: () => void;
}

function EditModal({ event, onSave, onClose }: EditModalProps) {
  const [type, setType] = useState<EventType>(event?.type || 'birthday');
  const [name, setName] = useState(event?.name || '');
  const [month, setMonth] = useState(event ? parseMD(event.date).month : new Date().getMonth() + 1);
  const [day, setDay] = useState(event ? parseMD(event.date).day : new Date().getDate());
  const [reminderDays, setReminderDays] = useState(event?.reminderDays || 3);
  const [note, setNote] = useState(event?.note || '');
  const [notifyEnabled, setNotifyEnabled] = useState(event?.notifyEnabled ?? true);

  const daysInMonth = new Date(2024, month, 0).getDate();

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      id: event?.id || Date.now().toString(),
      type,
      name: name.trim(),
      date: `${mm(month)}-${mm(Math.min(day, daysInMonth))}`,
      recurring: true,
      reminderDays,
      notifyEnabled,
      note: note.trim() || undefined,
      avatar: event?.avatar,
      userId: event?.userId,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        className="w-full max-w-lg bg-[#0F0F17] border border-white/10 rounded-t-3xl p-6 pb-10"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-bold text-lg">{event ? 'Edit Reminder' : 'Add Reminder'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white">
            <X size={16} />
          </button>
        </div>

        {/* Type picker */}
        <div className="flex gap-2 mb-4">
          {(['birthday', 'anniversary', 'custom'] as EventType[]).map(t => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`flex-1 py-2 rounded-xl text-[12px] font-semibold capitalize border transition-all ${
                type === t
                  ? t === 'birthday' ? 'bg-pink-500/20 border-pink-500/60 text-pink-300'
                  : t === 'anniversary' ? 'bg-red-500/20 border-red-500/60 text-red-300'
                  : 'bg-yellow-500/20 border-yellow-500/60 text-yellow-300'
                  : 'bg-white/5 border-white/10 text-white/50'
              }`}
            >
              {t === 'birthday' ? '🎂' : t === 'anniversary' ? '💖' : '⭐'} {t}
            </button>
          ))}
        </div>

        {/* Name */}
        <div className="mb-4">
          <label className="text-white/40 text-[11px] uppercase tracking-wide mb-1.5 block">
            {type === 'birthday' ? "Person's Name" : type === 'anniversary' ? 'Event Label' : 'Event Name'}
          </label>
          <input
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 outline-none focus:border-purple-500/60"
            placeholder={type === 'birthday' ? 'e.g. Priya Sharma' : 'e.g. Parents Anniversary'}
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        {/* Date */}
        <div className="mb-4">
          <label className="text-white/40 text-[11px] uppercase tracking-wide mb-1.5 block">Date (repeats yearly)</label>
          <div className="flex gap-2">
            <select
              value={month}
              onChange={e => setMonth(Number(e.target.value))}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-white text-sm outline-none focus:border-purple-500/60 appearance-none"
            >
              {FULL_MONTHS.map((m, i) => <option key={m} value={i + 1} className="bg-[#0F0F17]">{m}</option>)}
            </select>
            <select
              value={day}
              onChange={e => setDay(Number(e.target.value))}
              className="w-24 bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-white text-sm outline-none focus:border-purple-500/60 appearance-none"
            >
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => (
                <option key={d} value={d} className="bg-[#0F0F17]">{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Reminder */}
        <div className="mb-4">
          <label className="text-white/40 text-[11px] uppercase tracking-wide mb-1.5 block">Remind me</label>
          <div className="flex gap-2 flex-wrap">
            {[1, 3, 5, 7, 14].map(d => (
              <button
                key={d}
                onClick={() => setReminderDays(d)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all ${
                  reminderDays === d ? 'bg-purple-500/30 border-purple-500/60 text-purple-200' : 'bg-white/5 border-white/10 text-white/50'
                }`}
              >
                {d === 1 ? '1 day' : `${d} days`} before
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div className="mb-5">
          <label className="text-white/40 text-[11px] uppercase tracking-wide mb-1.5 block">Note (optional)</label>
          <input
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 outline-none focus:border-purple-500/60"
            placeholder="Gift idea, plan, anything..."
            value={note}
            onChange={e => setNote(e.target.value)}
          />
        </div>

        {/* Notify toggle */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-white/70 text-sm">Push notification</span>
          <button
            onClick={() => setNotifyEnabled(v => !v)}
            className={`w-12 h-6 rounded-full transition-colors relative ${notifyEnabled ? 'bg-purple-500' : 'bg-white/10'}`}
          >
            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${notifyEnabled ? 'left-7' : 'left-1'}`} />
          </button>
        </div>

        <button
          onClick={handleSave}
          disabled={!name.trim()}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-sm disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          {event ? 'Save Changes' : 'Add Reminder'}
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

type Tab = 'upcoming' | 'today' | 'all';

export default function SocialCalendarScreen() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<CalendarEvent[]>(loadEvents);
  const [tab, setTab] = useState<Tab>('upcoming');
  const [editTarget, setEditTarget] = useState<CalendarEvent | null | 'new'>('new' as any);
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [sentWish, setSentWish] = useState<string | null>(null);

  useEffect(() => { saveEvents(events); }, [events]);

  const sorted = [...events].sort((a, b) => getDaysUntil(a.date) - getDaysUntil(b.date));

  const todayEvents = sorted.filter(e => getDaysUntil(e.date) === 0);
  const upcomingEvents = sorted.filter(e => {
    const d = getDaysUntil(e.date);
    return d > 0 && d <= 30;
  });
  const allEvents = sorted;

  const displayed = tab === 'today' ? todayEvents : tab === 'upcoming' ? upcomingEvents : allEvents;

  const handleSave = (e: CalendarEvent) => {
    setEvents(prev => {
      const idx = prev.findIndex(x => x.id === e.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = e; return n; }
      return [...prev, e];
    });
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    setDeleteId(null);
  };

  const toggleNotify = (id: string) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, notifyEnabled: !e.notifyEnabled } : e));
  };

  const handleWish = (event: CalendarEvent) => {
    setSentWish(event.id);
    setTimeout(() => setSentWish(null), 2500);
    if (event.userId) navigate(`/chat/${event.userId}`);
  };

  return (
    <div className="w-full h-full flex flex-col bg-black overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4 bg-black/80 backdrop-blur border-b border-white/5">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white shrink-0">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-white font-bold text-lg leading-tight">Social Calendar</h1>
          <p className="text-white/40 text-xs">Birthdays & anniversaries</p>
        </div>
        <button
          onClick={() => { setEditTarget(null); setShowModal(true); }}
          className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white shadow-lg"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Today banner */}
      {todayEvents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="mx-4 mt-4 rounded-2xl overflow-hidden bg-gradient-to-r from-yellow-500/20 to-pink-500/20 border border-yellow-500/30 p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🎉</span>
            <span className="text-yellow-300 font-bold text-sm">Today's Special Days</span>
          </div>
          <div className="flex flex-col gap-2">
            {todayEvents.map(ev => (
              <div key={ev.id} className="flex items-center gap-3">
                {ev.avatar
                  ? <img src={ev.avatar} className="w-8 h-8 rounded-full object-cover border-2 border-yellow-400/50" />
                  : <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center text-base">
                      {ev.type === 'birthday' ? '🎂' : ev.type === 'anniversary' ? '💖' : '⭐'}
                    </div>
                }
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{ev.name}</p>
                  <p className="text-white/50 text-[11px] capitalize">{ev.type}</p>
                </div>
                <button
                  onClick={() => handleWish(ev)}
                  className="px-3 py-1.5 rounded-xl bg-yellow-400/20 border border-yellow-400/40 text-yellow-300 text-[12px] font-semibold hover:bg-yellow-400/30 transition-colors"
                >
                  {sentWish === ev.id ? '✓ Sent!' : '🎂 Wish'}
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 px-4 mt-4 mb-2">
        {([['upcoming', `Upcoming (${upcomingEvents.length})`], ['today', `Today (${todayEvents.length})`], ['all', `All (${allEvents.length})`]] as [Tab, string][]).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl text-[12px] font-semibold transition-all ${
              tab === t ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'text-white/40 bg-white/5 border border-transparent'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-24">
        {displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-20 gap-3 text-center">
            <span className="text-5xl">{tab === 'today' ? '📭' : '🗓️'}</span>
            <p className="text-white/50 text-sm">
              {tab === 'today' ? 'No special days today' : tab === 'upcoming' ? 'Nothing in the next 30 days' : 'No reminders yet'}
            </p>
            {tab === 'all' && (
              <button
                onClick={() => { setEditTarget(null); setShowModal(true); }}
                className="mt-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold"
              >
                Add First Reminder
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3 pt-2">
            <AnimatePresence>
              {displayed.map((ev, i) => {
                const days = getDaysUntil(ev.date);
                return (
                  <motion.div
                    key={ev.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: i * 0.04 }}
                    className={`rounded-2xl border p-4 ${typeColor(ev.type)}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar or icon */}
                      {ev.avatar
                        ? <img src={ev.avatar} className="w-11 h-11 rounded-full object-cover shrink-0" />
                        : <div className={`w-11 h-11 rounded-full flex items-center justify-center text-xl shrink-0 ${
                            ev.type === 'birthday' ? 'bg-pink-500/20' : ev.type === 'anniversary' ? 'bg-red-500/20' : 'bg-yellow-500/20'
                          }`}>
                            {ev.type === 'birthday' ? '🎂' : ev.type === 'anniversary' ? '💖' : '⭐'}
                          </div>
                      }

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          {typeIcon(ev.type)}
                          <span className="text-white font-semibold text-sm truncate">{ev.name}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-white/40 text-[11px] flex items-center gap-1">
                            <Calendar size={10} /> {formatDateLabel(ev.date)}
                          </span>
                          <span className={`text-[11px] font-bold ${getUrgencyColor(days)}`}>
                            {getCountdownLabel(days)}
                          </span>
                        </div>
                        {ev.note && (
                          <p className="text-white/40 text-[11px] mt-1 leading-snug">{ev.note}</p>
                        )}
                        <div className="flex items-center gap-1.5 mt-1">
                          <Bell size={10} className={ev.notifyEnabled ? 'text-purple-400' : 'text-white/20'} />
                          <span className="text-[10px] text-white/30">
                            {ev.notifyEnabled ? `${ev.reminderDays}d before` : 'Muted'}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-1.5 shrink-0">
                        {days === 0 && ev.userId && (
                          <button
                            onClick={() => handleWish(ev)}
                            className="px-2.5 py-1 rounded-lg bg-yellow-400/20 border border-yellow-400/40 text-yellow-300 text-[11px] font-semibold"
                          >
                            🎂 Wish
                          </button>
                        )}
                        <button
                          onClick={() => toggleNotify(ev.id)}
                          className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center"
                        >
                          {ev.notifyEnabled
                            ? <Bell size={13} className="text-purple-400" />
                            : <BellOff size={13} className="text-white/30" />}
                        </button>
                        <button
                          onClick={() => { setEditTarget(ev); setShowModal(true); }}
                          className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center"
                        >
                          <Edit2 size={13} className="text-white/40" />
                        </button>
                        <button
                          onClick={() => setDeleteId(ev.id)}
                          className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center"
                        >
                          <Trash2 size={13} className="text-red-400/60" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <EditModal
            event={editTarget as CalendarEvent | null}
            onSave={handleSave}
            onClose={() => setShowModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm px-6"
            onClick={() => setDeleteId(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              className="bg-[#0F0F17] border border-white/10 rounded-2xl p-6 w-full max-w-sm"
              onClick={e => e.stopPropagation()}
            >
              <p className="text-white font-bold text-base mb-1">Delete reminder?</p>
              <p className="text-white/40 text-sm mb-5">This can't be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/70 text-sm font-medium">Cancel</button>
                <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 text-sm font-semibold">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
