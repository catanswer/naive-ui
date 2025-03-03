import {
  h,
  ref,
  defineComponent,
  computed,
  PropType,
  onMounted,
  onBeforeUnmount,
  mergeProps,
  renderSlot,
  Transition,
  CSSProperties,
  watchEffect,
  VNode,
  HTMLAttributes
} from 'vue'
import { on, off } from 'evtd'
import { VResizeObserver } from 'vueuc'
import { useIsIos } from 'vooks'
import { useConfig, useTheme } from '../../../_mixins'
import type { ThemeProps } from '../../../_mixins'
import type {
  ExtractInternalPropTypes,
  ExtractPublicPropTypes
} from '../../../_utils'
import { scrollbarLight } from '../styles'
import type { ScrollbarTheme } from '../styles'
import style from './styles/index.cssr'

export interface ScrollTo {
  (x: number, y: number): void
  (options: {
    left?: number
    top?: number
    behavior?: ScrollBehavior
    debounce?: boolean
  }): void
  (options: {
    el: HTMLElement
    behavior?: ScrollBehavior
    debounce?: boolean
  }): void
  (options: {
    index: number
    elSize: number
    behavior?: ScrollBehavior
    debounce?: boolean
  }): void
  (options: {
    position: 'top' | 'bottom'
    behavior?: ScrollBehavior
    debounce?: boolean
  }): void
}

export interface ScrollbarInst {
  scrollTo: ScrollTo
  sync: () => void
  containerRef: HTMLElement | null
  contentRef: HTMLElement | null
  containerScrollTop: number
}

const scrollbarProps = {
  ...(useTheme.props as ThemeProps<ScrollbarTheme>),
  size: {
    type: Number,
    default: 5
  },
  duration: {
    type: Number,
    default: 0
  },
  scrollable: {
    type: Boolean,
    default: true
  },
  xScrollable: {
    type: Boolean,
    default: false
  },
  showScrollbar: {
    type: Boolean,
    default: true
  },
  // If container is set, resize observer won't not attached
  container: Function as PropType<() => HTMLElement | null | undefined>,
  content: Function as PropType<() => HTMLElement | null | undefined>,
  containerClass: String,
  containerStyle: [String, Object] as PropType<string | CSSProperties>,
  contentClass: String,
  contentStyle: [String, Object] as PropType<string | CSSProperties>,
  horizontalRailStyle: [String, Object] as PropType<string | CSSProperties>,
  verticalRailStyle: [String, Object] as PropType<string | CSSProperties>,
  onScroll: Function as PropType<(e: Event) => void>,
  onWheel: Function as PropType<(e: WheelEvent) => void>,
  onResize: Function as PropType<(e: ResizeObserverEntry) => void>,
  internalOnUpdateScrollLeft: Function as PropType<(scrollLeft: number) => void>
} as const

export type ScrollbarProps = ExtractPublicPropTypes<typeof scrollbarProps>
export type ScrollbarInternalProps = ExtractInternalPropTypes<
  typeof scrollbarProps
>

const Scrollbar = defineComponent({
  name: 'Scrollbar',
  props: scrollbarProps,
  inheritAttrs: false,
  setup (props) {
    const { mergedClsPrefixRef } = useConfig(props)

    // dom ref
    const wrapperRef = ref<HTMLElement | null>(null)
    const containerRef = ref<HTMLElement | null>(null)
    const contentRef = ref<HTMLElement | null>(null)
    const yRailRef = ref<HTMLElement | null>(null)
    const xRailRef = ref<HTMLElement | null>(null)

    // data ref
    const contentHeightRef = ref<number | null>(null)
    const contentWidthRef = ref<number | null>(null)
    const containerHeightRef = ref<number | null>(null)
    const containerWidthRef = ref<number | null>(null)
    const yRailSizeRef = ref<number | null>(null)
    const xRailSizeRef = ref<number | null>(null)
    const containerScrollTopRef = ref(0)
    const containerScrollLeftRef = ref(0)
    const isShowXBarRef = ref(false)
    const isShowYBarRef = ref(false)

    let yBarPressed = false
    let xBarPressed = false
    let xBarVanishTimerId: number | undefined
    let yBarVanishTimerId: number | undefined
    let memoYTop: number = 0
    let memoXLeft: number = 0
    let memoMouseX: number = 0
    let memoMouseY: number = 0
    const isIos = useIsIos()

    const yBarSizeRef = computed(() => {
      const { value: containerHeight } = containerHeightRef
      const { value: contentHeight } = contentHeightRef
      const { value: yRailSize } = yRailSizeRef
      if (
        containerHeight === null ||
        contentHeight === null ||
        yRailSize === null
      ) {
        return 0
      } else {
        return Math.min(
          containerHeight,
          (yRailSize * containerHeight) / contentHeight + props.size * 1.5
        )
      }
    })
    const yBarSizePxRef = computed(() => {
      return `${yBarSizeRef.value}px`
    })
    const xBarSizeRef = computed(() => {
      const { value: containerWidth } = containerWidthRef
      const { value: contentWidth } = contentWidthRef
      const { value: xRailSize } = xRailSizeRef
      if (
        containerWidth === null ||
        contentWidth === null ||
        xRailSize === null
      ) {
        return 0
      } else {
        return (xRailSize * containerWidth) / contentWidth + props.size * 1.5
      }
    })
    const xBarSizePxRef = computed(() => {
      return `${xBarSizeRef.value}px`
    })
    const yBarTopRef = computed(() => {
      const { value: containerHeight } = containerHeightRef
      const { value: containerScrollTop } = containerScrollTopRef
      const { value: contentHeight } = contentHeightRef
      const { value: yRailSize } = yRailSizeRef
      if (
        containerHeight === null ||
        contentHeight === null ||
        yRailSize === null
      ) {
        return 0
      } else {
        return (
          (containerScrollTop / (contentHeight - containerHeight)) *
          (yRailSize - yBarSizeRef.value)
        )
      }
    })
    const yBarTopPxRef = computed(() => {
      return `${yBarTopRef.value}px`
    })
    const xBarLeftRef = computed(() => {
      const { value: containerWidth } = containerWidthRef
      const { value: containerScrollLeft } = containerScrollLeftRef
      const { value: contentWidth } = contentWidthRef
      const { value: xRailSize } = xRailSizeRef
      if (
        containerWidth === null ||
        contentWidth === null ||
        xRailSize === null
      ) {
        return 0
      } else {
        return (
          (containerScrollLeft / (contentWidth - containerWidth)) *
          (xRailSize - xBarSizeRef.value)
        )
      }
    })
    const xBarLeftPxRef = computed(() => {
      return `${xBarLeftRef.value}px`
    })
    const needYBarRef = computed(() => {
      const { value: containerHeight } = containerHeightRef
      const { value: contentHeight } = contentHeightRef
      return (
        containerHeight !== null &&
        contentHeight !== null &&
        contentHeight > containerHeight
      )
    })
    const needXBarRef = computed(() => {
      const { value: containerWidth } = containerWidthRef
      const { value: contentWidth } = contentWidthRef
      return (
        containerWidth !== null &&
        contentWidth !== null &&
        contentWidth > containerWidth
      )
    })
    const mergedContainerRef = computed(() => {
      const { container } = props
      if (container) return container()
      return containerRef.value
    })
    const mergedContentRef = computed(() => {
      const { content } = props
      if (content) return content()
      return contentRef.value
    })

    // methods
    const handleContentResize = sync
    const handleContainerResize = (e: ResizeObserverEntry): void => {
      const { onResize } = props
      if (onResize) onResize(e)
      sync()
    }
    interface MergedScrollOptions {
      left?: number
      top?: number
      el?: HTMLElement
      position?: 'top' | 'bottom'
      behavior?: ScrollBehavior
      debounce?: boolean
      index?: number
      elSize?: number
    }
    const scrollTo: ScrollTo = (
      options: MergedScrollOptions | number,
      y?: number
    ): void => {
      if (!props.scrollable) return
      if (typeof options === 'number') {
        scrollToPosition(options, y ?? 0, 0, false, 'auto')
        return
      }
      const {
        left,
        top,
        index,
        elSize,
        position,
        behavior,
        el,
        debounce = true
      } = options
      if (left !== undefined || top !== undefined) {
        scrollToPosition(left ?? 0, top ?? 0, 0, false, behavior)
      }
      if (el !== undefined) {
        scrollToPosition(0, el.offsetTop, el.offsetHeight, debounce, behavior)
      } else if (index !== undefined && elSize !== undefined) {
        scrollToPosition(0, index * elSize, elSize, debounce, behavior)
      } else if (position === 'bottom') {
        scrollToPosition(0, Number.MAX_SAFE_INTEGER, 0, false, behavior)
      } else if (position === 'top') {
        scrollToPosition(0, 0, 0, false, behavior)
      }
    }
    function scrollToPosition (
      left: number,
      top: number,
      elSize: number,
      debounce: boolean,
      behavior?: ScrollBehavior
    ): void {
      const { value: container } = mergedContainerRef
      if (!container) return
      if (debounce) {
        const { scrollTop, offsetHeight } = container
        if (top > scrollTop) {
          if (top + elSize <= scrollTop + offsetHeight) {
            // do nothing
          } else {
            container.scrollTo({
              left,
              top: top + elSize - offsetHeight,
              behavior
            })
          }
          return
        }
      }
      container.scrollTo({
        left,
        top,
        behavior
      })
    }
    function handleMouseEnterWrapper (): void {
      showXBar()
      showYBar()
      sync()
    }
    function handleMouseLeaveWrapper (): void {
      hideBar()
    }
    function hideBar (): void {
      hideYBar()
      hideXBar()
    }
    function hideYBar (): void {
      if (yBarVanishTimerId !== undefined) {
        window.clearTimeout(yBarVanishTimerId)
      }
      yBarVanishTimerId = window.setTimeout(() => {
        isShowYBarRef.value = false
      }, props.duration)
    }
    function hideXBar (): void {
      if (xBarVanishTimerId !== undefined) {
        window.clearTimeout(xBarVanishTimerId)
      }
      xBarVanishTimerId = window.setTimeout(() => {
        isShowXBarRef.value = false
      }, props.duration)
    }
    function showXBar (): void {
      if (xBarVanishTimerId !== undefined) {
        window.clearTimeout(xBarVanishTimerId)
      }
      isShowXBarRef.value = true
    }
    function showYBar (): void {
      if (yBarVanishTimerId !== undefined) {
        window.clearTimeout(yBarVanishTimerId)
      }
      isShowYBarRef.value = true
    }
    function handleScroll (e: Event): void {
      const { onScroll } = props
      if (onScroll) onScroll(e)
      syncScrollState()
    }
    function syncScrollState (): void {
      // only collect scroll state, do not trigger any dom event
      const { value: container } = mergedContainerRef
      if (container) {
        containerScrollTopRef.value = container.scrollTop
        containerScrollLeftRef.value = container.scrollLeft
      }
    }
    function syncPositionState (): void {
      // only collect position state, do not trigger any dom event
      // Don't use getClientBoundingRect because element may be scale transformed
      const { value: content } = mergedContentRef
      if (content) {
        contentHeightRef.value = content.offsetHeight
        contentWidthRef.value = content.offsetWidth
      }
      const { value: container } = mergedContainerRef
      if (container) {
        containerHeightRef.value = container.offsetHeight
        containerWidthRef.value = container.offsetWidth
      }
      const { value: xRailEl } = xRailRef
      const { value: yRailEl } = yRailRef
      if (xRailEl) {
        xRailSizeRef.value = xRailEl.offsetWidth
      }
      if (yRailEl) {
        yRailSizeRef.value = yRailEl.offsetHeight
      }
    }
    function sync (): void {
      if (!props.scrollable) return
      syncPositionState()
      syncScrollState()
    }
    function isMouseUpAway (e: MouseEvent): boolean {
      return !wrapperRef.value?.contains(e.target as any)
    }
    function handleXScrollMouseDown (e: MouseEvent): void {
      e.preventDefault()
      e.stopPropagation()
      xBarPressed = true
      on('mousemove', window, handleXScrollMouseMove, true)
      on('mouseup', window, handleXScrollMouseUp, true)
      memoXLeft = containerScrollLeftRef.value
      memoMouseX = e.clientX
    }
    function handleXScrollMouseMove (e: MouseEvent): void {
      if (!xBarPressed) return
      if (xBarVanishTimerId !== undefined) {
        window.clearTimeout(xBarVanishTimerId)
      }
      if (yBarVanishTimerId !== undefined) {
        window.clearTimeout(yBarVanishTimerId)
      }
      const { value: containerWidth } = containerWidthRef
      const { value: contentWidth } = contentWidthRef
      const { value: xBarSize } = xBarSizeRef
      if (containerWidth === null || contentWidth === null) return
      const dX = e.clientX - memoMouseX
      const dScrollLeft =
        (dX * (contentWidth - containerWidth)) / (containerWidth - xBarSize)
      const toScrollLeftUpperBound = contentWidth - containerWidth
      let toScrollLeft = memoXLeft + dScrollLeft
      toScrollLeft = Math.min(toScrollLeftUpperBound, toScrollLeft)
      toScrollLeft = Math.max(toScrollLeft, 0)
      const { value: container } = mergedContainerRef
      if (container) {
        container.scrollLeft = toScrollLeft
        const { internalOnUpdateScrollLeft } = props
        if (internalOnUpdateScrollLeft) internalOnUpdateScrollLeft(toScrollLeft)
      }
    }
    function handleXScrollMouseUp (e: MouseEvent): void {
      e.preventDefault()
      e.stopPropagation()
      off('mousemove', window, handleXScrollMouseMove, true)
      off('mouseup', window, handleXScrollMouseUp, true)
      xBarPressed = false
      sync()
      if (isMouseUpAway(e)) {
        hideBar()
      }
    }
    function handleYScrollMouseDown (e: MouseEvent): void {
      e.preventDefault()
      e.stopPropagation()
      yBarPressed = true
      on('mousemove', window, handleYScrollMouseMove, true)
      on('mouseup', window, handleYScrollMouseUp, true)
      memoYTop = containerScrollTopRef.value
      memoMouseY = e.clientY
    }
    function handleYScrollMouseMove (e: MouseEvent): void {
      if (!yBarPressed) return
      if (xBarVanishTimerId !== undefined) {
        window.clearTimeout(xBarVanishTimerId)
      }
      if (yBarVanishTimerId !== undefined) {
        window.clearTimeout(yBarVanishTimerId)
      }
      const { value: containerHeight } = containerHeightRef
      const { value: contentHeight } = contentHeightRef
      const { value: yBarSize } = yBarSizeRef
      if (containerHeight === null || contentHeight === null) return
      const dY = e.clientY - memoMouseY
      const dScrollTop =
        (dY * (contentHeight - containerHeight)) / (containerHeight - yBarSize)
      const toScrollTopUpperBound = contentHeight - containerHeight
      let toScrollTop = memoYTop + dScrollTop
      toScrollTop = Math.min(toScrollTopUpperBound, toScrollTop)
      toScrollTop = Math.max(toScrollTop, 0)
      const { value: container } = mergedContainerRef
      if (container) {
        container.scrollTop = toScrollTop
      }
    }
    function handleYScrollMouseUp (e: MouseEvent): void {
      e.preventDefault()
      e.stopPropagation()
      off('mousemove', window, handleYScrollMouseMove, true)
      off('mouseup', window, handleYScrollMouseUp, true)
      yBarPressed = false
      sync()
      if (isMouseUpAway(e)) {
        hideBar()
      }
    }
    watchEffect(() => {
      const { value: needXBar } = needXBarRef
      const { value: needYBar } = needYBarRef
      const { value: mergedClsPrefix } = mergedClsPrefixRef
      const { value: xRailEl } = xRailRef
      const { value: yRailEl } = yRailRef
      if (xRailEl) {
        if (!needXBar) {
          xRailEl.classList.add(`${mergedClsPrefix}-scrollbar-rail--disabled`)
        } else {
          xRailEl.classList.remove(
            `${mergedClsPrefix}-scrollbar-rail--disabled`
          )
        }
      }
      if (yRailEl) {
        if (!needYBar) {
          yRailEl.classList.add(`${mergedClsPrefix}-scrollbar-rail--disabled`)
        } else {
          yRailEl.classList.remove(
            `${mergedClsPrefix}-scrollbar-rail--disabled`
          )
        }
      }
    })
    onMounted(() => {
      // if container exist, it always can't be resolved when scrollbar is mounted
      // for example:
      // - component
      //   - scrollbar
      //     - inner
      // if you pass inner to scrollbar, you may use a ref inside component
      // however, when scrollbar is mounted, ref is not ready at component
      // you need to init by yourself
      if (props.container) return
      sync()
    })
    onBeforeUnmount(() => {
      if (xBarVanishTimerId !== undefined) {
        window.clearTimeout(xBarVanishTimerId)
      }
      if (yBarVanishTimerId !== undefined) {
        window.clearTimeout(yBarVanishTimerId)
      }
      off('mousemove', window, handleYScrollMouseMove, true)
      off('mouseup', window, handleYScrollMouseUp, true)
    })
    const themeRef = useTheme(
      'Scrollbar',
      'Scrollbar',
      style,
      scrollbarLight,
      props,
      mergedClsPrefixRef
    )
    return {
      sync,
      scrollTo,
      mergedClsPrefix: mergedClsPrefixRef,
      containerScrollTop: containerScrollTopRef,
      wrapperRef,
      containerRef,
      contentRef,
      yRailRef,
      xRailRef,
      needYBar: needYBarRef,
      needXBar: needXBarRef,
      yBarSizePx: yBarSizePxRef,
      xBarSizePx: xBarSizePxRef,
      yBarTopPx: yBarTopPxRef,
      xBarLeftPx: xBarLeftPxRef,
      isShowXBar: isShowXBarRef,
      isShowYBar: isShowYBarRef,
      isIos,
      handleScroll,
      handleContentResize,
      handleContainerResize,
      handleMouseEnterWrapper,
      handleMouseLeaveWrapper,
      handleYScrollMouseDown,
      handleXScrollMouseDown,
      cssVars: computed(() => {
        const {
          common: {
            cubicBezierEaseInOut,
            scrollbarBorderRadius,
            scrollbarHeight,
            scrollbarWidth
          },
          self: { color, colorHover }
        } = themeRef.value
        return {
          '--scrollbar-bezier': cubicBezierEaseInOut,
          '--scrollbar-color': color,
          '--scrollbar-color-hover': colorHover,
          '--scrollbar-border-radius': scrollbarBorderRadius,
          '--scrollbar-width': scrollbarWidth,
          '--scrollbar-height': scrollbarHeight
        }
      })
    }
  },
  render () {
    const { $slots, mergedClsPrefix, showScrollbar } = this
    if (!this.scrollable) return renderSlot($slots, 'default')
    const createChildren = (): VNode =>
      h(
        'div',
        mergeProps(this.$attrs, {
          ref: 'wrapperRef',
          class: `${mergedClsPrefix}-scrollbar`,
          style: this.cssVars,
          onMouseenter: this.handleMouseEnterWrapper,
          onMouseleave: this.handleMouseLeaveWrapper
        }),
        [
          this.container ? (
            renderSlot($slots, 'default')
          ) : (
            <div
              ref="containerRef"
              class={[
                `${mergedClsPrefix}-scrollbar-container`,
                this.containerClass
              ]}
              style={this.containerStyle}
              onScroll={this.handleScroll}
              onWheel={this.onWheel}
            >
              <VResizeObserver onResize={this.handleContentResize}>
                {{
                  default: () => (
                    <div
                      ref="contentRef"
                      style={
                        [
                          {
                            width: this.xScrollable ? 'fit-content' : null
                          },
                          this.contentStyle
                        ] as any
                      }
                      class={[
                        `${mergedClsPrefix}-scrollbar-content`,
                        this.contentClass
                      ]}
                    >
                      {$slots}
                    </div>
                  )
                }}
              </VResizeObserver>
            </div>
          ),
          showScrollbar && (
            <div
              ref="yRailRef"
              class={`${mergedClsPrefix}-scrollbar-rail ${mergedClsPrefix}-scrollbar-rail--vertical`}
              style={[this.horizontalRailStyle] as any}
            >
              <Transition name="fade-in-transition">
                {{
                  default: () =>
                    this.needYBar && this.isShowYBar && !this.isIos ? (
                      <div
                        class={`${mergedClsPrefix}-scrollbar-rail__scrollbar`}
                        style={{
                          height: this.yBarSizePx,
                          top: this.yBarTopPx
                        }}
                        onMousedown={this.handleYScrollMouseDown}
                      />
                    ) : null
                }}
              </Transition>
            </div>
          ),
          showScrollbar && (
            <div
              ref="xRailRef"
              class={`${mergedClsPrefix}-scrollbar-rail ${mergedClsPrefix}-scrollbar-rail--horizontal`}
              style={[this.verticalRailStyle] as any}
            >
              <Transition name="fade-in-transition">
                {{
                  default: () =>
                    this.needXBar && this.isShowXBar && !this.isIos ? (
                      <div
                        class={`${mergedClsPrefix}-scrollbar-rail__scrollbar`}
                        style={{
                          width: this.xBarSizePx,
                          left: this.xBarLeftPx
                        }}
                        onMousedown={this.handleXScrollMouseDown}
                      />
                    ) : null
                }}
              </Transition>
            </div>
          )
        ]
      )
    return this.container ? (
      createChildren()
    ) : (
      <VResizeObserver onResize={this.handleContainerResize}>
        {{
          default: createChildren
        }}
      </VResizeObserver>
    )
  }
})

type NativeScrollbarProps = Omit<HTMLAttributes, keyof ScrollbarInternalProps>
type MergedProps = Partial<ScrollbarInternalProps & NativeScrollbarProps>

export default Scrollbar
export const XScrollbar: new () => { $props: MergedProps } = Scrollbar as any
