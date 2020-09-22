const { error } = require('console');
const readline = require('readline');
const fs = require('fs');

let input = [];
let defaultName;
let nameModel;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.prompt();

rl.question('Имя модели: ', (answer) => {
  if (!/^\w+/.test(answer)) throw error;
  nameModel = answer;
  defaultName = answer;
  setModel();
});

function setModel() {
  console.log('Введите модель: ');

  rl.on('line', (cmd) => {
    input.push(cmd);

    if (cmd.length === 0) {
      rl.close();
    }
  });

  rl.on('close', () => {
    createOutputFile();
    process.exit(0);
  });
}

function fileHandler() {
  fs.open(defaultName + '.ts', 'w', (err) => {
    if (err) throw err;
  });
}

function createOutputFile() {
  fileHandler();
  nameModel = nameModel.replace(/[_-]+[A-z]/g, (x) => { return x.toUpperCase(); });
  nameModel = nameModel.replace(/[A-z]/, (x) => { return x.toUpperCase(); }).replace(/[_-]/g, "");

  createDto(input, nameModel);
}

function createDto(input, name) {
  const checkType = input[0].match(/\w+[_-]*[A-z]*/gi);
  let objDto = {};

  if (checkType && checkType[0] === 'type') {
    objDto = findGoKeys(input, name);
  } else {
    objDto = findKeys(input, name);
  }

  const interfaceDto = createInterface(objDto, name);
  const classDto = createClass(objDto, name);
  const dto = createDtoFn(objDto, name);

  const model = interfaceDto + '\n' + classDto + '\n' + dto + '\n';

  fs.appendFileSync(defaultName + '.ts', model, (err) => {
    if (err) throw err;
  });
}

function findKeys(inputArray) {
  const keysModel = [];
  const typeModel = [];
  const defaultKeys = [];
  let objDto = {};

  let secondInput = [];
  let secondKeys = [];

  inputArray.forEach((item, index) => {
    const wordSymbol = item.match(/[{[}]/gi);
    const arrayWord = item.match(/\w+[_-]*[A-z]*/gi);

    if (secondKeys.length === 1 && arrayWord && arrayWord.length === 1) {
      secondKeys.push(arrayWord[0]);
    }

    if (index !== 0 && wordSymbol && wordSymbol.includes('[')) {
      secondKeys.push(arrayWord[0]);
    }

    if (index !== 0 && wordSymbol && wordSymbol.includes('{')) {
      secondInput.push(item);
    }

    if (secondKeys.length === 1 && arrayWord && arrayWord.length > 1) {
      secondInput.push(item);
    }

    if (index !== inputArray.length - 1 && secondKeys.length === 1 && wordSymbol && wordSymbol.includes('}')) {
      secondInput.push(item);
      const secondName = secondKeys[0].replace(/[A-z]/, function (x) { return x.toUpperCase(); });
      createDto(secondInput, nameModel + secondName);
      secondKeys.push(nameModel + secondName);
    }

    if (arrayWord && arrayWord[1] && secondKeys.length === 0) {
      defaultKeys.push(arrayWord[0]);
      arrayWord[0] = arrayWord[0].replace(/( |^)[A-z]/g, (x) => { return x.toLowerCase(); });
      arrayWord[0] = arrayWord[0].replace(/[_-]+[A-z]/gi, (x) => { return x.toUpperCase(); });
      arrayWord[0] = arrayWord[0].replace(/[_-]/g, "");
      keysModel.push(arrayWord[0]);

      if (arrayWord[1].match(/^[-\+]?\d+/) === null) {
        typeModel.push(arrayWord[1])
      } else {
        typeModel.push('number');
      }
    }

    if (secondKeys.length === 2) {
      defaultKeys.push(secondKeys[0]);
      secondKeys[0] = secondKeys[0].replace(/( |^)[A-z]/g, (x) => { return x.toLowerCase(); });
      secondKeys[0] = secondKeys[0].replace(/[_-]+[A-z]/gi, (x) => { return x.toUpperCase(); });
      secondKeys[0] = secondKeys[0].replace(/[_-]/g, "");
      keysModel.push(secondKeys[0]);

      if (secondKeys[1].match(/^[-\+]?\d+/) === null) {
        typeModel.push(secondKeys[1]);
      } else {
        typeModel.push('number');
      }

      secondKeys = [];
      secondInput = [];
    }
  });

  objDto['keys'] = keysModel;
  objDto['types'] = typeModel;
  objDto['defKeys'] = defaultKeys;

  return objDto;
}

function findGoKeys(inputArray) {
  const keysModel = [];
  const typeModel = [];
  const defaultKeys = [];
  let objDto = {};

  inputArray.forEach((item) => {
    const wordSymbol = item.match(/[{}]/gi);
    const arrayWord = item.match(/\w+[_-]*[A-z]*/gi);

    if (!wordSymbol && arrayWord) {
      let lowKey = arrayWord[arrayWord.length - 1].replace(/[A-z]/gi, (x) => { return x.toLowerCase(); });
      lowKey = lowKey.replace(/[_]+[a-z]/g, (x) => { return x.toUpperCase(); });
      lowKey = lowKey.replace(/[_]+/g, '');

      const typeTs = (arrayWord[1] === 'bool') ? 'boolean'
        : (arrayWord[1] === 'int') ? 'number'
          : (arrayWord[1] === 'interface{}') ? 'any' : arrayWord[1];

      keysModel.push(lowKey);
      typeModel.push(typeTs);
      defaultKeys.push(arrayWord[arrayWord.length - 1]);
    }
  })

  objDto['keys'] = keysModel;
  objDto['types'] = typeModel;
  objDto['defKeys'] = defaultKeys;

  return objDto;
}

function createInterface(objDto, name) {
  let str = 'export interface ' + name + 'Resp' + ' { \n';
  for (let i = 0; i < objDto.keys.length; i++) {
    str += ' ' + objDto.keys[i] + ': ' + objDto.types[i] + ';\n';
  }
  str += '}\n';
  return str;
}

function createClass(objDto, name) {
  let str = 'export class ' + name + ' { \n'
  for (let i = 0; i < objDto.keys.length; i++) {
    str += ' public ' + objDto.keys[i] + ': ' + objDto.types[i] + ';\n';
  }
  str += '\n constructor(data: ' + name + 'Resp) { \n'
    + '  Object.assign(this, data); \n }\n';
  str += '}\n';
  return str;
}

function createDtoFn(objDto, name) {
  let str = 'export const ' + name + 'DtoFn = (data: any) => new ' + name + '({\n';
  for (let i = 0; i < objDto.keys.length; i++) {
    str += ' ' + objDto.keys[i] + ': data.' + objDto.defKeys[i] + ',\n';
  }
  str += '});\n';
  return str;
}

