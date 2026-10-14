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

// Información adicional de cada fotografía de la colección.
const detalles = {
    "imagen1.jpg": {
        titulo: "Café negro",
        parrafos: [
            "El café negro se sirve sin leche y permite apreciar el aroma y el sabor de los granos tostados. Su intensidad depende de la cantidad de café, la molienda y el método de preparación.",
            "Puede prepararse con filtro o prensa francesa, entre otros métodos. Moler los granos poco antes de prepararlo ayuda a disfrutar mejor sus aromas."
        ]
    },
    "imagen2.jpg": {
        titulo: "Granos de café tostados",
        parrafos: [
            "Los granos de café son las semillas del fruto del cafeto. Durante el tueste desarrollan su color marrón y los aromas que asociamos con una taza de café.",
            "Para conservar su aroma, guarda los granos en un recipiente hermético, lejos de la luz, el calor y la humedad. Muele solamente la cantidad que vayas a utilizar."
        ]
    },
    "imagen3.jpg": {
        titulo: "Del grano a la taza",
        parrafos: [
            "El tueste transforma los granos y cambia su perfil de sabor. Los tuestes más claros suelen resaltar la acidez, mientras que los más oscuros tienden a mostrar sabores tostados más marcados.",
            "La molienda también influye en el resultado: una prensa francesa suele utilizar una molienda gruesa y un espresso requiere una más fina. Ajustarla al método ayuda a obtener una taza equilibrada."
        ]
    },
    "imagen4.jpg": {
        titulo: "El fruto del café",
        parrafos: [
            "El café crece dentro de un fruto conocido como cereza de café. Sus colores cambian durante la maduración: empieza verde y, según la variedad, puede alcanzar tonos rojos o amarillos al madurar.",
            "Después de la cosecha, los frutos se procesan para obtener las semillas. Estas se secan y preparan antes del tueste que dará lugar a los granos utilizados para elaborar la bebida."
        ]
    },
    "imagen5.jpg": {
        titulo: "Café con arte latte",
        parrafos: [
            "El arte latte consiste en crear dibujos al verter leche texturizada sobre un espresso. Los corazones y las hojas son algunos de los diseños más conocidos.",
            "Para formar estos dibujos se utiliza leche con una espuma fina y uniforme. El movimiento de la jarra y la forma de verterla permiten dibujar sobre la superficie del café."
        ]
    },
    "imagen6.jpg": {
        titulo: "Una pausa para el café",
        parrafos: [
            "Esta ilustración representa una taza de café humeante, una imagen asociada con las pausas y los momentos de conversación. El aroma es parte de la experiencia de disfrutar una taza recién preparada.",
            "Puedes disfrutar el café solo o con leche, de acuerdo con tus gustos. Elegir tu taza favorita y dedicar unos minutos a saborearlo convierte su preparación en un pequeño ritual."
        ]
    },
    "imagen7.jpg": {
        titulo: "Café y molienda tradicional",
        parrafos: [
            "La fotografía reúne un café espumoso y un molino tradicional. El molino permite transformar los granos tostados en partículas que el agua puede atravesar para extraer sabor y aroma.",
            "Moler el café justo antes de prepararlo ayuda a conservar sus aromas. El tamaño de la molienda debe ajustarse al método elegido y al tiempo de contacto con el agua."
        ]
    },
    "imagen8.jpg": {
        titulo: "Cerezas en el cafeto",
        parrafos: [
            "El cafeto es la planta que produce las cerezas de café. En la imagen se observan frutos rojos entre sus hojas; dentro de cada fruto normalmente se encuentran dos semillas.",
            "La recolección de frutos maduros es un paso importante para la calidad del café. Después de cosecharlos, el procesamiento y el secado preparan las semillas para las siguientes etapas."
        ]
    },
    "imagen9.jpg": {
        titulo: "El detalle del arte latte",
        parrafos: [
            "En esta taza, el contraste entre el café y la leche forma un dibujo sobre la superficie. La base habitual del arte latte es un espresso al que se añade leche texturizada.",
            "La textura de la leche influye tanto en el dibujo como en la sensación al beber. Una microespuma uniforme se integra con el café y aporta una consistencia suave."
        ]
    },
    "imagen10.JPG": {
        titulo: "Una taza de café negro",
        parrafos: [
            "Servir el café sin leche permite explorar su sabor tal como resulta de la preparación. Cada taza puede variar según el origen de los granos, el tueste y la proporción de agua y café.",
            "Prueba pequeños sorbos mientras la bebida se enfría un poco para apreciar cómo cambia su sabor. Si prefieres endulzarlo, puedes ajustar la cantidad a tu gusto."
        ]
    }
};

// Crea una card nueva que puede reutilizarse en cualquier contenedor.
function crearCard(archivo, indice) {
    const numero = String(indice + 1).padStart(2, "0");
    const card = document.createElement("figure");
    card.className = "card";

    const imagen = document.createElement("img");
    imagen.className = "card__image";
    imagen.src = `imagenes/${archivo}`;
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
}

const detalle = document.querySelector("#detalle");
if (detalle) {
    const archivo = new URLSearchParams(window.location.search).get("cafe");
    const titulo = document.createElement("h2");
    titulo.className = "detalle__title";

    if (imagenes.includes(archivo)) {
        const cafe = detalles[archivo];
        document.title = `${cafe.titulo} | Coffe PWA`;
        const imagen = document.createElement("img");
        imagen.className = "detalle__image";
        imagen.src = `imagenes/${archivo}`;
        imagen.alt = descripciones[archivo];

        const contenido = document.createElement("div");
        contenido.className = "detalle__content";
        titulo.textContent = cafe.titulo;
        contenido.append(titulo);
        cafe.parrafos.forEach((texto) => {
            const parrafo = document.createElement("p");
            parrafo.textContent = texto;
            contenido.append(parrafo);
        });
        detalle.append(imagen, contenido);
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

// El script esta al final del HTML: no es necesario esperar a todas las imagenes.
if ("serviceWorker" in navigator) {
    // Al activar una actualizacion, vuelve a cargar la pagina desde la nueva cache.
    // La primera instalacion no necesita recargar.
    const wasControlled = Boolean(navigator.serviceWorker.controller);
    let reloading = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (wasControlled && !reloading) {
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
