"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
// @ts-ignore
var path_1 = require("path");
// @ts-ignore
var fs_1 = require("fs");
var tsconfig_loader_1 = __importDefault(require("tsconfig-loader"));
var TJS = __importStar(require("typescript-json-schema"));
var getTypeFiles_1 = require("./getTypeFiles");
var t = __importStar(require("./template"));
// @ts-ignore
var tsconfig = tsconfig_loader_1["default"]({ cwd: process.cwd() });
// optionally pass a base path
var basePath = path_1.resolve('./src/type');
var filenames = getTypeFiles_1.getTypeFiles(basePath + '/validatable');
var program = TJS.getProgramFromFiles(filenames, tsconfig ? Object.assign({}, tsconfig.tsConfig.compilerOptions, { strict: false, strictNullChecks: true, strictPropertyInitialization: true }) : {});
var generator = TJS.buildGenerator(program, {
    rejectDateType: true,
    aliasRef: true,
    required: true,
    topRef: true,
    strictNullChecks: true,
    excludePrivate: true,
    ignoreErrors: true
});
if (!generator) {
    throw new Error('Did not expect generator to be null');
}
var symbols = generator.getMainFileSymbols(program, filenames);
var schema = generator.getSchemaForSymbols(symbols, true);
var result = __spreadArrays([
    t.TSLINT_DISABLE,
    t.GENERATED_COMMENT,
    t.IMPORT_AJV(tsconfig ? tsconfig.tsConfig.compilerOptions : { esModuleInterop: true, module: 'esnext' }),
    t.importNamedTypes(symbols, './index'),
    t.declareAJV({}),
    t.exportNamed(symbols),
    t.declareSchema('Schema', schema),
    t.addSchema('Schema')
], symbols.map(function (s) { return t.initValidator(s); }), symbols.map(function (s) { return t.initValidatorFunc(s); })).join('\n');
fs_1.writeFileSync(path_1.join(basePath, 'index.validator.ts'), result);
