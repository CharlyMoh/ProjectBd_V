# Assets - Recursos del Proyecto

Carpeta centralizada para todos los archivos multimedia del proyecto StadiumProjectBd.

## Estructura de Archivos

### 📷 Imágenes PNG

#### Personajes
- `mainCharacter-girl.png` - Personaje principal (niña)
- `The green-masked kid.png` - Niño con máscara verde
- `The pink-masked kid.png` - Niña con máscara rosa
- `The purple-masked kid.png` - Niño con máscara púrpura
- `The blue-masked kid.png` - Niño con máscara azul
- `The orange-masked kid.png` - Niño con máscara naranja

#### Elementos de Escena
- `tableAndCake.png` - Mesa con pastel
- `door.png` - Puerta (usada en sala 2)
- `colored kids Cake.png` - Pastel colorido con niños
- `colored kids Table.png` - Mesa colorida con niños

#### Globos
- `ballon.png` - Globo (diseño predeterminado)
- `blue-ballon.png` - Globo azul
- `green-ballon.png` - Globo verde
- `purple-ballon.png` - Globo púrpura
- `yellow-ballon.png` - Globo amarillo

#### Controles
- `left.png` - Flecha izquierda (controles de movimiento)
- `right.png` - Flecha derecha (controles de movimiento)

### 🎬 Videos

- `bts-concert.mp4` - Video de concierto de BTS (usado en pantallas)
- `oncert.mp4` - Video alternativo de concierto

### 🔊 Audio (Estructura para futuros archivos)

- `ambient-stadium.mp3` - Sonido ambiente del estadio (no existe aún, pero estructura lista)

## Rutas de Carga

Todos los archivos se cargan desde la raíz del proyecto con el prefijo `/assets/`:

```javascript
// Ejemplo en BirthdayLobby.js
this.loadPixelTexture('/assets/mainCharacter-girl.png');
this.loadPixelTexture('/assets/door.png');

// Ejemplo en Stadium.js
this.video.src = '/assets/bts-concert.mp4';
```

## Notas de Mantenimiento

- **No mover archivos directamente**: Si necesitas mover o renombrar archivos aquí, actualiza todas las referencias en el código
- **Convención de nombres**: Usa guiones (`-`) para separar palabras en nombres de archivo
- **Optimización**: Todos los PNG usan filtro `NearestFilter` para mantener el estilo pixel-art
- **Archivos alternativos**: `oncert.mp4` es un archivo de respaldo que actualmente no se usa

## Archivos Referenciados

- **BirthdayLobby.js**: Usa la mayoría de imágenes PNG y controles
- **Stadium.js**: Usa bts-concert.mp4
- **ScreenStage.js**: Usa bts-concert.mp4
- **AudioContext.js**: Será usado con ambient-stadium.mp3 cuando se agregue
