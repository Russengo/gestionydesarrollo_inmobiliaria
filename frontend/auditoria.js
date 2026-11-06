
(() => {
    const modulo = {
        async render() {
            const app = window.Siandra;
            const db = app.db;
            const contenido = app.contenido;
            const escapar = app.escapar;

            contenido.innerHTML = `
                <div class="page-header mb-4">
                    <div>
                        <h1 class="page-title">Auditoría del sistema</h1>
                        <p class="muted-text mb-0">
                            Historial de operaciones registradas en Siandra.
                        </p>
                    </div>
                </div>

                <div id="auditoriaMensaje"></div>

                <div class="admin-card p-4 mb-4">
                    <div class="row g-3 align-items-end">
                        <div class="col-12 col-md-5">
                            <label for="filtroEntidad" class="form-label">
                                Módulo
                            </label>
                            <select id="filtroEntidad" class="form-select">
                                <option value="">Todos los módulos</option>
                                <option value="properties">Propiedades</option>
                                <option value="people">Personas</option>
                                <option value="visits">Visitas</option>
                                <option value="contracts">Contratos</option>
                                <option value="payments">Pagos</option>
                            </select>
                        </div>

                        <div class="col-12 col-md-5">
                            <label for="filtroAccion" class="form-label">
                                Tipo de operación
                            </label>
                            <select id="filtroAccion" class="form-select">
                                <option value="">Todas las operaciones</option>
                                <option value="INSERT">Creación</option>
                                <option value="UPDATE">Modificación</option>
                                <option value="DELETE">Eliminación</option>
                            </select>
                        </div>

                        <div class="col-12 col-md-2">
                            <button id="actualizarAuditoria"
                                class="btn btn-gold w-100" type="button">
                                <i class="bi bi-arrow-clockwise me-1"></i>
                                Actualizar
                            </button>
                        </div>
                    </div>
                </div>

                <div class="admin-card p-4">
                    <div class="d-flex flex-wrap justify-content-between
                        align-items-center gap-2 mb-3">
                        <h2 class="section-heading mb-0">
                            Registro de actividad
                        </h2>
                        <span id="totalAuditoria"
                            class="muted-text small"></span>
                    </div>

                    <div id="listaAuditoria">
                        <p class="muted-text">Cargando registros...</p>
                    </div>
                </div>
            `;

            function mostrarFecha(valor) {
                if (!valor) return '—';

                const fecha = new Date(valor);

                if (Number.isNaN(fecha.getTime())) return '—';

                return fecha.toLocaleString('es-AR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });
            }

            function nombreAccion(accion) {
                const nombres = {
                    INSERT: 'Creación',
                    UPDATE: 'Modificación',
                    DELETE: 'Eliminación'
                };

                return nombres[accion] || accion || 'Operación';
            }

            function colorAccion(accion) {
                const colores = {
                    INSERT: 'success',
                    UPDATE: 'warning',
                    DELETE: 'danger'
                };

                return colores[accion] || 'secondary';
            }

            function nombreEntidad(entidad) {
                const nombres = {
                    properties: 'Propiedades',
                    people: 'Personas',
                    visits: 'Visitas',
                    contracts: 'Contratos',
                    payments: 'Pagos',
                    profiles: 'Usuarios'
                };

                return nombres[entidad] || entidad || 'Sin especificar';
            }

            function datosLegibles(datos) {
                if (datos === null || datos === undefined) {
                    return 'Sin datos registrados';
                }

                try {
                    return JSON.stringify(datos, null, 2);
                } catch {
                    return 'No se pudieron mostrar los detalles';
                }
            }

            function mostrarDetalle(registro) {
                document.getElementById('modalDetalleAuditoria')?.remove();

                const modal = document.createElement('div');

                modal.id = 'modalDetalleAuditoria';
                modal.innerHTML = `
                    <div class="auditoria-overlay">
                        <div class="auditoria-modal" role="dialog"
                            aria-modal="true"
                            aria-labelledby="tituloDetalleAuditoria">

                            <div class="d-flex justify-content-between
                                align-items-center border-bottom pb-3 mb-3">
                                <div>
                                    <h4 id="tituloDetalleAuditoria"
                                        class="fw-bold mb-1">
                                        Detalle de auditoría
                                    </h4>
                                    <span class="text-muted small">
                                        Información de la operación registrada
                                    </span>
                                </div>

                                <button type="button"
                                    class="btn btn-outline-secondary"
                                    data-cerrar-auditoria
                                    aria-label="Cerrar">
                                    <i class="bi bi-x-lg"></i>
                                </button>
                            </div>

                            <div class="row g-3 mb-4">
                                <div class="col-md-6">
                                    <div class="auditoria-dato">
                                        <small>Operación</small>
                                        <div>
                                            <span class="badge text-bg-${colorAccion(registro.action)}">
                                                ${escapar(nombreAccion(registro.action))}
                                            </span>
                                            <span class="text-muted small ms-1">
                                                ${escapar(registro.action)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div class="col-md-6">
                                    <div class="auditoria-dato">
                                        <small>Fecha y hora</small>
                                        <strong>
                                            ${escapar(mostrarFecha(registro.created_at))}
                                        </strong>
                                    </div>
                                </div>

                                <div class="col-md-6">
                                    <div class="auditoria-dato">
                                        <small>Módulo</small>
                                        <strong>
                                            ${escapar(nombreEntidad(registro.entity_table))}
                                        </strong>
                                    </div>
                                </div>

                                <div class="col-md-6">
                                    <div class="auditoria-dato">
                                        <small>ID del registro afectado</small>
                                        <strong class="text-break">
                                            ${escapar(registro.record_id || 'No disponible')}
                                        </strong>
                                    </div>
                                </div>

                                <div class="col-12">
                                    <div class="auditoria-dato">
                                        <small>Usuario responsable (UUID)</small>
                                        <strong class="text-break">
                                            ${escapar(registro.user_id || 'No identificado')}
                                        </strong>
                                    </div>
                                </div>

                                <div class="col-12">
                                    <div class="auditoria-dato">
                                        <small>ID de auditoría</small>
                                        <strong class="text-break">
                                            ${escapar(registro.id)}
                                        </strong>
                                    </div>
                                </div>
                            </div>

                            <h5 class="fw-bold mb-2">
                                <i class="bi bi-clock-history me-2"></i>
                                Datos anteriores
                            </h5>

                            <pre class="auditoria-json">${escapar(datosLegibles(registro.old_data))}</pre>

                            <h5 class="fw-bold mt-4 mb-2">
                                <i class="bi bi-arrow-repeat me-2"></i>
                                Datos nuevos
                            </h5>

                            <pre class="auditoria-json">${escapar(datosLegibles(registro.new_data))}</pre>

                            <div class="d-flex justify-content-end mt-4">
                                <button type="button"
                                    class="btn btn-dark"
                                    data-cerrar-auditoria>
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                `;

                const estilos = document.createElement('style');

                estilos.textContent = `
                    .auditoria-overlay {
                        position: fixed;
                        inset: 0;
                        z-index: 10000;
                        background: rgba(0, 0, 0, .65);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 20px;
                        overflow-y: auto;
                    }

                    .auditoria-modal {
                        background: #fff;
                        color: #243044;
                        width: 100%;
                        max-width: 850px;
                        max-height: 90vh;
                        overflow-y: auto;
                        border-radius: 12px;
                        padding: 24px;
                        box-shadow: 0 15px 50px rgba(0,0,0,.25);
                    }

                    .auditoria-dato {
                        background: #f5f6f8;
                        padding: 13px;
                        border-radius: 8px;
                        height: 100%;
                    }

                    .auditoria-dato small {
                        display: block;
                        color: #697586;
                        margin-bottom: 6px;
                    }

                    .auditoria-dato strong {
                        font-size: 13px;
                        overflow-wrap: anywhere;
                    }

                    .auditoria-json {
                        background: #f3f5f7;
                        color: #263449;
                        border: 1px solid #e1e5ea;
                        padding: 16px;
                        border-radius: 8px;
                        font-size: 12px;
                        line-height: 1.6;
                        white-space: pre-wrap;
                        overflow-wrap: anywhere;
                        max-height: 350px;
                        overflow: auto;
                        margin: 0;
                    }

                    @media(max-width: 576px) {
                        .auditoria-overlay {
                            padding: 8px;
                        }

                        .auditoria-modal {
                            padding: 16px;
                            max-height: 95vh;
                        }
                    }
                `;

                modal.appendChild(estilos);
                document.body.appendChild(modal);

                function cerrarModal() {
                    modal.remove();
                    document.removeEventListener('keydown', cerrarConEscape);
                }

                function cerrarConEscape(event) {
                    if (event.key === 'Escape') {
                        cerrarModal();
                    }
                }

                modal.querySelectorAll('[data-cerrar-auditoria]')
                    .forEach(boton => {
                        boton.addEventListener('click', cerrarModal);
                    });

                modal.querySelector('.auditoria-overlay')
                    .addEventListener('click', event => {
                        if (event.target.classList.contains('auditoria-overlay')) {
                            cerrarModal();
                        }
                    });

                document.addEventListener('keydown', cerrarConEscape);
            }

            async function cargarAuditoria() {
                const lista = document.getElementById('listaAuditoria');
                const total = document.getElementById('totalAuditoria');
                const entidad = document.getElementById('filtroEntidad').value;
                const accion = document.getElementById('filtroAccion').value;
                const boton = document.getElementById('actualizarAuditoria');

                lista.innerHTML =
                    '<p class="muted-text">Cargando registros...</p>';

                total.textContent = '';
                boton.disabled = true;

                try {
                    let consulta = db
                        .from('audit_logs')
                        .select(`
                            id,
                            user_id,
                            action,
                            entity_table,
                            record_id,
                            old_data,
                            new_data,
                            created_at
                        `)
                        .order('created_at', { ascending: false })
                        .limit(200);

                    if (entidad) {
                        consulta = consulta.eq('entity_table', entidad);
                    }

                    if (accion) {
                        consulta = consulta.eq('action', accion);
                    }

                    const { data, error } = await consulta;

                    if (error) {
                        console.error('Error al cargar auditoría:', error);

                        lista.innerHTML = `
                            <div class="alert alert-danger">
                                No se pudo consultar la auditoría.
                                Verificá los permisos de lectura y las políticas RLS.
                                <br><small>${escapar(error.message)}</small>
                            </div>`;
                        return;
                    }

                    const registros = data || [];

                    total.textContent =
                        `${registros.length} registro(s), máximo 200`;

                    if (registros.length === 0) {
                        lista.innerHTML = `
                            <div class="text-center py-4">
                                <i class="bi bi-journal-text fs-1 text-secondary"></i>
                                <p class="muted-text mt-2 mb-0">
                                    No hay registros para los filtros seleccionados.
                                </p>
                            </div>`;
                        return;
                    }

                    lista.innerHTML = `
                        <div class="table-responsive">
                            <table class="table table-hover align-middle">
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Operación</th>
                                        <th>Módulo</th>
                                        <th>Usuario</th>
                                        <th>Registro</th>
                                        <th>Detalles</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    ${registros.map(registro => `
                                        <tr>
                                            <td class="text-nowrap">
                                                ${escapar(mostrarFecha(registro.created_at))}
                                            </td>

                                            <td>
                                                <span class="badge text-bg-${colorAccion(registro.action)}">
                                                    ${escapar(nombreAccion(registro.action))}
                                                </span>
                                            </td>

                                            <td>
                                                ${escapar(nombreEntidad(registro.entity_table))}
                                            </td>

                                            <td>
                                                <span class="small"
                                                    title="${escapar(registro.user_id || '')}">
                                                    ${escapar(
                                                        registro.user_id
                                                            ? registro.user_id.slice(0, 8) + '…'
                                                            : 'No identificado'
                                                    )}
                                                </span>
                                            </td>

                                            <td>
                                                <span class="small"
                                                    title="${escapar(registro.record_id || '')}">
                                                    ${escapar(
                                                        registro.record_id
                                                            ? registro.record_id.slice(0, 8) + '…'
                                                            : '—'
                                                    )}
                                                </span>
                                            </td>

                                            <td>
                                                <button type="button"
                                                    class="btn btn-outline-secondary btn-sm verAuditoria"
                                                    data-id="${escapar(registro.id)}">
                                                    <i class="bi bi-eye me-1"></i>
                                                    Ver
                                                </button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    `;

                    lista.addEventListener('click', event => {
                        const botonDetalle = event.target.closest('.verAuditoria');

                        if (!botonDetalle) return;

                        const registro = registros.find(
                            r => String(r.id) === String(botonDetalle.dataset.id)
                        );

                        if (registro) {
                            mostrarDetalle(registro);
                        }
                    });

                } catch (error) {
                    console.error('Error inesperado en auditoría:', error);

                    lista.innerHTML = `
                        <div class="alert alert-danger">
                            Ocurrió un error inesperado al cargar la auditoría.
                            <br><small>${escapar(error.message)}</small>
                        </div>`;
                } finally {
                    boton.disabled = false;
                }
            }

            document.getElementById('actualizarAuditoria')
                .addEventListener('click', cargarAuditoria);

            document.getElementById('filtroEntidad')
                .addEventListener('change', cargarAuditoria);

            document.getElementById('filtroAccion')
                .addEventListener('change', cargarAuditoria);

            await cargarAuditoria();
        }
    };

    window.SiandraModulos = window.SiandraModulos || {};
    window.SiandraModulos.auditoria = modulo;
})();
