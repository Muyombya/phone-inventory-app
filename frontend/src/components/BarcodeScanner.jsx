
import { useState } from "react";
import Tesseract from "tesseract.js";

const BarcodeScanner = ({
  onScanSuccess,
}) => {
  const [loading, setLoading] =
    useState(false);

  const [detectedImeis, setDetectedImeis] =
    useState([]);

  async function handleImageCapture(
    event
  ) {
    const file =
      event.target.files?.[0];

    if (!file) return;

    setLoading(true);
    setDetectedImeis([]);

    try {
      const {
        data: { text },
      } = await Tesseract.recognize(
        file,
        "eng"
      );

      const matches =
        text.match(/\d{15}/g) || [];

      const uniqueImeis = [
        ...new Set(matches),
      ];

      setDetectedImeis(
        uniqueImeis
      );
    } catch (error) {
      console.error(
        "OCR Error:",
        error
      );

      alert(
        "Failed to read IMEI from image."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 border rounded-lg p-4 bg-gray-50">
      <div className="mb-3">
        <p className="font-medium">
          Scan IMEI Label
        </p>

        <p className="text-sm text-gray-600 mt-1">
          Take a photo of the phone
          box label showing the IMEI.
        </p>
      </div>

      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={
          handleImageCapture
        }
        className="w-full border rounded-lg p-2"
      />

      {loading && (
        <div className="mt-4 text-blue-600 font-medium">
          Reading IMEI...
        </div>
      )}

      {!loading &&
        detectedImeis.length >
          0 && (
          <div className="mt-4">
            <h3 className="font-semibold mb-3">
              Select IMEI
            </h3>

            <div className="space-y-2">
              {detectedImeis.map(
                (imei) => (
                  <button
                    key={imei}
                    type="button"
                    onClick={() =>
                      onScanSuccess(
                        imei
                      )
                    }
                    className="w-full border rounded-lg p-3 text-left hover:bg-green-50 hover:border-green-500"
                  >
                    {imei}
                  </button>
                )
              )}
            </div>
          </div>
        )}

      {!loading &&
        detectedImeis.length ===
          0 && (
          <div className="mt-3 text-sm text-gray-500">
            No IMEI detected yet.
          </div>
        )}
    </div>
  );
};

export default BarcodeScanner;
