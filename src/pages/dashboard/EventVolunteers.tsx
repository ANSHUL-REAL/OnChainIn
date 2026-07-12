import { useState } from 'react';
import { useParams } from 'react-router';
import { DashboardLayout } from '@/components/DashboardLayout';
import store from '@/data/store';
import { AlertTriangle, CheckCircle, Clock, ClipboardList, Github, Instagram, Linkedin, MapPin, Plus, Users, XCircle } from 'lucide-react';
import type { VolunteerApplication, VolunteerRole } from '@/types';

const defaultVolunteerRoles: Omit<VolunteerRole, 'id' | 'event_id'>[] = [
  {
    role_name: 'Registration Desk',
    description: 'Welcome attendees, verify names, and keep the queue moving.',
    required_count: 4,
    skills: ['Communication', 'Check-in'],
  },
  {
    role_name: 'QR Check-in Support',
    description: 'Scan QR tickets, verify manual codes, and fix entry bottlenecks.',
    required_count: 3,
    skills: ['QR scanning', 'Operations'],
  },
  {
    role_name: 'Stage / Room Coordination',
    description: 'Guide speakers, manage room movement, and keep sessions on schedule.',
    required_count: 2,
    skills: ['Coordination', 'Time management'],
  },
  {
    role_name: 'Technical Support',
    description: 'Support audio, projector, internet, and workshop device issues.',
    required_count: 2,
    skills: ['Tech support', 'Troubleshooting'],
  },
  {
    role_name: 'Social Media / Content',
    description: 'Capture photos, publish updates, and help showcase the event.',
    required_count: 2,
    skills: ['Content', 'Photography'],
  },
  {
    role_name: 'Sponsor & Guest Helpdesk',
    description: 'Support sponsor booths, guests, partners, and VIP movement.',
    required_count: 1,
    skills: ['Hospitality', 'Partner support'],
  },
];

function statusClass(status: string) {
  if (status === 'approved' || status === 'completed') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (status === 'rejected') return 'bg-red-100 text-red-700 border-red-200';
  if (status === 'in_progress') return 'bg-blue-100 text-blue-700 border-blue-200';
  return 'bg-amber-100 text-amber-700 border-amber-200';
}

function roleKey(roleName?: string) {
  return (roleName || 'General Volunteer').trim().toLowerCase();
}

function rolesForEvent(eventId: string): VolunteerRole[] {
  const configured = store.getEventVolunteerRoles(eventId);
  if (configured.length > 0) return configured;

  return defaultVolunteerRoles.map((role, index) => ({
    ...role,
    id: `suggested-${eventId}-${index}`,
    event_id: eventId,
  }));
}

export default function EventVolunteers() {
  const { id } = useParams<{ id: string }>();
  const event = store.getEventById(id || '');
  const [version, setVersion] = useState(0);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskRole, setTaskRole] = useState('Registration Desk');
  const [taskStart, setTaskStart] = useState('');
  const [taskEnd, setTaskEnd] = useState('');
  const [taskHours, setTaskHours] = useState('');
  const [skillsEarned, setSkillsEarned] = useState('');
  const [assignTo, setAssignTo] = useState('');

  if (!event) return <DashboardLayout title="Volunteers"><p className="text-[#62665a]">Event not found</p></DashboardLayout>;

  const applications = store.getEventVolunteerApplications(event.id);
  const tasks = store.getEventVolunteerTasks(event.id);
  const pendingApps = applications.filter(app => app.status === 'pending');
  const approvedApps = applications.filter(app => app.status === 'approved');
  const rejectedApps = applications.filter(app => app.status === 'rejected');
  const roleRequirements = rolesForEvent(event.id).map((role) => {
    const approved = approvedApps.filter(app => roleKey(app.role_requested || app.role?.role_name) === roleKey(role.role_name)).length;
    const pending = pendingApps.filter(app => roleKey(app.role_requested || app.role?.role_name) === roleKey(role.role_name)).length;
    const assignedTasks = tasks.filter(task => roleKey(task.task_role) === roleKey(role.role_name)).length;

    return {
      ...role,
      approved,
      pending,
      assignedTasks,
      shortage: Math.max(role.required_count - approved, 0),
    };
  });
  const totalRequired = roleRequirements.reduce((sum, role) => sum + role.required_count, 0);
  const totalApproved = roleRequirements.reduce((sum, role) => sum + role.approved, 0);
  const totalPending = roleRequirements.reduce((sum, role) => sum + role.pending, 0);
  const totalShortage = Math.max(totalRequired - totalApproved, 0);
  const coverageScore = totalRequired ? Math.min(100, Math.round((totalApproved / totalRequired) * 100)) : 100;

  const updateAppStatus = (appId: string, status: VolunteerApplication['status']) => {
    store.updateVolunteerApplication(appId, { status });
    setVersion(version + 1);
  };

  const openTaskForm = () => {
    if (showTaskForm) {
      setShowTaskForm(false);
      return;
    }

    const firstShortRole = roleRequirements.find(role => role.approved > role.assignedTasks) || roleRequirements[0];
    const firstApproved = approvedApps.find(app => roleKey(app.role_requested || app.role?.role_name) === roleKey(firstShortRole?.role_name)) || approvedApps[0];

    if (firstApproved) {
      const role = firstApproved.role_requested || firstApproved.role?.role_name || 'Volunteer';
      const skills = firstApproved.skills || [];
      const place = firstApproved.preferred_task_place || 'the assigned event area';
      setTaskTitle(`${role} Support`);
      setTaskDesc(`Support ${event.title} as ${role} at ${place}.`);
      setTaskRole(role);
      setTaskHours('2');
      setSkillsEarned(skills.join(', '));
      setAssignTo(firstApproved.volunteer_id);
    }
    setShowTaskForm(true);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    store.createVolunteerTask({
      event_id: event.id,
      volunteer_id: assignTo,
      assigned_to: assignTo,
      title: taskTitle,
      description: taskDesc,
      task_role: taskRole,
      start_time: taskStart,
      end_time: taskEnd,
      status: 'assigned',
      hours: parseFloat(taskHours) || 0,
      skills_earned: skillsEarned.split(',').map(skill => skill.trim()).filter(Boolean),
      skills_gained: skillsEarned.split(',').map(skill => skill.trim()).filter(Boolean),
    });
    setShowTaskForm(false);
    setTaskTitle('');
    setTaskDesc('');
    setTaskRole('Registration Desk');
    setTaskStart('');
    setTaskEnd('');
    setTaskHours('');
    setSkillsEarned('');
    setAssignTo('');
    setVersion(version + 1);
  };

  const renderApplication = (app: VolunteerApplication, showActions = false) => (
    <div key={app.id} className="rounded-[24px] border border-[#ded7c4] bg-white p-4 shadow-[0_14px_36px_rgba(46,36,16,0.06)]">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl bg-[#eef7d7] flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-black text-[#55720e]">{app.volunteer?.full_name?.[0] || '?'}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-[#11130d] truncate">{app.volunteer?.full_name || 'Volunteer'}</p>
          <p className="text-xs text-[#62665a] mt-1">{app.role_requested || app.role?.role_name || 'General Volunteer'}</p>
          {app.preferred_task_place && (
            <p className="text-xs text-[#62665a] mt-1 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#55720e]" /> Preferred: {app.preferred_task_place}
            </p>
          )}
          {app.availability && <p className="text-xs text-[#62665a] mt-1">Available: {app.availability}</p>}
          <p className="text-[10px] text-[#8c887c] mt-1">Applied {new Date(app.applied_at).toLocaleDateString()}</p>
          {(app.skills || []).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {app.skills?.map(skill => <span key={skill} className="text-[9px] px-2 py-0.5 rounded-full bg-[#edf5d8] text-[#55720e]">{skill}</span>)}
            </div>
          )}
          {app.reason && <p className="text-xs text-[#62665a] mt-2">{app.reason}</p>}
          {(app.volunteer?.instagram_url || app.volunteer?.linkedin_url || app.volunteer?.github_url) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {app.volunteer?.instagram_url && (
                <a href={app.volunteer.instagram_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full border border-[#e4ddca] bg-[#fbfaf2] px-2.5 py-1 text-[10px] font-black text-[#55720e] hover:bg-[#eef7d7]">
                  <Instagram className="h-3 w-3" /> Instagram
                </a>
              )}
              {app.volunteer?.linkedin_url && (
                <a href={app.volunteer.linkedin_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full border border-[#e4ddca] bg-[#fbfaf2] px-2.5 py-1 text-[10px] font-black text-[#55720e] hover:bg-[#eef7d7]">
                  <Linkedin className="h-3 w-3" /> LinkedIn
                </a>
              )}
              {app.volunteer?.github_url && (
                <a href={app.volunteer.github_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full border border-[#e4ddca] bg-[#fbfaf2] px-2.5 py-1 text-[10px] font-black text-[#55720e] hover:bg-[#eef7d7]">
                  <Github className="h-3 w-3" /> GitHub
                </a>
              )}
            </div>
          )}
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full border capitalize ${statusClass(app.status)}`}>{app.status}</span>
      </div>
      {showActions && (
        <div className="flex flex-wrap gap-2 mt-4 ml-[52px]">
          <button onClick={() => updateAppStatus(app.id, 'approved')} className="text-xs px-3 py-2 rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200 flex items-center gap-1 font-black">
            <CheckCircle className="w-3.5 h-3.5" /> Approve
          </button>
          <button onClick={() => updateAppStatus(app.id, 'rejected')} className="text-xs px-3 py-2 rounded-full bg-red-100 text-red-700 hover:bg-red-200 flex items-center gap-1 font-black">
            <XCircle className="w-3.5 h-3.5" /> Reject
          </button>
        </div>
      )}
    </div>
  );

  return (
    <DashboardLayout title="Volunteers">
      <section className="mb-8 rounded-[34px] border border-[#dcd4be] bg-[radial-gradient(circle_at_16%_20%,rgba(201,235,91,0.26),transparent_32%),linear-gradient(135deg,#fffdf6,#f8f2df)] p-5 sm:p-7 shadow-[0_24px_80px_rgba(46,36,16,0.09)]">
        <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.32em] text-[#55720e] font-black">Volunteer requirement evaluation</p>
            <h2 className="mt-2 text-3xl sm:text-5xl font-black text-[#11130d]">Know your crew gap before event day.</h2>
            <p className="mt-3 text-sm text-[#62665a] max-w-2xl">
              OnChainIn compares required roles with approved volunteers and pending applicants, then turns shortages into specific task assignments.
            </p>
          </div>
          <div className="rounded-[26px] border border-[#ccd6a7] bg-white/80 p-4 min-w-[220px]">
            <p className="text-[10px] uppercase tracking-[0.22em] text-[#55720e] font-black">Coverage score</p>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-5xl font-black text-[#11130d]">{coverageScore}</span>
              <span className="mb-2 text-sm font-black text-[#55720e]">/100</span>
            </div>
            <p className="mt-1 text-xs text-[#62665a]">
              {totalShortage === 0 ? 'All core volunteer roles are covered.' : `${totalShortage} more volunteer approvals needed.`}
            </p>
          </div>
        </div>

        <div className="mt-6 grid sm:grid-cols-4 gap-3">
          {[
            ['Required', totalRequired],
            ['Approved', totalApproved],
            ['Pending', totalPending],
            ['Shortage', totalShortage],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[22px] border border-[#e4ddca] bg-white/85 p-4">
              <p className="text-3xl font-black text-[#11130d]">{value}</p>
              <p className="text-xs text-[#62665a]">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {roleRequirements.map((role) => (
            <div key={role.id} className="rounded-[24px] border border-[#e4ddca] bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-[#11130d]">{role.role_name}</p>
                  <p className="text-xs text-[#62665a] mt-1">{role.description}</p>
                </div>
                {role.shortage > 0 ? <AlertTriangle className="w-5 h-5 text-[#b46c05]" /> : <CheckCircle className="w-5 h-5 text-emerald-600" />}
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                <div className="rounded-xl bg-[#fbfaf2] border border-[#e4ddca] p-2"><p className="font-black">{role.required_count}</p><p className="text-[9px] text-[#62665a]">need</p></div>
                <div className="rounded-xl bg-[#fbfaf2] border border-[#e4ddca] p-2"><p className="font-black text-[#55720e]">{role.approved}</p><p className="text-[9px] text-[#62665a]">ok</p></div>
                <div className="rounded-xl bg-[#fbfaf2] border border-[#e4ddca] p-2"><p className="font-black text-[#b46c05]">{role.pending}</p><p className="text-[9px] text-[#62665a]">wait</p></div>
                <div className="rounded-xl bg-[#fbfaf2] border border-[#e4ddca] p-2"><p className="font-black text-[#11130d]">{role.assignedTasks}</p><p className="text-[9px] text-[#62665a]">tasks</p></div>
              </div>
              <p className="mt-3 text-xs font-bold text-[#55720e]">
                {role.shortage > 0 ? `Action: approve or invite ${role.shortage} more ${role.role_name.toLowerCase()} volunteer${role.shortage > 1 ? 's' : ''}.` : 'Action: covered. Assign tasks and time slots.'}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid lg:grid-cols-[1fr_1.1fr] gap-8">
        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-black text-[#11130d] mb-3">Pending Applications ({pendingApps.length})</h2>
            {pendingApps.length === 0 ? (
              <div className="rounded-[24px] border border-[#ded7c4] bg-white p-6 text-center"><p className="text-sm text-[#62665a]">No pending volunteer applications</p></div>
            ) : (
              <div className="space-y-3">{pendingApps.map(app => renderApplication(app, true))}</div>
            )}
          </section>

          <section>
            <h2 className="text-lg font-black text-[#11130d] mb-3">Approved Volunteers ({approvedApps.length})</h2>
            {approvedApps.length === 0 ? (
              <div className="rounded-[24px] border border-[#ded7c4] bg-white p-6 text-center"><p className="text-sm text-[#62665a]">No approved volunteers yet</p></div>
            ) : (
              <div className="space-y-3">{approvedApps.map(app => renderApplication(app))}</div>
            )}
          </section>

          {rejectedApps.length > 0 && (
            <section>
              <h2 className="text-lg font-black text-[#11130d] mb-3">Rejected Volunteers ({rejectedApps.length})</h2>
              <div className="space-y-3">{rejectedApps.map(app => renderApplication(app))}</div>
            </section>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-black text-[#11130d]">Specific Volunteer Tasks ({tasks.length})</h2>
            <button onClick={openTaskForm} className="text-xs px-3 py-2 rounded-full bg-[#55720e] text-white hover:bg-[#425909] transition-colors flex items-center gap-1 font-black">
              <Plus className="w-3 h-3" /> Add Task
            </button>
          </div>

          {showTaskForm && (
            <form onSubmit={handleCreateTask} className="rounded-[26px] border border-[#ded7c4] bg-white p-4 mb-4 space-y-3 shadow-[0_16px_40px_rgba(46,36,16,0.08)]">
              <input value={taskTitle} onChange={e => setTaskTitle(e.target.value)} required placeholder="Task title"
                className="w-full bg-[#fbfaf2] border border-[#ded7c4] rounded-2xl py-3 px-3 text-sm text-[#11130d] placeholder:text-[#9b988d] focus:outline-none focus:border-[#55720e]" />
              <select value={taskRole} onChange={e => setTaskRole(e.target.value)} required
                className="w-full bg-[#fbfaf2] border border-[#ded7c4] rounded-2xl py-3 px-3 text-sm text-[#11130d] focus:outline-none focus:border-[#55720e]">
                {roleRequirements.map(role => <option key={role.id} value={role.role_name}>{role.role_name}</option>)}
              </select>
              <textarea value={taskDesc} onChange={e => setTaskDesc(e.target.value)} placeholder="Description" rows={3}
                className="w-full bg-[#fbfaf2] border border-[#ded7c4] rounded-2xl py-3 px-3 text-sm text-[#11130d] placeholder:text-[#9b988d] focus:outline-none focus:border-[#55720e] resize-none" />
              <div className="grid grid-cols-2 gap-2">
                <input value={taskStart} onChange={e => setTaskStart(e.target.value)} placeholder="Start time"
                  className="bg-[#fbfaf2] border border-[#ded7c4] rounded-2xl py-3 px-3 text-sm text-[#11130d] placeholder:text-[#9b988d] focus:outline-none focus:border-[#55720e]" />
                <input value={taskEnd} onChange={e => setTaskEnd(e.target.value)} placeholder="End time"
                  className="bg-[#fbfaf2] border border-[#ded7c4] rounded-2xl py-3 px-3 text-sm text-[#11130d] placeholder:text-[#9b988d] focus:outline-none focus:border-[#55720e]" />
              </div>
              <div className="grid grid-cols-[0.7fr_1.3fr] gap-2">
                <input type="number" value={taskHours} onChange={e => setTaskHours(e.target.value)} required placeholder="Hours"
                  className="bg-[#fbfaf2] border border-[#ded7c4] rounded-2xl py-3 px-3 text-sm text-[#11130d] placeholder:text-[#9b988d] focus:outline-none focus:border-[#55720e]" />
                <input value={skillsEarned} onChange={e => setSkillsEarned(e.target.value)} placeholder="Skills earned, comma separated"
                  className="bg-[#fbfaf2] border border-[#ded7c4] rounded-2xl py-3 px-3 text-sm text-[#11130d] placeholder:text-[#9b988d] focus:outline-none focus:border-[#55720e]" />
              </div>
              <select value={assignTo} onChange={e => setAssignTo(e.target.value)} required
                className="w-full bg-[#fbfaf2] border border-[#ded7c4] rounded-2xl py-3 px-3 text-sm text-[#11130d] focus:outline-none focus:border-[#55720e]">
                <option value="">Assign to approved volunteer</option>
                {approvedApps.map(app => (
                  <option key={app.id} value={app.volunteer_id}>
                    {app.volunteer?.full_name || app.volunteer_id} - {app.role_requested || 'Volunteer'}
                  </option>
                ))}
              </select>
              <button type="submit" className="rounded-full bg-[#55720e] px-5 py-3 text-sm font-black text-white hover:bg-[#425909]">Create Task</button>
            </form>
          )}

          {tasks.length === 0 ? (
            <div className="rounded-[28px] border border-[#ded7c4] bg-white p-8 text-center shadow-[0_18px_60px_rgba(46,36,16,0.08)]">
              <ClipboardList className="w-12 h-12 text-[#55720e]/20 mx-auto mb-3" />
              <p className="text-sm text-[#62665a]">No volunteer tasks yet. Approve a volunteer and assign the first task.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-3 gap-3">
              {['assigned', 'in_progress', 'completed'].map((status) => (
                <div key={status} className="rounded-[24px] border border-[#ded7c4] bg-white p-3">
                  <div className="flex items-center gap-1 mb-3">
                    {status === 'assigned' && <Clock className="w-3.5 h-3.5 text-[#b46c05]" />}
                    {status === 'in_progress' && <Users className="w-3.5 h-3.5 text-blue-600" />}
                    {status === 'completed' && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                    <p className="text-[10px] font-black text-[#55720e] uppercase tracking-[0.16em]">{status.replace('_', ' ')}</p>
                  </div>
                  <div className="space-y-2">
                    {tasks.filter(task => task.status === status).map((task) => (
                      <div key={task.id} className="rounded-2xl border border-[#e4ddca] bg-[#fbfaf2] p-3">
                        <p className="text-xs font-black text-[#11130d]">{task.title}</p>
                        <p className="text-[10px] text-[#62665a] mt-0.5">{task.task_role}</p>
                        {task.assignee && <p className="text-[10px] text-[#62665a] mt-0.5">{task.assignee.full_name}</p>}
                        {task.hours > 0 && <p className="text-[10px] text-[#8c887c]">{task.hours}h</p>}
                      </div>
                    ))}
                    {tasks.filter(task => task.status === status).length === 0 && <p className="text-[10px] text-[#8c887c] text-center py-3">None</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
