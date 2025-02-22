import Masonry from 'masonry-layout'

// const attributesMap = {
//   'column-width': 'columnWidth',
//   'transition-duration': 'transitionDuration',
//   'item-selector': 'itemSelector',
//   'origin-left': 'originLeft',
//   'origin-top': 'originTop',
//   'fit-width': 'fitWidth',
//   'stamp': 'stamp',
//   'gutter': 'gutter',
//   'percent-position': 'percentPosition',
//   'horizontal-order': 'horizontalOrder',
//   'stagger': 'stagger',
//   'destroy-delay': 'destroyDelay'
// }
const EVENT_ADD = 'vuemasonry.itemAdded'
const EVENT_REMOVE = 'vuemasonry.itemRemoved'
const EVENT_DESTROY = 'vuemasonry.destroy'

const snakeToCamel = (str) => str.replace(
  /([-_][a-z])/g,
  (group) => group.toUpperCase()
                  .replace('-', '')
                  .replace('_', '')
);

const stringToBool = function (val) { return (val + '').toLowerCase() === 'true' }

const numberOrSelector = function (val) { return isNaN(val) ? val : parseInt(val) }

const collectOptions = function (attrs) {
  const res = {}
  const attributesArray = Array.prototype.slice.call(attrs)
  attributesArray.forEach(function (attr) {
      if (attr.name.indexOf('origin') > -1) {
        res[snakeToCamel(attr.name)] = stringToBool(attr.value)
      } else if (attr.name === 'column-width' || attr.name === 'gutter') {
        res[snakeToCamel(attr.name)] = numberOrSelector(attr.value)
      } else {
        res[snakeToCamel(attr.name)] = attr.value
      }
  })
  return res
}

export const VueMasonryPlugin = function () {}

VueMasonryPlugin.install = function (Vue, options) {
  const Events = new Vue({})
  const defaultId = 'VueMasonry'

  Vue.directive('masonry', {
    props: ['transitionDuration', 'itemSelector', 'destroyDelay'],

    inserted: function (el, binding) {
      if (!Masonry) {
        throw new Error('Masonry plugin is not defined. Please check it\'s connected and parsed correctly.')
      }
      const options = collectOptions(el.attributes)
      const masonry = new Masonry(el, options)
      const masonryId = binding.value || defaultId
      const destroyDelay = options['destroyDelay'] ? parseInt(options['destroyDelay'], 10) : undefined
      const masonryDraw = function () {
        masonry.reloadItems()
        masonry.layout()
      }
      Vue.nextTick(function () {
        masonryDraw()
      })

      const masonryRedrawHandler = function (eventData) {
        masonryDraw()
      }

      const masonryDestroyHandler = function (eventData) {
        Events.$off(`${EVENT_ADD}__${masonryId}`, masonryRedrawHandler)
        Events.$off(`${EVENT_REMOVE}__${masonryId}`, masonryRedrawHandler)
        Events.$off(`${EVENT_DESTROY}__${masonryId}`, masonryDestroyHandler)
        const delay = destroyDelay && !Number.isNaN(destroyDelay) ? destroyDelay : 0
        setTimeout(function () {
          masonry.destroy()
        }, delay)
      }

      Events.$on(`${EVENT_ADD}__${masonryId}`, masonryRedrawHandler)
      Events.$on(`${EVENT_REMOVE}__${masonryId}`, masonryRedrawHandler)
      Events.$on(`${EVENT_DESTROY}__${masonryId}`, masonryDestroyHandler)
    },
    unbind: function (el, binding) {
      const masonryId = binding.value || defaultId
      Events.$emit(`${EVENT_DESTROY}__${masonryId}`)
    }
  })

  Vue.directive('masonryTile', {

    inserted: function (el, binding) {
      const masonryId = binding.value || defaultId
      Events.$emit(`${EVENT_ADD}__${masonryId}`, {
        'element': el
      })
    },
    unbind: function (el, binding) {
      const masonryId = binding.value || defaultId
      Events.$emit(`${EVENT_REMOVE}__${masonryId}`, {
        'element': el
      })
    }
  })

  Vue.prototype.$redrawVueMasonry = function (id) {
    const masonryId = id || defaultId
    Events.$emit(`${EVENT_ADD}__${masonryId}`)
  }
}
