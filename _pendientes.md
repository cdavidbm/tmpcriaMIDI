 # REQUISITOS GENERALES

- UPS para regular cantidad de energia
- Base hecha a la medida para el proyector que va a la mesa
- Mesa especial hecha a la medida
- Dos compus, uno orquesta proyecciones y el otro el software
- Decoración general
- Marketing del proyecto:
   - web
   - Programa de mano y/o insumos/merch de la experiencia:
- Sistema de audio:
   - controles de la mesa
   - música ambiental (elaborar según tiempo de la exp.)
       - Pueden ser varios tracks entrelazados.
- Textos/Carteles/Instrucciones explicativos de la experiencia
   - Diagrama flujo de la experiencia (tiempo estimado de la experiencia)
   - Sustento narrativo final


# PENDIENTES A NIVEL DE SOFTWARE

## Adaptación para versión web pública y móvil

-  Usar `entorno.html` como página principal, no `index.html`.
-  Transformar el contenido de `index.html` en un menú desplegable o ventana modal accesible con un botón.
-  Mostrar los controles de morphing como *sliders*.
-  Agrupar las manipulaciones junto con los sliders morph-controls.
-  Ubicar la sección de transformación de la criatura (sliders y controles) en la parte inferior de la ventana.
-  Mostrar la escena principal en la parte superior.
-  Adaptar completamente la interfaz para móviles.

## Música y sonido

### Efectos sonoros

-  `index.html`:  
  -  Controles  
  -  Modo autorrotación  
  -  Modo animación  
  -  Click de envío de criatura

-  `entorno.html`:  
  -  Aparición de criatura  
  -  Colisiones  

### Música ambiental

-  Incluir música ambiental general para ambas escenas.

## Implementación de MediaPipe

### Seguimiento de mano

-  Usar la mano como cursor.

### Gestos a implementar

-  Agarre y liberación de criaturas.
-  Apuntar para crear puntos de comida que atraigan criaturas.
-  Arrastrar la mano para simular viento y mover criaturas o puntos rojos.

## Conversión y recombinación de modelos (Blender → Python)

1.  Descargar el modelo desde Blender.
2.  Abrir el modelo en Blender.
3.  Convertir el modelo a código Python.
4.  Probar el script para verificar la recreación de la figura.
5.  Integrar el script en el proyecto, reemplazando una criatura existente.
6.  Traer el modelo al proyecto y hacer pruebas.
7.  Recombinarlos para formar un nuevo set de criaturas.


## Actualizar Script análitico de Python

- actualizar archivo de `main.js` y crear uno nuevo para `entorno.js`
