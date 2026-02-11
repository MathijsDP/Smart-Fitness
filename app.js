const LINKS = { legs: "https://teachablemachine.withgoogle.com/models/Nv8j7aUsi/", chest: "https://teachablemachine.withgoogle.com/models/VyHCtMsZf/" };
let userData = {};
let currentStep = 1;
let model, webcam, ctx, animationId;
let reps = 0, currentSet = 1, maxSets = 3, repsPerSet = 12, status = "up", isResting = false;

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

function finalize() { localStorage.setItem("fitnessProFinal", JSON.stringify(userData)); showHome(); }

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
}

function toggleGoal() {
    userData.goal = userData.goal === 'legs' ? 'chest' : 'legs';
    finalize();
}

function switchTab(tab) {
    hideAll();
    document.getElementById(tab).classList.remove("hidden");
    document.querySelectorAll(".nav-item").forEach(i => i.classList.remove('active'));
    document.getElementById('n-'+tab).classList.add('active');
    if(tab==='profile') loadProfileInputs();
}

function loadProfileInputs() {
    document.getElementById('p-age').value = userData.age;
    document.getElementById('p-height').value = userData.height;
    document.getElementById('p-level').value = userData.level;
    document.getElementById('p-goal').value = userData.goal;
}

function saveProfile() {
    userData.age = document.getElementById('p-age').value;
    userData.height = document.getElementById('p-height').value;
    userData.level = document.getElementById('p-level').value;
    userData.goal = document.getElementById('p-goal').value;
    finalize();
    alert("Profiel bijgewerkt!");
    switchTab('home');
}

function hideAll() {
    ["onboarding", "home", "workoutScreen", "profile"].forEach(id => document.getElementById(id).classList.add("hidden"));
}

async function startWorkout() {
    hideAll(); document.getElementById("mainNav").style.display = "none";
    document.getElementById("workoutScreen").classList.remove("hidden");
    reps = 0; currentSet = 1;
    document.getElementById("set-display").innerText = `1/3`;
    document.getElementById("rep-display").innerText = `0/${repsPerSet}`;
    model = await tmPose.load(LINKS[userData.goal] + "model.json", LINKS[userData.goal] + "metadata.json");
    webcam = new tmPose.Webcam(300, 300, true); await webcam.setup(); await webcam.play();
    ctx = document.getElementById("canvas").getContext("2d");
    loop();
}

async function loop() {
    webcam.update();
    if (!isResting) {
        const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
        const prediction = await model.predict(posenetOutput);
        if (prediction[1].probability > 0.85) status = "down";
        if (prediction[0].probability > 0.85 && status === "down") {
            status = "up"; reps++;
            document.getElementById("rep-display").innerText = `${reps}/${repsPerSet}`;
            if (reps >= repsPerSet) handleSetCompletion();
        }
    }
    ctx.drawImage(webcam.canvas, 0, 0);
    animationId = window.requestAnimationFrame(loop);
}

function handleSetCompletion() {
    saveToHistory(reps);
    if (currentSet >= maxSets) {
        alert("Top prestatie! Workout voltooid."); stopWorkout();
    } else {
        isResting = true;
        document.getElementById("rest-overlay").style.display = "flex";
        let t = 30;
        let timer = setInterval(() => {
            t--; document.getElementById("rest-timer").innerText = t;
            if(t<=0){ 
                clearInterval(timer); isResting=false; 
                document.getElementById("rest-overlay").style.display="none"; 
                reps = 0;
                currentSet++;
                document.getElementById("set-display").innerText=`${currentSet}/3`; 
                document.getElementById("rep-display").innerText=`0/${repsPerSet}`;
            }
        }, 1000);
    }
}

function saveToHistory(amount) {
    const history = JSON.parse(localStorage.getItem("repHistory") || "{}");
    const todayStr = new Date().toISOString().split('T')[0];
    history[todayStr] = (history[todayStr] || 0) + amount;
    localStorage.setItem("repHistory", JSON.stringify(history));
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

function stopWorkout() { if(webcam) webcam.stop(); location.reload(); }
