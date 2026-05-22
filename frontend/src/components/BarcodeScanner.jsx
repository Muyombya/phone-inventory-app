import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect } from "react";

const BarcodeScanner = ({ onScanSuccess }) => {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      {
        fps: 10,
        qrbox: {
          width: 250,
          height: 120,
        },
      },
      false
    );

    scanner.render(
      (decodedText) => {
        onScanSuccess(decodedText);

        scanner.clear().catch((error) => {
          console.error("Failed to clear scanner:", error);
        });
      },
      (errorMessage) => {
        console.warn(errorMessage);
      }
    );

    return () => {
      scanner.clear().catch((error) => {
        console.error("Scanner cleanup error:", error);
      });
    };
  }, [onScanSuccess]);

  return (
    <div className="mt-4">
      <div id="reader" />
    </div>
  );
};

export default BarcodeScanner;