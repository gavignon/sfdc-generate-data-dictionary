const fs = require('fs');
const excel = require('excel4node');
const path = require('path');
const Utils = require('./utils.js');

const FILE_DIR = '../files';
const MAX_PICKLIST_VALUES = 2;

// Styles
var workbook = new excel.Workbook();
var startGeneration;

var global = workbook.createStyle({
  font: {
    size: 12
  },
  alignment: {
    wrapText: true,
    vertical: 'center',
  },
  border: {
    left: {
      style: 'thin',
      color: 'b8b6b8'
    },
    right: {
      style: 'thin',
      color: 'b8b6b8'
    },
    top: {
      style: 'thin',
      color: 'b8b6b8'
    },
    bottom: {
      style: 'thin',
      color: 'b8b6b8'
    }
  }
});

var header = workbook.createStyle({
  font: {
    bold: true,
    color: 'FFFFFF'
  },
  alignment: {
    horizontal: 'center'
  },
  fill: {
    type: 'pattern',
    patternType: 'solid',
    fgColor: '019cdd'
  }
});

var subHeader = workbook.createStyle({
  font: {
    bold: true
  },
  fill: {
    type: 'pattern',
    patternType: 'solid',
    fgColor: 'F5F4F2' // HTML style hex value. optional. defaults to black
  }
});

var category = workbook.createStyle({
  font: {
    // bold: true,
    color: '60809f'
  },
  fill: {
    type: 'pattern',
    patternType: 'solid',
    fgColor: 'dbeaf7'
  }
});

var validationCategory = workbook.createStyle({
  font: {
    // bold: true,
    color: '703026'
  },
  fill: {
    type: 'pattern',
    patternType: 'solid',
    fgColor: 'ffa293'
  }
});

var indentLeft = workbook.createStyle({
  alignment: {
    indent: 1
  }
});

var centerAlign = workbook.createStyle({
  alignment: {
    horizontal: 'center'
  }
});
var bold = workbook.createStyle({
  font: {
    bold: true
  }
});
var italic = workbook.createStyle({
  font: {
    italics: true
  }
});
var redColor = workbook.createStyle({
  font: {
    color: 'FF0000'
  }
});

var rowColor = workbook.createStyle({
  fill: {
    type: 'pattern',
    patternType: 'solid',
    fgColor: 'ffffff'
  }
});

var alternateRowColor = workbook.createStyle({
  fill: {
    type: 'pattern',
    patternType: 'solid',
    fgColor: 'f2f1f3'
  }
});

module.exports = class Downloader {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.utils = new Utils();
  }

  createHeader(worksheet) {

    var columns = this.config.columns;
    var columnsKeys = Object.keys(this.config.columns);

    // Global sizes
    worksheet.row(1).setHeight(40);
    worksheet.row(2).setHeight(20);

    if (columnsKeys.indexOf('ReadOnly') > -1)
      worksheet.column(columnsKeys.indexOf('ReadOnly') + 1).setWidth(columns.ReadOnly);
    if (columnsKeys.indexOf('Mandatory') > -1)
      worksheet.column(columnsKeys.indexOf('Mandatory') + 1).setWidth(columns.Mandatory);
    if (columnsKeys.indexOf('Name') > -1)
      worksheet.column(columnsKeys.indexOf('Name') + 1).setWidth(columns.Name);
    if (columnsKeys.indexOf('Description') > -1)
      worksheet.column(columnsKeys.indexOf('Description') + 1).setWidth(columns.Description);
    if (columnsKeys.indexOf('APIName') > -1)
      worksheet.column(columnsKeys.indexOf('APIName') + 1).setWidth(columns.APIName);
    if (columnsKeys.indexOf('Type') > -1)
      worksheet.column(columnsKeys.indexOf('Type') + 1).setWidth(columns.Type);
    if (columnsKeys.indexOf('Values') > -1)
      worksheet.column(columnsKeys.indexOf('Values') + 1).setWidth(columns.Values);

    // Build header and subheader
    worksheet.cell(1, 1, 1, columnsKeys.length, true).string('SALESFORCE').style(global).style(header);

    if (columnsKeys.indexOf('ReadOnly') > -1)
      worksheet.cell(2, columnsKeys.indexOf('ReadOnly') + 1).string('R/O').style(global).style(subHeader).style(centerAlign);
    if (columnsKeys.indexOf('Mandatory') > -1)
      worksheet.cell(2, columnsKeys.indexOf('Mandatory') + 1).string('M').style(global).style(subHeader).style(centerAlign);
    if (columnsKeys.indexOf('Name') > -1)
      worksheet.cell(2, columnsKeys.indexOf('Name') + 1).string('Field Name').style(global).style(subHeader).style(indentLeft);
    if (columnsKeys.indexOf('Description') > -1)
      worksheet.cell(2, columnsKeys.indexOf('Description') + 1).string('Description').style(global).style(subHeader).style(indentLeft);
    if (columnsKeys.indexOf('APIName') > -1)
      worksheet.cell(2, columnsKeys.indexOf('APIName') + 1).string('API Name').style(global).style(subHeader).style(indentLeft);
    if (columnsKeys.indexOf('Type') > -1)
      worksheet.cell(2, columnsKeys.indexOf('Type') + 1).string('Type').style(global).style(subHeader).style(centerAlign);
    if (columnsKeys.indexOf('Values') > -1)
      worksheet.cell(2, columnsKeys.indexOf('Values') + 1).string('Values / Formula').style(global).style(subHeader).style(indentLeft);

    return 3;
  }

  mapFields(fields) {
    var fieldMap = {};

    for (var i = 0; i < fields.length; i++) {
      var field = fields[i];
      fieldMap[field.fullName] = field;
    }

    return fieldMap;
  }

  writeFields(worksheet, fields, line, validationRules) {


    var columns = this.config.columns;
    var columnsKeys = Object.keys(this.config.columns);

    var indexRow = 1;

    // Foreach field
    for (var j = 0; j < fields.length; j++) {
      var field = fields[j];

      var isCustom = field.custom;

      if (!isCustom && j == 0) {
        worksheet.cell(line, 1, line, columnsKeys.length, true).string('Standard Fields').style(global).style(category).style(indentLeft);
        // Row height
        worksheet.row(line).setHeight(25);
        line++;
        indexRow = 1;
      }

      var rowStyle = rowColor;
      if (indexRow % 2 == 0) {
        rowStyle = alternateRowColor;
      }


      if (columnsKeys.indexOf('ReadOnly') > -1)
        worksheet.cell(line, columnsKeys.indexOf('ReadOnly') + 1).string(!field.updateable ? "✓" : '☐').style(global).style(centerAlign).style(rowStyle);
      if (columnsKeys.indexOf('Mandatory') > -1)
        worksheet.cell(line, columnsKeys.indexOf('Mandatory') + 1).string(!field.nillable && field.updateable && field.type != 'boolean' ? "*" : '').style(global).style(centerAlign).style(rowStyle).style(redColor);
      if (columnsKeys.indexOf('Name') > -1)
        worksheet.cell(line, columnsKeys.indexOf('Name') + 1).string(field.label != null ? field.label : field.name).style(global).style(bold).style(rowStyle).style(indentLeft);
      if (columnsKeys.indexOf('Description') > -1)
        worksheet.cell(line, columnsKeys.indexOf('Description') + 1).string(field.description != null ? field.description : '').style(global).style(rowStyle).style(indentLeft);
      if (columnsKeys.indexOf('APIName') > -1)
        worksheet.cell(line, columnsKeys.indexOf('APIName') + 1).string(field.name).style(global).style(rowStyle).style(indentLeft);

      // tooling
      // worksheet.cell(line, columnsKeys.indexOf('APIName') + 4).string(field.LastModifiedDate != null ? field.LastModifiedDate : '').style(global).style(rowStyle).style(indentLeft);

      // Type property
      var type = this.utils.capitalize(field.type);

      if (type == 'Int' || type == 'Double') {
        type = 'Number';
      }
      if (type == 'Number' || type == 'Currency') {
        var precision = parseInt(field.precision);
        var scale = parseInt(field.scale);
        var finalPrecision = precision - scale;

        type = type + '(' + finalPrecision + ',' + field.scale + ')';
      }

      if (type == 'Boolean') {
        type = 'Checkbox';
      }

      if (type == 'Reference' && field.referenceTo != null) {
        type = 'Lookup(' + field.referenceTo + ')';
      }
      if (type == 'MasterDetail') {
        type = 'MasterDetail(' + field.relationshipLabel + ')';
      }
      if ((type == 'Text' || type == 'Textarea' || type == 'String') && field.length != null) {
        type = 'Text(' + field.length + ')';
      }

      if (field.calculatedFormula != null) {
        type = 'Formula(' + field.type + ')';
      }

      if (!field.nillable) {
        type += ' (Unique)';
      }
      if (field.externalId) {
        type += '(External ID)';
      }

      if (columnsKeys.indexOf('Type') > -1)
        worksheet.cell(line, columnsKeys.indexOf('Type') + 1).string(type).style(centerAlign).style(global).style(italic).style(rowStyle).style(indentLeft);


      // Values property
      var value = '';

      if (type == 'Picklist' || type == 'MultiselectPicklist') {
        if (field.globalPicklist != null) {
          value = 'globalPicklist(' + field.globalPicklist + ')';
        } else {
          var valuesArray = field.picklistValues;
          var k = 0;
          while (k < valuesArray.length && k < MAX_PICKLIST_VALUES) {
            value += valuesArray[k].value + '\n';
            k++;
          }
          if (valuesArray.length > MAX_PICKLIST_VALUES * 2) {
            value += '...\n';
          }
          if (valuesArray.length - MAX_PICKLIST_VALUES >= MAX_PICKLIST_VALUES) {
            k = valuesArray.length - 1
            while (k >= valuesArray.length - MAX_PICKLIST_VALUES) {
              value += valuesArray[k].value + '\n';
              k--;
            }
          }
          if (valuesArray.length > MAX_PICKLIST_VALUES * 2) {
            value += '(Total: ' + valuesArray.length + ' values)';
          }
        }
      }

      if (field.calculatedFormula != null) {
        value = field.calculatedFormula;
      }

      if (columnsKeys.indexOf('Values') > -1)
        worksheet.cell(line, columnsKeys.indexOf('Values') + 1).string(value).style(global).style(rowStyle).style(indentLeft);

      if(((!field.label.length < 24) || (!field.name.length < 24)) && !value.includes('\n'))
        worksheet.row(line).setHeight(25);
      line++;
      indexRow++;

      if (!isCustom && j + 1 < fields.length && fields[j + 1].custom) {
        worksheet.cell(line, 1, line, columnsKeys.length, true).string('Custom Fields').style(global).style(category).style(indentLeft);
        // Row height
        worksheet.row(line).setHeight(25);
        line++;
        indexRow = 1;
      }
    }

    if (validationRules !== undefined) {

      worksheet.cell(line, 1, line, columnsKeys.length, true).string('Validation Rules').style(global).style(validationCategory).style(indentLeft);
      // Row height
      worksheet.row(line).setHeight(25);
      line++;


      worksheet.cell(line, 1, line, 2, true).string('Active').style(global).style(rowStyle).style(subHeader).style(centerAlign);
      worksheet.cell(line, 3).string('Name').style(global).style(rowStyle).style(subHeader).style(indentLeft);
      worksheet.cell(line, 4).string('Description').style(global).style(rowStyle).style(subHeader).style(indentLeft);
      worksheet.cell(line, 5).string('Error display field').style(global).style(rowStyle).style(subHeader).style(centerAlign);
      worksheet.cell(line, 6).string('Error message').style(global).style(rowStyle).style(subHeader).style(indentLeft);
      worksheet.cell(line, 7).string('Condition formula').style(global).style(rowStyle).style(subHeader).style(indentLeft);
      worksheet.row(line).setHeight(20);

      line++;
      indexRow = 1;

      if (Array.isArray(validationRules)) {
        for (var k = 0; k < validationRules.length; k++) {
          rowStyle = rowColor;
          if (indexRow % 2 == 0) {
            rowStyle = alternateRowColor;
          }

          worksheet.cell(line, 1, line, 2, true).string(validationRules[k].active ? "✓" : '☐').style(global).style(rowStyle).style(centerAlign);
          worksheet.cell(line, 3).string(validationRules[k].fullName != null ? validationRules[k].fullName : '').style(global).style(rowStyle).style(indentLeft);
          worksheet.cell(line, 4).string(validationRules[k].description != null ? validationRules[k].description : '').style(global).style(rowStyle).style(indentLeft);
          worksheet.cell(line, 5).string(validationRules[k].errorDisplayField != null ? validationRules[k].errorDisplayField : '').style(global).style(rowStyle).style(centerAlign);
          worksheet.cell(line, 6).string(validationRules[k].errorMessage != null ? validationRules[k].errorMessage : '').style(global).style(rowStyle).style(indentLeft);
          worksheet.cell(line, 7).string(validationRules[k].errorConditionFormula != null ? validationRules[k].errorConditionFormula : '').style(global).style(rowStyle).style(indentLeft);

          line++;
          indexRow++;
        }
      } else {
        rowStyle = rowColor;
        if (indexRow % 2 == 0) {
          rowStyle = alternateRowColor;
        }

        worksheet.cell(line, 1, line, 2, true).string(validationRules.active ? "✓" : '☐').style(global).style(rowStyle).style(centerAlign);
        worksheet.cell(line, 3).string(validationRules.fullName != null ? validationRules.fullName : '').style(global).style(rowStyle).style(indentLeft);
        worksheet.cell(line, 4).string(validationRules.description != null ? validationRules.description : '').style(global).style(rowStyle).style(indentLeft);
        worksheet.cell(line, 5).string(validationRules.errorDisplayField != null ? validationRules.errorDisplayField : '').style(global).style(rowStyle).style(centerAlign);
        worksheet.cell(line, 6).string(validationRules.errorMessage != null ? validationRules.errorMessage : '').style(global).style(rowStyle).style(indentLeft);
        worksheet.cell(line, 7).string(validationRules.errorConditionFormula != null ? validationRules.errorConditionFormula : '').style(global).style(rowStyle).style(indentLeft);

        line++;
        indexRow++;
      }
    }
  }

  generate() {
    const promise = new Promise((resolve, reject) => {
        this.logger('Generating...');

        let sObjects = this.config.objects;

        for (var i = 0; i < sObjects.length; i++) {
          var cur = i + 1;

          var worksheet = workbook.addWorksheet(sObjects[i]);
          var line = this.createHeader(worksheet);
          var describePath = path.join(__dirname, FILE_DIR, '/describe/' + sObjects[i] + '.json');
          var metadataPath = path.join(__dirname, FILE_DIR, '/metadata/' + sObjects[i] + '.json');

          if (fs.existsSync(describePath)) {
            var currentObjectFieldsDescribe = JSON.parse(fs.readFileSync(describePath));

            if (fs.existsSync(metadataPath)) {

              var currentObjectFieldsMetadata = JSON.parse(fs.readFileSync(metadataPath));
              var fieldsMap = this.mapFields(currentObjectFieldsMetadata.fields);

            }

            for (var j = 0; j < currentObjectFieldsDescribe.length; j++) {
              var field = currentObjectFieldsDescribe[j];
              var fieldName = currentObjectFieldsDescribe[j].name;

              if (fieldsMap[fieldName] != null) {
                var correspondingField = fieldsMap[fieldName];
                if (correspondingField.description != null)
                  currentObjectFieldsDescribe[j].description = correspondingField.description;

              }

            }
          }

          currentObjectFieldsDescribe.sort(this.utils.sortByTwoProperty('custom', 'name'));

          this.writeFields(worksheet, currentObjectFieldsDescribe, line, currentObjectFieldsMetadata.validationRules)

        }

        // Generate output Excel file
        var currentDate = new Date(Date.now());
        var currentDateString = currentDate.toISOString();
        currentDateString = currentDateString.substring(0, currentDateString.indexOf('T'));
        var fileName = this.config.projectName + '_Data_Dictionary_' + currentDateString + '.xlsx'
        var outputFile = path.join(this.config.output, fileName);
        this.logger('Saving ' + fileName + '...');
        workbook.write(outputFile);

        resolve();

    });
    return promise;
  }
}
