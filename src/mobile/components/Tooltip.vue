<template>
  <VPopover :open="show" class="mcm-tooltip-wrapper" placement="auto" :boundariesElement="body" container="body" popoverClass="mcm-tooltip" :offset="5">
    <span class="mcm-tooltip__reference" ref="reference"><slot></slot></span>
    <template slot="popover">
      <div class="mcm-tooltip__content" ref="content">
        <slot name="content">{{ content }}</slot>
      </div>
    </template>
  </VPopover>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import { VPopover } from 'v-tooltip'

@Component({
  components: {
    VPopover,
  },
})
export default class Tooltip extends Vue {
  @Prop({ default: '' }) content!: string
  @Prop({ default: false }) show!: boolean

  private body = document.body
}
</script>

<style lang="scss">
.tooltip {
  display: inline-block !important;
  z-index: 3000;
  max-width: 80vw;

  .tooltip-inner {
    background: black;
    color: white;
    border-radius: 16px;
    padding: 5px 10px 4px;
  }

  .tooltip-arrow {
    width: 9px;
    height: 9px;
    position: absolute;
    z-index: 1;

    &::after {
      content: '';
      position: absolute;
      width: 9px;
      height: 9px;
      background: var(--mc-background-color-darkest);
    }
  }

  &[x-placement^="top"] {
    margin-bottom: 5.5px;

    .tooltip-arrow {
      bottom: -4px;
      left: calc(50% - 5.5px);
      border-bottom-right-radius: 2px;
      transform: rotate(45deg) skew(10deg, 10deg) translate(3.5px, -4px);

      &::after {
        left: -1px;
        top: -1px;
        border-bottom-right-radius: 2px;
      }
    }
  }

  &[x-placement^="bottom"] {
    margin-top: 5.5px;

    .tooltip-arrow {
      top: -4px;
      left: calc(50% - 5.5px);
      border-top-left-radius: 2px;
      transform: rotate(45deg) skew(10deg, 10deg) translate(3.5px, -4px);

      &::after {
        left: 1px;
        top: 1px;
        border-top-left-radius: 2px;
      }
    }
  }

  &[x-placement^="right"] {
    margin-left: 5.5px;

    .tooltip-arrow {
      left: -4px;
      top: calc(50% - 5.5px);
      border-bottom-left-radius: 2px;
      transform: rotate(45deg) skew(-10deg, -10deg);

      &::after {
        left: 1px;
        top: -1px;
        border-bottom-left-radius: 2px;
      }
    }
  }

  &[x-placement^="left"] {
    margin-right: 5.5px;

    .tooltip-arrow {
      right: -4px;
      top: calc(50% - 5.5px);
      border-top-right-radius: 2px;
      transform: rotate(45deg) skew(-10deg, -10deg);

      &::after {
        left: -1px;
        top: 1px;
        border-top-right-radius: 2px;
      }
    }
  }

  &.popover {
    $color: linear-gradient(90deg, #00d8e2 0%, #27a2f8 100%);

    .popover-inner {
      background: $color;
      color: black;
      padding: 1px;
      border-radius: 12px;
      box-shadow: 0 5px 30px rgba(black, .1);
    }

    .popover-arrow {
      background: $color;
    }
  }

  &[aria-hidden='true'] {
    visibility: hidden;
    opacity: 0;
    transition: opacity .15s, visibility .15s;
  }

  &[aria-hidden='false'] {
    visibility: visible;
    opacity: 1;
    transition: opacity .15s;
  }
}
</style>

<style lang="scss">
.mcm-tooltip-wrapper {
  display: inline-flex;
}

.mcm-tooltip__content {
  font-size: 14px;
  line-height: 20px;
  color: var(--mc-text-color-white);
  background: var(--mc-background-color-darkest);
  padding: 16px;
  border-radius: 12px;
}

.mcm-tooltip__reference {
  text-decoration-style: dashed;
  text-decoration-line: underline;
  text-decoration-color: inherit;
  text-underline-position: under;
  cursor: pointer;
  display: flex;
}
</style>
