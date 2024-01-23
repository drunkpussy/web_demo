import * as dat from 'lil-gui'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import firefliesVertexShader from './shaders/fireflies/vertex.glsl';
import firefliesFragmentShader from './shaders/fireflies/fragment.glsl';
import portalVertexShader from './shaders/portal/vertex.glsl';
import portalFragmentShader from './shaders/portal/fragment.glsl';
import outlineVertexShader from './shaders/outline/vertex.glsl';
import outlineFragmentShader from './shaders/outline/fragment.glsl';

import { gsap } from 'gsap';

/**
 * Base
 */
// Debug
const debugObject = {

};
const gui = new dat.GUI({
    width: 400
});
gui.hide();


// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene();

/**
 * Overlay
 */
const overlayGeometry = new THREE.PlaneGeometry(2, 2, 1, 1);
const overlayMaterial = new THREE.ShaderMaterial({ 
    // wireframe: true,
    uniforms: {
        uAlpha: { value: 1 },
    },
    vertexShader: `
        void main() {
            gl_Position = vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float uAlpha;

        void main() {
            gl_FragColor = vec4(0.0, 0.0, 0.0, uAlpha);
        }
    `,
    transparent: true,
 });
const overlay = new THREE.Mesh(overlayGeometry, overlayMaterial);
scene.add(overlay);

/**
 * Loaders
 */
const loadingBarElement = document.querySelector('.loading-bar');
const svgElement = document.querySelector('.svg-element');
const loadingManager = new THREE.LoadingManager(
    // Loaded
    () => {
        // console.log('loaded');
        gsap.to(overlayMaterial.uniforms.uAlpha, { duration: 3, value: 0 });
        svgElement.classList.add('ended');
        gsap.to(".svg-element", { duration: 1.5, display: 'none'});
    },
    // progress
    (itemUrl, itemsLoaded, itemsTotal) => {
        let progressRatio = itemsLoaded/itemsTotal;
        loadingBarElement.style.transform = `translateY(-${progressRatio * 100}%)`;
    }
);

// Texture loader
const textureLoader = new THREE.TextureLoader(loadingManager);

// Draco loader
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('draco/')

// GLTF loader
const gltfLoader = new GLTFLoader(loadingManager);
gltfLoader.setDRACOLoader(dracoLoader)

/**
 * Textures
 */
// const bakedTexture = textureLoader.load('test/baked2.png');
const faceTexture = textureLoader.load('test/Face_Base_color_1001.png');
const hairTexture = textureLoader.load('test/Hair_Base_color_1001.png');
const faceTranspTexture = textureLoader.load('test/Face_transparent_Base_color_1001.png');
const clothTexture = textureLoader.load('test/Cloth_outer_Base_color_1001.png');

const bgTexture = textureLoader.load('test/Objects_Base_color_1001.png');
// const bgTexture = textureLoader.load('test/Objects_Base_color_1001_cutout.png');
// const bgTexture = textureLoader.load('test/Objects_Base_color_1001_cutout_02.png');

faceTexture.flipY = false;
hairTexture.flipY = false;
faceTranspTexture.flipY = false;
clothTexture.flipY = false;
bgTexture.flipY = false;

// Mesh setup
const solidify = (mesh) => {
    const geometry = mesh.geometry;
    const material = new THREE.ShaderMaterial({
        uniforms: {
            uScaler: { value: 0.05 },
        },
        vertexShader: outlineVertexShader,
        fragmentShader: outlineFragmentShader,
        side: THREE.BackSide,
    });

    const outline = new THREE.Mesh(geometry, material);
    scene.add(outline);
};

/**
 * Materials
 */
// Test basic material
const basicMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });

// Baked material
// const bakedMaterial = new THREE.MeshBasicMaterial({ map: bakedTexture });
const faceMaterial = new THREE.MeshBasicMaterial({ map: faceTexture });
const hairMaterial = new THREE.MeshBasicMaterial({ map: hairTexture });
const faceTranspMaterial = new THREE.MeshBasicMaterial({ map: faceTranspTexture, transparent: true });
const clothMaterial = new THREE.MeshBasicMaterial({ map: clothTexture });
const bgMaterial = new THREE.MeshBasicMaterial({ map: bgTexture });
// faceMaterial.colorSpace = THREE.SRGBColorSpace;


// Pole light material
const poleLightMaterial = new THREE.MeshBasicMaterial({ color: 0xfeffbd, side: THREE.DoubleSide });


debugObject.portalColorStart = '#ff0000';
debugObject.portalColorEnd = '#0000ff';


gui.addColor(debugObject, 'portalColorStart').onChange(() => {
    portalLightMaterial.uniforms.uColorStart.value.set(debugObject.portalColorStart);
});
gui.addColor(debugObject, 'portalColorEnd').onChange(() => {
    portalLightMaterial.uniforms.uColorEnd.value.set(debugObject.portalColorEnd);
});


// Portal light material
const portalLightMaterial = new THREE.ShaderMaterial({
    uniforms: {
        uTime: { value: 0 },
        uColorStart: { value: new THREE.Color(0xff0000) },
        uColorEnd: { value: new THREE.Color(0x0000ff) },
    },
    vertexShader: portalVertexShader,
    fragmentShader: portalFragmentShader,
 });


/**
 * Model
 */
gltfLoader.load(
    'test/scene.glb',
    (gltf) => {
        // gltf.scene.traverse((child) => {
        //     child.material = faceMaterial;
        //     console.log(child);
        // });

        const faceMesh = gltf.scene.children.find((child) => {
            return child.name === 'Face';
        });

        const hairMesh = gltf.scene.children.find((child) => {
            return child.name === 'Hair';
        });

        const highlightMesh = gltf.scene.children.find((child) => {
            return child.name === 'Eye_highlight';
        });

        faceMesh.material = faceMaterial;
        hairMesh.material = hairMaterial;
        highlightMesh.material = faceTranspMaterial;
        
        scene.add(gltf.scene);
        // console.log(gltf.scene);
        // const outline = solidify(bakedMesh);
    }
);

gltfLoader.load(
    'test/bg.glb',
    (gltf) => {

        const bgMesh = gltf.scene.children.find((child) => {
            return child.name === 'bg';
        });



        bgMesh.material = bgMaterial;

        scene.add(gltf.scene);

        const outline = solidify(bgMesh);
    }
);

gltfLoader.load(
    'test/cloth.glb',
    (gltf) => {

        const clothMesh = gltf.scene.children.find((child) => {
            // console.log(child);
            return child.name === 'Cloth';
        });


        clothMesh.material = clothMaterial;

        scene.add(gltf.scene);

        // const outline = solidify(bgMesh);
    }
);

gltfLoader.load(
    'test/emission.glb',
    (gltf) => {

        const emissionMesh = gltf.scene.children.find((child) => {
            // console.log(child);
            return child.name === 'Emission';
        });

        emissionMesh.material = poleLightMaterial;

        scene.add(gltf.scene);

        // const outline = solidify(emissionMesh);
    }
);

/**
 * Fireflies
 */
// Geometry
const firefliesGeometry = new THREE.BufferGeometry();
const firefliesCount = 50;
const positionArray = new Float32Array(firefliesCount * 3);
const scaleArray = new Float32Array(firefliesCount);

for(let i=0; i<firefliesCount; i++) {
    positionArray[i * 3 + 0] = (Math.random() - 0.5) * 6;
    positionArray[i * 3 + 1] = (Math.random() - 0.5) * 5;
    positionArray[i * 3 + 2] = (Math.random() - 0.5) * 4;

    scaleArray[i] = Math.random();
};

firefliesGeometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3));
firefliesGeometry.setAttribute('aScale', new THREE.BufferAttribute(scaleArray, 1));

// Material
const firefliesMaterial = new THREE.ShaderMaterial({
    uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uSize: { value: 200 },
    },
    vertexShader: firefliesVertexShader,
    fragmentShader: firefliesFragmentShader,
    // transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
 });

 gui.add(firefliesMaterial.uniforms.uSize, 'value').min(0).max(500).step(1).name('firefliesSize');

// Points
const fireflies = new THREE.Points(firefliesGeometry, firefliesMaterial);
scene.add(fireflies);

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Update fireflies
    firefliesMaterial.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 0;
camera.position.y = 1;
camera.position.z = 6.5;
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

debugObject.clearColor = '#132558';
renderer.setClearColor(debugObject.clearColor);
gui.addColor(debugObject, 'clearColor').onChange(() => {
    renderer.setClearColor(debugObject.clearColor);
});

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime();

    // Updatef materials
    portalLightMaterial.uniforms.uTime.value = elapsedTime;
    firefliesMaterial.uniforms.uTime.value = elapsedTime;

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()