
import { useState } from "react";
import Tesseract from "tesseract.js";

const BarcodeScanner = ({
  onScanSuccess,
}) => {
  const [loading, setLoading] =
    useState(false);

  const [ocrText, setOcrText] =
    useState("");

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
    setOcrText("");

    try {
      const imageUrl =
        URL.createObjectURL(
          file
        );

      const image =
        new Image();

      image.src = imageUrl;

      await new Promise(
        (resolve) => {
          image.onload =
            resolve;
        }
      );

      const canvas =
        document.createElement(
          "canvas"
        );

      const ctx =
        canvas.getContext(
          "2d"
        );

    const roiWidth =
  image.width * 0.8;

const roiHeight =
  image.height * 0.12;

const left =
  (image.width -
    roiWidth) /
  2;

const top =
  image.height * 0.58;

      canvas.width =
        roiWidth;

      canvas.height =
        roiHeight;

      ctx.drawImage(
        image,
        left,
        top,
        roiWidth,
        roiHeight,
        0,
        0,
        roiWidth,
        roiHeight
      );

      const {
        data: { text },
      } =
        await Tesseract.recognize(
          canvas,
          "eng"
        );

      setOcrText(text);

      const cleanedText =
        text
          .replace(
            /O/g,
            "0"
          )
          .replace(
            /I/g,
            "1"
          )
          .replace(
            /S/g,
            "5"
          );

      const matches =
        cleanedText.match(
          /\d{15}/g
        ) || [];

      const uniqueImeis = [
        ...new Set(
          matches
        ),
      ];

      setDetectedImeis(
        uniqueImeis
      );

      URL.revokeObjectURL(
        imageUrl
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
          Take a photo of the
          phone box label and
          ensure the IMEI
          sticker is roughly in
          the center of the
          image.
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
          0 &&
        ocrText && (
          <div className="mt-4 border border-yellow-300 bg-yellow-50 rounded-lg p-3">
            <h3 className="font-semibold mb-2">
              OCR Debug Output
            </h3>

            <pre className="text-xs whitespace-pre-wrap">
              {ocrText}
            </pre>
          </div>
        )}

      {!loading &&
        !ocrText && (
          <div className="mt-3 text-sm text-gray-500">
            No IMEI detected
            yet.
          </div>
        )}
    </div>
  );
};

export default BarcodeScanner;