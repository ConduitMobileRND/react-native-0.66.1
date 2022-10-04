/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const {exec, echo, exit, test, env} = require('shelljs');
const {revertFiles, saveFiles} = require('./scm-utils');

function saveFilesToRestore(tmpPublishingFolder) {
  const filesToSaveAndRestore = [
    'template/Gemfile',
    'template/_ruby-version',
    'template/package.json',
    '.ruby-version',
    'Gemfile.lock',
    'Gemfile',
    'package.json',
    'ReactAndroid/gradle.properties',
    'Libraries/Core/ReactNativeVersion.js',
    'React/Base/RCTVersion.m',
    'ReactAndroid/src/main/java/com/facebook/react/modules/systeminfo/ReactNativeVersion.java',
    'ReactCommon/cxxreact/ReactNativeVersion.h',
  ];

  saveFiles(filesToSaveAndRestore, tmpPublishingFolder);
}

function generateAndroidArtifacts(releaseVersion, tmpPublishingFolder) {
  // -------- Generating Android Artifacts
  env.REACT_NATIVE_SKIP_PREFAB = true;
  if (exec('./gradlew :ReactAndroid:installArchives').code) {
    echo('Could not generate artifacts');
    exit(1);
  }

  // -------- Generating the Hermes Engine Artifacts
  env.REACT_NATIVE_HERMES_SKIP_PREFAB = true;
  if (exec('./gradlew :ReactAndroid:hermes-engine:installArchives').code) {
    echo('Could not generate artifacts');
    exit(1);
  }

  // undo uncommenting javadoc setting
  revertFiles(['ReactAndroid/gradle.properties'], tmpPublishingFolder);

  echo('Generated artifacts for Maven');

  let artifacts = [
    '.module',
    '.pom',
    '-debug.aar',
    '-release.aar',
    '-debug-sources.jar',
    '-release-sources.jar',
  ].map(suffix => {
    return `react-native-${releaseVersion}${suffix}`;
  });

  artifacts.forEach(name => {
    if (
      !test(
        '-e',
        `./android/com/facebook/react/react-native/${releaseVersion}/${name}`,
      )
    ) {
      echo(
        `Failing as expected file: \n\
      android/com/facebook/react/react-native/${releaseVersion}/${name}\n\
      was not correctly generated.`,
      );
      exit(1);
    }
  });
}

module.exports = {
  generateAndroidArtifacts,
  saveFilesToRestore,
};