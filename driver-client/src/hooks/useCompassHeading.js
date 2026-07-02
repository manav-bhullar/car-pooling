import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useCompassHeading
 *
 * Reads the phone's physical compass via DeviceOrientationEvent.
 * On iOS 13+ the user must grant permission first.
 *
 * Returns:
 *   { heading, requestPermission, permissionState }
 *
 *   heading          – compass bearing in degrees (0 = North, 90 = East, CW)
 *   requestPermission – call this on a user gesture (button tap) on iOS
 *   permissionState  – 'prompt' | 'granted' | 'denied' | 'unsupported'
 */
export function useCompassHeading() {
  const [heading, setHeading] = useState(null);
  const [permissionState, setPermissionState] = useState('prompt');
  const smoothedHeading = useRef(null);

  const handleOrientation = useCallback((event) => {
    let raw;

    // webkitCompassHeading is iOS-specific and already gives true North bearing
    if (event.webkitCompassHeading != null) {
      raw = event.webkitCompassHeading;
    } else if (event.alpha != null) {
      // Android: alpha is degrees from North, counter-clockwise, so invert
      raw = (360 - event.alpha) % 360;
    } else {
      return;
    }

    // Exponential moving average for smoothness (like Google Maps compass)
    if (smoothedHeading.current === null) {
      smoothedHeading.current = raw;
    } else {
      // Handle 0/360 wrap-around (e.g. going from 355° to 5°)
      let delta = raw - smoothedHeading.current;
      if (delta > 180)  delta -= 360;
      if (delta < -180) delta += 360;
      smoothedHeading.current = smoothedHeading.current + delta * 0.2; // 0.2 = smoothing factor
      if (smoothedHeading.current < 0)   smoothedHeading.current += 360;
      if (smoothedHeading.current >= 360) smoothedHeading.current -= 360;
    }

    setHeading(Math.round(smoothedHeading.current));
  }, []);

  const startListening = useCallback(() => {
    window.addEventListener('deviceorientationabsolute', handleOrientation, true);
    window.addEventListener('deviceorientation', handleOrientation, true);
    setPermissionState('granted');
  }, [handleOrientation]);

  // Request permission on iOS 13+
  const requestPermission = useCallback(async () => {
    if (typeof window.DeviceOrientationEvent !== 'undefined' && typeof window.DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const result = await window.DeviceOrientationEvent.requestPermission();
        if (result === 'granted') {
          startListening();
        } else {
          setPermissionState('denied');
        }
      } catch {
        setPermissionState('denied');
      }
    } else {
      // Android / desktop — no permission needed
      startListening();
    }
  }, [startListening]);

  useEffect(() => {
    // Check if the API is supported at all
    if (typeof window.DeviceOrientationEvent === 'undefined') {
      setPermissionState('unsupported');
      return;
    }

    // On Android / desktop, we can start immediately without user gesture
    if (typeof window.DeviceOrientationEvent.requestPermission !== 'function') {
      startListening();
    }
    // On iOS 13+, wait for user to call requestPermission()

    return () => {
      window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, [startListening, handleOrientation]);

  return { heading, requestPermission, permissionState };
}
