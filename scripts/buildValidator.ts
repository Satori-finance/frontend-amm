// @ts-ignore
import {resolve, join} from 'path'
// @ts-ignore
import {writeFileSync} from 'fs'
import loadTsconfig from 'tsconfig-loader'

import * as TJS from "typescript-json-schema"
import {getTypeFiles} from "./getTypeFiles"
import * as t from "./template"

// @ts-ignore
const tsconfig = loadTsconfig({cwd: process.cwd()});

// optionally pass a base path
const basePath = resolve('./src/type');

const filenames = getTypeFiles(basePath + '/validatable')

const program = TJS.getProgramFromFiles(filenames, tsconfig ? Object.assign({}, tsconfig.tsConfig.compilerOptions, {strict: false, strictNullChecks: true, strictPropertyInitialization: true}) : {});

const generator = TJS.buildGenerator(program, {
  rejectDateType: true,
  aliasRef: true,
  required: true,
  topRef: true,
  strictNullChecks: true,
  excludePrivate: true,
  ignoreErrors: true,
});

if (!generator) {
  throw new Error('Did not expect generator to be null');
}

const symbols = generator.getMainFileSymbols(
  program,
  filenames
);
const schema = generator.getSchemaForSymbols(
  symbols,
  true,
);

const result = [
  t.TSLINT_DISABLE,
  t.GENERATED_COMMENT,
  t.IMPORT_AJV(tsconfig ? tsconfig.tsConfig.compilerOptions : {esModuleInterop: true, module: 'esnext'}),
  t.importNamedTypes(symbols, './index'),
  t.declareAJV({}),
  t.exportNamed(symbols),
  t.declareSchema('Schema', schema),
  t.addSchema('Schema'),
  ...symbols.map(s => t.initValidator(s)),
  ...symbols.map(s => t.initValidatorFunc(s)),
].join('\n');
writeFileSync(join(basePath, 'index.validator.ts'), result);
