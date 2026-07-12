import { Link, useNavigate } from 'react-router';
import { DashboardLayout } from '@/components/DashboardLayout';
import store from '@/data/store';
import { Award, CheckCircle, Clock, ExternalLink, Shield, Wrench } from 'lucide-react';

export default function VolunteerProof() {
  const navigate = useNavigate();
  const user = store.getCurrentUser();
  const records = user ? store.getUserPassportRecords(user.id).filter(record => record.record_type === 'volunteer_task' || record.record_type === 'volunteer') : [];
  const totalHours = records.reduce((sum, record) => sum + (record.hours || 0), 0);
  const skills = new Set(records.flatMap(record => record.skills || []));
  const events = new Set(records.map(record => record.event_id));

  return (
    <DashboardLayout title="Volunteer Proof">
      <div className="glass-card rounded-xl p-5 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-base font-semibold text-white">Verified volunteer contributions</p>
          <p className="text-xs text-white/35 mt-1">Hours, skills, and completed tasks that appear on your public proof passport.</p>
        </div>
        <Link to={`/proof/volunteer/${user?.id || user?.username}`} className="gold-btn text-sm flex items-center justify-center gap-2">
          View Volunteer Proof <ExternalLink className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="glass-card rounded-lg p-4">
          <Clock className="w-5 h-5 text-emerald-400 mb-2" />
          <p className="text-lg font-bold text-white">{totalHours}</p>
          <p className="text-[10px] text-white/30">Completed Hours</p>
        </div>
        <div className="glass-card rounded-lg p-4">
          <Wrench className="w-5 h-5 text-purple-400 mb-2" />
          <p className="text-lg font-bold text-white">{skills.size}</p>
          <p className="text-[10px] text-white/30">Skills Earned</p>
        </div>
        <div className="glass-card rounded-lg p-4">
          <Award className="w-5 h-5 text-[#E49B3A] mb-2" />
          <p className="text-lg font-bold text-white">{events.size}</p>
          <p className="text-[10px] text-white/30">Events Contributed</p>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center">
          <Shield className="w-12 h-12 text-white/10 mx-auto mb-3" />
          <h2 className="text-base font-semibold text-white mb-2">No volunteer proof records yet</h2>
          <p className="text-sm text-white/30 mb-4">Complete assigned tasks to build your proof passport.</p>
          <button onClick={() => navigate('/dashboard/volunteer/tasks')} className="gold-btn text-sm">View Tasks</button>
        </div>
      ) : (
        <div className="grid gap-3">
          {records.map((record) => (
            <div key={record.id} className="glass-card rounded-xl p-4 flex items-start gap-3">
              <Award className="w-5 h-5 text-[#E49B3A] mt-1" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{record.title}</p>
                <p className="text-xs text-white/35 mt-1">{record.event?.title || record.description}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300">{record.hours}h</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Verified
                  </span>
                </div>
                {(record.skills || []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {record.skills?.map(skill => <span key={skill} className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300">{skill}</span>)}
                  </div>
                )}
                {record.verified_at && <p className="text-[10px] text-white/20 mt-2">Verified {new Date(record.verified_at).toLocaleDateString()}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
