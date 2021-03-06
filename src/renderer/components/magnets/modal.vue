<template lang="pug">
  div
    v-dialog(v-model='values.show', absolute, max-width='800', @keydown.esc='close()')
      v-card#magnet-modal
        v-card-title.pb-2.pt-2
          h2.mb-0.main-title.ellipsis Results for #[strong {{ values.title }}]
          v-spacer
          v-tooltip(left)
            template(v-slot:activator='{ on }')
              v-btn.mr-2(
                text, icon,
                @click='openSelected',
                v-if='selected.length',
                v-on='on'
              )
                v-icon open_in_new
            span Open all selected magnets
          v-tooltip(left)
            template(v-slot:activator='{ on }')
              v-btn(
                text, icon,
                @click='copyToClipboard',
                v-if='selected.length',
                v-on='on'
              )
                v-icon.copy-icon content_copy
            span Copy all selected magnets
        v-divider
        v-card-text.subtitle-1.pt-2
          v-expansion-panels(popout)
            v-expansion-panel(
              v-for='(name, index) in filteredNames',
              :key='index',
              ripple, lazy
            )
              v-expansion-panel-header
                .entry-title
                  span {{ name }}
                  v-tooltip(left)
                    template(v-slot:activator='{ on }')
                      v-btn.ma-0.mr-3(
                        icon,
                        @click.stop='selectAll(name)',
                        v-on='on'
                      )
                        v-icon select_all
                    span (un)select these magnets
              v-divider
              v-expansion-panel-content
                v-layout.ep-container(
                  row, wrap,
                  v-for='(magnet, subIndex) in getLinks(name)', :key='magnet.link'
                )
                  v-flex.pt-0.pb-0(xs11, d-flex, align-center, :class='{ bordered: subIndex > 0 }')
                    .episode {{ magnet.name }} - Ep. {{ magnet.nb }}
                  v-flex.pt-2.pb-0(xs1, d-flex, justify-center, align-center, :class='{ bordered: subIndex > 0 }')
                    v-checkbox.mt-0(v-model='selected', :value='magnet.link', hide-details, color='primary')
                  v-flex.pt-0.pb-2.magnet(xs9, offset-xs3, d-flex, justify-end)
                    a.ellipsis(:href='magnet.link') {{ magnet.link}}
        v-card-actions
          v-spacer
          v-btn.blue--text.darken-1(text, @click='close()') Thanks!
    v-snackbar(
      :timeout='2500',
      top,
      v-model='snack'
    ) All selected magnets were copied to clipboard!
      v-btn.pink--text(text, @click='snack = false') Thanks!
</template>

<script>
export default {
  name: 'Magnets-Modal',

  data () {
    return {
      snack: false,
      selected: [],
      panels: []
    }
  },

  computed: {
    values () {
      return this.$store.state.downloader.modal
    },
    show () {
      return this.values.show
    },
    eol () {
      if (this.$store.state.platform === 'win32') {
        return '\r\n'
      } else {
        return '\n'
      }
    },
    filteredNames () {
      return this.$_.uniq(this.values.magnets.map((magnet) => {
        return magnet.name
      }))
    }
  },

  methods: {
    close () {
      // We erase data on close as it's not that long to get it
      // and there is no way to open this modal but to download
      // something.
      this.$store.commit('downloader/setModal', {
        show: false,
        title: '',
        magnets: []
      })
    },
    getLinks (name) {
      return this.values.magnets.filter((magnet) => magnet.name === name)
    },
    selectAll (name) {
      // Find all magnets with that name
      const magnets = this.values.magnets
        .filter((elem) => elem.name === name)
        .map((elem) => elem.link)

      // Checking if some of them are present in current selected array
      const selected = magnets.filter((magnet) => this.selected.includes(magnet))
      const allSelected = selected.length === magnets.length

      // Selecting or unselecting accordingly
      magnets.forEach((magnet) => {
        const index = this.selected.indexOf(magnet)

        if (allSelected) {
          this.selected.splice(index, 1)
        } else {
          if (index === -1) {
            this.selected.push(magnet)
          }
        }
      })
    },
    openSelected () {
      this.$_.each(this.selected, (magnet) => {
        this.$electron.shell.openExternal(magnet)
      })
    },
    copyToClipboard () {
      const copy = Array.from(this.selected)

      if (copy.length) {
        this.$electron.clipboard.writeText(copy.join(this.eol))

        this.snack = true
      }
    }
  },

  watch: {
    show () {
      this.show && this.$store.dispatch('player/play')
      this.selected = this.values.magnets.map((elem) => elem.link)
    }
  }
}
</script>

<style lang="stylus" scoped>
  .copy-icon
    display inline-block
    cursor copy

  .main-title
    padding 8px
    font-size 24px
    font-weight 300
    letter-spacing 0.05em

  .entry-title
    display flex
    justify-content space-between

    span
      font-size 22px
      font-weight 400
      letter-spacing 0.04em

  .ep-container
    padding 0 3%

    .bordered
      border-top 0.02em solid rgba(255, 255, 255, 0.4)

    .episode
      padding 8px
      font-size 18px
      letter-spacing 1px

    .magnet
      font-size 16px
      letter-spacing 1px
      text-align right
</style>
