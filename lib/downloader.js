const fs = require('fs');
const path = require('path');
const bytes = require('bytes');
const Utils = require('./utils.js');

const FILE_DIR = '../files';

module.exports = class Downloader {
  constructor(config, logger, conn) {
    this.config = config;
    this.logger = logger;
    this.conn = conn;
    this.utils = new Utils(logger);
  }

  downloadDescribe(sObject) {
    const self = this;
    return new Promise((resolve, reject) => {
      self.conn.sobject(sObject).describe().then(meta => {
        const filePath = path.join(__dirname, FILE_DIR, '/describe/', sObject + '.json');
        fs.writeFileSync(filePath, JSON.stringify(meta.fields), 'utf-8');
        const stats = fs.statSync(filePath);

        resolve(stats.size);
      }).catch(function(err) {
        Promise.reject(err);
        console.log(err);
        console.log(err.stack);
      });
    });
  }

  downloadMetadata(sobjectList) {
    const self = this;
    return new Promise((resolve, reject) => {
      self.conn.metadata.read('CustomObject', sobjectList).then(metadata => {
        let filePath = '';


        if (sobjectList.length === 1) {
          let fields = metadata.fields;
          fields.sort(self.utils.sortByProperty('fullName'));
          filePath = path.join(__dirname, FILE_DIR, '/metadata/', metadata.fullName + '.json');
          fs.writeFileSync(filePath, JSON.stringify(metadata), 'utf-8');
        } else {
          for (let i = 0; i < metadata.length; i++) {
            let fields = metadata[i].fields;
            if (!Array.isArray(fields) || (Array.isArray(fields) && (fields !== undefined || fields.length > 0))) {
              // Manage single object or an object array
              if(!Array.isArray(fields)){
                let fieldsArray = new Array();
                fieldsArray.push(fields);
                fields = fieldsArray;
                metadata[i].fields = fields;
              }

              filePath = path.join(__dirname, FILE_DIR, '/metadata/', metadata[i].fullName + '.json');
              fs.writeFileSync(filePath, JSON.stringify(metadata[i]), 'utf-8');
            } else {
              self.config.objects.splice(self.config.objects.indexOf(metadata[i]), 1);
            }
          }
        }
        const stats = fs.statSync(filePath);

        resolve(stats.size);
      }).catch(function(err) {
        Promise.reject(err);
        console.log(err.message);
        console.log(err.stack);
      });
    });
  }

  execute() {
    const promise = new Promise((resolve, reject) => {
      const self = this;

      this.logger('Downloading...');

      let downloadArray = new Array();

      for (let object of self.config.objects) {
        downloadArray.push(self.downloadDescribe(object));
      }

      let loop = ~~(self.config.objects.length / 10);
      if (self.config.objects.length % 10 > 0)
        loop++;

      let j = 0;
      for (let i = 0; i < loop; i++) {
        let objectList = self.config.objects.slice(j, j + 10);
        j += 10;
        downloadArray.push(self.downloadMetadata(objectList));
      }

      Promise.all(
        downloadArray
      ).then(results => {
        let total = 0;
        for (let fileSize of results) {
          total += fileSize;
        }
        resolve(bytes.format(total, {
          decimalPlaces: 2
        }));
      }).catch(reject);
    });
    return promise;
  }
}
