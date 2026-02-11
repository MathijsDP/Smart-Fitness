let reps = 0;
let stage = "up";
let currentMode = "";
let onboardingStep = 1;
let userProfile = { name: "", age: "", goal: "", weight: "" };

// --- ONBOARDING LOGICA ---
function handleOnboarding() {
    const input = document.getElementById('userInput');
    const val = input.value;
    if(!val) return alert("Vul a.u.b. iets in!");

    if(onboardingStep === 1) { userProfile.name = val; nextQuestion("Hoe oud ben je?", "number"); }
    else if(onboardingStep === 2) { userProfile.age = val; nextQuestion("Wat is je doel? (Afvallen/Spieropbouw)", "text"); }
    else if(onboardingStep === 3) { userProfile.goal = val; nextQuestion("Wat is je gewicht (kg)?", "number"); }
    else if(onboardingStep === 4) { 
        userProfile.weight = val; 
        saveProfile(); 
    }
    onboardingStep++;
    document.getElementById('stepNum').innerText = onboardingStep > 4 ? 4 : onboardingStep;
    input.value = "";
}

function nextQuestion(text, type) {
    document.getElementById('questionText').innerText = text;
    document.getElementById('userInput').type = type;
}

function saveProfile() {
    localStorage.setItem('fitnessProfile', JSON.stringify(userProfile));
    showHomeScreen();
}

function showHomeScreen() {
    document.getElementById('onboarding').classList.add('hidden');
    document.getElementById('home').classList.remove('hidden');
    document.getElementById('mainNav').classList.remove('hidden');
    document.getElementById('userNameDisplay').innerText = userProfile.name.toUpperCase();
}

// Check of profiel al bestaat
window.onload = () => {
    const saved = localStorage.getItem('fitnessProfile');
    if(saved) {
        userProfile = JSON.parse(saved);
        showHomeScreen();
    }
};

// --- WORKOUT LOGICA (MediaPipe) ---
// ... (Hier plak je de MediaPipe Pose code die we eerder gebruikten voor startCamera, calculateAngle, etc.) ...
