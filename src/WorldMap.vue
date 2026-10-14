<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { geoGraticule10, geoNaturalEarth1, geoPath } from 'd3-geo'
import { displayName, type Border } from './history'
const props = defineProps<{
  features: Border[]
  date: string
  highlighted: string[]
  selected: string | null
  focus: { center: [number, number]; zoom: number; key: number }
}>()
const emit = defineEmits<{ select: [name: string] }>()
const projection = geoNaturalEarth1().fitExtent(
  [
    [20, 22],
    [1100, 563],
  ],
  { type: 'Sphere' },
)
const path = geoPath(projection)
const graticule = path(geoGraticule10()) ?? ''
const sphere = path({ type: 'Sphere' }) ?? ''
const cache = new Map<string | number | undefined, { d: string; center: [number, number] }>()
const shapes = computed(() =>
  props.features.map((f) => {
    if (!cache.has(f.id)) cache.set(f.id, { d: path(f) ?? '', center: path.centroid(f) })
    return { feature: f, ...cache.get(f.id)! }
  }),
)
const zoom = ref(1)
const offset = ref<[number, number]>([0, 0])
const hover = ref<string | null>(null)
const svg = ref<SVGSVGElement>()
const drag = ref<{ x: number; y: number; offset: [number, number]; moved: boolean } | null>(null)
let ignoreClick = false
const palette = [
  '#bdcabb',
  '#d2c6ab',
  '#d8b8a8',
  '#b6c9c9',
  '#c2c3d3',
  '#c8cfad',
  '#d6c5bc',
  '#bac9ad',
]
function fill(f: Border) {
  if (f.properties.name === props.selected) return '#b76f54'
  if (props.highlighted.includes(f.properties.name))
    return f.properties.name === 'Russia (Soviet Union)'
      ? '#c89581'
      : palette[(f.properties.code * 7) % palette.length]
  return palette[(f.properties.code * 7) % palette.length]
}
function reset() {
  zoom.value = 1
  offset.value = [0, 0]
}
function setZoom(next: number) {
  const value = Math.max(1, Math.min(8, next))
  const ratio = value / zoom.value
  offset.value = [560 - (560 - offset.value[0]) * ratio, 292 - (292 - offset.value[1]) * ratio]
  zoom.value = value
  if (value === 1) offset.value = [0, 0]
}
watch(
  () => props.focus,
  (focus) => {
    if (focus.zoom === 1) {
      reset()
      return
    }
    const p = projection(focus.center)
    if (p) {
      zoom.value = focus.zoom
      offset.value = [560 - p[0] * focus.zoom, 292 - p[1] * focus.zoom]
    }
  },
  { immediate: true },
)
function pointerDown(e: PointerEvent) {
  if (e.button !== 0) return
  drag.value = { x: e.clientX, y: e.clientY, offset: [...offset.value], moved: false }
  ignoreClick = false
}
function pointerMove(e: PointerEvent) {
  if (!drag.value || !svg.value) return
  const scale = 1120 / svg.value.getBoundingClientRect().width
  const dx = (e.clientX - drag.value.x) * scale
  const dy = (e.clientY - drag.value.y) * scale
  if (Math.abs(dx) + Math.abs(dy) > 5) {
    drag.value.moved = true
    svg.value.setPointerCapture(e.pointerId)
  }
  if (drag.value.moved) offset.value = [drag.value.offset[0] + dx, drag.value.offset[1] + dy]
}
function pointerUp() {
  ignoreClick = drag.value?.moved ?? false
  drag.value = null
}
function choose(name: string) {
  if (!ignoreClick) emit('select', name)
  ignoreClick = false
}
const labels = computed(() =>
  shapes.value.filter((s) => s.feature.properties.area > (zoom.value > 2 ? 250000 : 2100000)),
)
</script>

<template>
  <div class="world-map">
    <svg
      ref="svg"
      viewBox="0 0 1120 585"
      role="img"
      aria-label="可交互世界历史地图，可通过国家搜索框选择地区"
      :class="{ dragging: drag?.moved }"
      @pointerdown="pointerDown"
      @pointermove="pointerMove"
      @pointerup="pointerUp"
      @pointercancel="pointerUp"
      @pointerleave="hover = null"
    >
      <defs>
        <pattern id="paper" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.45" fill="#849a91" opacity=".09" />
        </pattern>
      </defs>
      <rect width="1120" height="585" fill="url(#paper)" />
      <g :transform="`translate(${offset[0]},${offset[1]}) scale(${zoom})`">
        <path :d="sphere" fill="#e8eeea" stroke="#d8e0d8" stroke-width="0.6" />
        <path :d="graticule" fill="none" stroke="#b4c2b9" stroke-opacity=".27" stroke-width="0.5" />
        <path
          v-for="shape in shapes"
          :key="shape.feature.id"
          :d="shape.d"
          :fill="fill(shape.feature)"
          :data-country="shape.feature.properties.name"
          class="country"
          :class="{
            chosen: shape.feature.properties.name === selected,
            related: highlighted.includes(shape.feature.properties.name),
          }"
          vector-effect="non-scaling-stroke"
          @mouseenter="hover = displayName(shape.feature.properties.name, date)"
          @mouseleave="hover = null"
          @click="choose(shape.feature.properties.name)"
        >
          <title>{{ displayName(shape.feature.properties.name, date) }}</title>
        </path>
        <g class="map-labels" pointer-events="none">
          <text
            v-for="shape in labels"
            :key="shape.feature.id"
            :x="shape.center[0]"
            :y="shape.center[1]"
            :font-size="11 / Math.sqrt(zoom)"
            :class="{ 'label-active': highlighted.includes(shape.feature.properties.name) }"
          >
            {{ displayName(shape.feature.properties.name, date).replace(/（.*）/, '') }}
          </text>
        </g>
        <g v-if="zoom < 1.5" class="ocean-label" pointer-events="none">
          <text x="130" y="335">太 平 洋</text>
          <text x="415" y="340">大 西 洋</text>
          <text x="785" y="405">印 度 洋</text>
          <text x="1015" y="340">太 平 洋</text>
        </g>
      </g>
    </svg>
    <div class="map-tools" aria-label="地图控制">
      <button aria-label="放大地图" title="放大" :disabled="zoom >= 8" @click="setZoom(zoom * 1.4)">
        ＋
</button
      ><button
        aria-label="缩小地图"
        title="缩小"
        :disabled="zoom <= 1"
        @click="setZoom(zoom / 1.4)"
      >
        −
</button
      ><span></span
      ><button class="reset-map" aria-label="重置世界视图" title="世界视图" @click="reset">
        ⌖
      </button>
    </div>
    <div class="map-compass" aria-hidden="true"><span>N</span><i></i></div>
    <div v-if="hover" class="map-tooltip">{{ hover }}</div>
    <div class="map-hint">拖动探索地图 <span>·</span> 点击地区了解详情</div>
  </div>
</template>
