// Globale variabelen
let reps = 0;
let stage = "initial"; // up, down, initial
let currentWorkoutMode = ""; // 'squat' of 'pushup'
let onboardingStep = 1;
let userProfile = { name: "", age: "", goal: "", weight: "" };

// DOM Elementen
const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');

// --- HULP FUNCTIES ---
function speak(text) {
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = 'nl-NL'; // Nederlandse stem
    window.speechSynthesis.speak(msg);
}

// Wisselen tussen schermen
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
        screen.classList.remove('active'); // Verwijder actieve klasse
    });
    document.getElementById(screenId).classList.remove('hidden');
    document.getElementById(screenId).classList.add('active'); // Voeg actieve klasse toe

    // Update navigatiebalk actieve status
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    if (screenId === 'homeScreen') document.querySelector('[onclick="showScreen(\'homeScreen\')"]').classList.add('active');
    else if (screenId === 'profileScreen') document.querySelector('[onclick="showScreen(\'profileScreen\')"]').classList.add('active');
}

// --- ONBOARDING LOGICA ---
function nextOnboardingStep() {
    const input = document.getElementById('onboardingInput');
    const questionText = document.getElementById('onboardingQuestion');
    const currentStepNum = document.getElementById('currentOnboardingStep');

    if (onboardingStep === 1) {
        if (!input.value) return speak("Graag je naam invullen.");
        userProfile.name = input.value;
        questionText.innerText = "Hoe oud ben je?";
        input.type = "number";
        input.placeholder = "Leeftijd in jaren...";
    } else if (onboardingStep === 2) {
        if (!input.value || isNaN(input.value)) return speak("Graag een geldig getal invullen voor leeftijd.");
        userProfile.age = input.value;
        questionText.innerText = "Wat is je fitness doel?";
        input.type = "text";
        input.placeholder = "Bijv. Spieropbouw, Afvallen...";
    } else if (onboardingStep === 3) {
        if (!input.value) return speak("Graag je doel invullen.");
        userProfile.goal = input.value;
        questionText.innerText = "Wat is je gewicht in kg?";
        input.type = "number";
        input.placeholder = "Gewicht in kg...";
    } else if (onboardingStep === 4) {
        if (!input.value || isNaN(input.value)) return speak("Graag een geldig getal invullen voor gewicht.");
        userProfile.weight = input.value;
        saveUserProfile();
        speak(`Welkom ${userProfile.name}, laten we beginnen met trainen!`);
        showScreen('homeScreen');
        document.getElementById('bottomNavBar').classList.remove('hidden');
        updateHomeDisplay();
        return; // Stop verdere stappen
    }
    input.value = ""; // Reset input
    onboardingStep++;
    currentStepNum.innerText = onboardingStep;
}

function saveUserProfile() {
    localStorage.setItem('smartFitnessProfile', JSON.stringify(userProfile));
}

function loadUserProfile() {
    const savedProfile = localStorage.getItem('smartFitnessProfile');
    if (savedProfile) {
        userProfile = JSON.parse(savedProfile);
        return true;
    }
    return false;
}

function resetApp() {
    localStorage.clear();
    location.reload(); // Herlaad de pagina om opnieuw te beginnen
}

// --- HOME SCREEN LOGICA ---
function updateHomeDisplay() {
    if (userProfile.name) {
        document.getElementById('displayUserName').innerText = userProfile.name.toUpperCase();
    }
    // TODO: Dynamische data voor calories en duration
    document.getElementById('displayCalories').innerText = '0'; // Dummy
    document.getElementById('displayDuration').innerText = '0'; // Dummy
}

function updateProfileScreen() {
    document.getElementById('profileName').innerText = userProfile.name;
    document.getElementById('profileAge').innerText = userProfile.age;
    document.getElementById('profileGoal').innerText = userProfile.goal;
    document.getElementById('profileWeight').innerText = userProfile.weight;
}

// --- MEDIA PIPE EN WORKOUT LOGICA ---
function calculateAngle(a, b, c) {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);
    if (angle > 180.0) angle = 360 - angle;
    return angle;
}

function onResults(results) {
    if (!results.poseLandmarks) {
        document.getElementById('aiFeedbackMessage').innerText = "Zoek positie...";
        return;
    }

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {color: '#d1ff33', lineWidth: 4}); // Limegroen
    drawLandmarks(canvasCtx, results.poseLandmarks, {color: '#ffffff', lineWidth: 2}); // Wit voor de punten

    const marks = results.poseLandmarks;
    const feedback = document.getElementById('aiFeedbackMessage');

    if (currentWorkoutMode === "squat") {
        // Punten: 24=RightHip, 26=RightKnee, 28=RightAnkle
        const hip = marks[PoseLandmark.RIGHT_HIP];
        const knee = marks[PoseLandmark.RIGHT_KNEE];
        const ankle = marks[PoseLandmark.RIGHT_ANKLE];

        if (!hip || !knee || !ankle) {
            feedback.innerText = "Volledig in beeld blijven!";
            stage = "initial";
            canvasCtx.restore();
            return;
        }

        let angle = calculateAngle(hip, knee, ankle);

        if (angle < 90 && stage !== "down") { // Diep genoeg
            stage = "down";
            feedback.innerText = "GOED! NU OMHOOG!";
            speak("Op!");
        }
        if (angle > 160 && stage === "down") { // Terug omhoog
            stage = "up";
            reps++;
            document.getElementById('repCountDisplay').innerText = reps;
            feedback.innerText = "TOP! GA DOOR!";
            speak(reps.toString());
        } else if (angle > 160 && stage === "initial") {
            feedback.innerText = "Ga omlaag voor de eerste herhaling!";
        }
    } 
    // TODO: Implementeer Pushup logica hier
    else if (currentWorkoutMode === "pushup") {
        // Punten: 12=RightShoulder, 14=RightElbow, 16=RightWrist
        const shoulder = marks[PoseLandmark.RIGHT_SHOULDER];
        const elbow = marks[PoseLandmark.RIGHT_ELBOW];
        const wrist = marks[PoseLandmark.RIGHT_WRIST];

        if (!shoulder || !elbow || !wrist) {
            feedback.innerText = "Volledig in beeld blijven!";
            stage = "initial";
            canvasCtx.restore();
            return;
        }

        let angle = calculateAngle(shoulder, elbow, wrist);

        if (angle < 90 && stage !== "down") { // Diep genoeg
            stage = "down";
            feedback.innerText = "GOED! NU OMHOOG!";
            speak("Op!");
        }
        if (angle > 160 && stage === "down") { // Terug omhoog
            stage = "up";
            reps++;
            document.getElementById('repCountDisplay').innerText = reps;
            feedback.innerText = "TOP! GA DOOR!";
            speak(reps.toString());
        } else if (angle > 160 && stage === "initial") {
            feedback.innerText = "Ga omlaag voor de eerste herhaling!";
        }
    }

    canvasCtx.restore();
}

const pose = new Pose({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
});
pose.setOptions({
    modelComplexity: 1, // 0 is snel, 2 is accuraat
    smoothLandmarks: true,
    minDetectionConfidence: 0.7, // Hogere waarde, minder vals-positieven
    minTrackingConfidence: 0.7
});
pose.onResults(onResults);

let camera = null; // Zorg dat de camera globaal is

function startWorkout(mode) {
    currentWorkoutMode = mode;
    reps = 0; // Reset reps
    stage = "initial"; // Reset stage
    document.getElementById('repCountDisplay').innerText = reps;
    document.getElementById('workoutModeDisplay').innerText = mode.toUpperCase();
    
    showScreen('workoutScreen');
    document.getElementById('bottomNavBar').classList.add('hidden'); // Verberg navigatie tijdens workout

    // Camera starten
    if (camera) { // Als camera al bestaat, stop deze dan eerst
        camera.stop();
        camera = null;
    }
    camera = new Camera(videoElement, {
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

function stopWorkout() {
    if (camera) {
        camera.stop();
        camera = null;
    }
    showScreen('homeScreen');
    document.getElementById('bottomNavBar').classList.remove('hidden'); // Toon navigatie weer
    speak("Training beëindigd.");
}

// --- APP STARTUP LOGICA ---
// Check bij het laden of er een profiel is, anders start onboarding
window.onload = () => {
    if (loadUserProfile()) {
        showScreen('homeScreen');
        document.getElementById('bottomNavBar').classList.remove('hidden');
        updateHomeDisplay();
        updateProfileScreen(); // Update profielscherm bij laden
    } else {
        showScreen('onboardingScreen');
        speak("Welkom bij Smart Fitness. Laten we je profiel aanmaken.");
    }
};
