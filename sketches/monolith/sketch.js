import * as THREE from "three";
import { RigidCuboid } from "./rigid-body.js";

// =============================================================================
// ARTWORK DESCRIPTION
// Shape, appearance, initial motion, and the animation itself live here.
// =============================================================================

// Composition and appearance
const BACKGROUND_COLOUR = 0x000000;
const FACE_COLOURS = [
    0x000000, 0x000000,
    0xffffff, 0xffffff,
    0xffffff, 0xffffff,
];
const CAMERA_POSITION = [16, 12, 24];
const ORTHOGRAPHIC_VIEW_HEIGHT = 14;

// The equations of motion are integrated at a fixed 240 Hz.
const PHYSICS_STEP = 1 / 240;
const STEP_EPSILON = PHYSICS_STEP * 1e-9;

// Artwork controls exposed in Fragment's interactive GUI.
export let props = {
    // Cuboid dimensions
    width:  { value: 0.4, params: { min: 0.2, max: 10, step: 0.1 }, onChange: requestArtworkReset },
    height: { value: 8.9, params: { min: 0.2, max: 10, step: 0.1 }, onChange: requestArtworkReset },
    depth:  { value: 4.9, params: { min: 0.2, max: 10, step: 0.1 }, onChange: requestArtworkReset },

    // Initial body-frame angular velocity
    wx: { value: 0.05, params: { min: -6, max: 6, step: 0.1 }, onChange: requestArtworkReset },
    wy: { value: 0.1, params: { min: -6, max: 6, step: 0.1 }, onChange: requestArtworkReset },
    wz: { value: -5.0, params: { min: -6, max: 6, step: 0.1 }, onChange: requestArtworkReset },

    // Simulated seconds per real second
    speed: { value: 0.2, params: { min: 0, max: 3, step: 0.1 } },

    // Fragment diagnostic; not part of the artwork.
    measuredFps: {
        value: 0,
        params: { step: 1, suffix: " fps" },
        displayName: "measured FPS",
        disabled: true,
    },
};

let body;
let mesh;
let accumulatedTime = 0;

function createArtwork() {
    const width = props.width.value;
    const height = props.height.value;
    const depth = props.depth.value;

    body = new RigidCuboid({
        width,
        height,
        depth,
        omega: [
            props.wx.value,
            props.wy.value,
            props.wz.value,
        ],
    });

    const geometry = new THREE.BoxGeometry(width, height, depth);
    const materials = FACE_COLOURS.map(color =>
        new THREE.MeshBasicMaterial({
            color,
            side: THREE.DoubleSide,
        })
    );

    mesh = new THREE.Mesh(geometry, materials);
    accumulatedTime = 0;
}

function advanceArtwork(frameSeconds) {
    accumulatedTime += frameSeconds * props.speed.value;

    const stepCount = Math.floor(
        (accumulatedTime + STEP_EPSILON) / PHYSICS_STEP
    );

    for (let i = 0; i < stepCount; i++) {
        body.step(PHYSICS_STEP);
    }

    accumulatedTime -= stepCount * PHYSICS_STEP;
}

// =============================================================================
// FRAGMENT, PAGE, AND RENDERING SUPPORT
// Readers interested only in the artwork can skip the remainder of this file.
// =============================================================================

export let rendering = "three";

export let buildConfig = {
    // Size the canvas to the viewport (including a portfolio iframe).
    // The surrounding page controls the display aspect ratio.
    resizing: "window",
    pixelRatio: 1,
    backgroundColor: "#000000",
    gui: false,
    layout: {
        headless: true,
        resizable: false,
    },
};

const MAX_FRAME_DELTA = 0.25;
const FPS_SAMPLE_DURATION = 500;

let camera;
let artworkNeedsReset = false;
let pageVisible = typeof document === "undefined" || !document.hidden;
let discardNextDelta = false;
let fpsSampleElapsed = 0;
let fpsSampleFrames = 0;

function requestArtworkReset() {
    artworkNeedsReset = true;
}

function disposeObject3D(object) {
    object.traverse((child) => {
        child.geometry?.dispose();

        const materials = Array.isArray(child.material)
            ? child.material
            : [child.material];

        materials.forEach(material => material?.dispose());
    });
}

function replaceArtwork(scene) {
    if (mesh) {
        scene.remove(mesh);
        disposeObject3D(mesh);
    }

    createArtwork();
    scene.add(mesh);
    artworkNeedsReset = false;
}

function handleVisibilityChange() {
    pageVisible = !document.hidden;
    accumulatedTime = 0;
    discardNextDelta = pageVisible;
    fpsSampleElapsed = 0;
    fpsSampleFrames = 0;

    if (!pageVisible) props.measuredFps.value = 0;
}

function measureFrameRate(deltaTime) {
    if (!(deltaTime > 0)) return;

    fpsSampleElapsed += deltaTime;
    fpsSampleFrames++;

    if (fpsSampleElapsed >= FPS_SAMPLE_DURATION) {
        props.measuredFps.value = Math.round(
            fpsSampleFrames * 1000 / fpsSampleElapsed
        );
        fpsSampleElapsed = 0;
        fpsSampleFrames = 0;
    }
}

function updateCameraProjection(width, height) {
    const halfHeight = ORTHOGRAPHIC_VIEW_HEIGHT / 2;
    const halfWidth = halfHeight * width / height;

    camera.left = -halfWidth;
    camera.right = halfWidth;
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    camera.updateProjectionMatrix();
}

export let init = ({ scene, width, height }) => {
    // RENDERING SETUP
    scene.background = new THREE.Color(BACKGROUND_COLOUR);
    camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
    updateCameraProjection(width, height);
    camera.position.set(...CAMERA_POSITION);
    camera.lookAt(0, 0, 0);

    // ARTWORK SETUP
    replaceArtwork(scene);

    // PAGE LIFECYCLE
    if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        document.addEventListener("visibilitychange", handleVisibilityChange);
        pageVisible = !document.hidden;
        discardNextDelta = true;
    }
};

export let update = ({ renderer, scene, deltaTime }) => {
    // FRAGMENT GUI AND PAGE LIFECYCLE
    if (artworkNeedsReset) replaceArtwork(scene);
    if (!pageVisible) return;

    const elapsedMilliseconds = Number.isFinite(deltaTime) ? deltaTime : 0;

    if (discardNextDelta) {
        discardNextDelta = false;
    } else {
        // FRAGMENT DIAGNOSTIC
        measureFrameRate(elapsedMilliseconds);

        // ARTWORK ANIMATION
        const frameSeconds = Math.min(
            Math.max(elapsedMilliseconds, 0) / 1000,
            MAX_FRAME_DELTA
        );
        advanceArtwork(frameSeconds);
    }

    // THREE.JS RENDERING BRIDGE
    const [w, x, y, z] = body.quaternion;
    mesh.quaternion.set(x, y, z, w);
    renderer.render(scene, camera);
};

export let resize = ({ width, height }) => {
    updateCameraProjection(width, height);
};

export let dispose = () => {
    if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
    }
};
