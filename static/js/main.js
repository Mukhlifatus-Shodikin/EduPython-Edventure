let character = document.getElementById("character");
let currentX = 0;
let currentY = 0;
const stepSize = 80;
let score = 0;
const occupied = new Set();
occupied.add("0,0");
let startTime = null;
let isPaused = false;
let pauseStart = null;
let activeHole = null;
let selectedDifficulty = null;
let allQuestions = [];
let questions = [];
let holes = [];
let currentQuestionIndex = 0;
const savedLevel = localStorage.getItem("selectedDifficulty");
if (!localStorage.getItem("username")) {
  let guestNumber = Math.floor(Math.random() * 100000);
  localStorage.setItem("username", "guest" + guestNumber);
  localStorage.setItem("mode", "guest");
}
let firewallCooldown = false;
let gamePausedByPuzzle = false;
let firewallTriggeredCount = 0;
const maxFirewallTriggersBase = 3;
const puzzleCorrectOrder = [...Array(9).keys()];
let puzzleCurrentOrder = [...puzzleCorrectOrder];

let introLines = [];
let introIndex = 0;

const allIntroLines = {
  beginner: [
    {
      speaker: "AI Mentor",
      side: "left",
      avatar: "/static/images/AI_Mentor.png",
      text: "Selamat datang di Data Valley, Python! Di sini kamu akan mempelajari dasar-dasar pemrograman."
    },
    {
      speaker: "AI Mentor",
      side: "left",
      avatar: "/static/images/AI_Mentor.png",
      text: "Fokuskan pada variabel, tipe data, dan fungsi sederhana seperti print()."
    },
    {
      speaker: "Python",
      side: "right",
      avatar: "/static/images/Python_Avatar.png",
      text: "Aku siap belajar dan membuktikan kemampuanku!"
    },
    {
      speaker: "BUG",
      side: "left",
      avatar: "/static/images/BUG.png",
      text: "Hahaha! Pemula sepertimu tak akan bisa menulis kode yang benar!"
    },
    {
      speaker: "AI Mentor",
      side: "left",
      avatar: "/static/images/AI_Mentor.png",
      text: "Setiap kamu menemukan lubang, kamu akan menghadapi soal coding. Jawablah dengan benar untuk melanjutkan."
    },
    {
      speaker: "Python",
      side: "right",
      avatar: "/static/images/Python_Avatar.png",
      text: "Terima kasih, AI Mentor. Aku akan menaklukkan level ini!"
    }
  ],
  intermediate: [
    {
      speaker: "AI Mentor",
      side: "left",
      avatar: "/static/images/AI_Mentor.png",
      text: "Kamu telah tiba di Logic Mountain, Python. Di sini logika adalah segalanya."
    },
    {
      speaker: "AI Mentor",
      side: "left",
      avatar: "/static/images/AI_Mentor.png",
      text: "Gunakan percabangan (if), perulangan (for/while), dan fungsi buatan sendiri untuk menyelesaikan soal."
    },
    {
      speaker: "BUG",
      side: "left",
      avatar: "/static/images/BUG.png",
      text: "Logika? Aku akan memanipulasi alurmu dengan kondisi palsu dan perulangan tak terbatas!"
    },
    {
      speaker: "Python",
      side: "right",
      avatar: "/static/images/Python_Avatar.png",
      text: "Aku sudah belajar cukup untuk menghadapi tantangan logika. Bawa ke sini!"
    },
    {
      speaker: "AI Mentor",
      side: "left",
      avatar: "/static/images/AI_Mentor.png",
      text: "Ingat, setiap lubang bisa menjadi jebakan logika. Jawab soal dengan cermat."
    },
    {
      speaker: "AI Mentor",
      side: "left",
      avatar: "/static/images/AI_Mentor.png",
      text: "Gunakan hint jika kamu kesulitan — tapi jumlahnya terbatas!"
    }
  ],
  advanced: [
    {
      speaker: "BUG",
      side: "left",
      avatar: "/static/images/BUG.png",
      text: "Selamat datang di Algorithm Forest. Tapi sayangnya... ini adalah akhir dari perjalananmu!"
    },
    {
      speaker: "AI Mentor",
      side: "left",
      avatar: "/static/images/AI_Mentor.png",
      text: "Level ini akan menguji semua yang telah kamu pelajari. Kamu akan butuh pemahaman mendalam tentang struktur data dan algoritma."
    },
    {
      speaker: "AI Mentor",
      side: "left",
      avatar: "/static/images/AI_Mentor.png",
      text: "Rekursi, sorting, loop bersarang... semua akan muncul di sini."
    },
    {
      speaker: "Python",
      side: "right",
      avatar: "/static/images/Python_Avatar.png",
      text: "Aku tidak akan menyerah. Aku akan menyelesaikan misi ini sampai akhir!"
    },
    {
      speaker: "BUG",
      side: "left",
      avatar: "/static/images/BUG.png",
      text: "Aku akan menyembunyikan bug di logika paling dalammu. Selamat mencoba!"
    },
    {
      speaker: "AI Mentor",
      side: "left",
      avatar: "/static/images/AI_Mentor.png",
      text: "Tetap fokus. Kamu bisa meminta bantuan jika benar-benar terdesak. Gunakan setiap langkah dengan bijak."
    }
  ]
};

async function runCode() {
  const editor = document.getElementById("code-editor");
  if (!editor) {
    alert("Editor tidak ditemukan!");
    return;
  }

  let code = editor.value;
  if (typeof code !== "string") {
    alert("Isi editor tidak valid.");
    return;
  }

  let commands = code
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (activeHole) {
    const userCode = normalize(code);
    const answer = activeHole.answer;

    let isCorrect = false;

    if (Array.isArray(answer)) {
      isCorrect = answer.some(ans => userCode.includes(normalize(ans)));
    } else if (typeof answer === "string") {
      isCorrect = userCode.includes(normalize(answer));
    }

    if (isCorrect) {
      activeHole.solved = true;
      const holeEl = document.getElementById(activeHole.id);
      if (holeEl) {
        holeEl.remove();
        closeHole();
      }

      score += 10;
      updateHUD();
      activeHole = null;
      localStorage.removeItem("activeHoleId");
      checkGameCompletion();
      document.querySelector(".instruction").innerText = "Ketik perintah \n move.up(x) \n move.down(x) \n move.left(x) \n move.right(x) \n x adalah jumlah langkah yang ingin diambil \n Contoh: move.up(5) \n Setelah itu tekan tombol RUN \n atau bisa juga tanpa memasukkan x hanya kosongkan ()";
      document.getElementById("code-editor").value = "";
    } else {
      alert("Wrong answer! Try again.");
    }
    return; // stop di sini, tidak lanjut jalankan pergerakan
  }

  for (let cmd of commands) {
    const match = cmd.match(/^(move.(right|left|up|down))\((\d*)\)$/);
    if (match) {
      const direction = match[2];
      const steps = match[3] === "" ? 1 : parseInt(match[3]);
      for (let i = 0; i < steps; i++) {
        await moveCharacter(direction);
        let hole = checkHole();
        if (hole) {
          showQuestion(hole);
          return; // hentikan setelah soal muncul
        }
        checkHintPickup();
      }
    } else {
      alert("Invalid command: " + cmd);
      break;
    }
  }
}

function normalize(input) {
  if (typeof input !== "string") return "";
  return input.toLowerCase().replace(/\s+/g, " ").trim();
}

function isInRiver(x) {
  return x >= 380 && x <= 490;
}
const bridgeTiles = new Set([
  '320,240',
  '400,240',
  '480,240',
  '560,240',
  '640,240',
]);

function isBridge(x, y) {
  return bridgeTiles.has(`${x},${y}`);
}
const boulderTiles = new Set([
  '640,0', '0,480',
  '720,0', '0,400',
  '800,0', '160,480',
  '640,80', '80,480',
  '720,80', '80,400',
  '800,80', '80,320',
]);

function isBoulder(x, y) {
  return boulderTiles.has(`${x},${y}`);
}

const obstacles = []; // akan diisi dinamis

function generateRandomObstacles(count) {
  obstacles.length = 0;

  while (obstacles.length < count) {
    const x = Math.floor(Math.random() * 10) * 80;
    const y = Math.floor(Math.random() * 6) * 80;
    const key = `${x},${y}`;

    if (savedLevel === 'beginner') {
      if (!occupied.has(key) && !isInRiver(x) && !isBridge(x, y)) {
        occupied.add(key);
        obstacles.push({ x, y });
      }
    } else if (savedLevel === 'intermediate') {
      if (!occupied.has(key) && !isBoulder(x, y)) {
        occupied.add(key);
        obstacles.push({ x, y });
      }
    } else {
      if (!occupied.has(key)) {
        occupied.add(key);
        obstacles.push({ x, y });
      }
    }
  }
}

function isBlocked(x, y) {
  return obstacles.some((obs) => obs.x === x && obs.y === y);
}

function checkHole() {
  return holes.find(
    (hole) => !hole.solved && currentX === hole.x && currentY === hole.y
  );
}

function isOutOfBounds(x, y) {
  return x < 0 || x > 800 || y < 0 || y > 480;
}

function moveCharacter(direction) {
  return new Promise((resolve) => {
    let newX = currentX;
    let newY = currentY;

    character.classList.remove(
      "walk-up",
      "walk-down",
      "walk-left",
      "walk-right",
      "idle-up",
      "idle-down",
      "idle-left",
      "idle-right"
    );

    if (direction === "right") {
      newX += stepSize;
      character.classList.add("walk-right");
    } else if (direction === "left") {
      newX -= stepSize;
      character.classList.add("walk-left");
    } else if (direction === "up") {
      newY -= stepSize;
      character.classList.add("walk-up");
    } else if (direction === "down") {
      newY += stepSize;
      character.classList.add("walk-down");
    }

    if (isOutOfBounds(newX, newY)) {
      return resolve();
    }

    if (isBlocked(newX, newY)) {
      return resolve();
    }

    if (savedLevel === 'beginner') {
      if (isInRiver(newX) && !isBridge(newX, newY)) {
        return resolve();
      }
    } else if (savedLevel === 'intermediate') {
      if (isBoulder(newX, newY)) {
        return resolve();
      }
    }

    currentX = newX;
    currentY = newY;
    character.style.left = currentX + "px";
    character.style.top = currentY + "px";

    setTimeout(() => {
      character.classList.remove(
        "walk-up",
        "walk-down",
        "walk-left",
        "walk-right"
      );
      character.classList.add(`idle-${direction}`);
      resolve();
    }, 800);
  });
}

function generateRandomHoles(count) {
  holes.length = 0; // hindari tempat start

  while (holes.length < count) {
    const x = Math.floor(Math.random() * 10) * 80;
    const y = Math.floor(Math.random() * 6) * 80;
    const key = `${x},${y}`;

    if (savedLevel === 'beginner') {
      if (!occupied.has(key) && !isInRiver(x) && !isBridge(x, y)) {
        occupied.add(key);
        holes.push({
          id: `hole-${holes.length}`,
          x,
          y,
          solved: false,
        });
      }
    } else if (savedLevel === 'intermediate') {
      if (!occupied.has(key) && !isBoulder(x, y)) {
        occupied.add(key);
        holes.push({
          id: `hole-${holes.length}`,
          x,
          y,
          solved: false,
        });
      }
    } else {
      if (!occupied.has(key)) {
        occupied.add(key);
        holes.push({
          id: `hole-${holes.length}`,
          x,
          y,
          solved: false,
        });
      }
    }
  }
}

function showQuestion(hole) {

  if (hole.solved) return;

  const q = getRandomQuestion();
  if (!q) {
    alert("Tidak ada soal tersedia.");
    return;
  }
  hole.question = q.question;
  hole.answer = q.answer;

  localStorage.setItem("holes", JSON.stringify(holes));

  activeHole = hole;
  triggerVirusIfOnHole();
  localStorage.setItem("activeHoleId", hole.id);
  document.querySelector(".instruction").innerText = "\n\n" + hole.question;
  document.getElementById("code-editor").value = "";
  saveGameState();
}

function closeHole() {
  for (let hole of holes) {
    if (Math.abs(currentX - hole.x) < 20 && Math.abs(currentY - hole.y) < 20) {
      hole.solved = true;
    }
  }
}

function resetCode() {
  document.getElementById("code-editor").value = "";
}

let totalTime = 600; // 3 menit
let timerInterval;

function startTimer() {
  let savedStart = localStorage.getItem("startTime");
  let savedPaused = localStorage.getItem("isPaused");
  let savedPauseStart = localStorage.getItem("pauseStart");

  // Validasi nilai
  if (!savedStart || isNaN(parseInt(savedStart))) {
    startTime = Date.now();
    localStorage.setItem("startTime", startTime);
  } else {
    startTime = parseInt(savedStart);
  }

  // Jika sedang pause saat load
  if (savedPaused === "true" && savedPauseStart) {
    isPaused = true;
    pauseStart = parseInt(savedPauseStart);
    document.querySelector(".pause-btn").style.display = "none";
    document.querySelector(".resume-btn").style.display = "inline-block";
  }

  // Timer update
  function updateTimer() {
    if (isPaused) return;

    const now = Date.now();
    const elapsed = Math.floor((now - startTime) / 1000);
    const timeLeft = totalTime - elapsed;

    if (isNaN(timeLeft) || timeLeft > totalTime || timeLeft < 0) {
      clearInterval(timerInterval);
      gameOverTime();
      return;
    }

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      gameOverTime();
    } else {
      updateTimerDisplay(timeLeft);
    }
  }

  updateTimer();
  timerInterval = setInterval(updateTimer, 1000);
}

function updateTimerDisplay(timeLeft) {
  const progressDeg = 360 - (timeLeft / totalTime) * 360;

  document.getElementById("timer-value").innerText = timeLeft;

  const progressCircle = document.querySelector(".progress-circle");
  progressCircle.style.background = `
    conic-gradient(
      ${timeLeft <= 30 ? "#ff0000" : "#eee"} ${progressDeg}deg,
      #eeeeee00 ${progressDeg}deg
    )
  `;
}

function gameOverTime() {
  // Hitung persentase berdasarkan skor maksimal
  const maxScore = holes.length * 10; // 10 poin per soal
  const percentage = Math.floor((score / maxScore) * 100);

  document.getElementById("final-score").innerText = percentage;
  document.getElementById("gameOverPopup").style.display = "block";
}

function exitGame() {
  localStorage.removeItem("startTime");
  localStorage.removeItem("isPaused");
  localStorage.removeItem("pauseStart");
  localStorage.removeItem("score");
  localStorage.removeItem("userHints");
  localStorage.removeItem("holes");
  localStorage.removeItem("playerX");
  localStorage.removeItem("playerY");
  localStorage.removeItem("obstacles");
  localStorage.removeItem("skipDifficulty");
  localStorage.removeItem("answeredIds");
  localStorage.removeItem("shuffledPool");
  window.location.href = "/";
}

function exitGameplay() {
  window.location.href = "/";
}

function retryGame() {
  localStorage.removeItem("startTime");
  localStorage.removeItem("isPaused");
  localStorage.removeItem("pauseStart");
  localStorage.removeItem("score");
  localStorage.removeItem("userHints");
  localStorage.removeItem("holes");
  localStorage.removeItem("playerX");
  localStorage.removeItem("playerY");
  localStorage.removeItem("obstacles");
  localStorage.removeItem("skipDifficulty");
  localStorage.removeItem("answeredIds");
  localStorage.removeItem("shuffledPool");
  window.location.reload();
}

function renderObstacles() {
  const map = document.querySelector(".map-container");
  const obstacleImage = localStorage.getItem("obstacleImage") || "/static/images/tree.png";

  obstacles.forEach(obs => {
    const img = document.createElement("img");
    Object.assign(img, {
      src: obstacleImage,
      className: "obstacle"
    });
    Object.assign(img.style, {
      left: `${obs.x}px`,
      top: `${obs.y}px`
    });
    map.appendChild(img);
  });
}

function renderBridge() {
  const map = document.querySelector(".map-container");
  const img = document.createElement("img");
  img.src = "/static/images/bridge.png";
  img.className = "bridge";
  img.style.left = "380px";
  img.style.top = "230px";
  map.appendChild(img);
}

function renderHoles() {
  const map = document.querySelector(".map-container");
  for (let hole of holes) {
    const img = document.createElement("img");
    img.src = "/static/images/hole.png";
    img.className = "hole";
    img.id = hole.id;
    img.style.left = hole.x + "px";
    img.style.top = hole.y + "px";
    map.appendChild(img);
  }
}

function updateHUD() {
  document.getElementById("score").innerText = "Score: " + score;
  saveGameState();
}

function pauseGame() {
  isPaused = true;
  pauseStart = Date.now();

  localStorage.setItem("isPaused", "true");
  localStorage.setItem("pauseStart", pauseStart);
  document.querySelector(".pause-btn").style.display = "none";
  document.querySelector(".resume-btn").style.display = "inline-block";

  document.getElementById("pause-menu").style.display = "block"; // tampilkan menu pause
}

function resumeGame() {
  isPaused = false;

  const pauseDuration = Date.now() - pauseStart;
  startTime += pauseDuration;

  localStorage.setItem("startTime", startTime);
  localStorage.setItem("isPaused", "false");
  localStorage.removeItem("pauseStart");

  pauseStart = null;
  document.querySelector(".resume-btn").style.display = "none";
  document.querySelector(".pause-btn").style.display = "inline-block";
  document.getElementById("pause-menu").style.display = "none";
}

function selectDifficulty(level) {
  if (localStorage.getItem("skipDifficulty") === null) {
    localStorage.setItem("skipDifficulty", "true");
  }
  selectedDifficulty = level;

  if (selectedDifficulty === 'beginner') {
    document.querySelector('.map-container').style.backgroundImage = "url('/static/images/Data-Valley.png')";
    localStorage.setItem("obstacleImage", "/static/images/tree.png");
    localStorage.setItem("currentLevel", "1");
    renderBridge();
  } else if (selectedDifficulty === 'intermediate') {
    document.querySelector('.map-container').style.backgroundImage = "url('/static/images/Logic-Mountain.png')";
    document.querySelector('.map-container').style.backgroundSize = "cover";
    localStorage.setItem("obstacleImage", "/static/images/rock.png");
    localStorage.setItem("currentLevel", "2");
  } else {
    document.querySelector('.map-container').style.backgroundImage = "url('/static/images/Algorithm-forrest.png')";
    localStorage.setItem("obstacleImage", "/static/images/bush.png");
    localStorage.setItem("currentLevel", "3");
  }

  fetch("/static/questions/questions.json")
    .then((response) => response.json())
    .then((data) => {
      allQuestions = data;
      questions = allQuestions.filter((q) => q.level === level);

      // Kosongkan dan set posisi awal yang dipakai
      occupied.clear();
      occupied.add("0,0");
      occupied.add("80,0");
      occupied.add("0,80");

      // Hindari overwrite jika sudah ada state tersimpan
      const holesStored = localStorage.getItem("holes");
      const obstaclesStored = localStorage.getItem("obstacles");
      if (!holesStored || !obstaclesStored) {
        generateRandomObstacles(8);
        localStorage.setItem("obstacles", JSON.stringify(obstacles));
        renderObstacles();
        generateRandomHoles(10);
        holes.forEach(hole => {
          if (!hole.solved) {
            const map = document.querySelector(".map-container");
            const img = document.createElement("img");
            Object.assign(img, {
              src: "/static/images/hole.png",
              className: "hole",
              id: hole.id
            });
            Object.assign(img.style, {
              left: `${hole.x}px`,
              top: `${hole.y}px`
            });
            map.appendChild(img);
          }
        });
      } else {
        try {
          const parsedObs = JSON.parse(obstaclesStored);
          if (Array.isArray(parsedObs)) {
            obstacles.length = 0;
            obstacles.push(...parsedObs);
            for (const obs of obstacles) {
              occupied.add(`${obs.x},${obs.y}`);
            }
          }
        } catch (e) {
          console.warn("Failed to load obstacles.");
        }
        renderObstacles();
        holes.forEach(hole => {
          if (!hole.solved) {
            const map = document.querySelector(".map-container");
            const img = document.createElement("img");
            Object.assign(img, {
              src: "/static/images/hole.png",
              className: "hole",
              id: hole.id
            });
            Object.assign(img.style, {
              left: `${hole.x}px`,
              top: `${hole.y}px`
            });
            map.appendChild(img);
          }
        });
      }


      updateHUD();
      updateHintHUD();
      startHintSpawner();

      const isPausedSaved = localStorage.getItem("isPaused");
      const savedPauseStart = localStorage.getItem("pauseStart");
      if (isPausedSaved === "true" && savedPauseStart) {
        isPaused = true;
        pauseStart = parseInt(savedPauseStart);
        document.querySelector(".pause-btn").style.display = "none";
        document.querySelector(".resume-btn").style.display = "inline-block";
      }

      startTimer();
      document.querySelector(".instruction").innerText = "Ketik perintah \n move.up(x) \n move.down(x) \n move.left(x) \n move.right(x) \n x adalah jumlah langkah yang ingin diambil \n Contoh: move.up(5) \n Setelah itu tekan tombol RUN \n atau bisa juga tanpa memasukkan x hanya kosongkan ()";
    });
}

function getRandomQuestion() {
  let pool = JSON.parse(localStorage.getItem("shuffledPool"));
  const storedAnswered = new Set(JSON.parse(localStorage.getItem("answeredIds") || "[]"));

  if (!Array.isArray(pool) || pool.length === 0) {
    const available = questions.filter(q => !storedAnswered.has(q.id));
    if (available.length === 0) return null;

    // Algoritma Knuth Shuffle
    for (let i = available.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [available[i], available[j]] = [available[j], available[i]];
    }

    pool = available.map(q => q.id);
    localStorage.setItem("shuffledPool", JSON.stringify(pool));
  }

  const nextId = pool.pop();
  localStorage.setItem("shuffledPool", JSON.stringify(pool));

  const next = questions.find(q => q.id === nextId);
  if (!next) return getRandomQuestion();

  storedAnswered.add(next.id);
  localStorage.setItem("answeredIds", JSON.stringify(Array.from(storedAnswered)));

  return next;
}

function submitLogin() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) {
    alert("Masukkan username dan password.");
    return;
  }

  fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  })
    .then(res => res.json())
    .then(data => {
      if (data.status === "success") {
        localStorage.setItem("username", username);
        localStorage.setItem("mode", "user");
        document.getElementById("login-popup").style.display = "none";

        updateAuthUI();
      } else {
        alert("Login gagal: " + data.message);
      }
    });
}

function logout() {
  localStorage.removeItem("username");
  localStorage.removeItem("mode");
  window.location.href = "/";
}

function submitScore(score) {
  const username = localStorage.getItem("username");
  const mode = localStorage.getItem("mode");

  if (!username || mode === "guest") {
    localStorage.setItem("pending_score", score);
    const newUsername = prompt("Masukkan username untuk daftar akun baru:");
    const password = prompt("Masukkan password:");
    if (newUsername && password) {
      upgradeAccount({ username: newUsername, password });
    }
    return;
  }

  fetch("/api/save_score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, score })
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.status === "success") {
        console.log("Skor berhasil disimpan!");
      }
    });
}


function toggleLeaderboard() {
  const panel = document.getElementById("leaderboard-panel");
  panel.classList.toggle("open");

  // Load leaderboard saat dibuka pertama kali
  if (panel.classList.contains("open")) {
    loadLeaderboard();
  }
}

function loadLeaderboard() {
  fetch("/api/leaderboard")
    .then((res) => res.json())
    .then((data) => {
      const board = document.getElementById("leaderboard");
      board.innerHTML =
        "<h3>🏆 Leaderboard</h3><ol>" +
        data
          .map((user) => `<li>${user.username}: ${user.score}</li>`)
          .join("") +
        "</ol>";
    });
}

window.addEventListener("load", () => {
  loadGameState();
  startFirewallScheduler();
  const pathname = window.location.pathname;
  const mode = localStorage.getItem("mode");
  const username = localStorage.getItem("username");

  function startGameIntro() {
    const level = localStorage.getItem("selectedDifficulty") || "beginner";
    introIndex = 0;
    introLines = allIntroLines[level] || allIntroLines["beginner"];

    const bg = document.querySelector(".intro-bg");
    if (level === "beginner") {
      bg.style.backgroundImage = "url('/static/images/Frame\ 2.png')";
    } else if (level === "intermediate") {
      bg.style.backgroundImage = "url('/static/images/Frame\ 3.png')";
    } else if (level === "advanced") {
      bg.style.backgroundImage = "url('/static/images/Frame.png')";
    }

    document.getElementById("dialogue-box").innerHTML = "";
    document.getElementById("intro-popup").style.display = "flex";
    playNextIntroLine();
  }

  if (window.location.pathname.includes("/play") && !localStorage.getItem("introSeen")) {
    setTimeout(() => {
      startGameIntro();
      localStorage.setItem("introSeen", "true");
    }, 400);
  }

  updateAuthUI();
  if (document.getElementById("login-popup")) {
    document.getElementById("login-popup").style.display = "none";
  }

  if (document.getElementById("leaderboard")) loadLeaderboard();

  if (pathname.includes("/play")) {
    const savedLevel = localStorage.getItem("selectedDifficulty");
    const urlParams = new URLSearchParams(window.location.search);
    const playMode = urlParams.get("mode");

    if (!playMode || !["new", "load"].includes(playMode)) {
      window.location.href = "/";
      return;
    }

    const afterGameLoaded = () => {

      renderObstacles();

      if (Array.isArray(holes)) {
        holes.forEach(hole => {
          if (!hole.solved && !document.getElementById(hole.id)) {
            const map = document.querySelector(".map-container");
            const img = document.createElement("img");
            Object.assign(img, {
              src: "/static/images/hole.png",
              className: "hole",
              id: hole.id
            });
            Object.assign(img.style, {
              left: `${hole.x}px`,
              top: `${hole.y}px`
            });
            map.appendChild(img);
          }
        });
      }

      updateHUD();
      updateHintHUD();
      startHintSpawner();

      if (savedLevel === "beginner") renderBridge();

      const isPausedSaved = localStorage.getItem("isPaused");
      const savedPauseStart = localStorage.getItem("pauseStart");

      if (isPausedSaved === "true" && savedPauseStart) {
        isPaused = true;
        pauseStart = parseInt(savedPauseStart);
        document.querySelector(".pause-btn").style.display = "none";
        document.querySelector(".resume-btn").style.display = "inline-block";
      }

      startTimer();
      const standingHole = holes.find(h => !h.solved && h.x === currentX && h.y === currentY);
      if (standingHole) {
        showQuestion(standingHole);
      } else {
        document.querySelector(".instruction").innerText =
          "Ketik perintah \n move.up(x) \n move.down(x) \n move.left(x) \n move.right(x) \n x adalah jumlah langkah yang ingin diambil \n Contoh: move.up(5) \n Setelah itu tekan tombol RUN \n atau bisa juga tanpa memasukkan x hanya kosongkan ()";
      }

    };

    if (playMode === "load" && mode === "user" && username) {
      fetch("/api/get_progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.progress) {
            const parsed = JSON.parse(data.progress);
            score = parsed.score || 0;
            userHints = parsed.userHints || 3;
            currentX = parsed.currentX || 0;
            currentY = parsed.currentY || 0;
            selectedDifficulty = parsed.selectedDifficulty || "beginner";

            localStorage.setItem("selectedDifficulty", selectedDifficulty);
            localStorage.setItem("score", score);
            localStorage.setItem("userHints", userHints);
            localStorage.setItem("playerX", currentX);
            localStorage.setItem("playerY", currentY);
            localStorage.setItem("mode", "user");

            if (parsed.holes) {
              holes = parsed.holes;
              localStorage.setItem("holes", JSON.stringify(parsed.holes));
            }

            if (parsed.answeredQuestions) {
              localStorage.setItem("answeredQuestions", JSON.stringify(parsed.answeredQuestions));
            }

            const timeLeft = parsed.timeLeft || 600;
            const effectiveTime = timeLeft < 300 ? 300 : timeLeft;
            const newStart = Date.now() - (600 - effectiveTime) * 1000;
            localStorage.setItem("startTime", newStart);

            selectDifficulty(selectedDifficulty);
            setTimeout(afterGameLoaded, 300);
          } else {
            if (savedLevel) {
              selectDifficulty(savedLevel);
              setTimeout(afterGameLoaded, 300);
            } else {
              alert("Tidak ada progress atau level tersimpan. Kembali ke halaman utama.");
              window.location.href = "/";
            }
          }
        });
    } else {
      if (savedLevel) {
        selectDifficulty(savedLevel);
        setTimeout(afterGameLoaded, 300);
      } else {
        alert("Tidak ada level terpilih. Kembali ke halaman utama.");
        window.location.href = "/";
      }
    }
  }
});


document.addEventListener("DOMContentLoaded", () => {
  const hintBtn = document.getElementById("hint-button");
  if (hintBtn) {
    hintBtn.addEventListener("click", useHint);
  }
  const hintText = document.getElementById("hint-text");
  if (hintText) {
    hintText.addEventListener("copy", (e) => {
      e.preventDefault();
      alert("Menyalin hint tidak diperbolehkan!");
    });
  }
});

let userHints = 3;
const activeHintCoins = []; // max 2 koin aktif di map

// Fungsi untuk merender coin ke map
function spawnHintCoin() {
  if (activeHintCoins.length >= 2) return; // maksimum 2 aktif sekaligus

  const x = Math.floor(Math.random() * 10) * 80;
  const y = Math.floor(Math.random() * 6) * 80;
  const key = `${x},${y}`;

  if (savedLevel === 'beginner') {
    if (!occupied.has(key) && !isInRiver(x) && !isBridge(x, y) && !holes.some(h => h.x === x && h.y === y && !h.solved) && !obstacles.some(o => o.x === x && o.y === y)) {
      let coin = { x, y, timeoutId: null };
      occupied.add(key);
      activeHintCoins.push(coin);

      const coinEl = document.createElement("div");
      coinEl.className = "sprite-coin";
      coinEl.style.left = x + "px";
      coinEl.style.top = y + "px";
      document.querySelector(".map-container").appendChild(coinEl);

      coin.timeoutId = setTimeout(() => {
        removeHintCoin(coin);
      }, 30000);
    }
  } else if (savedLevel === 'intermediate') {
    if (!occupied.has(key) && !isBoulder(x, y) && !holes.some(h => h.x === x && h.y === y && !h.solved) && !obstacles.some(o => o.x === x && o.y === y)) {
      let coin = { x, y, timeoutId: null };
      occupied.add(key);
      activeHintCoins.push(coin);

      const coinEl = document.createElement("div");
      coinEl.className = "sprite-coin";
      coinEl.style.left = x + "px";
      coinEl.style.top = y + "px";
      document.querySelector(".map-container").appendChild(coinEl);

      coin.timeoutId = setTimeout(() => {
        removeHintCoin(coin);
      }, 30000);
    }
  } else {
    if (!occupied.has(key) && !holes.some(h => h.x === x && h.y === y && !h.solved) && !obstacles.some(o => o.x === x && o.y === y)) {
      let coin = { x, y, timeoutId: null };
      occupied.add(key);
      activeHintCoins.push(coin);

      const coinEl = document.createElement("div");
      coinEl.className = "sprite-coin";
      coinEl.style.left = x + "px";
      coinEl.style.top = y + "px";
      document.querySelector(".map-container").appendChild(coinEl);

      coin.timeoutId = setTimeout(() => {
        removeHintCoin(coin);
      }, 30000);
    }
  }
}

function removeHintCoin(coin) {
  const index = activeHintCoins.indexOf(coin);
  if (index > -1) {
    activeHintCoins.splice(index, 1);
  }
  occupied.delete(`${coin.x},${coin.y}`);
  const coins = document.querySelectorAll('.sprite-coin');
  coins.forEach(el => {
    if (parseInt(el.style.left) === coin.x && parseInt(el.style.top) === coin.y) {
      el.remove();
    }
  });
  clearTimeout(coin.timeoutId);
}

function checkHintPickup() {
  for (const coin of activeHintCoins) {
    if (coin.x === currentX && coin.y === currentY) {
      userHints++;
      removeHintCoin(coin);
      updateHintHUD();
      break;
    }
  }
}

function updateHintHUD() {
  const el = document.getElementById("hint-count");
  if (el) el.innerText = `Hints: ${userHints}`;
  saveGameState();
}

function useHint() {
  if (!activeHole) return;

  if (userHints > 0) {
    userHints--;
  } else if (score >= 5) {
    score -= 5;
  } else {
    return;
  }

  updateHintHUD();
  updateHUD();

  const hintTextEl = document.getElementById("hint-text");

  let hintLine = "";

  if (Array.isArray(activeHole.answer) && activeHole.answer.length > 0) {
    hintLine = activeHole.answer[0]; // hanya tampilkan elemen pertama
  } else if (typeof activeHole.answer === "string") {
    hintLine = activeHole.answer;
  } else {
    hintLine = "Tidak ada hint tersedia.";
  }

  hintTextEl.textContent = hintLine;

  if (typeof Prism !== 'undefined') {
    Prism.highlightElement(hintTextEl);
  }

  document.getElementById("hint-popup").style.display = "flex";

  if (hintTextEl) {
  hintTextEl.oncopy = (e) => {
    e.preventDefault();
    alert("Menyalin hint tidak diperbolehkan!");
  };
}
}

function closeHintPopup() {
  document.getElementById("hint-popup").style.display = "none";
}

// Jadwal hint muncul random setiap 15-30 detik
function startHintSpawner() {
  function spawnLoop() {
    spawnHintCoin();
    const next = Math.random() * 15000 + 30000;
    setTimeout(spawnLoop, next);
  }
  spawnLoop();
}

function saveGameState() {
  localStorage.setItem("score", score);
  localStorage.setItem("userHints", userHints);
  localStorage.setItem("holes", JSON.stringify(holes));
  localStorage.setItem("playerX", currentX);
  localStorage.setItem("playerY", currentY);
}

function loadGameState() {
  const savedObstacles = localStorage.getItem("obstacles");
  const savedScore = localStorage.getItem("score");
  const savedHints = localStorage.getItem("userHints");
  const savedHoles = localStorage.getItem("holes");
  const savedX = localStorage.getItem("playerX");
  const savedY = localStorage.getItem("playerY");

  score = !isNaN(parseInt(savedScore)) ? parseInt(savedScore) : 0;
  userHints = !isNaN(parseInt(savedHints)) ? parseInt(savedHints) : 3;
  currentX = !isNaN(parseInt(savedX)) ? parseInt(savedX) : 0;
  currentY = !isNaN(parseInt(savedY)) ? parseInt(savedY) : 0;

  if (character) {
    character.style.left = `${currentX}px`;
    character.style.top = `${currentY}px`;
  }

  if (savedObstacles) {
    try {
      const parsedObs = JSON.parse(savedObstacles);
      if (Array.isArray(parsedObs)) {
        obstacles.length = 0;
        obstacles.push(...parsedObs);
        for (const obs of obstacles) {
          occupied.add(`${obs.x},${obs.y}`);
        }
      }
    } catch (e) {
      console.warn("Failed to parse saved obstacles.");
    }
  }

  if (savedHoles) {
    try {
      const parsedHoles = JSON.parse(savedHoles);
      if (Array.isArray(parsedHoles)) {
        holes.length = 0;
        for (const h of parsedHoles) {
          holes.push({
            id: h.id,
            x: h.x,
            y: h.y,
            solved: h.solved || false,
            question: null,
            answer: null
          });
          occupied.add(`${h.x},${h.y}`);
        }
      }
    } catch (e) {
      console.warn("Failed to parse saved holes.");
    }
  }
}

function checkGameCompletion() {
  const allSolved = holes.every(h => h.solved);
  if (allSolved) {
    clearInterval(timerInterval);
    document.getElementById("gameCompletePopup").style.display = "block";
    const maxScore = holes.length * 10;
    const percentage = Math.floor((score / maxScore) * 100);
    document.getElementById("final-complete-score").innerText = percentage;
    submitScore(score);
  }
}

function goToNextLevel() {
  const currentLevel = localStorage.getItem("selectedDifficulty");

  localStorage.removeItem("startTime");
  localStorage.removeItem("isPaused");
  localStorage.removeItem("pauseStart");
  localStorage.removeItem("holes");
  localStorage.removeItem("playerX");
  localStorage.removeItem("playerY");
  localStorage.removeItem("obstacles");
  localStorage.removeItem("answeredIds");
  localStorage.removeItem("shuffledPool");
  localStorage.removeItem("introSeen");

  if (currentLevel === "beginner") {
    localStorage.setItem("selectedDifficulty", "intermediate");
    window.location.reload(); // reload game untuk load level berikutnya
  } else if (currentLevel === "intermediate") {
    localStorage.setItem("selectedDifficulty", "advanced");
    window.location.reload(); // reload game untuk load level berikutnya
  } else {
    // Jika sudah advanced, kembali ke main menu
    localStorage.removeItem("selectedDifficulty");
    localStorage.removeItem("skipDifficulty");
    window.location.href = "/";
  }
}

function upgradeAccount({ username, password }) {
  fetch("/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.status === "success") {
        localStorage.setItem("username", username);
        localStorage.setItem("mode", "user");
        alert("Akun berhasil dibuat dan Anda sekarang login.");

        // Coba kirim ulang skor jika ada
        const pendingScore = localStorage.getItem("pending_score");
        if (pendingScore) {
          submitScore(parseInt(pendingScore));
          localStorage.removeItem("pending_score");
        }
      } else {
        alert(data.message);
      }
    });
}

function saveProgress() {
  const mode = localStorage.getItem("mode");
  const username = localStorage.getItem("username");
  if (!username || mode !== "user") {
    alert("Anda harus login terlebih dahulu untuk menyimpan progress.");
    return;
  }

  const progress = {
    score: score,
    userHints: userHints,
    currentX: currentX,
    currentY: currentY,
    selectedDifficulty: selectedDifficulty,
    holes: holes,
    answeredQuestions: JSON.parse(localStorage.getItem("answeredQuestions")) || [],
    timeLeft: parseInt(localStorage.getItem("timeLeft")) || 600
  };

  fetch("/api/save_progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, progress: JSON.stringify(progress) })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert("Progress berhasil disimpan!");
      } else {
        alert("Gagal menyimpan progress.");
      }
    });
}


function handleAuthClick() {
  const mode = localStorage.getItem("mode");
  const loginPopup = document.getElementById("login-popup");

  if (mode === "user") {
    toggleAuthDropdown(); // buka dropdown logout
  } else {
    if (loginPopup) {
      loginPopup.style.display = "flex"; // tampilkan popup login
    }
  }
}

function toggleAuthDropdown() {
  const dropdown = document.getElementById("auth-dropdown");
  if (dropdown) {
    dropdown.style.display = dropdown.style.display === "none" ? "block" : "none";
  }
}

function updateAuthUI() {
  const username = localStorage.getItem("username");
  const mode = localStorage.getItem("mode");
  const btn = document.getElementById("auth-button");
  const dropdown = document.getElementById("auth-dropdown");

  if (btn) {
    if (mode === "user" && username) {
      btn.innerHTML = `👤 ${username}`;
      if (dropdown) dropdown.style.display = "none";
    } else {
      btn.innerHTML = "Login / Registrasi";
      if (dropdown) dropdown.style.display = "none";
    }
  }
}

window.addEventListener("click", function (e) {
  if (!e.target.closest("#auth-container")) {
    const dropdown = document.getElementById("auth-dropdown");
    if (dropdown) dropdown.style.display = "none";
  }
});

function handleLoad() {
  const mode = localStorage.getItem("mode");
  const username = localStorage.getItem("username");

  if (mode === "user" && username) {
    window.location.href = "/play?mode=load";
  } else {
    const loginPopup = document.getElementById("login-popup");
    if (loginPopup) {
      loginPopup.style.display = "flex";
    } else {
      alert("Login popup tidak tersedia.");
    }
  }
}

function playNextIntroLine() {
  if (introIndex >= introLines.length) {
    setTimeout(() => {
      document.getElementById("intro-popup").style.display = "none";
    }, 800);
    return;
  }

  showIntroLine(introLines[introIndex]);
  introIndex++;
  setTimeout(playNextIntroLine, 3000); // delay antar chat
}

function showIntroLine(line) {
  const container = document.getElementById("dialogue-box");

  const wrapper = document.createElement("div");
  wrapper.classList.add("custom-chat", line.side === "left" ? "left" : "right");

  if (line.speaker === "BUG") {
    wrapper.classList.add("bug");
  }

  const avatar = document.createElement("img");
  avatar.className = "custom-avatar";
  avatar.src = line.avatar;
  avatar.alt = line.speaker;

  const bubble = document.createElement("div");
  bubble.className = "custom-bubble";

  const name = document.createElement("div");
  name.className = "custom-name";
  name.innerText = line.speaker;

  const message = document.createElement("div");
  message.innerText = line.text;

  bubble.appendChild(name);
  bubble.appendChild(message);
  wrapper.appendChild(avatar);
  wrapper.appendChild(bubble);
  container.appendChild(wrapper);

  container.scrollTop = container.scrollHeight;
}

function triggerVirusIfOnHole() {
  const level = localStorage.getItem("selectedDifficulty");
  if (level !== "intermediate" && level !== "advanced") return;

  const currentHole = checkHole();
  if (!currentHole || currentHole.solved) return;

  const delay = Math.floor(Math.random() * 15000) + 15000; // antara 15–30 detik
  let virusChance = 0.4; // default untuk intermediate

  if (level === "advanced") {
    virusChance = 0.8; // lebih sering
  }

  const holeRef = currentHole;

  setTimeout(() => {
    const stillOnHole = checkHole() === holeRef && !holeRef.solved;
    if (stillOnHole && Math.random() < virusChance) {
      showVirusEffectAndShuffle();
    }
  }, delay);
}

function reshuffleQuestionPool() {
  const storedAnswered = new Set(JSON.parse(localStorage.getItem("answeredIds") || "[]"));
  const available = questions.filter(q => !storedAnswered.has(q.id));

  if (available.length === 0) return;

  for (let i = available.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [available[i], available[j]] = [available[j], available[i]];
  }

  const newPool = available.map(q => q.id);
  localStorage.setItem("shuffledPool", JSON.stringify(newPool));
}

function showVirusEffectAndShuffle() {
  const map = document.querySelector(".map-container");

  // Efek visual virus
  const flash = document.createElement("div");
  flash.style.position = "absolute";
  flash.style.top = "0";
  flash.style.left = "0";
  flash.style.width = "100%";
  flash.style.height = "100%";
  flash.style.backgroundColor = "rgba(255,0,0,0.4)";
  flash.style.zIndex = 999;
  flash.style.animation = "fadeOut 0.8s forwards";
  map.appendChild(flash);

  const notif = document.createElement("div");
  notif.className = "virus-notif";
  notif.innerText = "⚠️ Virus menyerang! Soalmu telah diacak ulang!";
  document.body.appendChild(notif);

  // Reshuffle pool soal
  reshuffleQuestionPool();

  // ❗ Ganti soal aktif dengan yang baru
  if (activeHole && !activeHole.solved) {
    const newQuestion = getRandomQuestion();
    if (newQuestion) {
      activeHole.question = newQuestion.question;
      activeHole.answer = newQuestion.answer;
      localStorage.setItem("holes", JSON.stringify(holes));
      document.querySelector(".instruction").innerText = "\n\n" + activeHole.question;
      document.getElementById("code-editor").value = "";
      console.log("soal diacak");
    }
  }

  // Hapus efek setelah 3 detik
  setTimeout(() => {
    flash.remove();
    notif.remove();
  }, 3000);
}

function startFirewallScheduler() {
  setInterval(() => {
    if (firewallCooldown || gamePausedByPuzzle) return;

    if (firewallTriggeredCount >= getFirewallTriggerLimit()) return;

    const chance = Math.random();
    if (chance < getFirewallTriggerChance()) {
      console.log("🚨 Firewall muncul di level", getCurrentLevel());
      openPuzzlePopup();
      freezeCharacter();
      firewallCooldown = true;
      firewallTriggeredCount++;

      setTimeout(() => {
        firewallCooldown = false;
      }, 30000); // 30 detik cooldown
    }
  }, 10000); // cek setiap 10 detik
}

function openPuzzlePopup() {
  const puzzlePopup = document.getElementById("puzzlePopup");
  puzzlePopup.style.display = "block";
  puzzleCurrentOrder = [...puzzleCorrectOrder];
  shuffle(puzzleCurrentOrder);
  renderPuzzlePieces();
  freezeCharacter();
}

function checkPuzzleCompletion() {
  const puzzleBoard = document.getElementById("puzzleBoard");
  const puzzleMessage = document.getElementById("puzzleMessage");
  const pieces = puzzleBoard.querySelectorAll(".puzzle-piece");
  const order = Array.from(pieces).map(p => parseInt(p.dataset.index));
  const isCorrect = order.every((val, i) => val === puzzleCorrectOrder[i]);

  if (isCorrect) {
    puzzleMessage.innerText = "🛡️ Firewall berhasil dilewati!";
    setTimeout(() => {
      puzzlePopup.style.display = "none";
      puzzleMessage.innerText = "";
      unfreezeCharacter();
    }, 1500);
  }
}

function freezeCharacter() {
  gamePausedByPuzzle = true;
}

function unfreezeCharacter() {
  gamePausedByPuzzle = false;
}

document.addEventListener("keydown", function (e) {
  if (gamePausedByPuzzle) {
    e.preventDefault();
    return;
  }
  // Pergerakan karakter lainnya tetap jalan
});

function renderPuzzlePieces() {
  const puzzleBoard = document.getElementById("puzzleBoard");
  puzzleBoard.innerHTML = "";
  puzzleCurrentOrder.forEach((index) => {
    const piece = document.createElement("div");
    piece.className = "puzzle-piece";
    piece.draggable = true;
    piece.dataset.index = index;
    const x = (index % 3) * -100;
    const y = Math.floor(index / 3) * -100;
    piece.style.backgroundImage = "url('/static/images/firewall.png')";
    piece.style.backgroundPosition = `${x}px ${y}px`;

    piece.addEventListener("dragstart", dragStart);
    piece.addEventListener("dragover", dragOver);
    piece.addEventListener("drop", drop);

    puzzleBoard.appendChild(piece);
  });
}

let draggedPuzzle;

function dragStart(e) {
  draggedPuzzle = e.target;
}

function dragOver(e) {
  e.preventDefault();
}

function drop(e) {
  e.preventDefault();
  if (draggedPuzzle === e.target) return;

  const puzzleBoard = document.getElementById("puzzleBoard");
  const from = Array.from(puzzleBoard.children).indexOf(draggedPuzzle);
  const to = Array.from(puzzleBoard.children).indexOf(e.target);

  puzzleBoard.insertBefore(draggedPuzzle, e.target);
  puzzleBoard.insertBefore(e.target, puzzleBoard.children[from]);

  checkPuzzleCompletion();
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function getCurrentLevel() {
  // Fungsi dummy, harus diganti sesuai sistem level kamu
  return parseInt(localStorage.getItem("currentLevel") || "1");
}

function getFirewallTriggerLimit() {
  const level = getCurrentLevel();
  return Math.min(6, maxFirewallTriggersBase + Math.floor(level / 3)); // naik tiap 3 level, max 6
}

function getFirewallTriggerChance() {
  const level = getCurrentLevel();
  return Math.min(0.3, 0.05 + 0.03 * level); // naik 3% per level, max 30%
}
