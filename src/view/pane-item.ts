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
        paneItem['getURI'] = this.getURI;
        paneItem['getTitle'] = () => title;
        paneItem['getEditor'] = () => this.editor;
        paneItem.id =this.editor.id;

        return paneItem;
    }

    getURI = (): string => {
        return `agda-mode://${this.editor.id}/${this.name}`
    }

    opener = (uri: string) => {
        // e.g. "agda-mode://12312/view"
        //       [scheme ]   [dir] [name]
        const [scheme, pathRest] = uri.split('://');
        const { dir, name } = path.parse(pathRest);

        const openedByAgdaMode = scheme === 'agda-mode';
        const openedByTheSameEditor = dir === this.editor.id.toString();
        const openedForTheSamePurpose = name === this.name;
        if (openedByAgdaMode && openedByTheSameEditor && openedForTheSamePurpose) {
            return this.createPaneItem();
        } else {
            return null;
        }
    }

}
