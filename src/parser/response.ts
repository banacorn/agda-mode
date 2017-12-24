import * as Promise from 'bluebird';
import * as _ from 'lodash';
import { ParseError } from '../error';
import { Agda } from '../type';

function parseResponses(raw: string): Promise<Agda.Response[]> {
    const lines = raw.trim().split('\n');
    return Promise.map(lines, parseResponse)
        .then(prioritiseResponses)
}

function prioritiseResponses(responses: Agda.Response[]): Agda.Response[] {
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

function parseResponse(raw: string): Promise<Agda.Response> {

    const tokens: any[] = parseSExpression(raw);

    switch (tokens[0]) {
        // Resp_HighlightingInfo HighlightingInfo HighlightingMethod ModuleToSource
        case 'agda2-highlight-add-annotations':
            let annotations: Agda.Annotation[] = _
                .tail(tokens)
                .map(parseAnnotation);
            return Promise.resolve({
                kind: 'HighlightingInfo_Direct',
                annotations: annotations
            } as Agda.HighlightingInfo_Direct);
        case 'agda2-highlight-load-and-delete-action':
            return Promise.resolve({
                kind: 'HighlightingInfo_Indirect',
                filepath: tokens[1]
            } as Agda.HighlightingInfo_Indirect);

        // Resp_Status Status
        case 'agda2-status-action':
            return Promise.resolve({
                kind: 'Status',
                showImplicit: _.includes(tokens, 'ShowImplicit'),
                checked: _.includes(tokens, 'Checked')
            } as Agda.Status);

        // Resp_JumpToError FilePath Int32
        case 'agda2-maybe-goto':
            return Promise.resolve({
                kind: 'JumpToError',
                filepath: tokens[1][0],
                position: parseInt(tokens[1][2])
            } as Agda.JumpToError);

        // Resp_InteractionPoints [InteractionId]
        case 'agda2-goals-action':
            return Promise.resolve({
                kind: 'InteractionPoints',
                indices: tokens[1].map((s) => parseInt(s))
            } as Agda.InteractionPoints);

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
            } as Agda.GiveAction);

        // Resp_MakeCase MakeCaseVariant [String]
        case 'agda2-make-case-action':
            return Promise.resolve({
                kind: 'MakeCase',
                variant: 'Function',
                result: tokens[1]
            } as Agda.MakeCase);
        case 'agda2-make-case-action-extendlam':
            return Promise.resolve({
                kind: 'MakeCase',
                variant: 'ExtendedLambda',
                result: tokens[1]
            } as Agda.MakeCase);

        // Resp_SolveAll  [(InteractionId, Expr)]
        case 'agda2-solveAll-action':
            return Promise.resolve({
                kind: 'SolveAll',
                solutions: _.chunk(tokens[1], 2).map((arr) => {
                    return { index: parseInt(arr[0] as string), expression: arr[1] }
                })
            } as Agda.SolveAll);

        // Resp_DisplayInfo DisplayInfo
        case 'agda2-info-action':
        case 'agda2-info-action-and-copy':
            let kind = parseDisplayInfoKind(tokens[1]);
            let content = tokens.length === 3 ? [] : _.compact(tokens[2].split('\\n'));
            return Promise.resolve({
                kind: 'DisplayInfo',
                displayInfoKind: kind,
                title: tokens[1],
                content: content,
                append: tokens[3] === 't'
            } as Agda.DisplayInfo);

        // Resp_RunningInfo Int String
        case 'agda2-verbose':
            return Promise.resolve({
                kind: 'RunningInfo',
                verbosity: 1,
                message: tokens[1]
            } as Agda.RunningInfo);

        // ClearHighlighting
        case 'agda2-highlight-clear':
            return Promise.resolve({
                kind: 'HighlightClear',
            } as Agda.ClearHighlighting);

        case 'agda2-parse-error':
            return Promise.reject(new ParseError(
                raw,
                'agda2-parse-error'
            ))

        default:
            return Promise.reject(new ParseError(
                raw,
                'Unknown Agda action'
            ));
    }
}
function parseDisplayInfoKind(title: String): Agda.DisplayInfoKind {
    switch (title) {
        case '*Compilation result*':    return 'CompilationOk';
        case '*Constraints*':           return 'Constraints';
        case '*Auto*':                  return 'Auto';
        case '*Error*':                 return 'Error';
        case '*Normal Form*':           return 'NormalForm';
        case '*Inferred Type*':         return 'InferredType';
        case '*Current Goal*':          return 'CurrentGoal';
        case '*Goal type etc.*':        return 'GoalType';
        case '*Module contents*':       return 'ModuleContents';
        case '*Search About*':          return 'SearchAbout';
        case '*Scope Info*':            return 'WhyInScope';
        case '*Context*':               return 'Context';
        case '*Helper function*':       return 'HelperFunction';
        case '*Intro*':                 return 'Intro';
        case '*Agda Version*':          return 'Version';
        case '*All Warnings*':          return 'AllWarnings';
        // AllGoals
        default:
            // if (title.startsWith('*All'))
            return 'AllGoals';
    }
}


function parseAnnotation(obj: any[]): Agda.Annotation {
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

    } else {
        return {
            start: obj[0],
            end: obj[1],
            type: obj[2]
        };
    }
}

////////////////////////////////////////////////////////////////////////////////
//  Parsing S-Expressions
////////////////////////////////////////////////////////////////////////////////
function parse_sexp(string: string): any {
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
        } else if (char == '(' && !in_str) {
            sexp.push([]);
        } else if (char == ')' && !in_str) {
            if (word != '') {
                pushInLast(word);
                word = '';
            }
            pushInLast(sexp.pop());
        } else if (char == ' ' && !in_str) {
            if (word != '') {
                pushInLast(word);
                word = '';
            }
        } else if (char == '\"') {
            in_str = !in_str;
        } else {
            word += char;
        }
    }
    return sexp[0];
}

function parseSExpression(s: string): any {
    return parse_sexp(preprocess(s))[0];
}

function preprocess(chunk: string): string {
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

export {
    parseResponse,
    parseResponses,
    prioritiseResponses,
    parseAnnotation,
    parseSExpression
}
