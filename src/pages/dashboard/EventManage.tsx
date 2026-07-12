import { useParams, useNavigate } from 'react-router';
import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { EventRiskRadar } from '@/components/EventRiskRadar';
import { EventLocationMap } from '@/components/EventLocationMap';
import { EventPoster } from '@/components/EventPoster';
import store from '@/data/store';
import { createLocalPosterDataUrl, uploadEventPoster } from '@/lib/eventPosterUpload';
import { eventStatusBadgeClass, getEventDisplayStatus } from '@/lib/eventLifecycle';
import { Users, QrCode, UserCheck, Award, Handshake, Wallet, ArrowRight, Calendar, MapPin, FileText, Plus, Trash2, ImagePlus, X, Trophy } from 'lucide-react';
import type { EventFormField } from '@/types';

type EditableField = Omit<EventFormField, 'id' | 'event_id' | 'created_at'>;

export default function EventManage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const event = store.getEventById(id || '');
  const organizer = store.getCurrentUser();
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState('');
  const [posterSaving, setPosterSaving] = useState(false);
  const [posterError, setPosterError] = useState('');
  const [posterSuccess, setPosterSuccess] = useState('');
  const [formFields, setFormFields] = useState<EditableField[]>(() => {
    if (!event) return [];
    const customFields = store.getCustomEventFormFields(event.id);
    const fields = customFields.length > 0 ? customFields : store.getEventFormFields(event.id);
    return fields.map(({ label, field_type, required, options, sort_order }) => ({ label, field_type, required, options, sort_order }));
  });
  const [saved, setSaved] = useState(false);
  if (!event) return <DashboardLayout title="Event"><p className="text-[#5E6256]">Event not found</p></DashboardLayout>;

  const regs = store.getEventRegistrations(event.id);
  const displayStatus = getEventDisplayStatus(event);
  const attended = regs.filter(r => r.status === 'attended');
  const tasks = store.getEventVolunteerTasks(event.id);
  const interests = store.getEventSponsorInterests(event.id);
  const budgetItems = store.getEventBudgetItems(event.id);
  const certs = store.getEventCertificates(event.id);

  const winners = store.getEventWinners(event.id);
  const quickActions = [
    { icon: Users, label: 'Registrations', count: regs.length, path: 'registrations', color: 'text-blue-400' },
    { icon: QrCode, label: 'Attendance', count: attended.length, path: 'attendance', color: 'text-emerald-400' },
    { icon: UserCheck, label: 'Volunteers', count: tasks.length, path: 'volunteers', color: 'text-purple-400' },
    { icon: Handshake, label: 'Sponsors', count: interests.length, path: 'sponsors', color: 'text-rose-400' },
    { icon: Wallet, label: 'Budget', count: budgetItems.length, path: 'budget', color: 'text-amber-400' },
    { icon: Award, label: 'Certificates', count: certs.length, path: 'certificates', color: 'text-cyan-400' },
    { icon: Trophy, label: 'Winners & prizes', count: winners.length, path: 'winners', color: 'text-amber-500' },
  ];

  const addField = () => {
    setFormFields(prev => [...prev, {
      label: '',
      field_type: 'text',
      required: false,
      options: [],
      sort_order: prev.length,
    }]);
    setSaved(false);
  };

  const updateField = (index: number, updates: Partial<EditableField>) => {
    setFormFields(prev => prev.map((field, fieldIndex) => fieldIndex === index ? { ...field, ...updates } : field));
    setSaved(false);
  };

  const deleteField = (index: number) => {
    setFormFields(prev => prev.filter((_, fieldIndex) => fieldIndex !== index).map((field, sort_order) => ({ ...field, sort_order })));
    setSaved(false);
  };

  const moveField = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= formFields.length) return;
    const nextFields = [...formFields];
    const [field] = nextFields.splice(index, 1);
    nextFields.splice(nextIndex, 0, field);
    setFormFields(nextFields.map((item, sort_order) => ({ ...item, sort_order })));
    setSaved(false);
  };

  const saveForm = () => {
    const cleanFields = formFields
      .filter(field => field.label.trim())
      .map((field, index) => ({ ...field, label: field.label.trim(), sort_order: index }));
    store.saveEventFormFields(event.id, cleanFields);
    setFormFields(cleanFields);
    setSaved(true);
  };

  const handlePosterChange = (file?: File) => {
    setPosterError('');
    setPosterSuccess('');
    if (posterPreview) URL.revokeObjectURL(posterPreview);
    if (!file) {
      setPosterFile(null);
      setPosterPreview('');
      return;
    }
    setPosterFile(file);
    setPosterPreview(URL.createObjectURL(file));
  };

  const savePoster = async () => {
    if (!organizer) {
      navigate('/login');
      return;
    }
    if (!posterFile) return;

    setPosterSaving(true);
    setPosterError('');
    setPosterSuccess('');
    try {
      let posterUrl = '';
      let savedLocally = false;
      try {
        posterUrl = await uploadEventPoster(posterFile, organizer.id);
      } catch {
        posterUrl = await createLocalPosterDataUrl(posterFile);
        savedLocally = true;
      }
      store.updateEvent(event.id, { poster_url: posterUrl });
      handlePosterChange();
      setPosterSuccess(savedLocally ? 'Poster saved for this demo workspace.' : 'Poster uploaded and updated.');
    } catch (err) {
      setPosterError(err instanceof Error ? err.message : 'Poster upload failed. Please try again.');
    } finally {
      setPosterSaving(false);
    }
  };

  return (
    <DashboardLayout title={event.title}>
      <div className="event-manage-room mb-6">
        <EventPoster event={event} variant="banner" className="w-full h-40 rounded-xl mb-4" />
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E49B3A]/10 text-[#E49B3A]">{event.category}</span>
            <p className="text-xs text-[#5E6256] mt-2 flex items-center gap-3">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {event.date}</span>
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {event.venue}, {event.city}</span>
            </p>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${eventStatusBadgeClass(displayStatus)}`}>{displayStatus}</span>
        </div>
      </div>

      <div className="mb-8">
        <EventLocationMap event={event} variant="dark" />
      </div>

      <div className="event-manage-panel mb-8 rounded-xl p-5">
        <div className="flex flex-col lg:flex-row gap-5">
          <div className="lg:w-64 flex-shrink-0">
            {posterPreview ? (
              <div className="relative overflow-hidden rounded-xl border border-[#DCE8BE]">
                <img src={posterPreview} alt="New poster preview" className="h-36 w-full object-cover" />
                <button type="button" onClick={() => handlePosterChange()} disabled={posterSaving}
                  className="absolute right-2 top-2 rounded-full bg-[#14150F]/70 p-2 text-white hover:text-[#E49B3A]">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <EventPoster event={event} className="h-36 w-full rounded-xl" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-black text-[#14150F]">Event Poster</p>
            <p className="text-xs text-[#5E6256] mt-1 mb-4">Replace the event poster shown on public cards and detail pages. JPG, PNG, or WEBP under 5MB.</p>
            {posterError && <p className="mb-3 text-xs text-red-500">{posterError}</p>}
            {posterSuccess && <p className="mb-3 text-xs text-emerald-700">{posterSuccess}</p>}
            <div className="flex flex-wrap gap-3">
              <label className="ghost-btn text-sm rounded-full cursor-pointer flex items-center gap-2">
                <ImagePlus className="w-4 h-4" /> Choose Poster
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={posterSaving}
                  onChange={changeEvent => handlePosterChange(changeEvent.target.files?.[0])} />
              </label>
              <button onClick={savePoster} disabled={!posterFile || posterSaving} className="gold-btn text-sm disabled:opacity-50">
                {posterSaving ? 'Uploading...' : 'Save Poster'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {quickActions.map((action) => (
          <button key={action.path}
            onClick={() => navigate(`/dashboard/organizer/events/${event.id}/${action.path}`)}
            className="event-manage-action rounded-lg p-4 text-left transition-all group">
            <div className="flex items-center justify-between mb-2">
              <action.icon className={`w-5 h-5 ${action.color}`} />
              <ArrowRight className="w-4 h-4 text-[#52670F]/35 group-hover:text-[#52670F] transition-colors" />
            </div>
            <p className="text-lg font-black text-[#14150F]">{action.count}</p>
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#5E6256]">{action.label}</p>
          </button>
        ))}
      </div>

      <div className="mt-8">
        <EventRiskRadar event={event} />
      </div>

      <div className="event-manage-panel mt-8 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#E49B3A]" />
              <h2 className="text-base font-black text-[#14150F]">Registration Form</h2>
            </div>
            <p className="text-xs text-[#5E6256] mt-1">Participants submit this form and wait for organizer approval before tickets are issued.</p>
          </div>
          <button onClick={addField} className="ghost-btn text-sm rounded-full flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Field
          </button>
        </div>

        <div className="space-y-3">
          {formFields.map((field, index) => (
            <div key={`${field.label}-${index}`} className="rounded-lg border border-[#DCE8BE] bg-[#FBFFF1] p-3 grid lg:grid-cols-[1.4fr_0.9fr_auto_auto] gap-3">
              <input
                value={field.label}
                onChange={e => updateField(index, { label: e.target.value })}
                placeholder="Field label"
                className="bg-white border border-[#DCE8BE] rounded-lg py-2 px-3 text-sm text-[#14150F] placeholder:text-[#8A8D7B] focus:outline-none focus:border-[#D8F066]"
              />
              <select
                value={field.field_type}
                onChange={e => updateField(index, { field_type: e.target.value as EventFormField['field_type'], options: e.target.value === 'select' ? field.options : [] })}
                className="bg-white border border-[#DCE8BE] rounded-lg py-2 px-3 text-sm text-[#14150F] focus:outline-none focus:border-[#D8F066]"
              >
                {['text', 'textarea', 'number', 'email', 'phone', 'select', 'checkbox'].map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-xs text-[#5E6256]">
                <input type="checkbox" checked={field.required} onChange={e => updateField(index, { required: e.target.checked })} />
                Required
              </label>
              <div className="flex items-center gap-2">
                <button onClick={() => moveField(index, -1)} disabled={index === 0} className="text-xs text-[#5E6256] hover:text-[#52670F] disabled:opacity-30">Up</button>
                <button onClick={() => moveField(index, 1)} disabled={index === formFields.length - 1} className="text-xs text-[#5E6256] hover:text-[#52670F] disabled:opacity-30">Down</button>
                <button onClick={() => deleteField(index)} className="text-red-500/70 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
              </div>
              {field.field_type === 'select' && (
                <input
                  value={field.options.join(', ')}
                  onChange={e => updateField(index, { options: e.target.value.split(',').map(option => option.trim()).filter(Boolean) })}
                  placeholder="Options separated by commas"
                  className="lg:col-span-4 bg-white border border-[#DCE8BE] rounded-lg py-2 px-3 text-sm text-[#14150F] placeholder:text-[#8A8D7B] focus:outline-none focus:border-[#D8F066]"
                />
              )}
            </div>
          ))}
        </div>

        <div className="pt-5 flex items-center gap-3">
          <button onClick={saveForm} className="gold-btn text-sm">Save Form</button>
          {saved && <span className="text-xs text-emerald-700">Registration form saved.</span>}
        </div>
      </div>
    </DashboardLayout>
  );
}
