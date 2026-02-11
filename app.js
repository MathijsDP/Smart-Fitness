const LINKS = { 
    legs: "https://teachablemachine.withgoogle.com/models/Nv8j7aUsi/", 
    chest: "https://teachablemachine.withgoogle.com/models/VyHCtMsZf/" 
};

let userData = {};
let currentStep = 1;
let model, webcam, ctx, animationId;
let reps = 0, currentSet = 1, maxSets = 3, repsPerSet = 12, status = "up", isResting = false;

// --- STEM ASSISTENT ---
function speak(text) {
    const msg = new SpeechSynthesisUtterance();
    msg.text = text;
    msg.lang = 'nl-NL';
    msg.rate = 1.2;
    window.speechSynthesis.speak(msg);
}

// --- INITIALISATIE ---
init();

function init() {
    const saved = localStorage.getItem("fitnessProFinal");
    if (saved) {
        userData = JSON.parse(saved);
        showHome();
    } else { renderStep(); }
}

function renderStep() {
    const container = document.getElementById("questionCard");
    if (currentStep === 1) {
        container.innerHTML = `<h3>Wat is je leeftijd?</h3><input type="number" id="ageInput"><button class="button" onclick="userData.age=document.getElementById('ageInput').value; currentStep=2; renderStep();">Volgende</button>`;
    } else if (currentStep === 2) {
        container.innerHTML = `<p style="color:var(--primary)">Perfecte leeftijd!</p><h3>Lengte (cm)?</h3><input type="number" id="heightInput"><button class="button" onclick="userData.height=document.getElementById('heightInput').value; currentStep=3; renderStep();">Volgende</button>`;
    } else if (currentStep === 3) {
        container.innerHTML = `<h3>Jouw niveau?</h3><button class="button" onclick="userData.level='beginner'; currentStep=4; renderStep();">Beginner</button><button class="button" style="margin-top:10px" onclick="userData.level='advanced'; currentStep=4; renderStep();">Gevorderd</button>`;
    } else if (currentStep === 4) {
        container.innerHTML = `<h3>Focus gebied?</h3><button class="button" onclick="userData.goal='legs'; finalize();">Benen</button><button class="button" style="margin-top:10px" onclick="userData.goal='chest'; finalize();">Borst</button>`;
    }
}

function finalize() { 
    localStorage.setItem("fitnessProFinal", JSON.stringify(userData)); 
    speak("Profiel opgeslagen. Laten we beginnen!");
    showHome(); 
}

function showHome() {
    hideAll();
    document.getElementById("home").classList.remove("hidden");
    document.getElementById("mainNav").style.display = "flex";
    repsPerSet = userData.level === 'beginner' ? 8 : 12;
    const goalTitle = userData.goal === 'legs' ? "Squats" : "Push-ups";
    document.getElementById("startActionCard").innerHTML = `
        <h3 style="margin:0">Klaar voor actie?</h3>
        <p style="font-size:20px; color:var(--primary)"><b>${maxSets} x ${repsPerSet} ${goalTitle}</b></p>
        <button class="button" onclick="startWorkout()">START TRAINING</button>
        <button class="button outline-btn" onclick="toggleGoal()">Wissel naar ${userData.goal==='legs'?'Borst':'Benen'}</button>
    `;
    updateChart();
    checkBadges();
}

// --- WORKOUT LOGICA ---
async function startWorkout() {
    hideAll(); 
    document.getElementById("mainNav").style.display = "none";
    document.getElementById("workoutScreen").classList.remove("hidden");
    reps = 0; currentSet = 1;
    
    speak("Maak je klaar. De camera start op.");

    document.getElementById("set-display").innerText = `1/${maxSets}`;
    document.getElementById("rep-display").innerText = `0/${repsPerSet}`;
    
    model = await tmPose.load(LINKS[userData.goal] + "model.json", LINKS[userData.goal] + "metadata.json");
    webcam = new tmPose.Webcam(300, 300, true); 
    await webcam.setup(); 
    await webcam.play();
    
    ctx = document.getElementById("canvas").getContext("2d");
    speak("Begin maar!");
    loop();
}

async function loop() {
    webcam.update();
    if (!isResting) {
        const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
        const prediction = await model.predict(posenetOutput);
        
        if (prediction[1].probability > 0.85) status = "down";
        
        if (prediction[0].probability > 0.85 && status === "down") {
            status = "up"; 
            reps++;
            document.getElementById("rep-display").innerText = `${reps}/${repsPerSet}`;
            speak(reps.toString()); // De AI telt hardop

            if (reps >= repsPerSet) handleSetCompletion();
        }
    }
    ctx.drawImage(webcam.canvas, 0, 0);
    animationId = window.requestAnimationFrame(loop);
}

function handleSetCompletion() {
    saveToHistory(reps);
    if (currentSet >= maxSets) {
        speak("Geweldig gedaan! Workout voltooid."); 
        setTimeout(() => { stopWorkout(); }, 2000);
    } else {
        isResting = true;
        speak("Goed zo. Neem dertig seconden rust.");
        document.getElementById("rest-overlay").style.display = "flex";
        let t = 30;
        let timer = setInterval(() => {
            t--; 
            document.getElementById("rest-timer").innerText = t;
            if(t <= 0){ 
                clearInterval(timer); 
                isResting = false; 
                document.getElementById("rest-overlay").style.display = "none"; 
                reps = 0;
                currentSet++;
                speak("Rust voorbij. Volgende set!");
                document.getElementById("set-display").innerText = `${currentSet}/${maxSets}`; 
                document.getElementById("rep-display").innerText = `0/${repsPerSet}`;
            }
        }, 1000);
    }
}

// --- DATA & HELPER FUNCTIES ---
function saveToHistory(amount) {
    const history = JSON.parse(localStorage.getItem("repHistory") || "{}");
    const todayStr = new Date().toISOString().split('T')[0];
    history[todayStr] = (history[todayStr] || 0) + amount;
    localStorage.setItem("repHistory", JSON.stringify(history));
}

function checkBadges() {
    const history = JSON.parse(localStorage.getItem("repHistory") || "{}");
    let totalReps = 0;
    for (let date in history) { totalReps += history[date]; }
    
    if (totalReps >= 100 && !localStorage.getItem("badge_100")) {
        speak("Gefeliciteerd! Je hebt de bronzen badge verdiend voor honderd herhalingen!");
        localStorage.setItem("badge_100", "true");
    }
}

function updateChart() {
    const history = JSON.parse(localStorage.getItem("repHistory") || "{}");
    const days = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];
    const today = new Date();
    let html = "";
    days.forEach((day, index) => {
        const d = new Date(today);
        const dayOfWeek = d.getDay();
        const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) + index;
        d.setDate(diff);
        const dateStr = d.toISOString().split('T')[0];
        const count = history[dateStr] || 0;
        const h = Math.min(count, 80);
        html += `<div class="bar-wrapper"><div class="bar" style="height: ${h}px"></div><span class="bar-label">${day}</span></div>`;
    });
    document.getElementById("weekChart").innerHTML = html;
}

function hideAll() {
    ["onboarding", "home", "workoutScreen", "profile"].forEach(id => {
        document.getElementById(id).classList.add("hidden");
    });
}

function switchTab(tab) {
    hideAll();
    document.getElementById(tab).classList.remove("hidden");
    document.querySelectorAll(".nav-item").forEach(i => i.classList.remove('active'));
    document.getElementById('n-'+tab).classList.add('active');
    if(tab==='profile') loadProfileInputs();
}

function stopWorkout() { 
    if(webcam) webcam.stop(); 
    cancelAnimationFrame(animationId);
    showHome(); 
}
