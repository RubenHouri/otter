# Otter core

This module gathers the core of the [Otter Framework](https://github.com/AmadeusITGroup/otter).
It is the foundation for all the packages (interfaces, core helpers) and contains schematics to generate your components/services etc.

Otter is a Framework providing a set of tools to accelerate the development of a prod ready application via several in-app features and developer tooling.
This includes a toolbox to customize, administrate and debug an application at runtime.

## Get Started

### Required environment

* **Git** : [https://gitforwindows.org/](https://gitforwindows.org/)
* **NodeJs 14.x** : [NodeJS LTS](https://nodejs.org/)
* **Yarn** : [https://yarnpkg.com/lang/en/](https://yarnpkg.com/)

**Yarn** can be installed directly using NPM:

```bash
# Installing yarn
npm install --global yarn
```

### Creating a new Angular application

```bash
# Create new application
npx -y -p @angular/cli ng new
# ? What name would you like to use for the new workspace and initial project? <application name>
# ? Would you like to add Angular routing? Yes
# ? Which stylesheet format would you like to use? SCSS

```

> **Information**: You can also install and run the `Angular CLI` locally with the following commmands:
>
> ```bash
> yarn add @angular/cli
> yarn ng new
> ```

### Adding Otter dependency

```bash
# Setup Otter dependencies
yarn ng add @o3r/core
# ? Activate Otter localization? Yes
# ? Work on Otter with symlinks? No
```

or for NPM users

```bash
npx ng add @o3r/core
```

### Adding Material design theming

```bash
# Add Material Design
yarn ng add @angular/material
# ? Choose a prebuilt theme name, or "custom" for a custom theme: Indigo/Pink
# ? Set up HammerJS for gesture recognition? Yes
# ? Set up browser animations for Angular Material? Yes
```

Then uncomment the following lines in the `src/styles.scss` file to apply the Otter theming to Material Design components :

```scss
@include mat.core();
@include mat.all-component-typographies($typography);
@include mat.all-component-themes($mat-theme);
```

## Create your own Otter compatible module

You can refer to the [module documentation](https://github.com/AmadeusITGroup/otter/tree/main/docs/core/MODULE.md) to create an Otter compatible module.
