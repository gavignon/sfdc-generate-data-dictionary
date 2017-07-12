'use strict';
const jsforce = require('jsforce');
const Downloader = require('./lib/downloader.js');
const ExcelBuilder = require('./lib/excelbuilder.js');
const Utils = require('./lib/utils.js');

module.exports = (config, logger) => {
  // Check all mandatory config options
  if (typeof config.username === 'undefined' || config.username === null ||
    typeof config.password === 'undefined' || config.password === null) {
    throw new Error('Not enough config options');
  }

  // Set default values
  if (typeof config.loginUrl === 'undefined' || config.loginUrl === null) {
    config.loginUrl = 'https://login.salesforce.com';
  }
  if (typeof config.output === 'undefined' || config.output === null) {
    config.output = '.';
  }
  if (typeof config.projectName === 'undefined' || config.projectName === null) {
    config.projectName = 'PROJECT';
  }
  if (typeof config.allCustomObjects === 'undefined' || config.allCustomObjects === null) {
    config.allCustomObjects = true;
  }
  if (typeof config.objects === 'undefined' || config.objects === null) {
    config.objects = [
      'Account',
      'Contact'
    ];
  }
  if (typeof config.columns === 'undefined' || config.columns === null) {
    config.columns = {
      'ReadOnly': 5,
      'Mandatory': 3,
      'Name': 25,
      'Description': 90,
      'APIName': 25,
      'Type': 27,
      'Values': 45
    };
  }

  // Clean folders that contain API files
  if (config.cleanFolders) {
    let utils = new Utils();
    const statusRmDescribe = utils.rmDir(__dirname + '/files/describe', '.json', false);
    const statusRmMetadata = utils.rmDir(__dirname + '/files/metadata', '.json', false);
    logger('File folders cleaned');
  }

  // Main promise
  const promise = new Promise((resolve, reject) => {

    const conn = new jsforce.Connection({
      loginUrl: config.loginUrl
    });

    // Salesforce connection
    conn.login(config.username, config.password).then(result => {
      logger('Connected as ' + config.username);
      if (config.allCustomObjects) {
        conn.describeGlobal().then(res => {
          for (let i = 0; i < res.sobjects.length; i++) {
            let object = res.sobjects[i];
            if (config.objects === undefined)
              config.objects = [];

            // If the sObject is a real custom object
            if (object.custom && (object.name.indexOf('__c') !== -1) && (object.name.split('__').length - 1 < 2))
              config.objects.push(object.name);
          }

          const downloader = new Downloader(config, logger, conn);
          const builder = new ExcelBuilder(config, logger);

          // Download metadata files
          downloader.execute().then(result => {
            logger(result + ' downloaded');
            // Generate the excel file
            builder.generate().then(result => {
              resolve();
            });
          })
        });
      } else {
        if (config.objects.length > 0) {
          const downloader = new Downloader(config, logger, conn);
          const builder = new ExcelBuilder(config, logger);

          // Download metadata files
          downloader.execute().then(result => {
            logger(result + ' downloaded');
            // Generate the excel file
            builder.generate().then(result => {
              resolve();
            });
          })
        }
      }
    }).catch(reject);
  });
  return promise;
};
