<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>SmartFitness Pro ⚡</title>
    
    <script src="https://cdn.jsdelivr.net/npm/@mediapipe/pose"></script>
    <script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils"></script>
    <script src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils"></script>

    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;900&family=Inter:wght@300;400;700&display=swap" rel="stylesheet">
    
    <link rel="stylesheet" href="css/style.css">
</head>
<body>

<div class="app-container">

    <div id="onboardingScreen" class="screen active">
        <div class="header-onboarding">WELKOM BIJ SMARTFITNESS ⚡</div>
        <div class="card onboarding-card">
            <h2 id="onboardingQuestion">Hoe heet je?</h2>
            <input type="text" id="onboardingInput" placeholder="Typ hier je naam...">
            <button class="button primary-btn" onclick="nextOnboardingStep()">VOLGENDE</button>
        </div>
        <div class="step-indicator"><span id="currentOnboardingStep">1</span>/5</div>
    </div>

    <div id="homeScreen" class="screen hidden">
        <div class="top-bar">
            <div class="profile-summary">
                <div class="profile-avatar">👤</div>
                <div>
                    <span class="greeting">Welkom terug,</span>
                    <div id="displayUserName" class="user-name-text">KAMPIOEN</div>
                </div>
            </div>
            <button class="settings-btn">⚙️</button>
        </div>

        <div class="stats-overview">
            <div class="stat-item">
                <div class="stat-value">🔥 <span id="displayCalories">0</span></div>
                <div class="stat-label">KCAL VERBRAND</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">⏱️ <span id="displayDuration">0</span></div>
                <div class="stat-label">MINUTEN</div>
            </div>
        </div>

        <div class="section-title">JOUW TRAININGEN</div>
        <div class="workout-plan-card" onclick="startWorkout('squat')">
            <img src="https://via.placeholder.com/100x80?text=SQUAT" alt="Squat afbeelding" class="workout-img">
            <div class="workout-details">
                <h3>BENEN & BILLEN</h3>
                <p>Squats | 3 Sets | 12 Herhalingen</p>
            </div>
            <div class="play-icon">▶</div>
        </div>
        <div class="workout-plan-card" onclick="startWorkout('pushup')">
            <img src="https://via.placeholder.com/100x80?text=PUSHUP" alt="Pushup afbeelding" class="workout-img">
            <div class="workout-details">
                <h3>BORST & ARMEN</h3>
                <p>Push-ups | 3 Sets | 10 Herhalingen</p>
            </div>
            <div class="play-icon">▶</div>
        </div>
    </div>

    <div id="workoutScreen" class="screen hidden">
        <div class="workout-header">
            <div class="workout-mode" id="workoutModeDisplay">SQUATS</div>
            <div class="rep-counter" id="repCountDisplay">0</div>
        </div>
        <div class="camera-feedback-area">
            <video id="input_video" style="display:none"></video>
            <canvas id="output_canvas"></canvas>
            <div id="aiFeedbackMessage" class="ai-feedback">Zoek positie...</div>
        </div>
        <button class="button stop-workout-btn" onclick="stopWorkout()">TRAINING STOPPEN</button>
    </div>

    <div id="profileScreen" class="screen hidden">
        <div class="header">JOUW PROFIEL</div>
        <div class="card profile-card">
            <h3>Naam: <span id="profileName"></span></h3>
            <h3>Leeftijd: <span id="profileAge"></span></h3>
            <h3>Doel: <span id="profileGoal"></span></h3>
            <h3>Gewicht: <span id="profileWeight"></span> kg</h3>
            <button class="button reset-btn" onclick="resetApp()">RESET APP</button>
        </div>
    </div>

</div>

<nav id="bottomNavBar" class="bottom-nav hidden">
    <div class="nav-item active" onclick="showScreen('homeScreen')">🏠<br>Home</div>
    <div class="nav-item" onclick="showScreen('profileScreen')">👤<br>Profiel</div>
    <div class="nav-item" onclick="alert('Jouw badges komen hier!')">🏆<br>Badges</div>
</nav>

<script src="js/app.js"></script>
</body>
</html>
