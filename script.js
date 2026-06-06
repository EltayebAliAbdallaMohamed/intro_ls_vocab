let words = [];
let filteredWords = [];
let currentIndex = 0;

// These control what "selected group" means:
let lastSearchSet = new Set(); // words (by normalized word text) that match search
let useSelectedGroup = true;   // checkbox state

// Elements
const wordTitle = document.getElementById('wordTitle');
const counterEl = document.getElementById('counter');

const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

const ttsBtn = document.getElementById('ttsBtn');
const ttsPhoneticBtn = document.getElementById('ttsPhoneticBtn');
const ttsTranslationBtn = document.getElementById('ttsTranslationBtn');
const ttsDefinitionBtn = document.getElementById('ttsDefinitionBtn');
const ttsQuestionBtn = document.getElementById('ttsQuestionBtn');

const selectedToggle = document.getElementById('selectedToggle');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');

const unitPill = document.getElementById('unitPill');
const pagePill = document.getElementById('pagePill');
const cefrPill = document.getElementById('cefrPill');
const posPill = document.getElementById('posPill');
const opalPill = document.getElementById('opalPill');

const phoneticText = document.getElementById('phoneticText');
const pronunciationAudio = document.getElementById('pronunciationAudio');
const playPronunciationBtn = document.getElementById('playPronunciationBtn');
const audioNote = document.getElementById('audioNote');

const translationText = document.getElementById('translationText');
const definitionText = document.getElementById('definitionText');

const wordImage = document.getElementById('wordImage');
const imageCaption = document.getElementById('imageCaption');

const exampleAudio = document.getElementById('exampleAudio');
const playExampleBtn = document.getElementById('playExampleBtn');
const exampleNote = document.getElementById('exampleNote');

const contextAudio = document.getElementById('contextAudio');
const playContextBtn = document.getElementById('playContextBtn');
const contextNote = document.getElementById('contextNote');

const questionText = document.getElementById('questionText');
const bookText = document.getElementById('bookText');

const debugBox = document.getElementById('debugBox');

const normalize = (s) => (s ?? '').toString().trim().toLowerCase();

function defaultWordValue(word) {
  // Ensure defaults:
  // Text fields default to "—" (or empty string if you prefer).
  // Audio/Image fields default to null.
  // OPAL default false.
  return {
    word: word.word ?? '',
    Definitions: word.Definitions ?? '',
    ArabicTranslation: word.ArabicTranslation ?? '',
    BookTitle: word.BookTitle ?? '',
    UnitNumber: typeof word.UnitNumber === 'number' ? word.UnitNumber : null,
    PageNumber: typeof word.PageNumber === 'number' ? word.PageNumber : null,
    PhoneticTranscription: word.PhoneticTranscription ?? '',
    PronunciationAudio: word.PronunciationAudio ?? null,
    ExampleSentenceAudio: word.ExampleSentenceAudio ?? null,
    ContextAudio: word.ContextAudio ?? null,
    ComprehensionQuestion: word.ComprehensionQuestion ?? '',
    ImageWebp: word.ImageWebp ?? null,
    CEFRLevel: word.CEFRLevel ?? '',
    PartOfSpeech: word.PartOfSpeech ?? '',
    OPAL: typeof word.OPAL === 'boolean' ? word.OPAL : false
  };
}

async function loadData() {
  try {
    const res = await fetch('./intro_ls.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to load data.json: ${res.status}`);
    const data = await res.json();

    // Support either: { words: [...] } or direct array
    const list = Array.isArray(data) ? data : (data?.words ?? []);
    words = list.map(defaultWordValue);

    // Initial filtered list = full list
    filteredWords = words.slice();
    currentIndex = 0;

    render();
  } catch (err) {
    console.error(err);
    alert('Could not load data.json. Check the file path and structure.');
  }
}

function applyFiltering() {
  // If useSelectedGroup=false => show complete list
  if (!useSelectedGroup) {
    filteredWords = words.slice();
    currentIndex = clampIndex(currentIndex, filteredWords.length);
    render();
    return;
  }

  // useSelectedGroup=true => show only lastSearchSet matches
  // If search never happened: show complete list (to avoid empty confusing state)
  if (lastSearchSet.size === 0) {
    filteredWords = words.slice();
    currentIndex = clampIndex(currentIndex, filteredWords.length);
    render();
    return;
  }

  filteredWords = words.filter(w => lastSearchSet.has(normalize(w.word)));
  currentIndex = clampIndex(currentIndex, filteredWords.length);
  render();
}

function clampIndex(idx, length) {
  if (length <= 0) return 0;
  return Math.max(0, Math.min(idx, length - 1));
}

function currentWord() {
  if (!filteredWords.length) return null;
  return filteredWords[currentIndex] ?? null;
}

function setCounter() {
  // "current words out of total number of words"
  // Interpreting as: (current position within filtered list) / (total words in dataset)
  const total = words.length;
  const current = filteredWords.length ? currentIndex + 1 : 0;
  counterEl.textContent = `${current} / ${total}`;
}

function showIfTextOrDefault(el, value) {
  el.textContent = value && value.trim().length ? value : '—';
}

function render() {
  const w = currentWord();

  setCounter();

  if (!w) {
    wordTitle.textContent = 'No word found';
    unitPill.textContent = 'Unit: —';
    pagePill.textContent = 'Page: —';
    cefrPill.textContent = 'CEFR: —';
    posPill.textContent = 'POS: —';
    opalPill.textContent = 'OPAL: —';

    phoneticText.textContent = '—';
    translationText.textContent = '—';
    definitionText.textContent = '—';

    wordImage.style.display = 'none';
    imageCaption.textContent = 'No image.';

    pronunciationAudio.style.display = 'none';
    playPronunciationBtn.style.display = 'none';
    audioNote.textContent = 'No pronunciation audio.';

    exampleAudio.style.display = 'none';
    playExampleBtn.style.display = 'none';
    exampleNote.textContent = 'No example audio.';

    contextAudio.style.display = 'none';
    playContextBtn.style.display = 'none';
    contextNote.textContent = 'No context audio.';

    questionText.textContent = '—';
    bookText.textContent = '—';
    debugBox.textContent = '';

    prevBtn.disabled = true;
    nextBtn.disabled = true;
    return;
  }

  wordTitle.textContent = w.word ? w.word : '(missing word)';

  unitPill.textContent = `Unit: ${w.UnitNumber ?? '—'}`;
  pagePill.textContent = `Page: ${w.PageNumber ?? '—'}`;
  cefrPill.textContent = `CEFR: ${w.CEFRLevel || '—'}`;
  posPill.textContent = `POS: ${w.PartOfSpeech || '—'}`;
  opalPill.textContent = `OPAL: ${w.OPAL ? 'true' : 'false'}`;

  phoneticText.textContent = w.PhoneticTranscription || '—';

  // Translation/Definitions
  showIfTextOrDefault(translationText, w.ArabicTranslation);
  showIfTextOrDefault(definitionText, w.Definitions);

  // Image
  if (w.ImageWebp) {
    wordImage.src = `assets/images/${w.ImageWebp}`;
    wordImage.style.display = 'block';
    imageCaption.textContent = '';
  } else {
    wordImage.style.display = 'none';
    imageCaption.textContent = 'No image.';
    wordImage.src = '';
  }

  // Pronunciation audio
  if (w.PronunciationAudio) {
    const src = `assets/audio/${w.PronunciationAudio}`;
    pronunciationAudio.src = src;
    pronunciationAudio.style.display = 'block';
    playPronunciationBtn.style.display = 'inline-block';
    audioNote.textContent = '';
  } else {
    pronunciationAudio.src = '';
    pronunciationAudio.style.display = 'none';
    playPronunciationBtn.style.display = 'none';
    audioNote.textContent = 'No pronunciation audio.';
  }

  // Example sentence audio
  if (w.ExampleSentenceAudio) {
    const src = `assets/audio/${w.ExampleSentenceAudio}`;
    exampleAudio.src = src;
    exampleAudio.style.display = 'block';
    playExampleBtn.style.display = 'inline-block';
    exampleNote.textContent = '';
  } else {
    exampleAudio.src = '';
    exampleAudio.style.display = 'none';
    playExampleBtn.style.display = 'none';
    exampleNote.textContent = 'No example audio.';
  }

  // Context audio
  if (w.ContextAudio) {
    const src = `assets/audio/${w.ContextAudio}`;
    contextAudio.src = src;
    contextAudio.style.display = 'block';
    playContextBtn.style.display = 'inline-block';
    contextNote.textContent = '';
  } else {
    contextAudio.src = '';
    contextAudio.style.display = 'none';
    playContextBtn.style.display = 'none';
    contextNote.textContent = 'No context audio.';
  }

  // Question + book
  showIfTextOrDefault(questionText, w.ComprehensionQuestion);
  showIfTextOrDefault(bookText, w.BookTitle);

  // Debug
  debugBox.textContent = JSON.stringify(w, null, 2);

  // Buttons enable/disable
  prevBtn.disabled = currentIndex <= 0;
  nextBtn.disabled = currentIndex >= filteredWords.length - 1;
}

// MODIFIED: speakText now accepts an optional lang parameter
function speakText(text, lang = '') {
  if (!text || !text.trim()) return;

  if (!('speechSynthesis' in window)) {
    alert('Text-to-Speech is not supported in this browser.');
    return;
  }

  // Cancel previous speech
  window.speechSynthesis.cancel();

  const utter = new SpeechSynthesisUtterance(text);

  // Set language when provided (e.g. for Arabic)
  if (lang) {
    utter.lang = lang;
  }

  utter.rate = 1.0;
  utter.pitch = 1.0;

  window.speechSynthesis.speak(utter);
}

// Button: speak selected text
ttsBtn.addEventListener('click', () => {
  const selected = window.getSelection()?.toString()?.trim() ?? '';
  if (selected) {
    speakText(selected);
  } else {
    alert('Please select some text on the page first.');
  }
});

ttsPhoneticBtn.addEventListener('click', () => {
  speakText(phoneticText.textContent);
});

// MODIFIED: explicitly use Arabic for translation
ttsTranslationBtn.addEventListener('click', () => {
  speakText(translationText.textContent, 'ar-SA');
});

ttsDefinitionBtn.addEventListener('click', () => {
  speakText(definitionText.textContent);
});

ttsQuestionBtn.addEventListener('click', () => {
  speakText(questionText.textContent);
});

// Audio play buttons
playPronunciationBtn.addEventListener('click', () => pronunciationAudio?.play());
playExampleBtn.addEventListener('click', () => exampleAudio?.play());
playContextBtn.addEventListener('click', () => contextAudio?.play());

// Prev/Next
prevBtn.addEventListener('click', () => {
  currentIndex = clampIndex(currentIndex - 1, filteredWords.length);
  render();
});

nextBtn.addEventListener('click', () => {
  currentIndex = clampIndex(currentIndex + 1, filteredWords.length);
  render();
});

// Search behavior:
// - User can type words separated by commas
// - List filtered so only those words are included
// - Checkbox toggles between selected group and complete list
function doSearch() {
  const raw = searchInput.value ?? '';
  const parts = raw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  if (!parts.length) {
    // No search terms => clear set and show full (depending on checkbox)
    lastSearchSet = new Set();
    applyFiltering();
    return;
  }

  // Build set of normalized words
  const normalizedParts = parts.map(normalize);
  lastSearchSet = new Set(normalizedParts);

  // Apply filtering according to checkbox
  applyFiltering();
}

searchBtn.addEventListener('click', () => {
  doSearch();
});

searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') doSearch();
});

selectedToggle.addEventListener('change', () => {
  useSelectedGroup = selectedToggle.checked;
  applyFiltering();
});

// Load at startup
loadData();
