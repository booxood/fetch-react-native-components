'use strict';


var Registry = require('npm-registry');
var showdown = require('showdown');
var cheerio = require('cheerio');

var npm = new Registry();
var converter = new showdown.Converter();

/**
 * 通过 packageInfo 获取 readme 上的 images
 */
exports.fetchByPackageInfo = function (packageInfo, cb) {
  var name = packageInfo.name;
  var desc = packageInfo.description;

  npm.packages.get(name, function (err, data) {
    if (err) return cb(null, err);
    if (!data || !data[0] || !data[0].readme) return cb(null, 'no readme');

    var html = converter.makeHtml(data[0].readme);
    var $ = cheerio.load(html);
    var imgElements = $('img');
    if (imgElements.length === 0) return cb(null, 'no img');

    var result = {};
    result.name = name;
    result.url = data[0].homepage ? data[0].homepage.url :
      'https://www.npmjs.com/package/' + name;
    result.desc = desc;
    result.images = [];
    for (var j = 0; j < imgElements.length; j++) {
      var img = imgElements[j];
      result.images.push(img.attribs);
    }
    cb(null, result);
  });
};


var EOL = require('os').EOL;
var BR = EOL + EOL;

/**
 * 将 JSON 格式的结果转成 MarkDown 格式
 */
exports.jsonResultToMarkdown = function (jsonResult) {
  var markdown = '';
  jsonResult.forEach(function (result) {
    if (!result || !result.images) return;
    markdown += EOL;
    markdown += '### [' + result.name + '](' + result.url+ ')';
    markdown += BR;
    markdown += result.desc;
    markdown += BR;
    for (var i = 0; i < result.images.length; i++) {
      var image = result.images[i];
      markdown += '![' + image.alt + '](' + image.src + ')';
      markdown += BR;
    }
    markdown += '------' + BR;
  });
  return markdown;
};
