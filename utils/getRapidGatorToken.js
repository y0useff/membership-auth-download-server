/*
const {RAPIDGATOR_EMAIL, RAPIDGATOR_PASSWORD} = require("../config.json")

const ENDPOINT = `https://rapidgator.net/api/v2/user/login`

const bent = require('bent')
const getJSON = bent('json')
async function getRapidGatorToken() {
    
    const response = (await getJSON(`${ENDPOINT}?login=${RAPIDGATOR_EMAIL}&password=${RAPIDGATOR_PASSWORD}`))
    console.log(response.response)
    return response.response.token
}


module.exports={getRapidGatorToken}
*/