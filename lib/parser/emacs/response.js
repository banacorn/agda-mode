"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const _ = require("lodash");
const error_1 = require("../../error");
const error_2 = require("./error");
function parseResponses(raw, fileType) {
    const lines = raw.trim().split('\n');
    return Promise.map(lines, (line) => parseResponse(line, fileType))
        .then(prioritiseResponses);
}
exports.parseResponses = parseResponses;
function prioritiseResponses(responses) {
    //  Priority of responses:
    //      agda2-maybe-goto: 3
    //      agda2-make-case-response: 2
    //      agda2-make-case-response-extendlam: 2
    //      agda2-solveAll-response: 2
    //      agda2-goals-response: 1
    //      OTHERS: 0
    return _.sortBy(responses, res => {
        switch (res.kind) {
            case 'JumpToError':
                return 3;
            case 'MakeCase':
            case 'SolveAll':
                return 2;
            case 'InteractionPoints':
                return 1;
            default:
                return 0;
        }
    });
}
exports.prioritiseResponses = prioritiseResponses;
function parseResponse(raw, fileType) {
    const tokens = parseSExpression(raw);
    switch (tokens[0]) {
        // Resp_HighlightingInfo HighlightingInfo HighlightingMethod ModuleToSource
        case 'agda2-highlight-add-annotations':
            let annotations = _
                .tail(tokens)
                .map(parseAnnotation);
            return Promise.resolve({
                kind: 'HighlightingInfo_Direct',
                annotations: annotations
            });
        case 'agda2-highlight-load-and-delete-action':
            return Promise.resolve({
                kind: 'HighlightingInfo_Indirect',
                filepath: tokens[1]
            });
        // Resp_Status Status
        case 'agda2-status-action':
            return Promise.resolve({
                kind: 'Status',
                showImplicit: _.includes(tokens, 'ShowImplicit'),
                checked: _.includes(tokens, 'Checked')
            });
        // Resp_JumpToError FilePath Int32
        case 'agda2-maybe-goto':
            return Promise.resolve({
                kind: 'JumpToError',
                filepath: tokens[1][0],
                position: parseInt(tokens[1][2])
            });
        // Resp_InteractionPoints [InteractionId]
        case 'agda2-goals-action':
            return Promise.resolve({
                kind: 'InteractionPoints',
                fileType: fileType,
                indices: tokens[1].map((s) => parseInt(s))
            });
        // Resp_GiveAction InteractionId GiveResult
        case 'agda2-give-action':
            let index = parseInt(tokens[1]);
            let giveResult = tokens[2] === 'paren' ?
                'Paren' : tokens[2] === 'no-paren' ?
                'NoParen' :
                'String';
            // Give_Paren  : ["agda2-give-action", 1, "paren"]
            // Give_NoParen: ["agda2-give-action", 1, "no-paren"]
            // Give_String : ["agda2-give-action", 0, ...]
            return Promise.resolve({
                kind: 'GiveAction',
                index: index,
                giveResult,
                result: giveResult === 'String' ? tokens[2] : ''
            });
        // Resp_MakeCase MakeCaseVariant [String]
        case 'agda2-make-case-action':
            return Promise.resolve({
                kind: 'MakeCase',
                variant: 'Function',
                result: tokens[1]
            });
        case 'agda2-make-case-action-extendlam':
            return Promise.resolve({
                kind: 'MakeCase',
                variant: 'ExtendedLambda',
                result: tokens[1]
            });
        // Resp_SolveAll  [(InteractionId, Expr)]
        case 'agda2-solveAll-action':
            return Promise.resolve({
                kind: 'SolveAll',
                solutions: _.chunk(tokens[1], 2).map((arr) => {
                    return { index: parseInt(arr[0]), expression: arr[1] };
                })
            });
        // Resp_DisplayInfo DisplayInfo
        case 'agda2-info-action':
        case 'agda2-info-action-and-copy':
            return Promise.reject(new error_1.ParseError(raw, 'Resp_DisplayInfo not implemented yet'));
        // let kind = parseDisplayInfoKind(tokens[1]);
        // let content = tokens.length === 3 ? [] : _.compact(tokens[2].split('\\n'));
        // return Promise.resolve({
        //     kind: 'DisplayInfo',
        //     displayInfoKind: kind,
        //     title: tokens[1],
        //     content: content,
        // } as Agda.DisplayInfo);
        // Resp_RunningInfo Int String
        case 'agda2-verbose':
            return Promise.resolve({
                kind: 'RunningInfo',
                verbosity: 1,
                message: tokens[1].replace(/\\n/g, '\n')
            });
        // ClearHighlighting
        case 'agda2-highlight-clear':
            return Promise.resolve({
                kind: 'HighlightClear',
            });
        // Resp_DoneAborting
        case 'agda2-abort-done':
            return Promise.resolve({
                kind: 'DoneAborting',
            });
        case 'agda2-parse-error':
            return Promise.reject(new error_1.ParseError(raw, 'agda2-parse-error'));
        default:
            return Promise.reject(new error_1.ParseError(raw, 'Unknown Agda action'));
    }
}
exports.parseResponse = parseResponse;
// function parseInfoKind(title: String): Agda.Info {
//     switch (title) {
//         case '*Compilation result*':    return 'CompilationOk';
//         case '*Constraints*':           return 'Constraints';
//         case '*Auto*':                  return 'Auto';
//         case '*Error*':                 return 'Error';
//         case '*Normal Form*':           return 'NormalForm';
//         case '*Inferred Type*':         return 'InferredType';
//         case '*Current Goal*':          return 'CurrentGoal';
//         case '*Goal type etc.*':        return 'GoalType';
//         case '*Module contents*':       return 'ModuleContents';
//         case '*Search About*':          return 'SearchAbout';
//         case '*Scope Info*':            return 'WhyInScope';
//         case '*Context*':               return 'Context';
//         case '*Helper function*':       return 'HelperFunction';
//         case '*Intro*':                 return 'Intro';
//         case '*Agda Version*':          return 'Version';
//         case '*All Warnings*':          return 'AllWarnings';
//         case '*All Errors*':            return 'AllErrors';
//         // AllGoals
//         default:
//             // if (title.startsWith('*All'))
//             return 'AllGoals';
//     }
// }
function parseAnnotation(obj) {
    if (obj[4]) {
        return {
            start: obj[0],
            end: obj[1],
            type: obj[2],
            source: {
                filepath: obj[4][0],
                index: obj[4][2]
            }
        };
    }
    else {
        return {
            start: obj[0],
            end: obj[1],
            type: obj[2]
        };
    }
}
exports.parseAnnotation = parseAnnotation;
// TODO: parse it better
const parseLocation = (input) => error_2.location.parse(input);
function parseWhyInScope(raws) {
    const regex = /its definition at (.*)$/;
    const occurences = raws
        .filter(str => regex.test(str))
        .map(str => str.match(regex)[1])
        .map(parseLocation)
        .filter(loc => loc.status);
    if (occurences.length > 0) {
        return {
            location: occurences[0]['value']
        };
    }
    else {
        return null;
    }
}
exports.parseWhyInScope = parseWhyInScope;
////////////////////////////////////////////////////////////////////////////////
//  Parsing S-Expressions
////////////////////////////////////////////////////////////////////////////////
function parse_sexp(string) {
    var sexp = [[]];
    var word = '';
    var in_str = false;
    function pushInLast(elem) {
        sexp[sexp.length - 1].push(elem);
    }
    for (var i = 0; i < string.length; i++) {
        var char = string[i];
        if (char == '\'' && !in_str) {
            // drop all single quotes: 'param => param
        }
        else if (char == '(' && !in_str) {
            sexp.push([]);
        }
        else if (char == ')' && !in_str) {
            if (word != '') {
                pushInLast(word);
                word = '';
            }
            pushInLast(sexp.pop());
        }
        else if (char == ' ' && !in_str) {
            if (word != '') {
                pushInLast(word);
                word = '';
            }
        }
        else if (char == '\"') {
            in_str = !in_str;
        }
        else {
            word += char;
        }
    }
    return sexp[0];
}
function parseSExpression(s) {
    return parse_sexp(preprocess(s))[0];
}
exports.parseSExpression = parseSExpression;
function preprocess(chunk) {
    // polyfill String::startsWith
    if (chunk.substr(0, 6) === '((last') {
        // drop priority prefixes like ((last . 1)) as they are all constants with respect to responses
        //
        // the following text from agda-mode.el explains what are those
        // "last . n" prefixes for:
        // Every command is run by this function, unless it has the form
        // \"(('last . priority) . cmd)\", in which case it is run by
        // `agda2-run-last-commands' at the end, after the Agda2 prompt
        // has reappeared, after all non-last commands, and after all
        // interactive highlighting is complete. The last commands can have
        // different integer priorities; those with the lowest priority are
        // executed first.
        let index = chunk.indexOf('(agda');
        let length = chunk.length;
        chunk = chunk.substring(index, length - 1);
    }
    if (chunk.substr(0, 13) === 'cannot read: ') {
        // handles Agda parse error
        chunk = chunk.substring(12);
        chunk = `(agda2-parse-error${chunk})`;
    }
    // Replace window's \\ in paths with /, so that \n doesn't get treated as newline.
    chunk = chunk.replace(/\\\\/g, "/");
    return chunk;
}
//# sourceMappingURL=response.js.map