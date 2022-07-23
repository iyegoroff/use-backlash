# use-backlash

[![npm](https://img.shields.io/npm/v/use-backlash)](https://npm.im/use-backlash)
[![build](https://github.com/iyegoroff/use-backlash/workflows/build/badge.svg)](https://github.com/iyegoroff/use-backlash/actions/workflows/build.yml)
[![publish](https://github.com/iyegoroff/use-backlash/workflows/publish/badge.svg)](https://github.com/iyegoroff/use-backlash/actions/workflows/publish.yml)
[![codecov](https://codecov.io/gh/iyegoroff/use-backlash/branch/main/graph/badge.svg?token=YC314L3ZF7)](https://codecov.io/gh/iyegoroff/use-backlash)
[![Type Coverage](https://img.shields.io/badge/dynamic/json.svg?label=type-coverage&prefix=%E2%89%A5&suffix=%&query=$.typeCoverage.atLeast&uri=https%3A%2F%2Fraw.githubusercontent.com%2Fiyegoroff%2Fts-railway%2Fmain%2Fpackage.json)](https://github.com/plantain-00/type-coverage)
![Libraries.io dependency status for latest release](https://img.shields.io/librariesio/release/npm/use-backlash)
[![Bundlephobia](https://img.shields.io/bundlephobia/minzip/use-backlash?label=min+gzip)](https://bundlephobia.com/package/use-backlash)
[![npm](https://img.shields.io/npm/l/use-backlash.svg?t=1495378566926)](https://www.npmjs.com/package/use-backlash)

useReducer with effects, the elmish way

## Getting started

```
npm i use-backlash
```

## Description

This hook is a basic approach to split view/logic/effects in React. It was developed as a boilerplate-free substitute of [ts-elmish](https://github.com/iyegoroff/ts-elmish) project. While it doesn't support effect composition or complex effect creators, it is easier to grasp and have enough power to handle all of the UI-logic for a single component. It also works in [StrictMode](https://reactjs.org/docs/strict-mode.html) and is easy to [test](test/index.spec.tsx#L5-L27)

## Example

```ts

```
