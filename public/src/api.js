// This file contains logic for communicating player names and scores to the API.

const ApiURL = "http://localhost:3000/score_boards";
const UserURL = "http://localhost:3000/users/";

const headers = {
  "Content-Type": "application/json",
  Accept: "application/json"
};

const getApi = url => {
  return fetch(url).then(resp => resp.json());
};
const patchApi = (url, patchInfo) => {
  return fetch(url, {
    method: "PATCH",
    headers: headers,
    body: JSON.stringify(patchInfo)
  }).then(resp => resp.json());
};
const postApi = (url, postInfo) => {
  return fetch(url, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(postInfo)
  }).then(resp => resp.json());
};

const API = { getApi, patchApi, postApi };
