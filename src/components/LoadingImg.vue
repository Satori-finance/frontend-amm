<template>
  <img src="~@/assets/img/loading.png" alt />
</template>

<style lang="scss" scoped>
@-webkit-keyframes rotate {
  0% {
    transform: rotate(0);
  }100% {
    transform: rotate(360deg);
  }
}
@-moz-keyframes rotate {
  0% {
    transform: rotate(0);
  }100% {
    transform: rotate(360deg);
  }
}
@-ms-keyframes rotate {
  0% {
    transform: rotate(0);
  }100% {
    transform: rotate(360deg);
  }
}
@-o-keyframes rotate {
  0% {
    transform: rotate(0);
  }100% {
    transform: rotate(360deg);
  }
}
@keyframes rotate {
  0% {
    transform: rotate(0);
  }100% {
    transform: rotate(360deg);
  }
}

img {
  animation: rotate 1.5s linear infinite;
}
</style>
