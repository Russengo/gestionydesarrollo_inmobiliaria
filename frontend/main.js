
document.addEventListener('DOMContentLoaded', function() {

    // ==========================================
    // CONFIGURACION GENERAL
    // ==========================================

    const supabase = window.supabaseClient;

    // ==========================================
    // NAVBAR
    // ==========================================

    const navbar = document.getElementById('mainNav');

    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                navbar.style.backgroundColor = 'rgba(23, 23, 40, 1)';
                navbar.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
            } else {
                navbar.style.backgroundColor = 'rgba(23, 23, 40, 0.85)';
                navbar.style.boxShadow = 'none';
            }
        });
    }

    // ==========================================
    // MENU RESPONSIVE
    // ==========================================

    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    const menuToggle = document.getElementById('navbarNav');

    if (menuToggle && typeof bootstrap !== 'undefined') {
        const bsCollapse = new bootstrap.Collapse(menuToggle, {
            toggle: false
        });

        navLinks.forEach(function(link) {
            link.addEventListener('click', function() {
                if (menuToggle.classList.contains('show')) {
                    bsCollapse.toggle();
                }
            });
        });
    }

    // ==========================================
    // SCROLL SUAVE
    // ==========================================

    document.querySelectorAll('a[href^="#"], a[href^="index.html#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href').replace('index.html', '');

            if (targetId.startsWith('#')) {
                const target = document.querySelector(targetId);

                if (target) {
                    e.preventDefault();

                    target.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // ==========================================
    // UTILIDADES
    // ==========================================

    function escapar(valor) {
        return String(valor ?? '').replace(/[&<>"']/g, function(caracter) {
            const entidades = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            };

            return entidades[caracter];
        });
    }

    function obtenerImagenes(propiedad) {
        let imagenes = propiedad.image_urls;

        if (typeof imagenes === 'string') {
            try {
                imagenes = JSON.parse(imagenes);
            } catch {
                imagenes = [imagenes];
            }
        }

        if (!Array.isArray(imagenes)) {
            return [];
        }

        return imagenes
            .map(imagen => {
                if (typeof imagen === 'string') {
                    return imagen;
                }

                if (imagen && typeof imagen.url === 'string') {
                    return imagen.url;
                }

                return null;
            })
            .filter(url => {
                return typeof url === 'string' &&
                    /^(https?:\/\/|\/)/i.test(url);
            });
    }

    function formatearPrecio(propiedad) {
        if (propiedad.price === null || propiedad.price === undefined || propiedad.price === '') {
            return 'Consultar precio';
        }

        const moneda = propiedad.currency || 'ARS';

        try {
            return new Intl.NumberFormat('es-AR', {
                style: 'currency',
                currency: moneda,
                maximumFractionDigits: 0
            }).format(Number(propiedad.price));
        } catch {
            return escapar(moneda) + ' ' + escapar(propiedad.price);
        }
    }

    function obtenerUbicacion(propiedad) {
        return [
            propiedad.address,
            propiedad.city,
            propiedad.province
        ].filter(Boolean).join(', ');
    }

    function obtenerSuperficie(propiedad) {
        const superficie = propiedad.covered_area || propiedad.total_area;

        return superficie ? escapar(superficie) + ' m²' : null;
    }

    function obtenerAmbientes(propiedad) {
        const ambientes = propiedad.rooms || propiedad.bedrooms;

        return ambientes ? escapar(ambientes) + ' amb.' : null;
    }

    function obtenerOperacion(operacion) {
        if (operacion === 'Ambas') {
            return 'Venta / Alquiler';
        }

        return operacion || 'Consultar';
    }

    // ==========================================
    // GALERIA DE IMAGENES
    // ==========================================

    function crearGaleria(imagenes, titulo) {
        if (!imagenes.length) {
            return `
                <div class="w-100 property-img d-flex align-items-center justify-content-center bg-light">
                    <i class="bi bi-house-door text-secondary" style="font-size: 4rem;"></i>
                </div>
            `;
        }

        const variasImagenes = imagenes.length > 1;

        return `
            <div class="property-gallery position-relative"
                data-images="${escapar(JSON.stringify(imagenes))}"
                data-index="0">

                <img
                    src="${escapar(imagenes[0])}"
                    alt="${titulo}"
                    class="w-100 property-img gallery-image"
                    loading="lazy"
                >

                ${variasImagenes ? `
                    <button
                        type="button"
                        class="gallery-arrow gallery-prev"
                        data-gallery="prev"
                        aria-label="Fotografía anterior">
                        <i class="bi bi-chevron-left"></i>
                    </button>

                    <button
                        type="button"
                        class="gallery-arrow gallery-next"
                        data-gallery="next"
                        aria-label="Fotografía siguiente">
                        <i class="bi bi-chevron-right"></i>
                    </button>

                    <span class="gallery-counter">
                        1 / ${imagenes.length}
                    </span>
                ` : ''}
            </div>
        `;
    }

    function moverGaleria(galeria, direccion) {
        if (!galeria) return;

        let imagenes;

        try {
            imagenes = JSON.parse(galeria.dataset.images || '[]');
        } catch {
            return;
        }

        if (imagenes.length < 2) return;

        let indice = Number(galeria.dataset.index || 0);

        if (direccion === 'next') {
            indice = (indice + 1) % imagenes.length;
        } else {
            indice = (indice - 1 + imagenes.length) % imagenes.length;
        }

        galeria.dataset.index = indice;

        const imagen = galeria.querySelector('.gallery-image');
        const contador = galeria.querySelector('.gallery-counter');

        imagen.src = imagenes[indice];
        contador.textContent = `${indice + 1} / ${imagenes.length}`;
    }

    // Flechas de navegación
    document.addEventListener('click', function(event) {
        const boton = event.target.closest('[data-gallery]');

        if (!boton) return;

        event.preventDefault();
        event.stopPropagation();

        const galeria = boton.closest('.property-gallery');

        moverGaleria(galeria, boton.dataset.gallery);
    });

    // Deslizamiento táctil en celulares
    document.addEventListener('pointerdown', function(event) {
        if (event.pointerType !== 'touch') return;

        const galeria = event.target.closest('.property-gallery');

        if (galeria) {
            galeria.dataset.touchStartX = event.clientX;
        }
    });

    document.addEventListener('pointerup', function(event) {
        if (event.pointerType !== 'touch') return;

        const galeria = event.target.closest('.property-gallery');

        if (!galeria || galeria.dataset.touchStartX === undefined) return;

        const inicio = Number(galeria.dataset.touchStartX);
        const diferencia = event.clientX - inicio;

        delete galeria.dataset.touchStartX;

        if (Math.abs(diferencia) < 40) return;

        moverGaleria(
            galeria,
            diferencia < 0 ? 'next' : 'prev'
        );
    });

    // ==========================================
    // TARJETA DE PROPIEDAD
    // ==========================================

    function crearTarjeta(propiedad) {
        const imagenes = obtenerImagenes(propiedad);

        const titulo = escapar(propiedad.title || 'Propiedad sin título');
        const ubicacion = escapar(obtenerUbicacion(propiedad) || 'Ubicación a consultar');
        const operacion = escapar(obtenerOperacion(propiedad.operation));

        const badgeClass = propiedad.operation === 'Alquiler'
            ? 'bg-dark-blue'
            : 'bg-gold';

        const ambientes = obtenerAmbientes(propiedad);
        const banos = propiedad.bathrooms
            ? escapar(propiedad.bathrooms) + ' baños'
            : null;
        const superficie = obtenerSuperficie(propiedad);

        const detalles = [ambientes, banos, superficie]
            .filter(Boolean);

        const imagenHTML = crearGaleria(imagenes, titulo);

        const contacto = document.getElementById('contenedor-destacadas')
            ? '#contacto'
            : 'index.html#contacto';

        return `
            <div class="col-lg-3 col-md-6">
                <div class="property-card bg-white rounded-4 overflow-hidden h-100 border-0 shadow-sm">
                    <div class="position-relative">
                        ${imagenHTML}

                        <span class="badge ${badgeClass} position-absolute top-0 start-0 m-3 px-3 py-2 rounded-pill">
                            ${operacion}
                        </span>
                    </div>

                    <div class="p-3">
                        <h5 class="serif-font fw-bold mb-1">${titulo}</h5>

                        <p class="text-muted small mb-3">
                            <i class="bi bi-geo-alt-fill text-gold me-1"></i>
                            ${ubicacion}
                        </p>

                        <div class="d-flex justify-content-between flex-wrap gap-2 text-muted small mb-3 pb-3 border-bottom">
                            ${detalles.length
                                ? detalles.map(detalle => `<span>${detalle}</span>`).join('')
                                : '<span>Consultar características</span>'
                            }
                        </div>

                        <div class="d-flex justify-content-between align-items-center">
                            <span class="text-primary-gold fw-bold">
                                ${formatearPrecio(propiedad)}
                            </span>

                            <a href="${contacto}" class="text-dark fw-medium text-decoration-none small">
                                Consultar
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // ==========================================
    // MENSAJES DEL CATALOGO
    // ==========================================

    function mostrarMensaje(contenedor, titulo, descripcion) {
        contenedor.innerHTML = `
            <div class="col-12">
                <div class="text-center py-5">
                    <i class="bi bi-house-door fs-1 text-primary-gold"></i>
                    <h4 class="mt-3">${escapar(titulo)}</h4>
                    <p class="text-muted">${escapar(descripcion)}</p>
                </div>
            </div>
        `;
    }

    // ==========================================
    // CARGAR PROPIEDADES DESDE SUPABASE
    // ==========================================

    async function cargarPropiedades() {
        const destacadas = document.getElementById('contenedor-destacadas');
        const catalogo = document.getElementById('contenedor-propiedades');

        if (!destacadas && !catalogo) {
            return;
        }

        if (!supabase) {
            if (destacadas) {
                mostrarMensaje(destacadas, 'No se pudo conectar', 'No encontramos la conexión con Supabase.');
            }

            if (catalogo) {
                mostrarMensaje(catalogo, 'No se pudo conectar', 'No encontramos la conexión con Supabase.');
            }

            console.error('No se encontró window.supabaseClient.');
            return;
        }

        const { data, error } = await supabase
            .from('properties')
            .select('*')
            .eq('status', 'Disponible')
            .is('archived_at', null)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error al cargar propiedades:', error);

            if (destacadas) {
                mostrarMensaje(destacadas, 'Error al cargar propiedades', 'Intentá nuevamente más tarde.');
            }

            if (catalogo) {
                mostrarMensaje(catalogo, 'Error al cargar propiedades', 'Intentá nuevamente más tarde.');
            }

            return;
        }

        const propiedades = data || [];

        // PORTADA: mostrar las últimas 4 propiedades

        if (destacadas) {
            const ultimas = propiedades.slice(0, 4);

            if (ultimas.length === 0) {
                mostrarMensaje(destacadas, 'Todavía no hay propiedades disponibles', 'Próximamente publicaremos nuevas propiedades.');
            } else {
                destacadas.innerHTML = ultimas.map(crearTarjeta).join('');
            }
        }

        // CATALOGO: mostrar todas las propiedades

        if (catalogo) {
            if (propiedades.length === 0) {
                mostrarMensaje(catalogo, 'Todavía no hay propiedades disponibles', 'Próximamente publicaremos nuevas propiedades.');
                return;
            }

            let filtroActual = 'all';

            function renderizarCatalogo() {
                const filtradas = propiedades.filter(propiedad => {
                    if (filtroActual === 'all') {
                        return true;
                    }

                    return propiedad.operation === filtroActual ||
                        propiedad.operation === 'Ambas';
                });

                if (filtradas.length === 0) {
                    mostrarMensaje(catalogo, 'No hay propiedades en esta categoría', 'Probá seleccionando otro filtro.');
                    return;
                }

                catalogo.innerHTML = filtradas.map(crearTarjeta).join('');
            }

            const botones = document.querySelectorAll('.filter-btn');

            botones.forEach(boton => {
                boton.addEventListener('click', function() {
                    filtroActual = this.dataset.filter;

                    botones.forEach(btn => {
                        btn.classList.remove('active', 'btn-gold');
                        btn.classList.add('btn-outline-dark');
                    });

                    this.classList.add('active', 'btn-gold');
                    this.classList.remove('btn-outline-dark');

                    renderizarCatalogo();
                });
            });

            renderizarCatalogo();
        }
    }

    cargarPropiedades();

});
