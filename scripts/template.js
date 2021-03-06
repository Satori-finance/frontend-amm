"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
exports.initValidatorFunc = exports.initValidator = exports.validateKoaRequestOverload = exports.compileSchema = exports.validateType = exports.DECLARE_VALIDATE_TYPE = exports.addSchema = exports.declareSchema = exports.exportNamed = exports.declareAJV = exports.importType = exports.importDefaultType = exports.importNamedTypes = exports.IMPORT_AJV = exports.GENERATED_COMMENT = exports.TSLINT_DISABLE = void 0;
var stringify = require('json-stable-stringify');
exports.TSLINT_DISABLE = "/* eslint-disable */";
exports.GENERATED_COMMENT = "// generated by typescript-json-validator";
exports.IMPORT_AJV = function (tsConfig) {
    return tsConfig.allowSyntheticDefaultImports ||
        (tsConfig.esModuleInterop && /^es/.test(tsConfig.module)) ||
        tsConfig.module === 'system'
        ? "import Ajv from 'ajv';"
        : "import Ajv = require('ajv');";
};
exports.importNamedTypes = function (names, relativePath) {
    return "import {" + names.join(', ') + "} from '" + relativePath + "';";
};
exports.importDefaultType = function (name, relativePath) {
    return "import " + name + " from '" + relativePath + "';";
};
exports.importType = function (name, relativePath, _a) {
    var isNamedExport = _a.isNamedExport;
    return isNamedExport
        ? exports.importNamedTypes([name], relativePath)
        : exports.importDefaultType(name, relativePath);
};
exports.declareAJV = function (options) {
    return "export const ajv = new Ajv(" + stringify(__assign({ coerceTypes: false, allErrors: true }, options)) + ");\n\najv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-06.json'));\n";
};
exports.exportNamed = function (names) { return "export {" + names.join(', ') + "};"; };
exports.declareSchema = function (name, schema) {
    return "export const " + name + " = " + stringify(schema, { space: 2 }) + ";";
};
exports.addSchema = function (name) { return "ajv.addSchema(" + name + ", '" + name + "')"; };
exports.DECLARE_VALIDATE_TYPE = "export type ValidateFunction<T> = ((data: unknown) => data is T) & Pick<Ajv.ValidateFunction, 'errors'>";
exports.validateType = function (typeName) {
    return "ValidateFunction<" + typeName + ">";
};
exports.compileSchema = function (schemaName, typeName) {
    return "ajv.compile(" + schemaName + ") as " + exports.validateType(typeName);
};
function typeOf(typeName, property, schema) {
    if (schema.definitions && schema.definitions[typeName]) {
        var typeSchema = schema.definitions[typeName];
        if (typeSchema &&
            typeSchema.properties &&
            Object.keys(typeSchema.properties).includes(property)) {
            return typeName + "['" + property + "']";
        }
    }
    return 'unknown';
}
exports.validateKoaRequestOverload = function (typeName, schema) {
    return "export function validateKoaRequest(typeName: '" + typeName + "'): (ctx: KoaContext) => {\n  params: " + typeOf(typeName, 'params', schema) + ",\n  query: " + typeOf(typeName, 'query', schema) + ",\n  body: " + typeOf(typeName, 'body', schema) + ",\n};";
};
exports.initValidator = function (typeName) {
    return "const validator" + typeName + ": any = ajv.getSchema(`Schema#/definitions/" + typeName + "`);";
};
exports.initValidatorFunc = function (typeName) {
    return "export function parse" + typeName + "(value: unknown): " + typeName + " {\n  if (!validator" + typeName + ") {\n    throw new Error(`No validator defined for Schema#/definitions/" + typeName + "`)\n  }\n\n  const valid = validator" + typeName + "(value);\n\n  if (!valid) {\n    throw new Error(\n        'Invalid ' + '" + typeName + "' + ': ' + ajv.errorsText(validator" + typeName + ".errors!.filter((e: any) => e.keyword !== 'if'), {dataVar: '" + typeName + "'}),\n    );\n  }\n\n  return " + typeName + ".fromData(value).convert();\n}";
};
