# CRIA

Una aplicación web interactiva para visualizaciones de audio y experiencias generativas que combina tecnologías como Hydra, Three.js y controladores MIDI.

## 🎵 Descripción

Este proyecto es una aplicación web interactiva diseñada para crear experiencias audiovisuales inmersivas. Utiliza visualizaciones generativas con Hydra, interacciones MIDI, y elementos 3D para proporcionar una experiencia multimedia única.

## 🚀 Características

- **Visualizaciones Generativas**: Fondos dinámicos creados con Hydra
- **Interacción MIDI**: Soporte para controladores MIDI externos
- **Entorno 3D**: Escenas interactivas con modelos 3D, partículas y detección de colisiones
- **Sistema de Audio**: Gestión avanzada de audio y síntesis
- **Interfaz Modular**: Arquitectura basada en módulos para fácil mantenimiento

## 📁 Estructura del Proyecto

```
/
├── assets/
│   ├── css/
│   │   ├── entorno.css             # Estilos para el entorno 3D
│   │   └── home.css                # Estilos para la página principal
│   ├── js/
│   │   ├── fondo_hydra_entorno.js  # Visualizaciones Hydra del entorno
│   │   └── fondo_hydra_home.js     # Visualizaciones Hydra del home
│   └── modelo.glb                  # Modelo 3D principal
├── scripts/
│   ├── entorno/
│   │   ├── entorno.js              # Script principal del entorno
│   │   └── modules/
│   │       ├── collision.js        # Detección de colisiones
│   │       ├── constants.js        # Constantes del sistema
│   │       ├── creatures.js        # Gestión de criaturas
│   │       ├── interaction.js      # Interacciones del usuario
│   │       ├── particles.js        # Sistema de partículas
│   │       ├── scene.js            # Configuración de escena 3D
│   │       ├── terrain.js          # Generación de terreno
│   │       └── textures.js         # Gestión de texturas
│   └── home/
│       ├── main.js                 # Script principal del home
│       └── modules/
│           ├── AudioSystem.js      # Sistema de audio
│           ├── CreatureManager.js  # Gestión de criaturas
│           ├── MIDIController.js   # Control MIDI
│           ├── SceneManager.js     # Gestión de escena
│           ├── TextureUtils.js     # Utilidades de texturas
│           └── UIController.js     # Control de interfaz
├── index.html                      # Página principal
├── entorno.html                    # Página del entorno 3D
└── README.md                       # Este archivo
```

## 🛠️ Instalación

1. Descarga o Clona el repositorio

2. Instala las dependencias:
```bash
npm install
```

3. Inicia el servidor de desarrollo:
```bash
npm run dev
```

## 🎮 Uso

### Página Principal (Home)
- Accede a través de `index.html`
- Interfaz de bienvenida y configuración
- Conecta controladores MIDI
- Gestiona configuraciones de audio

### Entorno Interactivo
- Accede a través de `entorno.html`
- Experiencia 3D inmersiva
- Interacción con criaturas y partículas
- Visualizaciones generativas en tiempo real

## 🎛️ Controladores MIDI

La aplicación soporta controladores MIDI externos para una experiencia interactiva mejorada. Los controles MIDI pueden influir en:
- Parámetros de visualización
- Efectos de audio
- Comportamiento de las criaturas
- Sistemas de partículas

## 🔧 Tecnologías Utilizadas

- **JavaScript (ES6+)**: Lógica principal de la aplicación
- **Three.js**: Renderizado 3D y gestión de escenas
- **Hydra**: Visualizaciones generativas
- **Web Audio API**: Procesamiento de audio
- **Web MIDI API**: Interacción con controladores MIDI
- **HTML5/CSS3**: Estructura y estilos


---

**Nota**: Este proyecto está en desarrollo activo. Algunas características pueden estar en fase experimental.
