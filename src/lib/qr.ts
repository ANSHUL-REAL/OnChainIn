import QRCode from 'qrcode';

// QR helpers for check-in tickets (feature 1) and certificate verification
// embeds (feature 2). Display QR codes are rendered live with qrcode.react;
// this is for raster output we need inside a <canvas> (downloads / certs).

export async function qrToDataUrl(text: string, size = 240): Promise<string> {
  return QRCode.toDataURL(text, {
    width: size,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: '#14150F', light: '#FFFFFF' },
  });
}

// The value encoded in a participant's check-in QR. Kept identical to the
// registration code so manual entry and QR scanning resolve the same record.
export function checkInQrValue(registrationCode: string): string {
  return registrationCode;
}
