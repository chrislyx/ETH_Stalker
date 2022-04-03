const Moralis = require('moralis/node');
require('dotenv').config()


function initMoralis() {
    // Connect to Moralis server
    const serverUrl = "https://8p8qc1ugiqn9.usemoralis.com:2053/server";
    const appId = "o4eBbqO6UWsbGCpvIvVLPpH2lxrX6G3mT2ll2YUF";
    Moralis.start({ serverUrl, appId });
};

module.exports = { initMoralis, Moralis };