# sfdc-generate-data-dictionary

generate data dictionary from a Salesforce Org

## Getting Started

Works in Unix like system. Windows is not tested.

### Installing

```
npm install -g sfdc-generate-data-dictionary
```

## Usage

### Command Line

```
$ sgd -h

  Usage: sgd [options]

  generate data dictionary from a Salesforce Org

  Options:

    -u, --username               salesforce username
    -p, --password               salesforce user password
    -l, --loginUrl               salesforce login URL [https://login.salesforce.com]
    -c, --customObjects          retrieve all custom objects [true]
    -d, --deleteFolders          delete/clean temp folders [true]
    -o, --output                 salesforce data dictionary directory path [.]
```

### Module

```
  var sgd = require('sfdc-generate-data-dictionary');

  sgd({
      'username': '',
      'password': options.password,
      'loginUrl': options.loginUrl,
      'projectName': '',
      'allCustomObjects': true,
      'cleanFolders': true,
      'output':'.'
      }, console.log);
```

## Built With

- [commander](https://github.com/tj/commander.js/) - The complete solution for node.js command-line interfaces, inspired by Ruby's commander.
- [bytes](https://github.com/visionmedia/bytes.js) - Utility to parse a string bytes to bytes and vice-versa.
- [excel4node](https://github.com/amekkawi/excel4node) - Node module to allow for easy Excel file creation.
- [jsforce](https://github.com/jsforce/jsforce) - Salesforce API Library for JavaScript applications (both on Node.js and web browser)

## Versioning

[SemVer](http://semver.org/) is used for versioning.

## Authors

- **Gil Avignon** - _Initial work_ - [gavignon](https://github.com/gavignon)

## License

This project is licensed under the MIT License - see the <LICENSE.md> file for details
