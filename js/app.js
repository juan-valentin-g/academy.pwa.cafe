// Agrega aquí los nombres de las fotografías de la carpeta imagenes.
// Los iconos de imagenes/icons se reservan para la PWA.
const imagenes = [
    "imagen1.jpg",
    "imagen2.jpg",
    "imagen3.jpg",
    "imagen4.jpg",
    "imagen5.jpg",
    "imagen6.jpg",
    "imagen7.jpg",
    "imagen8.jpg",
    "imagen9.jpg",
    "imagen10.JPG",
];

const descripciones = {
    "imagen1.jpg": "Café negro rodeado de granos tostados.",
    "imagen2.jpg": "Granos de café en una taza naranja volcada.",
    "imagen3.jpg": "Granos tostados que desbordan una taza blanca.",
    "imagen4.jpg": "Frutos de café de distintos colores junto a hojas verdes.",
    "imagen5.jpg": "Cuatro tazas con arte latte sobre una mesa de madera.",
    "imagen6.jpg": "Ilustración de un café humeante sobre fondo rosa.",
    "imagen7.jpg": "Café espumoso junto a un molino tradicional.",
    "imagen8.jpg": "Cerezas rojas de café entre las hojas del cafeto.",
    "imagen9.jpg": "Arte latte servido en una taza sobre una bandeja de madera.",
    "imagen10.JPG": "Café negro con una cucharita sobre el plato.",
};

// Crea una card nueva que puede reutilizarse en cualquier contenedor.
function crearCard(archivo, indice) {
    const numero = String(indice + 1).padStart(2, "0");
    const card = document.createElement("figure");
    card.className = "card";

    const imagen = document.createElement("img");
    imagen.className = "card__image";
    if (indice < 3 || !("IntersectionObserver" in window)) {
        imagen.src = `imagenes/${archivo}`;
    } else {
        imagen.dataset.src = `imagenes/${archivo}`;
    }
    imagen.alt = `Fotografía de la colección de café ${numero}`;
    imagen.loading = indice < 3 ? "eager" : "lazy";
    imagen.decoding = "async";

    const caption = document.createElement("figcaption");
    caption.className = "card__caption";
    const titulo = document.createElement("span");
    titulo.className = "card__title";
    titulo.textContent = "Momento de café";
    const etiqueta = document.createElement("span");
    etiqueta.className = "card__number";
    etiqueta.textContent = numero;

    if (descripciones[archivo]) {
        titulo.textContent = descripciones[archivo];
        imagen.alt = descripciones[archivo];
    }

    caption.append(titulo, etiqueta);
    const verMas = document.createElement("a");
    verMas.className = "boton card__button";
    verMas.href = `detalle.html?cafe=${encodeURIComponent(archivo)}`;
    verMas.textContent = "Ver más";
    verMas.setAttribute("aria-label", `Ver más: ${titulo.textContent}`);
    card.append(imagen, caption, verMas);
    return card;
}

const galeria = document.querySelector("#galeria");
if (galeria) {
    galeria.replaceChildren(...imagenes.map(crearCard));
    if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(({ target, isIntersecting }) => {
                if (isIntersecting) {
                    target.src = target.dataset.src;
                    delete target.dataset.src;
                    observer.unobserve(target);
                }
            });
        }, { rootMargin: "100px" });
        galeria.querySelectorAll("img[data-src]").forEach((imagen) => observer.observe(imagen));
    }
}

const detalle = document.querySelector("#detalle");
async function mostrarDetalle() {
    const archivo = new URLSearchParams(window.location.search).get("cafe");
    const titulo = document.createElement("h2");
    titulo.className = "detalle__title";

    if (imagenes.includes(archivo)) {
        const imagen = document.createElement("img");
        imagen.className = "detalle__image";
        imagen.src = `imagenes/${archivo}`;
        imagen.alt = descripciones[archivo];

        const contenido = document.createElement("div");
        contenido.className = "detalle__content";
        titulo.textContent = "Cargando información…";
        contenido.append(titulo);
        detalle.replaceChildren(imagen, contenido);
        try {
            const response = await fetch(`data/cafes/${archivo.split(".")[0]}.json`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const cafe = await response.json();
            document.title = `${cafe.titulo} | Coffe PWA`;
            titulo.textContent = cafe.titulo;
            cafe.parrafos.forEach((texto) => {
                const parrafo = document.createElement("p");
                parrafo.textContent = texto;
                contenido.append(parrafo);
            });
        } catch {
            titulo.textContent = "Información no disponible";
            const mensaje = document.createElement("p");
            mensaje.textContent = "No se pudo cargar este café. Si aún no lo has consultado, necesitas conexión a internet.";
            const reintentar = document.createElement("button");
            reintentar.className = "boton";
            reintentar.textContent = "Reintentar";
            reintentar.addEventListener("click", mostrarDetalle);
            contenido.append(mensaje, reintentar);
        }
    } else {
        const contenido = document.createElement("div");
        contenido.className = "detalle__content";
        titulo.textContent = "Café no encontrado";
        const mensaje = document.createElement("p");
        mensaje.textContent = "Vuelve a la galería y selecciona una card para ver más información.";
        contenido.append(titulo, mensaje);
        detalle.append(contenido);
    }
}
if (detalle) mostrarDetalle();

// El script esta al final del HTML: no es necesario esperar a todas las imagenes.
if ("serviceWorker" in navigator) {
    // Una recarga al tomar el control permite guardar tambien la pagina inicial
    // y sus recursos, que se solicitaron antes de instalar el primer worker.
    let reloading = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!reloading) {
            reloading = true;
            window.location.reload();
        }
    });
    navigator.serviceWorker.register("./serviceworker.js", {
        scope: "./",
        updateViaCache: "none",
    }).catch((error) => {
        console.error("No se pudo registrar el service worker:", error);
    });
}

//Que es un archivo de manifiesto
//Para que se utiliza un service worker
