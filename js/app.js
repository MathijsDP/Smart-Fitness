// --- GLOBALE VARIABELEN ---
let reps = 0;
let stage = "initial";
let currentMode = "";
let currentStep = 1;
let userData = { name: "", age: "", goal: "", weight: "" };

const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');

// --- INITIALISATIE ---
window.onload = () => {
    console.log("App-motor gestart...");
    
    // Check of gebruiker al bestaat in lokaal geheugen
    const savedName = localStorage.getItem('smart_name');
    if (savedName) {
        setupHome(savedName);
    } else {
        showScreen('onboardingScreen');
    }

    // De "Volgende" Knop Fix
    const nextBtn = document.getElementById('nextBtn');
    if(nextBtn) {
        nextBtn.addEventListener('click', () => handleOnboarding());
    }

    // Ondersteuning voor de Enter-toets voor gebruiksgemak
    document.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleOnboarding();
    });
};

// --- ONBOARDING LOGICA ---
function handleOnboarding() {
    const input = document.getElementById('mainInput');
    const question = document.getElementById('qText');
    const stepLabel = document.getElementById('stepNum');
    const val = input.value.trim();

    // Blokkeer als er geen input is
    if (!val && currentStep <= 4) return;

    if (currentStep === 1) {
        userData.name = val;
        localStorage.setItem('smart_name', val);
        question.innerText = "Wat is je leeftijd?";
        input.type = "number";
        input.placeholder = "Leeftijd...";
    } else if (currentStep === 2) {
        userData.age = val;
        question.innerText = "Wat is je hoofddoel?";
        input.type = "text";
        input.placeholder = "Bijv. Spieropbouw...";
    } else if (currentStep === 3) {
        userData.goal = val;
        question.innerText = "Wat is je gewicht (kg)?";
        input.type = "number";
        input.placeholder = "Gewicht...";
    } else if (currentStep === 4) {
        userData.weight = val;
        setupHome(userData.name);
        return;
    }

    input.value = ""; // Maak veld leeg voor volgende vraag
    currentStep++;
    stepLabel.innerText = currentStep;
}

function setupHome(name) {
    showScreen('homeScreen');
    document.getElementById('mainNav').classList.remove('hidden');
    document.getElementById('userNameHeader').innerText = name.toUpperCase();
}

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    const target = document.getElementById(id);
    if(target) target.classList.remove('hidden');
}

// --- AI & CAMERA MOTOR ---
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

    // AI Lijnen en punten tekenen voor technische presentatie
    drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {color: '#3b82f6', lineWidth: 4});
    drawLandmarks(canvasCtx, results.poseLandmarks, {color: '#ffffff', lineWidth: 1, radius: 2});
    
    const marks = results.poseLandmarks;
    const feedback = document.getElementById('aiFeedback');

    if (currentMode === "squat") {
        // Punten voor squats: Heup (24), Knie (26), Enkel (28)
        let angle = calculateAngle(marks[24], marks[26], marks[28]);
        
        if (angle < 100) { 
            stage = "down"; 
            feedback.innerText = "GOED! NU OMHOOG!"; 
            feedback.style.background = "#3b82f6";
        }
        if (angle > 155 && stage === "down") {
            stage = "up";
            reps++;
            document.getElementById('repCounter').innerText = reps;
            feedback.innerText = "TOP! VOLGENDE...";
            feedback.style.background = "rgba(0,0,0,0.6)";
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
    reps = 0;
    document.getElementById('repCounter').innerText = "0";
    document.getElementById('modeTitle').innerText = mode.toUpperCase();
    showScreen('workoutScreen');
    document.getElementById('mainNav').classList.add('hidden');

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
