
/**
 * Torque-free rotation of a uniform solid cuboid.
 *
 * State:
 *   omega = [wx, wy, wz]        body-frame angular velocity (rad/s)
 *   q     = [w, x, y, z]        body-to-world orientation quaternion
 *
 * Numerical integration: coupled RK4 for omega and q.
 */

export class RigidCuboid {
  constructor({
    width = 1,
    height = 1,
    depth = 1,
    mass = 1,
    omega = [0.1, 0.2, 3],
    quaternion = [1, 0, 0, 0],
  } = {}) {
    if ([width, height, depth, mass].some(v => !Number.isFinite(v) || v <= 0)) {
      throw new Error("Dimensions and mass must be positive.");
    }

    const [a, b, c] = [width, height, depth];

    this.I = [
      mass * (b*b + c*c) / 12,
      mass * (a*a + c*c) / 12,
      mass * (a*a + b*b) / 12,
    ];

    this.state = [
      ...omega,
      ...quaternion,
    ];

    this.normalize();
  }

  // Quaternion multiplication: a ⊗ b
  static multiply(a, b) {
    const [w, x, y, z] = a;
    const [v, i, j, k] = b;

    return [
      w*v - x*i - y*j - z*k,
      w*i + x*v + y*k - z*j,
      w*j - x*k + y*v + z*i,
      w*k + x*j - y*i + z*v,
    ];
  }

  // Time derivative of the complete state.
  derivative(s) {
    const [wx, wy, wz] = s;
    const [I1, I2, I3] = this.I;

    // Euler's torque-free equations
    const dwx = ((I2 - I3) / I1) * wy * wz;
    const dwy = ((I3 - I1) / I2) * wz * wx;
    const dwz = ((I1 - I2) / I3) * wx * wy;

    // qdot = 1/2 q ⊗ [0, omega]
    const q = s.slice(3, 7);
    const dq = RigidCuboid.multiply(q, [0, wx, wy, wz]);

    return [dwx, dwy, dwz, ...dq.map(v => v * 0.5)];
  }

  // Advance by dt seconds using classical RK4.
  step(dt) {
    if (!Number.isFinite(dt) || dt <= 0) {
      throw new Error("dt must be positive and finite.");
    }

    const s = this.state;
    const add = (a, b, scale) =>
      a.map((v, i) => v + scale * b[i]);

    const k1 = this.derivative(s);
    const k2 = this.derivative(add(s, k1, dt / 2));
    const k3 = this.derivative(add(s, k2, dt / 2));
    const k4 = this.derivative(add(s, k3, dt));

    this.state = s.map((v, i) =>
      v + dt / 6 * (
        k1[i] + 2*k2[i] + 2*k3[i] + k4[i]
      )
    );

    this.normalize();
  }

  normalize() {
    const q = this.state.slice(3, 7);
    const norm = Math.hypot(...q);
    if (!(norm > 0)) throw new Error("Invalid quaternion.");
    for (let i = 0; i < 4; i++) {
      this.state[i + 3] /= norm;
    }
  }

  get omega() {
    return this.state.slice(0, 3);
  }

  get quaternion() {
    return this.state.slice(3, 7);
  }

  get energy() {
    return 0.5 * this.I.reduce(
      (sum, I, i) => sum + I * this.omega[i] ** 2, 0
    );
  }

  get angularMomentum() {
    return this.I.map((I, i) => I * this.omega[i]);
  }
}
