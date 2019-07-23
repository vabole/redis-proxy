const express = require("express");
const router = express.Router();
const axios = require("axios");
const redis = require("redis");
const { promisify } = require("util");

const client = redis.createClient();
const getAsync = promisify(client.get).bind(client);
const setAsync = promisify(client.set).bind(client);

const API_ROUTE = process.env.API_ROUTE || "http://10.5.0.178:9999/";

const ax = axios.create({
  baseURL: API_ROUTE
});

async function fromApi(route) {
  return ax
    .get(route)
    .then(response => response.data)
    .catch(error => {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      if (error.response) {
        console.log(
          `StatusCode: ${error.response.status} : ${JSON.stringify(
            error.response.data
          )}`
        );
        return error.response.data;
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
      } else if (error.request) {
        console.log(error.request);
      }
    });
}

async function getRedis(route) {
  return getAsync(route).then(async result => {
    if (!result) {
      return await fromApi(route).then(apiData => {
        console.log("api data");
        setAsync(route, JSON.stringify(apiData));
        return apiData;
      });
    }
    return result;
  });
}

/* GET home page. */
router.get("*", function(req, res) {
  (async function() {
    const data = await getRedis(req.url);
    res.send(data);
  })();
});

module.exports = router;
