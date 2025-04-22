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
      androidBuildToolsVersion = "35.0.0";
      androidNdkVersion="26.1.10909125";
      androidComposition = pkgs.androidenv.composeAndroidPackages {
        toolsVersion = "26.1.1";
        cmdLineToolsVersion = "8.0";
        platformToolsVersion = "35.0.1";
        buildToolsVersions = [ androidBuildToolsVersion "34.0.0" ];
        platformVersions = [ "35" ];
        cmakeVersions = [ "3.10.2" "3.22.1" ];
        includeNDK = true;
        ndkVersions = [ androidNdkVersion  ];
        useGoogleTVAddOns = false;
      };
      androidSdk = androidComposition.androidsdk;
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
              # Android
              pinnedJDK
              androidSdk
              pkg-config
            ];

            JAVA_HOME = pinnedJDK;
            ANDROID_SDK_ROOT = "${androidComposition.androidsdk}/libexec/android-sdk";
            ANDROID_NDK_ROOT = "${ANDROID_SDK_ROOT}/ndk-bundle";

            GRADLE_OPTS = "-Dorg.gradle.project.android.aapt2FromMavenOverride=${ANDROID_SDK_ROOT}/build-tools/${androidBuildToolsVersion}/aapt2";

            shellHook = ''
              export LD_LIBRARY_PATH="${pkgs.libxml2.out}/lib:$LD_LIBRARY_PATH"
            '';

            packages = [
              just
              fastmod
              nodejs
              yarn
              crowdin-cli

              typescript
              typescript-language-server

            ];

          };
      };
    });
}
