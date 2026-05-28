# Especificación de Diseño: Spicy Wings - Pedidos por WhatsApp

Este documento detalla el diseño técnico y funcional para el sitio web de Spicy Wings, una página responsiva tipo catálogo con carrito de compras y redirección para pedidos a sucursales específicas vía WhatsApp.

## 1. Arquitectura de Carpetas y Tecnología
El proyecto se construirá utilizando tecnologías web nativas (Vanilla HTML5, CSS3 y JavaScript ES6) para garantizar velocidad de carga, ligereza y cero dependencias complejas.

### Estructura de Carpetas Propuesta
```
spicywings/
├── index.html          # Interfaz única responsiva
├── docs/               # Documentación técnica
│   └── superpowers/
│       └── specs/
│           └── 2026-05-27-spicywings-design.md # Este archivo
├── assets/             # Recursos estáticos
│   ├── images/         # Fotos de los productos
│   └── icons/          # Iconografía (WhatsApp, carrito, etc.)
├── css/                # Estilos ordenados y reutilizables
│   ├── variables.css   # Paleta de colores, tipografías y tokens de diseño
│   ├── main.css        # Reset, layout base y clases de utilidad
│   ├── components/     # Estilos aislados por componente
│   │   ├── menu.css    # Diseño de la carta de alitas y guarniciones
│   │   ├── cart.css    # Sidebar del carrito
│   │   └── modal.css   # Diálogos emergentes (sucursales, checkout)
│   └── responsive.css  # Ajustes de media queries
└── js/                 # Lógica modular basada en ES6 Modules
    ├── main.js         # Orquestación global y carga inicial
    ├── cart.js         # Lógica del carrito de compras (estado en memoria)
    ├── branches.js     # Datos y cambio de las 3 sucursales
    └── whatsapp.js     # Construcción y codificación de pedidos en mensaje de WhatsApp
```

---

## 2. Sistema de Diseño Visual (Dark Kitchen)
Para lograr un aspecto estético premium y moderno, se implementará una paleta de colores oscura, contrastando con acentos vibrantes que despierten el apetito.

### Variables CSS (`css/variables.css`)
* **Fondo Principal**: Negro puro (`#0c0c0c`) y grises carbón (`#1a1a1a`, `#262626`).
* **Colores de Acento**: Naranja fuego (`#ff6b00`) y Rojo picante (`#e63946`) para botones interactivos, insignias de picante y precios.
* **Tipografía**:
  * Títulos: "Outfit" o "Lexend" (vía Google Fonts) para un estilo moderno y audaz.
  * Cuerpo: "Inter" o "Outfit" para excelente legibilidad en dispositivos móviles.

---

## 3. Flujo de Pedidos y Componentes de Usuario

### 3.1 Carga Inicial y Selección de Sucursal
* Al cargar la página por primera vez, un modal emergente bloqueará la navegación principal, solicitando al usuario seleccionar su sucursal de preferencia:
  1. **Sucursal Norte**
  2. **Sucursal Centro**
  3. **Sucursal Sur**
* Cada sucursal cuenta con su dirección física de recogida y un número telefónico de WhatsApp asignado.
* Una vez seleccionada, se almacena en `localStorage` para recordar la preferencia del usuario en futuras visitas y se actualiza el banner del encabezado que muestra el número e indicaciones de recogida activos.

### 3.2 Menú y Catálogo interactivo (HTML Estático)
* Los productos se estructuran directamente en el HTML de forma semántica.
* Se usarán atributos `data-*` para transferir de manera directa la información del producto a la lógica del carrito:
  ```html
  <div class="product-card" data-id="combo-alitas-1" data-name="Combo Alitas Personal" data-price="149.00">
      <!-- Info e imagen -->
      <select class="sauce-selector">
          <option value="BBQ">BBQ</option>
          <option value="Buffalo">Buffalo</option>
          <option value="Mango Habanero">Mango Habanero</option>
      </select>
      <button class="add-to-cart-btn">Agregar al Carrito</button>
  </div>
  ```

### 3.3 Carrito de Compras (JS en Memoria)
* El estado del carrito se mantiene en memoria durante la sesión del usuario.
* Al presionar "Agregar al Carrito", el script `js/cart.js` lee los atributos del producto y la salsa seleccionada para añadir el elemento.
* Si el elemento con la misma salsa ya existe, incrementa la cantidad.
* Un panel lateral (`sidebar`) permite ver el desglose, modificar cantidades (+ / -), eliminar productos y muestra la suma total.

### 3.4 Proceso de Confirmación y Envío a WhatsApp
* Al hacer clic en "Confirmar pedido" dentro del carrito, se despliega el modal de checkout para captar:
  * **Nombre**: Nombre del cliente.
  * **Tipo de pedido**: "Para Recoger" o "Envío a Domicilio".
  * **Detalle de entrega**: Dirección en caso de entrega a domicilio.
* Al enviar, se ejecuta el módulo `js/whatsapp.js` el cual:
  1. Obtiene el teléfono de la sucursal activa.
  2. Formatea el pedido con emojis, tabuladores y saltos de línea para lograr un texto limpio y legible.
  3. Codifica el texto utilizando `encodeURIComponent`.
  4. Redirige al usuario a `https://wa.me/[Teléfono]?text=[MensajeCodificado]`.

---

## 4. Plan de Verificación

### Pruebas Manuales
1. **Selección y cambio de sucursal**: Validar que el modal se muestre, guarde la selección en `localStorage`, actualice el número de WhatsApp activo y la dirección en el header.
2. **Carrito de compras**:
   * Agregar productos con diferentes salsas y verificar que se traten como ítems separados.
   * Incrementar, decrementar y eliminar ítems, corroborando que el total de la compra cambie dinámicamente.
3. **Redirección de WhatsApp**:
   * Simular la compra con datos ficticios.
   * Verificar que la URL generada contenga el formato estético esperado y que apunte al número de la sucursal elegida.
