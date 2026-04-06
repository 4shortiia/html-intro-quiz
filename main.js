let questions = [],
    current = 0,
    score = 0,
    wrong = 0,
    skipped = 0;
let answered = false,
    timer = null,
    timeLeft = 30;
const TIME_LIMIT = 30;

const $ = (id) => document.getElementById(id);
const screens = { intro: $("intro"), quiz: $("quiz"), results: $("results") };

function show(name) {
    Object.values(screens).forEach((s) => s.classList.remove("active"));
    screens[name].classList.add("active");
}

/* ── difficulty ── */
let selectedDiff = "all";
document.querySelectorAll(".diff-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
        document
            .querySelectorAll(".diff-btn")
            .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        selectedDiff = btn.dataset.diff;
        updateTotal();
    });
});

function updateTotal() {
    const pool =
        selectedDiff === "all"
            ? ALL_QUESTIONS
            : ALL_QUESTIONS.filter((q) => q.diff === selectedDiff);
    $("total-q").textContent = pool.length;
}

/* ── start ── */
$("start-btn").addEventListener("click", startQuiz);
function startQuiz() {
    const pool =
        selectedDiff === "all"
            ? ALL_QUESTIONS
            : ALL_QUESTIONS.filter((q) => q.diff === selectedDiff);
    questions = shuffle([...pool]);
    current = 0;
    score = 0;
    wrong = 0;
    skipped = 0;
    $("q-total").textContent = questions.length;
    show("quiz");
    loadQuestion();
}

/* ── load question ── */
function loadQuestion() {
    answered = false;
    clearInterval(timer);

    const q = questions[current];
    $("q-num").textContent = current + 1;
    $("live-score").textContent = "⭐ " + score;
    $("progress-fill").style.width = `${(current / questions.length) * 100}%`;

    const badge = $("diff-badge");
    badge.textContent = q.diff;
    badge.className = `diff-badge diff-${q.diff}`;

    $("q-text").innerHTML = renderText(q.q);

    const opts = $("options");
    opts.innerHTML = "";
    ["A", "B", "C", "D"].forEach((key, i) => {
        const div = document.createElement("div");
        div.className = "opt";
        div.innerHTML = `<span class="opt-key">${key}</span><span class="opt-text">${renderText(q.opts[i])}</span>`;
        div.addEventListener("click", () => !answered && selectAnswer(i));
        opts.appendChild(div);
    });

    $("feedback").className = "feedback";
    $("feedback").innerHTML = "";
    $("next-btn").style.display = "none";

    timeLeft = TIME_LIMIT;
    updateTimer();
    timer = setInterval(() => {
        timeLeft--;
        updateTimer();
        if (timeLeft <= 0) {
            clearInterval(timer);
            timeOut();
        }
    }, 1000);
}

function updateTimer() {
    $("timer-num").textContent = timeLeft + "s";
    const pct = (timeLeft / TIME_LIMIT) * 100;
    const fill = $("timer-fill");
    fill.style.width = pct + "%";
    fill.className =
        "timer-fill" + (pct <= 30 ? " danger" : pct <= 55 ? " warn" : "");
}

function selectAnswer(idx) {
    answered = true;
    clearInterval(timer);
    const q = questions[current];
    const optEls = [...document.querySelectorAll(".opt")];
    optEls.forEach((o) => o.classList.add("locked"));
    optEls[q.ans].classList.add("correct");

    const fb = $("feedback");
    if (idx === q.ans) {
        score++;
        $("live-score").textContent = "⭐ " + score;
        $("live-score").classList.add("pop");
        setTimeout(() => $("live-score").classList.remove("pop"), 300);
        optEls[idx].classList.add("correct");
        fb.className = "feedback correct";
        fb.innerHTML = "<strong>✓ Correct!</strong> " + renderText(q.exp);
    } else {
        wrong++;
        optEls[idx].classList.add("wrong");
        fb.className = "feedback wrong";
        fb.innerHTML = "<strong>✗ Wrong.</strong> " + renderText(q.exp);
    }
    $("next-btn").style.display = "inline-block";
}

function timeOut() {
    answered = true;
    skipped++;
    const q = questions[current];
    const optEls = [...document.querySelectorAll(".opt")];
    optEls.forEach((o) => o.classList.add("locked"));
    optEls[q.ans].classList.add("correct");
    const fb = $("feedback");
    fb.className = "feedback wrong";
    fb.innerHTML = "<strong>⏱ Time's up!</strong> " + renderText(q.exp);
    $("next-btn").style.display = "inline-block";
}

$("next-btn").addEventListener("click", () => {
    current++;
    current >= questions.length ? showResults() : loadQuestion();
});

/* ── results ── */
function showResults() {
    show("results");
    const pct = Math.round((score / questions.length) * 100);
    $("ring-pct").textContent = pct + "%";
    $("bd-correct").textContent = score;
    $("bd-wrong").textContent = wrong;
    $("bd-skipped").textContent = skipped;

    const tiers = [
        [90, "🏆", "HTML Master", "Outstanding. You know the spec inside out."],
        [
            70,
            "🚀",
            "Solid Developer",
            "Strong fundamentals — a few edges to sharpen.",
        ],
        [
            50,
            "💡",
            "Getting There",
            "Core concepts understood. Keep digging deeper.",
        ],
        [
            0,
            "📖",
            "Keep Practicing",
            "Time to revisit MDN. Every expert started here.",
        ],
    ];
    const [, icon, title, msg] = tiers.find(([min]) => pct >= min);
    $("result-icon").textContent = icon;
    $("result-title").textContent = title;
    $("result-msg").textContent = msg;

    const circ = 2 * Math.PI * 56;
    const fill = $("ring-fill");
    fill.style.strokeDasharray = circ;
    fill.style.strokeDashoffset = circ;
    requestAnimationFrame(() =>
        requestAnimationFrame(() => {
            fill.style.strokeDashoffset = circ - (pct / 100) * circ;
        }),
    );
    fill.style.stroke =
        pct >= 70 ? "#17b26a" : pct >= 50 ? "#f59e0b" : "#f04438";
}

$("retry-btn").addEventListener("click", startQuiz);
$("home-btn").addEventListener("click", () => {
    show("intro");
    updateTotal();
});

/* ── helpers ── */
function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// Escape HTML first, then convert backticks -> <code> and **bold**
function renderText(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

updateTotal();
