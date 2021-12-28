# dev

1. git
```
git clone --recursive https://github.com/mcdexio/mcdex-fe-for-clover.git
```

2. install "eslint", "vetur", "supremacy" in vs code. ".vscode/settings.json" has already contain the following rules:
* formatOnSave
* js uses single quote
* js removes ";"
* stylus removes braces, colons, semicolons

3. npm

```
vi ~/.npmrc

//registry=https://registry.npm.taobao.org/
//npm.pkg.github.com/:_authToken=TOKEN
@mcdexio:registry=https://npm.pkg.github.com
@romancow:registry=https://npm.pkg.github.com
```

4. yarn
```
nvm use v10.16.3
cnpm install -g yarn
FOR WINDOWS:
  Install Microsoft Visual C++ Build Tools
  yarn config set msvs_version 2015 --global
yarn install
yarn start
```

# vue-cli

## Project setup
```
yarn install
```

### gen validators
```
npm run gen:validator
```

### Compiles and hot-reloads for development
```
yarn serve
```

### Compiles and minifies for production
```
yarn build
```

### Lints and fixes files
```
yarn lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
