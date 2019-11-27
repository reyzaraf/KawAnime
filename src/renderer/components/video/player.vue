<template lang="pug">
  .video-player(
    @mousemove='onMouseMove',
    :style='{ cursor: !layoutShow ? "none" : null }'
  )

    wrapper(
      ref='video',
      name='kawanime-player',
      :onReady='handleMPVReady',
      :onPropertyChange='handlePropertyChange',
      @dbclick='toggleFullScreen'
    )

    layout(
      ref='layout',
      :timeline='timeline',
      :pause='pause',
      :duration='duration',
      :title='name',
      :hasSubs='hasSubs',
      :currentLang='currentSubLang',
      :subs='subs'
      @seek='seek',
      @timeForward='timeForward',
      @volume='setVolume',
      @toggleFullScreen='toggleFullScreen',
      @togglePlay='togglePlay',
      @trackChange='setTrack',
      @actOnWindow='actOnWindow',
      @mute='toggleMute',
      @show='layoutShow = true',
      @hide='layoutShow = false'
    )
</template>

<script>
import Wrapper from './wrapper.vue'
import Layout from './layout.vue'

export default {
  name: 'MpvPlayer',

  components: { Wrapper, Layout },

  data () {
    return {
      mpv: null,
      pause: false,
      timeline: 0,
      duration: 0,
      waiting: false,
      name: '',
      hasAppendedToHistory: false,

      layoutShow: true,

      propertyMap: {
        'time-pos': 'timeline',
        'media-title': 'name'
      },

      hasSubs: false,
      tracks: {}
    }
  },

  props: {
    filepath: String
  },

  computed: {
    controls: {
      get () {
        return this.$store.state.streaming.player.controls
      },
      set ({ name, value }) {
        this.$store.commit('streaming/setControl', { name, value })
      }
    },
    subs () {
      return Object.keys(this.tracks)
        .reduce((acc, trackNumber) => {
          const { type, lang } = this.tracks[trackNumber]

          if (type === 'sub') acc[trackNumber] = (lang || 'unknown').slice(0, 2)

          return acc
        }, {})
    },
    currentSubLang () {
      const defaultTrack = Object.keys(this.tracks)
        .find((trackNumber) => this.tracks[trackNumber].type === 'sub' && this.tracks[trackNumber].selected)

      return this.subs[defaultTrack] || null
    }
  },

  methods: {
    actOnWindow (type) {
      this.$parent[type]()
    },
    handleMPVReady (mpv) {
      this.mpv = mpv;
      [
        'pause',
        'time-pos',
        'duration',
        'media-title',
        'track-list/count'
      ].forEach(this.mpv.observe)

      this.mpv.property('hwdec', 'auto')
      this.mpv.command('loadfile', this.filepath)

      this.$emit('ready')
    },
    handlePropertyChange (name, value) {
      name = this.propertyMap[name] || name

      if (name.match(/track-list\//)) return this.handleTracks(name, value)

      if (!this.hasOwnProperty(name)) {
        return
      }

      this.$set(this, name, value)
    },
    handleTracks (propertyName, value) {
      if (propertyName === 'track-list/count') {
        if (!value) return

        for (let i = 1; i <= value; ++i) {
          this.mpv.observe(`track-list/${i}/type`)
          this.mpv.observe(`track-list/${i}/lang`)
          this.mpv.observe(`track-list/${i}/default`)
          this.mpv.observe(`track-list/${i}/id`)
          this.mpv.observe(`track-list/${i}/type`)
          this.mpv.observe(`track-list/${i}/src`)
          this.mpv.observe(`track-list/${i}/title`)
          this.mpv.observe(`track-list/${i}/lang`)
          this.mpv.observe(`track-list/${i}/selected`)
        }

        return
      }

      if (propertyName.match(/track-list\/\d+/)) {
        const parts = propertyName.split('/')
        const trackNumber = +parts[1]
        const type = parts[2]
        const storedTrack = this.tracks[trackNumber] || {}

        if (value === 'sub' && !this.hasSubs) this.hasSubs = true

        this.$set(this.tracks, trackNumber, { ...storedTrack, [type]: value })
      }
    },
    setTrack (track) {
      // TODO: Make it work
      const { selected, id } = this.tracks[track]

      if (selected) this.mpv.command('sub-remove', id)
      else this.mpv.command('sub-add', id)
    },
    seek (value) {
      this.mpv.command('seek', value, 'absolute-percent')
    },
    timeForward (value) {
      this.mpv.command('seek', value)
    },
    setVolume (value, relative) {
      if (this.mpv) {
        if (relative) value = this.controls.volume + value

        this.mpv.property('ao-volume', value)
        this.controls = { name: 'volume', value }
      }
    },
    toggleMute () {
      this.mpv.property('mute', !this.controls.muted)
      this.controls = { name: 'muted', value: !this.controls.muted }
    },
    togglePlay (e) {
      if (!this.duration) return

      this.mpv.property('pause', !this.pause)
    },
    toggleFullScreen () {
      this.$emit('fullscreen')
    },

    onMouseMove (e) {
      if (Math.abs(e.movementX) > 1 || Math.abs(e.movementY) > 1) this.$refs.layout.reveal()
    }
  }
}
</script>

<style lang="stylus" scoped>
  .video-player
    background-color black
    line-height 0px
    position relative
    display inline-block
    height 100%
    width 100%

    &:fullscreen
      width 100vw
</style>
