'use strict';

var url = require('url');
var EOL = require('os').EOL;
var BR = EOL + EOL;

var Registry = require('npm-registry');
var showdown = require('showdown');
var cheerio = require('cheerio');

var npm = new Registry();
var converter = new showdown.Converter();

var FILTER_URL = [
  'img.shields.io',
  'nodei.co',
  'badges.gitter.im',
  'travis-ci.org',
  'issuestats.com',
  'codeclimate.com',
  'david-dm.org',
  'circleci.com'
];

/**
 * 通过 packageInfo 获取 readme 上的 images
 */
exports.fetchByPackageInfo = function (packageInfo, cb) {
  var name = packageInfo.name;
  var desc = packageInfo.description;

  npm.packages.get(name, function (err, data) {
    if (err) {
        console.log('npm.packages.get err:', name, err);
        return cb(null, err);
    }
    if (!data || !data[0] || !data[0].readme) return cb(null, 'no readme');

    var packageDetail = data[0];

    var html = converter.makeHtml(packageDetail.readme);
    var $ = cheerio.load(html);
    var imgElements = $('img');
    if (imgElements.length === 0) return cb(null, 'no img');

    var result = {};
    result.name = name;
    result.url = packageDetail.homepage ? packageDetail.homepage.url :
      'https://www.npmjs.com/package/' + name;
    result.desc = desc;
    result.images = [];
    for (var j = 0; j < imgElements.length; j++) {
      var img = imgElements[j].attribs;
      if (!img.src) continue;

      // 图片链接转换
      if (img.src.indexOf('http') !== 0) {
        img.src = _convertImagePath(packageDetail.github, img.src);
      }

      // 图片链接过滤
      var urlObj = url.parse(img.src);
      if (~FILTER_URL.indexOf(urlObj.host))
        continue;

      result.images.push(img);
    }
    cb(null, result);
  });
};

function _convertImagePath (github, path) {
  if (!github) return path;

  var rawPath = 'https://raw.githubusercontent.com/';
  rawPath += github.user + '/' + github.repo + '/master/';
  rawPath = url.resolve(rawPath, path);
  return rawPath;
}


/**
 * 将 JSON 格式的结果转成 MarkDown 格式
 */
exports.jsonResultToMarkdown = function (jsonResult) {
  var markdown = BR;
  markdown += 'Update date: ' + new Date;
  markdown += BR + '------' + BR;
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
