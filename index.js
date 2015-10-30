'use strict';

var fs = require('fs');

var Registry = require('npm-registry');
var async = require('async');

var tools = require('./tools');

var KEY_WORDS = 'react-native';
var npm = new Registry({
    registry: Registry.mirrors.npmjs,
});

async.waterfall([
  function (callback) {
    npm.packages.keyword(KEY_WORDS, callback);
  },
  function (packages, callback) {
    console.log('Packages count:', packages.length);
    var tasks = packages.map(function (packageInfo) {
      return function (cb) {
        tools.fetchByPackageInfo(packageInfo, cb);
      };
    });

    async.parallelLimit(tasks, 10, callback);
  },
  function (jsonResultArray, callback) {
    console.log('jsonResultArray.length:', jsonResultArray.length);
    var initMarkdown = fs.readFileSync('./data/init_readme.md');
    var markdown = tools.jsonResultToMarkdown(jsonResultArray);
    initMarkdown += markdown;
    callback(null, initMarkdown);
  },
  function (markdown, callback) {
    fs.writeFileSync('./README.md', markdown);
    callback(null, 'Finished');
  }
], function (err, result) {
  console.log(err, result);
});
