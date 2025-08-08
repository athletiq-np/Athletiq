const express = require('express');
const router = express.Router();
const { sendResponse } = require('../utils/response');

// Static domain constants (future: move to DB/config store)
const provinces = [
  'Koshi Province','Madhesh Province','Bagmati Province','Gandaki Province','Lumbini Province','Karnali Province','Sudurpashchim Province'
];

const relationships = [
  'Father','Mother','Guardian','Brother','Sister','Uncle','Aunt','Grandfather','Grandmother','Other'
];

const sports = [
  'Football','Basketball','Volleyball','Cricket','Table Tennis','Badminton','Athletics','Martial Arts','Swimming','Chess'
];

router.get('/constants', (req, res) => {
  sendResponse(res, { message: 'Constants fetched', data: { provinces, relationships, sports, version: 1 } });
});

module.exports = router;
