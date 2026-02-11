// --- GLOBALE VARIABELEN ---
let reps = 0;
let stage = "initial";
let currentMode = "";
let onboardingStep = 1;
let userProfile = { name: "", age: "", goal: "", weight: "" };

const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');

// --- APP INITIALISATIE ---
window.onload = () => {
    console.log("App geladen...");
    const savedName = localStorage.getItem('userName');
    
    if (savedName) {
        userProfile.name = savedName;
        showScreen('homeScreen');
        document.getElementById('bottomNavBar').classList.remove('hidden');
        document.getElementById('displayUserName').innerText = savedName.toUpperCase();
    } else {
        showScreen('onboardingScreen');
    }

    // Luister naar de knop
    const nextBtn = document.getElementById('nextBtn');
    if(nextBtn) {
        nextBtn.addEventListener('click', () => handleOnboarding());
    }

    // Luister naar de Enter-toets
    document.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleOnboarding();
    });
};

// --- ONBOARDING LOGICA ---
function handleOnboarding() {
    const input = document.getElementById('onboardingInput');
    const question = document.getElementById('onboardingQuestion');
    const stepLabel = document.getElementById('currentOnboardingStep');
    const val = input.value.trim();

    if (!val && onboardingStep <= 4) return;

    console.log("Stap:", onboardingStep, "Waarde:", val);

    if (onboardingStep === 1) {
        userProfile.name = val;
        localStorage.setItem('userName', val);
        question.innerText = "Hoe oud ben je?";
        input.type = "number";
        input.placeholder = "Leeftijd...";
    } else if (onboardingStep === 2) {
        userProfile.age = val;
        question.innerText = "Wat is je doel?";
        input.type = "text";
        input.placeholder = "Bijv. Spieropbouw...";
    } else if (onboardingStep === 3) {
        userProfile.goal = val;
        question.innerText = "Wat is je gewicht (kg)?";
        input.type = "number";
        input.placeholder = "Gewicht...";
    } else if (onboardingStep === 4) {
        userProfile.weight = val;
        showScreen('homeScreen');
        document.getElementById('bottomNavBar').classList.remove('hidden');
        document.getElementById('displayUserName').innerText = userProfile.name.toUpperCase();
        return;
    }

    input.value = "";
    onboardingStep++;
    stepLabel.innerText = onboardingStep;
}

// --- UI LOGICA ---
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
}

// --- MEDIA PIPE AI ---
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

    drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {color: '#d1ff33', lineWidth: 4});
    
    const marks = results.poseLandmarks;
    const feedback = document.getElementById('aiFeedbackMessage');

    if (currentMode === "squat") {
        let angle = calculateAngle(marks[24], marks[26], marks[28]);
        if (angle < 100) { stage = "down"; feedback.innerText = "DIEPER!"; }
        if (angle > 150 && stage === "down") {
            stage = "up";
            reps++;
            document.getElementById('repCountDisplay').innerText = reps;
            feedback.innerText = "GOED!";
        }
    }
    canvasCtx.restore();
}

const pose = new Pose({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
});
pose.setOptions({ modelComplexity: 1, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
pose.onResults(onResults);

function startWorkout(mode) {
    currentMode = mode;
    showScreen('workoutScreen');
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
