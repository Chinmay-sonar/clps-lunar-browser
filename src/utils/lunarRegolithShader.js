// ============================================================================
// src/utils/lunarRegolithShader.js
// NASA CLPS Photorealistic Lunar Regolith Shader (Hapke BRDF + Lommel-Seeliger)
// Compatible with Three.js r160+ ShadowMap & Dynamic Lighting Pipeline
// ============================================================================
import * as THREE from 'three';

/**
 * Creates a physically calibrated Lunar Regolith Material using Hapke radiative
 * transfer, Lommel-Seeliger particulate scattering, opposition surge, directional
 * Earthshine, fragment-level micro-crater normal perturbation, and a toggleable
 * LiDAR Slope/PSR Hazard Heatmap.
 */
export function createLunarRegolithMaterial(options = {}) {
  const {
    baseAlbedo = 0.14,          // Highland anorthositic regolith single-scattering albedo
    oppositionStrength = 1.38,  // SHOE amplitude (Bs0) for retro-reflective surge
    oppositionWidth = 0.065,    // Angular half-width (hs) controlled by regolith porosity
    sunDirection = new THREE.Vector3(0.999, 0.031, 0.0).normalize(), // 1.8 deg grazing
    earthDirection = new THREE.Vector3(-0.45, 0.19, 0.87).normalize(), // Sub-Earth vector
    earthshineIntensity = 0.035, // Subtle slate-blue Earthshine inside cold traps
    ambientFill = 0.65          // Default Mission Light daylight ambient fill
  } = options;

  const uniforms = {
    uSingleScatteringAlbedo: { value: baseAlbedo },
    uOppositionAmplitude: { value: oppositionStrength },
    uOppositionWidth: { value: oppositionWidth },
    uSunDirWorld: { value: sunDirection.clone() },
    uEarthDirWorld: { value: earthDirection.clone() },
    uEarthshineIntensity: { value: earthshineIntensity },
    uAmbientFill: { value: ambientFill },
    uHeatmapMode: { value: 0.0 }, // 0.0 = Photorealistic NAC Mode, 1.0 = LiDAR Hazard
    uRoverPos: { value: new THREE.Vector3(0, 0, 0) }
  };

  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0xdad8d2),
    roughness: 0.98,
    metalness: 0.0,
    flatShading: false,
    vertexColors: false
  });

  material.userData.lunarUniforms = uniforms;

  material.onBeforeCompile = (shader) => {
    // Bind custom uniforms
    Object.assign(shader.uniforms, uniforms);

    // 1. VERTEX SHADER INJECTION: Pass exact world position and world normal
    shader.vertexShader = `
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      varying float vElevation;
${shader.vertexShader}
    `.replace(
      '#include <worldpos_vertex>',
      `
      #include <worldpos_vertex>
      vec4 wp = modelMatrix * vec4(transformed, 1.0);
      vWorldPos = wp.xyz;
      vWorldNormal = normalize(mat3(modelMatrix) * objectNormal);
      vElevation = wp.y;
      `
    );

    // 2. FRAGMENT SHADER INJECTION: Hapke BRDF, Micro-Crater Normals & LiDAR Heatmap
    shader.fragmentShader = `
      uniform float uSingleScatteringAlbedo;
      uniform float uOppositionAmplitude;
      uniform float uOppositionWidth;
      uniform vec3 uSunDirWorld;
      uniform vec3 uEarthDirWorld;
      uniform float uEarthshineIntensity;
      uniform float uAmbientFill;
      uniform float uHeatmapMode;
      uniform vec3 uRoverPos;

      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      varying float vElevation;

      // Fast deterministic 2D -> 2D hash (no texture lookups required)
      vec2 hash22(vec2 p) {
        p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
        return fract(sin(p) * 43758.5453123);
      }

      // Hash 2D -> 1D scalar
      float hash21(vec2 p) {
        p = fract(p * vec2(234.34, 435.345));
        p += dot(p, p + 34.23);
        return fract(p.x * p.y);
      }

      // Value noise with analytical derivatives for rock/regolith clod micro-relief
      vec3 noised(vec2 x) {
        vec2 i = floor(x);
        vec2 f = fract(x);
        vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
        vec2 du = 30.0 * f * f * (f * (f - 2.0) + 1.0);
        float a = hash21(i + vec2(0.0, 0.0));
        float b = hash21(i + vec2(1.0, 0.0));
        float c = hash21(i + vec2(0.0, 1.0));
        float d = hash21(i + vec2(1.0, 1.0));
        float k0 = a;
        float k1 = b - a;
        float k2 = c - a;
        float k3 = a - b - c + d;
        return vec3(
          k0 + k1 * u.x + k2 * u.y + k3 * u.x * u.y,
          du * (vec2(k1, k2) + k3 * u.yx)
        );
      }

      // Procedural Worley Micro-Crater Gradient (captures 10cm - 2m impact pits)
      vec3 microCraterPerturbation(vec2 pos, float scale, float depthWeight) {
        vec2 p = pos * scale;
        vec2 n = floor(p);
        vec2 f = fract(p);
        vec2 grad = vec2(0.0);
        float albedoMod = 0.0;
        for (int j = -1; j <= 1; j++) {
          for (int i = -1; i <= 1; i++) {
            vec2 g = vec2(float(i), float(j));
            vec2 rnd = hash22(n + g);
            vec2 r = g - f + (0.15 + 0.7 * rnd);
            float d2 = dot(r, r);
            float rad = 0.22 + 0.25 * fract(rnd.x * 17.3);
            float uu = sqrt(d2) / rad;
            if (uu < 1.8) {
              // Melosh micro-pit derivative: bowl inside u < 1, raised rim lip at u ~= 1
              float dProfile = (uu < 1.0)
                ? (2.4 * uu - 3.2 * uu * uu)
                : (-1.2 * exp(-3.5 * (uu - 1.0)));
              vec2 dir = r / max(sqrt(d2), 1e-4);
              grad += dir * dProfile * depthWeight;
              // Fresh micro-craters expose brighter immature silicate ejecta
              if (uu >= 0.85 && uu <= 1.35) {
                albedoMod += 0.025 * exp(-4.0 * (uu - 1.0) * (uu - 1.0));
              }
            }
          }
        }
        return vec3(grad, albedoMod);
      }

      // Double-lobed Henyey-Greenstein Single-Particle Phase Function P(g)
      float hapkePhaseFunction(float cosG) {
        const float b = 0.28; // Highland regolith asymmetry parameter
        const float c = 0.65; // Strong backscattering lobe fraction
        float b2 = b * b;
        float denomBack = pow(max(1.0 - 2.0 * b * cosG + b2, 1e-4), 1.5);
        float denomFwd  = pow(max(1.0 + 2.0 * b * cosG + b2, 1e-4), 1.5);
        return 0.5 * (1.0 - c) * ((1.0 - b2) / denomBack) +
               0.5 * (1.0 + c) * ((1.0 - b2) / denomFwd);
      }

      // Ambartsumian-Chandrasekhar Isotropic Multiple Scattering Function H(x)
      float chandrasekharH(float x, float w) {
        float gamma = sqrt(max(1.0 - w, 1e-4));
        return (1.0 + 2.0 * x) / (1.0 + 2.0 * x * gamma);
      }

${shader.fragmentShader}
    `.replace(
      '#include <lights_fragment_begin>',
      `
      #include <lights_fragment_begin>

      // Distance from camera for anti-aliased multi-scale detail fade
      float camDist = length(vWorldPos - cameraPosition);
      float nearFade = 1.0 - smoothstep(15.0, 140.0, camDist);
      float microFade = 1.0 - smoothstep(4.0, 35.0, camDist);

      // Multi-tier micro-crater normal perturbation (1.8m, 0.45m, and 0.12m scales)
      vec3 mc1 = microCraterPerturbation(vWorldPos.xz, 0.55, 0.16);
      vec3 mc2 = microCraterPerturbation(vWorldPos.xz + vec2(17.3, 41.9), 2.2, 0.13 * nearFade);
      vec3 mc3 = microCraterPerturbation(vWorldPos.xz + vec2(83.1, 12.7), 8.5, 0.09 * microFade);

      // Fine regolith grain & impact breccia clod derivatives
      vec3 grain1 = noised(vWorldPos.xz * 3.5) * 0.06;
      vec3 grain2 = noised(vWorldPos.xz * 19.0) * (0.045 * nearFade);
      vec3 grain3 = noised(vWorldPos.xz * 75.0) * (0.03 * microFade);

      vec2 totalGrad = mc1.xy + mc2.xy + mc3.xy + grain1.yz + grain2.yz + grain3.yz;
      float localAlbedoBoost = mc1.z + mc2.z + (grain1.x - 0.5) * 0.025;

      // Construct perturbed world-space micro-normal
      vec3 perturbedWorldNormal = normalize(vec3(
        vWorldNormal.x - totalGrad.x,
        vWorldNormal.y,
        vWorldNormal.z - totalGrad.y
      ));
      `
    ).replace(
      '#include <opaque_fragment>',
      `
      // ======================================================================
      // HAPKE / LOMMEL-SEELIGER RADIATIVE TRANSFER & VACUUM SHADOW EVALUATION
      // ======================================================================
      vec3 N = perturbedWorldNormal;
      vec3 V = normalize(cameraPosition - vWorldPos);
      vec3 L = normalize(uSunDirWorld);

      float mu0 = max(dot(N, L), 0.0);         // Cosine of incidence angle (i)
      float mu  = max(dot(N, V), 1e-4);        // Cosine of emission angle (e)
      float cosG = clamp(dot(L, V), -1.0, 1.0); // Cosine of solar phase angle (g)
      float g = acos(cosG);                    // Phase angle in radians
      float tanHalfG = tan(0.5 * g);

      // Extract Three.js real-time shadow attenuation from directional light
      float shadowMask = 1.0;
      #if defined(USE_SHADOWMAP) && NUM_DIR_LIGHT_SHADOWS > 0
        DirectionalLightShadow dirShadow = directionalLightShadows[0];
        shadowMask = getShadow(
          directionalShadowMap[0],
          dirShadow.shadowMapSize,
          dirShadow.shadowIntensity,
          dirShadow.shadowBias,
          dirShadow.shadowRadius,
          vDirectionalShadowCoord[0]
        );
      #endif

      // Sharp terminator grazing self-shadowing
      float horizonSelfShadow = smoothstep(0.0, 0.035, mu0);
      float totalShadow = shadowMask * horizonSelfShadow;

      // 1. Lommel-Seeliger particulate volume factor: mu0 / (mu0 + mu)
      float lommelSeeliger = mu0 / max(mu0 + mu, 1e-4);

      // 2. Hapke Shadow-Hiding Opposition Surge B_SH(g)
      float B_sh = uOppositionAmplitude / (1.0 + (tanHalfG / max(uOppositionWidth, 1e-4)));

      // 3. Single-particle phase function P(g) & Multiple scattering H(mu0)*H(mu)
      float w = clamp(uSingleScatteringAlbedo + localAlbedoBoost, 0.07, 0.32);
      float P_g = hapkePhaseFunction(cosG);
      float H_mu0 = chandrasekharH(mu0, w);
      float H_mu  = chandrasekharH(mu, w);

      // Complete Hapke Bidirectional Reflectance
      float hapkeReflectance = lommelSeeliger * ((1.0 + B_sh) * P_g + (H_mu0 * H_mu - 1.0));

      // Subtle glassy impact spherule micro-glint (only at direct sun incidence & close range)
      float glintNoise = hash21(floor(vWorldPos.xz * 120.0));
      float glassSparkle = step(0.992, glintNoise) * pow(max(dot(reflect(-L, N), V), 0.0), 128.0) * 2.5 * microFade;

      // Authentic Apollo / LROC NAC calibrated lunar albedo
      vec3 baseAlbedo = diffuseColor.rgb;
      if (length(baseAlbedo) > 1.4 || length(baseAlbedo) < 0.05) {
        baseAlbedo = vec3(0.20, 0.20, 0.21); // Dark basaltic charcoal baseline (prevents whiteout during load)
      } else {
        baseAlbedo = baseAlbedo * 0.42; // Calibrate texture down to true ~12% lunar surface albedo
      }
      vec3 regolithTint = vec3(1.00, 1.00, 1.00) * baseAlbedo;
      vec3 directSunColor = vec3(1.65, 1.62, 1.58); // Balanced vacuum solar irradiance (prevents blowout)
      vec3 sunlitRadiance = regolithTint * directSunColor * (hapkeReflectance * w + glassSparkle) * totalShadow;

      // 4. Directional Earthshine inside Permanently Shadowed Regions
      float muEarth = max(dot(N, normalize(uEarthDirWorld)), 0.0);
      vec3 earthshineColor = vec3(0.35, 0.45, 0.65) * uEarthshineIntensity * muEarth;

      // 5. Diffuse Ambient Daylight Fill for Mission Light (Default) Mode
      // Calibrated to match Apollo photographic exposure: crisp shadows with deep, rich contrast
      float hemiFactor = 0.5 + 0.5 * N.y;
      vec3 daylightSkyFill = vec3(0.22, 0.24, 0.28);
      vec3 daylightGroundBounce = vec3(0.14, 0.15, 0.16);
      vec3 missionAmbient = mix(daylightGroundBounce, daylightSkyFill, hemiFactor);
      float microReliefContrast = 0.88 + 0.24 * (1.0 - hapkeReflectance);
      vec3 ambientFill = regolithTint * missionAmbient * (uAmbientFill * microReliefContrast);

      // 6. Deep Shadow Ambient Floor (prevents total pitch-black voids in cold traps)
      vec3 starlightFloor = vec3(0.045, 0.050, 0.060);

      // Secondary bounce from nearby sunlit crater walls (geometric cavity factor)
      float cavityBounce = (1.0 - max(vWorldNormal.y, 0.0)) * 0.025;
      vec3 finalLunarColor = sunlitRadiance + ambientFill + earthshineColor + starlightFloor + regolithTint * cavityBounce;

      // ======================================================================
      // OPTIONAL LIDAR SLOPE HAZARD & PSR COLD-TRAP HEATMAP OVERLAY ([H] Key)
      // ======================================================================
      if (uHeatmapMode > 0.01) {
        float slopeDeg = degrees(acos(clamp(vWorldNormal.y, 0.0, 1.0)));
        vec3 lidarColor;
        if (totalShadow < 0.05 && vElevation < -1.5) {
          // Permanently Shadowed Volatile Cold Trap (Water-Ice Target Zone)
          lidarColor = vec3(0.0, 0.85, 1.0);
        } else if (slopeDeg < 5.0) {
          // Safe CLPS Touchdown Zone (< 5 deg)
          lidarColor = mix(vec3(0.08, 0.78, 0.38), vec3(0.45, 0.88, 0.20), slopeDeg / 5.0);
        } else if (slopeDeg < 15.0) {
          // Rover Caution Traversal Grade (5 - 15 deg)
          lidarColor = mix(vec3(0.95, 0.80, 0.10), vec3(1.0, 0.42, 0.05), (slopeDeg - 5.0) / 10.0);
        } else {
          // Critical Slope / Tip-Over Hazard (> 15 deg)
          lidarColor = vec3(0.95, 0.12, 0.18);
        }

        // Topographic 2m contour lines
        float contour = smoothstep(0.92, 0.98, abs(sin(vElevation * 3.14159)));
        lidarColor = mix(lidarColor, vec3(1.0), contour * 0.35);

        finalLunarColor = mix(finalLunarColor, lidarColor * (0.35 + 0.65 * max(totalShadow, 0.15)), uHeatmapMode);
      }

      gl_FragColor = vec4(finalLunarColor, diffuseColor.a);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      #include <fog_fragment>
      `
    );
  };

  return material;
}

/**
 * Helper to update solar/Earth ephemeris vectors or toggle the LiDAR Heatmap at 60 FPS.
 */
export function updateLunarRegolithUniforms(material, { sunDir, earthDir, ambientFill, heatmapMode, roverPos } = {}) {
  const u = material?.userData?.lunarUniforms;
  if (!u) return;
  if (sunDir) u.uSunDirWorld.value.copy(sunDir).normalize();
  if (earthDir) u.uEarthDirWorld.value.copy(earthDir).normalize();
  if (typeof ambientFill === 'number') u.uAmbientFill.value = ambientFill;
  if (typeof heatmapMode === 'number') u.uHeatmapMode.value = heatmapMode;
  if (roverPos) u.uRoverPos.value.copy(roverPos);
}
