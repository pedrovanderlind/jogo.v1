// ==================================================
// 1. IMPORTAR O THREE.JS, GLTFLoader e DRACOLoader
// ==================================================
 
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
 
// ==================================================
// 2. ELEMENTOS DA PÁGINA
// ==================================================
 
const areaJogo = document.getElementById('jogo');
const mensagem = document.getElementById('mensagem');
const status = document.getElementById('status');
 
// ==================================================
// 3. CENA
// ==================================================
 
const cena = new THREE.Scene();
cena.background = new THREE.Color(0x87ceeb);
cena.fog = new THREE.Fog(0x87ceeb, 40, 110);
 
// ==================================================
// 4. CÂMERA
// ==================================================
 
const FOV_NORMAL = 60;
const FOV_CORRIDA = 72;
 
const camera = new THREE.PerspectiveCamera(
    FOV_NORMAL,
    areaJogo.clientWidth / areaJogo.clientHeight,
    0.1,
    250
);
 
// ==================================================
// 5. RENDERIZADOR
// ==================================================
 
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(areaJogo.clientWidth, areaJogo.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
areaJogo.appendChild(renderer.domElement);
 
// Evita o menu do botão direito e gestos do navegador sobre o jogo
renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
renderer.domElement.style.touchAction = 'none';
 
// ==================================================
// 6. ILUMINAÇÃO
// ==================================================
 
const luzAmbiente = new THREE.HemisphereLight(0xffffff, 0x567d46, 2);
cena.add(luzAmbiente);
 
const sol = new THREE.DirectionalLight(0xffffff, 3);
sol.position.set(15, 25, 10);
sol.castShadow = true;
sol.shadow.mapSize.set(2048, 2048);
sol.shadow.camera.left = -30;
sol.shadow.camera.right = 30;
sol.shadow.camera.top = 30;
sol.shadow.camera.bottom = -30;
sol.shadow.camera.near = 1;
sol.shadow.camera.far = 80;
sol.shadow.bias = -0.0005;
cena.add(sol);
cena.add(sol.target);
 
// ==================================================
// 7. CAMPO
// ==================================================
 
const chao = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshStandardMaterial({ color: 0x4caf50, roughness: 1 })
);
chao.rotation.x = -Math.PI / 2;
chao.receiveShadow = true;
cena.add(chao);
 
// Grade sutil para você perceber o movimento da câmera
const grade = new THREE.GridHelper(200, 100, 0x3e8e41, 0x3e8e41);
grade.material.transparent = true;
grade.material.opacity = 0.25;
grade.position.y = 0.01;
cena.add(grade);
 
// ==================================================
// 8. DECORAÇÃO (árvores e pedras para dar referência)
// ==================================================
 
function pseudoAleatorio(semente) {
    const x = Math.sin(semente * 127.1) * 43758.5453;
    return x - Math.floor(x);
}
 
const materialTronco = new THREE.MeshStandardMaterial({ color: 0x6d4c41 });
const materialFolha = new THREE.MeshStandardMaterial({ color: 0x2e7d32 });
const materialPedra = new THREE.MeshStandardMaterial({ color: 0x9e9e9e, roughness: 0.9 });
 
for (let i = 0; i < 40; i++) {
    const x = (pseudoAleatorio(i + 1) - 0.5) * 90;
    const z = (pseudoAleatorio(i + 100) - 0.5) * 90;
 
    // Deixa a área inicial livre
    if (Math.hypot(x, z) < 6) continue;
 
    const arvore = new THREE.Group();
 
    const tronco = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.35, 2, 8),
        materialTronco
    );
    tronco.position.y = 1;
    tronco.castShadow = true;
 
    const copa = new THREE.Mesh(
        new THREE.ConeGeometry(1.5, 3.5, 8),
        materialFolha
    );
    copa.position.y = 3.5;
    copa.castShadow = true;
 
    arvore.add(tronco, copa);
    arvore.position.set(x, 0, z);
    arvore.scale.setScalar(0.8 + pseudoAleatorio(i + 200) * 0.7);
    cena.add(arvore);
}
 
for (let i = 0; i < 25; i++) {
    const x = (pseudoAleatorio(i + 300) - 0.5) * 80;
    const z = (pseudoAleatorio(i + 400) - 0.5) * 80;
    if (Math.hypot(x, z) < 4) continue;
 
    const pedra = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.4 + pseudoAleatorio(i + 500) * 0.6),
        materialPedra
    );
    pedra.position.set(x, 0.3, z);
    pedra.rotation.set(i, i * 2, i * 3);
    pedra.castShadow = true;
    pedra.receiveShadow = true;
    cena.add(pedra);
}
 
// ==================================================
// 9. PERSONAGEM
// ==================================================
 
const personagem = new THREE.Group();
cena.add(personagem);
personagem.position.set(0, 0, 0);
 
let modeloCarregado = false;
let mixer = null;
let acaoAnimacao = null;
 
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath(
    'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/libs/draco/'
);
 
const carregador = new GLTFLoader();
carregador.setDRACOLoader(dracoLoader);
 
carregador.load(
    './assets/personagem.glb',
 
    function (gltf) {
        const modelo = gltf.scene;
 
        // Ajustar escala automaticamente (altura ~1.8)
        const tamanhoInicial = new THREE.Box3()
            .setFromObject(modelo)
            .getSize(new THREE.Vector3());
 
        const maiorDimensao = Math.max(
            tamanhoInicial.x,
            tamanhoInicial.y,
            tamanhoInicial.z
        );
 
        if (maiorDimensao > 0) {
            modelo.scale.setScalar(1.8 / maiorDimensao);
        }
 
        // Centralizar horizontalmente
        const centro = new THREE.Box3()
            .setFromObject(modelo)
            .getCenter(new THREE.Vector3());
 
        modelo.position.x -= centro.x;
        modelo.position.z -= centro.z;
 
        // Pés no chão
        const caixaFinal = new THREE.Box3().setFromObject(modelo);
        modelo.position.y -= caixaFinal.min.y;
 
        modelo.traverse(function (objeto) {
            if (objeto.isMesh) {
                objeto.castShadow = true;
                objeto.receiveShadow = true;
            }
        });
 
        personagem.add(modelo);
 
        if (gltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(modelo);
            acaoAnimacao = mixer.clipAction(gltf.animations[0]);
            acaoAnimacao.play();
            acaoAnimacao.timeScale = 0; // só anima quando andar
        }
 
        modeloCarregado = true;
        mensagem.style.display = 'none';
        status.textContent = 'WASD move • Shift corre • Arraste o mouse para girar a câmera • Scroll = zoom';
        console.log('Personagem carregado com sucesso!');
    },
 
    function (progresso) {
        if (progresso.total > 0) {
            const porcentagem = Math.round(progresso.loaded / progresso.total * 100);
            mensagem.textContent = `Carregando personagem: ${porcentagem}%`;
        }
    },
 
    function (erro) {
        console.error('Erro ao carregar o personagem:', erro);
        mensagem.textContent =
            'Não foi possível carregar o personagem. ' +
            'Verifique o arquivo assets/personagem.glb.';
        status.textContent = 'Erro ao carregar o modelo';
    }
);
 
// ==================================================
// 10. CONTROLES DO TECLADO
// ==================================================
 
const teclas = {};
 
window.addEventListener('keydown', function (evento) {
    const tecla = evento.key.toLowerCase();
 
    if (
        ['w', 'a', 's', 'd', 'q', 'e', ' ', 'shift'].includes(tecla) ||
        tecla.startsWith('arrow')
    ) {
        evento.preventDefault();
    }
 
    teclas[tecla] = true;
});
 
window.addEventListener('keyup', function (evento) {
    teclas[evento.key.toLowerCase()] = false;
});
 
window.addEventListener('blur', function () {
    for (const tecla in teclas) teclas[tecla] = false;
});
 
// ==================================================
// 11. SISTEMA DE CÂMERA (terceira pessoa orbital)
// ==================================================
//  - Arraste (mouse ou dedo) para girar ao redor do personagem
//  - Scroll / pinça para zoom
//  - Q / E giram a câmera pelo teclado
//  - R centraliza a câmera atrás do personagem
//  - Suavização (damping) em tudo: giro, zoom, posição e FOV
//  - A câmera nunca entra no chão
//  - O movimento é relativo à direção da câmera
// ==================================================
 
const cam = {
    // Valores desejados (controlados pelo jogador)
    yaw: 0,
    pitch: 0.45,
    distancia: 9,
 
    // Valores suaves (os que realmente são aplicados)
    yawSuave: 0,
    pitchSuave: 0.45,
    distanciaSuave: 9,
 
    // Limites
    pitchMin: -0.15,
    pitchMax: 1.35,
    distMin: 3,
    distMax: 22,
 
    // Sensibilidade
    sensibilidadeMouse: 0.005,
    sensibilidadeZoom: 0.01,
    velocidadeTeclado: 2.2,
 
    // Ponto observado (suavizado)
    alvo: new THREE.Vector3(0, 1.5, 0),
    alturaAlvo: 1.5,
 
    // FOV suave
    fov: FOV_NORMAL
};
 
// ---------- Mouse / toque (Pointer Events) ----------
 
const ponteiros = new Map();
let distanciaPinca = 0;
 
renderer.domElement.addEventListener('pointerdown', (e) => {
    renderer.domElement.setPointerCapture(e.pointerId);
    ponteiros.set(e.pointerId, { x: e.clientX, y: e.clientY });
 
    if (ponteiros.size === 2) {
        const [a, b] = [...ponteiros.values()];
        distanciaPinca = Math.hypot(a.x - b.x, a.y - b.y);
    }
});
 
renderer.domElement.addEventListener('pointermove', (e) => {
    const anterior = ponteiros.get(e.pointerId);
    if (!anterior) return;
 
    const dx = e.clientX - anterior.x;
    const dy = e.clientY - anterior.y;
    ponteiros.set(e.pointerId, { x: e.clientX, y: e.clientY });
 
    if (ponteiros.size === 1) {
        // Girar
        cam.yaw -= dx * cam.sensibilidadeMouse;
        cam.pitch += dy * cam.sensibilidadeMouse;
        cam.pitch = THREE.MathUtils.clamp(cam.pitch, cam.pitchMin, cam.pitchMax);
    } else if (ponteiros.size === 2) {
        // Pinça (zoom no celular)
        const [a, b] = [...ponteiros.values()];
        const nova = Math.hypot(a.x - b.x, a.y - b.y);
        cam.distancia -= (nova - distanciaPinca) * 0.03;
        cam.distancia = THREE.MathUtils.clamp(cam.distancia, cam.distMin, cam.distMax);
        distanciaPinca = nova;
    }
});
 
function soltarPonteiro(e) {
    ponteiros.delete(e.pointerId);
    distanciaPinca = 0;
}
 
renderer.domElement.addEventListener('pointerup', soltarPonteiro);
renderer.domElement.addEventListener('pointercancel', soltarPonteiro);
 
// ---------- Zoom com a roda do mouse ----------
 
renderer.domElement.addEventListener('wheel', (e) => {
    e.preventDefault();
 
    // Zoom proporcional: mais suave de perto, mais rápido de longe
    cam.distancia *= 1 + e.deltaY * cam.sensibilidadeZoom * 0.1;
    cam.distancia = THREE.MathUtils.clamp(cam.distancia, cam.distMin, cam.distMax);
}, { passive: false });
 
// ---------- Utilitário: interpolar ângulos pelo caminho mais curto ----------
 
function menorDiferencaAngular(de, para) {
    let d = (para - de) % (Math.PI * 2);
    if (d > Math.PI) d -= Math.PI * 2;
    if (d < -Math.PI) d += Math.PI * 2;
    return d;
}
 
// ---------- Atualização da câmera a cada quadro ----------
 
const posicaoCamera = new THREE.Vector3();
const alvoDesejado = new THREE.Vector3();
 
function atualizarCamera(delta, correndo, movendo) {
    // Giro pelo teclado (Q / E)
    if (teclas['q']) cam.yaw += cam.velocidadeTeclado * delta;
    if (teclas['e']) cam.yaw -= cam.velocidadeTeclado * delta;
 
    // Recentralizar atrás do personagem (R)
    if (teclas['r']) {
        const alvoYaw = personagem.rotation.y + Math.PI;
        cam.yaw += menorDiferencaAngular(cam.yaw, alvoYaw) * (1 - Math.exp(-6 * delta));
        cam.pitch += (0.45 - cam.pitch) * (1 - Math.exp(-6 * delta));
    }
 
    // Suavização exponencial (independente de FPS)
    const kRot = 1 - Math.exp(-14 * delta);
    const kZoom = 1 - Math.exp(-8 * delta);
    const kAlvo = 1 - Math.exp(-10 * delta);
    const kFov = 1 - Math.exp(-5 * delta);
 
    cam.yawSuave += menorDiferencaAngular(cam.yawSuave, cam.yaw) * kRot;
    cam.pitchSuave += (cam.pitch - cam.pitchSuave) * kRot;
    cam.distanciaSuave += (cam.distancia - cam.distanciaSuave) * kZoom;
 
    // Ponto observado: acompanha o personagem com leve atraso
    alvoDesejado.set(
        personagem.position.x,
        personagem.position.y + cam.alturaAlvo,
        personagem.position.z
    );
    cam.alvo.lerp(alvoDesejado, kAlvo);
 
    // Posição esférica ao redor do alvo
    const cosPitch = Math.cos(cam.pitchSuave);
    posicaoCamera.set(
        Math.sin(cam.yawSuave) * cosPitch,
        Math.sin(cam.pitchSuave),
        Math.cos(cam.yawSuave) * cosPitch
    ).multiplyScalar(cam.distanciaSuave).add(cam.alvo);
 
    // Nunca deixar a câmera atravessar o chão
    posicaoCamera.y = Math.max(posicaoCamera.y, 0.4);
 
    // Nunca sair do campo visível
    posicaoCamera.x = THREE.MathUtils.clamp(posicaoCamera.x, -95, 95);
    posicaoCamera.z = THREE.MathUtils.clamp(posicaoCamera.z, -95, 95);
 
    camera.position.copy(posicaoCamera);
    camera.lookAt(cam.alvo);
 
    // FOV dinâmico: abre ao correr (sensação de velocidade)
    const fovDesejado = correndo && movendo ? FOV_CORRIDA : FOV_NORMAL;
    cam.fov += (fovDesejado - cam.fov) * kFov;
    if (Math.abs(camera.fov - cam.fov) > 0.01) {
        camera.fov = cam.fov;
        camera.updateProjectionMatrix();
    }
 
    // A luz/sombra acompanha o personagem para a sombra nunca sumir
    sol.position.set(
        personagem.position.x + 15,
        25,
        personagem.position.z + 10
    );
    sol.target.position.copy(personagem.position);
}
 
// ==================================================
// 12. MOVIMENTAÇÃO
// ==================================================
 
const velocidadeAndar = 6;
const velocidadeCorrer = 11;
const limiteCampo = 45;
 
const direcaoEntrada = new THREE.Vector3();
const direcaoMundo = new THREE.Vector3();
const frente = new THREE.Vector3();
const lado = new THREE.Vector3();
 
let velocidadeAtual = 0;
 
// ==================================================
// 13. RELÓGIO
// ==================================================
 
const relogio = new THREE.Clock();
 
// ==================================================
// 14. LOOP PRINCIPAL
// ==================================================
 
function animar() {
    requestAnimationFrame(animar);
 
    const delta = Math.min(relogio.getDelta(), 0.05);
 
    let movendo = false;
    const correndo = !!teclas['shift'];
 
    if (modeloCarregado) {
        // ---- Entrada: x = esquerda/direita, z = frente/trás ----
        direcaoEntrada.set(0, 0, 0);
 
        if (teclas['w'] || teclas['arrowup']) direcaoEntrada.z += 1;
        if (teclas['s'] || teclas['arrowdown']) direcaoEntrada.z -= 1;
        if (teclas['a'] || teclas['arrowleft']) direcaoEntrada.x -= 1;
        if (teclas['d'] || teclas['arrowright']) direcaoEntrada.x += 1;
 
        movendo = direcaoEntrada.lengthSq() > 0;
 
        if (movendo) {
            direcaoEntrada.normalize();
 
            // Converter a entrada para a direção da câmera
            frente.set(-Math.sin(cam.yawSuave), 0, -Math.cos(cam.yawSuave));
            lado.set(Math.cos(cam.yawSuave), 0, -Math.sin(cam.yawSuave));
 
            direcaoMundo
                .set(0, 0, 0)
                .addScaledVector(frente, direcaoEntrada.z)
                .addScaledVector(lado, direcaoEntrada.x)
                .normalize();
 
            // Girar o personagem suavemente na direção do movimento
            const anguloAlvo = Math.atan2(direcaoMundo.x, direcaoMundo.z);
            personagem.rotation.y +=
                menorDiferencaAngular(personagem.rotation.y, anguloAlvo) *
                (1 - Math.exp(-14 * delta));
        }
 
        // ---- Aceleração suave ----
        const velocidadeMax = movendo
            ? (correndo ? velocidadeCorrer : velocidadeAndar)
            : 0;
 
        velocidadeAtual +=
            (velocidadeMax - velocidadeAtual) * (1 - Math.exp(-12 * delta));
 
        if (velocidadeAtual > 0.01 && movendo) {
            personagem.position.x += direcaoMundo.x * velocidadeAtual * delta;
            personagem.position.z += direcaoMundo.z * velocidadeAtual * delta;
        }
 
        // ---- Limites do campo ----
        personagem.position.x = THREE.MathUtils.clamp(
            personagem.position.x, -limiteCampo, limiteCampo
        );
        personagem.position.z = THREE.MathUtils.clamp(
            personagem.position.z, -limiteCampo, limiteCampo
        );
 
        // ---- Animação proporcional à velocidade ----
        if (acaoAnimacao) {
            acaoAnimacao.timeScale = velocidadeAtual / velocidadeAndar;
        }
    }
 
    if (mixer) mixer.update(delta);
 
    // A câmera funciona mesmo antes do modelo carregar
    atualizarCamera(delta, correndo, movendo);
 
    renderer.render(cena, camera);
}
 
animar();
 
// ==================================================
// 15. REDIMENSIONAMENTO
// ==================================================
 
function redimensionar() {
    const largura = areaJogo.clientWidth;
    const altura = areaJogo.clientHeight;
    if (largura === 0 || altura === 0) return;
 
    camera.aspect = largura / altura;
    camera.updateProjectionMatrix();
    renderer.setSize(largura, altura);
}
 
window.addEventListener('resize', redimensionar);
 
// Também reage quando o próprio container muda de tamanho
if ('ResizeObserver' in window) {
    new ResizeObserver(redimensionar).observe(areaJogo);
}
 