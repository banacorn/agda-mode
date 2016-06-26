import * as Promise from "bluebird";
import Core from "./core";
declare var atom: any;

function toStyle(type: string): string {
    switch (type) {
        case "error":           return "error";
        case "warning":         return "warning";
        case "type-judgement":  return "info";
        case "value":           return "success";
        case "plain-text":      return "plain-text";
        default:                return "";
    }
}

const View = Vue.extend({
    template: `
        <div id="panel-header" class="inset-panel padded" v-show="content.title">
            <div id="panel-header-container" v-show="!inputMethodMode">
                <div id="panel-title" class="text-{{style}}">
                    {{content.title}}
                </div>
                <div id="panel-widget">
                </div>
            </div>
            <panel-input-method id="panel-input-method" v-show="inputMethodMode" :input="inputMethod"></panel-input-method>
        </div>
        <div id="panel-body" class="padded" v-show="content.body.length || queryMode">
            <panel-body id="panel-content" :style="{ maxHeight: panelHeight * panelSize + 'px' }" :raw-content="content"></panel-body>
            <panel-input-editor id="panel-input-editor" v-ref:input-editor v-show="queryMode"></panel-input-editor>
        </div>
        `,

    data: () => {
        return {
            content: {
                title: "",
                body: [],
                type: null,
                placeholder: ""
            },
            panelHeight: 30,
            panelSize: 5,
            inputMethodMode: false,
            queryMode: false,
            isPending: true,
            inputMethod: null,
            style: ""
        };
    },
    methods: {
        setContent: (title = "", body = [], type = "plain-text", placeholder = "") => {
            this.content = {
                title: title,
                body: body,
                type: type,
                placeholder: placeholder
            };
            this.queryMode = false;
            this.style = toStyle(type);
        },
        query: (enableIM = true): Promise<any> => {
            const promise = this.$refs.inputEditor.query(enableIM);

            // hide input editor and give focus back
            this.$once("input-editor:confirm", () => {
                this.queryMode = false;
                atom.views.getView(atom.workspace.getActiveTextEditor()).focus()
            });
            this.$once("input-editor:cancel", () => {
                this.queryMode = false;
                atom.views.getView(atom.workspace.getActiveTextEditor()).focus()
            });

            // show input box, as it would had been hidden when initialized
            this.queryMode = true;

            return promise;
        }
    },

    //  initialize and bind configurations of panel size
    ready: () => {
        this.panelSize = atom.config.get("agda-mode.panelSize");
        this.panelHeight = 30;
        atom.config.observe("agda-mode.panelSize", (newValue) => {
            this.panelSize = newValue;
        });
    }
});

Vue.component("agda-panel", View);
export default View;
