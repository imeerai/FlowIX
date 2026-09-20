import { useEffect, useRef } from "react";
import { NeatGradient } from "@firecms/neat";

const gradientConfig = {
  colors: [
    { color: "#730202", enabled: true },
    { color: "#1D1A1A", enabled: true },
    { color: "#150C0C", enabled: true },
    { color: "#350214", enabled: true },
    { color: "#0D0809", enabled: true },
    { color: "#A8E6CF", enabled: false },
  ],
  speed: 4,
  horizontalPressure: 4,
  verticalPressure: 3,
  waveFrequencyX: 0,
  waveFrequencyY: 0,
  waveAmplitude: 0,
  secondaryWaveEnabled: false,
  secondaryWaveFrequencyX: 3,
  secondaryWaveFrequencyY: 3,
  secondaryWaveAmplitude: 5,
  secondaryWaveSpeed: 0.6,
  secondaryWaveAngle: 1,
  shadows: 2,
  highlights: 7,
  colorBrightness: 1,
  colorSaturation: 8,
  wireframe: false,
  antialias: false,
  colorBlending: 5,
  backgroundColor: "#0F0F0F",
  backgroundAlpha: 1,
  grainScale: 0,
  grainSparsity: 0,
  grainIntensity: 0,
  grainSpeed: 0,
  resolution: 0.5,
  yOffset: 479.9000244140625,
  yOffsetWaveMultiplier: 1.5,
  yOffsetColorMultiplier: 1.8,
  yOffsetFlowMultiplier: 2,
  flowDistortionA: 5,
  flowDistortionB: 7.7,
  flowScale: 2.6,
  flowEase: 0.36,
  flowEnabled: false,
  enableProceduralTexture: false,
  transparentTextureVoid: false,
  textureMode: "bitmap",
  bakeEdgeSoftness: 1,
  textureVoidLikelihood: 0.22,
  textureVoidWidthMin: 120,
  textureVoidWidthMax: 150,
  textureBandDensity: 1.9,
  textureColorBlending: 0.12,
  textureSeed: 333,
  textureEase: 0.75,
  proceduralBackgroundColor: "#D0DBFB",
  textureShapeTriangles: 20,
  textureShapeCircles: 15,
  textureShapeBars: 15,
  textureShapeSquiggles: 10,
  domainWarpEnabled: false,
  domainWarpIntensity: 0,
  domainWarpScale: 3,
  vignetteIntensity: 0,
  vignetteRadius: 0.8,
  fresnelEnabled: false,
  fresnelPower: 2,
  fresnelIntensity: 0.5,
  fresnelColor: "#FFFFFF",
  iridescenceEnabled: false,
  iridescenceIntensity: 0.5,
  iridescenceSpeed: 1,
  prismEdgeEnabled: false,
  prismEdgeIntensity: 0.5,
  prismEdgeThinness: 3,
  prismEdgeSpread: 1,
  prismEdgeSpeed: 0.5,
  prismEdgeRipple: 1,
  bloomIntensity: 0,
  bloomThreshold: 0.7,
  chromaticAberration: 0,
  shapeType: "plane",
  shapeRotationX: 0,
  shapeRotationY: 0,
  shapeRotationZ: 0,
  shapeAutoRotateSpeedX: 0,
  shapeAutoRotateSpeedY: 0,
  sphereRadius: 15,
  torusRadius: 15,
  torusTube: 5,
  cylinderRadius: 10,
  cylinderHeight: 40,
  planeBend: 0,
  planeTwist: 0,
  silhouetteFade: 0.25,
  cylinderFade: 0.08,
  ribbonFade: 0.05,
  flatShading: true,
  cameraLock: true,
  cameraX: 0,
  cameraY: 0,
  cameraZ: 0,
  cameraRotationX: 0,
  cameraRotationY: 0,
  cameraRotationZ: 0,
  cameraZoom: 1,
};

function NeatGradientBackground({ className, scrollContainerRef }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return undefined;

    const gradient = new NeatGradient({
      ref: canvasRef.current,
      ...gradientConfig,
    });

    const scrollTarget = scrollContainerRef?.current || window;
    const handleScroll = () => {
      gradient.yOffset =
        scrollTarget === window ? window.scrollY : scrollTarget.scrollTop;
    };

    scrollTarget.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      scrollTarget.removeEventListener("scroll", handleScroll);
      gradient.destroy();
    };
  }, [scrollContainerRef]);

  return (
    <canvas
      ref={canvasRef}
      id="gradient"
      aria-hidden="true"
      className={
        className || "pointer-events-none fixed inset-0 -z-10 h-full w-full"
      }
    />
  );
}

export default NeatGradientBackground;
