const express = require("express");
const router = express.Router();
const axios = require("axios");
const redis = require("redis");
const { promisify } = require("util");

const client = redis.createClient();
const redisGet = promisify(client.get).bind(client);
const redisSet = promisify(client.set).bind(client);

const API_ROUTE = process.env.API_ROUTE || "http://10.5.0.178:9999/";

const ax = axios.create({
  baseURL: API_ROUTE
});

async function processApiResponse(url, apiResponse) {
  const responseString = JSON.stringify(apiResponse.data);
  await redisSet(url, responseString);
  return responseString;
}

/* GET home page. */
router.get("*", async function(req, res, next) {
  const redisResponse = await redisGet(req.url);
  if (redisResponse) {
    res.send(redisResponse);
  } else {
    const apiResponse = ax
        .get(req.url)
        .then(apiResponse => {
          return processApiResponse(req.url, apiResponse);
        })
        .then(processedApiResponse => {
          res.send(processedApiResponse);
        })
        .catch(error => {
          if (error.response) {
            console.log(
                `StatusCode: ${error.response.status} : ${JSON.stringify(
                    error.response.data
                )}`
            );

            res.send(error.response.data);
            // The request was made but no response was received
            // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
            // http.ClientRequest in node.js
          } else if (error.request) {
            console.log(error.request);
            next();
          }
        });
  }
});
module.exports = router;
