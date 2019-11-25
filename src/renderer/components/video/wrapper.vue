<script>
export default {
  name: 'MpvWrapper',

  data: () => ({
    style: {
      display: 'block',
      width: '100%',
      height: '100%'
    },
    plugin: null,
    mimeType: 'application/x-mpvjs'
  }),

  props: {
    onPropertyChange: {
      type: Function,
      default: () => {}
    },
    onReady: {
      type: Function,
      default: () => {}
    }
  },

  mounted () {
    this.$el.addEventListener('message', this._handleMessage)
  },

  methods: {
    /**
     * Send a command to the player.
     *
     * @param {string} cmd - Command name
     * @param {...*} args - Arguments
     */
    command (cmd, ...args) {
      args = args.map(arg => arg.toString())
      this._postData('command', [cmd].concat(args))
    },

    /**
     * Set a property to a given value.
     *
     * @param {string} name - Property name
     * @param {*} value - Property value
     */
    property (name, value) {
      this._postData('set_property', { name, value })
    },

    /**
     * Get a notification whenever the given property changes.
     *
     * @param {string} name - Property name
     */
    observe (name) {
      this._postData('observe_property', name)
    },

    /**
     * Send a key event through mpv's input handler, triggering whatever
     * behavior is configured to that key.
     *
     * @param {KeyboardEvent} event
     */
    keypress ({ key, shiftKey, ctrlKey, altKey }) {
      // Don't need modifier events.
      if ([
        'Escape', 'Shift', 'Control', 'Alt',
        'Compose', 'CapsLock', 'Meta'
      ].includes(key)) return

      if (key.startsWith('Arrow')) {
        key = key.slice(5).toUpperCase()
        if (shiftKey) {
          key = `Shift+${key}`
        }
      }
      if (ctrlKey) {
        key = `Ctrl+${key}`
      }
      if (altKey) {
        key = `Alt+${key}`
      }

      // Ignore exit keys for default keybindings settings.
      if ([
        'q', 'Q', 'ESC', 'POWER', 'STOP',
        'CLOSE_WIN', 'CLOSE_WIN', 'Ctrl+c',
        'AR_PLAY_HOLD', 'AR_CENTER_HOLD'
      ].includes(key)) return

      this.command('keypress', key)
    },

    _postData (type, data) {
      this.$el.postMessage({ type, data })
    },
    _handleMessage ({ data: { type, data } }) {
      const actions = {
        property_change: () => this.onPropertyChange(data.name, data.value),
        ready: () => this.onReady(this)
      }
      const action = actions[type]

      action && action()
    }
  },

  render (h) {
    return this.$createElement('embed', {
      ref: 'plugin',

      staticClass: 'mpv-wrapper',
      style: this.style,
      attrs: {
        type: this.mimeType
      }
    })
  }
}
</script>
