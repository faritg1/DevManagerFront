# Identidad visual

Complementa a `docs/ui-redesign.md` (paleta, tokens, superficies planas, modo oscuro). Aquí solo va la marca: el isotipo y los iconos del aplicativo.

## Concepto

Dos piezas iguales que se encuentran y cierran un espacio alrededor de un núcleo común: personas y áreas de una entidad solidaria que trabajan juntas sobre lo que comparten (un proyecto, un documento, un asociado).

El isotipo no tiene letras ni depende del nombre "DevManager", que va a cambiar.

## Construcción

Lienzo de 64 × 64 unidades (`viewBox="0 0 64 64"`). Fuente única de la geometría: `public/favicon.svg`, grupo `<g id="mark">`.

| Pieza | Trazado | Detalle |
|---|---|---|
| Escuadra superior izquierda | `M12 36V12h24` | Trazo de 10, extremos y uniones redondeados |
| Escuadra inferior derecha | `M52 28v24H28` | La misma escuadra girada 180° sobre el centro |
| Núcleo | Círculo en `32,32`, radio 6 | Relleno, sin trazo |

- El dibujo ocupa de 7 a 57 en ambos ejes (50 de 64 unidades); el margen de 7 unidades ya forma parte del lienzo.
- **Área de respeto:** alrededor del lienzo, deja libre como mínimo el ancho del trazo (10 unidades, el 16 % del lado). Junto al nombre del producto, la separación actual es de 12 px con el isotipo a 32 px.
- **Tamaño mínimo:** 16 px de lado. Por debajo, el núcleo y las aberturas se cierran.

## Colores

| Uso | Escuadras | Núcleo |
|---|---|---|
| Sobre fondo claro (`#ffffff`, `#f6f7f8`) | `primary-600` `#0b6fb8` | `primary` `#1392ec` |
| Sobre fondo oscuro (`#111b22`, `#192833`) | `primary` `#1392ec` | `primary-400` `#3aa3f0` |
| Sobre azul de marca (`#0b6fb8`), iconos del aplicativo | blanco `#ffffff` | blanco `#ffffff` |

Sin degradados, sombras ni contornos.

## En la interfaz

`src/shared/components/BrandMark.tsx` dibuja el isotipo en línea y cambia de color solo con el modo oscuro. Es decorativo (`aria-hidden`) cuando va junto al nombre; si va solo, pásale `title`.

```tsx
<BrandMark size={32} />
<BrandMark className="size-10 sm:size-12" />
```

Hoy lo usan el menú lateral (`src/widgets/Sidebar/Sidebar.tsx`, expandido y compacto) y las pantallas de recuperación de contraseña (`src/features/auth/pages/AuthCard.tsx`).

## Sí y no

| Sí | No |
|---|---|
| Usar `BrandMark` o los archivos de `public/` | Redibujarlo o copiar el SVG a mano en otra pantalla |
| Usar solo las tres combinaciones de color de arriba | Otros colores, degradados, sombras o contornos |
| Mantener la proporción y la orientación | Girarlo, estirarlo o separar las piezas |
| Dejar el área de respeto | Pegarle texto, insignias o bordes |
| Ponerlo junto al nombre del producto en texto | Meter letras o el nombre dentro del isotipo |

## Iconos del aplicativo

Todos viven en `public/`, que Vite copia tal cual a la raíz del sitio.

| Archivo | Tamaño | Fondo | Uso |
|---|---|---|---|
| `favicon.svg` | vectorial | transparente; se aclara con `prefers-color-scheme: dark` | Pestaña del navegador. **Es la fuente de los demás** |
| `favicon-32.png` | 32 × 32 | transparente | Navegadores sin favicon SVG |
| `apple-touch-icon.png` | 180 × 180 | `#0b6fb8` sólido, sin esquinas redondeadas (iOS las recorta) | Pantalla de inicio en iOS |
| `icon-192.png` | 192 × 192 | ficha `#0b6fb8` con esquinas redondeadas | Manifest, `purpose: any` |
| `icon-512.png` | 512 × 512 | ficha `#0b6fb8` con esquinas redondeadas | Manifest, `purpose: any` |
| `icon-maskable-512.png` | 512 × 512 | `#0b6fb8` a sangre; el dibujo queda dentro del 80 % central | Manifest, `purpose: maskable` |
| `manifest.webmanifest` | — | — | Nombre, colores e iconos de la app instalable |

`index.html` los enlaza con rutas desde la raíz (`/favicon.svg`); Vite les antepone `base` al compilar. Dentro del manifest las rutas son relativas al propio manifest. Así funcionan igual en desarrollo, en la raíz de un dominio y bajo una subruta.

`theme-color`: `#0b6fb8` en claro y `#111b22` en oscuro.

### Regenerar los PNG

Los PNG no se editan a mano. Después de cambiar `public/favicon.svg`:

```bash
node scripts/generate-icons.mjs
```

El script usa el Playwright del proyecto (el mismo de las pruebas e2e), no instala nada. Si Playwright no encuentra su navegador, usa el `chrome-headless-shell.exe` más reciente de `%LOCALAPPDATA%\ms-playwright`.

Si cambia la geometría, copia los mismos trazados a `BrandMark.tsx`: son las dos únicas copias.

## El día que cambie el nombre

El isotipo y los PNG no cambian. Hay que tocar:

1. `index.html`: `<title>` y `<meta name="description">`.
2. `public/manifest.webmanifest`: `name`, `short_name` y `description`.
3. El texto "DevManager" del menú lateral (`src/widgets/Sidebar/Sidebar.tsx`) y los textos de las pantallas de autenticación. Las pruebas e2e buscan ese nombre: se actualizan en el mismo cambio.
4. `package.json` (`name`), `metadata.json` y los documentos de `docs/` y la raíz que nombran el producto.
5. Este documento.
