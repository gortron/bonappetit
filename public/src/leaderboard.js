const API_URL = "https://bonappetit-dev.herokuapp.com";

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
