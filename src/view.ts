import * as Promise from "bluebird";
import * as Vue from "vue";
import Component from "vue-class-component";
import Core from "./core";
import { View as V } from "./types";

// for component registration
import "./view/panel-body";
import "./view/input-method";
import "./view/input-editor";
import "./view/component/type";
import "./view/component/location";
import "./view/component/error";
// for types
import InputEditor from "./view/input-editor";


declare var atom: any;

Vue.config.debug = true;

function toHeaderStyle(type: V.Type): string {
    switch (type) {
        case V.Type.Error:     return "error";
        case V.Type.Warning:   return "warning";
        case V.Type.Judgement: return "info";
        case V.Type.Value:     return "success";
        case V.Type.PlainText: return "plain-text";
        default:                return "";
    }
}

@Component({
    template: `
        <div id="panel-header" class="inset-panel padded" v-show="header">
            <div id="panel-header-container" v-show="!inputMethodMode">
                <div id="panel-title" class="text-{{headerStyle}}">
                    {{header}}
                </div>
                <div id="panel-widget">
                </div>
            </div>
            <agda-input-method id="panel-input-method" v-show="inputMethodMode" :input="inputMethodInput"></agda-input-method>
        </div>
        <div id="panel-body" class="padded" v-show="content.body.length || queryMode">
            <agda-panel-body id="panel-content" :style="{ maxHeight: panelHeight * panelSize + 'px' }" :raw-content="content"></agda-panel-body>
            <agda-input-editor id="panel-input-editor" v-ref:input-editor v-show="queryMode"></agda-input-editor>
        </div>
        `
})

class View extends Vue {
    header: string;
    content: {
        body: string[]
        type: V.Type,
        placeholder: string
    };
    panelHeight: number;
    panelSize: number;
    inputMethodMode: boolean;
    queryMode: boolean;
    isPending: boolean;
    inputMethodInput: {
        candidateSymbols: string[],
        suggestionKeys: string[],
        rawInput: string,
    };
    headerStyle: string;

    // reference to other components
    $refs: {
        inputEditor: InputEditor
    };

    // constructor(private core: Core) {}

    data() {
        return {
            header: "",
            content: {
                body: [],
                type: null,
                placeholder: ""
            },
            panelHeight: 30,
            panelSize: 5,
            inputMethodMode: false,
            queryMode: false,
            isPending: true,
            inputMethodInput: null,
            headerStyle: ""
        };
    }

    //  initialize and bind configurations of panel size
    ready () {
        this.panelSize = atom.config.get("agda-mode.panelSize");
        this.panelHeight = 30;
        atom.config.observe("agda-mode.panelSize", (newValue) => {
            this.panelSize = newValue;
        });
    }

    // methods
    set(header = "", body = [], type = V.Type.PlainText, placeholder = "") {
        this.header = header;
        this.content = {
            body: body,
            type: type,
            placeholder: placeholder
        };
        this.queryMode = false;
        this.headerStyle = toHeaderStyle(type);
    }

    query(header: string, type: V.Type, placeholder: string, enableIM = true): Promise<string> {
        this.header = header;
        this.content = {
            body: [],
            type: type,
            placeholder: placeholder
        };
        this.headerStyle = toHeaderStyle(type);
        // show input box, as it would had been hidden when initialized

        const promise = this.$refs.inputEditor.query(enableIM, placeholder);

        // hide input editor and give focus back
        this.$once("input-editor:confirm", () => {
            this.queryMode = false;
            atom.views.getView(atom.workspace.getActiveTextEditor()).focus()
        });
        this.$once("input-editor:cancel", () => {
            this.queryMode = false;
            atom.views.getView(atom.workspace.getActiveTextEditor()).focus()
        });

        this.queryMode = true;

        return promise;
    }
}

Vue.component("agda-view", View);
export default View;
