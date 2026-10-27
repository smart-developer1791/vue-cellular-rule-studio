<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import sample from '../public/sample-workspace.json'
import StudioHeader from './components/StudioHeader.vue'
import DataTools from './components/DataTools.vue'
import AppDialog from './components/AppDialog.vue'
import AutomatonGrid from './components/AutomatonGrid.ts'
import {
  parse,
  serialize,
  evolve,
  lookup,
  svgExport,
  pbmExport,
  textExport,
} from './domain/automaton.ts'
import { useDraft } from './services/draft.ts'
import { download } from './services/files.ts'
const { draft, storageStatus } = useDraft('vue-cellular-rule-studio:v1', parse(sample), parse)
const identity = computed(() => serialize(draft.value).provenance.marker),
  grid = computed(() => evolve(draft.value)),
  table = computed(() => lookup(draft.value.rule)),
  onCount = computed(() => grid.value.flat().reduce((n, v) => n + v, 0)),
  lastCount = computed(() => grid.value[grid.value.length - 1]!.reduce((n, v) => n + v, 0))
const title = ref(draft.value.name),
  rule = ref<string | number>(draft.value.rule),
  rows = ref<string | number>(draft.value.rows),
  boundary = ref(draft.value.boundary),
  ink = ref(draft.value.ink),
  seed = ref(draft.value.seed),
  error = ref(''),
  seedError = ref(''),
  about = ref(false),
  mode = ref<'grid' | 'rows'>('grid')
function syncSettings() {
  title.value = draft.value.name
  rule.value = draft.value.rule
  rows.value = draft.value.rows
  boundary.value = draft.value.boundary
  ink.value = draft.value.ink
  error.value = ''
}
function syncSeed() {
  seed.value = draft.value.seed
  seedError.value = ''
}
watch(
  () =>
    JSON.stringify([
      draft.value.name,
      draft.value.rule,
      draft.value.rows,
      draft.value.boundary,
      draft.value.ink,
    ]),
  syncSettings,
)
watch(() => draft.value.seed, syncSeed)
function replace(value: unknown) {
  draft.value = parse(value)
  syncSettings()
  syncSeed()
}
function number(v: string | number) {
  return typeof v === 'number' ? v : v.trim() ? Number(v) : NaN
}
function save() {
  try {
    draft.value = parse({
      ...draft.value,
      name: title.value,
      rule: number(rule.value),
      rows: number(rows.value),
      boundary: boundary.value,
      ink: ink.value,
    })
    syncSettings()
  } catch (e) {
    error.value = (e as Error).message
  }
}
function saveSeed() {
  try {
    draft.value = parse({ ...draft.value, seed: seed.value })
    syncSeed()
  } catch (e) {
    seedError.value = (e as Error).message
  }
}
function toggle(i: number) {
  const bits = draft.value.seed.split('')
  bits[i] = bits[i] === '1' ? '0' : '1'
  draft.value = parse({ ...draft.value, seed: bits.join('') })
}
function exportSvg() {
  download(identity.value + '.svg', svgExport(draft.value), 'image/svg+xml')
}
function exportPbm() {
  download(identity.value + '.pbm', pbmExport(draft.value), 'image/x-portable-bitmap')
}
function exportText() {
  download(identity.value + '-rows.txt', textExport(draft.value), 'text/plain;charset=utf-8')
}
</script>
<template>
  <div data-project="vue-cellular-rule-studio" class="min-h-screen">
    <StudioHeader title="Cellular Rule Studio" subtitle="A small rule, many little rows" code="CA"
      ><DataTools
        :workspace="draft"
        :sample="sample"
        :parse="parse"
        :serialize="serialize"
        @replace="replace"
      /><button class="bg-surface hover:bg-soft" @click="about = true">About</button></StudioHeader
    >
    <main class="mx-auto max-w-[1480px] px-4 py-7 sm:px-6 lg:px-8">
      <section class="mb-7 flex flex-wrap items-end justify-between gap-5">
        <div class="min-w-0 max-w-2xl">
          <p class="mb-2 text-xs font-bold uppercase tracking-[.18em] text-accent">
            A RULE THAT GROWS
          </p>
          <h1 class="break-words font-display text-3xl font-semibold leading-tight sm:text-4xl">
            {{ draft.name }}
          </h1>
          <p class="mt-3 max-w-xl leading-relaxed text-muted">
            Start with a row of bits. Choose one small rule, then see what the neighbors make
            together.
          </p>
        </div>
        <div class="rounded-xl border border-line bg-surface px-4 py-3 text-right">
          <span class="block font-mono text-xs text-accent" data-ui="marker">{{ identity }}</span
          ><span class="mt-1 block text-xs text-muted" role="status">{{ storageStatus }}</span>
        </div>
      </section>
      <div
        data-ui="workspace"
        class="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)]"
      >
        <section
          class="flex h-[1020px] min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface"
          data-ui="editor-panel"
        >
          <div class="flex items-center justify-between gap-3 border-b border-line p-5">
            <div>
              <h2 class="text-lg font-semibold">The little rule notebook</h2>
              <p class="mt-1 text-xs text-muted">One row becomes the next · eight neighborhoods</p>
            </div>
            <span class="rounded-full bg-soft px-3 py-1 font-mono text-xs text-accent"
              >Rule {{ draft.rule }}</span
            >
          </div>
          <div class="min-h-0 flex-1 space-y-5 overflow-auto p-5">
            <form @submit.prevent="save" novalidate data-ui="settings-form">
              <label>Workspace name<input v-model="title" maxlength="80" /></label>
              <div class="mt-4 grid grid-cols-2 gap-3">
                <label
                  >Rule number<input
                    v-model="rule"
                    type="number"
                    min="0"
                    max="255"
                    step="1" /></label
                ><label
                  >Row count<input v-model="rows" type="number" min="1" max="64" step="1" /></label
                ><label
                  >Boundary<select v-model="boundary">
                    <option value="wrap">Wrap around</option>
                    <option value="empty">Empty outside</option>
                  </select></label
                ><label>Cell HEX<input v-model="ink" maxlength="7" spellcheck="false" /></label>
              </div>
              <p role="alert" class="mt-3 min-h-6 text-xs text-danger">{{ error }}</p>
              <button
                class="mt-2 w-full border-accent! bg-accent text-on-accent hover:brightness-110"
              >
                Apply rule settings
              </button>
            </form>
            <form
              @submit.prevent="saveSeed"
              novalidate
              class="border-t border-line pt-5"
              data-ui="seed-form"
            >
              <label
                >Seed bits<input
                  v-model="seed"
                  maxlength="64"
                  spellcheck="false"
                  class="font-mono!"
              /></label>
              <p class="mt-3 text-xs leading-relaxed text-muted">
                Use 8–64 bits. The seed is row one, so a row count of one shows only your starting
                pattern.
              </p>
              <p role="alert" class="mt-3 min-h-6 text-xs text-danger">{{ seedError }}</p>
              <button class="mt-2 w-full bg-background text-accent hover:bg-soft">
                Apply seed bits
              </button>
            </form>
            <div>
              <h3 class="font-semibold">Toggle the applied seed</h3>
              <div
                class="mt-3 flex h-20 items-center gap-1 overflow-auto rounded-xl border border-line bg-soft p-3"
                data-ui="seed-cells"
              >
                <button
                  v-for="(bit, i) in draft.seed"
                  :key="i"
                  :data-seed-index="i"
                  :aria-label="'Seed cell ' + (i + 1)"
                  :aria-pressed="bit === '1'"
                  @click="toggle(i)"
                  class="size-8! min-h-8! shrink-0 p-0! font-mono text-xs"
                  :class="
                    bit === '1'
                      ? 'border-accent bg-accent text-white'
                      : 'bg-white text-muted hover:bg-background'
                  "
                >
                  {{ bit }}
                </button>
              </div>
              <p class="mt-3 text-xs leading-relaxed text-muted">
                Cell buttons apply immediately. They preserve pending rule settings. Editing the bit
                string lets you change the width explicitly.
              </p>
            </div>
            <div class="rounded-xl border border-line bg-soft p-4">
              <h3 class="font-semibold">A neighborhood of three</h3>
              <p class="mt-2 text-xs leading-relaxed text-muted">
                A cell reads its left neighbor, itself, and its right neighbor. The rule table
                chooses its next value. All cells advance together using the previous row.
              </p>
              <p class="mt-3 text-xs leading-relaxed text-muted">
                Wrap joins both ends of the row. Empty outside treats missing neighbors as zero. SVG
                uses your color; PBM always maps one to black and zero to white.
              </p>
            </div>
          </div>
        </section>
        <section
          class="flex h-[1020px] min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface"
          data-ui="preview-panel"
        >
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5">
            <div>
              <h2 class="text-lg font-semibold">A pattern from a small rule</h2>
              <p class="mt-1 text-xs text-muted">
                {{ draft.seed.length }} columns · {{ draft.rows }} rows ·
                {{ draft.boundary }} boundary
              </p>
            </div>
            <div class="flex gap-1 rounded-lg bg-background p-1">
              <button
                @click="mode = 'grid'"
                :aria-pressed="mode === 'grid'"
                class="border-0! text-xs"
                :class="
                  mode === 'grid' ? 'bg-white text-accent shadow-sm' : 'bg-transparent text-muted'
                "
              >
                Grid view</button
              ><button
                @click="mode = 'rows'"
                :aria-pressed="mode === 'rows'"
                class="border-0! text-xs"
                :class="
                  mode === 'rows' ? 'bg-white text-accent shadow-sm' : 'bg-transparent text-muted'
                "
              >
                Bit rows
              </button>
            </div>
          </div>
          <div class="min-h-0 flex-1 space-y-5 overflow-auto p-5">
            <div
              class="h-[420px] overflow-auto rounded-xl border border-line bg-background p-4"
              data-ui="grid-frame"
            >
              <AutomatonGrid v-show="mode === 'grid'" :workspace="draft" />
              <div
                v-show="mode === 'rows'"
                class="min-w-[340px] space-y-1 font-mono text-[10px]"
                data-ui="bit-rows"
              >
                <p v-for="(row, i) in grid" :key="i" class="flex gap-3">
                  <span class="w-5 shrink-0 text-muted">{{ i + 1 }}</span
                  ><span>{{ row.join('') }}</span>
                </p>
              </div>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <div class="rounded-xl border border-line p-3">
                <p class="text-[10px] font-semibold uppercase text-muted">All cells</p>
                <p class="mt-1 font-mono text-lg">{{ draft.seed.length * draft.rows }}</p>
              </div>
              <div class="rounded-xl border border-line p-3">
                <p class="text-[10px] font-semibold uppercase text-muted">On cells</p>
                <p class="mt-1 font-mono text-lg" data-ui="on-count">{{ onCount }}</p>
              </div>
              <div class="rounded-xl border border-line p-3">
                <p class="text-[10px] font-semibold uppercase text-muted">Final row on</p>
                <p class="mt-1 font-mono text-lg" data-ui="last-count">{{ lastCount }}</p>
              </div>
            </div>
            <div>
              <h3 class="font-semibold">The complete rule table</h3>
              <div class="mt-3 grid grid-cols-4 gap-2" data-ui="rule-table">
                <div
                  v-for="entry in table"
                  :key="entry.neighborhood"
                  :data-neighborhood="entry.neighborhood"
                  class="rounded-xl border border-line bg-soft p-3 text-center"
                >
                  <p class="font-mono text-xs text-muted">{{ entry.neighborhood }}</p>
                  <p class="mt-2 font-mono text-lg text-accent">{{ entry.result }}</p>
                </div>
              </div>
            </div>
            <p class="text-xs leading-relaxed text-muted">
              Read the table from 111 down to 000. Those eight result bits form the rule number. The
              grid is a finite experiment, not an infinite field; both width and boundary can change
              its later rows.
            </p>
          </div>
          <div class="grid grid-cols-3 gap-2 border-t border-line p-4">
            <button @click="exportSvg" class="bg-background text-xs hover:bg-soft">Grid SVG</button
            ><button @click="exportPbm" class="bg-background text-xs hover:bg-soft">
              Bitmap PBM</button
            ><button @click="exportText" class="bg-background text-xs hover:bg-soft">
              Rows TXT
            </button>
          </div>
        </section>
      </div>
      <footer
        class="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4 text-xs text-muted"
      >
        <span>Made with Vue · Stored on this device</span><span>CodeSculptor · MIT · 2026</span>
      </footer>
    </main>
    <AppDialog v-model="about" title="About Cellular Rule Studio"
      ><div class="space-y-4 leading-relaxed text-muted">
        <p>
          A finite elementary cellular automaton. A Vue render-function component builds the
          accessible SVG and merged cell-run path; complete rows export as plain P1 PBM, SVG, TXT,
          or editable JSON.
        </p>
        <p>
          JSON keeps the editable workspace. Local storage stays on this browser; exports let you
          keep a copy elsewhere.
        </p>
        <a href="/sample-workspace.json" class="font-semibold text-accent underline" download
          >Download the complete sample</a
        >
      </div></AppDialog
    >
  </div>
</template>
