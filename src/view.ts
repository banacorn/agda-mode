import * as Promise from "bluebird";
import * as Vue from "vue";
import Core from "./core";
import Component from "vue-class-component";
import "./view/panel-body";

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

@Component({
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
        <div id="panel-panel-body" class="padded" v-show="content.body.length || queryMode">
            <agda-panel-body id="panel-content" :style="{ maxHeight: panelHeight * panelSize + 'px' }" :raw-content="content"></agda-panel-body>
            <panel-input-editor id="panel-input-editor" v-ref:input-editor v-show="queryMode"></panel-input-editor>
        </div>
        `
})

class View {
    content: {
        title: string,
        body: string[],
        type: string,
        placeholder: string
    }
    panelHeight: number;
    panelSize: number;
    inputMethodMode: boolean;
    queryMode: boolean;
    isPending: boolean;
    inputMethod: any;
    style: string;

    // hack
    $refs: any;
    $once: any;
    $mount: any;
    $on: any;

    data() {
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
    setContent(title = "", body = [], type = "plain-text", placeholder = "") {
        this.content = {
            title: title,
            body: body,
            type: type,
            placeholder: placeholder
        };
        this.queryMode = false;
        this.style = toStyle(type);
    }

    query(enableIM = true): Promise<string> {
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
}

Vue.component("agda-view", View);
export default View;
