import Component from "vue-class-component";
import * as Vue from "vue";
import { View } from "../../types";

@Component({
    props: {
        error: Object
    },
    template: `
        <template v-if="notInScope">
            <li class="list-item">
                <span>Not in scope:</span>
                <type :input="error.expr"></type>
                <location :location="error.location"></location>
            </li>
        </template>
        <template v-if="typeMismatch">
            <li class="list-item">
                <span class="text-error">Type mismatch:</span>
                <location :location="error.location"></location>
            </li>
            <li class="list-item">
                <span>expected:</span>
                <type :input="error.expected"></type>
                <span>of type</span>
                <type :input="error.expectedType"></type>
            </li>
            <li class="list-item">
                <span>  actual:</span>
                <type :input="error.actual"></type>
            </li>
            <li class="list-item">
                <span>when checking that the expression</span>
                <type :input="error.expr"></type>
                <span>has type</span>
                <type :input="error.exprType"></type>
            </li>
        </template>

        <template v-if="wrongConstructor">
            <li class="list-item">
                <span>The constructor</span>
                <type :input="error.constructor"></type>
                <span>does not construct an element of</span>
                <type :input="error.constructorType"></type>
                <location :location="error.location"></location>
            </li>
            <li class="list-item">
                <span>when checking that the expression</span>
                <type :input="error.expr"></type>
                <span>has type</span>
                <type :input="error.exprType"></type>
            </li>
        </template>

        <template v-if="applicationParseError">
            <li class="list-item">
                <span>Could not parse the application</span>
                <type :input="error.expr"></type>
                <location :location="error.location"></location>
            </li>
        </template>

        <template v-if="terminationError">
            <li class="list-item">
                <span>Termination checking failed for the following functions:</span>
                <location :location="error.location"></location>
            </li>
            <li class="list-item">
                <type :input="error.expr"></type>
            </li>
            <li class="list-item">
                <span>Problematic calls:</span>
            </li>
            <li class="list-item" v-for="item in error.calls">
                <type :input="item.term"></type>
                <location :location="item.location"></location>
            </li>
        </template>

        <template v-if="missingDefinition">
            <li class="list-item">
                <span>Missing definition for</span>
                <type :input="error.expr"></type>
                <location :location="error.location"></location>
            </li>
        </template>

        <template v-if="multipleDefinition">
            <li class="list-item">
                <span>Multiple definitions of </span>
                <type :input="error.expr"></type><span> : </span><type :input="error.exprType"></type>
                <location :location="error.location"></location>
            </li>
        </template>

        <template v-if="rhsOmitted">
            <li class="list-item">
                <span>The right-hand side can only be omitted if there is an absurd pattern, () or {}, in the left-hand side.</span>
                <location :location="error.location"></location>
            </li>
            <li class="list-item">
                <span>when checking that the clause</span>
                <type :input="error.expr"></type>
                <span>has type</span>
                <type :input="error.exprType"></type>
            </li>
        </template>

        <template v-if="parseError">
            <li class="list-item">
                <span>Parse error:</span>
                <span class="text-error">{{error.expr}}</span>
                <span>{{error.post}}</span>
                <location :location="error.location"></location>
            </li>
        </template>

        <template v-if="unknown">
            <li class="list-item">
                <span>{{error.raw}}</span>
            </li>
        </template>`
})
class Error extends Vue {

    // props
    error: View.Error;

    // computed
    get notInScope(): boolean { return this.error.type === View.ErrorType.NotInScope; }
    get typeMismatch(): boolean { return this.error.type === View.ErrorType.TypeMismatch; }
    get wrongConstructor(): boolean { return this.error.type === View.ErrorType.WrongConstructor; }
    get applicationParseError(): boolean { return this.error.type === View.ErrorType.ApplicationParseError; }
    get terminationError(): boolean { return this.error.type === View.ErrorType.TerminationError; }
    get missingDefinition(): boolean { return this.error.type === View.ErrorType.MissingDefinition; }
    get multipleDefinition(): boolean { return this.error.type === View.ErrorType.MultipleDefinition; }
    get rhsOmitted(): boolean { return this.error.type === View.ErrorType.RhsOmitted; }
    get parseError(): boolean { return this.error.type === View.ErrorType.ParseError; }
    get unknown(): boolean { return this.error.type === View.ErrorType.Unknown; }
}

Vue.component("error", Error);
export default Error;