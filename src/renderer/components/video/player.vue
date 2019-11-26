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
      @toggleFullScreen='toggleFullScreen',
      @togglePlay='togglePlay',
      @trackChange='setTrack',
      @actOnWindow='actOnWindow',
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
        .find((trackNumber) => this.tracks[trackNumber].type === 'sub' && this.tracks[trackNumber].isDefault)

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

      if (name.match(/track-list\//)) return this.findTracks(name, value)

      if (!this.hasOwnProperty(name)) {
        return
      }

      this.$set(this, name, value)
    },
    findTracks (propertyName, value) {
      if (propertyName === 'track-list/count') {
        if (!value) return

        for (let i = 1; i <= value; ++i) {
          this.mpv.observe(`track-list/${i}/type`)
          this.mpv.observe(`track-list/${i}/lang`)
          this.mpv.observe(`track-list/${i}/default`)
        }

        return
      }

      if (propertyName.match(/track-list\/\d+\/type/)) {
        const trackNumber = +propertyName.split('/')[1]
        const type = value
        const storedTrack = this.tracks[trackNumber] || {}

        if (type === 'sub' && !this.hasSubs) this.hasSubs = true

        this.$set(this.tracks, trackNumber, { ...storedTrack, type })

        return
      }

      if (propertyName.match(/track-list\/\d+\/lang/)) {
        const trackNumber = +propertyName.split('/')[1]
        const lang = value
        const storedTrack = this.tracks[trackNumber] || {}

        this.$set(this.tracks, trackNumber, { ...storedTrack, lang })

        return
      }

      if (propertyName.match(/track-list\/\d+\/default/)) {
        const trackNumber = +propertyName.split('/')[1]
        const isDefault = value
        const storedTrack = this.tracks[trackNumber] || {}

        this.$set(this.tracks, trackNumber, { ...storedTrack, isDefault })
      }
    },
    setTrack (track) {
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
