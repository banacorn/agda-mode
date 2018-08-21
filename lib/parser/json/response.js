"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const error_1 = require("../../error");
function toAnnotation(raw) {
    const defSite = raw['definitionSite']
        ? {
            filepath: raw['definitionSite']['filepath'],
            index: raw['definitionSite']['position']
        } : null;
    return {
        start: raw['range'][0],
        end: raw['range'][1],
        type: raw['atoms'],
        source: defSite
    };
}
exports.toAnnotation = toAnnotation;
function parseIndirectAnnotations(raw) {
    const { payload } = JSON.parse(raw.toString());
    return payload.map(toAnnotation);
}
exports.parseIndirectAnnotations = parseIndirectAnnotations;
function parseDisplayInfo(raw) {
    switch (raw['kind']) {
        case 'CompilationOk':
            return {
                kind: 'CompilationOk',
                warnings: raw['warnings'],
                errors: raw['errors'],
                mixed: []
            };
        case 'Constraints':
            return {
                kind: 'Constraints',
                constraints: raw['constraints'],
            };
        case 'AllGoalsWarnings':
            return {
                kind: 'AllGoalsWarnings',
                goals: raw['goals'],
                warnings: raw['warnings'],
                errors: raw['errors'],
                mixed: []
            };
        case 'Time':
        case 'Error':
        case 'Intro':
        case 'Auto':
        case 'ModuleContents':
        case 'SearchAbout':
        case 'WhyInScope':
        case 'NormalForm':
        case 'GoalType':
        case 'CurrentGoal':
        case 'InferredType':
        case 'Context':
        case 'HelperFunction':
            return {
                kind: raw['kind'],
                payload: raw['message']
            };
        case 'Version':
            return {
                kind: 'Version'
            };
    }
}
function parseResponse(raw, fileType) {
    switch (raw['kind']) {
        case 'HighlightingInfo':
            if (raw['direct']) {
                return Promise.resolve({
                    kind: 'HighlightingInfo_Direct',
                    annotations: raw['info'].map(toAnnotation)
                });
            }
            else {
                return Promise.resolve({
                    kind: 'HighlightingInfo_Indirect',
                    filepath: raw['filepath']
                });
            }
        case 'Status':
            return Promise.resolve({
                kind: 'Status',
                showImplicit: raw['status']['showImplicitArguments'],
                checked: raw['status']['checked'],
            });
        case 'JumpToError':
            return Promise.resolve({
                kind: 'JumpToError',
                filepath: raw['filepath'],
                position: raw['position']
            });
        case 'InteractionPoints':
            return Promise.resolve({
                kind: 'InteractionPoints',
                fileType: fileType,
                indices: raw['interactionPoints']
            });
        // Resp_GiveAction InteractionId GiveResult
        case 'GiveAction':
            let giveResult = raw['giveResult'] === true
                ? 'Paren'
                : raw['giveResult'] === false
                    ? 'NoParen'
                    : 'String';
            return Promise.resolve({
                kind: 'GiveAction',
                index: raw['InteractionPoint'],
                giveResult: giveResult,
                result: giveResult === 'String' ? raw['giveResult'] : ''
            });
        case 'MakeCase':
            return Promise.resolve({
                kind: 'MakeCase',
                variant: raw['variant'],
                result: raw['clauses']
            });
        case 'SolveAll':
            return Promise.resolve({
                kind: 'SolveAll',
                solutions: raw['solutions'].map(({ interactionPoint, expression }) => ({
                    index: interactionPoint,
                    expression
                }))
            });
        case 'DisplayInfo':
            return Promise.resolve({
                kind: 'DisplayInfo',
                info: parseDisplayInfo(raw['info'])
            });
        case 'RunningInfo':
            return Promise.resolve({
                kind: 'RunningInfo',
                verbosity: raw['debugLevel'],
                message: raw['message'],
            });
        case 'ClearRunningInfo':
            return Promise.resolve({
                kind: 'ClearRunningInfo'
            });
        // ClearHighlighting
        case 'ClearHighlighting':
            return Promise.resolve({
                kind: 'HighlightClear',
            });
        // Resp_DoneAborting
        case 'DoneAborting':
            return Promise.resolve({
                kind: 'DoneAborting',
            });
        //
        // case 'agda2-parse-error':
        //     return Promise.reject(new ParseError(
        //         raw,
        //         'agda2-parse-error'
        //     ));
        default:
            return Promise.reject(new error_1.ParseError(JSON.stringify(raw), 'Unknown Agda action'));
    }
}
exports.parseResponse = parseResponse;
//# sourceMappingURL=response.js.map