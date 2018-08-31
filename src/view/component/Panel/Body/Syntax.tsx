import * as React from 'react';
import { Agda } from './../../../../type';
import { intersperse } from './../../../../util';


import Link from './Link'

////////////////////////////////////////////////////////////////////////////////
// Misc

export const Comparison = (props) => props.value === 'CmpEq'
    ? <span>=</span>
    : <span>≤</span>;
