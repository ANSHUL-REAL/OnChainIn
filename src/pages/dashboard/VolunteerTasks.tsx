import { useState } from 'react';
import { useNavigate } from 'react-router';
import { DashboardLayout } from '@/components/DashboardLayout';
import store from '@/data/store';
import { CheckCircle, Clock, ClipboardList, Wrench } from 'lucide-react';
import type { VolunteerTask } from '@/types';

const columns: Array<{ key: VolunteerTask['status']; label: string }> = [
  { key: 'assigned', label: 'Assigned' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
];

function statusClass(status: VolunteerTask['status']) {
  if (status === 'completed') return 'bg-emerald-500/20 text-emerald-400';
  if (status === 'in_progress') return 'bg-blue-500/20 text-blue-400';
  return 'bg-amber-500/20 text-amber-400';
}

export default function VolunteerTasks() {
  const navigate = useNavigate();
  const user = store.getCurrentUser();
  const [version, setVersion] = useState(0);
  const tasks = user ? store.getVolunteerTasksByUser(user.id) : [];

  const updateStatus = (task: VolunteerTask, status: VolunteerTask['status']) => {
    const updates: Partial<VolunteerTask> = { status };
    if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
      const volunteerId = task.assigned_to || task.volunteer_id || user?.id || '';
      const existingPoints = store.getVolunteerPoints();
      const taskPointKey = `Task completed: ${task.id}`;
      const hourPointKey = `Volunteer hours: ${task.id}`;
      if (volunteerId && !existingPoints.some(entry => entry.user_id === volunteerId && entry.reason === taskPointKey)) {
        store.addVolunteerPoints(volunteerId, 50, taskPointKey, task.event_id, user?.full_name);
      }
      if (volunteerId && task.hours && !existingPoints.some(entry => entry.user_id === volunteerId && entry.reason === hourPointKey)) {
        store.addVolunteerPoints(volunteerId, task.hours * 10, hourPointKey, task.event_id, user?.full_name);
      }
      store.createPassportRecord({
        user_id: volunteerId,
        event_id: task.event_id,
        record_type: 'volunteer_task',
        title: task.title,
        description: task.description || `${task.task_role || 'Volunteer'} task completed`,
        skills: task.skills_earned || task.skills_gained || [],
        hours: task.hours || 0,
        verified_at: new Date().toISOString(),
      });
    }
    store.updateVolunteerTask(task.id, updates);
    setVersion(version + 1);
  };

  return (
    <DashboardLayout title="My Tasks">
      {tasks.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center">
          <ClipboardList className="w-12 h-12 text-white/10 mx-auto mb-3" />
          <h2 className="text-base font-semibold text-white mb-2">No tasks assigned yet</h2>
          <p className="text-sm text-white/30 mb-4">Once an organizer approves your volunteer application, assigned tasks will appear here.</p>
          <button onClick={() => navigate('/dashboard/volunteer/applications')} className="gold-btn text-sm">Browse Volunteer Opportunities</button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-4">
          {columns.map((column) => {
            const columnTasks = tasks.filter(task => task.status === column.key);
            return (
              <section key={column.key} className="glass-card rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-white">{column.label}</h2>
                  <span className="text-[10px] text-white/30">{columnTasks.length}</span>
                </div>
                <div className="space-y-3">
                  {columnTasks.length === 0 && <p className="text-xs text-white/25 text-center py-6">No tasks</p>}
                  {columnTasks.map((task) => (
                    <div key={task.id} className="rounded-lg bg-white/[0.03] border border-white/5 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-white">{task.title}</p>
                          <p className="text-[10px] text-white/35 mt-1">{task.event?.title}</p>
                        </div>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full capitalize ${statusClass(task.status)}`}>{task.status.replace('_', ' ')}</span>
                      </div>
                      <p className="text-xs text-white/35 mt-3">{task.description || 'No description provided.'}</p>
                      <div className="mt-3 space-y-1 text-[10px] text-white/25">
                        <p>{task.task_role || 'Volunteer Task'}</p>
                        {(task.start_time || task.end_time) && <p>{task.start_time || 'Start'} - {task.end_time || 'End'}</p>}
                        <p>{task.hours || 0} hours</p>
                      </div>
                      {(task.skills_earned || task.skills_gained || []).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {(task.skills_earned || task.skills_gained || []).map(skill => (
                            <span key={skill} className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 flex items-center gap-1">
                              <Wrench className="w-2.5 h-2.5" /> {skill}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2 mt-4">
                        {task.status === 'assigned' && (
                          <button onClick={() => updateStatus(task, 'in_progress')} className="text-[10px] px-3 py-1.5 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors">
                            <Clock className="inline w-3 h-3 mr-1" /> Start Task
                          </button>
                        )}
                        {task.status === 'in_progress' && (
                          <button onClick={() => updateStatus(task, 'completed')} className="text-[10px] px-3 py-1.5 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors">
                            <CheckCircle className="inline w-3 h-3 mr-1" /> Mark Completed
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
