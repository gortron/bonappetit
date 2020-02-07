// Definitons
// const ApiURL = "http://localhost:3000/players";

// API Stuff

// const headers = {
//   Accept: "application/json",
//   "Content-Type": "application/json"p
// };

// const postApi = (url, postInfo) =>
//   fetch(url, {
//     method: "POST",
//     headers: headers,
//     body: JSON.stringify(postInfo)
//   }).then(resp => resp.json());

// const API = { getApi, patchApi, postApi };

// Functions

// API.getApi(ApiURL).then(data => sortScore(data)) //.forEach(scoreboard => sortScore(scoreboard)) )          //renderScore(scoreboard)))

// const API_URL =
//   process.env.NODE_ENV === "production"
//     ? "https://bonappetit.herokuapp.com/"
//     : "http://localhost:3000/";

const API_URL = "http://localhost:3000/";

const get = async endpoint => {
  const response = await fetch(API_URL + endpoint);
  const data = await response.json();
  return data;
};

const getAndRenderLeaderboard = async () => {
  const leaders = await get("/leaders");
  let playerRank = 1;
  leaders.map(player => {
    renderPlayerOntoLeaderboard(player, playerRank);
    playerRank++;
  });
};

function renderPlayerOntoLeaderboard(player, rank) {
  const leaderboard = document.querySelector("tbody");

  let row = document.createElement("tr");
  let rankCell = document.createElement("td");
  rankCell.innerHTML = rank;
  let nameCell = document.createElement("td");
  nameCell.innerHTML = player.name;
  let scoreCell = document.createElement("td");
  scoreCell.innerHTML = player.score;

  row.append(rank, nameCell, scoreCell);
  leaderboard.append(row);
}

getAndRenderLeaderboard();
