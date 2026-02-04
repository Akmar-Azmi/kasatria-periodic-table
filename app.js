/*********************************
 * GOOGLE LOGIN
 *********************************/
google.accounts.id.initialize({
  client_id:
    "513987483285-39d6qma9ollbkb9b3rukvdvc50hu993u.apps.googleusercontent.com",
  callback: onLoginSuccess,
});

google.accounts.id.renderButton(document.getElementById("google-btn"), {
  theme: "outline",
  size: "large",
});

function onLoginSuccess() {
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("container").style.display = "block";
  document.getElementById("ui-bar").style.display = "flex";

  loadSheetData();
}

/*********************************
 * LOAD DATA FROM GOOGLE SHEET (CSV)
 *********************************/
const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTRwkOJehAAJnhCm_Vfq8owyRd1WsATIKYrzEpiGerXddC0-KGCDZpdK_oTAC0RLEPw9DiUmlTQTVRY/pub?output=csv";

function loadSheetData() {
  fetch(CSV_URL)
    .then((res) => res.text())
    .then((csvText) => {
      const parsed = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
      });

      processData(parsed.data);
    });
}

function processData(rows) {
  const people = rows.map((r) => ({
    name: r["Name"],
    photo: r["Photo"],
    age: r["Age"],
    country: r["Country"],
    interest: r["Interest"],
    networth: parseNetWorth(r["Net Worth"]),
  }));

  init3D(people);
  transform(targets.table);
}

function parseNetWorth(value) {
  if (!value) return 0;
  return Number(value.replace(/\$/g, "").replace(/,/g, ""));
}

/*********************************
 * THREE.JS GLOBALS
 *********************************/
let camera, scene, renderer, controls;
const objects = [];
const targets = {
  table: [],
  sphere: [],
  helix: [],
  grid: [],
  pyramid: [],
};

/*********************************
 * INIT 3D SCENE
 *********************************/
function init3D(data) {
  camera = new THREE.PerspectiveCamera(
    40,
    window.innerWidth / window.innerHeight,
    1,
    10000,
  );
  camera.position.z = 3000;

  scene = new THREE.Scene();

  createObjects(data);
  createLayouts();

  renderer = new THREE.CSS3DRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById("container").appendChild(renderer.domElement);

  controls = new THREE.TrackballControls(camera, renderer.domElement);
  controls.minDistance = 500;
  controls.maxDistance = 6000;

  // Buttons
  document.getElementById("table").onclick = () => transform(targets.table);
  document.getElementById("sphere").onclick = () => transform(targets.sphere);
  document.getElementById("helix").onclick = () => transform(targets.helix);
  document.getElementById("grid").onclick = () => transform(targets.grid);
  document.getElementById("pyramid").onclick = () =>transform(targets.pyramid);

  animate();
}

/*********************************
 * COLOR LOGIC follow Net Worth (IMAGE B)
 *********************************/
function getColor(networth) {
  if (networth < 100000) return "#EF3022"; // Red (Low)
  if (networth < 200000) return "#E8BB36"; // Orange (Medium)
  return "#3A9F48"; // Green (High)
}

/*********************************
 * CREATE TILES
 *********************************/
function createObjects(data) {
  data.forEach((person, i) => {
    const element = document.createElement("div");
    element.className = "element";
    element.style.backgroundColor = getColor(person.networth);

    element.innerHTML = `
  <div class="number">${i + 1}</div>

  <div class="photo">
    <img src="${person.photo}" onerror="this.style.display='none'" />
  </div>

  <div class="meta">
    <div class="age-country">${person.age} yrs, ${person.country}</div>
    <div class="interest">${person.interest}</div>
    <div class="networth">$${person.networth.toLocaleString()}</div>
  </div>
`;

    const object = new THREE.CSS3DObject(element);
    object.position.set(
      Math.random() * 4000 - 2000,
      Math.random() * 4000 - 2000,
      Math.random() * 4000 - 2000,
    );

    scene.add(object);
    objects.push(object);
  });
}

/*********************************
 * LAYOUTS
 *********************************/
function createLayouts() {
  targets.table = [];
  targets.sphere = [];
  targets.helix = [];
  targets.grid = [];
  targets.pyramid = [];

  createTable();
  createSphere();
  createHelix();
  createGrid();
  createPyramid();
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* TABLE 20 x 10 (IMAGE B) */
function createTable() {
  objects.forEach((obj, i) => {
    const target = new THREE.Object3D();
    target.position.x = (i % 20) * 140 - 1330;
    target.position.y = -Math.floor(i / 20) * 180 + 800;
    target.position.z = 0;

    targets.table.push(target);
  });
}

/* SPHERE */
function createSphere() {
  const spherical = new THREE.Spherical();
  const vector = new THREE.Vector3();

  objects.forEach((obj, i) => {
    const target = new THREE.Object3D();
    const phi = Math.acos(-1 + (2 * i) / objects.length);
    const theta = Math.sqrt(objects.length * Math.PI) * phi;

    spherical.set(800, phi, theta);
    target.position.setFromSpherical(spherical);
    vector.copy(target.position).multiplyScalar(2);
    target.lookAt(vector);

    targets.sphere.push(target);
  });
}

/* DOUBLE HELIX (REQUIRED) */
function createHelix() {
  const radius = 900;
  const verticalSpacing = 35;
  const turns = 3; // how many full rotations

  objects.forEach((obj, i) => {
    const target = new THREE.Object3D();

    const angle = (i / objects.length) * Math.PI * 2 * turns;
    const y = -(i * verticalSpacing) + 800;

    target.position.set(
      Math.cos(angle) * radius,
      y,
      Math.sin(angle) * radius
    );

    targets.helix.push(target);
  });
}

/* GRID 5 x 4 x 10 (IMAGE C) */
function createGrid() {
  objects.forEach((obj, i) => {
    const target = new THREE.Object3D();
    target.position.set(
      (i % 5) * 400 - 800,
      (Math.floor(i / 5) % 4) * 400 - 600,
      Math.floor(i / 20) * 400 - 800,
    );
    targets.grid.push(target);
  });
}

/*********************************
 * TRANSFORM + ANIMATION
 *********************************/
function transform(targetArray, duration = 2000) {
  TWEEN.removeAll();

  objects.forEach((obj, i) => {
    const target = targetArray[i];
    new TWEEN.Tween(obj.position)
      .to(
        {
          x: target.position.x,
          y: target.position.y,
          z: target.position.z,
        },
        Math.random() * duration + duration,
      )
      .easing(TWEEN.Easing.Exponential.InOut)
      .start();
  });
}

function animate() {
  requestAnimationFrame(animate);
  TWEEN.update();
  controls.update();
  renderer.render(scene, camera);
}

// Pyramid (Tetrahedron)
function createPyramid() {
  targets.pyramid = []; 
  const size = 900;

  const vertices = [
    new THREE.Vector3(0, size, 0),                 // top
    new THREE.Vector3(-size, -size, size),         // base 1
    new THREE.Vector3(size, -size, size),          // base 2
    new THREE.Vector3(0, -size, -size)             // base 3
  ];

  objects.forEach((obj, i) => {
    const target = new THREE.Object3D();
    const v = vertices[i % 4];

    // spread slightly around each vertex
    target.position.set(
      v.x + (Math.random() - 0.5) * 200,
      v.y + (Math.random() - 0.5) * 200,
      v.z + (Math.random() - 0.5) * 200
    );

    targets.pyramid.push(target);
  });
}


