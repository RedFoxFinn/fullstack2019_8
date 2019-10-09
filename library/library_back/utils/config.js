/*
if (process.argv[0] !== 'production') {
  require('dotenv').config();
}
*/
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const API_SECRET = process.env.SECRET;

module.exports = {
  MONGODB_URI,
  API_SECRET
};