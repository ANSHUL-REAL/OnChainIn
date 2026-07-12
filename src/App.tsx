import { Routes, Route } from 'react-router';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import EventsPage from '@/pages/EventsPage';
import EventDetail from '@/pages/EventDetail';
import PassportPage from '@/pages/PassportPage';
import VerifyCertificate from '@/pages/VerifyCertificate';
import ParticipantProofPage from '@/pages/ParticipantProofPage';
import VolunteerProofPage from '@/pages/VolunteerProofPage';
import OrganizerDashboard from '@/pages/dashboard/OrganizerDashboard';
import OrganizerEvents from '@/pages/dashboard/OrganizerEvents';
import CreateEvent from '@/pages/dashboard/CreateEvent';
import AICreateEvent from '@/pages/dashboard/AICreateEvent';
import EventManage from '@/pages/dashboard/EventManage';
import EventRegistrations from '@/pages/dashboard/EventRegistrations';
import EventAttendance from '@/pages/dashboard/EventAttendance';
import EventVolunteers from '@/pages/dashboard/EventVolunteers';
import EventSponsors from '@/pages/dashboard/EventSponsors';
import EventBudget from '@/pages/dashboard/EventBudget';
import EventCertificates from '@/pages/dashboard/EventCertificates';
import EventWinners from '@/pages/dashboard/EventWinners';
import OrganizerModuleIndex from '@/pages/dashboard/OrganizerModuleIndex';
import SponsorPitch from '@/pages/dashboard/SponsorPitch';
import ParticipantDashboard from '@/pages/dashboard/ParticipantDashboard';
import ParticipantBrowse from '@/pages/dashboard/ParticipantBrowse';
import ParticipantApplications from '@/pages/dashboard/ParticipantApplications';
import ParticipantTickets from '@/pages/dashboard/ParticipantTickets';
import ParticipantCertificates from '@/pages/dashboard/ParticipantCertificates';
import ParticipantPassport from '@/pages/dashboard/ParticipantPassport';
import VolunteerDashboard from '@/pages/dashboard/VolunteerDashboard';
import VolunteerApplications from '@/pages/dashboard/VolunteerApplications';
import VolunteerTasks from '@/pages/dashboard/VolunteerTasks';
import VolunteerProof from '@/pages/dashboard/VolunteerProof';
import VolunteerRecommendations from '@/pages/dashboard/VolunteerRecommendations';
import VolunteerLeaderboard from '@/pages/dashboard/VolunteerLeaderboard';
import SponsorDashboard from '@/pages/dashboard/SponsorDashboard';
import SponsorEvents from '@/pages/dashboard/SponsorEvents';
import SponsorInterests from '@/pages/dashboard/SponsorInterests';

export default function App() {

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/events" element={<EventsPage />} />
      <Route path="/events/:slug" element={<EventDetail />} />
      <Route path="/passport/:username" element={<PassportPage />} />
      <Route path="/verify/:certificateId" element={<VerifyCertificate />} />
      <Route path="/verify/certificate/:id" element={<VerifyCertificate />} />
      <Route path="/proof/participant/:id" element={<ParticipantProofPage />} />
      <Route path="/proof/volunteer/:id" element={<VolunteerProofPage />} />

      {/* Organizer Dashboard */}
      <Route path="/dashboard/organizer" element={<OrganizerDashboard />} />
      <Route path="/dashboard/organizer/create-with-ai" element={<AICreateEvent />} />
      <Route path="/dashboard/organizer/events" element={<OrganizerEvents />} />
      <Route path="/dashboard/organizer/events/new" element={<CreateEvent />} />
      <Route path="/dashboard/organizer/events/:id" element={<EventManage />} />
      <Route path="/dashboard/organizer/events/:id/form" element={<EventManage />} />
      <Route path="/dashboard/organizer/events/:id/applications" element={<EventRegistrations />} />
      <Route path="/dashboard/organizer/events/:id/registrations" element={<EventRegistrations />} />
      <Route path="/dashboard/organizer/events/:id/attendance" element={<EventAttendance />} />
      <Route path="/dashboard/organizer/events/:id/volunteers" element={<EventVolunteers />} />
      <Route path="/dashboard/organizer/events/:id/sponsors" element={<EventSponsors />} />
      <Route path="/dashboard/organizer/events/:id/budget" element={<EventBudget />} />
      <Route path="/dashboard/organizer/events/:id/certificates" element={<EventCertificates />} />
      <Route path="/dashboard/organizer/events/:id/winners" element={<EventWinners />} />
      <Route path="/dashboard/organizer/volunteers" element={<OrganizerModuleIndex />} />
      <Route path="/dashboard/organizer/sponsors" element={<OrganizerModuleIndex />} />
      <Route path="/dashboard/organizer/budget" element={<OrganizerModuleIndex />} />
      <Route path="/dashboard/organizer/sponsor-pitch" element={<SponsorPitch />} />
      <Route path="/dashboard/organizer/leaderboard" element={<VolunteerLeaderboard />} />

      {/* Participant Dashboard */}
      <Route path="/dashboard/participant" element={<ParticipantDashboard />} />
      <Route path="/dashboard/participant/browse" element={<ParticipantBrowse />} />
      <Route path="/dashboard/participant/applications" element={<ParticipantApplications />} />
      <Route path="/dashboard/participant/tickets" element={<ParticipantTickets />} />
      <Route path="/dashboard/participant/certificates" element={<ParticipantCertificates />} />
      <Route path="/dashboard/participant/passport" element={<ParticipantPassport />} />

      {/* Volunteer Dashboard */}
      <Route path="/dashboard/volunteer" element={<VolunteerDashboard />} />
      <Route path="/dashboard/volunteer/opportunities" element={<VolunteerApplications />} />
      <Route path="/dashboard/volunteer/applications" element={<VolunteerApplications />} />
      <Route path="/dashboard/volunteer/tasks" element={<VolunteerTasks />} />
      <Route path="/dashboard/volunteer/proof" element={<VolunteerProof />} />
      <Route path="/dashboard/volunteer/recommendations" element={<VolunteerRecommendations />} />
      <Route path="/dashboard/volunteer/leaderboard" element={<VolunteerLeaderboard />} />

      {/* Sponsor Dashboard */}
      <Route path="/dashboard/sponsor" element={<SponsorDashboard />} />
      <Route path="/dashboard/sponsor/events" element={<SponsorEvents />} />
      <Route path="/dashboard/sponsor/interests" element={<SponsorInterests />} />
      <Route path="/dashboard/sponsor/pitch" element={<SponsorPitch />} />
    </Routes>
  );
}
