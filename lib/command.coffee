class Command
    type: null
    # some commands always responds with 'agda2-goals-action' (LOAD, AUTO, ...)
    # while some does not (QUIT, RESTART, ...)
    # Use this flag to indicate whether it's expecting the response
    expectGoalsAction: false
    constructor: (@type) ->
        @expectGoalsAction = switch @type
            when 'load', 'toggle-display-of-implicit-arguments', 'show-constraints', 'solve-constraints', 'show-goals', 'why-in-scope', 'infer-type', 'module-contents', 'compute-normal-form', 'give', 'refine', 'auto', 'case', 'goal-type', 'context', 'goal-type-and-context', 'goal-type-and-inferred-type'
                true
            when 'quit', 'restart', 'compile', 'info', 'next-goal', 'previous-goal'
                false
            else
                false

module.exports = Command
