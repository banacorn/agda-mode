import * as Promise from 'bluebird';
import * as _ from 'lodash';
import { ParseError } from '../../error';
// import { location } from './../emacs/error';
import { Agda } from '../../type';
import { FileType } from '../../type/agda';

function toAnnotation(raw: object): Agda.Annotation {

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
    }
}


function parseIndirectAnnotations(raw: string): Agda.Annotation[] {
    const { payload } = JSON.parse(raw.toString());
    return payload.map(toAnnotation);
}

//
// // Converts JSON to Agda.Info
// function parseDisplayInfo(raw: object): Agda.Info {
//     switch (raw['kind']) {
//         case 'CompilationOk':
//             return {
//                 kind: 'CompilationOk',
//                 warnings: raw['warnings'],
//                 errors: raw['errors'],
//                 emacsMessage: raw['emacsMessage']
//             };
//         case 'Constraints':
//             return {
//                 kind: 'Constraints',
//                 constraints: raw['constraints'],
//             };
//         case 'AllGoalsWarnings':
//             return {
//                 kind: 'AllGoalsWarnings',
//                 goals: raw['goals'],
//                 warnings: raw['warnings'],
//                 errors: raw['errors'],
//                 emacsMessage: raw['emacsMessage']
//             };
//         case 'Error':
//             return {
//                 kind: raw['kind'],
//                 error: raw['error'] as Agda.Error,
//                 emacsMessage: raw['emacsMessage']
//             };
//         case 'Time':
//         case 'Intro':
//         case 'Auto':
//         case 'ModuleContents':
//         case 'SearchAbout':
//         case 'WhyInScope':
//         case 'NormalForm':
//         case 'GoalType':
//         case 'CurrentGoal':
//         case 'InferredType':
//         case 'Context':
//         case 'HelperFunction':
//             return {
//                 kind: raw['kind'],
//                 payload: raw['payload'].split('\n')
//             };
//         case 'Version':
//             return {
//                 kind: 'Version',
//                 version: raw['version']
//             }
//     }
// }

function parseResponse(raw: object, fileType: FileType): Promise<Agda.Response> {
    switch (raw['kind']) {
        case 'HighlightingInfo':
            if (raw['direct']) {
                return Promise.resolve({
                    kind: 'HighlightingInfo_Direct',
                    annotations: raw['info']['payload'].map(toAnnotation)
                } as Agda.HighlightingInfo_Direct);
            } else {
                return Promise.resolve({
                    kind: 'HighlightingInfo_Indirect',
                    filepath: raw['filepath']
                } as Agda.HighlightingInfo_Indirect);
            }

        case 'Status':
            return Promise.resolve({
                kind: 'Status',
                showImplicitArguments: raw['showImplicitArguments'],
                checked: raw['checked'],
            } as Agda.Status);

        case 'JumpToError':
            return Promise.resolve({
                kind: 'JumpToError',
                filepath: raw['filepath'],
                position: raw['position']
            } as Agda.JumpToError);

        case 'InteractionPoints':
            return Promise.resolve({
                kind: 'InteractionPoints',
                fileType: fileType,
                indices: raw['interactionPoints']
            } as Agda.InteractionPoints);

        // Resp_GiveAction InteractionId GiveResult
        case 'GiveAction':
            let giveResult = raw['giveResult'] === true
                ? 'Paren'
                : raw['giveResult'] === false
                    ? 'NoParen'
                    : 'String'

            return Promise.resolve({
                kind: 'GiveAction',
                index: raw['interactionPoint'],
                giveResult: giveResult,
                result: giveResult === 'String' ? raw['giveResult'] : ''
            } as Agda.GiveAction);

        case 'MakeCase':
            return Promise.resolve({
                kind: 'MakeCase',
                variant: raw['variant'],
                result: raw['clauses']
            } as Agda.MakeCase);

        case 'SolveAll':
            return Promise.resolve({
                kind: 'SolveAll',
                solutions: raw['solutions'].map(({ interactionPoint, expression }) => ({
                    index: interactionPoint,
                    expression
                }))
            } as Agda.SolveAll);

        case 'DisplayInfo':
            return Promise.resolve({
                kind: 'DisplayInfo',
                info: raw['info'] as Agda.Info,
            } as Agda.DisplayInfo);

        case 'RunningInfo':
            return Promise.resolve({
                kind: 'RunningInfo',
                verbosity: raw['debugLevel'],
                message: raw['message'],
            } as Agda.RunningInfo);

        case 'ClearRunningInfo':
            return Promise.resolve({
                kind: 'ClearRunningInfo'
            } as Agda.ClearRunningInfo);

        // ClearHighlighting
        case 'ClearHighlighting':
            return Promise.resolve({
                kind: 'HighlightClear',
            } as Agda.ClearHighlighting);


        // Resp_DoneAborting
        case 'DoneAborting':
            return Promise.resolve({
                kind: 'DoneAborting',
            } as Agda.DoneAborting);

        default:
            return Promise.reject(new ParseError(
                JSON.stringify(raw),
                'Unknown Agda action'
            ));
    }
}

export {
    parseResponse,
    toAnnotation,
    parseIndirectAnnotations
}
