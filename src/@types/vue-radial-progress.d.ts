declare module 'vue-radial-progress' {
  import { DefaultMethods, DefaultComputed, ComponentOptions, PropsDefinition, PropType } from 'vue/types/options'

  var RadialProgressBar: {
    props: {
      diameter: PropType<number>
      totalSteps: PropType<number>
      completedSteps: PropType<number>
      startColor: PropType<string>
      stopColor: PropType<string>
      innerStrokeColor: PropType<string>
      strokeWidth: PropType<number>
      strokeLinecap: PropType<string>
      animateSpeed: PropType<number>
      fps: PropType<number>
      timingFunc: PropType<string>
      isClockwise: PropType<boolean>
    }
  }
  export = RadialProgressBar
}
