import * as React from 'react';

////////////////////////////////////////////////////////////////////////////////
// Misc

export const Comparison = (props) => props.value === 'CmpEq'
    ? <span>=</span>
    : <span>≤</span>;
