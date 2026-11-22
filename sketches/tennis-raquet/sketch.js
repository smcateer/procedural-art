
import * as THREE from "three";
import { RigidCuboid } from "./rigid-body.js";

export let rendering = "three";

export let buildConfig = {
    dimensions: [500, 500],
    resizing: "fixed",
    pixelRatio: 1,
};

const ORTHOGRAPHIC_VIEW_HEIGHT = 14;

let bodyNeedsReset = false;

const resetBody = () => {
    bodyNeedsReset = true;
};

// Fragment GUI controls
export let props = {
    // Cuboid dimensions
    width:  { value: 0.4, params: { min: 0.2, max: 10, step: 0.1 }, onChange: resetBody },
    height: { value: 8.9, params: { min: 0.2, max: 10, step: 0.1 }, onChange: resetBody },
    depth:  { value: 4.9, params: { min: 0.2, max: 10, step: 0.1 }, onChange: resetBody },
    // Initial angular velocity components
    wx: { value: 0.05, params: { min: -6, max: 6, step: 0.1 }, onChange: resetBody },
    wy: { value: 0.1, params: { min: -6, max: 6, step: 0.1 }, onChange: resetBody },
    wz: { value: -5.0, params: { min: -6, max: 6, step: 0.1 }, onChange: resetBody },
    // Simulation speed
    speed: { value: 0.2, params: { min: 0, max: 3, step: 0.1 } },
};

let camera;
let mesh;
let body;
let elapsed = 0;

function createBody(scene) {
    if (mesh) {
        scene.remove(mesh);
        mesh.traverse((object) => {
            object.geometry?.dispose();

            const materials = Array.isArray(object.material)
                ? object.material
                : [object.material];

            materials.forEach(material => material?.dispose());
        });
    }

    const a = props.width.value;
    const b = props.height.value;
    const c = props.depth.value;

    body = new RigidCuboid({
        width: a,
        height: b,
        depth: c,
        omega: [
            props.wx.value,
            props.wy.value,
            props.wz.value,
        ],
    });

    const geometry = new THREE.BoxGeometry(a, b, c);

    // Different colours on each pair of faces
    const colours = [
        0x000000, 0x000000,
        0xffffff, 0xffffff,
        0xffffff, 0xffffff,
    ];

    const materials = colours.map(color =>
        new THREE.MeshBasicMaterial({
            color,
            side: THREE.DoubleSide,
        })
    );

    mesh = new THREE.Mesh(geometry, materials);
    scene.add(mesh);

    // Black outlines to make orientation obvious
    // const edges = new THREE.LineSegments(
    //     new THREE.EdgesGeometry(geometry),
    //     new THREE.LineBasicMaterial({ color: 0xffffff })
    // );
    // mesh.add(edges);
    bodyNeedsReset = false;
    elapsed = 0;
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
    scene.background = new THREE.Color(0x000000);

    camera = new THREE.OrthographicCamera(
        -1,
        1,
        1,
        -1,
        0.1,
        100
    );

    updateCameraProjection(width, height);
    camera.position.set(16, 12, 24);
    camera.lookAt(0, 0, 0);

    createBody(scene);
    elapsed = 0;
};

export let update = ({ renderer, scene }) => {
    if (bodyNeedsReset) createBody(scene);

    // Fixed simulated time per rendered frame.
    // Four RK4 substeps improve numerical accuracy.
    const dt = props.speed.value / 240;

    for (let i = 0; i < 4; i++) {
        if (dt > 0) body.step(dt);
    }

    elapsed += dt * 4;

    // Apply body-to-world quaternion
    const [w, x, y, z] = body.quaternion;
    mesh.quaternion.set(x, y, z, w);

    renderer.render(scene, camera);
};

export let resize = ({ width, height }) => {
    updateCameraProjection(width, height);
};
