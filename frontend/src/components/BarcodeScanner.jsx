import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect } from "react";

const BarcodeScanner = ({
  onScanSuccess,
}) => {
  useEffect(() => {
    const scanner =
      new Html5QrcodeScanner(
        "reader",
        {
          fps: 10,

          qrbox: {
            width: 350,
            height: 100,
          },

          rememberLastUsedCamera:
            true,
        },
        false
      );

    scanner.render(
      (decodedText) => {
        const match =
          decodedText.match(
            /\d{15}/
          );

        if (!match) {
          return;
        }

        onScanSuccess(
          match[0]
        );

        scanner
          .clear()
          .catch(
            (error) => {
              console.error(
                "Failed to clear scanner:",
                error
              );
            }
          );
      },

      () => {}
    );

    return () => {
      scanner
        .clear()
        .catch(
          (error) => {
            console.error(
              "Scanner cleanup error:",
              error
            );
          }
        );
    };
  }, [onScanSuccess]);

  return (
    <div className="mt-4">
      <div
        id="reader"
        className="max-w-md mx-auto"
      />
    </div>
  );
};

export default BarcodeScanner;