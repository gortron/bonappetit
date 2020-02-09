// Variables
const allElems = [];
let isGameOver = false;
let intervals = [];
let score = 0;
let mouthPoints = [];

const body = document.querySelector("body");
const mainContainer = document.querySelector(".container");
const video = document.querySelector("#videoElement");
const header = document.querySelector("h1");
const displayScore = document.querySelector("#displayScore");
allElems.push(video);

// Logic
Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri("./src/models"),
  faceapi.nets.faceLandmark68TinyNet.loadFromUri("./src/models")
]).then(run);

function run() {
  cameraMessage();
  startCamera();
  startDetections();
  instructionMessage();
  startGame();
}

const startCamera = () => {
  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then(stream => (video.srcObject = stream))
    .catch(err => alert(`${err})`));
};

const startDetections = () => {
  video.addEventListener("play", () => {
    setInterval(async () => {
      const detections = await faceapi.detectSingleFace(
        video,
        new faceapi.TinyFaceDetectorOptions()
      );
      if (!!detections) {
        let box = detections.box;
        let rect = video.getBoundingClientRect();
        let landmarks = await faceapi.detectFaceLandmarksTiny(video);
        mouthRelativePositions = landmarks.relativePositions.slice(-20);
        getMouthCoordinates(mouthRelativePositions, box, rect);
      }
    }, 200);
  });
};

function startGame() {
  const pieces = [];
  const foodGenerator = setInterval(() => {
    pieces.push(new Food());
  }, 5000);

  const notFoodGenerator = setInterval(() => {
    pieces.push(new NotFood());
  }, 20000);

  const pieceUpdater = setInterval(() => {
    pieces.forEach(piece => {
      piece.updatePosition();
      piece.collisionCheck();
    });
  }, 20);

  intervals.push(foodGenerator);
  intervals.push(notFoodGenerator);
  intervals.push(pieceUpdater);
}

const gameOver = (function() {
  let executed = false;
  return function() {
    if (!executed) {
      executed = true;
      displayScore.innerHTML = `Your score is: ${score}`;
      let name = prompt(
        "Game Over! 😫 Remember to only eat food. Enter Your Name: ",
        ""
      );
      postScoreAndRedirect(name, score);
    }
  };
})();

const postScoreAndRedirect = async (name, score) => {
  const method = "POST";
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json"
  };
  const body = JSON.stringify({ name, score });

  await fetch("https://bonappetit-dev.herokuapp.com/players", {
    method,
    headers,
    body
  });
  await (window.location.href = "/leaderboard");
};

// Helper Functions for mouth detection
function getMouthCoordinates(positions, box, rect) {
  mouthPoints = [];
  positions.forEach(point => {
    if (!!box) {
      x = parseInt(rect.x + box.x + point.x * box.width);
      y = parseInt(rect.y + box.y + point.y * box.height);
    } else {
      x = y = 0;
    }
    mouthPoints.push({ x, y });
  });
  return mouthPoints;
}

function mouthIsOpen() {
  let mouth = mouthPoints;

  // Get relevant y coordinates from mouthPoints
  let outerLipTopRight = mouth[8].y;
  let outerLipTopMid = mouth[9].y;
  let outerLipTopLeft = mouth[10].y;
  let innerLipTopRight = mouth[17].y;
  let innerLipTopMid = mouth[18].y;
  let innerLipTopLeft = mouth[19].y;
  let innerLipBottomLeft = mouth[13].y;
  let innerLipBottomMid = mouth[14].y;
  let innerLipBottomRight = mouth[15].y;
  let outerLipBottomLeft = mouth[2].y;
  let outerLipBottomMid = mouth[3].y;
  let outerLipBottomRight = mouth[4].y;

  // Average out the lip heights and mouth heights
  mouthHeightLeft = innerLipTopLeft - innerLipBottomLeft;
  mouthHeightMid = innerLipTopMid - innerLipBottomMid;
  mouthHeightRight = innerLipTopRight - innerLipBottomRight;
  mouthHeightAvg = (mouthHeightLeft + mouthHeightMid + mouthHeightRight) / 3;

  lipHeightLeft = outerLipTopLeft - outerLipBottomLeft;
  lipHeightMid = outerLipTopMid - outerLipBottomMid;
  lipHeightRight = outerLipTopRight - outerLipBottomRight;
  lipHeightAvg = (lipHeightLeft + lipHeightMid + lipHeightRight) / 3;

  // If our mouth measurements is 50% of lip measurement, mouth is open
  opening = parseInt((100 * mouthHeightAvg) / lipHeightAvg);
  let mouthOpen = opening >= 55;
  return mouthOpen;
}

const cameraMessage = () => {
  alert(
    "Welcome to Bon APPetit! 🍽 In order to play, you'll need to grant the site access to your camera.\n\nClose this message, and then choose 'Allow' when your browser asks if you'd like to share your camera."
  );
};

const instructionMessage = () => {
  alert(
    "Great! Welcome to our restaurant. The chef's have been working with some rather... exotic... ingredients. To be honest, they're just throwing food around at this point.\n\nEat like you normally do: just open your mouth when there's food close to it. But, please (for insurance reasons) don't eat anything that's NOT food. Like crystal balls, rockets, and instruments. Don't eat those.\n\nTo eat on the internet, we had to invoke some pretty powerful magic. We're still working out the kinks. If you position your head so it is centered and filling up most of the frame, the magic is more likely to work. And make sure to open your mouth wide!\n\nLet's get started. Bon Appetit!"
  );
};

class Piece {
  constructor() {
    // Give it a random starting position, 'fenced' at 50px window border
    this.position = {
      x: parseInt(100 + Math.random() * (window.innerWidth - 300)),
      y: parseInt(100 + Math.random() * (window.innerHeight - 300))
    };

    // Give it a random starting velocity
    let velX = Math.random();
    let velY = Math.random();
    let x = 0;
    let y = 0;
    Math.random() < 0.5 ? (x = velX * -1 * 10) : (x = velX * 10);
    Math.random() < 0.5 ? (y = velY * -1 * 10) : (y = velY * 10);
    // Make sure that neither x nor y velocities are 0
    x >= 0 ? x++ : x--;
    y >= 0 ? y++ : y--;
    this.velocity = { x: parseInt(x), y: parseInt(y) };

    // Add an 'eaten' property so an object can only be eaten once
    this.eaten = false;

    // Build the object
    let newDiv = document.createElement("div");
    this.element = newDiv;
    this.element.style.left = `${this.position.x}px`;
    this.element.style.bottom = `${window.innerHeight -
      this.position.y -
      60}px`;
    body.append(newDiv);
  }

  updatePosition() {
    // Objects should bounce if their border comes within 50 pixels of window edge
    let bounceX =
      this.position.x <= 50 || this.position.x >= window.innerWidth - 110;
    let bounceY =
      this.position.y <= 50 || this.position.y >= window.innerHeight - 150;
    if (bounceX) this.velocity.x *= -1;
    if (bounceY) this.velocity.y *= -1;

    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    this.element.style.left = `${this.position.x}px`;
    this.element.style.bottom = `${window.innerHeight -
      this.position.y -
      60}px`;
  }

  collisionCheck() {
    // piece hit box is defined as the dimensions and location of its div element
    let pieceHitbox = {
      x: this.position.x,
      y: this.position.y,
      width: 60,
      height: 60
    };

    // mouth hit box is defined as a rectangle bounding left lip corner, top lip, bottom lip, and right lip corner
    let mouthHitBox = {
      x: mouthPoints[0].x,
      y: mouthPoints[9].y,
      width: mouthPoints[6].x - mouthPoints[0].x,
      height: mouthPoints[9].y - mouthPoints[3].y
    };

    // if the hit boxes collide in any way AND a player's mouth is open, then the piece is 'eaten'
    if (
      !this.eaten &&
      mouthIsOpen() &&
      pieceHitbox.x < mouthHitBox.x + mouthHitBox.width &&
      pieceHitbox.x + pieceHitbox.width > mouthHitBox.x &&
      pieceHitbox.y < mouthHitBox.y + mouthHitBox.height &&
      pieceHitbox.y + pieceHitbox.height > mouthHitBox.y
    ) {
      if (this.element.className === "not-food") {
        isGameOver = true;
        gameOver();
      } else {
        this.eaten = true;
        this.element.remove();
        score += 1000;
        displayScore.innerHTML = score;
      }
    }
  }
}

class Food extends Piece {
  constructor() {
    super();
    const food = [
      "🍎",
      "🍐",
      "🍊",
      "🍌",
      "🍉",
      "🍇",
      "🍓",
      "🍒",
      "🍑",
      "🥥",
      "🍆",
      "🥑",
      "🥒",
      "🥬",
      "🌽",
      "🥕",
      "🥔",
      "🥐",
      "🍞",
      "🥖",
      "🥨",
      "🧀",
      "🥚",
      "🍳",
      "🥞",
      "🥓",
      "🍗",
      "🌭",
      "🍔",
      "🍟",
      "🍕",
      "🥪",
      "🥙",
      "🌮",
      "🌯",
      "🥗",
      "🥘",
      "🍝",
      "🍜",
      "🍲",
      "🍛",
      "🍣",
      "🍱",
      "🥟",
      "🍤",
      "🍙",
      "🍚",
      "🍘",
      "🍥",
      "🥮",
      "🥠",
      "🍧",
      "🍨",
      "🍦",
      "🥧",
      "🍰",
      "🎂",
      "🍮",
      "🍭",
      "🍬",
      "🍫",
      "🍿",
      "🍩",
      "🍪",
      "🍯",
      "🍷",
      "🍾"
    ];
    const item = food[parseInt(Math.random() * food.length)];
    this.element.className = "food";
    this.element.innerHTML = `${item}`;
  }
}

class NotFood extends Piece {
  constructor() {
    super();
    const notFood = [
      "⚽️",
      "🎱",
      "🥌",
      "🥊",
      "🎲",
      "🎺",
      "🚲",
      "🚕",
      "🚨",
      "🛩",
      "🚀",
      "🗿",
      "🗽",
      "🛸",
      "⏰",
      "🔮",
      "📸",
      "💣",
      "💊",
      "💎",
      "🔫",
      "🔧",
      "📦",
      "🎁",
      "📌",
      "📫",
      "🧦",
      "😎",
      "💩",
      "🤖"
    ];
    const item = notFood[parseInt(Math.random() * notFood.length)];
    this.element.className = "not-food";
    this.element.innerHTML = `${item}`;
  }
}
