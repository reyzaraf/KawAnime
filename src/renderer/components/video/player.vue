<template lang="pug">
  wrapper(
    :onReady='this.handleMPVReady',
    :onPropertyChange='this.handlePropertyChange'
    :onMouseDown='this.togglePause'
  )
</template>

<script>
import Wrapper from './wrapper.vue'

export default {
  name: 'MpvPlayer',

  components: { Wrapper },

  data: () => ({
    mpv: null,
    pause: false,
    'time-pos': 0,
    fullscreen: false,
    duration: 0
  }),

  methods: {
    handleMPVReady (mpv) {
      this.mpv = mpv;
      ['pause', 'time-pos', 'duration', 'eof-reached'].forEach(this.mpv.observe)
      this.mpv.property('hwdec', 'auto')
      this.mpv.command('loadfile', '/Users/Kylart/Downloads/[HorribleSubs] Azur Lane - 02 [720p].mkv')
    },
    handlePropertyChange (name, value) {
      if (!this.hasOwnProperty(name)) {
        console.log('unset', name)
        return
      }
      this.$set(this, name, value)
    },
    togglePause (e) {
      e.target.blur()
      console.log('togglepause')
      if (!this.state.duration) return
      this.mpv.property('pause', !this.state.pause)
    }
  }
}
</script>
