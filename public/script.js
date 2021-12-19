// Create WebSocket connection.
const socketUrl = (window.location.hostname.startsWith('localhost') ? "ws://" : "wss://") + window.location.host
const socket = new WebSocket(socketUrl);

socket.addEventListener('message', function (event) {
    const message = JSON.parse(event.data)
    switch (message.type) {
        case 'NEW_CONNECTION':
            pickInstrument(message.data)
            break;
        case 'SOUND':
            playRemote(message.data)
            break;
        default:
            console.log('Unknown websocket message ' + message.data);
    }
});

const band = document.querySelector('.band');

const piano = document.querySelector('.piano');


let bandMap = new Map();
bandMap.set(1, 'piano');
bandMap.set(2, 'clap');
bandMap.set(3, 'hihat');
bandMap.set(4, 'open-hihat');
bandMap.set(5, 'kick');
bandMap.set(6, 'snare');

function pickInstrument(instruments) {
    for (const [key, value] of Object.entries(instruments)) {
      const instrument = document.querySelector(`[data-sound = "${key}"]`)
      instrument.classList = "pad " + value
    }
}

function play(event) {
  if (event.target.classList.contains('pad') || event.target.classList.contains('piano-key')) {
    event.preventDefault();
    let soundToPlay = event.target.dataset.sound;

    if (soundToPlay === 'piano') return

    const message = {type: 'SOUND', data: soundToPlay};
    socket.send(JSON.stringify(message));

    const audio = document.querySelector(`audio[data-key = "${soundToPlay}"]`)

    if (!audio){
        return //stop the function from running all together
      }
      audio.currentTime = 0 // rewind to the start
      audio.play()

      event.target.classList.add('pressed')
      audio.addEventListener('ended', () => {
        event.target.classList.remove('pressed')
      })
  }
}

function playRemote(sound) {
    const audio = document.querySelector(`audio[data-key = "${sound}"]`)

    if (!audio){
      return //stop the function from running all together
    }
    audio.currentTime = 0 // rewind to the start
    audio.play()

    const dataSound = document.querySelector(`[data-sound = "${sound}"]`)

    dataSound.classList.add('pressed')
    audio.addEventListener('ended', () => {
      dataSound.classList.remove('pressed')
    })
}

function setViewportHeight() {
  let vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}


setViewportHeight();
window.addEventListener('resize', () => {
  setTimeout(setViewportHeight, 100);
});

band.addEventListener('click', play);
band.addEventListener('touchstart', play);

piano.addEventListener('click', play);