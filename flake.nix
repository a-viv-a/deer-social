{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    android-nixpkgs.url = "github:tadfisher/android-nixpkgs";
  };

  outputs =
    { nixpkgs, flake-utils,  android-nixpkgs, ... }:
    flake-utils.lib.eachDefaultSystem (system:
    let
      pkgs = import nixpkgs {
        inherit system;
        config = {
          android_sdk.accept_license = true;
          allowUnfree = true;
        };
      };
      pinnedJDK = pkgs.jdk17;
      androidSdk = android-nixpkgs.sdk.${system} (sdkPkgs: with sdkPkgs; [
        cmdline-tools-latest
        build-tools-35-0-0
        build-tools-34-0-0
        platform-tools
        platforms-android-35
        emulator
        cmake-3-22-1
        ndk-26-1-10909125
        ndk-28-0-13004108
      ]);
    in
    with pkgs;
    {
      packages = {
        default = callPackage ./default.nix { };
      };
      devShells = {
        default =
          mkShell rec {
            buildInputs = [
              androidSdk
              pinnedJDK
            ];

            JAVA_HOME = pinnedJDK;
            ANDROID_HOME = "${androidSdk}/share/android-sdk";
            ANDROID_SDK_ROOT = "${androidSdk}/share/android-sdk";

            GRADLE_OPTS = "-Dorg.gradle.project.android.aapt2FromMavenOverride=${ANDROID_SDK_ROOT}/build-tools/35.0.0/aapt2";

            packages = [
              just
              fastmod
              nodejs
              yarn
              crowdin-cli
              eas-cli

              typescript
              typescript-language-server

            ];

          };
      };
    });
}
