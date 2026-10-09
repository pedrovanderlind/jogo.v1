// ==================================================
// 1. IMPORTAR O THREE.JS e DRACOLoader
// ==================================================

import * as THREE from 'three';

import { GLTFLoader } from
    'three/addons/loaders/GLTFLoader.js';

import { DRACOLoader } from
    'three/addons/loaders/DRACOLoader.js';
    
// ==================================================
// 2. ELEMENTOS DA PÁGINA
// ==================================================

const areaJogo = document.getElementById('jogo');

const mensagem = document.getElementById('mensagem');

const status = document.getElementById('status');


// ==================================================
// 3. CRIAR A CENA 3D
// ==================================================

const cena = new THREE.Scene();

// Cor do céu

cena.background = new THREE.Color(0x87ceeb);

// Neblina para dar profundidade ao cenário

cena.fog = new THREE.Fog(
    0x87ceeb,
    35,
    100
);


// ==================================================
// 4. CRIAR A CÂMERA
// ==================================================

const camera = new THREE.PerspectiveCamera(

    60,

    areaJogo.clientWidth / areaJogo.clientHeight,

    0.1,

    200

);

// Posição inicial da câmera

camera.position.set(0, 7, 10);


// ==================================================
// 5. CRIAR O RENDERIZADOR
// ==================================================

const renderer = new THREE.WebGLRenderer({

    antialias: true

});

renderer.setSize(

    areaJogo.clientWidth,

    areaJogo.clientHeight

);

renderer.setPixelRatio(

    Math.min(window.devicePixelRatio, 2)

);

// Configurar sombras

renderer.shadowMap.enabled = true;

renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Ajustar a saída de cores

renderer.outputColorSpace = THREE.SRGBColorSpace;

// Adicionar o canvas à página

areaJogo.appendChild(renderer.domElement);


// ==================================================
// 6. ILUMINAÇÃO DO AMBIENTE
// ==================================================

// Luz ambiente

const luzAmbiente = new THREE.HemisphereLight(

    0xffffff,

    0x567d46,

    2

);

cena.add(luzAmbiente);


// Luz do sol

const sol = new THREE.DirectionalLight(

    0xffffff,

    3

);

sol.position.set(15, 25, 10);

sol.castShadow = true;

sol.shadow.mapSize.set(1024, 1024);

sol.shadow.camera.left = -25;

sol.shadow.camera.right = 25;

sol.shadow.camera.top = 25;

sol.shadow.camera.bottom = -25;

cena.add(sol);


// ==================================================
// 7. CRIAR O CAMPO
// ==================================================

// Geometria do chão

const geometriaChao = new THREE.PlaneGeometry(

    100,

    100

);

// Material da grama

const materialChao = new THREE.MeshStandardMaterial({

    color: 0x4caf50,

    roughness: 1

});

// Criar o chão

const chao = new THREE.Mesh(

    geometriaChao,

    materialChao

);

// Deitar o plano para formar o chão

chao.rotation.x = -Math.PI / 2;

// Posicionar no nível do solo

chao.position.y = 0;

// Receber sombras

chao.receiveShadow = true;

// Adicionar à cena

cena.add(chao);


// ==================================================
// 8. CRIAR ÁRVORES
// ==================================================

function criarArvore(x, z) {

    // Tronco

    const geometriaTronco = new THREE.CylinderGeometry(

        0.2,

        0.3,

        1.5,

        8

    );

    const materialTronco = new THREE.MeshStandardMaterial({

        color: 0x795548

    });

    const tronco = new THREE.Mesh(

        geometriaTronco,

        materialTronco

    );

    tronco.position.set(

        x,

        0.75,

        z

    );

    tronco.castShadow = true;

    tronco.receiveShadow = true;

    cena.add(tronco);


    // Copa da árvore

    const geometriaCopa = new THREE.ConeGeometry(

        1.2,

        2.5,

        8

    );

    const materialCopa = new THREE.MeshStandardMaterial({

        color: 0x2e7d32

    });

    const copa = new THREE.Mesh(

        geometriaCopa,

        materialCopa

    );

    copa.position.set(

        x,

        2.5,

        z

    );

    copa.castShadow = true;

    cena.add(copa);

}


// Criar árvores nas bordas do cenário

for (let i = -40; i <= 40; i += 10) {

    criarArvore(i, -35);

    criarArvore(i, 35);

    criarArvore(-35, i);

    criarArvore(35, i);

}


// ==================================================
// 9. CRIAR PEDRAS DECORATIVAS
// ==================================================

function criarPedra(x, z) {

    const geometria = new THREE.DodecahedronGeometry(

        0.5,

        0

    );

    const material = new THREE.MeshStandardMaterial({

        color: 0x808080,

        roughness: 1

    });

    const pedra = new THREE.Mesh(

        geometria,

        material

    );

    pedra.position.set(

        x,

        0.3,

        z

    );

    pedra.rotation.set(

        Math.random(),

        Math.random(),

        Math.random()

    );

    pedra.castShadow = true;

    pedra.receiveShadow = true;

    cena.add(pedra);

}


// Distribuir pedras pelo campo

for (let i = 0; i < 25; i++) {

    const x = Math.random() * 50 - 25;

    const z = Math.random() * 50 - 25;

    criarPedra(x, z);

}


// ==================================================
// 10. CRIAR O PERSONAGEM
// ==================================================

// Grupo que controla a posição e a direção do personagem

const personagem = new THREE.Group();

cena.add(personagem);


// Posição inicial

personagem.position.set(0, 0, 0);


// Variáveis do modelo

let modeloCarregado = false;

let mixer = null;


// Carregador de modelos comprimidos com Draco

const dracoLoader = new DRACOLoader();

dracoLoader.setDecoderPath(
    'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/libs/draco/'
);

// Carregador de modelos 3D

const carregador = new GLTFLoader();

carregador.setDRACOLoader(dracoLoader);


// Importar o arquivo GLB

carregador.load(

    './assets/personagem.glb',
    

    function (gltf) {

        const modelo = gltf.scene;


        // Calcular o tamanho original do modelo

        const caixaInicial = new THREE.Box3()

            .setFromObject(modelo);


        const tamanhoInicial = new THREE.Vector3();

        caixaInicial.getSize(tamanhoInicial);


        // Ajustar a escala automaticamente

        const maiorDimensao = Math.max(

            tamanhoInicial.x,

            tamanhoInicial.y,

            tamanhoInicial.z

        );


        if (maiorDimensao > 0) {

            const escala = 1.8 / maiorDimensao;

            modelo.scale.setScalar(escala);

        }


        // Centralizar o modelo horizontalmente

        const centroInicial = new THREE.Box3()

            .setFromObject(modelo)

            .getCenter(new THREE.Vector3());


        modelo.position.x -= centroInicial.x;

        modelo.position.z -= centroInicial.z;


        // Ajustar os pés ao nível do chão

        const caixaFinal = new THREE.Box3()

            .setFromObject(modelo);


        modelo.position.y -= caixaFinal.min.y;


        // Configurar sombras

        modelo.traverse(function (objeto) {

            if (objeto.isMesh) {

                objeto.castShadow = true;

                objeto.receiveShadow = true;

            }

        });


        // Adicionar o modelo ao personagem

        personagem.add(modelo);


        // Preparar animações, caso o arquivo possua alguma

        if (gltf.animations.length > 0) {

            mixer = new THREE.AnimationMixer(modelo);

            const animacao = mixer.clipAction(

                gltf.animations[0]

            );

            animacao.play();

        }


        modeloCarregado = true;


        mensagem.style.display = 'none';

        status.textContent = 'Explore o campo!';


        console.log('Personagem carregado com sucesso!');

    },

    function (progresso) {

        if (progresso.total > 0) {

            const porcentagem = Math.round(

                progresso.loaded / progresso.total * 100

            );

            mensagem.textContent =

                `Carregando personagem: ${porcentagem}%`;

        }

    },

    undefined,

    function (erro) {

        console.error(

            'Erro ao carregar o personagem:',

            erro

        );

        mensagem.textContent =

            'Não foi possível carregar o personagem. ' +

            'Verifique o arquivo assets/personagem.glb.';

        status.textContent = 'Erro ao carregar o modelo';

    }

);


// ==================================================
// 11. CONTROLES DO TECLADO
// ==================================================

// Registrar as teclas pressionadas

const teclas = {};


// Detectar quando uma tecla é pressionada

window.addEventListener('keydown', function (evento) {

    const tecla = evento.key.toLowerCase();


    if (

        tecla === 'w' ||

        tecla === 'a' ||

        tecla === 's' ||

        tecla === 'd' ||

        tecla.startsWith('arrow')

    ) {

        evento.preventDefault();

    }


    teclas[tecla] = true;

});


// Detectar quando uma tecla é solta

window.addEventListener('keyup', function (evento) {

    const tecla = evento.key.toLowerCase();

    teclas[tecla] = false;

});


// Evitar que as teclas continuem pressionadas
// se a janela perder o foco

window.addEventListener('blur', function () {

    for (const tecla in teclas) {

        teclas[tecla] = false;

    }

});


// ==================================================
// 12. CONFIGURAR A MOVIMENTAÇÃO
// ==================================================

const velocidade = 6;


// Limites do campo

const limiteCampo = 30;


// Vetor para a direção do movimento

const direcao = new THREE.Vector3();


// ==================================================
// 13. ACOMPANHAR O PERSONAGEM COM A CÂMERA
// ==================================================

const alvoCamera = new THREE.Vector3();


// ==================================================
// 14. RELÓGIO PARA CONTROLAR O TEMPO
// ==================================================

const relogio = new THREE.Clock();


// ==================================================
// 15. FUNÇÃO PRINCIPAL DO JOGO
// ==================================================

function animar() {

    requestAnimationFrame(animar);


    // Calcular o tempo transcorrido

    const delta = Math.min(

        relogio.getDelta(),

        0.05

    );


    // Atualizar animações do modelo

    if (mixer) {

        mixer.update(delta);

    }


    // ==================================================
    // MOVIMENTAR O PERSONAGEM
    // ==================================================

    if (modeloCarregado) {

        // Zerar a direção antes de calcular o movimento

        direcao.set(0, 0, 0);


        // Movimentação horizontal

        if (

            teclas['w'] ||

            teclas['arrowup']

        ) {

            direcao.z -= 1;

        }


        if (

            teclas['s'] ||

            teclas['arrowdown']

        ) {

            direcao.z += 1;

        }


        // Movimentação lateral

        if (

            teclas['a'] ||

            teclas['arrowleft']

        ) {

            direcao.x -= 1;

        }


        if (

            teclas['d'] ||

            teclas['arrowright']

        ) {

            direcao.x += 1;

        }


        // Verificar se existe movimento

        if (direcao.lengthSq() > 0) {

            // Normalizar evita que a diagonal
            // seja mais rápida que o movimento reto

            direcao.normalize();


            // Movimentar o personagem

            personagem.position.x +=

                direcao.x * velocidade * delta;


            personagem.position.z +=

                direcao.z * velocidade * delta;


            // Girar o personagem na direção do movimento

            personagem.rotation.y = Math.atan2(

                direcao.x,

                direcao.z

            );

        }


        // Impedir que o personagem saia do campo

        personagem.position.x = THREE.MathUtils.clamp(

            personagem.position.x,

            -limiteCampo,

            limiteCampo

        );


        personagem.position.z = THREE.MathUtils.clamp(

            personagem.position.z,

            -limiteCampo,

            limiteCampo

        );


        // ==================================================
        // CÂMERA QUE ACOMPANHA O PERSONAGEM
        // ==================================================

        // Definir onde a câmera deve ficar

        const posicaoDesejada = new THREE.Vector3(

            personagem.position.x,

            personagem.position.y + 6,

            personagem.position.z + 9

        );


        // Movimento suave da câmera

        camera.position.lerp(

            posicaoDesejada,

            1 - Math.exp(-4 * delta)

        );


        // Definir o ponto que a câmera observa

        alvoCamera.set(

            personagem.position.x,

            personagem.position.y + 1,

            personagem.position.z

        );


        camera.lookAt(alvoCamera);

    }


    // ==================================================
    // DESENHAR A CENA
    // ==================================================

    renderer.render(

        cena,

        camera

    );

}


// Iniciar o jogo

animar();


// ==================================================
// 16. AJUSTAR A TELA QUANDO A JANELA MUDA DE TAMANHO
// ==================================================

window.addEventListener('resize', function () {

    const largura = areaJogo.clientWidth;

    const altura = areaJogo.clientHeight;


    // Atualizar proporção da câmera

    camera.aspect = largura / altura;

    camera.updateProjectionMatrix();


    // Redimensionar o renderizador

    renderer.setSize(

        largura,

        altura

    );

});
