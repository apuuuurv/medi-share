import QRCode from 'qrcode';

export const generateQRCodeDataURI = async (payload: string): Promise<string> => {
  try {
    const qrDataUrl = await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'H',
      width: 300,
      margin: 2,
    });
    return qrDataUrl;
  } catch (error) {
    throw new Error(`Failed to generate QR Code: ${(error as Error).message}`);
  }
};