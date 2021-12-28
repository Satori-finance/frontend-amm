<template>
  <div class='markdown-view'>
    <div class='markdown-body' v-html="markdown" />
  </div>
</template>

<script lang='ts'>
import { Component, Prop, Vue } from 'vue-property-decorator'
// @ts-ignore
import { Remarkable } from 'remarkable' //  TODO add declare file
// @ts-ignore
import { linkify } from 'remarkable/linkify' // TODO add declare file

const remarkable = new Remarkable({
  html: false,
  breaks: true,
  typographer: false
}).use(linkify)

@Component
export default class MarkdownView extends Vue {
  @Prop({ required: true, default: '' }) body !: string

  get markdown() {
    let body = this.body
    body = remarkable.render(body)
    return body
  }
}
</script>

<style lang='scss' scoped>
.markdown-view {
  .markdown-body {
    font-size: 16px;
    color: var(--mc-text-color-white);
    ::v-deep {
      ul li {
        list-style-type: disc;
      }

      ol li {
        list-style-type: decimal;
      }

      blockquote {
        color: var(--mc-text-color-white);
      }

      table {
        text-align: center;
        tr, th, td {
          background-color: transparent;
          border: 1px solid var(--mc-border-color);
        }
      }
    }
  }
}
</style>
