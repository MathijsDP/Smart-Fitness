const LINKS = { 
    legs: "https://teachablemachine.withgoogle.com/models/Nv8j7aUsi/", 
    chest: "https://teachablemachine.withgoogle.com/models/VyHCtMsZf/" 
};

let userData = {};
let currentStep = 1;
let model, webcam, ctx;
let reps = 0, status = "up";

function speak(text) {
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = 'nl-NL';
    window.speechSynthesis.speak(msg);
}

function renderStep() {
    const container = document.getElementById("questionCard");
    if (currentStep === 1) {
        container.innerHTML = `<h3>Hoe oud ben je?</h3><input type="number" id="ageInput"><button class="button" onclick="next()">Volgende</button>`;
    } else if (currentStep === 4) {
        container.innerHTML = `<h3>Wat wil je trainen?</h3><button class="button" onclick="finalize('legs')">Benen</button><button class="button" onclick="finalize('chest')" style="margin-top:10px">Borst</button>`;
    }
}

function next() { currentStep++; renderStep(); }

function finalize(goal) {
    userData.goal = goal;
    localStorage.setItem("fitnessPro", JSON.stringify(userData));
    location.reload();
}

// Start de app
if(localStorage.getItem("fitnessPro")) {
    document.getElementById("onboarding").classList.add("hidden");
    document.getElementById("home").classList.remove("hidden");
} else {
    renderStep();
}
