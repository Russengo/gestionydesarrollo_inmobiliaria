
// ---- inicio de admin.js ----

document.addEventListener('DOMContentLoaded', function () {

    // ==========================================
    // 1. REFERENCIAS A LOS ELEMENTOS
    // ==========================================

    const logoutButton = document.getElementById('logoutButton');
    const accountEmail = document.getElementById('accountEmail');
    const moduleContent = document.getElementById('moduleContent');
    const sidebar = document.getElementById('sidebar');
    const breadcrumb = document.getElementById('breadcrumb');
    const mobileMenuButton = document.getElementById('mobileMenuButton');

    let redirigiendoAlLogin = false;


    // ==========================================
    // 2. DEFINICIÓN DE LOS MÓDULOS
    // ==========================================

    const modules = {

        inicio: {
            title: 'Panel de Gestión',
            subtitle: 'Resumen general de la actividad inmobiliaria.',
            render: renderInicio
        },

        propiedades: {
            title: 'Propiedades',
            subtitle: 'Administrá inmuebles, publicaciones y disponibilidad.',
            icon: 'bi-houses',
            description: 'Acá vas a poder registrar propiedades, cargar imágenes, asignar propietarios, administrar precios y cambiar su estado.',
            render: renderPlaceholder
        },

        personas: {
            title: 'Personas y clientes',
            subtitle: 'Directorio unificado de propietarios, inquilinos y clientes.',
            icon: 'bi-people',
            description: 'Acá vas a poder administrar fichas de personas, datos de contacto, roles, documentos y relaciones con propiedades y contratos.',
            render: renderPlaceholder
        },

        visitas: {
            title: 'Visitas y agenda',
            subtitle: 'Organizá las visitas y el seguimiento comercial.',
            icon: 'bi-calendar-week',
            description: 'Acá vas a poder coordinar fechas, agentes, clientes y propiedades, y registrar el resultado de cada visita.',
            render: renderPlaceholder
        },

        contratos: {
            title: 'Contratos',
            subtitle: 'Administrá alquileres, reservas y operaciones de venta.',
            icon: 'bi-file-earmark-text',
            description: 'Acá vas a poder vincular propiedades, inquilinos, garantes y propietarios, además de controlar vencimientos y estados.',
            render: renderPlaceholder
        },

        finanzas: {
            title: 'Finanzas y cobros',
            subtitle: 'Controlá pagos, gastos, comisiones y liquidaciones.',
            icon: 'bi-cash-stack',
            description: 'Acá vas a poder registrar cobros parciales o totales, cuotas, deudas, gastos de propiedades y movimientos de caja.',
            render: renderPlaceholder
        },

        auditoria: {
            title: 'Auditoría',
            subtitle: 'Historial de acciones realizadas en el sistema.',
            icon: 'bi-clock-history',
            description: 'Acá vas a poder consultar quién realizó cada cambio, cuándo lo hizo y qué información fue modificada.',
            render: renderPlaceholder
        }

    };


    // ==========================================
    // 3. VERIFICACIÓN DE LA SESIÓN
    // ==========================================

    async function comprobarSesion() {

        try {

            const { data, error } =
                await supabaseClient.auth.getSession();

            if (error) {
                console.error(
                    'Error al comprobar la sesión:',
                    error
                );

                redirigirAlLogin();
                return;
            }

            if (!data.session) {
                redirigirAlLogin();
                return;
            }

            accountEmail.textContent =
                data.session.user.email || 'Sesión activa';

            mostrarModulo('inicio');

        } catch (error) {

            console.error(
                'Error inesperado al comprobar la sesión:',
                error
            );

            redirigirAlLogin();

        }

    }


    function redirigirAlLogin() {

        if (redirigiendoAlLogin) return;

        redirigiendoAlLogin = true;
        window.location.replace('login.html');

    }


    // ==========================================
    // 4. PANTALLA DE INICIO
    // ==========================================

    function renderInicio() {

        return `
            <div class="page-header">

                <div>
                    <h1 class="page-title serif-font">
                        Panel de Gestión
                    </h1>

                    <p class="muted-text mb-0">
                        Bienvenido al sistema de gestión de Siandra.
                    </p>
                </div>

                <span class="status-note">
                    <i class="bi bi-shield-check"></i>
                    Sesión autenticada
                </span>

            </div>


            <div class="row g-3 mb-4">

                ${statCard(
                    'bi-houses',
                    'Propiedades registradas',
                    '—'
                )}

                ${statCard(
                    'bi-file-earmark-check',
                    'Contratos activos',
                    '—'
                )}

                ${statCard(
                    'bi-calendar-check',
                    'Visitas pendientes',
                    '—'
                )}

                ${statCard(
                    'bi-cash-stack',
                    'Comisiones del mes',
                    '—'
                )}

            </div>


            <div class="row g-4">

                <div class="col-12 col-xl-7">

                    <div class="admin-card p-4 h-100">

                        <h2 class="section-heading mb-3">
                            Accesos rápidos
                        </h2>

                        <p class="muted-text mb-4">
                            Elegí un módulo para comenzar a trabajar.
                        </p>

                        <div class="row g-3">

                            ${quickLink(
                                'propiedades',
                                'bi-houses',
                                'Propiedades'
                            )}

                            ${quickLink(
                                'personas',
                                'bi-people',
                                'Personas y clientes'
                            )}

                            ${quickLink(
                                'visitas',
                                'bi-calendar-week',
                                'Agenda de visitas'
                            )}

                            ${quickLink(
                                'contratos',
                                'bi-file-earmark-text',
                                'Contratos'
                            )}

                        </div>

                    </div>

                </div>


                <div class="col-12 col-xl-5">

                    <div class="admin-card p-4 h-100">

                        <h2 class="section-heading mb-3">
                            Estado del sistema
                        </h2>


                        <div class="d-flex align-items-start gap-3 mb-3">

                            <i class="bi bi-check-circle-fill text-success fs-5"></i>

                            <div>
                                <div class="fw-semibold">
                                    Autenticación
                                </div>

                                <div class="muted-text">
                                    Sesión de Supabase verificada.
                                </div>
                            </div>

                        </div>


                        <div class="d-flex align-items-start gap-3 mb-3">

                            <i class="bi bi-hourglass-split text-warning fs-5"></i>

                            <div>
                                <div class="fw-semibold">
                                    Módulos de gestión
                                </div>

                                <div class="muted-text">
                                    Pendientes de conexión con la base de datos.
                                </div>
                            </div>

                        </div>


                        <div class="d-flex align-items-start gap-3">

                            <i class="bi bi-shield-lock text-secondary fs-5"></i>

                            <div>
                                <div class="fw-semibold">
                                    Roles y permisos
                                </div>

                                <div class="muted-text">
                                    Deben configurarse en la base de datos antes de habilitar operaciones.
                                </div>
                            </div>

                        </div>

                    </div>

                </div>

            </div>
        `;

    }


    // ==========================================
    // 5. TARJETAS DE INDICADORES
    // ==========================================

    function statCard(icon, label, value) {

        return `
            <div class="col-12 col-sm-6 col-xl-3">

                <div class="admin-card stat-card">

                    <div class="stat-icon">
                        <i class="bi ${icon}"></i>
                    </div>

                    <div class="stat-value">
                        ${value}
                    </div>

                    <div class="stat-label">
                        ${label}
                    </div>

                </div>

            </div>
        `;

    }


    // ==========================================
    // 6. ACCESOS RÁPIDOS
    // ==========================================

    function quickLink(module, icon, label) {

        return `
            <div class="col-12 col-sm-6">

                <button
                    type="button"
                    class="btn btn-light border w-100 text-start p-3 quick-link"
                    data-open-module="${module}"
                >

                    <i class="bi ${icon} me-2 text-warning"></i>

                    ${label}

                    <i class="bi bi-arrow-right float-end"></i>

                </button>

            </div>
        `;

    }


    // ==========================================
    // 7. CONTENIDO DE LOS MÓDULOS
    // ==========================================

    function renderPlaceholder(module) {

        return `
            <div class="page-header">

                <div>
                    <h1 class="page-title serif-font">
                        ${module.title}
                    </h1>

                    <p class="muted-text mb-0">
                        ${module.subtitle}
                    </p>
                </div>

            </div>


            <div class="admin-card module-placeholder">

                <div class="empty-icon">
                    <i class="bi ${module.icon}"></i>
                </div>

                <h2 class="section-heading mb-3">
                    Módulo preparado
                </h2>

                <p
                    class="muted-text mx-auto mb-4"
                    style="max-width: 570px;"
                >
                    ${module.description}
                </p>

                <span class="status-note">
                    <i class="bi bi-hourglass-split"></i>
                    Pendiente de conexión con Supabase
                </span>

            </div>
        `;

    }


    // ==========================================
    // 8. NAVEGACIÓN ENTRE MÓDULOS
    // ==========================================

    function mostrarModulo(moduleKey) {

        const module = modules[moduleKey];

        if (!module) return;

        // Actualizar el botón seleccionado.

        document.querySelectorAll('.nav-module').forEach(button => {

            button.classList.toggle(
                'active',
                button.dataset.module === moduleKey
            );

        });


        // Actualizar la ruta superior.

        breadcrumb.textContent = module.title;


        // Renderizar el contenido.

        moduleContent.innerHTML = module.render(module);


        // Cerrar el menú móvil al seleccionar un módulo.

        sidebar.classList.remove('show');

        mobileMenuButton.setAttribute('aria-expanded', 'false');


        // Activar los accesos rápidos.

        moduleContent
            .querySelectorAll('[data-open-module]')
            .forEach(button => {

                button.addEventListener('click', function () {

                    mostrarModulo(this.dataset.openModule);

                });

            });

    }


    // ==========================================
    // 9. EVENTOS DEL MENÚ LATERAL
    // ==========================================

    document.querySelectorAll('.nav-module').forEach(button => {

        button.addEventListener('click', function () {

            mostrarModulo(this.dataset.module);

        });

    });


    // ==========================================
    // 10. MENÚ PARA CELULARES
    // ==========================================

    if (mobileMenuButton) {

        mobileMenuButton.addEventListener('click', function () {

            const abierto = sidebar.classList.toggle('show');

            mobileMenuButton.setAttribute(
                'aria-expanded',
                String(abierto)
            );

        });

    }


    // ==========================================
    // 11. CERRAR SESIÓN
    // ==========================================

    logoutButton.addEventListener('click', async function () {

        logoutButton.disabled = true;

        logoutButton.innerHTML =
            '<span class="spinner-border spinner-border-sm me-1"></span> Cerrando...';

        try {

            const { error } =
                await supabaseClient.auth.signOut({
                    scope: 'local'
                });

            if (error) {
                throw error;
            }

            redirigirAlLogin();

        } catch (error) {

            console.error(
                'Error al cerrar sesión:',
                error
            );

            logoutButton.disabled = false;

            logoutButton.innerHTML =
                '<i class="bi bi-box-arrow-right me-1"></i>' +
                '<span class="d-none d-sm-inline">Cerrar sesión</span>' +
                '<span class="d-sm-none">Salir</span>';

            alert(
                'No se pudo cerrar la sesión. Intentá nuevamente.'
            );

        }

    });


    // ==========================================
    // 12. DETECTAR CIERRE DE SESIÓN
    // ==========================================

    supabaseClient.auth.onAuthStateChange(function (event, session) {

        if (event === 'SIGNED_OUT' || !session) {
            redirigirAlLogin();
        }

    });


    // ==========================================
    // 13. INICIAR EL PANEL
    // ==========================================

    comprobarSesion();

});

// ---- fin de admin.js ----
