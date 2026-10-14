<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import WorldMap from './WorldMap.vue'
import {
  activeAt,
  clampYear,
  dateForYear,
  displayName,
  eraFor,
  resolveDate,
  isValidDate,
  type Border,
} from './history'
import { events, type HistoryEvent } from './events'
const baseUrl = import.meta.env.BASE_URL
const borders = shallowRef<Border[]>([])
const loading = ref(true)
const error = ref('')
const year = ref(1991)
const activeEvent = ref<HistoryEvent | null>(events.find((e) => e.id === 'ussr-dissolution')!)
const moment = ref<'before' | 'after'>('before')
const eventMode = ref(true)
const customDate = ref<string | null>(null)
const dateError = ref('')
const selected = ref<string | null>(null)
const search = ref('')
const searchOpen = ref(false)
const playing = ref(false)
const dialog = ref<'about' | 'stories' | 'records' | null>(null)
const dialogElement = ref<HTMLDialogElement>()
const focus = ref<{ center: [number, number]; zoom: number; key: number }>({
  center: [0, 0],
  zoom: 1,
  key: 0,
})
const selectedRegion = ref('world')
const requestedDate = computed(() =>
  eventMode.value && activeEvent.value
    ? activeEvent.value[moment.value]
    : (customDate.value ?? dateForYear(year.value)),
)
const resolved = computed(() => resolveDate(requestedDate.value))
const visible = computed(() =>
  resolved.value.available
    ? borders.value.filter((f) => activeAt(f.properties, resolved.value.date))
    : [],
)
const era = computed(() => eraFor(year.value))
const selectedFeature = computed(() =>
  visible.value.find((f) => f.properties.name === selected.value),
)
const highlighted = computed(() => (eventMode.value ? (activeEvent.value?.countries ?? []) : []))
const results = computed(() =>
  visible.value
    .filter((f) =>
      `${displayName(f.properties.name, resolved.value.date)} ${f.properties.name}`
        .toLowerCase()
        .includes(search.value.trim().toLowerCase()),
    )
    .slice(0, 9),
)
const nearbyEvents = computed(() =>
  [...events]
    .sort(
      (a, b) =>
        Math.abs(Number(a.date.slice(0, 4)) - year.value) -
        Math.abs(Number(b.date.slice(0, 4)) - year.value),
    )
    .slice(0, 4)
    .sort((a, b) => a.date.localeCompare(b.date)),
)
const countryRecords = computed(() =>
  borders.value
    .filter((f) => f.properties.code === selectedFeature.value?.properties.code)
    .sort((a, b) => a.properties.start.localeCompare(b.properties.start)),
)
function changeDate(value: string) {
  if (!isValidDate(value)) {
    dateError.value = '请选择1900—2026年之间的有效日期'
    return
  }
  playing.value = false
  customDate.value = value
  year.value = Number(value.slice(0, 4))
  eventMode.value = false
  selected.value = null
  dateError.value = ''
}
function jumpToRecord(record: Border) {
  closeDialog()
  changeDate(record.properties.start < '1900-01-01' ? '1900-01-01' : record.properties.start)
  selected.value = record.properties.name
}
const ticks = [1900, 1910, 1920, 1930, 1940, 1950, 1960, 1970, 1980, 1990, 2000, 2010, 2026]
let timer: ReturnType<typeof setInterval> | undefined
let previousFocus: HTMLElement | null = null
async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const response = await fetch(`${baseUrl}data/borders.geojson`)
    if (!response.ok) throw new Error('地图数据暂时无法读取')
    const json = await response.json()
    if (json.type !== 'FeatureCollection' || !Array.isArray(json.features))
      throw new Error('地图数据格式不正确')
    borders.value = json.features
  } catch (e) {
    error.value = e instanceof Error ? e.message : '地图加载失败，请重试'
  } finally {
    loading.value = false
  }
}
function changeYear(value: number) {
  customDate.value = null
  dateError.value = ''
  year.value = clampYear(value)
  eventMode.value = false
  selected.value = null
}
function chooseEvent(event: HistoryEvent) {
  customDate.value = null
  dateError.value = ''
  playing.value = false
  activeEvent.value = event
  year.value = Number(event.date.slice(0, 4))
  moment.value = 'before'
  eventMode.value = true
  selected.value = null
  closeDialog()
}
function selectCountry(name: string) {
  selected.value = name
  searchOpen.value = false
  search.value = ''
}
function focusEvent() {
  if (activeEvent.value)
    focus.value = {
      center: activeEvent.value.center,
      zoom: activeEvent.value.zoom,
      key: focus.value.key + 1,
    }
}
function focusCountry() {
  if (selectedFeature.value)
    focus.value = {
      center: selectedFeature.value.properties.capitalPoint,
      zoom: 3,
      key: focus.value.key + 1,
    }
}
function changeRegion(value: string) {
  selectedRegion.value = value
  const regions: Record<string, { center: [number, number]; zoom: number }> = {
    world: { center: [0, 0], zoom: 1 },
    europe: { center: [15, 50], zoom: 3 },
    asia: { center: [95, 35], zoom: 2 },
    africa: { center: [20, 0], zoom: 2 },
    americas: { center: [-80, 10], zoom: 1.7 },
    oceania: { center: [138, -22], zoom: 2.3 },
  }
  if (value === 'world') focus.value = { center: [0, 0], zoom: 1, key: focus.value.key + 1 }
  else focus.value = { ...regions[value]!, key: focus.value.key + 1 }
}
function togglePlay() {
  if (!playing.value && year.value === 2026) changeYear(1900)
  playing.value = !playing.value
}
watch(playing, (value) => {
  if (timer) clearInterval(timer)
  if (value) {
    eventMode.value = false
    timer = setInterval(() => {
      if (year.value >= 2026) playing.value = false
      else changeYear(year.value + 1)
    }, 1100)
  }
})
watch(resolved, () => {
  if (selected.value && !visible.value.some((f) => f.properties.name === selected.value))
    selected.value = null
})
function openDialog(value: 'about' | 'stories' | 'records') {
  playing.value = false
  previousFocus = document.activeElement as HTMLElement
  dialog.value = value
  dialogElement.value?.showModal()
}
function closeDialog() {
  dialogElement.value?.close()
  dialog.value = null
  previousFocus?.focus()
  previousFocus = null
}
function keydown(e: KeyboardEvent) {
  const tag = (e.target as HTMLElement).tagName
  if (['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON', 'A'].includes(tag) || dialog.value) return
  if (e.key === '/') {
    e.preventDefault()
    document.querySelector<HTMLInputElement>('.search-wrap input')?.focus()
  }
  if (e.code === 'Space') {
    e.preventDefault()
    togglePlay()
  }
  if (e.code === 'ArrowRight') {
    e.preventDefault()
    playing.value = false
    changeYear(year.value + 1)
  }
  if (e.code === 'ArrowLeft') {
    e.preventDefault()
    playing.value = false
    changeYear(year.value - 1)
  }
}
onMounted(() => {
  void loadData()
  window.addEventListener('keydown', keydown)
})
onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
  window.removeEventListener('keydown', keydown)
})
</script>

<template>
  <div class="atlas-app">
    <header class="site-header">
      <a
        class="brand"
        href="#"
        aria-label="经纬之间首页"
        @click.prevent="
          () => {
            changeYear(1991)
            changeRegion('world')
          }
        "
        ><span class="brand-icon"
          ><svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <circle cx="16" cy="16" r="13" />
            <ellipse cx="16" cy="16" rx="6" ry="13" />
            <path d="M3 16h26M6 8h20M6 24h20" /></svg></span
        ><span>经纬之间<small>THE WORLD, THROUGH TIME</small></span></a
      >
      <nav aria-label="主导航">
        <button class="nav-active" @click="closeDialog">地图探索</button
        ><button @click="openDialog('stories')">历史专题 <span class="nav-dot"></span></button
        ><button @click="openDialog('about')">关于这份地图</button>
      </nav>
      <div class="header-date"><span></span>1900 — 2026 <small>世界历史地图集</small></div>
    </header>
    <main>
      <section class="intro-bar">
        <div>
          <span class="eyebrow">A JOURNEY ACROSS BORDERS</span>
          <h1>世界从来不是一成不变的。</h1>
        </div>
        <p>沿着时间，探索国家的诞生、分合与变迁。<br /><span>每一条边界，都是一段历史。</span></p>
      </section>
      <section class="explorer" aria-label="历史地图探索器">
        <div class="explorer-toolbar">
          <div class="view-controls">
            <span class="mini-globe">◎</span
            ><select
              aria-label="地图区域"
              :value="selectedRegion"
              @change="changeRegion(($event.target as HTMLSelectElement).value)"
            >
              <option value="world">世界全图</option>
              <option value="europe">欧洲</option>
              <option value="asia">亚洲</option>
              <option value="africa">非洲</option>
              <option value="americas">美洲</option>
              <option value="oceania">大洋洲</option>
</select
            ><span class="toolbar-divider"></span
            ><span class="layer-label"><i></i> 来源边界 · 待复核</span>
          </div>
          <div
            class="search-wrap"
            @focusout="
              (e: FocusEvent) => {
                if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node))
                  searchOpen = false
              }
            "
          >
            <span aria-hidden="true">⌕</span
            ><input
              v-model="search"
              aria-label="搜索当前地图的国家或地区"
              placeholder="搜索当前地图的国家或地区"
              @focus="searchOpen = true"
              @keydown.escape="searchOpen = false"
              @keydown.enter="results[0] && selectCountry(results[0].properties.name)"
            /><kbd>/</kbd>
            <div v-if="searchOpen && search.trim()" class="search-results">
              <button v-for="f in results" :key="f.id" @click="selectCountry(f.properties.name)">
                {{ displayName(f.properties.name, resolved.date)
                }}<small>{{ f.properties.name }}</small>
              </button>
              <p v-if="!results.length">当前日期没有匹配的地区。试试其他年份或英文名称。</p>
            </div>
          </div>
        </div>
        <div class="explorer-body">
          <section class="map-panel" aria-label="地图">
            <div class="map-heading">
              <div>
                <div class="map-date">{{ resolved.date.slice(0, 4) }}<span>年</span></div>
                <p>{{ era.title }}</p>
              </div>
              <span class="snapshot-chip"
                ><span></span>{{ resolved.date.replaceAll('-', '.') }} ·
                {{ resolved.available ? '来源快照' : '暂无数据' }}</span
              >
            </div>
            <div v-if="!resolved.available" class="coverage-notice" role="status">
              <strong>{{ year }} 年边界数据待补充</strong
              ><span>可靠资料尚未补齐，此日期不绘制国家边界。</span>
            </div>
            <div v-if="loading" class="map-state" role="status">
              <span class="loading-orbit"></span>正在展开历史地图…<small
                >首次加载本地历史边界数据</small
              >
            </div>
            <div v-else-if="error" class="map-state" role="alert">
              {{ error }}<button class="primary-button" @click="loadData">重新加载</button>
            </div>
            <div v-else-if="!resolved.available" class="map-state missing-state">
              <span class="missing-symbol">◎</span><strong>让空白保持诚实。</strong>
              <small>这一时期的边界正在等待可靠的历史资料。</small>
              <button class="primary-button" @click="changeYear(2019)">查看 2019 年来源地图</button>
            </div>
            <WorldMap
              v-else
              :features="visible"
              :date="resolved.date"
              :highlighted="highlighted"
              :selected="selected"
              :focus="focus"
              @select="selectCountry"
            />
            <div v-if="selectedFeature" class="country-card">
              <button class="close-country" aria-label="关闭地区详情" @click="selected = null">
                ×
</button
              ><span class="eyebrow">地图上的这一刻</span>
              <h3>{{ displayName(selectedFeature.properties.name, resolved.date) }}</h3>
              <p>{{ selectedFeature.properties.name }}</p>
              <div>
                记录有效期
                <span
                  >{{ selectedFeature.properties.start }} —
                  {{ selectedFeature.properties.end }}</span
                >
              </div>
              <button @click="focusCountry">定位到这一地区 <span>↗</span></button
              ><button class="record-button" @click="openDialog('records')">
                查看边界版本与来源 <span>↗</span>
              </button>
              <small>来源已导入 · 逐条史料复核尚未完成</small>
            </div>
            <div v-if="resolved.available && !loading && !error" class="research-badge">
              <span></span>来源资料层 · 未完成独立考证
            </div>
            <div v-if="resolved.available" class="map-legend">
              <span><i class="legend-land"></i>国家 / 地区</span
              ><span><i class="legend-event"></i>专题相关地区</span
              ><button @click="openDialog('about')">数据口径 ⓘ</button>
            </div>
          </section>
          <aside class="event-panel">
            <div class="panel-heading">
              <span class="eyebrow">HISTORY IN FOCUS</span><span class="small-square">↗</span>
            </div>
            <template v-if="activeEvent && eventMode"
              >
<div class="event-meta">
                <span class="category-tag">{{ activeEvent.category }}</span
                ><span>{{ activeEvent.region }}</span>
              </div>
              <time>{{ activeEvent.date.replaceAll('-', ' / ') }}</time>
              <h2>{{ activeEvent.title }}</h2>
              <p class="event-summary">{{ activeEvent.summary }}</p>
              <div class="event-decoration" aria-hidden="true">
                <span></span><i>✦</i><span></span>
              </div>
              <p class="event-detail">{{ activeEvent.detail }}</p>
              <div class="comparison" aria-label="事件前后地图">
                <button
                  :class="{ active: moment === 'before' }"
                  @click="
                    () => {
                      moment = 'before'
                      selected = null
                    }
                  "
                >
                  变化前<small>{{ activeEvent.before.replaceAll('-', '.') }}</small>
</button
                ><button
                  :class="{ active: moment === 'after' }"
                  @click="
                    () => {
                      moment = 'after'
                      selected = null
                    }
                  "
                >
                  变化后<small>{{ activeEvent.after.replaceAll('-', '.') }}</small>
                </button>
              </div>
              <button class="focus-button" @click="focusEvent">在地图上聚焦 <span>↗</span></button
              ><a
                class="source-link"
                :href="activeEvent.source"
                target="_blank"
                rel="noopener noreferrer"
                >{{ activeEvent.sourceLabel }} ↗</a
              >
</template
            >
            <template v-else
              >
<div class="event-meta"><span class="category-tag">年代探索</span></div>
              <time>{{ year }} / YEAR</time>
              <h2>{{ era.title }}</h2>
              <p class="event-summary">{{ era.subtitle }}</p>
              <p class="event-detail">
                {{
                  !resolved.available
                    ? '这一年份超出当前历史边界数据范围。你仍可探索历史专题，或回到2019年及更早的地图。'
                    : '拖动时间轴，观察世界版图。选择下方事件，查看发生前后的变化与历史背景。地图默认展示所选年份的年末状态。'
                }}
              </p>
</template
            >
            <div class="nearby-events">
              <div class="section-label">
                继续探索 <button @click="openDialog('stories')">全部专题 ↗</button>
              </div>
              <button
                v-for="event in nearbyEvents
                  .filter((e) => !eventMode || e.id !== activeEvent?.id)
                  .slice(0, 3)"
                :key="event.id"
                class="nearby-event"
                @click="chooseEvent(event)"
              >
                <span>{{ event.date.slice(0, 4) }}</span
                ><strong>{{ event.title }}</strong
                ><span>↗</span>
              </button>
            </div>
          </aside>
        </div>
        <section class="date-toolbar" aria-label="日期与来源状态">
          <label
            >查阅日期
            <input
              type="date"
              aria-label="选择具体日期"
              :value="requestedDate"
              min="1900-01-01"
              max="2026-12-31"
              @change="changeDate(($event.target as HTMLInputElement).value)"
          /></label>
          <span v-if="dateError" role="alert">{{ dateError }}</span>
          <span v-else>按来源日期检索 · 日期精度尚需逐条考证</span>
          <button @click="openDialog('about')">核查范围与资料缺口 ↗</button>
        </section>
        <section class="timeline-panel" aria-label="历史时间轴">
          <div class="timeline-top">
            <div class="timeline-title">
              <span class="eyebrow">穿行于时间</span><span>年份探索 / 按日查阅</span>
            </div>
            <div class="timeline-actions">
              <span v-if="playing" class="playing-status">正在播放 · 每秒一年</span
              ><button
                class="step-button"
                aria-label="上一年"
                :disabled="year === 1900"
                @click="
                  () => {
                    playing = false
                    changeYear(year - 1)
                  }
                "
              >
                ‹
</button
              ><label class="year-input"
                ><input
                  :value="year"
                  aria-label="选择年份"
                  type="number"
                  min="1900"
                  max="2026"
                  @change="
                    ($event) => {
                      playing = false
                      changeYear(Number(($event.target as HTMLInputElement).value))
                    }
                  "
                /><span>年</span></label
              ><button
                class="step-button"
                aria-label="下一年"
                :disabled="year === 2026"
                @click="
                  () => {
                    playing = false
                    changeYear(year + 1)
                  }
                "
              >
                ›
</button
              ><button
                class="play-button"
                :aria-label="playing ? '暂停历史播放' : '播放历史'"
                @click="togglePlay"
              >
                <span>{{ playing ? 'Ⅱ' : '▶' }}</span
                >{{ playing ? '暂停' : '播放历史' }}
              </button>
            </div>
          </div>
          <div class="timeline-track">
            <div class="era-stripes">
              <span style="flex: 14">帝国时代</span><span style="flex: 31">世界大战</span
              ><span style="flex: 46">冷战与独立</span><span style="flex: 35">当代世界</span>
            </div>
            <div class="event-markers">
              <button
                v-for="(event, eventIndex) in events"
                :key="event.id"
                :style="{ left: `${((Number(event.date.slice(0, 4)) - 1900) / 126) * 100}%`, top: `${(eventIndex % 3) * 11}px` }"
                :class="{ current: activeEvent?.id === event.id && eventMode }"
                :aria-label="`${event.date.slice(0, 4)}年：${event.title}`"
                :title="`${event.date.slice(0, 4)} · ${event.title}`"
                @click="chooseEvent(event)"
              ></button>
            </div>
            <input
              class="year-range"
              :value="year"
              type="range"
              min="1900"
              max="2026"
              step="1"
              aria-label="历史年份时间轴"
              :style="{ '--progress': `${((year - 1900) / 126) * 100}%` }"
              @input="
                ($event) => {
                  playing = false
                  changeYear(Number(($event.target as HTMLInputElement).value))
                }
              "
            />
            <div class="year-ticks">
              <button
                v-for="tick in ticks"
                :key="tick"
                :style="{ left: `${((tick - 1900) / 126) * 100}%` }"
                @click="
                  () => {
                    playing = false
                    changeYear(tick)
                  }
                "
              >
                {{ tick }}
              </button>
            </div>
          </div>
          <div class="timeline-bottom">
            <span
              ><i></i> 历史事件节点 <span class="timeline-tip">点击节点，回到历史现场</span></span
            ><span>← → 切换年份 <span class="key-separator">/</span> 空格 播放与暂停</span>
          </div>
        </section>
      </section>
      <footer>
        <span>经纬之间 <i>·</i> 理解过去，才能看见现在。</span
        ><button @click="openDialog('about')">
          历史边界：CShapes 2.0 · ETH Zurich <span>↗</span>
        </button>
      </footer>
    </main>
    <dialog
      ref="dialogElement"
      class="info-dialog"
      @cancel.prevent="closeDialog"
      @click="
        (e) => {
          if (e.target === dialogElement) closeDialog()
        }
      "
    >
      <div class="dialog-inner">
        <button class="dialog-close" aria-label="关闭弹窗" @click="closeDialog">×</button
        ><template v-if="dialog === 'about'"
          >
<span class="eyebrow">ABOUT THE ATLAS</span>
          <h2>每一条边界，都有它的语境。</h2>
          <p>
            这是一份用于探索世界历史的交互地图。时间轴覆盖1900—2026年，历史边界数据实际覆盖至<strong>2019年12月31日</strong>。2020—2026年不绘制无依据的边界，直接提示资料缺口。
          </p>
          <h3>地图如何表达历史？</h3>
          <p>
            边界来自苏黎世联邦理工 CShapes 2.0，使用
            Gleditsch–Ward（GW）编码的独立国家及属地记录。它不是每天的军事控制线、完整的主权声明地图，也不包含所有微型国家或地区。图中不同颜色用于区分要素，不代表外交阵营或独立地位。
          </p>
          <p>
            边界日期采用数据中的年月日字段。国家名称另按重要历史日期做中文说明。事件发生日与数据中的边界生效日可能不同；每次对比都会展示实际快照日期。争议地区沿用数据源口径，例如2014年后的克里米亚记录，不代表对主权归属的认定。
          </p>
          <h3>为什么还不能称为“完整精确版”？</h3>
          <p>
            来源说明文档第3—4页指出：部分日期以月初或年初占位；部分小于1万平方公里的变化未收录；战争期间短暂占领通常被省略；缺少历史证据时，有些现代边界被回溯用于早期年份。按日筛选不代表已经具备逐日准确性。
          </p>
          <p>
            本次下载的GeoJSON还缺少说明文档列出的殖民／保护国状态、宗主国和边界是否明确等字段，不能仅凭名称推断。当前所有记录均标为“来源已导入、尚未逐条独立考证”。
          </p>
          <h3>数据与许可</h3>
          <p>
            Schvitz, Rüegger, Girardin, Cederman, Weidmann & Gleditsch (2022), “Mapping The
            International System, 1886–2017: The CShapes 2.0 Dataset.” 数据采用
            <a
              href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
              target="_blank"
              rel="noopener noreferrer"
              >CC BY-NC-SA 4.0</a
            >，限非商业使用并须署名、相同方式共享。当前副本于2026年10月14日获取，保留原始坐标精度，仅整理字段和适配绘制方向。
          </p>
          <div class="dialog-links">
            <a href="https://icr.ethz.ch/data/cshapes/" target="_blank" rel="noopener noreferrer"
              >数据来源 ↗</a
            ><a
              href="https://icr.ethz.ch/data/cshapes/CShapes-2.0_Codebook.pdf"
              target="_blank"
              rel="noopener noreferrer"
              >编码说明 ↗</a
            ><a :href="`${baseUrl}data/provenance.json`" target="_blank" rel="noopener noreferrer"
              >本地数据记录 ↗</a
            >
            <a :href="`${baseUrl}data/research-register.json`" target="_blank" rel="noopener noreferrer"
              >边界核查台账 ↗</a
            >
          </div>
</template
        ><template v-else-if="dialog === 'records'">
          <span class="eyebrow">BORDER EVIDENCE REGISTER</span>
          <h2>
            {{
              selectedFeature ? displayName(selectedFeature.properties.name, resolved.date) : '地区'
            }}
            · 边界记录
          </h2>
          <p>
            来源：CShapes 2.0 / GW
            编码。逐条史料复核尚未完成。下面的日期是数据记录的有效期；记录更新可能来自首都或属性变化，不一定是领土变化。
          </p>
          <p>
            坐标保留来源精度。原始行号用于回溯GeoJSON要素；“同前轮廓”仅指来源几何完全一致，不代表法理地位相同。
          </p>
          <div class="record-list">
            <button
              v-for="(record, i) in countryRecords"
              :key="record.id"
              class="record-row"
              @click="jumpToRecord(record)"
            >
              <span>{{ record.properties.start }} — {{ record.properties.end }}</span>
              <strong>{{ record.properties.name }}</strong>
              <small
                >原始记录 #{{ record.properties.sourceRecord }} ·
                {{
                  i > 0 &&
                  record.properties.geometryId === countryRecords[i - 1]?.properties.geometryId
                    ? '同前轮廓 / 属性记录'
                    : '几何版本待核查'
                }}
                · {{ record.properties.area.toLocaleString('zh-CN') }} km²（来源值）</small
              >
              <em>查看这一时期 ↗</em>
            </button>
          </div>
          <div class="dialog-links">
            <a
              href="https://icr.ethz.ch/data/cshapes/CShapes-2.0.geojson"
              target="_blank"
              rel="noopener noreferrer"
              >原始数据 ↗</a
            ><a :href="`${baseUrl}data/research-register.json`" target="_blank" rel="noopener noreferrer"
              >下载核查台账 ↗</a
            >
          </div>
</template
        ><template v-else
          >
<span class="eyebrow">STORIES THAT SHAPED THE WORLD</span>
          <h2>改变世界地图的时刻</h2>
          <p>从帝国落幕到国家新生，沿着 {{ events.length }} 个精选节点探索。专题持续补充中。</p>
          <div class="story-grid">
            <button v-for="event in events" :key="event.id" @click="chooseEvent(event)">
              <span
                >{{ event.date.slice(0, 4) }} <i>{{ event.category }}</i></span
              >
              <h3>{{ event.title }}</h3>
              <p>{{ event.summary }}</p>
              <span class="story-arrow">探索这段历史 ↗</span>
            </button>
          </div>
</template
        >
      </div>
    </dialog>
  </div>
</template>
