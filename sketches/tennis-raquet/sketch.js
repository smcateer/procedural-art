
import * as THREE from "three";
import { RigidCuboid } from "./rigid-body.js";

export let rendering = "three";

// Fragment GUI controls
export let props = {
  width:  { value: 1.0, params: { min: 0.2, max: 4, step: 0.1 } },
  height: { value: 1.5, params: { min: 0.2, max: 4, step: 0.1 } },
  depth:  { value: 2.0, params: { min: 0.2, max: 4, step: 0.1 } },

  wx: { value: 0.1, params: { min: -6, max: 6, step: 0.1 } },
  wy: { value: 4.0, params: { min: -6, max: 6, step: 0.1 } },
  wz: { value: 0.1, params: { min: -6, max: 6, step: 0.1 } },

  speed: { value: 1, params: { min: 0, max: 3, step: 0.1 } },
};

let camera;
let mesh;
let body;
let elapsed = 0;

function createBody(scene) {
  if (mesh) {
    scene.remove(mesh);
    mesh.geometry.dispose();
    mesh.material.dispose();
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
    0xe76f51, 0xe76f51,
    0x2a9d8f, 0x2a9d8f,
    0xe9c46a, 0xe9c46a,
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
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry),
    new THREE.LineBasicMaterial({ color: 0x111111 })
  );
  mesh.add(edges);
}

export let init = ({ scene, width, height }) => {
  scene.background = new THREE.Color(0x101820);

  camera = new THREE.PerspectiveCamera(
    45,
    width / height,
    0.1,
    100
  );

  camera.position.set(4, 3, 6);
  camera.lookAt(0, 0, 0);

  createBody(scene);
  elapsed = 0;
};

export let update = ({ renderer, scene }) => {
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
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
};
