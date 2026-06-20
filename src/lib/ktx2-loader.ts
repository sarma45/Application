import * as THREE from "three";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";

let ktx2Loader: KTX2Loader | null = null;

export function getKTX2Loader(): KTX2Loader {
  if (!ktx2Loader) {
    ktx2Loader = new KTX2Loader();
    ktx2Loader.setTranscoderPath("/basis/");
    ktx2Loader.detectSupport(new THREE.WebGLRenderer());
  }
  return ktx2Loader;
}

export function loadKTX2Texture(url: string): Promise<THREE.Texture> {
  const loader = getKTX2Loader();
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (texture) => resolve(texture),
      undefined,
      (error) => reject(error)
    );
  });
}

export function isKTX2Url(url: string): boolean {
  return url.endsWith(".ktx2") || url.includes(".ktx2?");
}

export function disposeKTX2Loader(): void {
  if (ktx2Loader) {
    ktx2Loader.dispose();
    ktx2Loader = null;
  }
}
