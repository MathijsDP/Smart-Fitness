let reps = 0;
let stage = "up";
let currentMode = "";
const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');

function speak(text) {
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = 'nl-NL';
    window.speechSynthesis.speak(msg);
}

function startApp() {
    document.getElementById('onboarding').classList.add('hidden');
    document.getElementById('home').classList.remove('hidden');
    document.getElementById('mainNav').style.display = 'flex';
    speak("Welkom terug, kampioen. Wat gaan we vandaag trainen?");
}

function openWorkout(mode) {
    currentMode = mode;
    document.getElementById('home').classList.add('hidden');
    document.getElementById('mainNav').style.display = 'none';
    document.getElementById('workoutScreen').classList.remove('hidden');
    document.getElementById('mode-title').innerText = mode.toUpperCase();
    speak("Maak je klaar voor de " + mode + "s. Ga volledig in beeld staan.");
    startCamera();
}

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

    drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {color: '#3b82f6', lineWidth: 4});
    drawLandmarks(canvasCtx, results.poseLandmarks, {color: '#ffffff', lineWidth: 2});

    const marks = results.poseLandmarks;
    let angle = 0;
    const feedback = document.getElementById('ai-feedback');

    if (currentMode === "squat") {
        angle = calculateAngle(marks[24], marks[26], marks[28]); // Heup-Knie-Enkel
        if (angle < 100) {
            stage = "down";
            feedback.innerText = "GOED ZO! NU OMHOOG!";
            feedback.style.color = "#10b981";
        }
        if (angle > 150 && stage === "down") {
            stage = "up";
            reps++;
            document.getElementById('rep-count').innerText = reps;
            speak(reps.toString());
            feedback.innerText = "TOP! GA DOOR!";
        }
    } else if (currentMode === "pushup") {
        angle = calculateAngle(marks[12], marks[14], marks[16]); // Schouder-Elleboog-Pols
        if (angle < 90) stage = "down";
        if (angle > 150 && stage === "down") {
            stage = "up";
            reps++;
            document.getElementById('rep-count').innerText = reps;
            speak(reps.toString());
        }
    }
    canvasCtx.restore();
}

const pose = new Pose({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
});
pose.setOptions({ modelComplexity: 1, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
pose.onResults(onResults);

function startCamera() {
    const camera = new Camera(videoElement, {
        onFrame: async () => {
            canvasElement.width = videoElement.videoWidth;
            canvasElement.height = videoElement.videoHeight;
            await pose.send({image: videoElement});
        },
        width: 640, height: 480
    });
    camera.start();
}
