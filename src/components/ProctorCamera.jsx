import {
  useEffect,
  useRef,
  useState
} from "react";

import {
  loadFaceDetector,
  detectFaces
} from "../vision/FaceDetector";

function ProctorCamera() {

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const cameraFrameRef = useRef(null);

  const detectionRunningRef = useRef(false);

  const [cameraState, setCameraState] =
    useState("idle");

  const [modelState, setModelState] =
    useState("not_loaded");

  const [detections, setDetections] =
    useState([]);

  const [frameSize, setFrameSize] =
    useState({ width: 0, height: 0 });

  const [videoSize, setVideoSize] =
    useState({ width: 0, height: 0 });

  const [error, setError] =
    useState("");

  async function startCamera() {

    try {

      setError("");

      setCameraState("requesting");

      const isMobile =
        /Android|iPhone|iPad|iPod/i.test(
          navigator.userAgent
        );

      const stream =
        await navigator.mediaDevices.getUserMedia({

          video: {
            facingMode: "user",

            width: {
              ideal: isMobile ? 640 : 1280
            },

            height: {
              ideal: isMobile ? 480 : 720
            }
          },

          audio: false
        });

      streamRef.current = stream;

      if (videoRef.current) {

        videoRef.current.srcObject =
          stream;

        await videoRef.current.play();
      }

      setCameraState("active");

      await initializeModel();

    } catch (err) {

      console.error(err);

      setCameraState("error");

      setError(
        err.message ||
        "Unable to start camera."
      );
    }
  }

  async function initializeModel() {

    try {

      setModelState("loading");

      const model =
        await loadFaceDetector();

      console.log(
        "Face detector loaded:",
        Boolean(model)
      );

      setModelState(
        "ready"
      );

      startDetection();

    } catch (err) {

      console.error(err);

      setModelState("error");

      setError(
        "Face detector failed to load."
      );
    }
  }

  async function startDetection() {

    if (
      detectionRunningRef.current
    ) {
      return;
    }

    detectionRunningRef.current =
      true;

    while (
      detectionRunningRef.current
    ) {

      if (!videoRef.current) {
        break;
      }

      if (
        videoRef.current.readyState <
        2
      ) {

        await sleep(100);

        continue;
      }

      try {

        const results =
          await detectFaces(
            videoRef.current
          );

        if (results) {

          setDetections(
            results
          );
        }

      } catch (err) {

        console.error(
          "Face detection error:",
          err
        );

      }

      /*
       * We intentionally don't run inference
       * on every animation frame.
       *
       * This is important for phones.
       */

      await sleep(
        getDetectionInterval()
      );
    }
  }

  function getDetectionInterval() {

    const mobile =
      /Android|iPhone|iPad|iPod/i.test(
        navigator.userAgent
      );

    /*
     * ~5 FPS on mobile
     * ~8 FPS on desktop
     */

    return mobile
      ? 200
      : 125;
  }

  function stopCamera() {

    detectionRunningRef.current =
      false;

    if (streamRef.current) {

      streamRef.current
        .getTracks()
        .forEach(
          track => track.stop()
        );

      streamRef.current = null;
    }

    if (videoRef.current) {

      videoRef.current.srcObject =
        null;
    }

    setCameraState("idle");

    setDetections([]);

    setVideoSize({ width: 0, height: 0 });
  }

  useEffect(() => {

    return () => {
      stopCamera();
    };

  }, []);

  useEffect(() => {

    const frame = cameraFrameRef.current;

    if (!frame) {
      return undefined;
    }

    const resizeObserver = new ResizeObserver(
      ([entry]) => {
        setFrameSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    );

    resizeObserver.observe(frame);

    return () => {
      resizeObserver.disconnect();
    };

  }, []);

  return (
    <div>

      <div
        ref={cameraFrameRef}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "800px",
          aspectRatio: "16 / 9",
          background: "#000",
          borderRadius: "12px",
          overflow: "hidden"
        }}
      >

        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          onLoadedMetadata={() => {
            setVideoSize({
              width: videoRef.current?.videoWidth || 0,
              height: videoRef.current?.videoHeight || 0
            });
          }}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover"
          }}
        />

        <FaceBoxes
          detections={detections}
          videoSize={videoSize}
          frameSize={frameSize}
        />

      </div>

      <div
        style={{
          marginTop: "20px"
        }}
      >

        <button
          onClick={startCamera}
        >
          Start Proctoring
        </button>

        <button
          onClick={stopCamera}
          style={{
            marginLeft: "10px"
          }}
        >
          Stop
        </button>

      </div>

      <div
        style={{
          marginTop: "20px"
        }}
      >

        <p>
          Camera: {cameraState}
        </p>

        <p>
          Face detector: {modelState}
        </p>

        <p>
          Faces detected:
          {" "}
          {detections.length}
        </p>

      </div>

      {error && (
        <p
          style={{
            color: "#ff5555"
          }}
        >
          {error}
        </p>
      )}

      <DetectionList
        detections={detections}
      />

    </div>
  );
}

function FaceBoxes({
  detections,
  videoSize,
  frameSize
}) {

  const sourceWidth = videoSize.width;
  const sourceHeight = videoSize.height;

  if (
    !sourceWidth ||
    !sourceHeight ||
    !frameSize.width ||
    !frameSize.height
  ) {
    return null;
  }

  /*
   * Match the video's objectFit: "cover" layout so
   * detection coordinates remain aligned after cropping.
   */
  const scale = Math.max(
    frameSize.width / sourceWidth,
    frameSize.height / sourceHeight
  );

  const offsetX =
    (frameSize.width - (sourceWidth * scale)) / 2;

  const offsetY =
    (frameSize.height - (sourceHeight * scale)) / 2;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none"
      }}
    >

      {detections.map((item, index) => {

        const box = item.boundingBox;

        if (!box) {
          return null;
        }

        const confidence =
          (item.categories?.[0]?.score || 0) * 100;

        return (
          <div
            key={index}
            style={{
              position: "absolute",
              left: `${(box.originX * scale) + offsetX}px`,
              top: `${(box.originY * scale) + offsetY}px`,
              width: `${box.width * scale}px`,
              height: `${box.height * scale}px`,
              border: "3px solid #22c55e",
              borderRadius: "6px",
              boxSizing: "border-box"
            }}
          >

            <span
              style={{
                position: "absolute",
                top: "-28px",
                left: "-3px",
                padding: "4px 7px",
                background: "#22c55e",
                color: "#052e16",
                fontSize: "12px",
                fontWeight: "700",
                borderRadius: "4px 4px 0 0",
                whiteSpace: "nowrap"
              }}
            >
              Face {confidence.toFixed(0)}%
            </span>

          </div>
        );
      })}

    </div>
  );
}

function DetectionList({
  detections
}) {

  return (
    <div>

      {detections.map(
        (item, index) => (

          <div
            key={index}
            style={{
              padding: "8px",
              marginBottom: "5px",
              background: "#1f2937",
              borderRadius: "6px"
            }}
          >

            <strong>
              {item.categories?.[0]?.categoryName ||
                "Face"}
            </strong>

            {" — "}

            {((item.categories?.[0]?.score || 0) *
              100).toFixed(1)}
            %

          </div>

        )
      )}

    </div>
  );
}

function sleep(ms) {

  return new Promise(
    resolve =>
      setTimeout(resolve, ms)
  );
}

export default ProctorCamera;
