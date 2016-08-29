import * as React from 'react';

declare var atom: any;

import Core from '../core';
import InputMethod from './InputMethod';
import Header from './Header';
import InputEditor from './InputEditor';

interface Prop {
    core: Core;
    // onSubmit: (payload: string) => void;
    // onCancel: () => void;
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
                <section>
                    <InputEditor
                        placeholder="hi"
                        onSubmit={(s) => {
                            console.log(s)
                        }}
                        onCancel={(s) => {
                            console.log('cancel!!')
                        }}
                    />
                </section>
            </section>
        )
    }
}

export default Panel;
