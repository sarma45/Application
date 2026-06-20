"use client";

import { useEffect, useState, useCallback } from "react";
import * as THREE from "three";
import { loadKTX2Texture, isKTX2Url } from "@/lib/ktx2-loader";

interface UseTextureOptions {
  repeat?: [number, number];
  encoding?: THREE.ColorSpace;
}

export function useTexture(url: string | null, options: UseTextureOptions = {}) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadTexture = useCallback(async () => {
    if (!url) return;

    setLoading(true);
    setError(null);

    try {
      let loadedTexture: THREE.Texture;

      if (isKTX2Url(url)) {
        loadedTexture = await loadKTX2Texture(url);
      } else {
        const loader = new THREE.TextureLoader();
        loadedTexture = await new Promise<THREE.Texture>((resolve, reject) => {
          loader.load(url, resolve, undefined, reject);
        });
      }

      if (options.repeat) {
        loadedTexture.wrapS = THREE.RepeatWrapping;
        loadedTexture.wrapT = THREE.RepeatWrapping;
        loadedTexture.repeat.set(options.repeat[0], options.repeat[1]);
      }

      if (options.encoding) {
        loadedTexture.colorSpace = options.encoding;
      }

      loadedTexture.needsUpdate = true;
      setTexture(loadedTexture);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load texture"));
    } finally {
      setLoading(false);
    }
  }, [url, options.repeat, options.encoding]);

  useEffect(() => {
    loadTexture();

    return () => {
      if (texture) {
        texture.dispose();
      }
    };
  }, [loadTexture]);

  return { texture, loading, error };
}

export function useTextureBatch(urls: (string | null)[], options: UseTextureOptions = {}) {
  const [textures, setTextures] = useState<Map<string, THREE.Texture>>(new Map());
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Map<string, Error>>(new Map());

  useEffect(() => {
    const validUrls = urls.filter(Boolean) as string[];
    if (validUrls.length === 0) return;

    setLoading(true);
    const newTextures = new Map<string, THREE.Texture>();
    const newErrors = new Map<string, Error>();
    let completed = 0;

    validUrls.forEach(async (url) => {
      try {
        let loadedTexture: THREE.Texture;

        if (isKTX2Url(url)) {
          loadedTexture = await loadKTX2Texture(url);
        } else {
          const loader = new THREE.TextureLoader();
          loadedTexture = await new Promise<THREE.Texture>((resolve, reject) => {
            loader.load(url, resolve, undefined, reject);
          });
        }

        if (options.repeat) {
          loadedTexture.wrapS = THREE.RepeatWrapping;
          loadedTexture.wrapT = THREE.RepeatWrapping;
          loadedTexture.repeat.set(options.repeat[0], options.repeat[1]);
        }

        loadedTexture.needsUpdate = true;
        newTextures.set(url, loadedTexture);
      } catch (err) {
        newErrors.set(url, err instanceof Error ? err : new Error("Failed to load texture"));
      } finally {
        completed++;
        if (completed === validUrls.length) {
          setTextures(newTextures);
          setErrors(newErrors);
          setLoading(false);
        }
      }
    });

    return () => {
      newTextures.forEach((texture) => texture.dispose());
    };
  }, [urls.join(","), options.repeat?.join(",")]);

  return { textures, loading, errors };
}
