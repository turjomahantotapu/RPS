const EMOJI = { rock:'✊', paper:'✋', scissors:'✌️' };
const BEATS = { rock:'scissors', paper:'rock', scissors:'paper' };

let wins = 0, losses = 0, ties = 0, streak = 0, history = [];
let targetWins = 0; // 0 = endless
let matchLocked = false;
let soundOn = false;
let audioCtx = null;

const stage = document.getElementById('stage');
const winCount = document.getElementById('winCount');
const loseCount = document.getElementById('loseCount');
const tieCount = document.getElementById('tieCount');
const historyRow = document.getElementById('historyRow');
const targetNote = document.getElementById('targetNote');
const matchOverBanner = document.getElementById('matchOverBanner');
const choiceButtons = document.querySelectorAll('.choice-btn');

function beep(freq, dur){
  if(!soundOn) return;
  if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = 'sine';
  gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.start(); osc.stop(audioCtx.currentTime + dur);
}

document.getElementById('soundBtn').onclick = (e) => {
  soundOn = !soundOn;
  e.target.textContent = soundOn ? '🔊' : '🔈';
  e.target.classList.toggle('on', soundOn);
};

document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    targetWins = parseInt(btn.dataset.target, 10);
    resetScore();
  };
});

function updateTargetNote(){
  targetNote.textContent = targetWins > 0 ? `First to ${targetWins} wins takes the match` : '';
}
updateTargetNote();

function pickComputer(){
  const options = ['rock','paper','scissors'];
  return options[Math.floor(Math.random() * 3)];
}

function judge(player, computer){
  if(player === computer) return 'tie';
  return BEATS[player] === computer ? 'win' : 'lose';
}

function renderHistory(){
  historyRow.innerHTML = '';
  history.slice(-8).forEach(r => {
    const chip = document.createElement('div');
    chip.className = 'history-chip ' + r.result;
    chip.textContent = EMOJI[r.player];
    historyRow.appendChild(chip);
  });
}

function setButtonsDisabled(disabled){
  choiceButtons.forEach(b => b.disabled = disabled);
}

function playRound(playerChoice){
  if(matchLocked) return;
  setButtonsDisabled(true);
  beep(300, 0.06);

  stage.innerHTML = `
    <div class="vs-row">
      <div class="vs-side">
        <div class="vs-emoji shake" id="playerEmoji">${EMOJI[playerChoice]}</div>
        <div class="vs-label">You</div>
      </div>
      <div class="vs-versus">VS</div>
      <div class="vs-side">
        <div class="vs-emoji shake" id="computerEmoji">🤔</div>
        <div class="vs-label">Computer</div>
      </div>
    </div>
  `;

  setTimeout(() => {
    const computerChoice = pickComputer();
    const result = judge(playerChoice, computerChoice);

    document.getElementById('computerEmoji').classList.remove('shake');
    document.getElementById('playerEmoji').classList.remove('shake');
    document.getElementById('computerEmoji').textContent = EMOJI[computerChoice];

    if(result === 'win'){ wins++; streak = streak > 0 ? streak + 1 : 1; beep(520, 0.15); }
    else if(result === 'lose'){ losses++; streak = streak < 0 ? streak - 1 : -1; beep(160, 0.2); }
    else { ties++; streak = 0; beep(340, 0.1); }

    history.push({ player: playerChoice, computer: computerChoice, result });
    winCount.textContent = wins;
    loseCount.textContent = losses;
    tieCount.textContent = ties;
    renderHistory();

    const label = result === 'win' ? 'You win this round' : result === 'lose' ? 'You lose this round' : "It's a tie";
    const streakNote = streak >= 2 ? `<div class="streak-note">Win streak: <b>${streak}</b> 🔥</div>`
                      : streak <= -2 ? `<div class="streak-note">Losing streak: <b>${Math.abs(streak)}</b></div>`
                      : '';

    stage.innerHTML += `<div class="result-banner ${result}">${label}</div>${streakNote}`;

    checkMatchOver();
    setButtonsDisabled(false);
  }, 700);
}

function checkMatchOver(){
  if(targetWins > 0 && (wins >= targetWins || losses >= targetWins)){
    matchLocked = true;
    setButtonsDisabled(true);
    matchOverBanner.style.display = 'block';
    matchOverBanner.textContent = wins >= targetWins ? '🏆 You won the match!' : '💀 Computer won the match';
  }
}

choiceButtons.forEach(btn => {
  btn.onclick = () => playRound(btn.dataset.choice);
});

document.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  if(key === 'r') playRound('rock');
  if(key === 'p') playRound('paper');
  if(key === 's') playRound('scissors');
});

function resetScore(){
  wins = 0; losses = 0; ties = 0; streak = 0; history = [];
  matchLocked = false;
  winCount.textContent = 0; loseCount.textContent = 0; tieCount.textContent = 0;
  historyRow.innerHTML = '';
  matchOverBanner.style.display = 'none';
  setButtonsDisabled(false);
  updateTargetNote();
  stage.innerHTML = '<div class="countdown-text">Make your move to begin</div>';
}

document.getElementById('resetBtn').onclick = resetScore;
