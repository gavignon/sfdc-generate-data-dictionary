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
  if (typeof config.apiVersion === 'undefined' || config.apiVersion === null) {
    config.apiVersion = '48.0';
  }
  if (typeof config.output === 'undefined' || config.output === null) {
    config.output = '.';
  }
  if (typeof config.debug === 'undefined' || config.debug === null) {
    config.debug = false;
  }
  config.debug = (config.debug === "true" || config.debug === true);

  if (typeof config.excludeManagedPackage === 'undefined' || config.excludeManagedPackage === null) {
    config.excludeManagedPackage = true;
  }
  config.excludeManagedPackage = (config.excludeManagedPackage === "true" || config.excludeManagedPackage === true);

  if (typeof config.projectName === 'undefined' || config.projectName === null) {
    config.projectName = 'PROJECT';
  }
  if (typeof config.allCustomObjects === 'undefined' || config.allCustomObjects === null) {
    config.allCustomObjects = true;
  }
  config.allCustomObjects = (config.allCustomObjects === "true" || config.allCustomObjects === true);

  if (typeof config.lucidchart === 'undefined' || config.lucidchart === null) {
    config.lucidchart = true;
  }
  config.lucidchart = (config.lucidchart === "true" || config.lucidchart === true);

  if (typeof config.standardObjects === 'undefined' || config.standardObjects === null) {
    config.objects = [
      'Account',
      'Contact',
      'User'
    ];
  } else {
    // If an array is passed to the module
    if (Array.isArray(config.standardObjects)) {
      config.objects = config.standardObjects;
    } else {
      // Check and parse standObjects string for command-line
      try {
        config.objects = config.standardObjects.split(',');
      } catch (e) {
        let errorMessage = 'Unable to parse standardObjects parameter';
        if (config.debug)
          errorMessage += ' : ' + e;
        throw new Error(errorMessage);
      }
    }
  }
  if (typeof config.techFieldPrefix === 'undefined' || config.techFieldPrefix === null) {
    config.techFieldPrefix = 'TECH_';
  }
  if (typeof config.hideTechFields === 'undefined' || config.hideTechFields === null) {
    config.hideTechFields = false;
  }
  if (typeof config.columns === 'undefined' || config.columns === null) {
    config.columns = {
      'ReadOnly': 5,
      'Mandatory': 3,
      'Name': 25,
      'Description': 90,
      'Helptext': 90,
      'APIName': 25,
      'Type': 27,
      'Values': 45
    };
  }

  var utils = new Utils();

  // Clean folders that contain API files
  if (config.cleanFolders) {
    const statusRmDescribe = utils.rmDir(__dirname + '/files/describe', '.json', false);
    const statusRmMetadata = utils.rmDir(__dirname + '/files/metadata', '.json', false);
    logger('File folders cleaned');
  }

  // Main promise
  const promise = new Promise((resolve, reject) => {

    const conn = new jsforce.Connection({
      loginUrl: config.loginUrl,
      version: config.apiVersion
    });

    // Salesforce connection
    conn.login(config.username, config.password).then(result => {
      logger('Connected as ' + config.username);
      if (config.debug) {
        utils.log('Connected as ' + config.username, config);
      }

      if (config.allCustomObjects) {
        conn.describeGlobal().then(res => {
          for (let i = 0; i < res.sobjects.length; i++) {
            let object = res.sobjects[i];
            if (config.objects === undefined)
              config.objects = [];

            // If the sObject is a real custom object
            if (object.custom && (object.name.indexOf('__c') !== -1)) {
              if (config.debug)
                utils.log('# excludeManagedPackage (' + config.excludeManagedPackage + '): ' + object.name, config);

              if (config.excludeManagedPackage) {
                if ((object.name.split('__').length - 1 < 2))
                  config.objects.push(object.name);
              } else {
                config.objects.push(object.name);
              }
            }
          }

          if (config.debug)
            utils.log(JSON.stringify(config.objects), config);

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
            return builder.generate();

          }).then(result => {
            resolve();
          });

        }
      }
    }).catch(reject);
  });
  return promise;
};
