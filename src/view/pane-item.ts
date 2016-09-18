import * as path from 'path';


export default class PaneItem {
    constructor(private editor: any, private name: string) {
    }

    private createPaneItem(): any {
        // classList
        const paneItem = document.createElement('article');
        paneItem.classList.add('agda-view');
        // title
        const base = path.basename(this.editor.getPath())
        const ext = path.extname(base)
        const title = `[Agda Mode] ${base.substr(0, base.length - ext.length)}`
        // methods
        paneItem['getURI'] = () => `agda-mode://${this.editor.id}`;
        paneItem['getTitle'] = () => title;
        paneItem['getEditor'] = () => this.editor;
        paneItem.id = `agda-mode://${this.editor.id}`;

        return paneItem;
    }


    opener = (uri: string) => {
        const [protocol, editorID] = uri.split('://');

        const openedByAgdaMode = protocol === 'agda-mode';
        const openedByTheSameEditor = editorID === this.editor.id.toString();
        if (openedByAgdaMode && openedByTheSameEditor) {
            return this.createPaneItem();
        }
    }

}
