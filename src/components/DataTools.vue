<script setup lang="ts">
import { ref } from 'vue'
import AppDialog from './AppDialog.vue'
import DataExchange from './DataExchange.vue'
import { jsonText } from '../domain/validation'
import { download } from '../services/files'
const props = defineProps<{
  workspace: unknown
  sample: unknown
  parse: (value: unknown) => unknown
  serialize: (value: unknown) => { provenance: { marker: string } }
}>()
const emit = defineEmits<{ replace: [value: unknown] }>()
const open = ref(false),
  source = ref(''),
  error = ref(''),
  restore = ref(false)
function begin() {
  source.value = ''
  error.value = ''
  open.value = true
}
function apply() {
  try {
    const value = props.parse(jsonText(source.value))
    emit('replace', value)
    open.value = false
  } catch (e) {
    error.value = (e as Error).message
  }
}
function save() {
  const value = props.serialize(props.workspace)
  download(`${value.provenance.marker}.json`, JSON.stringify(value, null, 2))
}
function reset() {
  emit('replace', props.parse(props.sample))
  restore.value = false
}
</script>
<template>
  <button class="bg-surface hover:bg-soft" @click="begin">Import</button>
  <button class="bg-surface hover:bg-soft" @click="save">JSON</button>
  <button class="bg-surface hover:bg-soft" @click="restore = true">Restore sample</button>
  <slot />
  <DataExchange v-model="open" v-model:text="source" :error="error" @apply="apply" />
  <AppDialog v-model="restore" title="Restore the sample?">
    <p class="leading-relaxed text-muted">
      This replaces your current workspace. Export a JSON copy to keep your changes.
    </p>
    <div class="mt-6 flex flex-wrap justify-end gap-2">
      <button class="hover:bg-soft" @click="restore = false">Cancel</button
      ><button class="border-accent! bg-accent text-on-accent hover:brightness-110" @click="reset">
        Restore sample
      </button>
    </div>
  </AppDialog>
</template>
