// Millstone
// 입력 -> 맷돌에 넣기 -> 원형 손잡이 드래그 -> 결과 확인 -> 초기화 흐름을 담당합니다.

const recipeBook = [
  {
    keywords: ["스트레스"],
    positive: "행복",
    message: "뭉쳐 있던 결이 풀리며 마음이 한층 더 폭신한 방향으로 흘러갔어요.",
    color: "#ead7bb",
  },
  {
    keywords: ["피로", "지침"],
    positive: "웃음",
    message: "무거웠던 감각이 조금 가벼워지며 입꼬리가 먼저 움직이기 시작했어요.",
    color: "#ecd59d",
  },
  {
    keywords: ["걱정", "불안"],
    positive: "평온",
    message: "잔물결 같던 마음이 천천히 가라앉으며 숨이 더 편안해졌어요.",
    color: "#e4ded5",
  },
  {
    keywords: ["화남", "화", "짜증"],
    positive: "미소",
    message: "날카롭던 가장자리가 둥글게 다듬어지며 표정도 같이 부드러워졌어요.",
    color: "#e5cdb0",
  },
  {
    keywords: ["고민", "복잡"],
    positive: "실마리",
    message: "엉켜 있던 생각 사이로 작은 방향이 보이기 시작했어요.",
    color: "#efcfad",
  },
  {
    keywords: ["슬픔", "우울"],
    positive: "온기",
    message: "조용한 따뜻함이 마음 안쪽으로 천천히 스며들었습니다.",
    color: "#e7d9c9",
  },
];

const fallbackResults = [
  {
    positive: "안심",
    message: "지금의 마음이 조금 더 부드러운 결로 바뀌었어요.",
    color: "#ecdac1",
  },
  {
    positive: "반짝임",
    message: "아주 작지만 분명한 빛이 안쪽에서 올라왔어요.",
    color: "#ead1a7",
  },
  {
    positive: "가벼움",
    message: "묵직한 감각이 한층 가볍게 흩어졌어요.",
    color: "#e1d9cf",
  },
  {
    positive: "용기",
    message: "한 걸음 내딛을 수 있을 만큼 마음이 조금 단단해졌어요.",
    color: "#e5c59d",
  },
  {
    positive: "안도",
    message: "조여 있던 마음이 살짝 풀리며 한숨 놓을 틈이 생겼어요.",
    color: "#e8d8c7",
  },
  {
    positive: "여유",
    message: "급했던 감정 사이에 조금 천천히 머물 수 있는 공간이 생겼어요.",
    color: "#ddd7cb",
  },
  {
    positive: "안정",
    message: "흔들리던 감각이 한층 고르게 가라앉으며 중심을 찾아가고 있어요.",
    color: "#d8d7cf",
  },
  {
    positive: "포근함",
    message: "마음 가장자리로 부드러운 온기가 얇게 감싸지기 시작했어요.",
    color: "#eadbcf",
  },
  {
    positive: "희망",
    message: "아주 작더라도 앞으로를 떠올릴 수 있는 빛이 은은하게 남았어요.",
    color: "#efd8b4",
  },
];

const defaultGuide =
  "고민과 걱정 콩을 넣으면, 편안과 행복을 주는 두부를 드릴게요.";
const RESULT_REVEAL_DURATION = 980;

const assetSources = {
  idle: "millstone_off_1.png",
  loaded: "millstone_on.png",
  miniTofu: "millstone_dubu.png",
  spin: [
    "millstone_off_1.png",
    "millstone_off_2.png",
    "millstone_off_3.png",
    "millstone_off_4.png",
  ],
};

const state = {
  phase: "idle",
  loadedWord: "",
  goalTurns: 0,
  completedTurns: 0,
  totalRotation: 0,
  signedRotation: 0,
  quarterStep: 0,
  hasLeftLoadedFrame: false,
  dialAngle: 0,
  activePointerId: null,
  lastPointerAngle: null,
  isDragging: false,
  roundToken: 0,
  spinFrames: [],
  announceTimer: 0,
  revealWordTimer: 0,
  sparkleCleanupTimer: 0,
  joltTimer: 0,
  resultRevealTimer: 0,
  bgmUnlocked: false,
  bgmPlaying: false,
  bgmFadeTimer: 0,
  audioUnlocked: false,
  spinPlaying: false,
};

const elements = {
  wishForm: document.getElementById("wishForm"),
  wishInput: document.getElementById("wishInput"),
  wishSubmit: document.getElementById("wishSubmit"),
  guideText: document.getElementById("guideText"),
  resetButton: document.getElementById("resetButton"),
  progressBar: document.getElementById("progressBar"),
  progressLabel: document.getElementById("progressLabel"),
  resultBubble: document.getElementById("resultBubble"),
  resultShape: document.getElementById("resultShape"),
  resultFrom: document.getElementById("resultFrom"),
  resultTo: document.getElementById("resultTo"),
  resultMessage: document.getElementById("resultMessage"),
  sparkleLayer: document.getElementById("sparkleLayer"),
  stage: document.querySelector(".stage"),
  grinderMachine: document.getElementById("grinderMachine"),
  grinderPhotoWrap: document.querySelector(".grinder-photo-wrap"),
  grinderPhoto: document.getElementById("grinderPhoto"),
  grinderTarget: document.getElementById("grinderTarget"),
  loadedWord: document.getElementById("loadedWord"),
  dialControl: document.getElementById("dialControl"),
  dialHandle: document.getElementById("dialHandle"),
  liveRegion: document.getElementById("liveRegion"),
  bgmAudio: document.getElementById("bgmAudio"),
  uiClickAudio: document.getElementById("uiClickAudio"),
  spinLoopAudio: document.getElementById("spinLoopAudio"),
  successAudio: document.getElementById("successAudio"),
};

prepareAssets();
bindEvents();
resetGame({ announceReset: false });

elements.grinderPhoto.addEventListener("error", () => {
  setGuide("맷돌 이미지 파일을 불러오지 못했어요. 파일 경로를 다시 확인해볼게요.", "active");
});

function bindEvents() {
  elements.wishForm.addEventListener("submit", (event) => {
    event.preventDefault();
    playUiClick();
    queueWord(elements.wishInput.value.trim());
  });

  elements.resetButton.addEventListener("click", () => {
    playUiClick();
    resetGame({ announceReset: true });
  });

  elements.dialControl.addEventListener("pointerdown", startDialDrag);
  window.addEventListener("pointermove", onDialPointerMove);
  window.addEventListener("pointerup", endDialDrag);
  window.addEventListener("pointercancel", endDialDrag);

  // BGM unlock requires a user gesture in most browsers.
  const unlockAudioOnce = () => {
    unlockAudio();
    window.removeEventListener("pointerdown", unlockAudioOnce);
    window.removeEventListener("keydown", unlockAudioOnce);
    window.removeEventListener("touchstart", unlockAudioOnce);
  };

  window.addEventListener("pointerdown", unlockAudioOnce, { passive: true });
  window.addEventListener("keydown", unlockAudioOnce, { passive: true });
  window.addEventListener("touchstart", unlockAudioOnce, { passive: true });
}

function prepareAssets() {
  preloadImage(assetSources.idle);
  preloadImage(assetSources.loaded);
  preloadImage(assetSources.miniTofu);

  Promise.all(assetSources.spin.map((src) => probeImage(src))).then((results) => {
    state.spinFrames = assetSources.spin.filter((_, index) => results[index]);
  });
}

function queueWord(word) {
  if (!word) {
    setGuide("고민, 걱정, 감정을 먼저 적어주세요.", "active");
    return;
  }

  if (state.phase === "result") {
    setGuide("다음 사람을 위해 초기화 버튼을 눌러 처음 화면으로 돌아가 주세요.", "complete");
    return;
  }

  if (state.phase !== "idle") {
    setGuide("지금 들어간 마음을 먼저 끝까지 갈아볼까요?", "active");
    return;
  }

  duckBgm();
  stopSpinLoop();
  hideResult();
  clearSparkles();
  state.roundToken += 1;
  state.phase = "loading";
  state.loadedWord = word;
  state.goalTurns = randomInt(4, 6);
  state.completedTurns = 0;
  state.totalRotation = 0;
  state.signedRotation = 0;
  state.quarterStep = 0;
  state.hasLeftLoadedFrame = false;
  state.dialAngle = 0;
  state.lastPointerAngle = null;
  state.isDragging = false;
  elements.wishInput.value = "";
  updateDialHandle();
  updateUI();
  setGuide(`"${word}"을(를) 맷돌에 넣고 있어요.`, "loading");
  animateWordIntoGrinder(word, state.roundToken);
}

function animateWordIntoGrinder(word, token) {
  clearFloatingPills();

  const inputRect = elements.wishForm.getBoundingClientRect();
  const targetRect = elements.grinderTarget.getBoundingClientRect();
  const startX = inputRect.left + inputRect.width / 2;
  const startY = inputRect.top + inputRect.height / 2;
  const endX = targetRect.left + targetRect.width / 2;
  const endY = targetRect.top + targetRect.height / 2;

  const pill = document.createElement("div");
  pill.className = "floating-pill";
  pill.textContent = word;
  pill.style.left = `${startX}px`;
  pill.style.top = `${startY}px`;
  pill.style.transform = "translate(-50%, -50%) scale(1)";
  document.body.appendChild(pill);

  requestAnimationFrame(() => {
    pill.style.transition =
      "left 820ms cubic-bezier(0.2, 0.8, 0.2, 1), top 820ms cubic-bezier(0.2, 0.8, 0.2, 1), transform 820ms ease, opacity 820ms ease";
    pill.style.left = `${endX}px`;
    pill.style.top = `${endY}px`;
    pill.style.transform = "translate(-50%, -50%) scale(0.42)";
    pill.style.opacity = "0.06";
  });

  window.setTimeout(() => {
    pill.remove();

    if (token !== state.roundToken) {
      return;
    }

    showLoadedWord(word);
    setGrinderImage(assetSources.loaded);
    state.phase = "ready";
    updateUI();
    setGuide(
      `"${word}"이(가) 맷돌 안으로 들어갔어요. 원형 손잡이를 드래그해 천천히 돌려보세요.`,
      "active"
    );
    announce(`${word}이 맷돌 안으로 들어갔어요.`);
  }, 860);
}

function startDialDrag(event) {
  if (state.phase === "idle") {
    setGuide("먼저 고민, 걱정, 감정을 적고 맷돌에 넣어주세요.", "active");
    return;
  }

  if (state.phase === "loading") {
    setGuide("지금 마음이 맷돌 안으로 들어가고 있어요. 잠깐만 기다려주세요.", "loading");
    return;
  }

  if (state.phase === "result") {
    setGuide("긍정 마음 두부가 완성됐어요. 다음 사람을 위해 초기화해 주세요.", "complete");
    return;
  }

  if (state.phase !== "ready" && state.phase !== "spinning") {
    return;
  }

  event.preventDefault();
  playUiClick();
  state.activePointerId = event.pointerId;
  state.lastPointerAngle = getPointerAngle(event);
  state.isDragging = true;
  state.phase = "spinning";
  elements.dialControl.classList.add("is-dragging");
  startSpinLoop();

  if (typeof elements.dialControl.setPointerCapture === "function") {
    elements.dialControl.setPointerCapture(event.pointerId);
  }

  updateUI();
  setGuide("손잡이를 돌리는 만큼 맷돌이 함께 움직여요.", "active");
}

function onDialPointerMove(event) {
  if (!state.isDragging || event.pointerId !== state.activePointerId) {
    return;
  }

  const nextAngle = getPointerAngle(event);
  const dialDelta = shortestAngleDelta(state.lastPointerAngle, nextAngle);
  state.lastPointerAngle = nextAngle;
  state.dialAngle = normalizeAngle(nextAngle);
  updateDialHandle();

  if (Math.abs(dialDelta) < 0.4) {
    return;
  }

  const rotationDelta = -dialDelta;
  state.signedRotation += rotationDelta;
  state.totalRotation += Math.abs(rotationDelta);

  updateFrameFromRotation();
  updateProgress();

  const nextCompletedTurns = Math.min(Math.floor(state.totalRotation / 360), state.goalTurns);
  if (nextCompletedTurns !== state.completedTurns) {
    state.completedTurns = nextCompletedTurns;
    updateProgress();

    if (state.completedTurns < state.goalTurns) {
      const remaining = state.goalTurns - state.completedTurns;
      setGuide(`${remaining}바퀴 정도 더 돌리면 따뜻한 두부가 완성돼요.`, "active");
    }
  }

  if (state.totalRotation >= state.goalTurns * 360) {
    resolveGrinding();
  }
}

function endDialDrag(event) {
  if (!state.isDragging || event.pointerId !== state.activePointerId) {
    return;
  }

  state.isDragging = false;
  state.activePointerId = null;
  state.lastPointerAngle = null;
  elements.dialControl.classList.remove("is-dragging");
  stopSpinLoop();

  if (state.phase === "spinning") {
    state.phase = "ready";
    updateUI();

    if (state.completedTurns < state.goalTurns) {
      setGuide("좋아요. 손잡이를 다시 잡고 계속 돌려보세요.", "active");
    }
  }
}

function updateFrameFromRotation() {
  const nextQuarterStep =
    state.signedRotation >= 0
      ? Math.floor(state.signedRotation / 90)
      : Math.ceil(state.signedRotation / 90);

  if (nextQuarterStep === state.quarterStep) {
    return;
  }

  state.quarterStep = nextQuarterStep;

  if (!state.hasLeftLoadedFrame && nextQuarterStep !== 0) {
    state.hasLeftLoadedFrame = true;
    elements.loadedWord.classList.add("is-grinding");
  }

  setGrinderImage(resolveFrameImage(nextQuarterStep));
  pulseMachine();
}

function resolveFrameImage(quarterStep) {
  if (!state.hasLeftLoadedFrame && quarterStep === 0) {
    return assetSources.loaded;
  }

  const frames = getSpinFrames();
  const index = mod(quarterStep, frames.length);
  return frames[index];
}

function resolveGrinding() {
  state.phase = "result";
  state.isDragging = false;
  state.activePointerId = null;
  state.lastPointerAngle = null;
  state.completedTurns = state.goalTurns;
  elements.dialControl.classList.remove("is-dragging");
  elements.loadedWord.classList.remove("is-visible", "is-grinding");
  stopSpinLoop();

  const recipe = findRecipe(state.loadedWord);
  showResult(state.loadedWord, recipe);
  playSuccessSound();
  updateUI();
  updateProgress();
  setGuide("좋아요. 마음이 부드러운 두부로 완성됐어요. 다음 사람을 위해 초기화해 주세요.", "complete");
  announce(`${state.loadedWord}이 ${recipe.positive} 두부로 바뀌었어요.`);
}

function resetGame({ announceReset = true } = {}) {
  state.roundToken += 1;
  state.phase = "idle";
  state.loadedWord = "";
  state.goalTurns = 0;
  state.completedTurns = 0;
  state.totalRotation = 0;
  state.signedRotation = 0;
  state.quarterStep = 0;
  state.hasLeftLoadedFrame = false;
  state.dialAngle = 0;
  state.activePointerId = null;
  state.lastPointerAngle = null;
  state.isDragging = false;

  window.clearTimeout(state.announceTimer);
  window.clearTimeout(state.revealWordTimer);
  window.clearTimeout(state.sparkleCleanupTimer);
  window.clearTimeout(state.joltTimer);
  window.clearTimeout(state.resultRevealTimer);
  window.clearTimeout(state.bgmFadeTimer);
  stopSpinLoop();

  clearFloatingPills();
  clearSparkles();
  hideResult();
  hideLoadedWord();
  elements.dialControl.classList.remove("is-dragging");
  elements.grinderPhotoWrap.classList.remove("is-jolt");
  elements.wishInput.value = "";
  setGrinderImage(assetSources.idle);
  updateDialHandle();
  updateUI();
  setGuide(defaultGuide, "ambient");
  restoreBgmForIdle();

  if (announceReset) {
    announce("처음 화면으로 돌아왔어요.");
  }
}

function updateUI() {
  const isIdle = state.phase === "idle";
  const showDial = state.phase === "ready" || state.phase === "spinning";

  elements.wishInput.disabled = !isIdle;
  elements.wishSubmit.disabled = !isIdle;
  elements.resetButton.disabled = isIdle;
  elements.dialControl.classList.toggle("is-hidden", !showDial);
  elements.dialControl.setAttribute("aria-hidden", showDial ? "false" : "true");
  updateProgress();
}

function updateProgress() {
  const maxRotation = state.goalTurns > 0 ? state.goalTurns * 360 : 0;
  const ratio = maxRotation > 0 ? Math.min(state.totalRotation / maxRotation, 1) : 0;
  elements.progressBar.style.width = `${ratio * 100}%`;

  if (state.phase === "idle") {
    setProgressLabel("준비 중", "loading");
    return;
  }

  if (state.phase === "result") {
    setProgressLabel(`완성! ${state.goalTurns} / ${state.goalTurns} 바퀴`, "complete");
    return;
  }

  setProgressLabel(`${state.completedTurns} / ${state.goalTurns} 바퀴`, "active");
}

function updateDialHandle() {
  const angleRad = (state.dialAngle * Math.PI) / 180;
  const radiusPercent = 50;
  const x = 50 + Math.cos(angleRad) * radiusPercent;
  const y = 50 + Math.sin(angleRad) * radiusPercent;

  elements.dialHandle.style.left = `${x}%`;
  elements.dialHandle.style.top = `${y}%`;
}

function showLoadedWord(word) {
  window.clearTimeout(state.revealWordTimer);
  elements.loadedWord.textContent = word;
  elements.loadedWord.setAttribute("aria-hidden", "false");
  elements.loadedWord.classList.remove("is-grinding");
  elements.loadedWord.classList.add("is-visible");
}

function hideLoadedWord() {
  elements.loadedWord.textContent = "";
  elements.loadedWord.setAttribute("aria-hidden", "true");
  elements.loadedWord.classList.remove("is-visible", "is-grinding");
}

function showResult(fromWord, recipe) {
  elements.resultShape.style.setProperty("--shape-color", recipe.color);
  elements.resultFrom.textContent = `${fromWord} ->`;
  elements.resultTo.textContent = `${recipe.positive} 두부`;
  elements.resultMessage.textContent = formatResultMessage(recipe.message);
  window.clearTimeout(state.resultRevealTimer);
  elements.resultBubble.classList.remove("is-revealing");
  elements.resultBubble.classList.add("is-hidden");
  void elements.resultBubble.offsetWidth;
  elements.resultBubble.classList.remove("is-hidden");
  elements.resultBubble.classList.add("is-revealing");
  window.requestAnimationFrame(() => {
    spawnSparkles(recipe.color);
  });
  state.resultRevealTimer = window.setTimeout(() => {
    elements.resultBubble.classList.remove("is-revealing");
  }, RESULT_REVEAL_DURATION);
}

function hideResult() {
  window.clearTimeout(state.resultRevealTimer);
  elements.resultBubble.classList.remove("is-revealing");
  elements.resultBubble.classList.add("is-hidden");
}

function spawnSparkles(color) {
  clearSparkles();

  const bubbleRect = elements.resultBubble.getBoundingClientRect();
  const stageRect = elements.stage.getBoundingClientRect();
  const originX = bubbleRect.left - stageRect.left + bubbleRect.width / 2;
  const originY = bubbleRect.top - stageRect.top + bubbleRect.height * 0.34;

  for (let index = 0; index < 24; index += 1) {
    const burst = document.createElement("img");
    const angle = (-150 + (300 / 23) * index + Math.random() * 20) * (Math.PI / 180);
    const distance = 76 + Math.random() * 120;
    const burstX = Math.round(Math.cos(angle) * distance);
    const burstY = Math.round(Math.sin(angle) * distance - 20 - Math.random() * 22);

    burst.className = "tofu-burst";
    burst.src = assetSources.miniTofu;
    burst.alt = "";
    burst.decoding = "async";
    burst.style.left = `${originX}px`;
    burst.style.top = `${originY}px`;
    burst.style.setProperty("--burst-size", `${26 + Math.round(Math.random() * 20)}px`);
    burst.style.setProperty("--burst-x", `${burstX}px`);
    burst.style.setProperty("--burst-y", `${burstY}px`);
    burst.style.setProperty("--burst-scale", `${(0.86 + Math.random() * 0.42).toFixed(2)}`);
    burst.style.setProperty("--burst-rotate", `${Math.round(Math.random() * 180 - 90)}deg`);
    burst.style.animationDelay = `${index * 36}ms`;
    elements.sparkleLayer.appendChild(burst);
  }

  for (let index = 0; index < 22; index += 1) {
    const sparkle = document.createElement("span");
    sparkle.className = "sparkle";
    sparkle.style.left = `${originX + Math.round(Math.random() * 62 - 31)}px`;
    sparkle.style.top = `${originY + Math.round(Math.random() * 34 - 17)}px`;
    sparkle.style.setProperty("--sparkle-color", color);
    sparkle.style.setProperty("--sparkle-x", `${Math.round(Math.random() * 200 - 100)}px`);
    sparkle.style.setProperty("--sparkle-y", `${Math.round(Math.random() * 120 - 46)}px`);
    sparkle.style.animationDelay = `${index * 42}ms`;
    elements.sparkleLayer.appendChild(sparkle);
  }

  state.sparkleCleanupTimer = window.setTimeout(() => {
    clearSparkles();
  }, 3000);
}

function clearSparkles() {
  elements.sparkleLayer.innerHTML = "";
}

function pulseMachine() {
  elements.grinderPhotoWrap.classList.remove("is-jolt");
  void elements.grinderPhotoWrap.offsetWidth;
  elements.grinderPhotoWrap.classList.add("is-jolt");

  window.clearTimeout(state.joltTimer);
  state.joltTimer = window.setTimeout(() => {
    elements.grinderPhotoWrap.classList.remove("is-jolt");
  }, 160);
}

function getSpinFrames() {
  if (state.spinFrames.length === assetSources.spin.length) {
    return state.spinFrames;
  }

  return assetSources.spin;
}

function setGrinderImage(src) {
  if (elements.grinderPhoto.getAttribute("src") === src) {
    return;
  }

  elements.grinderPhoto.setAttribute("src", src);
}

function getPointerAngle(event) {
  const rect = elements.dialControl.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const radians = Math.atan2(event.clientY - centerY, event.clientX - centerX);
  const degrees = (radians * 180) / Math.PI;
  return normalizeAngle(degrees);
}

function shortestAngleDelta(from, to) {
  let delta = to - from;

  while (delta > 180) {
    delta -= 360;
  }

  while (delta < -180) {
    delta += 360;
  }

  return delta;
}

function normalizeAngle(angle) {
  return mod(angle, 360);
}

function mod(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

function setGuide(message, tone = "ambient") {
  elements.guideText.textContent = message;
  elements.guideText.dataset.tone = tone;
}

function setProgressLabel(message, tone = "ambient") {
  elements.progressLabel.textContent = message;
  elements.progressLabel.dataset.tone = tone;
}

function unlockAudio() {
  if (state.audioUnlocked) {
    return;
  }

  state.audioUnlocked = true;
  primeAudioElement(elements.uiClickAudio);
  primeAudioElement(elements.spinLoopAudio);
  primeAudioElement(elements.successAudio);

  unlockBgm();
}

function unlockBgm() {
  if (!elements.bgmAudio || state.bgmUnlocked) {
    return;
  }

  state.bgmUnlocked = true;
  elements.bgmAudio.volume = 0.0;
  resumeBgmIfIdle();
}

function resumeBgmIfIdle() {
  if (!elements.bgmAudio || !state.bgmUnlocked) {
    return;
  }

  if (state.phase !== "idle" || state.bgmPlaying) {
    return;
  }

  state.bgmPlaying = true;
  window.clearTimeout(state.bgmFadeTimer);
  elements.bgmAudio.currentTime = 0;
  elements.bgmAudio
    .play()
    .then(() => {
      fadeBgmTo(0.65, 600);
    })
    .catch(() => {
      state.bgmPlaying = false;
    });
}

function restoreBgmForIdle() {
  if (!elements.bgmAudio || !state.bgmUnlocked) {
    return;
  }

  if (state.phase !== "idle") {
    return;
  }

  if (!state.bgmPlaying) {
    resumeBgmIfIdle();
    return;
  }

  window.clearTimeout(state.bgmFadeTimer);
  fadeBgmTo(0.65, 500);
}

function duckBgm() {
  if (!elements.bgmAudio || !state.bgmUnlocked || !state.bgmPlaying) {
    return;
  }

  window.clearTimeout(state.bgmFadeTimer);
  fadeBgmTo(0.12, 450);
}

function fadeBgmTo(targetVolume, duration, onComplete) {
  const audio = elements.bgmAudio;
  if (!audio) {
    return;
  }

  const startVolume = audio.volume;
  const startTime = performance.now();

  const step = (now) => {
    const progress = Math.min((now - startTime) / duration, 1);
    audio.volume = startVolume + (targetVolume - startVolume) * progress;

    if (progress < 1) {
      state.bgmFadeTimer = window.requestAnimationFrame(step);
    } else if (onComplete) {
      onComplete();
    }
  };

  state.bgmFadeTimer = window.requestAnimationFrame(step);
}

function primeAudioElement(element) {
  if (!element) {
    return;
  }

  const previousVolume = element.volume;
  element.volume = 0;
  element
    .play()
    .then(() => {
      element.pause();
      element.currentTime = 0;
      element.volume = previousVolume;
    })
    .catch(() => {
      element.volume = previousVolume;
    });
}

function playUiClick() {
  if (!state.audioUnlocked || !elements.uiClickAudio) {
    return;
  }

  const click = elements.uiClickAudio.cloneNode(true);
  click.volume = 0.5;
  click.play().catch(() => {});
}

function startSpinLoop() {
  if (!state.audioUnlocked || !elements.spinLoopAudio || state.spinPlaying) {
    return;
  }

  elements.spinLoopAudio.currentTime = 0;
  elements.spinLoopAudio.volume = 0.25;
  elements.spinLoopAudio
    .play()
    .then(() => {
      state.spinPlaying = true;
    })
    .catch(() => {
      state.spinPlaying = false;
    });
}

function stopSpinLoop() {
  if (!elements.spinLoopAudio || !state.spinPlaying) {
    return;
  }

  elements.spinLoopAudio.pause();
  elements.spinLoopAudio.currentTime = 0;
  state.spinPlaying = false;
}

function playSuccessSound() {
  if (!state.audioUnlocked || !elements.successAudio) {
    return;
  }

  elements.successAudio.currentTime = 0;
  elements.successAudio.volume = 0.8;
  elements.successAudio.play().catch(() => {});
}

function announce(message) {
  elements.liveRegion.textContent = "";
  window.clearTimeout(state.announceTimer);
  state.announceTimer = window.setTimeout(() => {
    elements.liveRegion.textContent = message;
  }, 30);
}

function clearFloatingPills() {
  document.querySelectorAll(".floating-pill").forEach((pill) => pill.remove());
}

function findRecipe(word) {
  const recipe = recipeBook.find((entry) =>
    entry.keywords.some((keyword) => word.includes(keyword))
  );

  if (recipe) {
    return recipe;
  }

  return fallbackResults[hashWord(word) % fallbackResults.length];
}

function hashWord(word) {
  let hash = 0;

  for (let index = 0; index < word.length; index += 1) {
    hash = (hash * 31 + word.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatResultMessage(message, preferredLength = 15) {
  if (message.length <= preferredLength + 2) {
    return message;
  }

  const minIndex = Math.max(8, preferredLength - 5);
  const maxIndex = Math.min(message.length - 4, preferredLength + 5);
  let splitIndex = -1;
  let smallestDistance = Number.POSITIVE_INFINITY;

  for (let index = minIndex; index <= maxIndex; index += 1) {
    if (message[index] !== " ") {
      continue;
    }

    const distance = Math.abs(index - preferredLength);
    if (distance < smallestDistance) {
      smallestDistance = distance;
      splitIndex = index;
    }
  }

  if (splitIndex === -1) {
    splitIndex = preferredLength;
  }

  const firstLine = message.slice(0, splitIndex).trim();
  const secondLine = message.slice(splitIndex).trim();
  return `${firstLine}\n${secondLine}`;
}

function preloadImage(src) {
  const image = new Image();
  image.src = src;
}

function probeImage(src) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(true);
    image.onerror = () => resolve(false);
    image.src = src;
  });
}
