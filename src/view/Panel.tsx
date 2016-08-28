import * as React from 'react';

declare var atom: any;

import Core from '../core';
import InputMethod from './InputMethod';
import Header from './Header';

type Prop = {
    core: Core
}

class Panel extends React.Component<Prop, void> {
    render() {
        const { core } = this.props;
        return (
            <section>
                <header>
                    <InputMethod
                        updateTranslation={(c) => core.inputMethod.replaceBuffer(c)}
                        insertCharacter={(c) => {
                            core.inputMethod.insertCharToBufffer(c);
                            atom.views.getView(atom.workspace.getActiveTextEditor()).focus();
                        }}
                        chooseSymbol={(c) => {
                            core.inputMethod.replaceBuffer(c);
                            core.inputMethod.deactivate();
                            atom.views.getView(atom.workspace.getActiveTextEditor()).focus();
                        }}
                    />
                    <Header/>
                </header>
            </section>
        )
    }
}

export default Panel;
