"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const Breadcrumb_1 = require("./Settings/Breadcrumb");
class Settings extends React.Component {
    constructor(props) {
        super(props);
        // this.tabClassName = this.tabClassName.bind(this);
        // this.panelClassName = this.panelClassName.bind(this);
        // this.handleClick = this.handleClick.bind(this);
    }
    render() {
        return (React.createElement("section", { className: "agda-settings" },
            React.createElement(Breadcrumb_1.default, { path: "Nothing" })));
    }
}
exports.default = Settings;
// <nav>
//     <ol>
//         <li
//             className={this.tabClassName(0)}
//             onClick={this.handleClick(0)}
//         ><span className='icon icon-plug'>Connections</span></li>
//         <li
//             className={this.tabClassName(1)}
//             onClick={this.handleClick(1)}
//         ><span className='icon icon-comment-discussion'>Conversations</span></li>
//     </ol>
// </nav>
// <Connections
//     core={this.props.core}
//     className={this.panelClassName(0)}
// />
// <Conversations className={this.panelClassName(1)}>
//     1
// </Conversations>
//# sourceMappingURL=Settings.js.map