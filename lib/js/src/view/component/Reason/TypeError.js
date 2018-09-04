"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const Internal_1 = require("../Syntax/Internal");
var Range = require('./../Syntax/Position.bs').jsComponent;
function notInScope(error) {
    const suggest = (suggestions) => suggestions.length ? (did) : , you, mean, { intersperse };
    (suggestions.map((name, i) => key, { i }, value = { name } /  > ), ', ');
}
/span>) : null;;
const item = ({ name, suggestions }, i) => key, { i };
 >
    value;
{
    name;
}
/>{suggest(suggestions)}
    < /li>;
return The;
following;
identifiers;
are;
not in scope;
/>
    < ul >
    { error: .payloads.map(item) }
    < /ul>
    < /section>;
function unequalTerms(error) {
    return { 'expected : ':  } < Internal_1.Term;
    value = { error: .term2 } /  > />;
    {
        '  actual : ';
    }
    value;
    {
        error.term1;
    }
    /><br / >
        { ' of type : ':  } < Internal_1.Type;
    value = { error: .type } /  > />;
    when;
    checking;
    that;
    the;
    expression
        < /section>;
}
class TypeError extends React.Component {
    render() {
        const { error, range, emacsMessage } = this.props;
        console.log(emacsMessage);
        console.log(error);
        switch (error.kind) {
            case 'NotInScope':
                return className;
                "error" >
                    range;
                {
                    range;
                }
                /><br/ >
                    {}
                    < /div>;
            case 'UnequalTerms':
                return className;
                "error" >
                    range;
                {
                    range;
                }
                /><br/ >
                    {}
                    < /div>;
            default:
                return className;
                "error" >
                    { emacsMessage }
                    < /p>;
        }
    }
}
exports.default = TypeError;
//# sourceMappingURL=TypeError.js.map