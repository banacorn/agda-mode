"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const _ = require("lodash");
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
            // TODO: remove 'title' and reshape the whole type
            switch (raw['info']['kind']) {
                case 'CompilationOk':
                    return Promise.resolve({
                        kind: 'DisplayInfo',
                        displayInfoKind: 'CompilationOk',
                        title: raw['info']['kind'],
                        content: _.concat(raw['info']['warnings'], raw['info']['errors']),
                    });
                case 'Constraints':
                    return Promise.resolve({
                        kind: 'DisplayInfo',
                        displayInfoKind: 'Constraints',
                        title: raw['info']['kind'],
                        content: raw['info']['constraints'],
                    });
                case 'AllGoalsWarnings':
                    return Promise.resolve({
                        kind: 'DisplayInfo',
                        displayInfoKind: 'AllGoals',
                        title: raw['info']['kind'],
                        content: _.concat(raw['info']['goals'], raw['info']['warnings'], raw['info']['errors']),
                    });
                case 'Time':
                // TODO: add `Time` to datatype
                case 'Error':
                    return Promise.resolve({
                        kind: 'DisplayInfo',
                        displayInfoKind: 'Error',
                        title: raw['info']['kind'],
                        content: raw['info']['message'],
                    });
                case 'Intro':
                    return Promise.resolve({
                        kind: 'DisplayInfo',
                        displayInfoKind: 'Intro',
                        title: raw['info']['kind'],
                        content: raw['info']['message'],
                    });
                case 'Auto':
                    return Promise.resolve({
                        kind: 'DisplayInfo',
                        displayInfoKind: 'Auto',
                        title: raw['info']['kind'],
                        content: raw['info']['message'],
                    });
                case 'ModuleContents':
                    return Promise.resolve({
                        kind: 'DisplayInfo',
                        displayInfoKind: 'ModuleContents',
                        title: raw['info']['kind'],
                        content: raw['info']['message'],
                    });
                case 'SearchAbout':
                    return Promise.resolve({
                        kind: 'DisplayInfo',
                        displayInfoKind: 'SearchAbout',
                        title: raw['info']['kind'],
                        content: raw['info']['message'],
                    });
                case 'WhyInScope':
                    return Promise.resolve({
                        kind: 'DisplayInfo',
                        displayInfoKind: 'WhyInScope',
                        title: raw['info']['kind'],
                        content: raw['info']['message'],
                    });
                case 'NormalForm':
                    return Promise.resolve({
                        kind: 'DisplayInfo',
                        displayInfoKind: 'NormalForm',
                        title: raw['info']['kind'],
                        content: raw['info']['message'],
                    });
                case 'GoalType':
                    return Promise.resolve({
                        kind: 'DisplayInfo',
                        displayInfoKind: 'GoalType',
                        title: raw['info']['kind'],
                        content: raw['info']['message'],
                    });
                case 'CurrentGoal':
                    return Promise.resolve({
                        kind: 'DisplayInfo',
                        displayInfoKind: 'CurrentGoal',
                        title: raw['info']['kind'],
                        content: raw['info']['message'],
                    });
                case 'InferredType':
                    return Promise.resolve({
                        kind: 'DisplayInfo',
                        displayInfoKind: 'InferredType',
                        title: raw['info']['kind'],
                        content: raw['info']['message'],
                    });
                case 'Context':
                    return Promise.resolve({
                        kind: 'DisplayInfo',
                        displayInfoKind: 'Context',
                        title: raw['info']['kind'],
                        content: raw['info']['message'],
                    });
                case 'HelperFunction':
                    return Promise.resolve({
                        kind: 'DisplayInfo',
                        displayInfoKind: 'Context',
                        title: raw['info']['kind'],
                        content: raw['info']['message'],
                    });
                case 'Version':
                    return Promise.resolve({
                        kind: 'DisplayInfo',
                        displayInfoKind: 'Version',
                        title: raw['info']['kind'],
                        content: ['nothing to show'],
                    });
            }
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