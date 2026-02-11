let reps = 0;
let stage = "up";
let currentMode = "";

const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');

// Functie om de hoek tussen 3 punten te berekenen (bijv. Schouder-Elleboog-Pols)
function calculateAngle(a, b, c) {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);
    if (angle > 180.0) angle = 360 - angle;
    return angle;
}

function onResults(results) {
    if (!results.poseLandmarks) return;

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    // Teken de lijnen op je lichaam
    drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {color: '#3b82f6', lineWidth: 4});
    drawLandmarks(canvasCtx, results.poseLandmarks, {color: '#ffffff', lineWidth: 2});

    const landmarks = results.poseLandmarks;
    let angle = 0;

    if (currentMode === "squat") {
        // Bereken kniehoek (Heup, Knie, Enkel)
        angle = calculateAngle(landmarks[24], landmarks[26], landmarks[28]);
        if (angle < 90) stage = "down";
        if (angle > 160 && stage === "down") {
            stage = "up";
            reps++;
            document.getElementById('rep-count').innerText = reps;
        }
    } else if (currentMode === "pushup") {
        // Bereken ellebooghoek (Schouder, Elleboog, Pols)
        angle = calculateAngle(landmarks[12], landmarks[14], landmarks[16]);
        if (angle < 80) stage = "down";
        if (angle > 160 && stage === "down") {
            stage = "up";
            reps++;
            document.getElementById('rep-count').innerText = reps;
        }
    }
    canvasCtx.restore();
}

const pose = new Pose({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
});

pose.setOptions({
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});
pose.onResults(onResults);

function startWorkout(mode) {
    currentMode = mode;
    document.getElementById('home').classList.add('hidden');
    document.getElementById('workoutScreen').classList.remove('hidden');
    document.getElementById('mode-text').innerText = mode.toUpperCase();
    
    const camera = new Camera(videoElement, {
        onFrame: async () => {
            canvasElement.width = videoElement.videoWidth;
            canvasElement.height = videoElement.videoHeight;
            await pose.send({image: videoElement});
        },
        width: 640,
        height: 480
    });
    camera.start();
}
