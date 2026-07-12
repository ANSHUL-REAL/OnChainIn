import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { QRCodeSVG } from 'qrcode.react';
import { Award, Blocks, Calendar, CheckCircle, Clock, ExternalLink, QrCode, Shield, UserCheck, XCircle } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import { CertificateDownloadButton } from '@/components/CertificateDownloadButton';
import { getParticipantProof } from '@/lib/proofEngine';

export default function ParticipantProofPage() {
  const { id } = useParams<{ id: string }>();
  const [message, setMessage] = useState('');
  const proof = getParticipantProof(id || '');

  const shareProof = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setMessage('Proof link copied.');
    } catch {
      setMessage(url);
    }
  };

  return (
    <div className="eventos-light-app min-h-screen bg-[#F7F6EB] text-[#14150F]">
      <Navbar />
      <main className="max-w-[88rem] mx-auto px-4 sm:px-6 pt-24 pb-16">
        {!proof ? (
          <div className="workspace-empty">
            <XCircle className="w-12 h-12 text-[#52670F]/30 mx-auto mb-3" />
            <h1 className="text-2xl font-black text-[#14150F]">Participant proof not found</h1>
            <p className="text-sm text-[#5E6256] mt-2">This proof page appears only after a real registration or check-in exists.</p>
            <Link to="/events" className="gold-btn inline-flex mt-5">Browse events</Link>
          </div>
        ) : (
          <section className="passport-credential">
            <div className="passport-identity">
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                <div className="passport-photo h-36 sm:h-44">
                  <span>{(proof.participant?.full_name || 'P').split(' ').map(part => part[0]).slice(0, 2).join('')}</span>
                </div>
                <div className="flex-1">
                  <p className="passport-kicker">Verified participant proof</p>
                  <h1 className="text-4xl sm:text-6xl font-black tracking-[-0.055em] leading-[0.92] mt-3">
                    {proof.participant?.full_name || 'Participant'}
                  </h1>
                  <p className="text-lg text-[#5E6256] mt-4 max-w-2xl">
                    {proof.event?.title || 'Event'} participation record from OnChainIn registration, check-in, and certificate data
                    {proof.attendance?.tx_hash ? ' — with immutable Cardano proof.' : '.'}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-5">
                    <span className="passport-chip"><Shield className="w-3.5 h-3.5" /> Organizer verified</span>
                    <span className="passport-chip"><QrCode className="w-3.5 h-3.5" /> {proof.proofId}</span>
                    <span className="passport-chip"><UserCheck className="w-3.5 h-3.5" /> {proof.verified ? 'Checked in' : 'Not checked in yet'}</span>
                    {proof.attendance?.tx_hash && (
                      <a
                        href={proof.attendance.explorer_url || `https://preprod.cardanoscan.io/transaction/${proof.attendance.tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="passport-chip hover:bg-[#EEF5D9]"
                      >
                        <Blocks className="w-3.5 h-3.5" /> Cardano tx {proof.attendance.tx_hash.slice(0, 10)}…
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                {[
                  { icon: Calendar, label: 'Event date', value: proof.event?.date || 'Unknown' },
                  { icon: CheckCircle, label: 'Check-in status', value: proof.verified ? 'Verified' : proof.registration.status },
                  { icon: Clock, label: 'Check-in time', value: proof.attendance ? new Date(proof.attendance.checked_in_at).toLocaleString() : 'Waiting' },
                  { icon: Award, label: 'Certificate', value: proof.certificate ? 'Issued' : 'Not issued' },
                ].map((item) => (
                  <div key={item.label} className="passport-stat">
                    <item.icon className="w-5 h-5" />
                    <p className="text-xl leading-tight">{item.value}</p>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>

              <div className="grid sm:grid-cols-2 gap-3 mt-8">
                {proof.certificate && proof.event ? (
                  <CertificateDownloadButton
                    label="Download Certificate"
                    className="gold-btn inline-flex items-center justify-center gap-2"
                    data={{
                      participantName: proof.participant?.full_name || 'Participant',
                      eventName: proof.event.title,
                      date: proof.event.date,
                      organizerName: proof.organizer?.full_name || 'OnChainIn',
                      code: proof.certificate.certificate_code,
                      role: proof.certificate.role,
                      txHash: proof.attendance?.tx_hash || proof.certificate.tx_hash,
                      explorerUrl: proof.attendance?.explorer_url || proof.certificate.explorer_url,
                      walletAddress: proof.attendance?.wallet_address || proof.certificate.wallet_address,
                    }}
                  />
                ) : (
                  <button type="button" disabled className="gold-btn inline-flex items-center justify-center gap-2 opacity-50">
                    Download Certificate
                  </button>
                )}
                <button type="button" onClick={shareProof} className="ghost-btn rounded-full inline-flex items-center justify-center gap-2">
                  <ExternalLink className="w-4 h-4" /> Share Proof
                </button>
              </div>
              {message && <p className="text-sm font-semibold text-[#52670F] mt-4">{message}</p>}
            </div>

            <aside className="passport-verify">
              <div className="passport-seal">
                {proof.registration.registration_code ? (
                  <QRCodeSVG value={proof.registration.registration_code} size={86} bgColor="transparent" fgColor="#52670F" />
                ) : (
                  <Shield className="w-11 h-11" />
                )}
                <span>QR proof</span>
              </div>
              <p className="passport-kicker">What this proves</p>
              <h2>Real attendance, not a claim.</h2>
              <p>
                This page is valid only when OnChainIn has a registration record. It becomes verified proof after organizer check-in and certificate issuing.
              </p>
              <div className="space-y-3 mt-6">
                <div className="passport-rule"><CheckCircle className="w-5 h-5" /> Registration status: {proof.registration.status}</div>
                <div className="passport-rule"><CheckCircle className="w-5 h-5" /> Verified by: {proof.organizer?.full_name || 'OnChainIn organizer'}</div>
                <div className="passport-rule"><CheckCircle className="w-5 h-5" /> Certificate ID: {proof.certificate?.certificate_code || 'Not issued yet'}</div>
              </div>
            </aside>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
