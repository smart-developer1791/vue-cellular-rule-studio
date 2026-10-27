import { computed, defineComponent, h, useId, type PropType } from 'vue'
import { evolve, runPath, type Workspace } from '../domain/automaton.ts'
export default defineComponent({
  name: 'AutomatonGrid',
  props: { workspace: { type: Object as PropType<Workspace>, required: true } },
  setup(props) {
    const title = useId(),
      description = useId(),
      pattern = useId(),
      grid = computed(() => evolve(props.workspace))
    return () =>
      h(
        'svg',
        {
          viewBox: '0 0 ' + props.workspace.seed.length + ' ' + props.workspace.rows,
          role: 'img',
          'aria-labelledby': title + ' ' + description,
          'data-ui': 'automaton-grid',
          class: 'h-full min-h-[300px] min-w-[320px] w-full',
          'shape-rendering': 'crispEdges',
        },
        [
          h('title', { id: title }, props.workspace.name),
          h(
            'desc',
            { id: description },
            'Rule ' +
              props.workspace.rule +
              ', ' +
              props.workspace.boundary +
              ' boundary. The first row is the applied seed; dark cells have value one.',
          ),
          h('defs', null, [
            h('pattern', { id: pattern, width: 1, height: 1, patternUnits: 'userSpaceOnUse' }, [
              h('path', {
                d: 'M 1 0 H 0 V 1',
                fill: 'none',
                stroke: '#77658c25',
                'stroke-width': 0.035,
              }),
            ]),
          ]),
          h('rect', {
            width: props.workspace.seed.length,
            height: props.workspace.rows,
            fill: 'white',
          }),
          h('path', { d: runPath(grid.value), fill: props.workspace.ink, 'data-ui': 'cell-runs' }),
          h('rect', {
            width: props.workspace.seed.length,
            height: props.workspace.rows,
            fill: 'url(#' + pattern + ')',
            'pointer-events': 'none',
          }),
        ],
      )
  },
})
