import * as _ from 'lodash';;
import { concatItems, parseExpression } from './../emacs/view';
import { View } from '../../type';

// Goals, warnings, and errors
export function parseGWE(goals: string, warnings: string, errors: string): View.Body {
    const grouped = _.groupBy(concatItems(goals.split('\n')).map(parseExpression), 'judgementForm');
    return {
        goalAndHave: [],
        goals: (grouped['goal'] || []) as View.Goal[],
        judgements: (grouped['type judgement'] || []) as View.Judgement[],
        terms: (grouped['term'] || []) as View.Term[],
        metas: (grouped['meta'] || []) as View.Meta[],
        sorts: (grouped['sort'] || []) as View.Sort[],
        warnings: _.compact(warnings.split('\n')),
        errors: _.compact(errors.split('\n'))
    }
}
