Vue = require 'vue'
require './type'
require './location'

Vue.component 'error',
    props: ['error']
    template: '''
        <template v-repeat="error.raw">
            <li class="list-item">{{$value}}</li>
        </template>
        <template v-if="notInScope">
            <li class="list-item">
                <span class="text-error">Not in scope:</span>
                <location location="{{error.location}}"></location>
            </li>
            <li class="list-item">
                <type input={{error.term}}></type>
            </li>
        </template>
        <template v-if="typeMismatch">
            <li class="list-item">
                <span class="text-error">Type mismatch:</span>
                <location location="{{error.location}}"></location>
            </li>
            <li class="list-item">
                <span>expected:</span>
                <type input={{error.expected}}></type>
                <span>of type</span>
                <type input={{error.type}}></type>
            </li>
            <li class="list-item">
                <span>  actual:</span>
                <type input={{error.actual}}></type>
            </li>
            <li class="list-item">
                <span>when checking that the expression</span>
                <type input={{error.term}}></type>
                <span>has type</span>
                <type input={{error.termType}}></type>
            </li>
        </template>

        <template v-if="wrongConstructor">
            <li class="list-item">
                <span>The constructor</span>
                <type input={{error.constructor}}></type>
                <span>does not construct an element of</span>
                <type input={{error.constructorType}}></type>
                <location location="{{error.location}}"></location>
            </li>
            <li class="list-item">
                <span>when checking that the expression</span>
                <type input={{error.term}}></type>
                <span>has type</span>
                <type input={{error.termType}}></type>
            </li>
        </template>
    '''
    computed:
        notInScope: -> @error.errorType is 'not in scope'
        typeMismatch: -> @error.errorType is 'type mismatch'
        wrongConstructor: -> @error.errorType is 'wrong constructor'
