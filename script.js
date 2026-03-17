// Millstone
// 입력 -> 맷돌에 넣기 -> 단일 버튼으로 갈기 -> 결과 확인 -> 초기화 흐름을 담당합니다.

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
];

const defaultGuide =
  "불안과 걱정을 콩으로 넣으면, 갈아서 편안과 행복을 주는 두부를 드릴게요.";

const assetSources = {
  idle: "millstone_off_1.png",
  loaded: "millstone_on.png",
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
  spinCount: 0,
  spinGoal: 0,
  isAnimating: false,
  roundToken: 0,
  spinFrames: [],
  loadedSrc: assetSources.loaded,
  announceTimer: 0,
  revealWordTimer: 0,
  sparkleCleanupTimer: 0,
};

const elements = {
  wishForm: document.getElementById("wishForm"),
  wishInput: document.getElementById("wishInput"),
  wishSubmit: document.getElementById("wishSubmit"),
  guideText: document.getElementById("guideText"),
  spinButton: document.getElementById("spinButton"),
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
  grinderPhoto: document.getElementById("grinderPhoto"),
  grinderTarget: document.getElementById("grinderTarget"),
  loadedWord: document.getElementById("loadedWord"),
  liveRegion: document.getElementById("liveRegion"),
};

prepareAssets();
bindEvents();
resetGame({ announceReset: false });

elements.grinderPhoto.addEventListener("error", () => {
  setGuide("맷돌 이미지 파일을 불러오지 못했어요. 파일 경로를 다시 확인해볼게요.");
});

function bindEvents() {
  elements.wishForm.addEventListener("submit", (event) => {
    event.preventDefault();
    queueWord(elements.wishInput.value.trim());
  });

  elements.spinButton.addEventListener("click", () => {
    void spinOnce();
  });

  elements.resetButton.addEventListener("click", () => {
    resetGame({ announceReset: true });
  });
}

function prepareAssets() {
  preloadImage(assetSources.idle);
  preloadImage(assetSources.loaded);

  Promise.all(assetSources.spin.map((src) => probeImage(src))).then((results) => {
    state.spinFrames = assetSources.spin.filter((_, index) => results[index]);
  });
}

function queueWord(word) {
  if (!word) {
    setGuide("고민, 걱정, 감정을 먼저 적어주세요.");
    return;
  }

  if (state.phase === "result") {
    setGuide("다음 사람을 위해 초기화 버튼을 눌러 처음 화면으로 돌아가 주세요.");
    return;
  }

  if (state.phase !== "idle") {
    setGuide("지금 들어간 마음을 먼저 끝까지 갈아볼까요?");
    return;
  }

  hideResult();
  clearSparkles();
  state.roundToken += 1;
  state.phase = "loading";
  state.loadedWord = word;
  state.spinCount = 0;
  state.spinGoal = randomInt(4, 6);
  state.isAnimating = false;
  updatePhaseUI();
  setGuide(`"${word}"을(를) 맷돌에 넣고 있어요.`);
  elements.wishInput.value = "";
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
    setGrinderImage(state.loadedSrc);
    state.phase = "ready";
    updatePhaseUI();
    setGuide(`"${word}"이(가) 맷돌 안으로 들어갔어요. 맷돌 돌리기를 눌러 천천히 갈아보세요.`);
    announce(`${word}이 맷돌 안으로 들어갔어요.`);
  }, 860);
}

async function spinOnce() {
  if (state.phase === "idle") {
    setGuide("먼저 고민, 걱정, 감정을 적고 맷돌에 넣어주세요.");
    return;
  }

  if (state.phase === "loading") {
    setGuide("지금 마음이 맷돌 안으로 들어가고 있어요. 잠깐만 기다려주세요.");
    return;
  }

  if (state.phase === "result") {
    setGuide("긍정 마음 두부가 완성됐어요. 다음 사람을 위해 초기화해 주세요.");
    return;
  }

  if (state.isAnimating || state.phase !== "ready") {
    return;
  }

  const token = state.roundToken;
  state.phase = "spinning";
  state.isAnimating = true;
  elements.loadedWord.classList.add("is-grinding");
  updatePhaseUI();
  setGuide("맷돌이 천천히 돌고 있어요.");

  await playSpinSequence(token);

  if (token !== state.roundToken) {
    return;
  }

  state.spinCount += 1;
  updateProgress();

  if (state.spinCount >= state.spinGoal) {
    resolveGrinding(token);
    return;
  }

  state.phase = "ready";
  state.isAnimating = false;
  elements.loadedWord.classList.remove("is-grinding");
  setGrinderImage(state.loadedSrc);
  updatePhaseUI();

  const remaining = state.spinGoal - state.spinCount;
  setGuide(`좋아요. ${remaining}번 정도 더 돌리면 긍정 마음 두부가 나와요.`);
}

async function playSpinSequence(token) {
  const spinFrames = getSpinFrames();
  elements.grinderMachine.classList.add("is-spinning");

  for (const frame of spinFrames) {
    if (token !== state.roundToken) {
      elements.grinderMachine.classList.remove("is-spinning");
      return;
    }

    setGrinderImage(frame);
    await wait(500);
  }

  elements.grinderMachine.classList.remove("is-spinning");
}

function resolveGrinding(token) {
  if (token !== state.roundToken) {
    return;
  }

  const recipe = findRecipe(state.loadedWord);
  state.phase = "result";
  state.isAnimating = false;
  elements.loadedWord.classList.remove("is-visible", "is-grinding");
  setGrinderImage(assetSources.idle);
  spawnSparkles(recipe.color);
  showResult(state.loadedWord, recipe);
  updatePhaseUI();
  setGuide("긍정 마음 두부가 완성됐어요. 다음 사람을 위해 초기화 버튼을 눌러주세요.");
  announce(`${state.loadedWord}이 ${recipe.positive} 두부로 바뀌었어요.`);
}

function resetGame({ announceReset = true } = {}) {
  state.roundToken += 1;
  state.phase = "idle";
  state.loadedWord = "";
  state.spinCount = 0;
  state.spinGoal = 0;
  state.isAnimating = false;

  window.clearTimeout(state.announceTimer);
  window.clearTimeout(state.revealWordTimer);
  window.clearTimeout(state.sparkleCleanupTimer);

  clearFloatingPills();
  clearSparkles();
  hideResult();
  hideLoadedWord();
  elements.grinderMachine.classList.remove("is-spinning");
  elements.wishInput.value = "";
  setGrinderImage(assetSources.idle);
  setGuide(defaultGuide);
  updatePhaseUI();

  if (announceReset) {
    announce("처음 화면으로 돌아왔어요.");
  }
}

function updatePhaseUI() {
  const isIdle = state.phase === "idle";
  const showSpinButton = state.phase === "ready" || state.phase === "spinning";

  elements.wishInput.disabled = !isIdle;
  elements.wishSubmit.disabled = !isIdle;
  elements.spinButton.classList.toggle("is-hidden", !showSpinButton);
  elements.spinButton.disabled = state.phase !== "ready";
  elements.spinButton.textContent = state.phase === "spinning" ? "맷돌 도는 중..." : "맷돌 돌리기";
  elements.resetButton.disabled = isIdle;
  updateProgress();
}

function updateProgress() {
  const ratio = state.spinGoal > 0 ? Math.min(state.spinCount / state.spinGoal, 1) : 0;
  elements.progressBar.style.width = `${ratio * 100}%`;

  if (state.phase === "idle") {
    elements.progressLabel.textContent = "준비 중";
    return;
  }

  if (state.phase === "result") {
    elements.progressLabel.textContent = `완성! ${state.spinGoal} / ${state.spinGoal} 바퀴`;
    return;
  }

  elements.progressLabel.textContent = `${state.spinCount} / ${state.spinGoal} 바퀴`;
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
  elements.resultFrom.textContent = fromWord;
  elements.resultTo.textContent = `${recipe.positive} 두부`;
  elements.resultMessage.textContent = recipe.message;
  elements.resultBubble.classList.remove("is-hidden");
}

function hideResult() {
  elements.resultBubble.classList.add("is-hidden");
}

function spawnSparkles(color) {
  clearSparkles();

  const machineRect = elements.grinderMachine.getBoundingClientRect();
  const stageRect = elements.stage.getBoundingClientRect();

  for (let index = 0; index < 12; index += 1) {
    const sparkle = document.createElement("span");
    sparkle.className = "sparkle";
    sparkle.style.left = `${machineRect.left - stageRect.left + machineRect.width * (0.46 + Math.random() * 0.08)}px`;
    sparkle.style.top = `${machineRect.top - stageRect.top + machineRect.height * (0.42 + Math.random() * 0.08)}px`;
    sparkle.style.setProperty("--sparkle-color", color);
    sparkle.style.setProperty("--sparkle-x", `${Math.round(Math.random() * 36 - 18)}px`);
    sparkle.style.setProperty("--sparkle-y", `${Math.round(Math.random() * 26)}px`);
    sparkle.style.animationDelay = `${index * 42}ms`;
    elements.sparkleLayer.appendChild(sparkle);
  }

  state.sparkleCleanupTimer = window.setTimeout(() => {
    clearSparkles();
  }, 1200);
}

function clearSparkles() {
  elements.sparkleLayer.innerHTML = "";
}

function getSpinFrames() {
  if (state.spinFrames.length === assetSources.spin.length) {
    return state.spinFrames;
  }

  return [state.loadedSrc, state.loadedSrc, state.loadedSrc, state.loadedSrc];
}

function setGrinderImage(src) {
  if (elements.grinderPhoto.getAttribute("src") === src) {
    return;
  }

  elements.grinderPhoto.setAttribute("src", src);
}

function setGuide(message) {
  elements.guideText.textContent = message;
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

function wait(duration) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, duration);
  });
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
