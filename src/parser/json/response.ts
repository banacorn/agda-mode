import * as Promise from 'bluebird';
import * as _ from 'lodash';
import { ParseError } from '../../error';
// import { location } from './../emacs/error';
import { Agda, FileType } from '../../type';

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

function parseResponse(raw: object, fileType: FileType): Promise<Agda.Response> {
    switch (raw['kind']) {
        case 'HighlightingInfo':
            if (raw['direct']) {
                return Promise.resolve({
                    kind: 'HighlightingInfo_Direct',
                    annotations: raw['info'].map(toAnnotation)
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
                showImplicit: raw['status']['showImplicitArguments'],
                checked: raw['status']['checked'],
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
                index: raw['InteractionPoint'],
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
            // TODO: remove 'title' and reshape the whole type
            switch (raw['info']['kind']) {
                case 'CompilationOk':
                    return Promise.resolve({
                        kind: 'DisplayInfo',
                        displayInfoKind: 'CompilationOk',
                        title: raw['info']['kind'],
                        content: _.concat(raw['info']['warnings'], raw['info']['errors']),
                    } as Agda.DisplayInfo);
                case 'Constraints':
                    return Promise.resolve({
                        kind: 'DisplayInfo',
                        displayInfoKind: 'Constraints',
                        title: raw['info']['kind'],
                        content: raw['info']['constraints'],
                    } as Agda.DisplayInfo);
                case 'AllGoalsWarnings':
                    return Promise.resolve({
                        kind: 'DisplayInfo',
                        displayInfoKind: 'AllGoals',
                        title: raw['info']['kind'],
                        content: _.concat(raw['info']['goals'], raw['info']['warnings'], raw['info']['errors']),
                    } as Agda.DisplayInfo);
                case 'Time':
                    // TODO: add `Time` to datatype
                case 'Error':
                    return Promise.resolve({
                        kind: 'DisplayInfo',
                        displayInfoKind: 'Error',
                        title: raw['info']['kind'],
                        content: raw['info']['message'],
                    } as Agda.DisplayInfo);
                case 'Intro':
                    return Promise.resolve({
                        kind: 'DisplayInfo',
                        displayInfoKind: 'Intro',
                        title: raw['info']['kind'],
                        content: raw['info']['message'],
                    } as Agda.DisplayInfo);
                case 'Auto':
                    return Promise.resolve({
                        kind: 'DisplayInfo',
                        displayInfoKind: 'Auto',
                        title: raw['info']['kind'],
                        content: raw['info']['message'],
                    } as Agda.DisplayInfo);
                case 'ModuleContents':
                    return Promise.resolve({
                        kind: 'DisplayInfo',
                        displayInfoKind: 'ModuleContents',
                        title: raw['info']['kind'],
                        content: raw['info']['message'],
                    } as Agda.DisplayInfo);
                case 'SearchAbout':
                    return Promise.resolve({
                        kind: 'DisplayInfo',
                        displayInfoKind: 'SearchAbout',
                        title: raw['info']['kind'],
                        content: raw['info']['message'],
                    } as Agda.DisplayInfo);
                case 'WhyInScope':
                    return Promise.resolve({
                        kind: 'DisplayInfo',
                        displayInfoKind: 'WhyInScope',
                        title: raw['info']['kind'],
                        content: raw['info']['message'],
                    } as Agda.DisplayInfo);
                case 'NormalForm':
                    return Promise.resolve({
                        kind: 'DisplayInfo',
                        displayInfoKind: 'NormalForm',
                        title: raw['info']['kind'],
                        content: raw['info']['message'],
                    } as Agda.DisplayInfo);
                case 'GoalType':
                    return Promise.resolve({
                        kind: 'DisplayInfo',
                        displayInfoKind: 'GoalType',
                        title: raw['info']['kind'],
                        content: raw['info']['message'],
                    } as Agda.DisplayInfo);
                case 'CurrentGoal':
                    return Promise.resolve({
                        kind: 'DisplayInfo',
                        displayInfoKind: 'CurrentGoal',
                        title: raw['info']['kind'],
                        content: raw['info']['message'],
                    } as Agda.DisplayInfo);
                case 'InferredType':
                    return Promise.resolve({
                        kind: 'DisplayInfo',
                        displayInfoKind: 'InferredType',
                        title: raw['info']['kind'],
                        content: raw['info']['message'],
                    } as Agda.DisplayInfo);
                case 'Context':
                    return Promise.resolve({
                        kind: 'DisplayInfo',
                        displayInfoKind: 'Context',
                        title: raw['info']['kind'],
                        content: raw['info']['message'],
                    } as Agda.DisplayInfo);
                case 'HelperFunction':
                    return Promise.resolve({
                        kind: 'DisplayInfo',
                        displayInfoKind: 'Context',
                        title: raw['info']['kind'],
                        content: raw['info']['message'],
                    } as Agda.DisplayInfo);

                case 'Version':
                    return Promise.resolve({
                        kind: 'DisplayInfo',
                        displayInfoKind: 'Version',
                        title: raw['info']['kind'],
                        content: ['nothing to show'],
                    } as Agda.DisplayInfo);


            }

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
        //
        // case 'agda2-parse-error':
        //     return Promise.reject(new ParseError(
        //         raw,
        //         'agda2-parse-error'
        //     ));

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
