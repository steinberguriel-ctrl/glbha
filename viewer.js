import * as THREE from "https://unpkg.com/three@0.165.0/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.165.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://unpkg.com/three@0.165.0/examples/jsm/loaders/GLTFLoader.js";

const canvas = document.getElementById("viewer-canvas");
const input = document.getElementById("glb-input");
const statusPill = document.getElementById("status-pill");
const loadingOverlay = document.getElementById("loading-overlay");
const DEGREES_IN_HALF_CIRCLE = 360;
const CAMERA_DISTANCE_MULTIPLIER = 1.25;
const FAR_PLANE_MULTIPLIER = 20;
const MIN_FAR_PLANE_OFFSET = 10;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0f19);

const camera = new THREE.PerspectiveCamera(55, canvas.clientWidth / canvas.clientHeight, 0.01, 1000);
camera.position.set(2.4, 1.5, 3.4);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.target.set(0, 0.8, 0);

const hemi = new THREE.HemisphereLight(0xbfd8ff, 0x0f1a2b, 1.25);
scene.add(hemi);

const key = new THREE.DirectionalLight(0xffffff, 1.0);
key.position.set(3, 4, 2);
scene.add(key);

const fill = new THREE.DirectionalLight(0x8cb6ff, 0.6);
fill.position.set(-3, 2, -2);
scene.add(fill);

const grid = new THREE.GridHelper(10, 20, 0x294166, 0x1a2a46);
grid.position.y = -0.001;
scene.add(grid);

const loader = new GLTFLoader();
let currentModel = null;
let currentModelUrl = null;

function setStatus(message, type = "default") {
  statusPill.textContent = message;
  statusPill.classList.remove("ok", "error");
  if (type === "ok") statusPill.classList.add("ok");
  if (type === "error") statusPill.classList.add("error");
}

function toggleLoading(show) {
  loadingOverlay.classList.toggle("hidden", !show);
}

function frameObject(object3D) {
  const box = new THREE.Box3().setFromObject(object3D);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  const maxSize = Math.max(size.x, size.y, size.z);
  const fitHeightDistance = maxSize / (2 * Math.tan((Math.PI * camera.fov) / DEGREES_IN_HALF_CIRCLE));
  const fitWidthDistance = fitHeightDistance / camera.aspect;
  const distance = CAMERA_DISTANCE_MULTIPLIER * Math.max(fitHeightDistance, fitWidthDistance);

  camera.near = Math.max(distance / 100, 0.01);
  camera.far = Math.max(distance * FAR_PLANE_MULTIPLIER, camera.near + MIN_FAR_PLANE_OFFSET);
  camera.updateProjectionMatrix();

  const direction = new THREE.Vector3(1, 0.5, 1).normalize();
  camera.position.copy(center).add(direction.multiplyScalar(distance));
  controls.target.copy(center);
  controls.update();
}

function removeCurrentModel() {
  if (!currentModel) return;

  scene.remove(currentModel);
  currentModel.traverse((node) => {
    if (!node.isMesh) return;
    node.geometry?.dispose();
    if (Array.isArray(node.material)) {
      node.material.forEach((m) => m?.dispose?.());
      return;
    }
    node.material?.dispose?.();
  });

  currentModel = null;
}

function validateFile(file) {
  return file && file.name.toLowerCase().endsWith(".glb");
}

function handleFile(file) {
  if (!validateFile(file)) {
    setStatus("Please upload a valid .glb file.", "error");
    return;
  }

  removeCurrentModel();
  if (currentModelUrl) URL.revokeObjectURL(currentModelUrl);
  currentModelUrl = URL.createObjectURL(file);

  setStatus("Loading model…");
  toggleLoading(true);

  loader.load(
    currentModelUrl,
    (gltf) => {
      currentModel = gltf.scene;
      scene.add(currentModel);
      frameObject(currentModel);
      setStatus(`Loaded: ${file.name}`, "ok");
      toggleLoading(false);
      URL.revokeObjectURL(currentModelUrl);
      currentModelUrl = null;
    },
    undefined,
    () => {
      setStatus("Could not parse this GLB file.", "error");
      toggleLoading(false);
      URL.revokeObjectURL(currentModelUrl);
      currentModelUrl = null;
    }
  );
}

input.addEventListener("change", (event) => {
  const [file] = event.target.files ?? [];
  if (!file) return;
  handleFile(file);
});

function onResize() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (width === 0 || height === 0) return;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}

window.addEventListener("resize", onResize);

function animate() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

onResize();
animate();
