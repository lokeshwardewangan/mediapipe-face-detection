
import {
    FilesetResolver,
    FaceDetector
} from "@mediapipe/tasks-vision";

let detector = null;

export async function loadFaceDetector() {
    if (detector) {
        return detector;
    }

    console.log("Loading MediaPipe Face Detector...");

    const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/wasm"
    );

    detector = await FaceDetector.createFromOptions(
        vision,
        {
            baseOptions: {
                modelAssetPath: "/models/blaze_face_short_range.tflite",
                delegate: "GPU"
            },
            runningMode: "VIDEO",
            minDetectionConfidence: 0.8
        }
    );

    console.log("Face Detector loaded");

    return detector;
}

export async function detectFaces(videoElement) {
    if (!detector) {
        await loadFaceDetector();
    }

    if (videoElement.readyState < 2) {
        return [];
    }

    const result = detector.detectForVideo(
        videoElement,
        performance.now()
    );

    return result.detections;
}
