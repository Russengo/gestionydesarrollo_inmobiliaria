
(() => {
    const modulo = {
        async render() {
            const app = window.Siandra;
            const db = app.db;
            const contenido = app.contenido;

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

            const escapar = app.escapar;

            function mostrarFecha(valor) {
                if (!valor) return '—';

                const fecha = new Date(valor);

                if (Number.isNaN(fecha.getTime())) return '—';

                return fecha.toLocaleString('es-AR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
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

            function resumenDatos(datos) {
                if (!datos || typeof datos !== 'object') {
                    return 'Sin detalles adicionales';
                }

                const campos = [
                    'title',
                    'property_code',
                    'full_name',
                    'concept',
                    'contract_type',
                    'status',
                    'email',
                    'phone'
                ];

                const encontrados = campos
                    .filter(campo => datos[campo] !== undefined &&
                        datos[campo] !== null &&
                        datos[campo] !== '')
                    .map(campo =>
                        `${campo}: ${String(datos[campo]).slice(0, 100)}`
                    );

                return encontrados.length
                    ? encontrados.join(' · ')
                    : 'Ver detalles';
            }

            function datosLegibles(datos) {
                if (!datos) return 'Sin datos';

                try {
                    return JSON.stringify(datos, null, 2);
                } catch {
                    return 'No se pudieron mostrar los detalles';
                }
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
                        console.error(
                            'Error al cargar auditoría:',
                            error
                        );

                        lista.innerHTML = `
                            <div class="alert alert-danger">
                                No se pudo consultar la auditoría.
                                Verificá que tu usuario tenga el rol de
                                administrador y que las políticas RLS
                                permitan leer estos registros.
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

                    lista.querySelectorAll('.verAuditoria')
                        .forEach(botonDetalle => {
                            botonDetalle.addEventListener('click', () => {
                                const registro = registros.find(
                                    r => r.id === botonDetalle.dataset.id
                                );

                                if (!registro) return;

                                const anterior = datosLegibles(registro.old_data);
                                const nuevo = datosLegibles(registro.new_data);

                                const ventana = window.open(
                                    '',
                                    '_blank',
                                    'width=850,height=700'
                                );

                                if (!ventana) {
                                    alert(
                                        'El navegador bloqueó la ventana. Permití las ventanas emergentes para ver el detalle.'
                                    );
                                    return;
                                }

                                const titulo =
                                    `Auditoría: ${nombreAccion(registro.action)}`;

                                const contenidoDetalle = `
                                    <!DOCTYPE html>
                                    <html lang="es">
                                    <head>
                                        <meta charset="UTF-8">
                                        <meta name="viewport"
                                            content="width=device-width, initial-scale=1">
                                        <title>${escapar(titulo)}</title>
                                        <style>
                                            body {
                                                font-family: Arial, sans-serif;
                                                padding: 24px;
                                                color: #243044;
                                            }
                                            h1 { font-size: 22px; }
                                            h2 { font-size: 17px; margin-top: 24px; }
                                            p { line-height: 1.5; }
                                            pre {
                                                background: #f3f5f7;
                                                padding: 16px;
                                                border-radius: 8px;
                                                overflow: auto;
                                                white-space: pre-wrap;
                                                overflow-wrap: anywhere;
                                            }
                                        </style>
                                    </head>
                                    <body>
                                        <h1>${escapar(titulo)}</h1>
                                        <p><strong>Fecha:</strong>
                                            ${escapar(mostrarFecha(registro.created_at))}</p>
                                        <p><strong>Módulo:</strong>
                                            ${escapar(nombreEntidad(registro.entity_table))}</p>
                                        <p><strong>Usuario:</strong>
                                            ${escapar(registro.user_id || 'No identificado')}</p>
                                        <p><strong>ID del registro:</strong>
                                            ${escapar(registro.record_id || '—')}</p>
                                        <h2>Datos anteriores</h2>
                                        <pre>${escapar(anterior)}</pre>
                                        <h2>Datos nuevos</h2>
                                        <pre>${escapar(nuevo)}</pre>
                                    </body>
                                    </html>
                                `;

                                ventana.document.open();
                                ventana.document.write(contenidoDetalle);
                                ventana.document.close();
                            });
                        });
                } catch (error) {
                    console.error('Error inesperado en auditoría:', error);
                    lista.innerHTML = `
                        <div class="alert alert-danger">
                            Ocurrió un error inesperado al cargar la auditoría.
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
