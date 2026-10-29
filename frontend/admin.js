
document.addEventListener('DOMContentLoaded', iniciarPanel);

async function iniciarPanel() {
    const db = window.supabaseClient;
    const contenido = document.getElementById('moduleContent');
    const sidebar = document.getElementById('sidebar');
    const breadcrumb = document.getElementById('breadcrumb');
    const accountEmail = document.getElementById('accountEmail');

    if (!db || !contenido) {
        console.error('No se encontró Supabase o el contenedor del panel.');
        return;
    }

    let usuario = null;
    let perfil = null;

    const nombres = {
        inicio: 'Inicio',
        propiedades: 'Propiedades',
        personas: 'Personas y clientes',
        visitas: 'Visitas y agenda',
        contratos: 'Contratos',
        finanzas: 'Finanzas y cobros',
        auditoria: 'Auditoría'
    };

    window.Siandra = {
        db,
        contenido,

        usuario: () => usuario,
        perfil: () => perfil,
        esAdmin: () => perfil?.role === 'admin',

        escapar(texto) {
            return String(texto ?? '').replace(/[&<>"']/g, caracter => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            })[caracter]);
        },

        mensaje(texto, tipo = 'success') {
            const alerta = document.createElement('div');
            alerta.className = `alert alert-${tipo} mt-3`;
            alerta.textContent = texto;
            contenido.prepend(alerta);
        },

        irA: mostrarModulo
    };

    async function cargarScript(archivo) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = archivo;

            script.onload = resolve;
            script.onerror = () => reject(
                new Error(`No se pudo cargar ${archivo}`)
            );

            document.body.appendChild(script);
        });
    }

    function renderInicio() {
        const nombre = perfil?.full_name || usuario?.email || 'usuario';
        const esAdmin = window.Siandra.esAdmin();

        contenido.innerHTML = `
            <div class="page-header mb-4">
                <div>
                    <h1 class="page-title">Panel de Gestión</h1>
                    <p class="muted-text mb-0">
                        Bienvenido/a, ${window.Siandra.escapar(nombre)}.
                    </p>
                </div>

                <span class="status-note">
                    <i class="bi bi-shield-check"></i>
                    Sesión autenticada
                </span>
            </div>

            <div class="row g-3 mb-4">
                <div class="col-12 col-sm-6 col-xl-3">
                    <div class="admin-card stat-card">
                        <div class="stat-icon">
                            <i class="bi bi-house"></i>
                        </div>
                        <div class="stat-value" id="totalPropiedades">—</div>
                        <div class="stat-label">Propiedades registradas</div>
                    </div>
                </div>

                <div class="col-12 col-sm-6 col-xl-3">
                    <div class="admin-card stat-card">
                        <div class="stat-icon">
                            <i class="bi bi-file-earmark-check"></i>
                        </div>
                        <div class="stat-value" id="totalContratos">—</div>
                        <div class="stat-label">Contratos activos</div>
                    </div>
                </div>

                <div class="col-12 col-sm-6 col-xl-3">
                    <div class="admin-card stat-card">
                        <div class="stat-icon">
                            <i class="bi bi-calendar-check"></i>
                        </div>
                        <div class="stat-value" id="totalVisitas">—</div>
                        <div class="stat-label">Visitas pendientes</div>
                    </div>
                </div>

                <div class="col-12 col-sm-6 col-xl-3">
                    <div class="admin-card stat-card">
                        <div class="stat-icon">
                            <i class="bi bi-cash-stack"></i>
                        </div>
                        <div class="stat-value" id="totalComisiones">—</div>
                        <div class="stat-label">Comisiones del mes</div>
                    </div>
                </div>
            </div>

            <div class="row g-4">
                <div class="col-12 col-xl-7">
                    <div class="admin-card p-4 h-100">
                        <h2 class="section-heading">Accesos rápidos</h2>

                        <p class="muted-text mb-4">
                            Elegí un módulo para comenzar a trabajar.
                        </p>

                        <div class="row g-3">
                            <div class="col-12 col-md-6">
                                <button
                                    class="btn btn-outline-secondary w-100 p-3 text-start"
                                    data-ir="propiedades"
                                >
                                    <i class="bi bi-houses me-2"></i>
                                    Propiedades
                                    <i class="bi bi-arrow-right float-end"></i>
                                </button>
                            </div>

                            <div class="col-12 col-md-6">
                                <button
                                    class="btn btn-outline-secondary w-100 p-3 text-start"
                                    data-ir="personas"
                                >
                                    <i class="bi bi-people me-2"></i>
                                    Personas y clientes
                                    <i class="bi bi-arrow-right float-end"></i>
                                </button>
                            </div>

                            <div class="col-12 col-md-6">
                                <button
                                    class="btn btn-outline-secondary w-100 p-3 text-start"
                                    data-ir="visitas"
                                >
                                    <i class="bi bi-calendar-week me-2"></i>
                                    Visitas y agenda
                                    <i class="bi bi-arrow-right float-end"></i>
                                </button>
                            </div>

                            <div class="col-12 col-md-6">
                                <button
                                    class="btn btn-outline-secondary w-100 p-3 text-start"
                                    data-ir="contratos"
                                >
                                    <i class="bi bi-file-earmark-text me-2"></i>
                                    Contratos
                                    <i class="bi bi-arrow-right float-end"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-xl-5">
                    <div class="admin-card p-4 h-100">
                        <h2 class="section-heading mb-4">
                            Estado del sistema
                        </h2>

                        <div class="d-flex gap-3 mb-4">
                            <i class="bi bi-check-circle-fill text-success fs-4"></i>
                            <div>
                                <strong>Autenticación</strong>
                                <p class="muted-text mb-0">
                                    Sesión de Supabase verificada.
                                </p>
                            </div>
                        </div>

                        <div class="d-flex gap-3 mb-4">
                            <i class="bi bi-puzzle fs-4 text-warning"></i>
                            <div>
                                <strong>Módulos de gestión</strong>
                                <p class="muted-text mb-0" id="estadoModulos">
                                    Verificando módulos...
                                </p>
                            </div>
                        </div>

                        <div class="d-flex gap-3">
                            <i class="bi bi-person-check fs-4 text-success"></i>
                            <div>
                                <strong>Tipo de usuario</strong>
                                <p class="muted-text mb-0">
                                    ${esAdmin ? 'Administrador' : 'Agente'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        cargarEstadisticas();
        actualizarEstadoModulos();
    }

    async function cargarEstadisticas() {
        const consultas = [
            {
                tabla: 'properties',
                elemento: 'totalPropiedades',
                filtro: true
            },
            {
                tabla: 'contracts',
                elemento: 'totalContratos',
                filtro: false,
                estado: 'Activo'
            },
            {
                tabla: 'visits',
                elemento: 'totalVisitas',
                filtro: false,
                estado: 'Pendiente'
            }
        ];

        for (const consulta of consultas) {
            try {
                let peticion = db
                    .from(consulta.tabla)
                    .select('id', { count: 'exact', head: true });

                if (consulta.filtro) {
                    peticion = peticion.is('archived_at', null);
                }

                if (consulta.estado) {
                    peticion = peticion.eq('status', consulta.estado);
                }

                const { count, error } = await peticion;

                const elemento = document.getElementById(consulta.elemento);
                if (!elemento) continue;

                elemento.textContent = error ? '—' : (count ?? 0);

                if (error) {
                    console.warn(
                        `No se pudo consultar ${consulta.tabla}:`,
                        error.message
                    );
                }
            } catch (error) {
                console.warn(
                    `Error al consultar ${consulta.tabla}:`,
                    error
                );
            }
        }

        // Las comisiones requieren una tabla y una estructura confirmadas.
        const comisiones = document.getElementById('totalComisiones');
        if (comisiones) {
            comisiones.textContent = '—';
        }
    }

    function actualizarEstadoModulos() {
        const elemento = document.getElementById('estadoModulos');
        if (!elemento) return;

        const propiedades = typeof window.SiandraModulos?.propiedades?.render === 'function';
        const personas = typeof window.SiandraModulos?.personas?.render === 'function';

        if (propiedades && personas) {
            elemento.textContent = 'Propiedades y personas disponibles.';
        } else {
            elemento.textContent = 'Algunos módulos todavía están en desarrollo.';
        }
    }

    async function mostrarModulo(nombre) {
        document.querySelectorAll('.nav-module').forEach(boton => {
            boton.classList.toggle(
                'active',
                boton.dataset.module === nombre
            );
        });

        if (breadcrumb) {
            breadcrumb.textContent = nombres[nombre] || nombre;
        }

        sidebar?.classList.remove('show');

        if (nombre === 'inicio') {
            renderInicio();
            return;
        }

        const modulo = window.SiandraModulos?.[nombre];

        if (modulo && typeof modulo.render === 'function') {
            await modulo.render();
        } else {
            contenido.innerHTML = `
                <div class="admin-card p-4">
                    <h2>${window.Siandra.escapar(nombres[nombre] || nombre)}</h2>
                    <p class="muted-text mb-0">
                        Este módulo todavía está en desarrollo.
                    </p>
                </div>
            `;
        }
    }

    document.querySelectorAll('.nav-module').forEach(boton => {
        boton.addEventListener('click', () => {
            mostrarModulo(boton.dataset.module);
        });
    });

    document.addEventListener('click', event => {
        const boton = event.target.closest('[data-ir]');

        if (boton) {
            mostrarModulo(boton.dataset.ir);
        }
    });

    document.getElementById('mobileMenuButton')?.addEventListener('click', event => {
        sidebar?.classList.toggle('show');

        event.currentTarget.setAttribute(
            'aria-expanded',
            sidebar?.classList.contains('show') ? 'true' : 'false'
        );
    });

    document.getElementById('logoutButton')?.addEventListener('click', async () => {
        if (!confirm('¿Querés cerrar la sesión?')) return;

        const { error } = await db.auth.signOut({ scope: 'local' });

        if (error) {
            console.error(error);
            alert('No se pudo cerrar la sesión.');
            return;
        }

        window.location.href = 'login.html';
    });

    try {
        const { data, error } = await db.auth.getSession();

        if (error || !data.session) {
            window.location.href = 'login.html';
            return;
        }

        usuario = data.session.user;

        if (accountEmail) {
            accountEmail.textContent = usuario.email || '';
        }

        const { data: datosPerfil, error: errorPerfil } = await db
            .from('profiles')
            .select('id, full_name, role')
            .eq('id', usuario.id)
            .maybeSingle();

        if (errorPerfil) {
            console.error('No se pudo cargar el perfil:', errorPerfil);
        }

        perfil = datosPerfil || { role: 'agente' };

        window.SiandraModulos = {};

        await cargarScript('propiedades.js');
        await cargarScript('personas.js');
        await cargarScript('visitas.js');
        await cargarScript('contratos.js');
        await cargarScript('finanzas.js');
        await cargarScript('auditoria.js');

        await mostrarModulo('inicio');

    } catch (error) {
        console.error('Error al iniciar el panel:', error);

        contenido.innerHTML = `
            <div class="alert alert-danger">
                No se pudo iniciar el panel. Revisá la consola del navegador.
            </div>
        `;
    }

    db.auth.onAuthStateChange(event => {
        if (event === 'SIGNED_OUT') {
            window.location.href = 'login.html';
        }
    });
}
